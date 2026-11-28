/**
 * 서버 판정 게임: 로그인한 사용자의 뽑기·뽑기권·컬렉션은 서버가 기준이다(docs/server-roadmap.md 의 C 단계).
 *
 * 이 모듈은 서버 함수 호출과 "서버 상태 → 앱의 컬렉션" 변환만 맡는다. 화면·Electron 은 밖에서 받는다.
 *   * 뽑기·꾸미기 뽑기·출석·뽑기권 획득은 서버 함수로 보낸다. 서버에 닿지 않으면 뽑기는 하지 않고(안내), 획득은 대기열에 두었다가 다시 보낸다(열쇠가 있어서 두 번 받지 않는다).
 *   * 서버의 뽑기권·천장·가진 동물·꾸미기를 앱의 컬렉션에 덮어쓴다. 동물의 돌봄 상태(배고픔 등)와 이름은 앱에 있는 그대로 둔다.
 */
import fs from 'node:fs';
import path from 'node:path';
import type { RpcResult } from './account-sync.js';
import { DUPLICATE_XP, newOwned, type Collection } from '../shared/collection.js';
import { isAccessory, isEffect, isNeck, isProp, isSpeciesId, isVariant, rarityOf } from '../shared/species.js';
import { PITY_RESETS_ON, isRarity, type Rarity } from '../shared/rarity.js';
import { cosmeticTradable } from '../shared/cosmetics.js';

export interface ServerRpc {
  call<T>(fn: string, args?: Record<string, unknown>): Promise<RpcResult<T>>;
  select<T>(table: string, columns: string): Promise<RpcResult<T[]>>;
  /** 서버 쪽 Edge Function 을 부른다(로그인한 사용자의 JWT 가 자동으로 붙는다). */
  invoke?<T>(name: string): Promise<RpcResult<T>>;
}

/** 친구 목록 한 줄(friends_list). status: friend=친구, incoming=받은 요청, outgoing=보낸 요청 */
export interface FriendRow {
  friendship_id: string;
  friend_id: string;
  login: string;
  avatar_url: string | null;
  status: 'friend' | 'incoming' | 'outgoing';
  xp: number;
  level: number;
  next_xp: number;
  since: string;
  waved_today: boolean;
  they_waved_today: boolean;
  species_id: string | null;
  pet_xp: number | null;
  /** 함께 데리고 다닌 시간(시간 단위). 서버가 오래된 버전이면 없다. */
  companion_hours?: number;
}

/** 인사/선물 결과 */
export interface FriendActionResult {
  granted: number;
  level: number;
  leveled_up?: boolean;
  tickets_each?: number;
  mutual?: boolean;
  tickets?: number;
}

/** 경매장에서 팔린 내 꾸미기 한 건(my_cosmetic_sales) */
export interface CompanionInfo {
  friendship_id: string;
  friend_id: string;
  login: string;
  species_id: string;
  pet_xp: number;
  friend_level: number;
  /** 친구가 정한 꾸밈(서버가 걸러 둔 값: variant·accessory·neck·effect) */
  extras?: Record<string, unknown> | null;
}
export interface CompanionTick {
  granted: boolean;
  pet_xp: number;
  friendship_xp?: number;
  level?: number;
  leveled_up?: boolean;
  reason?: string;
}

export interface FriendHighlight {
  login: string;
  kind: string;
  item_id: string;
  rarity: string;
  at: string;
}

export type MissionKind = 'pet' | 'care' | 'learn' | 'social';
/** 오늘의 일일 미션 현황(서버가 알려 준다) */
export interface MissionState {
  pet: number;
  care: number;
  learn: number;
  social: number;
  goals: Record<MissionKind, number>;
  completed: boolean;
  /** 연속으로 모두 채운 날 수 */
  streak: number;
  /** 이번 보고로 받은 뽑기권(없으면 0) */
  reward: number;
}

export interface CosmeticSaleRow {
  listing_id: string;
  price: number;
  kind: 'accessory' | 'variant' | 'neck' | 'effect' | 'prop';
  item_id: string;
  buyer_login: string;
  sold_at: string;
}
/** 친구에게 받은 꾸미기 선물 한 건(cosmetic_gifts_received) */
export interface CosmeticGiftRow {
  kind: 'accessory' | 'variant' | 'neck' | 'effect' | 'prop';
  item_id: string;
  from_login: string;
  created_at: string;
}

/** 경매장에서 팔린 내 펫 한 건(my_sales) */
export interface SaleRow {
  listing_id: string;
  price: number;
  species_id: string;
  species_name: string;
  level: number;
  buyer_login: string;
  sold_at: string;
}

export interface ServerState {
  tickets: number;
  /** 게임머니(경매장에서 쓰는 재화) */
  coins: number;
  /** 이 계정이 로컬 진행을 이미 서버로 가져왔는가(가져온 뒤에는 서버가 가진 동물이 기준이다) */
  imported: boolean;
  pity: number;
  equippedSpecies: string | null;
  /** 가진 동물 종 → 가장 경험치가 높은 개체의 경험치 */
  species: Record<string, number>;
  accessories: string[];
  variants: string[];
  /** 뽑기로 얻은 목 장식과 효과(서버가 알려 준다) */
  necks?: string[];
  effects?: string[];
  props?: string[];
}

export interface Grant {
  kind: 'uptime' | 'care' | 'level' | 'gift' | 'update';
  amount: number;
  key: string;
}

export interface PullResult {
  speciesId: string;
  rarity: string;
  tickets: number;
}
export interface CosmeticResult {
  kind: 'accessory' | 'variant' | 'neck' | 'effect' | 'prop';
  itemId: string;
  /** 서버가 알려 준 등급(없으면 앱의 표로 안다) */
  rarity?: string;
  tickets: number;
}

const MAX_PENDING = 100;

/** 서버 오류 코드를 사용자에게 보일 문구로 바꾼다. */
export function friendlyError(message: string): string {
  if (/client_outdated/.test(message)) return '앱이 오래돼서 뽑을 수 없어요. 새 버전으로 업데이트해 주세요 (뽑기권은 그대로예요)';
  if (/insufficient_tickets/.test(message)) return '뽑기권이 모자라요';
  if (/not_configured/.test(message)) return '아직 GitHub 연동이 준비되지 않았어요';
  if (/github_unavailable/.test(message)) return 'GitHub 에서 기여 수를 읽지 못했어요. 잠시 뒤에 다시 시도해요';
  if (/all_collected/.test(message)) return '꾸미기를 모두 모았어요!';
  if (/insufficient_coins/.test(message)) return '게임머니가 모자라요';
  if (/last_pet/.test(message)) return '마지막 한 마리는 팔 수 없어요';
  if (/already_listed/.test(message)) return '이미 경매장에 올라가 있어요';
  if (/listing_unavailable/.test(message)) return '이미 팔렸거나 내려간 펫이에요';
  if (/own_listing/.test(message)) return '내가 올린 펫은 살 수 없어요';
  if (/invalid_price/.test(message)) return '가격은 1~1,000,000 사이의 정수로 써 주세요';
  if (/not_your_pet/.test(message)) return '내 펫이 아니에요';
  if (/already_friends/.test(message)) return '이미 친구예요';
  if (/already_requested/.test(message)) return '이미 친구 요청을 보냈어요';
  if (/already_waved/.test(message)) return '오늘은 이미 인사했어요';
  if (/already_gifted/.test(message)) return '오늘은 이 친구에게 이미 선물했어요';
  if (/gift_limit/.test(message)) return '하루에 세 번까지만 선물할 수 있어요';
  if (/too_many/.test(message)) return '친구 요청이 너무 많아요. 몇 개를 정리해 주세요';
  if (/self/.test(message)) return '내 계정에는 요청할 수 없어요';
  if (/not_found/.test(message)) return '그 GitHub 아이디의 사용자를 찾지 못했어요 (이 앱에 로그인한 적이 있어야 해요)';
  if (/not_tradable/.test(message)) return '업적으로도 열 수 있는 꾸미기는 팔거나 선물할 수 없어요';
  if (/not_yours/.test(message)) return '내가 가진 꾸미기가 아니에요';
  if (/already_owned/.test(message)) return '이미 가진 꾸미기예요';
  if (/not_authenticated/.test(message)) return '로그인이 끝나지 않았어요';
  if (/fetch failed|network|timeout|ENOTFOUND|ECONN|Failed to fetch/i.test(message)) return '서버에 연결하지 못했어요. 인터넷을 확인하고 다시 해 주세요';
  return '서버에서 처리하지 못했어요: ' + message.slice(0, 80);
}

const isNetwork = (message: string): boolean => /fetch failed|network|timeout|ENOTFOUND|ECONN|Failed to fetch/i.test(message);

export class ServerGame {
  state: ServerState | null = null;
  private pending: Grant[];

  constructor(
    private readonly rpc: ServerRpc,
    private readonly dir: string,
    /** 서버에 알리는 앱 버전(서버가 최소 버전보다 낮으면 뽑기를 거절한다) */
    private readonly clientVersion = '',
  ) {
    this.pending = this.loadPending();
  }

  get ready(): boolean {
    return this.state !== null;
  }

  private get pendingFile(): string {
    return path.join(this.dir, 'pending-grants.json');
  }
  private loadPending(): Grant[] {
    try {
      const v = JSON.parse(fs.readFileSync(this.pendingFile, 'utf8')) as unknown;
      return Array.isArray(v) ? (v as Grant[]).filter((g) => g && typeof g.kind === 'string' && Number.isInteger(g.amount) && typeof g.key === 'string').slice(0, MAX_PENDING) : [];
    } catch {
      return [];
    }
  }
  private savePending(): void {
    fs.mkdirSync(this.dir, { recursive: true });
    const tmp = this.pendingFile + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(this.pending));
    fs.renameSync(tmp, this.pendingFile);
  }
  get pendingCount(): number {
    return this.pending.length;
  }

  /** 로그인 직후: 기존 로컬 진행을 한 번 가져오고(서버가 이미 했으면 무시) 서버 상태를 읽는다. */
  async activate(): Promise<{ ok: boolean; message?: string }> {
    const imp = await this.rpc.call<{ imported: boolean; reason?: string }>('import_local_collection');
    if (imp.error && isNetwork(imp.error.message)) return { ok: false, message: friendlyError(imp.error.message) };
    const r = await this.refresh();
    if (r.ok) void this.flushPending();
    return r;
  }

  deactivate(): void {
    this.state = null;
  }

  /** 서버의 내 상태를 읽는다. */
  async refresh(): Promise<{ ok: boolean; message?: string }> {
    const [profile, pets, cos, imp] = await Promise.all([
      this.rpc.select<{ tickets: number; coins: number; pity: number; equipped_pet_id: string | null }>('profiles', 'tickets, coins, pity, equipped_pet_id'),
      this.rpc.select<{ id: string; species_id: string; xp: number }>('pets', 'id, species_id, xp'),
      this.rpc.select<{ kind: string; item_id: string }>('cosmetics', 'kind, item_id'),
      this.rpc.select<{ user_id: string }>('account_imports', 'user_id'),
    ]);
    const err = profile.error ?? pets.error ?? cos.error;
    const p = profile.data?.[0];
    if (err || !p) return { ok: false, message: friendlyError(err?.message ?? '프로필을 찾지 못했어요') };
    const species: Record<string, number> = {};
    for (const pet of pets.data ?? []) species[pet.species_id] = Math.max(species[pet.species_id] ?? 0, pet.xp);
    const equipped = (pets.data ?? []).find((x) => x.id === p.equipped_pet_id)?.species_id ?? null;
    this.state = {
      tickets: p.tickets,
      coins: p.coins,
      imported: (imp.data ?? []).length > 0,
      pity: p.pity,
      equippedSpecies: equipped,
      species,
      accessories: (cos.data ?? []).filter((c) => c.kind === 'accessory').map((c) => c.item_id),
      variants: (cos.data ?? []).filter((c) => c.kind === 'variant').map((c) => c.item_id),
      necks: (cos.data ?? []).filter((c) => c.kind === 'neck').map((c) => c.item_id),
      effects: (cos.data ?? []).filter((c) => c.kind === 'effect').map((c) => c.item_id),
      props: (cos.data ?? []).filter((c) => c.kind === 'prop').map((c) => c.item_id),
    };
    return { ok: true };
  }

  async pullSpecies(): Promise<{ ok: true; result: PullResult } | { ok: false; message: string }> {
    const r = await this.rpc.call<{ species_id: string; rarity: string; tickets: number }>('gacha_pull', { p_client_version: this.clientVersion });
    if (r.error || !r.data) return { ok: false, message: friendlyError(r.error?.message ?? '') };
    if (this.state) {
      this.state = { ...this.state, tickets: r.data.tickets, pity: isRarity(r.data.rarity) && PITY_RESETS_ON.includes(r.data.rarity) ? 0 : this.state.pity + 1, species: { ...this.state.species, [r.data.species_id]: this.state.species[r.data.species_id] ?? 0 } };
    }
    return { ok: true, result: { speciesId: r.data.species_id, rarity: r.data.rarity, tickets: r.data.tickets } };
  }

  async pullCosmetic(): Promise<{ ok: true; result: CosmeticResult } | { ok: false; message: string }> {
    const r = await this.rpc.call<{ kind: 'accessory' | 'variant' | 'neck' | 'effect' | 'prop'; item_id: string; rarity?: string; tickets: number }>('gacha_cosmetic', { p_client_version: this.clientVersion });
    if (r.error || !r.data) return { ok: false, message: friendlyError(r.error?.message ?? '') };
    if (this.state) {
      const s = this.state;
      this.state = {
        ...s,
        tickets: r.data.tickets,
        accessories: r.data.kind === 'accessory' ? [...s.accessories, r.data.item_id] : s.accessories,
        variants: r.data.kind === 'variant' ? [...s.variants, r.data.item_id] : s.variants,
        necks: r.data.kind === 'neck' ? [...(s.necks ?? []), r.data.item_id] : s.necks,
        effects: r.data.kind === 'effect' ? [...(s.effects ?? []), r.data.item_id] : s.effects,
        props: r.data.kind === 'prop' ? [...(s.props ?? []), r.data.item_id] : s.props,
      };
    }
    return { ok: true, result: { kind: r.data.kind, itemId: r.data.item_id, ...(r.data.rarity ? { rarity: r.data.rarity } : {}), tickets: r.data.tickets } };
  }

  /** 출석 뽑기권(하루 1장). */
  async claimDaily(): Promise<{ granted: number; tickets: number } | null> {
    const r = await this.rpc.call<{ granted: number; tickets: number }>('claim_daily_ticket');
    if (r.error || !r.data) return null;
    if (this.state) this.state = { ...this.state, tickets: r.data.tickets };
    return r.data;
  }

  /**
   * 뽑기권 획득을 서버에 보낸다. 서버에 닿지 않으면 대기열에 두었다가 flushPending 에서 다시 보낸다.
   * 서버가 거절하거나 상한으로 0장이면 그대로 끝난다(대기열에 두지 않는다).
   */
  async grant(g: Grant): Promise<{ granted: number; tickets: number } | null> {
    const r = await this.rpc.call<{ granted: number; tickets: number }>('grant_tickets', { p_kind: g.kind, p_amount: g.amount, p_key: g.key });
    if (r.error) {
      if (isNetwork(r.error.message) && !this.pending.some((p) => p.kind === g.kind && p.key === g.key) && this.pending.length < MAX_PENDING) {
        this.pending.push(g);
        this.savePending();
      }
      return null;
    }
    if (!r.data) return null;
    if (this.state) this.state = { ...this.state, tickets: r.data.tickets };
    return r.data;
  }

  /** 게임머니 획득(돌봄·업적). 양과 하루 상한은 서버가 정한다. 연결이 없으면 그냥 건너뛴다(작은 값이라 대기열을 두지 않는다). */
  async grantCoins(kind: 'care' | 'achievement', key: string): Promise<{ granted: number; coins: number } | null> {
    const r = await this.rpc.call<{ granted: number; coins: number }>('grant_coins', { p_kind: kind, p_key: key });
    if (r.error || !r.data) return null;
    if (this.state) this.state = { ...this.state, coins: r.data.coins };
    return r.data;
  }

  /** GitHub 기여 수를 서버가 읽어 게임머니로 바꾼다(기여 1건 = 2, 하루 40). 서버가 준비되지 않았거나 닿지 않으면 null. */
  async syncCommits(): Promise<{ granted: number; coins: number } | null> {
    if (!this.rpc.invoke) return null;
    const r = await this.rpc.invoke<{ granted: number; coins: number }>('commits');
    if (r.error) console.error('GitHub 기여 동기화 실패', r.error.message);
    if (r.error || !r.data || typeof r.data.granted !== 'number') return null;
    if (this.state) this.state = { ...this.state, coins: r.data.coins };
    return r.data;
  }

  /** 프로필 카드에 그릴 "보여 주기용" 값(색·장식·이름·연속일 등)을 서버에 올린다. 서버가 허용 목록·범위로 다시 거른다. */
  async pushCardExtras(extras: Record<string, unknown>): Promise<boolean> {
    const r = await this.rpc.call<null>('set_card_extras', { p_extras: extras });
    return !r.error;
  }

  /** 친구 목록(친구·받은 요청·보낸 요청). 서버에 닿지 않으면 null. */
  async friends(): Promise<FriendRow[] | null> {
    const r = await this.rpc.call<FriendRow[]>('friends_list', {});
    return r.error || !Array.isArray(r.data) ? null : r.data;
  }

  async friendRequest(login: string): Promise<{ ok: boolean; message: string; status?: string }> {
    const r = await this.rpc.call<{ status: string }>('friend_request', { p_login: login.trim().replace(/^@/, '') });
    if (r.error) return { ok: false, message: friendlyError(r.error.message) };
    return { ok: true, message: r.data?.status === 'friend' ? '서로 요청해서 바로 친구가 되었어요!' : '친구 요청을 보냈어요', status: r.data?.status };
  }

  async friendRespond(id: string, accept: boolean): Promise<{ ok: boolean; message: string }> {
    const r = await this.rpc.call<null>('friend_respond', { p_friendship: id, p_accept: accept });
    return r.error ? { ok: false, message: friendlyError(r.error.message) } : { ok: true, message: accept ? '친구가 되었어요!' : '요청을 거절했어요' };
  }

  async friendRemove(id: string): Promise<{ ok: boolean; message: string }> {
    const r = await this.rpc.call<null>('friend_remove', { p_friendship: id });
    return r.error ? { ok: false, message: friendlyError(r.error.message) } : { ok: true, message: '친구 목록에서 지웠어요' };
  }

  async friendWave(id: string): Promise<{ ok: boolean; message: string; result?: FriendActionResult }> {
    const r = await this.rpc.call<FriendActionResult>('friend_wave', { p_friendship: id });
    if (r.error || !r.data) return { ok: false, message: friendlyError(r.error?.message ?? '') };
    return { ok: true, message: '', result: r.data };
  }

  async friendGift(id: string): Promise<{ ok: boolean; message: string; result?: FriendActionResult }> {
    const r = await this.rpc.call<FriendActionResult>('friend_gift_ticket', { p_friendship: id });
    if (r.error || !r.data) return { ok: false, message: friendlyError(r.error?.message ?? '') };
    if (this.state && typeof r.data.tickets === 'number') this.state = { ...this.state, tickets: r.data.tickets };
    return { ok: true, message: '', result: r.data };
  }

  /** 내가 올렸다가 since 이후에 팔린 펫들(팔린 순). 서버에 닿지 않으면 null. */
  async mySales(since: string): Promise<SaleRow[] | null> {
    const r = await this.rpc.call<SaleRow[]>('my_sales', { p_since: since });
    return r.error || !Array.isArray(r.data) ? null : r.data;
  }

  async cosmeticSales(since: string): Promise<CosmeticSaleRow[] | null> {
    const r = await this.rpc.call<CosmeticSaleRow[]>('my_cosmetic_sales', { p_since: since });
    return r.error || !Array.isArray(r.data) ? null : r.data;
  }

  async cosmeticGifts(since: string): Promise<CosmeticGiftRow[] | null> {
    const r = await this.rpc.call<CosmeticGiftRow[]>('cosmetic_gifts_received', { p_since: since });
    return r.error || !Array.isArray(r.data) ? null : r.data;
  }

  async friendGiftCosmetic(id: string, kind: string, item: string): Promise<{ ok: boolean; message: string; result?: FriendActionResult }> {
    const r = await this.rpc.call<FriendActionResult>('friend_gift_cosmetic', { p_friendship: id, p_kind: kind, p_item: item });
    if (r.error || !r.data) return { ok: false, message: friendlyError(r.error?.message ?? '') };
    return { ok: true, message: '', result: r.data };
  }

  /** since 이후 친구가 얻은 전설·히든(최근 순, 최대 10개). */
  async friendHighlights(since: string): Promise<FriendHighlight[] | null> {
    const r = await this.rpc.call<FriendHighlight[]>('friend_highlights', { p_since: since });
    return r.error || !Array.isArray(r.data) ? null : r.data;
  }

  /** 오늘의 일일 미션 현황. */
  async missionState(): Promise<MissionState | null> {
    const r = await this.rpc.call<MissionState>('mission_state');
    return r.error || !r.data ? null : r.data;
  }

  /** 일일 미션 진행을 한 번 올린다. 모두 채우면 서버가 뽑기권을 준다. */
  async missionReport(kind: MissionKind): Promise<MissionState | null> {
    const r = await this.rpc.call<MissionState>('mission_report', { p_kind: kind });
    return r.error || !r.data ? null : r.data;
  }

  /** 데리고 다닐 친구를 고른다(null 이면 그만둔다). */
  async setCompanion(friendshipId: string | null): Promise<{ ok: boolean; message: string }> {
    const r = await this.rpc.call<null>('set_companion', { p_friendship: friendshipId });
    return r.error ? { ok: false, message: friendlyError(r.error.message ?? '') } : { ok: true, message: '' };
  }

  /** 지금 데리고 다니는 친구와 그 친구의 대표 펫(없으면 null). */
  async companionCurrent(): Promise<CompanionInfo | null> {
    const r = await this.rpc.call<CompanionInfo[]>('companion_current');
    return r.error || !Array.isArray(r.data) ? null : (r.data[0] ?? null);
  }

  /** 한 시간에 한 번 부르는 동행 보너스. 서버가 정한 양만 돌려준다. */
  async companionTick(): Promise<CompanionTick | null> {
    const r = await this.rpc.call<CompanionTick>('companion_tick');
    return r.error || !r.data ? null : r.data;
  }

  /** 친구가 나를 데리고 다닌 덕에 쌓인 내 펫 경험치를 가져간다. */
  async companionClaim(): Promise<number> {
    const r = await this.rpc.call<number>('companion_claim');
    return r.error || typeof r.data !== 'number' ? 0 : r.data;
  }

  /** 학습 이벤트(배움 카드 확인·고침·지식 읽기)를 서버에 보고한다. 게임머니는 서버가 정한 양만큼 받는다. */
  async reportLearning(events: Array<{ id: string; kind: 'confirm' | 'quiz_bonus' | 'fixed' | 'tip' }>): Promise<{ granted: number; coins: number } | null> {
    if (events.length === 0) return null;
    const r = await this.rpc.call<{ granted: number; coins: number }>('report_learning', { p_events: events });
    if (r.error || !r.data) return null;
    if (this.state) this.state = { ...this.state, coins: r.data.coins };
    return r.data;
  }

  /** 대기 중이던 획득을 다시 보낸다. 합쳐서 얼마가 들어왔는지 돌려준다. */
  async flushPending(): Promise<{ granted: number; tickets: number | null }> {
    let granted = 0;
    let tickets: number | null = null;
    const queue = [...this.pending];
    for (const g of queue) {
      const r = await this.rpc.call<{ granted: number; tickets: number }>('grant_tickets', { p_kind: g.kind, p_amount: g.amount, p_key: g.key });
      if (r.error && isNetwork(r.error.message)) break; // 아직 연결이 안 된다: 남겨 둔다
      this.pending = this.pending.filter((p) => !(p.kind === g.kind && p.key === g.key));
      if (!r.error && r.data) {
        granted += r.data.granted;
        tickets = r.data.tickets;
        if (this.state) this.state = { ...this.state, tickets: r.data.tickets };
      }
    }
    this.savePending();
    return { granted, tickets };
  }
}

// ---------- 서버 상태 → 앱의 컬렉션 ----------

/**
 * 서버의 뽑기권·천장·가진 동물·꾸미기를 앱의 컬렉션에 덮어쓴다.
 * 가진 동물은 합집합이다(서버에 없는 로컬 동물을 지우지 않는다). 돌봄 상태·이름·지금 키우는 동물은 앱 것을 그대로 둔다.
 */
export function mirrorCollection(c: Collection, s: ServerState, now: number): Collection {
  const owned = { ...c.owned };
  for (const [id, xp] of Object.entries(s.species)) {
    if (!isSpeciesId(id)) continue;
    const have = owned[id];
    if (!have) owned[id] = newOwned(id, now, xp);
    else if (xp > have.pet.xp) owned[id] = { ...have, pet: { ...have.pet, xp } };
  }
  // 이미 서버로 가져온 계정은 서버가 가진 동물이 기준이다(경매장에서 판 동물은 사라지고 산 동물이 생긴다).
  // 서버에 동물이 하나도 없으면(이상한 상태) 지우지 않는다.
  let active = c.active;
  if (s.imported && Object.keys(s.species).length > 0) {
    for (const id of Object.keys(owned)) if (!(id in s.species)) delete owned[id as keyof typeof owned];
    if (!owned[active]) {
      const next = s.equippedSpecies && isSpeciesId(s.equippedSpecies) && owned[s.equippedSpecies] ? s.equippedSpecies : (Object.keys(owned)[0] as typeof active | undefined);
      if (next) active = next;
    }
  }
  // 거래·선물로 넘겨준 꾸미기(팔 수 있는 25종)는 서버에 없으면 지운다. 업적으로 연 것은 앱이 따로 알아서 남긴다.
  const kept = <T extends string>(kind: 'accessory' | 'variant' | 'neck' | 'effect' | 'prop', local: readonly T[], server: readonly string[]): T[] =>
    s.imported ? local.filter((id) => !cosmeticTradable(kind, id) || server.includes(id)) : [...local];
  const accessories = [...new Set([...kept('accessory', c.accessories, s.accessories), ...s.accessories.filter(isAccessory)])];
  const variants = [...new Set([...kept('variant', c.variants, s.variants), ...s.variants.filter(isVariant)])];
  const necks = [...new Set([...kept('neck', c.necks, s.necks ?? []), ...(s.necks ?? []).filter(isNeck)])];
  const effects = [...new Set([...kept('effect', c.effects, s.effects ?? []), ...(s.effects ?? []).filter(isEffect)])];
  const props = [...new Set([...kept('prop', c.props, s.props ?? []), ...(s.props ?? []).filter(isProp)])];
  return { ...c, owned, active, tickets: s.tickets, sinceHidden: s.pity, accessories, variants, necks, effects, props };
}

/** 서버 뽑기 결과를 앱의 컬렉션에 반영한다(앱의 pullSpecies 와 같은 화면 규칙: 처음이면 새로, 중복이면 횟수와 경험치). */
export function applyServerPull(c: Collection, r: PullResult, now: number): { collection: Collection; isNew: boolean; count: number; hidden: boolean; rarity: Rarity } | null {
  if (!isSpeciesId(r.speciesId)) return null;
  const rarity: Rarity = isRarity(r.rarity) ? r.rarity : rarityOf(r.speciesId);
  const hidden = rarity === 'hidden';
  const base: Collection = { ...c, tickets: r.tickets, pulls: c.pulls + 1, sinceHidden: PITY_RESETS_ON.includes(rarity) ? 0 : c.sinceHidden + 1 };
  const have = base.owned[r.speciesId];
  if (!have) {
    return { collection: { ...base, owned: { ...base.owned, [r.speciesId]: newOwned(r.speciesId, now) } }, isNew: true, count: 1, hidden, rarity };
  }
  const grown = { ...have, count: have.count + 1, pet: { ...have.pet, xp: have.pet.xp + DUPLICATE_XP } };
  return { collection: { ...base, owned: { ...base.owned, [r.speciesId]: grown } }, isNew: false, count: grown.count, hidden, rarity };
}

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
import { isAccessory, isSpeciesId, isVariant } from '../shared/species.js';

export interface ServerRpc {
  call<T>(fn: string, args?: Record<string, unknown>): Promise<RpcResult<T>>;
  select<T>(table: string, columns: string): Promise<RpcResult<T[]>>;
  /** 서버 쪽 Edge Function 을 부른다(로그인한 사용자의 JWT 가 자동으로 붙는다). */
  invoke?<T>(name: string): Promise<RpcResult<T>>;
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
  kind: 'accessory' | 'variant';
  itemId: string;
  tickets: number;
}

const MAX_PENDING = 100;

/** 서버 오류 코드를 사용자에게 보일 문구로 바꾼다. */
export function friendlyError(message: string): string {
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
    };
    return { ok: true };
  }

  async pullSpecies(): Promise<{ ok: true; result: PullResult } | { ok: false; message: string }> {
    const r = await this.rpc.call<{ species_id: string; rarity: string; tickets: number }>('gacha_pull');
    if (r.error || !r.data) return { ok: false, message: friendlyError(r.error?.message ?? '') };
    if (this.state) {
      this.state = { ...this.state, tickets: r.data.tickets, pity: r.data.rarity === 'hidden' ? 0 : this.state.pity + 1, species: { ...this.state.species, [r.data.species_id]: this.state.species[r.data.species_id] ?? 0 } };
    }
    return { ok: true, result: { speciesId: r.data.species_id, rarity: r.data.rarity, tickets: r.data.tickets } };
  }

  async pullCosmetic(): Promise<{ ok: true; result: CosmeticResult } | { ok: false; message: string }> {
    const r = await this.rpc.call<{ kind: 'accessory' | 'variant'; item_id: string; tickets: number }>('gacha_cosmetic');
    if (r.error || !r.data) return { ok: false, message: friendlyError(r.error?.message ?? '') };
    if (this.state) {
      const s = this.state;
      this.state = {
        ...s,
        tickets: r.data.tickets,
        accessories: r.data.kind === 'accessory' ? [...s.accessories, r.data.item_id] : s.accessories,
        variants: r.data.kind === 'variant' ? [...s.variants, r.data.item_id] : s.variants,
      };
    }
    return { ok: true, result: { kind: r.data.kind, itemId: r.data.item_id, tickets: r.data.tickets } };
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

  /** 내가 올렸다가 since 이후에 팔린 펫들(팔린 순). 서버에 닿지 않으면 null. */
  async mySales(since: string): Promise<SaleRow[] | null> {
    const r = await this.rpc.call<SaleRow[]>('my_sales', { p_since: since });
    return r.error || !Array.isArray(r.data) ? null : r.data;
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
  const accessories = [...new Set([...c.accessories, ...s.accessories.filter(isAccessory)])];
  const variants = [...new Set([...c.variants, ...s.variants.filter(isVariant)])];
  return { ...c, owned, active, tickets: s.tickets, sinceHidden: s.pity, accessories, variants };
}

/** 서버 뽑기 결과를 앱의 컬렉션에 반영한다(앱의 pullSpecies 와 같은 화면 규칙: 처음이면 새로, 중복이면 횟수와 경험치). */
export function applyServerPull(c: Collection, r: PullResult, now: number): { collection: Collection; isNew: boolean; count: number; hidden: boolean } | null {
  if (!isSpeciesId(r.speciesId)) return null;
  const hidden = r.rarity === 'hidden';
  const base: Collection = { ...c, tickets: r.tickets, pulls: c.pulls + 1, sinceHidden: hidden ? 0 : c.sinceHidden + 1 };
  const have = base.owned[r.speciesId];
  if (!have) {
    return { collection: { ...base, owned: { ...base.owned, [r.speciesId]: newOwned(r.speciesId, now) } }, isNew: true, count: 1, hidden };
  }
  const grown = { ...have, count: have.count + 1, pet: { ...have.pet, xp: have.pet.xp + DUPLICATE_XP } };
  return { collection: { ...base, owned: { ...base.owned, [r.speciesId]: grown } }, isNew: false, count: grown.count, hidden };
}

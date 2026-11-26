/**
 * 컬렉션과 뽑기: 가진 동물 목록, 뽑기 재화(뽑기권), 뽑기 규칙, 레벨·출석·돌봄 보상.
 *
 * 동물은 뽑기로만 얻는다(꾸미기 장식과 색은 업적으로도 얻고 뽑기로도 얻는다). 가진 동물은 여러 마리여도 한 마리만 꺼내서 키운다.
 * 동물마다 상태(경험치·배고픔·기분·청결)·이름·중복으로 뽑은 횟수를 따로 저장한다. 꺼내 두지 않은 동물은 시간이 멈춘다.
 *
 * 순수 함수라서 시계·파일·난수를 밖에서 받아 테스트한다. 저장은 main/collection-store.ts 가 맡는다.
 */
import type { Accessory, SpeciesId, Variant } from './species.js';
import { COMMON_SPECIES, HIDDEN_SPECIES, SPECIES, isSpeciesId } from './species.js';
import { HATCH_XP, createPet, levelOf, stageOf, type PetState, type Stage } from './pet.js';
import { sanitizePetName } from './settings.js';

// ---- 규칙 값 ----

/** 뽑기 한 번에 드는 뽑기권 */
export const COST = { species: 3, cosmetic: 2 } as const;
/** 처음 시작하거나 예전 버전에서 올라온 사용자에게 주는 뽑기권(바로 한 번 뽑아 볼 수 있게) */
export const WELCOME_TICKETS = 3;
/** 하루에 한 번(앱을 켜면) 받는 출석 뽑기권 */
export const DAILY_TICKETS = 1;
/** 쓰다듬기·밥·놀기·씻기·산책을 이만큼 하면 뽑기권 1장 */
export const CARE_PER_TICKET = 25;
/** 이미 가진 동물이 또 나오면 그 동물이 받는 경험치 */
export const DUPLICATE_XP = 30;
/** 히든 동물 한 종이 나올 확률(%). 6종이라 합쳐서 6%이고, 나머지 94%를 일반 동물 9종이 똑같이 나눠 갖는다. */
export const HIDDEN_PERCENT_EACH = 1;
/** 히든이 안 나온 채로 이만큼 뽑으면 다음 뽑기는 히든이 나온다(천장) */
export const HIDDEN_PITY = 40;
/** 뽑아서 얻은 동물이 처음 가지는 경험치(바로 새끼로 나온다) */
export const PULLED_START_XP = HATCH_XP;

export const hiddenPercent = (): number => HIDDEN_PERCENT_EACH * HIDDEN_SPECIES.length;
export const commonPercentEach = (): number => (100 - hiddenPercent()) / COMMON_SPECIES.length;

// ---- 자료형 ----

export interface OwnedPet {
  pet: PetState;
  /** 이 동물에게 지어 준 이름(없으면 빈 문자열) */
  name: string;
  /** 같은 동물을 뽑은 횟수(처음 얻은 것까지 센다) */
  count: number;
  obtainedAt: number;
  /** 레벨 보상을 이미 준 가장 높은 레벨(같은 보상을 두 번 주지 않는다) */
  rewardedLevel: number;
}

export interface Collection {
  owned: Partial<Record<SpeciesId, OwnedPet>>;
  /** 지금 꺼내서 키우는 동물 */
  active: SpeciesId;
  tickets: number;
  /** 지금까지 한 동물 뽑기 횟수 */
  pulls: number;
  /** 마지막 히든 이후 뽑은 횟수(천장 계산) */
  sinceHidden: number;
  /** 꾸미기 뽑기로 얻은 장식·색(업적으로 연 것과 합쳐서 쓴다) */
  accessories: Accessory[];
  variants: Variant[];
  /** 마지막으로 출석 보상을 받은 날 'YYYY-MM-DD' */
  lastDaily: string;
  /** 돌봄 보상으로 이미 받은 뽑기권 수 */
  careTicketsGiven: number;
}

// ---- 만들기 ----

export function newOwned(speciesId: SpeciesId, now: number, xp = PULLED_START_XP): OwnedPet {
  const pet = { ...createPet(speciesId, now), xp };
  return { pet, name: '', count: 1, obtainedAt: now, rewardedLevel: levelOf(xp) };
}

/** 처음 시작: 받은(임의의) 동물 하나와 시작 뽑기권. */
export function startCollection(pet: PetState, now: number, name = ''): Collection {
  return {
    owned: { [pet.speciesId]: { pet, name, count: 1, obtainedAt: now, rewardedLevel: levelOf(pet.xp) } },
    active: pet.speciesId,
    tickets: WELCOME_TICKETS,
    pulls: 0,
    sinceHidden: 0,
    accessories: [],
    variants: [],
    lastDaily: '',
    careTicketsGiven: 0,
  };
}

/** 예전 버전(동물을 업적으로 열어 마음대로 바꾸던 때)에서 올라온 사용자가 이미 열어 둔 동물 */
export const LEGACY_SPECIES_UNLOCK: Partial<Record<SpeciesId, string>> = { fox: 'first-confirm', hamster: 'quiz-5', penguin: 'fix-10' };

/** 예전 저장(펫 한 마리 + 업적)을 컬렉션으로 옮긴다. 이미 열었던 동물은 새끼로 함께 넣어 주고 시작 뽑기권을 준다. */
export function migrateCollection(pet: PetState, achievements: Readonly<Record<string, number>>, now: number, name = ''): Collection {
  const c = startCollection(pet, now, name);
  for (const s of SPECIES) {
    const need = LEGACY_SPECIES_UNLOCK[s.id];
    if (need !== undefined && achievements[need] !== undefined && c.owned[s.id] === undefined) c.owned[s.id] = newOwned(s.id, now);
  }
  return c;
}

// ---- 조회 ----

export const ownedIds = (c: Collection): SpeciesId[] => SPECIES.map((s) => s.id).filter((id) => c.owned[id] !== undefined);
export const owns = (c: Collection, id: SpeciesId): boolean => c.owned[id] !== undefined;

// ---- 꺼낸 동물 ----

/** 지금 꺼낸 동물의 상태와 이름을 컬렉션에 반영한다(저장 직전에 부른다). */
export function syncActive(c: Collection, pet: PetState, name: string): Collection {
  const cur = c.owned[c.active];
  if (!cur || cur.pet.speciesId !== pet.speciesId) return c;
  if (cur.pet === pet && cur.name === name) return c;
  return { ...c, owned: { ...c.owned, [c.active]: { ...cur, pet, name } } };
}

/**
 * 다른 동물로 바꿔 꺼낸다. 지금 동물은 상태를 저장해 넣어 두고(시간이 멈춘다), 꺼낸 동물은 지금부터 시간이 흐른다.
 * 가진 동물이 아니면 null.
 */
export function switchActive(c: Collection, id: SpeciesId, current: PetState, currentName: string, now: number): { collection: Collection; pet: PetState; name: string } | null {
  const target = c.owned[id];
  if (!target) return null;
  const saved = syncActive(c, current, currentName);
  if (id === saved.active) return { collection: saved, pet: target.pet, name: target.name };
  const pet = { ...target.pet, lastTickAt: now };
  return { collection: { ...saved, active: id, owned: { ...saved.owned, [id]: { ...target, pet } } }, pet, name: target.name };
}

// ---- 동물 뽑기 ----

/** 어떤 동물이 나올지 정한다. rng 는 0 이상 1 미만. 천장에 닿으면 히든이 나온다. */
export function rollSpecies(rng: () => number, sinceHidden: number): { id: SpeciesId; hidden: boolean } {
  const hidden = HIDDEN_SPECIES;
  const common = COMMON_SPECIES;
  const pity = sinceHidden + 1 >= HIDDEN_PITY;
  const r = rng() * 100;
  if (pity || r < hiddenPercent()) {
    // 천장이면 히든 안에서 다시 고르고, 아니면 r 이 곧 어느 히든인지(각 1%)다.
    const i = pity ? Math.floor(rng() * hidden.length) : Math.floor(r / HIDDEN_PERCENT_EACH);
    return { id: (hidden[Math.min(hidden.length - 1, i)] ?? hidden[0]!).id, hidden: true };
  }
  const i = Math.floor((r - hiddenPercent()) / commonPercentEach());
  return { id: (common[Math.min(common.length - 1, i)] ?? common[0]!).id, hidden: false };
}

export type SpeciesPull =
  | { ok: false; reason: string }
  | { ok: true; id: SpeciesId; hidden: boolean; isNew: boolean; count: number; xpBonus: number };

export function pullSpecies(c: Collection, now: number, rng: () => number): { collection: Collection; result: SpeciesPull } {
  if (c.tickets < COST.species) return { collection: c, result: { ok: false, reason: `뽑기권이 모자라요 (${COST.species}장 필요)` } };
  const roll = rollSpecies(rng, c.sinceHidden);
  const base: Collection = { ...c, tickets: c.tickets - COST.species, pulls: c.pulls + 1, sinceHidden: roll.hidden ? 0 : c.sinceHidden + 1 };
  const have = base.owned[roll.id];
  if (!have) {
    return { collection: { ...base, owned: { ...base.owned, [roll.id]: newOwned(roll.id, now) } }, result: { ok: true, id: roll.id, hidden: roll.hidden, isNew: true, count: 1, xpBonus: 0 } };
  }
  // 이미 가진 동물: 횟수가 늘고 그 동물이 경험치를 받는다(꺼내 둔 동물이면 지금 상태에 더한다).
  const grown: OwnedPet = { ...have, count: have.count + 1, pet: { ...have.pet, xp: have.pet.xp + DUPLICATE_XP } };
  return { collection: { ...base, owned: { ...base.owned, [roll.id]: grown } }, result: { ok: true, id: roll.id, hidden: roll.hidden, isNew: false, count: grown.count, xpBonus: DUPLICATE_XP } };
}

// ---- 꾸미기 뽑기 ----

export type CosmeticItem = { kind: 'accessory'; id: Accessory } | { kind: 'variant'; id: Variant };

export type CosmeticPull = { ok: false; reason: string } | { ok: true; item: CosmeticItem };

/** 아직 못 가진 장식·색 중에서 같은 확률로 하나를 뽑는다. unlocked 는 업적으로 이미 연 것. */
export function pullCosmetic(
  c: Collection,
  all: { accessories: readonly Accessory[]; variants: readonly Variant[] },
  unlocked: { accessories: ReadonlySet<Accessory>; variants: ReadonlySet<Variant> },
  rng: () => number,
): { collection: Collection; result: CosmeticPull } {
  if (c.tickets < COST.cosmetic) return { collection: c, result: { ok: false, reason: `뽑기권이 모자라요 (${COST.cosmetic}장 필요)` } };
  const pool: CosmeticItem[] = [
    ...all.accessories.filter((a) => a !== 'none' && !unlocked.accessories.has(a) && !c.accessories.includes(a)).map((id) => ({ kind: 'accessory' as const, id })),
    ...all.variants.filter((v) => v !== 'default' && !unlocked.variants.has(v) && !c.variants.includes(v)).map((id) => ({ kind: 'variant' as const, id })),
  ];
  if (pool.length === 0) return { collection: c, result: { ok: false, reason: '꾸미기를 모두 모았어요!' } };
  const item = pool[Math.min(pool.length - 1, Math.floor(rng() * pool.length))]!;
  const next: Collection = { ...c, tickets: c.tickets - COST.cosmetic };
  if (item.kind === 'accessory') next.accessories = [...c.accessories, item.id];
  else next.variants = [...c.variants, item.id];
  return { collection: next, result: { ok: true, item } };
}

// ---- 뽑기권을 버는 길 ----

/**
 * 레벨 보상: 레벨 5부터 5의 배수 레벨은 2장, 5로 나눠 3이 남는 레벨(8·13·18…)은 1장.
 * 열심히 키우면 가끔 뽑을 수 있는 정도로 드물게 준다.
 */
export function ticketsForLevel(level: number): number {
  if (level < 5) return 0;
  if (level % 5 === 0) return 2;
  if (level % 5 === 3) return 1;
  return 0;
}

/** 꺼낸 동물이 레벨이 올랐으면 아직 안 준 레벨 보상을 합쳐서 준다. */
export function levelRewards(c: Collection, id: SpeciesId): { collection: Collection; tickets: number; level: number } {
  const have = c.owned[id];
  if (!have) return { collection: c, tickets: 0, level: 0 };
  const level = levelOf(have.pet.xp);
  if (level <= have.rewardedLevel) return { collection: c, tickets: 0, level };
  let tickets = 0;
  for (let l = have.rewardedLevel + 1; l <= level; l++) tickets += ticketsForLevel(l);
  return { collection: { ...c, tickets: c.tickets + tickets, owned: { ...c.owned, [id]: { ...have, rewardedLevel: level } } }, tickets, level };
}

/** 오늘 처음 켰으면 출석 보상을 준다. today 는 로컬 날짜 'YYYY-MM-DD'. */
export function claimDaily(c: Collection, today: string): { collection: Collection; tickets: number } {
  if (c.lastDaily === today) return { collection: c, tickets: 0 };
  return { collection: { ...c, tickets: c.tickets + DAILY_TICKETS, lastDaily: today }, tickets: DAILY_TICKETS };
}

/** 지금까지 돌본 횟수(careCount)에 맞춰 아직 안 준 돌봄 보상을 준다. */
export function claimCare(c: Collection, careCount: number): { collection: Collection; tickets: number } {
  const due = Math.floor(careCount / CARE_PER_TICKET) - c.careTicketsGiven;
  if (due <= 0) return { collection: c, tickets: 0 };
  return { collection: { ...c, tickets: c.tickets + due, careTicketsGiven: c.careTicketsGiven + due }, tickets: due };
}

// ---- 화면에 보여 줄 값 ----

export interface CollectionEntry {
  id: SpeciesId;
  /** 동물 이름(종) */
  speciesName: string;
  hidden: boolean;
  owned: boolean;
  /** 지어 준 이름 */
  name: string;
  level: number;
  stage: Stage;
  xp: number;
  count: number;
  active: boolean;
}

export interface CollectionView {
  tickets: number;
  cost: typeof COST;
  pulls: number;
  /** 천장까지 남은 뽑기 수 */
  untilPity: number;
  active: SpeciesId;
  entries: CollectionEntry[];
  ownedCount: number;
  total: number;
  /** 꾸미기 뽑기로 아직 얻을 수 있는 개수 */
  cosmeticLeft: number;
  chances: { commonEach: number; hiddenEach: number; hiddenTotal: number };
}

export function buildCollectionView(c: Collection, cosmeticLeft: number): CollectionView {
  const entries: CollectionEntry[] = SPECIES.map((s) => {
    const o = c.owned[s.id];
    return {
      id: s.id,
      speciesName: s.name,
      hidden: s.hidden === true,
      owned: o !== undefined,
      name: o?.name ?? '',
      level: o ? levelOf(o.pet.xp) : 0,
      stage: o ? stageOf(o.pet) : 'egg',
      xp: o ? Math.floor(o.pet.xp) : 0,
      count: o?.count ?? 0,
      active: c.active === s.id,
    };
  });
  return {
    tickets: c.tickets,
    cost: COST,
    pulls: c.pulls,
    untilPity: Math.max(0, HIDDEN_PITY - c.sinceHidden),
    active: c.active,
    entries,
    ownedCount: entries.filter((e) => e.owned).length,
    total: entries.length,
    cosmeticLeft,
    chances: { commonEach: commonPercentEach(), hiddenEach: HIDDEN_PERCENT_EACH, hiddenTotal: hiddenPercent() },
  };
}

// ---- 저장 파일 검증 ----

const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const count = (v: unknown, fallback = 0): number => (isNum(v) && v >= 0 ? Math.floor(v) : fallback);

function sanitizePet(raw: unknown, id: SpeciesId): PetState | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const p = raw as Record<string, unknown>;
  if (!isNum(p['xp']) || !isNum(p['hunger']) || !isNum(p['happiness']) || !isNum(p['lastTickAt'])) return null;
  const clamp = (v: number): number => Math.min(100, Math.max(0, v));
  return {
    speciesId: id,
    xp: Math.max(0, p['xp']),
    hunger: clamp(p['hunger']),
    happiness: clamp(p['happiness']),
    lastTickAt: p['lastTickAt'],
    lastTouchAt: isNum(p['lastTouchAt']) ? p['lastTouchAt'] : 0,
    clean: isNum(p['clean']) ? clamp(p['clean']) : 100,
  };
}

/** 어떤 값이 와도 죽지 않고, 읽을 수 없으면 null 을 돌려준다(그러면 호출한 쪽이 예전 저장에서 옮겨 온다). */
export function sanitizeCollection(raw: unknown, validAccessories: readonly Accessory[], validVariants: readonly Variant[]): Collection | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const r = raw as Record<string, unknown>;
  const ownedRaw = typeof r['owned'] === 'object' && r['owned'] !== null ? (r['owned'] as Record<string, unknown>) : {};
  const owned: Collection['owned'] = {};
  for (const s of SPECIES) {
    const o = ownedRaw[s.id];
    if (typeof o !== 'object' || o === null) continue;
    const e = o as Record<string, unknown>;
    const pet = sanitizePet(e['pet'], s.id);
    if (!pet) continue;
    owned[s.id] = { pet, name: sanitizePetName(e['name']), count: Math.max(1, count(e['count'], 1)), obtainedAt: isNum(e['obtainedAt']) ? e['obtainedAt'] : 0, rewardedLevel: count(e['rewardedLevel'], levelOf(pet.xp)) };
  }
  const ids = ownedIds({ owned } as Collection);
  if (ids.length === 0) return null;
  const active = isSpeciesId(r['active']) && owned[r['active']] ? r['active'] : ids[0]!;
  const list = <T extends string>(v: unknown, valid: readonly T[]): T[] => (Array.isArray(v) ? valid.filter((x) => v.includes(x)) : []);
  return {
    owned,
    active,
    tickets: count(r['tickets']),
    pulls: count(r['pulls']),
    sinceHidden: count(r['sinceHidden']),
    accessories: list(r['accessories'], validAccessories),
    variants: list(r['variants'], validVariants),
    lastDaily: typeof r['lastDaily'] === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(r['lastDaily']) ? r['lastDaily'] : '',
    careTicketsGiven: count(r['careTicketsGiven']),
  };
}

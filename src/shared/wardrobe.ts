/**
 * 꾸미기: 어떤 색·장식이 열려 있는지, 지금 쓸 수 있는지, 업적을 달성했을 때 무엇을 받는지.
 * 장식과 색은 업적으로 열리거나 꾸미기 뽑기(shared/collection.ts)로 얻는다. 동물은 뽑기로만 얻으므로 여기서 열고 닫지 않는다.
 * 순수 함수라서 시계·파일·화면 없이 테스트한다. 업적은 shared/growth.ts 가 정한다.
 */
import { ACHIEVEMENTS, type Growth } from './growth.js';
import { sanitizePetName } from './settings.js';
import { isDisplayStage, reachedStages, type DisplayStage, type Stage } from './pet.js';
import { ACCESSORIES, SPECIES, hasLegendForm, type Accessory, type Effect, type Neck, type SpeciesId, type Variant } from './species.js';

export const VARIANT_UNLOCK: Partial<Record<Variant, string>> = {
  pastel: 'first-fix',
  deep: 'confirm-10',
  mono: 'streak-7',
};

/** 장식은 업적 보상이거나 꾸미기 뽑기로 얻는다. 도감을 채우면 왕관, 문제를 많이 고치면 날개를 받는다. */
export const ACCESSORY_UNLOCK: Partial<Record<Accessory, string>> = {
  ribbon: 'care-50',
  glasses: 'confirm-50',
  crown: 'rules-all',
  wings: 'fix-30',
  sprout: 'tips-10',
  flower: 'streak-3',
  partyhat: 'quiz-25',
  halo: 'streak-30',
  // 업적 전용(뽑기에는 없다)
  headband: 'care-200',
  antenna: 'wash-20',
  bunnyears: 'stroll-10',
  eyepatch: 'collect-5',
  monocle: 'pull-10',
  star: 'hidden-1',
};

/** 업적으로만 얻는 장식(꾸미기 뽑기에는 나오지 않는다) */
export const ACHIEVEMENT_ONLY: readonly Accessory[] = ['headband', 'antenna', 'bunnyears', 'eyepatch', 'monocle', 'star'];
/** 꾸미기 뽑기로만 얻는 장식(업적이 없다) */
export const GACHA_ONLY: readonly Accessory[] = ['cap', 'witch', 'chef', 'santa', 'beret', 'beanie', 'bandana', 'cowboy', 'headphones', 'pirate', 'knight', 'devil', 'unicornhorn', 'flamecrown'];
/** 꾸미기 뽑기에 나올 수 있는 장식(업적 전용은 뺀다) */
export const GACHA_ACCESSORIES: readonly Accessory[] = ACCESSORIES.filter((a) => !ACHIEVEMENT_ONLY.includes(a));

export const NECK_NAMES: Record<Neck, string> = { none: '없음', bell: '방울 목줄', scarf: '스카프', bowtie: '나비넥타이', pearl: '진주 목걸이', starpendant: '별 목걸이', goldchain: '황금 목걸이' };
export const EFFECT_NAMES: Record<Effect, string> = { none: '없음', sparkles: '반짝이', hearts: '하트', notes: '음표', snow: '눈송이', flameaura: '불꽃 오라' };

export const VARIANT_NAMES: Record<Variant, string> = { default: '기본', pastel: '파스텔', deep: '진하게', mono: '흑백' };
export const ACCESSORY_NAMES: Record<Accessory, string> = {
  none: '없음',
  ribbon: '리본',
  glasses: '선글라스',
  crown: '왕관',
  wings: '날개',
  sprout: '새싹',
  flower: '꽃',
  partyhat: '파티 모자',
  halo: '천사 고리',
  cap: '야구모자',
  witch: '마법사 모자',
  chef: '요리사 모자',
  santa: '산타 모자',
  headband: '별 머리띠',
  antenna: '하트 더듬이',
  bunnyears: '토끼 귀',
  eyepatch: '안대',
  monocle: '외알 안경',
  star: '반짝 별',
  beret: '베레모',
  beanie: '비니',
  bandana: '두건',
  cowboy: '카우보이 모자',
  headphones: '헤드폰',
  pirate: '해적 모자',
  knight: '기사 투구',
  devil: '악마 뿔',
  unicornhorn: '유니콘 뿔',
  flamecrown: '불꽃 왕관',
};

/** 뽑기로 얻은 것과 가진 동물(Collection 에서 뽑아 넘긴다). 없으면 업적으로 연 것만 쓸 수 있다. */
export interface Extra {
  accessories: readonly Accessory[];
  variants: readonly Variant[];
  /** 뽑기로 얻은 목 장식과 효과(업적으로는 열리지 않는다) */
  necks?: readonly Neck[];
  effects?: readonly Effect[];
  /** 가진 동물(프로필 카드에 보여 줄 수 있는 동물) */
  species: readonly SpeciesId[];
  /** 지금 키우는 동물의 진짜 성장 단계(지나온 단계만 모습으로 고를 수 있다). 없으면 성체로 본다. */
  stage?: Stage;
}

const NO_EXTRA: Extra = { accessories: [], variants: [], species: [] };

const achievementName = (id: string): string => ACHIEVEMENTS.find((a) => a.id === id)?.name ?? id;

function hintOf(requires: string | undefined, gacha = true): string {
  if (!requires) return '';
  return gacha ? `업적 '${achievementName(requires)}' 달성하거나 꾸미기 뽑기로 얻어요` : `업적 '${achievementName(requires)}' 달성하면 열려요 (뽑기에는 없어요)`;
}

function accessoryHint(a: Accessory): string {
  if (a === 'none') return '';
  if (GACHA_ONLY.includes(a)) return '꾸미기 뽑기로만 얻을 수 있어요 (업적은 없어요)';
  return hintOf(ACCESSORY_UNLOCK[a], !ACHIEVEMENT_ONLY.includes(a));
}

const isDone = (g: Growth, requires: string | undefined): boolean => requires === undefined || g.achievements[requires] !== undefined;

export const variantUnlocked = (g: Growth, v: Variant, extra: Extra = NO_EXTRA): boolean => isDone(g, VARIANT_UNLOCK[v]) || extra.variants.includes(v);
export const accessoryUnlocked = (g: Growth, a: Accessory, extra: Extra = NO_EXTRA): boolean => {
  if (a === 'none') return true;
  // 업적이 없는 장식(뽑기 전용)은 뽑아야만 열린다.
  const requires = ACCESSORY_UNLOCK[a];
  return (requires !== undefined && isDone(g, requires)) || extra.accessories.includes(a);
};

/** 목 장식과 효과는 뽑아야만 열린다("없음"은 늘 쓴다) */
export const neckUnlocked = (n: Neck, extra: Extra = NO_EXTRA): boolean => n === 'none' || (extra.necks ?? []).includes(n);
export const effectUnlocked = (e: Effect, extra: Extra = NO_EXTRA): boolean => e === 'none' || (extra.effects ?? []).includes(e);

export interface WardrobeEntry<T extends string> {
  id: T;
  name: string;
  unlocked: boolean;
  /** 잠겨 있으면 여는 방법(열려 있으면 빈 문자열) */
  hint: string;
}

export const STAGE_NAMES: Record<DisplayStage, string> = { auto: '자동(지금 단계)', baby: '새끼', adult: '성체', legend: '전설' };

export interface WardrobeView {
  current: { speciesId: SpeciesId; variant: Variant; accessory: Accessory; neck: Neck; effect: Effect; name: string; cardSpecies: SpeciesId | 'current'; displayStage: DisplayStage };
  /** 보여 줄 모습: 자동 + 이미 지나온 단계만 열려 있다(알은 고를 수 없다) */
  stages: WardrobeEntry<DisplayStage>[];
  /** 프로필 카드에 보여 줄 동물 후보: 가진 동물은 열려 있고, 못 가진 동물은 뽑기로 얻어야 한다 */
  species: WardrobeEntry<SpeciesId>[];
  variants: WardrobeEntry<Variant>[];
  accessories: WardrobeEntry<Accessory>[];
  necks: WardrobeEntry<Neck>[];
  effects: WardrobeEntry<Effect>[];
}

export function buildWardrobe(
  g: Growth,
  current: Pick<WardrobeView['current'], 'speciesId' | 'variant' | 'accessory'> & Partial<WardrobeView['current']>,
  extra: Extra = NO_EXTRA,
): WardrobeView {
  const entry = <T extends string>(id: T, name: string, unlocked: boolean, hint: string): WardrobeEntry<T> => ({ id, name, unlocked, hint: unlocked ? '' : hint });
  const reached = reachedStages(extra.stage ?? 'adult');
  const stageList: DisplayStage[] = ['auto', 'baby', 'adult', ...(hasLegendForm(current.speciesId) ? (['legend'] as const) : [])];
  return {
    current: { name: '', cardSpecies: 'current', displayStage: 'auto', neck: 'none', effect: 'none', ...current },
    stages: stageList.map((st) => entry(st, STAGE_NAMES[st], st === 'auto' || (reached as string[]).includes(st), '아직 지나오지 않은 단계예요')),
    // 아직 못 뽑은 히든 동물은 이름을 숨긴다(뽑는 재미를 위해 ???로 보인다).
    species: SPECIES.map((s) => {
      const owned = extra.species.includes(s.id);
      return entry(s.id, s.rarity === 'hidden' && !owned ? '???' : s.name, owned, '뽑기로 얻을 수 있어요');
    }),
    variants: (Object.keys(VARIANT_NAMES) as Variant[]).map((v) => entry(v, VARIANT_NAMES[v], variantUnlocked(g, v, extra), hintOf(VARIANT_UNLOCK[v]))),
    accessories: (Object.keys(ACCESSORY_NAMES) as Accessory[]).map((a) => entry(a, ACCESSORY_NAMES[a], accessoryUnlocked(g, a, extra), accessoryHint(a))),
    necks: (Object.keys(NECK_NAMES) as Neck[]).map((n) => entry(n, NECK_NAMES[n], neckUnlocked(n, extra), '꾸미기 뽑기로만 얻을 수 있어요')),
    effects: (Object.keys(EFFECT_NAMES) as Effect[]).map((e) => entry(e, EFFECT_NAMES[e], effectUnlocked(e, extra), '꾸미기 뽑기로만 얻을 수 있어요')),
  };
}

export interface WardrobePatch {
  variant?: Variant;
  accessory?: Accessory;
  neck?: Neck;
  effect?: Effect;
  /** 펫 이름(다듬어서 저장) */
  name?: string;
  /** 프로필 카드에 보여 줄 동물 */
  cardSpecies?: SpeciesId | 'current';
  /** 보여 줄 모습(지나온 단계만) */
  displayStage?: DisplayStage;
}

/** 요청한 바꾸기 중 아직 열리지 않은 것은 버린다(열린 것만 남긴다). */
export function allowedPatch(g: Growth, patch: WardrobePatch, extra: Extra = NO_EXTRA): WardrobePatch {
  const out: WardrobePatch = {};
  if (patch.variant !== undefined && variantUnlocked(g, patch.variant, extra)) out.variant = patch.variant;
  if (patch.accessory !== undefined && accessoryUnlocked(g, patch.accessory, extra)) out.accessory = patch.accessory;
  if (patch.neck !== undefined && neckUnlocked(patch.neck, extra)) out.neck = patch.neck;
  if (patch.effect !== undefined && effectUnlocked(patch.effect, extra)) out.effect = patch.effect;
  if (patch.displayStage !== undefined && isDisplayStage(patch.displayStage)) {
    // 지나오지 않은 단계(와 알)로는 돌릴 수 없다. 자동은 늘 된다.
    if (patch.displayStage === 'auto' || (reachedStages(extra.stage ?? 'adult') as string[]).includes(patch.displayStage)) out.displayStage = patch.displayStage;
  }
  if (typeof patch.name === 'string') out.name = sanitizePetName(patch.name);
  if (patch.cardSpecies === 'current' || (patch.cardSpecies !== undefined && extra.species.includes(patch.cardSpecies))) out.cardSpecies = patch.cardSpecies;
  return out;
}

/** 프로필 카드에 그릴 동물. 고른 동물을 가지고 있지 않으면(저장 파일을 손으로 고친 경우 등) 지금 키우는 동물로 돌아간다. */
export function cardSpeciesOf(chosen: SpeciesId | 'current', current: SpeciesId, owned: readonly SpeciesId[]): SpeciesId {
  return chosen !== 'current' && owned.includes(chosen) ? chosen : current;
}

export interface Rewards {
  variants: Variant[];
  accessories: Accessory[];
}

/** 방금 달성한 업적들로 새로 열린 색·장식 */
export function rewardsFor(achievementIds: readonly string[]): Rewards {
  const has = (id: string | undefined): boolean => id !== undefined && achievementIds.includes(id);
  return {
    variants: (Object.keys(VARIANT_NAMES) as Variant[]).filter((v) => has(VARIANT_UNLOCK[v])),
    accessories: (Object.keys(ACCESSORY_NAMES) as Accessory[]).filter((a) => a !== 'none' && has(ACCESSORY_UNLOCK[a])),
  };
}

/** 보상 안내 문구. 아무것도 없으면 빈 문자열. */
export function rewardText(r: Rewards): string {
  const names = [...r.accessories.map((a) => ACCESSORY_NAMES[a]), ...r.variants.map((v) => VARIANT_NAMES[v] + ' 색')];
  return names.length === 0 ? '' : '새로 받았어요: ' + names.join(', ');
}

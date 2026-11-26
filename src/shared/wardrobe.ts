/**
 * 꾸미기: 어떤 색·장식이 열려 있는지, 지금 쓸 수 있는지, 업적을 달성했을 때 무엇을 받는지.
 * 장식과 색은 업적으로 열리거나 꾸미기 뽑기(shared/collection.ts)로 얻는다. 동물은 뽑기로만 얻으므로 여기서 열고 닫지 않는다.
 * 순수 함수라서 시계·파일·화면 없이 테스트한다. 업적은 shared/growth.ts 가 정한다.
 */
import { ACHIEVEMENTS, type Growth } from './growth.js';
import { sanitizePetName } from './settings.js';
import { isDisplayStage, reachedStages, type DisplayStage, type Stage } from './pet.js';
import { SPECIES, isHiddenSpecies, type Accessory, type SpeciesId, type Variant } from './species.js';

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
};

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
};

/** 뽑기로 얻은 것과 가진 동물(Collection 에서 뽑아 넘긴다). 없으면 업적으로 연 것만 쓸 수 있다. */
export interface Extra {
  accessories: readonly Accessory[];
  variants: readonly Variant[];
  /** 가진 동물(프로필 카드에 보여 줄 수 있는 동물) */
  species: readonly SpeciesId[];
  /** 지금 키우는 동물의 진짜 성장 단계(지나온 단계만 모습으로 고를 수 있다). 없으면 성체로 본다. */
  stage?: Stage;
}

const NO_EXTRA: Extra = { accessories: [], variants: [], species: [] };

const achievementName = (id: string): string => ACHIEVEMENTS.find((a) => a.id === id)?.name ?? id;

function hintOf(requires: string | undefined): string {
  return requires ? `업적 '${achievementName(requires)}' 달성하거나 꾸미기 뽑기로 얻어요` : '';
}

const isDone = (g: Growth, requires: string | undefined): boolean => requires === undefined || g.achievements[requires] !== undefined;

export const variantUnlocked = (g: Growth, v: Variant, extra: Extra = NO_EXTRA): boolean => isDone(g, VARIANT_UNLOCK[v]) || extra.variants.includes(v);
export const accessoryUnlocked = (g: Growth, a: Accessory, extra: Extra = NO_EXTRA): boolean => a === 'none' || isDone(g, ACCESSORY_UNLOCK[a]) || extra.accessories.includes(a);

export interface WardrobeEntry<T extends string> {
  id: T;
  name: string;
  unlocked: boolean;
  /** 잠겨 있으면 여는 방법(열려 있으면 빈 문자열) */
  hint: string;
}

export const STAGE_NAMES: Record<DisplayStage, string> = { auto: '자동(지금 단계)', baby: '새끼', adult: '성체', legend: '전설' };

export interface WardrobeView {
  current: { speciesId: SpeciesId; variant: Variant; accessory: Accessory; name: string; cardSpecies: SpeciesId | 'current'; displayStage: DisplayStage };
  /** 보여 줄 모습: 자동 + 이미 지나온 단계만 열려 있다(알은 고를 수 없다) */
  stages: WardrobeEntry<DisplayStage>[];
  /** 프로필 카드에 보여 줄 동물 후보: 가진 동물은 열려 있고, 못 가진 동물은 뽑기로 얻어야 한다 */
  species: WardrobeEntry<SpeciesId>[];
  variants: WardrobeEntry<Variant>[];
  accessories: WardrobeEntry<Accessory>[];
}

export function buildWardrobe(
  g: Growth,
  current: Pick<WardrobeView['current'], 'speciesId' | 'variant' | 'accessory'> & Partial<WardrobeView['current']>,
  extra: Extra = NO_EXTRA,
): WardrobeView {
  const entry = <T extends string>(id: T, name: string, unlocked: boolean, hint: string): WardrobeEntry<T> => ({ id, name, unlocked, hint: unlocked ? '' : hint });
  const reached = reachedStages(extra.stage ?? 'adult');
  const stageList: DisplayStage[] = ['auto', 'baby', 'adult', ...(isHiddenSpecies(current.speciesId) ? (['legend'] as const) : [])];
  return {
    current: { name: '', cardSpecies: 'current', displayStage: 'auto', ...current },
    stages: stageList.map((st) => entry(st, STAGE_NAMES[st], st === 'auto' || (reached as string[]).includes(st), '아직 지나오지 않은 단계예요')),
    species: SPECIES.map((s) => entry(s.id, s.name, extra.species.includes(s.id), '뽑기로 얻을 수 있어요')),
    variants: (Object.keys(VARIANT_NAMES) as Variant[]).map((v) => entry(v, VARIANT_NAMES[v], variantUnlocked(g, v, extra), hintOf(VARIANT_UNLOCK[v]))),
    accessories: (Object.keys(ACCESSORY_NAMES) as Accessory[]).map((a) => entry(a, ACCESSORY_NAMES[a], accessoryUnlocked(g, a, extra), hintOf(a === 'none' ? undefined : ACCESSORY_UNLOCK[a]))),
  };
}

export interface WardrobePatch {
  variant?: Variant;
  accessory?: Accessory;
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

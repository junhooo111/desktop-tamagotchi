/**
 * 꾸미기: 어떤 동물·색·장식이 어떤 업적으로 열리는지, 지금 쓸 수 있는지, 업적을 달성했을 때 무엇을 받는지.
 * 순수 함수라서 시계·파일·화면 없이 테스트한다. 업적은 shared/growth.ts 가 정한다.
 */
import { ACHIEVEMENTS, type Growth } from './growth.js';
import { SPECIES, type Accessory, type SpeciesId, type Variant } from './species.js';

/** 처음부터 쓸 수 있는 동물(나머지는 업적으로 연다) */
export const SPECIES_UNLOCK: Partial<Record<SpeciesId, string>> = {
  fox: 'first-confirm',
  hamster: 'quiz-5',
  penguin: 'fix-10',
};

export const VARIANT_UNLOCK: Partial<Record<Variant, string>> = {
  pastel: 'first-fix',
  deep: 'confirm-10',
  mono: 'streak-7',
};

/** 장식은 전부 업적 보상이다. 도감을 채우면 왕관, 문제를 많이 고치면 날개를 받는다. */
export const ACCESSORY_UNLOCK: Partial<Record<Accessory, string>> = {
  ribbon: 'care-50',
  glasses: 'confirm-50',
  crown: 'rules-all',
  wings: 'fix-30',
};

export const VARIANT_NAMES: Record<Variant, string> = { default: '기본', pastel: '파스텔', deep: '진하게', mono: '흑백' };
export const ACCESSORY_NAMES: Record<Accessory, string> = { none: '없음', ribbon: '리본', glasses: '선글라스', crown: '왕관', wings: '날개' };

const achievementName = (id: string): string => ACHIEVEMENTS.find((a) => a.id === id)?.name ?? id;

function hintOf(requires: string | undefined): string {
  return requires ? `업적 '${achievementName(requires)}' 달성하면 열려요` : '';
}

const isDone = (g: Growth, requires: string | undefined): boolean => requires === undefined || g.achievements[requires] !== undefined;

export const speciesUnlocked = (g: Growth, id: SpeciesId): boolean => isDone(g, SPECIES_UNLOCK[id]);
export const variantUnlocked = (g: Growth, v: Variant): boolean => isDone(g, VARIANT_UNLOCK[v]);
export const accessoryUnlocked = (g: Growth, a: Accessory): boolean => a === 'none' || isDone(g, ACCESSORY_UNLOCK[a]);

export interface WardrobeEntry<T extends string> {
  id: T;
  name: string;
  unlocked: boolean;
  /** 잠겨 있으면 여는 방법(열려 있으면 빈 문자열) */
  hint: string;
}

export interface WardrobeView {
  current: { speciesId: SpeciesId; variant: Variant; accessory: Accessory };
  species: WardrobeEntry<SpeciesId>[];
  variants: WardrobeEntry<Variant>[];
  accessories: WardrobeEntry<Accessory>[];
}

export function buildWardrobe(g: Growth, current: WardrobeView['current']): WardrobeView {
  const entry = <T extends string>(id: T, name: string, requires: string | undefined): WardrobeEntry<T> => ({
    id,
    name,
    unlocked: isDone(g, requires),
    hint: isDone(g, requires) ? '' : hintOf(requires),
  });
  return {
    current,
    species: SPECIES.map((s) => entry(s.id, s.name, SPECIES_UNLOCK[s.id])),
    variants: (Object.keys(VARIANT_NAMES) as Variant[]).map((v) => entry(v, VARIANT_NAMES[v], VARIANT_UNLOCK[v])),
    accessories: (Object.keys(ACCESSORY_NAMES) as Accessory[]).map((a) => entry(a, ACCESSORY_NAMES[a], a === 'none' ? undefined : ACCESSORY_UNLOCK[a])),
  };
}

export interface WardrobePatch {
  speciesId?: SpeciesId;
  variant?: Variant;
  accessory?: Accessory;
}

/** 요청한 바꾸기 중 아직 열리지 않은 것은 버린다(열린 것만 남긴다). */
export function allowedPatch(g: Growth, patch: WardrobePatch): WardrobePatch {
  const out: WardrobePatch = {};
  if (patch.speciesId !== undefined && speciesUnlocked(g, patch.speciesId)) out.speciesId = patch.speciesId;
  if (patch.variant !== undefined && variantUnlocked(g, patch.variant)) out.variant = patch.variant;
  if (patch.accessory !== undefined && accessoryUnlocked(g, patch.accessory)) out.accessory = patch.accessory;
  return out;
}

export interface Rewards {
  species: SpeciesId[];
  variants: Variant[];
  accessories: Accessory[];
}

/** 방금 달성한 업적들로 새로 열린 동물·색·장식 */
export function rewardsFor(achievementIds: readonly string[]): Rewards {
  const has = (id: string | undefined): boolean => id !== undefined && achievementIds.includes(id);
  return {
    species: SPECIES.map((s) => s.id).filter((id) => has(SPECIES_UNLOCK[id])),
    variants: (Object.keys(VARIANT_NAMES) as Variant[]).filter((v) => has(VARIANT_UNLOCK[v])),
    accessories: (Object.keys(ACCESSORY_NAMES) as Accessory[]).filter((a) => a !== 'none' && has(ACCESSORY_UNLOCK[a])),
  };
}

/** 보상 안내 문구. 아무것도 없으면 빈 문자열. */
export function rewardText(r: Rewards): string {
  const names = [
    ...r.accessories.map((a) => ACCESSORY_NAMES[a]),
    ...r.species.map((id) => SPECIES.find((s) => s.id === id)?.name ?? id),
    ...r.variants.map((v) => VARIANT_NAMES[v] + ' 색'),
  ];
  return names.length === 0 ? '' : '새로 받았어요: ' + names.join(', ');
}

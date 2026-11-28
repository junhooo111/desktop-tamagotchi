/**
 * 꾸미기 목록과 등급.
 *
 * 꾸미기도 동물처럼 일반 < 고급 < 희귀 < 특별 < 전설 < 히든 등급이 있다(확률표는 동물과 같은 GRADE_PERCENT).
 * 뽑기는 "안 가진 것만" 나온다: 먼저 등급을 정하고(안 가진 것이 남은 등급끼리 확률대로), 그 등급의 안 가진 것 중 하나를 고른다.
 * 서버(supabase 0019)의 cosmetic_items 표와 이 목록이 같아야 하고, 시험이 둘을 비교한다.
 */
import { PITY_RESETS_ON, type Rarity } from './rarity.js';

export type CosmeticKind = 'accessory' | 'variant';

export interface CosmeticItem {
  kind: CosmeticKind;
  id: string;
  rarity: Rarity;
  /** false 면 업적으로만 얻고 꾸미기 뽑기에는 나오지 않는다 */
  gacha: boolean;
}

const A = (id: string, rarity: Rarity, gacha = true): CosmeticItem => ({ kind: 'accessory', id, rarity, gacha });
const V = (id: string, rarity: Rarity): CosmeticItem => ({ kind: 'variant', id, rarity, gacha: true });

export const COSMETIC_ITEMS: readonly CosmeticItem[] = [
  // 일반
  A('ribbon', 'common'),
  A('sprout', 'common'),
  A('flower', 'common'),
  A('cap', 'common'),
  // 고급
  A('partyhat', 'uncommon'),
  A('glasses', 'uncommon'),
  A('chef', 'uncommon'),
  A('santa', 'uncommon'),
  V('pastel', 'uncommon'),
  // 희귀
  A('witch', 'rare'),
  A('halo', 'rare'),
  V('deep', 'rare'),
  // 특별
  A('crown', 'special'),
  V('mono', 'special'),
  // 전설
  A('wings', 'legend'),
  // 업적 전용(뽑기에는 나오지 않는다)
  A('headband', 'rare', false),
  A('antenna', 'rare', false),
  A('bunnyears', 'rare', false),
  A('eyepatch', 'rare', false),
  A('monocle', 'rare', false),
  A('star', 'special', false),
];

/** 전설이 안 나온 채 이만큼 꾸미기를 뽑으면 다음은 전설이 나온다(전설이 남아 있을 때) */
export const COSMETIC_PITY = 25;

export const cosmeticItem = (kind: CosmeticKind, id: string): CosmeticItem | undefined => COSMETIC_ITEMS.find((i) => i.kind === kind && i.id === id);
export const cosmeticRarity = (kind: CosmeticKind, id: string): Rarity => cosmeticItem(kind, id)?.rarity ?? 'common';
export const resetsCosmeticPity = (r: Rarity): boolean => PITY_RESETS_ON.includes(r);

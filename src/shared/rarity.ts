/**
 * 동물 등급: 일반 < 고급 < 희귀 < 특별 < 전설 < 히든.
 *
 * 뽑기 확률은 "등급 전체"에 정해 두고, 같은 등급 안에서는 종이 똑같이 나눠 갖는다
 * (그래서 동물을 추가해도 등급 합계는 그대로이고 종당 확률만 저절로 줄어든다).
 * 서버(supabase 0015)의 가중치도 이 표에서 나온 값이고, 시험이 둘을 비교한다.
 */

export const RARITIES = ['common', 'uncommon', 'rare', 'special', 'legend', 'hidden'] as const;
export type Rarity = (typeof RARITIES)[number];

export const isRarity = (v: unknown): v is Rarity => typeof v === 'string' && (RARITIES as readonly string[]).includes(v);

export const RARITY_NAME: Record<Rarity, string> = { common: '일반', uncommon: '고급', rare: '희귀', special: '특별', legend: '전설', hidden: '히든' };
export const RARITY_NAME_EN: Record<Rarity, string> = { common: 'Common', uncommon: 'Uncommon', rare: 'Rare', special: 'Special', legend: 'Legendary', hidden: 'Hidden' };

/** 등급 글자색: 일반 흰색·고급 초록·희귀 파랑·특별 보라·전설 주황. 히든은 무지개라서 CSS 애니메이션으로 따로 칠한다. */
export const RARITY_COLOR: Record<Rarity, string> = { common: '#ffffff', uncommon: '#5fd16a', rare: '#4a9bff', special: '#b36bff', legend: '#ff9b2e', hidden: '#ffffff' };

/** 한 번 뽑을 때 그 등급이 나올 확률(%). 합계 100. */
export const GRADE_PERCENT: Record<Rarity, number> = { common: 50, uncommon: 24, rare: 15, special: 7, legend: 3, hidden: 1 };

/** 이 등급부터는 전설 단계까지 자란다(몸에 금빛 날개와 불꽃 갈기). */
export const hasLegendFormRarity = (r: Rarity): boolean => r === 'legend' || r === 'hidden';

/** 천장(전설)이 닿으면 나오는 등급과, 그 카운트를 0으로 되돌리는 등급 */
export const PITY_RESETS_ON: readonly Rarity[] = ['legend', 'hidden'];

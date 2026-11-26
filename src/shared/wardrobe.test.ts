import { describe, expect, it } from 'vitest';
import { ACHIEVEMENTS, emptyGrowth, type Growth } from './growth.js';
import { SPECIES } from './species.js';
import {
  ACCESSORY_NAMES,
  ACCESSORY_UNLOCK,
  SPECIES_UNLOCK,
  VARIANT_NAMES,
  VARIANT_UNLOCK,
  accessoryUnlocked,
  allowedPatch,
  buildWardrobe,
  cardSpeciesOf,
  rewardText,
  rewardsFor,
  speciesUnlocked,
  variantUnlocked,
} from './wardrobe.js';

const withAchievements = (...ids: string[]): Growth => ({ ...emptyGrowth(), achievements: Object.fromEntries(ids.map((id) => [id, 1])) });
const current = { speciesId: 'cat' as const, variant: 'default' as const, accessory: 'none' as const };

describe('해금 규칙의 짜임새', () => {
  it('모든 해금 조건은 실제로 있는 업적이다(오타로 영영 안 열리는 일이 없게)', () => {
    const ids = new Set(ACHIEVEMENTS.map((a) => a.id));
    for (const req of [...Object.values(SPECIES_UNLOCK), ...Object.values(VARIANT_UNLOCK), ...Object.values(ACCESSORY_UNLOCK)]) {
      expect(ids.has(req as string), String(req)).toBe(true);
    }
  });

  it('장식은 전부 업적 보상이고, 기본 동물 6종과 기본 색은 처음부터 쓴다', () => {
    for (const a of ['ribbon', 'glasses', 'crown', 'wings'] as const) expect(ACCESSORY_UNLOCK[a], a).toBeDefined();
    const g = emptyGrowth();
    for (const id of ['rabbit', 'cat', 'dog', 'turtle', 'chick', 'duck'] as const) expect(speciesUnlocked(g, id), id).toBe(true);
    expect(variantUnlocked(g, 'default')).toBe(true);
    expect(accessoryUnlocked(g, 'none')).toBe(true);
  });

  it('도감을 완성하면 왕관, 문제를 30개 고치면 날개를 받는다', () => {
    expect(ACCESSORY_UNLOCK.crown).toBe('rules-all');
    expect(ACCESSORY_UNLOCK.wings).toBe('fix-30');
  });

  it('같은 업적이 여러 보상을 열지 않거나, 열더라도 겹치는 이름이 없다', () => {
    const all = [...Object.values(SPECIES_UNLOCK), ...Object.values(VARIANT_UNLOCK), ...Object.values(ACCESSORY_UNLOCK)];
    expect(new Set(all).size).toBe(all.length);
  });
});

describe('열림 판정', () => {
  it('조건 업적을 달성해야 열린다', () => {
    expect(speciesUnlocked(emptyGrowth(), 'fox')).toBe(false);
    expect(speciesUnlocked(withAchievements('first-confirm'), 'fox')).toBe(true);
    expect(accessoryUnlocked(emptyGrowth(), 'crown')).toBe(false);
    expect(accessoryUnlocked(withAchievements('rules-all'), 'crown')).toBe(true);
    expect(variantUnlocked(withAchievements('streak-7'), 'mono')).toBe(true);
  });
});

describe('buildWardrobe', () => {
  it('모든 동물·색·장식을 담고, 잠긴 것에는 여는 방법(업적 이름)을 붙인다', () => {
    const v = buildWardrobe(emptyGrowth(), current);
    expect(v.species.map((s) => s.id)).toEqual(SPECIES.map((s) => s.id));
    expect(v.variants.map((x) => x.id)).toEqual(Object.keys(VARIANT_NAMES));
    expect(v.accessories.map((x) => x.id)).toEqual(Object.keys(ACCESSORY_NAMES));
    const fox = v.species.find((s) => s.id === 'fox')!;
    expect(fox).toMatchObject({ unlocked: false });
    expect(fox.hint).toContain('첫 배움');
    expect(v.species.find((s) => s.id === 'cat')).toMatchObject({ unlocked: true, hint: '' });
    expect(v.current).toMatchObject(current);
    expect(v.current).toMatchObject({ name: '', cardSpecies: 'current' });
  });

  it('업적을 달성하면 열리고 힌트가 사라진다', () => {
    const v = buildWardrobe(withAchievements('rules-all'), current);
    expect(v.accessories.find((a) => a.id === 'crown')).toMatchObject({ unlocked: true, hint: '' });
    expect(v.accessories.find((a) => a.id === 'wings')?.unlocked).toBe(false);
  });
});

describe('allowedPatch', () => {
  it('열린 것만 남기고 잠긴 것은 버린다', () => {
    const g = withAchievements('first-confirm');
    expect(allowedPatch(g, { speciesId: 'fox', variant: 'mono', accessory: 'crown' })).toEqual({ speciesId: 'fox' });
    expect(allowedPatch(emptyGrowth(), { speciesId: 'penguin' })).toEqual({});
    expect(allowedPatch(emptyGrowth(), { accessory: 'none', variant: 'default', speciesId: 'dog' })).toEqual({ accessory: 'none', variant: 'default', speciesId: 'dog' });
  });
});

describe('이름과 프로필 카드 동물', () => {
  it('이름은 늘 받되 다듬어서 남긴다', () => {
    expect(allowedPatch(emptyGrowth(), { name: '  콩이  ' })).toEqual({ name: '콩이' });
    expect(allowedPatch(emptyGrowth(), { name: '<>' })).toEqual({ name: '' });
  });

  it('프로필 카드 동물은 열린 동물이나 current 만 받는다', () => {
    expect(allowedPatch(emptyGrowth(), { cardSpecies: 'dog' })).toEqual({ cardSpecies: 'dog' });
    expect(allowedPatch(emptyGrowth(), { cardSpecies: 'current' })).toEqual({ cardSpecies: 'current' });
    expect(allowedPatch(emptyGrowth(), { cardSpecies: 'penguin' })).toEqual({});
    expect(allowedPatch(withAchievements('fix-10'), { cardSpecies: 'penguin' })).toEqual({ cardSpecies: 'penguin' });
  });

  it('카드에 그릴 동물: 고른 동물이 열려 있으면 그 동물, 아니면 지금 키우는 동물', () => {
    expect(cardSpeciesOf(emptyGrowth(), 'current', 'cat')).toBe('cat');
    expect(cardSpeciesOf(emptyGrowth(), 'dog', 'cat')).toBe('dog');
    expect(cardSpeciesOf(emptyGrowth(), 'penguin', 'cat')).toBe('cat'); // 안 열린 동물
    expect(cardSpeciesOf(withAchievements('fix-10'), 'penguin', 'cat')).toBe('penguin');
  });

  it('새 장식(새싹·꽃·파티 모자·천사 고리)은 업적으로 열린다', () => {
    const g = withAchievements('streak-3');
    expect(accessoryUnlocked(g, 'flower')).toBe(true);
    expect(accessoryUnlocked(g, 'halo')).toBe(false);
    for (const a of ['sprout', 'flower', 'partyhat', 'halo'] as const) expect(ACCESSORY_UNLOCK[a], a).toBeDefined();
  });
});

describe('보상', () => {
  it('방금 달성한 업적이 연 동물·색·장식을 알려 준다', () => {
    expect(rewardsFor(['rules-all'])).toEqual({ species: [], variants: [], accessories: ['crown'] });
    expect(rewardsFor(['first-confirm', 'first-fix'])).toEqual({ species: ['fox'], variants: ['pastel'], accessories: [] });
    expect(rewardsFor(['tips-all'])).toEqual({ species: [], variants: [], accessories: [] });
    expect(rewardsFor(['tips-10', 'streak-3', 'quiz-25', 'streak-30'])).toEqual({ species: [], variants: [], accessories: ['sprout', 'flower', 'partyhat', 'halo'] });
  });

  it('보상 문구: 장식, 동물, 색 순서로 이름을 붙이고 없으면 빈 문자열', () => {
    expect(rewardText(rewardsFor(['rules-all']))).toBe('새로 받았어요: 왕관');
    expect(rewardText(rewardsFor(['fix-30', 'first-confirm', 'first-fix']))).toBe('새로 받았어요: 날개, 여우, 파스텔 색');
    expect(rewardText(rewardsFor(['tips-all']))).toBe('');
    expect(rewardText(rewardsFor(['streak-3']))).toBe('새로 받았어요: 꽃');
  });
});

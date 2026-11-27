import { describe, expect, it } from 'vitest';
import { ACHIEVEMENTS, emptyGrowth, type Growth } from './growth.js';
import { SPECIES } from './species.js';
import {
  ACCESSORY_NAMES,
  ACCESSORY_UNLOCK,
  ACHIEVEMENT_ONLY,
  GACHA_ACCESSORIES,
  GACHA_ONLY,
  VARIANT_NAMES,
  VARIANT_UNLOCK,
  accessoryUnlocked,
  allowedPatch,
  buildWardrobe,
  cardSpeciesOf,
  rewardText,
  rewardsFor,
  variantUnlocked,
} from './wardrobe.js';

const withAchievements = (...ids: string[]): Growth => ({ ...emptyGrowth(), achievements: Object.fromEntries(ids.map((id) => [id, 1])) });
const current = { speciesId: 'cat' as const, variant: 'default' as const, accessory: 'none' as const };

describe('해금 규칙의 짜임새', () => {
  it('모든 해금 조건은 실제로 있는 업적이다(오타로 영영 안 열리는 일이 없게)', () => {
    const ids = new Set(ACHIEVEMENTS.map((a) => a.id));
    for (const req of [...Object.values(VARIANT_UNLOCK), ...Object.values(ACCESSORY_UNLOCK)]) {
      expect(ids.has(req as string), String(req)).toBe(true);
    }
  });

  it('장식은 업적(+뽑기), 뽑기 전용, 업적 전용 셋 중 하나이고, 기본 색과 "없음"은 처음부터 쓴다', () => {
    for (const a of Object.keys(ACCESSORY_NAMES).filter((a) => a !== 'none') as (keyof typeof ACCESSORY_UNLOCK)[]) {
      const hasAchievement = ACCESSORY_UNLOCK[a] !== undefined;
      expect(hasAchievement, a).toBe(!GACHA_ONLY.includes(a)); // 뽑기 전용만 업적이 없다
    }
    for (const a of ACHIEVEMENT_ONLY) expect(GACHA_ACCESSORIES.includes(a), `${a} 는 뽑기에 나오면 안 된다`).toBe(false);
    for (const a of GACHA_ONLY) expect(GACHA_ACCESSORIES.includes(a), `${a} 는 뽑기에 나와야 한다`).toBe(true);
    expect(GACHA_ONLY).toHaveLength(4);
    expect(ACHIEVEMENT_ONLY).toHaveLength(6);
    const g = emptyGrowth();
    expect(variantUnlocked(g, 'default')).toBe(true);
    expect(accessoryUnlocked(g, 'none')).toBe(true);
  });

  it('도감을 완성하면 왕관, 문제를 30개 고치면 날개를 받는다', () => {
    expect(ACCESSORY_UNLOCK.crown).toBe('rules-all');
    expect(ACCESSORY_UNLOCK.wings).toBe('fix-30');
  });

  it('같은 업적이 여러 보상을 열지 않는다', () => {
    const all = [...Object.values(VARIANT_UNLOCK), ...Object.values(ACCESSORY_UNLOCK)];
    expect(new Set(all).size).toBe(all.length);
  });
});

describe('열림 판정', () => {
  it('조건 업적을 달성해야 열린다', () => {
    expect(accessoryUnlocked(emptyGrowth(), 'crown')).toBe(false);
    expect(accessoryUnlocked(withAchievements('rules-all'), 'crown')).toBe(true);
    expect(variantUnlocked(withAchievements('streak-7'), 'mono')).toBe(true);
  });

  it('꾸미기 뽑기로 얻은 것은 업적이 없어도 열린다', () => {
    const extra = { accessories: ['crown' as const], variants: ['mono' as const], species: [] };
    expect(accessoryUnlocked(emptyGrowth(), 'crown', extra)).toBe(true);
    expect(accessoryUnlocked(emptyGrowth(), 'wings', extra)).toBe(false);
    expect(variantUnlocked(emptyGrowth(), 'mono', extra)).toBe(true);
    expect(variantUnlocked(emptyGrowth(), 'deep', extra)).toBe(false);
  });
});

describe('buildWardrobe', () => {
  it('모든 색·장식을 담고, 잠긴 것에는 여는 방법(업적 이름 또는 뽑기)을 붙인다', () => {
    const v = buildWardrobe(emptyGrowth(), current);
    expect(v.variants.map((x) => x.id)).toEqual(Object.keys(VARIANT_NAMES));
    expect(v.accessories.map((x) => x.id)).toEqual(Object.keys(ACCESSORY_NAMES));
    const crown = v.accessories.find((a) => a.id === 'crown')!;
    expect(crown).toMatchObject({ unlocked: false });
    expect(crown.hint).toContain('도감 완성');
    expect(crown.hint).toContain('꾸미기 뽑기');
    expect(v.current).toMatchObject(current);
    expect(v.current).toMatchObject({ name: '', cardSpecies: 'current' });
  });

  it('프로필 카드 동물 후보는 모든 동물이고, 가진 동물만 열려 있다', () => {
    const v = buildWardrobe(emptyGrowth(), current, { accessories: [], variants: [], species: ['cat', 'dragon'] });
    expect(v.species.map((s) => s.id)).toEqual(SPECIES.map((s) => s.id));
    expect(v.species.filter((s) => s.unlocked).map((s) => s.id)).toEqual(['cat', 'dragon']);
    expect(v.species.find((s) => s.id === 'rabbit')!.hint).toContain('뽑기');
  });

  it('아직 못 뽑은 히든 동물은 이름이 ???로 가려지고, 뽑은 뒤에는 이름이 보인다(일반 동물은 늘 이름이 보인다)', () => {
    const none = buildWardrobe(emptyGrowth(), current, { accessories: [], variants: [], species: ['cat'] }).species;
    expect(none.find((s) => s.id === 'azure')!.name).toBe('???');
    expect(none.find((s) => s.id === 'dragon')!.name).toBe('용'); // 전설은 이름이 보인다(히든만 가려진다)
    expect(none.filter((s) => s.id !== 'cat' && SPECIES.find((x) => x.id === s.id)!.rarity === 'hidden').every((s) => s.name === '???')).toBe(true);
    expect(none.find((s) => s.id === 'rabbit')!.name).toBe('토끼'); // 일반 동물은 못 뽑았어도 이름이 보인다
    const got = buildWardrobe(emptyGrowth(), current, { accessories: [], variants: [], species: ['cat', 'azure'] }).species;
    expect(got.find((s) => s.id === 'azure')!.name).toBe('청룡');
    expect(got.find((s) => s.id === 'qilin')!.name).toBe('???');
  });

  it('업적을 달성하면 열리고 힌트가 사라진다', () => {
    const v = buildWardrobe(withAchievements('rules-all'), current);
    expect(v.accessories.find((a) => a.id === 'crown')).toMatchObject({ unlocked: true, hint: '' });
    expect(v.accessories.find((a) => a.id === 'wings')?.unlocked).toBe(false);
  });
});

describe('allowedPatch', () => {
  it('열린 것만 남기고 잠긴 것은 버린다', () => {
    expect(allowedPatch(withAchievements('streak-7'), { variant: 'mono', accessory: 'crown' })).toEqual({ variant: 'mono' });
    expect(allowedPatch(emptyGrowth(), { accessory: 'none', variant: 'default' })).toEqual({ accessory: 'none', variant: 'default' });
  });

  it('뽑기로 얻은 꾸미기는 쓸 수 있다', () => {
    expect(allowedPatch(emptyGrowth(), { accessory: 'halo' }, { accessories: ['halo'], variants: [], species: [] })).toEqual({ accessory: 'halo' });
  });

  it('이름은 늘 받되 다듬어서 남긴다', () => {
    expect(allowedPatch(emptyGrowth(), { name: '  콩이  ' })).toEqual({ name: '콩이' });
    expect(allowedPatch(emptyGrowth(), { name: '<>' })).toEqual({ name: '' });
  });

  it('프로필 카드 동물은 가진 동물이나 current 만 받는다', () => {
    const extra = { accessories: [], variants: [], species: ['dog' as const] };
    expect(allowedPatch(emptyGrowth(), { cardSpecies: 'dog' }, extra)).toEqual({ cardSpecies: 'dog' });
    expect(allowedPatch(emptyGrowth(), { cardSpecies: 'current' })).toEqual({ cardSpecies: 'current' });
    expect(allowedPatch(emptyGrowth(), { cardSpecies: 'penguin' }, extra)).toEqual({});
    expect(allowedPatch(emptyGrowth(), { cardSpecies: 'dog' })).toEqual({});
  });
});

describe('카드에 그릴 동물', () => {
  it('고른 동물을 가지고 있으면 그 동물, 아니면 지금 키우는 동물', () => {
    expect(cardSpeciesOf('current', 'cat', ['cat', 'dog'])).toBe('cat');
    expect(cardSpeciesOf('dog', 'cat', ['cat', 'dog'])).toBe('dog');
    expect(cardSpeciesOf('penguin', 'cat', ['cat', 'dog'])).toBe('cat'); // 없는 동물
  });
});

describe('보상', () => {
  it('방금 달성한 업적이 연 색·장식을 알려 준다', () => {
    expect(rewardsFor(['rules-all'])).toEqual({ variants: [], accessories: ['crown'] });
    expect(rewardsFor(['first-fix'])).toEqual({ variants: ['pastel'], accessories: [] });
    expect(rewardsFor(['tips-all'])).toEqual({ variants: [], accessories: [] });
    expect(rewardsFor(['tips-10', 'streak-3', 'quiz-25', 'streak-30'])).toEqual({ variants: [], accessories: ['sprout', 'flower', 'partyhat', 'halo'] });
  });

  it('보상 문구: 장식, 색 순서로 이름을 붙이고 없으면 빈 문자열', () => {
    expect(rewardText(rewardsFor(['rules-all']))).toBe('새로 받았어요: 왕관');
    expect(rewardText(rewardsFor(['fix-30', 'first-fix']))).toBe('새로 받았어요: 날개, 파스텔 색');
    expect(rewardText(rewardsFor(['tips-all']))).toBe('');
    expect(rewardText(rewardsFor(['streak-3']))).toBe('새로 받았어요: 꽃');
  });
});

describe('모습(성장 단계) 고르기', () => {
  const base = { speciesId: 'cat' as const, variant: 'default' as const, accessory: 'none' as const };
  const stageOf = (stage: 'egg' | 'baby' | 'adult' | 'legend', speciesId: 'cat' | 'dragon' = 'cat') =>
    buildWardrobe(emptyGrowth(), { ...base, speciesId }, { accessories: [], variants: [], species: [speciesId], stage }).stages;

  it('자동 + 지나온 단계만 열려 있다', () => {
    const adult = stageOf('adult');
    expect(adult.map((s) => [s.id, s.unlocked])).toEqual([['auto', true], ['baby', true], ['adult', true]]);
    const baby = stageOf('baby');
    expect(baby.map((s) => [s.id, s.unlocked])).toEqual([['auto', true], ['baby', true], ['adult', false]]);
    expect(baby.find((s) => s.id === 'adult')!.hint).toContain('지나오지');
  });

  it('알은 자동만 열려 있다(새끼·성체로 돌릴 수 없다)', () => {
    expect(stageOf('egg').filter((s) => s.unlocked).map((s) => s.id)).toEqual(['auto']);
  });

  it('전설 단계는 히든 동물에게만 보이고, 전설에 이르렀을 때만 열린다', () => {
    expect(stageOf('adult').some((s) => s.id === 'legend')).toBe(false);
    expect(stageOf('adult', 'dragon').find((s) => s.id === 'legend')!.unlocked).toBe(false);
    expect(stageOf('legend', 'dragon').map((s) => [s.id, s.unlocked])).toEqual([['auto', true], ['baby', true], ['adult', true], ['legend', true]]);
  });

  it('allowedPatch: 지나온 단계로만 돌릴 수 있다', () => {
    const extra = (stage: 'egg' | 'baby' | 'adult' | 'legend') => ({ accessories: [], variants: [], species: [], stage });
    expect(allowedPatch(emptyGrowth(), { displayStage: 'baby' }, extra('adult'))).toEqual({ displayStage: 'baby' });
    expect(allowedPatch(emptyGrowth(), { displayStage: 'adult' }, extra('adult'))).toEqual({ displayStage: 'adult' });
    expect(allowedPatch(emptyGrowth(), { displayStage: 'adult' }, extra('baby'))).toEqual({});
    expect(allowedPatch(emptyGrowth(), { displayStage: 'legend' }, extra('adult'))).toEqual({});
    expect(allowedPatch(emptyGrowth(), { displayStage: 'baby' }, extra('egg'))).toEqual({});
    expect(allowedPatch(emptyGrowth(), { displayStage: 'auto' }, extra('egg'))).toEqual({ displayStage: 'auto' });
  });
});

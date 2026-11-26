import { describe, expect, it } from 'vitest';
import { LEVEL_TIERS, createPet, gainXp, levelTier, tierIndexOf, type PetState } from './pet.js';
import { barLevelOf, buildStatus } from './status.js';

const NOW = 1_000_000;
const xpFor = (level: number): number => 10 * (level - 1) ** 2;
const pet = (over: Partial<PetState> = {}): PetState => ({ ...createPet('chick', NOW), xp: 302, hunger: 67.8, happiness: 98.2, clean: 99.9, ...over });

describe('레벨 등급(10 레벨마다 색이 바뀐다)', () => {
  it('1~9 새내기, 10~19 숙련, 20~29 베테랑, 30~39 달인, 40~49 명인, 50 이상 신화', () => {
    const names = (lv: number) => levelTier(lv).name;
    expect([1, 9].map(names)).toEqual(['새내기', '새내기']);
    expect([10, 19].map(names)).toEqual(['숙련', '숙련']);
    expect([20, 29].map(names)).toEqual(['베테랑', '베테랑']);
    expect([30, 39].map(names)).toEqual(['달인', '달인']);
    expect([40, 49].map(names)).toEqual(['명인', '명인']);
    expect([50, 99, 500].map(names)).toEqual(['신화', '신화', '신화']);
  });

  it('등급마다 색이 모두 다르고, 레벨이 이상해도(0·음수) 첫 등급이다', () => {
    expect(new Set(LEVEL_TIERS.map((t) => t.color)).size).toBe(LEVEL_TIERS.length);
    expect(tierIndexOf(0)).toBe(0);
    expect(tierIndexOf(-5)).toBe(0);
  });

  it('등급이 오르는 레벨(10·20…)이 되면 "등급이 되었어요" 안내가 붙고, 그 밖의 레벨업에는 없다', () => {
    const at = (level: number) => ({ ...createPet('cat', NOW), xp: xpFor(level) });
    const up10 = gainXp(at(9), xpFor(10) - xpFor(9));
    expect(up10.note).toContain('레벨 10');
    expect(up10.note).toContain("'숙련' 등급");
    expect(gainXp(at(10), xpFor(11) - xpFor(10)).note).not.toContain('등급');
    expect(gainXp(at(19), xpFor(20) - xpFor(19)).note).toContain("'베테랑' 등급");
    expect(gainXp(at(49), xpFor(50) - xpFor(49)).note).toContain("'신화' 등급");
    expect(gainXp(at(50), xpFor(51) - xpFor(50)).note).not.toContain('등급');
  });
});

describe('상태 보기 값', () => {
  it('제목·레벨·등급과 막대 네 줄(경험치·배부름·기분·청결)을 만든다', () => {
    const s = buildStatus(pet(), '콩이');
    expect(s.title).toBe('콩이(병아리) · 성체');
    expect(s.level).toBe(6);
    expect(s.tier.name).toBe('새내기');
    expect(s.xp).toBe(302);
    expect(s.bars.map((b) => b.kind)).toEqual(['xp', 'hunger', 'happiness', 'clean']);
    expect(s.bars.map((b) => b.label)).toEqual(['경험치', '배부름', '기분', '청결']);
  });

  it('경험치 막대: 지금 레벨 안에서 쌓은 양/다음 레벨까지 필요한 양, 등급 색', () => {
    const xp = buildStatus(pet()).bars[0]!; // 302 = 레벨 6(250~360)
    expect(xp.text).toBe('52/110');
    expect(xp.value).toBe(47);
    expect(xp.color).toBe(levelTier(6).color);
    const high = buildStatus(pet({ xp: xpFor(12) + 5 })).bars[0]!;
    expect(high.color).toBe(levelTier(12).color);
    expect(high.color).not.toBe(xp.color);
  });

  it('나머지 막대는 소수를 버린 정수 0~100 과 "값/100" 이고, 범위 밖 값도 안전하다', () => {
    const [, hunger, happy, clean] = buildStatus(pet()).bars;
    expect([hunger!.value, happy!.value, clean!.value]).toEqual([67, 98, 99]);
    expect(hunger!.text).toBe('67/100');
    const odd = buildStatus(pet({ hunger: -5, happiness: 250, clean: Number.NaN })).bars;
    expect(odd[1]!.value).toBe(0);
    expect(odd[2]!.value).toBe(100);
  });

  it('막대 색: 30 미만 빨강, 60 미만 노랑, 그 이상 초록', () => {
    expect([0, 29, 30, 59, 60, 100].map(barLevelOf)).toEqual(['low', 'low', 'mid', 'mid', 'high', 'high']);
  });

  it('알은 이름을 숨기고, 돌려 둔 모습이 있으면 그 단계 이름을 보여 준다(레벨·경험치는 그대로)', () => {
    expect(buildStatus({ ...createPet('cat', NOW), xp: 3 }, '콩이').title).toBe('알 · 알');
    const adult = { ...createPet('cat', NOW), xp: 300 };
    expect(buildStatus(adult, '', 'baby').title).toBe('고양이 · 새끼');
    expect(buildStatus(adult, '', 'baby').level).toBe(buildStatus(adult).level);
    expect(buildStatus(adult, '', 'legend').title).toBe('고양이 · 성체'); // 안 지나온 단계는 지금 단계
  });
});

import { describe, expect, it } from 'vitest';
import { applyEvent, emptyGrowth, type Growth } from './growth.js';
import { renderProfileCard, xpProgress } from './card.js';
import { createPet } from './pet.js';
import { DEFAULT_STYLE, SPECIES, type PetStyle } from './species.js';

const NOW = new Date(2026, 10, 26, 12).getTime();
const pet = (xp: number, speciesId: 'rabbit' | 'cat' = 'rabbit') => ({ ...createPet(speciesId, NOW), xp });
const input = (over: Partial<Parameters<typeof renderProfileCard>[0]> = {}) => ({
  pet: pet(302),
  growth: emptyGrowth(),
  style: DEFAULT_STYLE as PetStyle,
  tipsSeen: 0,
  now: NOW,
  ...over,
});

describe('xpProgress', () => {
  it('레벨 n 은 경험치 10*(n-1)^2 부터이고, 지금 레벨 안에서의 진행을 돌려준다', () => {
    expect(xpProgress(0)).toEqual({ level: 1, into: 0, need: 10 });
    expect(xpProgress(10)).toEqual({ level: 2, into: 0, need: 30 }); // 10 ~ 40
    expect(xpProgress(25)).toEqual({ level: 2, into: 15, need: 30 });
    expect(xpProgress(302)).toEqual({ level: 6, into: 52, need: 110 }); // 250 ~ 360
  });
});

describe('renderProfileCard', () => {
  it('SVG 한 장을 돌려주고 크기·접근성 설명이 있다', () => {
    const svg = renderProfileCard(input());
    expect(svg.startsWith('<svg ')).toBe(true);
    expect(svg.trimEnd().endsWith('</svg>')).toBe(true);
    expect(svg).toContain('width="560" height="180"');
    expect(svg).toContain('role="img"');
    expect(svg).toContain('aria-label="rabbit adult, level 6, 0 of 19 lessons learned"');
  });

  it('펫 그림(rect)과 레벨·경험치·기록 글자가 들어 있다', () => {
    const svg = renderProfileCard(input({ tipsSeen: 5 }));
    expect((svg.match(/<rect /g) ?? []).length).toBeGreaterThan(40);
    expect(svg).toContain('LV 6');
    expect(svg).toContain('XP 302 · NEXT LV 58');
    for (const label of ['STREAK', 'LESSONS', 'BADGES', 'FIXED']) expect(svg).toContain(label);
    expect(svg).toContain('RABBIT');
    expect(svg).toContain('ADULT');
  });

  it('기록을 반영한다(배운 규칙·업적·고친 문제·연속 일수)', () => {
    let g: Growth = emptyGrowth();
    const at = (d: number) => new Date(2026, 10, d, 12).getTime();
    for (const d of [25, 26]) g = applyEvent(g, { kind: 'care', care: 'touch' }, at(d), { tipsSeen: 0 }).growth;
    g = applyEvent(g, { kind: 'confirm', ruleId: 'img-alt', correct: true }, at(26), { tipsSeen: 0 }).growth;
    g = applyEvent(g, { kind: 'fix', ruleId: 'img-alt' }, at(26), { tipsSeen: 0 }).growth;
    const svg = renderProfileCard(input({ growth: g }));
    expect(svg).toContain('>2D<'); // 25일, 26일 연속
    expect(svg).toContain('>1/19<');
    expect(svg).toMatch(/>\d+\/17</);
    expect(svg).toContain('>1<'); // 고친 문제 1개
  });

  it('알이면 알 모습이고, 장식과 색 변형이 그림에 반영된다', () => {
    const egg = renderProfileCard(input({ pet: pet(3) }));
    expect(egg).toContain('EGG');
    const plain = renderProfileCard(input());
    const crown = renderProfileCard(input({ style: { variant: 'default', accessory: 'crown' } }));
    expect(crown).not.toBe(plain);
    expect(crown).toContain('RABBIT · CROWN');
    const pastel = renderProfileCard(input({ style: { variant: 'pastel', accessory: 'none' } }));
    expect(pastel).not.toBe(plain);
  });

  it('모든 동물로 만들 수 있다(올바른 XML 모양, 닫히지 않은 따옴표 없음)', () => {
    for (const s of SPECIES) {
      const svg = renderProfileCard(input({ pet: { ...pet(302), speciesId: s.id } }));
      expect(svg, s.id).toContain(s.id.toUpperCase());
      expect((svg.match(/"/g) ?? []).length % 2, s.id).toBe(0);
      expect(svg, s.id).not.toMatch(/undefined|NaN/);
    }
  });

  it('경험치 막대는 0~100% 안에 있다(막대 폭이 칸을 넘지 않는다)', () => {
    for (const xp of [0, 9, 10, 39, 40, 5000]) {
      const svg = renderProfileCard(input({ pet: pet(xp) }));
      const widths = [...svg.matchAll(/<rect x="286" y="46" width="(\d+)" height="14"/g)].map((m) => Number(m[1]));
      expect(Math.max(...widths), String(xp)).toBeLessThanOrEqual(240);
    }
  });

  it('같은 입력이면 같은 SVG 를 만든다(결과가 흔들리지 않아 커밋 diff 가 깨끗하다)', () => {
    expect(renderProfileCard(input())).toBe(renderProfileCard(input()));
  });
});

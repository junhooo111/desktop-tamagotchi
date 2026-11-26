import { describe, expect, it } from 'vitest';
import { renderProfileCard, xpProgress } from './card.js';
import { buildCodex, emptyGrowth } from './growth.js';
import { createPet } from './pet.js';
import { DEFAULT_STYLE, SPECIES, type PetStyle } from './species.js';

const NOW = new Date(2026, 10, 26, 12).getTime();
const pet = (xp: number, speciesId: 'rabbit' | 'cat' = 'rabbit') => ({
  ...createPet(speciesId, NOW),
  xp,
});
const input = (over: Partial<Parameters<typeof renderProfileCard>[0]> = {}) => ({
  pet: pet(302),
  style: DEFAULT_STYLE as PetStyle,
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

describe('renderProfileCard: 마을을 돌아다니는 카드', () => {
  it('SVG 한 장이고 크기·접근성 설명이 있다(펫은 앱과 같은 32px)', () => {
    const svg = renderProfileCard(input());
    expect(svg.startsWith('<svg ')).toBe(true);
    expect(svg.trimEnd().endsWith('</svg>')).toBe(true);
    expect(svg).toContain('width="420" height="190"');
    expect(svg).toContain('role="img"');
    expect(svg).toContain('aria-label="rabbit adult, level 6, walking around its house"');
    // 그림 한 칸이 1px 이라 칸 rect 는 폭·높이가 정수이고 32칸 안에 있다
    expect(svg).toMatch(/<g id="w1"><rect x="\d+" y="\d+" width="\d+" height="1"/);
  });

  it('이름·단계·레벨·경험치가 정보줄에 있다', () => {
    const svg = renderProfileCard(input());
    expect(svg).toContain('>RABBIT<');
    expect(svg).toContain('>ADULT<');
    expect(svg).toContain('>LV 6<');
    expect(svg).toContain('>52/110<');
  });

  it('도감·업적 기록을 칸으로 보여 준다', () => {
    const g = emptyGrowth();
    g.days = ['2026-11-25', '2026-11-26'];
    g.counters = { confirms: 6, fixes: 12, quizCorrect: 4, tips: 5, care: 53 };
    g.rules = { 'img-alt': { confirms: 2, fixes: 1 } } as typeof g.rules;
    const codex = buildCodex(g, { tipsSeen: 7 }, new Date(2026, 10, 26, 12).getTime());
    const svg = renderProfileCard(input({ codex }));
    for (const k of ['STREAK', 'CODEX', 'BADGES', 'FIXED', 'QUIZ', 'TIPS']) expect(svg, k).toContain(`>${k}<`);
    expect(svg).toContain('>2D<');
    expect(svg).toContain('>12<'); // FIXED
    expect(svg).toContain('>4<'); // QUIZ
    expect(svg).toContain(`>1/${codex.rulesTotal}<`);
    expect(svg).toContain(`>7/${codex.tipsTotal}<`);
  });

  it('이름이 있으면 종 이름 대신 크게 보여 주고 종·단계는 옆에 작게 둔다', () => {
    const svg = renderProfileCard(input({ name: '콩이' }));
    expect(svg).toContain('>콩이<');
    expect(svg).toContain('>RABBIT ADULT<');
    expect(svg).toContain('aria-label="콩이, rabbit adult');
    expect(renderProfileCard(input({ name: '<b>&' }))).not.toContain('<b>&');
  });

  it('이름이 비어 있으면 종 이름을 크게 보여 준다', () => {
    expect(renderProfileCard(input({ name: '  ' }))).toContain('>RABBIT<');
  });

  it('기록을 안 주면 기록 없는 상태로 그린다', () => {
    const svg = renderProfileCard(input());
    expect(svg).toContain('>0D<');
    expect(svg).toContain('>0/');
  });

  it('걷기 4장·앉기 2장·자기 2장 그림을 한 번씩만 정의하고, 걷기는 세 구간과 돌아오는 길(뒤집음)에 다시 쓴다', () => {
    const svg = renderProfileCard(input());
    for (const id of ['w1', 'w2', 'w3', 'w4', 's1', 's2', 'z1', 'z2']) {
      expect((svg.match(new RegExp(`id="${id}"`, 'g')) ?? []).length, id).toBe(1);
    }
    expect((svg.match(/href="#w1"/g) ?? []).length).toBe(3); // 올라가기 + 내려가기 + 돌아오기
    expect(svg).toContain('scale(-1,1)');
  });

  it('계단·집·창문이 그려진다', () => {
    const svg = renderProfileCard(input());
    expect(svg).toContain('class="lit"'); // 창문 불
    expect(svg).toContain('class="houseZ"'); // 집에서 자는 z
    // 계단 3칸 + 위쪽 단 + 내려가는 계단 3칸의 색(stone)이 7덩어리
    expect((svg.match(/fill="#3a3f6e"/g) ?? []).length).toBe(7);
  });

  it('CSS 애니메이션(걷기 프레임·세 걷기 구간·앉기·졸기·불 켜기)이 들어 있다', () => {
    const svg = renderProfileCard(input());
    for (const k of ['mvUp', 'mvDown', 'mvBack', 'showSit', 'showSleep', 'showLit', 'on4', 'on2', 'zfloat']) expect(svg, k).toContain(`@keyframes ${k}`);
    expect(svg).toContain('animation:on4 0.6s step-end infinite');
  });

  it('움직임 줄이기 설정을 존중한다(애니메이션을 끄고 출발 자리에 선다)', () => {
    const svg = renderProfileCard(input());
    expect(svg).toContain('prefers-reduced-motion:reduce');
    expect(svg).toContain('*{animation:none!important}');
    expect(svg).toContain('.mUp{opacity:1!important}');
  });

  it('이동량이 카드 안이다(계단 오르내림은 위로 올라가고, 집 문 앞까지만 간다)', () => {
    const svg = renderProfileCard(input());
    const moves = [...svg.matchAll(/translate\((-?[\d.]+)px,(-?[\d.]+)px\)/g)].map((m) => ({ x: Number(m[1]), y: Number(m[2]) }));
    expect(moves.length).toBeGreaterThan(10);
    for (const m of moves) {
      expect(m.x + 14 + 32 + 14).toBeLessThanOrEqual(420); // 오른쪽 여백까지
      expect(m.x).toBeGreaterThanOrEqual(0);
      expect(m.y).toBeLessThanOrEqual(0);
      expect(m.y).toBeGreaterThanOrEqual(-32); // 위쪽 단 높이
    }
    expect(moves.some((m) => m.y === -32)).toBe(true);
    expect(moves.some((m) => m.y === 0)).toBe(true);
  });

  it('한 바퀴 안에서 구간(올라가기→앉기→내려가기→집→돌아오기→졸기)이 순서대로 이어진다', () => {
    const svg = renderProfileCard(input());
    const pctsOf = (name: string): number[] => {
      const body = svg.match(new RegExp(`@keyframes ${name}\\{(.*?)\\}\\}`))?.[0] ?? '';
      return [...body.matchAll(/([\d.]+)%\{opacity:1/g)].map((m) => Number(m[1]));
    };
    const up = pctsOf('mvUp');
    const sit = pctsOf('showSit');
    const down = pctsOf('mvDown');
    const lit = pctsOf('showLit');
    const back = pctsOf('mvBack');
    const sleep = pctsOf('showSleep');
    expect(Math.max(...up)).toBeLessThanOrEqual(Math.min(...sit) + 0.01);
    expect(Math.max(...sit)).toBeLessThanOrEqual(Math.min(...down) + 0.01);
    expect(Math.max(...down)).toBeLessThanOrEqual(Math.min(...lit) + 0.01);
    expect(Math.max(...lit)).toBeLessThanOrEqual(Math.min(...back) + 0.01);
    expect(Math.max(...back)).toBeLessThanOrEqual(Math.min(...sleep) + 0.01);
  });

  it('장식과 색 변형이 그림에 반영된다(내 펫의 모습 그대로)', () => {
    const plain = renderProfileCard(input());
    expect(renderProfileCard(input({ style: { variant: 'default', accessory: 'crown' } }))).not.toBe(plain);
    expect(renderProfileCard(input({ style: { variant: 'pastel', accessory: 'none' } }))).not.toBe(plain);
  });

  it('모든 동물로 만들 수 있고, 안전한 SVG 다(스크립트·외부 주소 없음, 따옴표 짝 맞음, 크기 적당)', () => {
    for (const s of SPECIES) {
      const svg = renderProfileCard(input({ pet: { ...pet(302), speciesId: s.id } }));
      expect(svg, s.id).toContain(s.id.toUpperCase());
      expect((svg.match(/"/g) ?? []).length % 2, s.id).toBe(0);
      expect(svg, s.id).not.toMatch(/undefined|NaN/);
      expect(svg, s.id).not.toMatch(/<script|onload=|javascript:|https?:\/\/(?!www\.w3\.org)/i);
      expect(svg.length, s.id).toBeLessThan(120_000);
    }
  });

  it('알이나 새끼도 만들어진다', () => {
    expect(renderProfileCard(input({ pet: pet(3) }))).toContain('>LV 1<');
    expect(renderProfileCard(input({ pet: pet(30) }))).toContain('>LV 2<');
  });

  it('같은 입력이면 같은 SVG 를 만든다(커밋 diff 가 깨끗하다)', () => {
    expect(renderProfileCard(input())).toBe(renderProfileCard(input()));
  });
});

import { describe, expect, it } from 'vitest';
import { renderProfileCard, xpProgress } from './card.js';
import { createPet } from './pet.js';
import { DEFAULT_STYLE, SPECIES, type PetStyle } from './species.js';

const NOW = new Date(2026, 10, 26, 12).getTime();
const pet = (xp: number, speciesId: 'rabbit' | 'cat' = 'rabbit') => ({ ...createPet(speciesId, NOW), xp });
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

describe('renderProfileCard: 움직이는 카드', () => {
  it('SVG 한 장이고 크기·접근성 설명이 있다', () => {
    const svg = renderProfileCard(input());
    expect(svg.startsWith('<svg ')).toBe(true);
    expect(svg.trimEnd().endsWith('</svg>')).toBe(true);
    expect(svg).toContain('width="560" height="140"');
    expect(svg).toContain('role="img"');
    expect(svg).toContain('aria-label="rabbit adult, level 6, running around"');
  });

  it('이름표(종·레벨)만 보여 주고 기록 숫자는 넣지 않는다', () => {
    const svg = renderProfileCard(input());
    expect(svg).toContain('>RABBIT<');
    expect(svg).toContain('>LV 6<');
    for (const gone of ['STREAK', 'LESSONS', 'BADGES', 'FIXED', 'XP ']) expect(svg, gone).not.toContain(gone);
  });

  it('걷기 4장·앉기 2장·자기 2장 그림을 한 번씩만 정의하고, 걷기는 오른쪽·왼쪽(뒤집음)으로 다시 쓴다', () => {
    const svg = renderProfileCard(input());
    for (const id of ['w1', 'w2', 'w3', 'w4', 's1', 's2', 'z1', 'z2']) {
      expect((svg.match(new RegExp(`id="${id}"`, 'g')) ?? []).length, id).toBe(1);
    }
    expect((svg.match(/href="#w1"/g) ?? []).length).toBe(2); // 오른쪽으로 걷기 + 왼쪽으로 걷기
    expect(svg).toContain('scale(-1,1)'); // 왼쪽을 보게 뒤집은 것
  });

  it('CSS 애니메이션(걷기 프레임 전환·이동·앉기·졸기)이 들어 있다', () => {
    const svg = renderProfileCard(input());
    for (const k of ['runR', 'runL', 'showSit', 'showSleep', 'on4', 'on2', 'zfloat']) expect(svg, k).toContain(`@keyframes ${k}`);
    expect(svg).toContain('animation:runR 16s linear infinite');
    expect(svg).toContain('animation:on4 0.6s step-end infinite');
  });

  it('움직임 줄이기 설정을 존중한다(애니메이션을 끄고 한 장면으로 선다)', () => {
    const svg = renderProfileCard(input());
    expect(svg).toContain('prefers-reduced-motion:reduce');
    expect(svg).toContain('*{animation:none!important}');
  });

  it('펫이 오른쪽 끝에서 카드 밖으로 나가지 않는다(이동 거리 + 그림 폭이 카드 안)', () => {
    const svg = renderProfileCard(input());
    const moves = [...svg.matchAll(/translateX\((\d+)px\)/g)].map((m) => Number(m[1]));
    expect(Math.max(...moves) + 96 + 14).toBeLessThanOrEqual(560);
    expect(svg).toContain('translateX(0)'); // 왼쪽 끝
  });

  it('한 바퀴 안에서 구간(걷기→앉기→걷기→졸기)이 겹치지 않고 이어진다', () => {
    const svg = renderProfileCard(input());
    // runR 0~38, showSit 38~50, runL 50~88, showSleep 88~100
    expect(svg).toContain('38%{opacity:1;transform');
    expect(svg).toMatch(/@keyframes showSit\{0%\{opacity:0\}37\.99%\{opacity:0\}38%\{opacity:1\}50%\{opacity:1\}50\.01%\{opacity:0\}100%\{opacity:0\}\}/);
    expect(svg).toMatch(/@keyframes showSleep\{0%\{opacity:0\}87\.99%\{opacity:0\}88%\{opacity:1\}100%\{opacity:1\}\}/);
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

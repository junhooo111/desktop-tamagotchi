import { describe, expect, it } from 'vitest';
import { renderProfileCard } from './card.js';
import { ADULT_LEVEL, LEGEND_LEVEL, createPet, gainXp, levelOf, stageOf, statusText } from './pet.js';
import { HIDDEN_SPECIES, SPECIES, spriteSet } from './species.js';

const NOW = 1_000_000;
const xpFor = (level: number): number => 10 * (level - 1) ** 2;
const at = (speciesId: 'cat' | 'dragon', level: number) => ({ ...createPet(speciesId, NOW), xp: xpFor(level) });

describe('진화 단계', () => {
  it('일반 동물은 알 → 새끼 → 성체까지, 히든 동물은 성체 다음에 전설 단계가 더 있다', () => {
    expect(stageOf(at('cat', 1))).toBe('egg');
    expect(stageOf(at('cat', 2))).toBe('egg'); // 경험치 20(HATCH_XP)이 돼야 부화한다
    expect(stageOf(at('cat', 3))).toBe('baby');
    expect(stageOf(at('cat', ADULT_LEVEL))).toBe('adult');
    expect(stageOf(at('cat', 50))).toBe('adult'); // 일반 동물은 아무리 커도 성체
    expect(stageOf(at('dragon', ADULT_LEVEL))).toBe('adult');
    expect(stageOf(at('dragon', LEGEND_LEVEL - 1))).toBe('adult');
    expect(stageOf(at('dragon', LEGEND_LEVEL))).toBe('legend');
    expect(levelOf(xpFor(LEGEND_LEVEL))).toBe(LEGEND_LEVEL);
  });

  it('히든 동물이 전설 레벨이 되면 진화했다고 알린다(일반 동물은 레벨만 알린다)', () => {
    const before = at('dragon', LEGEND_LEVEL - 1);
    const evolved = gainXp(before, xpFor(LEGEND_LEVEL) - before.xp);
    expect(evolved.note).toContain('전설');
    expect(evolved.note).toContain('용');
    const cat = at('cat', LEGEND_LEVEL - 1);
    expect(gainXp(cat, xpFor(LEGEND_LEVEL) - cat.xp).note).not.toContain('전설');
  });

  it('상태 보기에 전설 단계가 나온다', () => {
    expect(statusText(at('dragon', LEGEND_LEVEL))).toContain('용 · 전설');
  });
});

describe('히든 동물 그림', () => {
  it('모든 히든 동물이 새끼·성체·전설 모습이 서로 다르다', () => {
    for (const s of HIDDEN_SPECIES) {
      const [baby, adult, legend] = (['baby', 'adult', 'legend'] as const).map((st) => spriteSet(s.id, st).frames.idleA.join('\n'));
      expect(new Set([baby, adult, legend]).size, s.id).toBe(3);
    }
  });

  it('히든 동물끼리, 그리고 일반 동물과도 겉모습이 구별된다', () => {
    const looks = SPECIES.map((s) => spriteSet(s.id, 'adult').frames.idleA.join('\n') + JSON.stringify(spriteSet(s.id, 'adult').palette));
    expect(new Set(looks).size).toBe(SPECIES.length);
  });

  it('뿔은 용·청룡·기린에만, 몸 날개는 전설 단계에서 돋는다', () => {
    const hasP = (id: Parameters<typeof spriteSet>[0], stage: 'adult' | 'legend') => spriteSet(id, stage).frames.idleA.join('').includes('p');
    expect(hasP('dragon', 'adult')).toBe(true); // 금빛 뿔
    expect(hasP('azure', 'adult')).toBe(true);
    expect(hasP('qilin', 'adult')).toBe(true);
    expect(hasP('whitetiger', 'adult')).toBe(false); // 뿔도 날개도 없다
    expect(hasP('whitetiger', 'legend')).toBe(true); // 전설이 되면 금빛 날개가 돋는다
    expect(hasP('tortoise', 'legend')).toBe(true);
  });

  it('전설 단계도 꾸미기 장식이 따라다닌다(날개 장식이면 장식 날개가 우선)', () => {
    const crowned = spriteSet('dragon', 'legend', { variant: 'default', accessory: 'crown' });
    for (const rows of Object.values(crowned.frames)) expect(rows.join(''), '왕관').toMatch(/X|Y|p/);
    const withWings = spriteSet('dragon', 'legend', { variant: 'default', accessory: 'wings' });
    expect(withWings.frames.idleA.join('')).toContain('X'); // 장식 날개(파란색)가 그려진다
  });
});

describe('프로필 카드에서도 보인다', () => {
  it('전설 단계 카드는 LEGEND 로 표시되고 SVG 가 만들어진다', () => {
    const svg = renderProfileCard({ pet: at('dragon', LEGEND_LEVEL), style: { variant: 'default', accessory: 'none' } });
    expect(svg).toContain('>DRAGON<');
    expect(svg).toContain('>LEGEND<');
    expect(svg).not.toMatch(/undefined|NaN/);
  });

  it('모든 히든 동물로 카드를 만들 수 있다', () => {
    for (const s of HIDDEN_SPECIES) {
      for (const level of [3, ADULT_LEVEL, LEGEND_LEVEL]) {
        const svg = renderProfileCard({ pet: { ...createPet(s.id, NOW), xp: xpFor(level) }, style: { variant: 'default', accessory: 'none' } });
        expect(svg, `${s.id} Lv${level}`).toContain(s.id.toUpperCase());
        expect(svg.length).toBeLessThan(150_000);
      }
    }
  });
});

describe('히든 동물의 특징 부품', () => {
  const count = (id: Parameters<typeof spriteSet>[0], stage: 'baby' | 'adult' | 'legend', ch: string, frame: 'idleA' | 'walk2' | 'sitA' = 'idleA') =>
    spriteSet(id, stage).frames[frame].join('').split(ch).length - 1;

  it('백호는 일반 고양이보다 검은 줄무늬(a)가 훨씬 많다(이마·볼·몸·꼬리)', () => {
    for (const frame of ['idleA', 'walk2', 'sitA'] as const) {
      expect(count('whitetiger', 'adult', 'a', frame), frame).toBeGreaterThan(count('cat', 'adult', 'a', frame) + 12);
    }
  });

  it('용은 등에 가시(a)와 금빛 뿔·날개(p)가 있다', () => {
    expect(count('dragon', 'adult', 'a')).toBeGreaterThan(10);
    expect(count('dragon', 'adult', 'p')).toBeGreaterThan(20);
  });

  it('청룡은 갈라진 뿔과 긴 수염(p)과 지느러미(i)가 있고 날개는 없다 — 용과 구별된다', () => {
    const dragon = spriteSet('dragon', 'adult');
    const azure = spriteSet('azure', 'adult');
    expect(count('azure', 'adult', 'i')).toBeGreaterThan(6); // 등 지느러미
    expect(count('azure', 'adult', 'p')).toBeGreaterThan(10); // 뿔·수염
    expect(count('azure', 'adult', 'p')).toBeLessThan(count('dragon', 'adult', 'p')); // 날개가 없어서 금빛 덩어리가 적다
    expect(azure.palette['f']).not.toBe(dragon.palette['f']);
    expect(azure.frames.idleA.join('\n')).not.toEqual(dragon.frames.idleA.join('\n'));
  });

  it('기린은 외뿔(p)·불꽃 갈기(i)·발굽(a)이 있다', () => {
    expect(count('qilin', 'adult', 'p')).toBeGreaterThanOrEqual(4);
    expect(count('qilin', 'adult', 'i')).toBeGreaterThan(10);
    const feet = spriteSet('qilin', 'adult').frames.idleA.slice(-3).join('');
    expect(feet).toContain('a');
  });

  it('눈은 수염·갈기·뿔에 가려지지 않는다(모든 히든·모든 단계의 서 있는 그림)', () => {
    for (const s of HIDDEN_SPECIES) {
      for (const stage of ['baby', 'adult', 'legend'] as const) {
        expect(count(s.id, stage, 'e'), `${s.id} ${stage}`).toBeGreaterThanOrEqual(2);
      }
    }
  });
});

import { describe, expect, it } from 'vitest';
import { SIZE } from './pixel.js';
import {
  EGG,
  FRAME_NAMES,
  SPECIES,
  frameToRgba,
  getSpecies,
  isSpeciesId,
  type SpriteSet,
} from './species.js';

const sets: [string, SpriteSet][] = [['egg', EGG], ...SPECIES.map((s): [string, SpriteSet] => [s.id, s])];
const animals: [string, SpriteSet][] = SPECIES.map((s): [string, SpriteSet] => [s.id, s]);

describe('스프라이트 데이터', () => {
  it('사용자가 고른 6종이 모두 있다', () => {
    expect(SPECIES.map((s) => s.name)).toEqual(['토끼', '고양이', '강아지', '거북이', '병아리', '오리']);
  });

  it.each(sets)('%s: 모든 프레임이 16x16이고 팔레트에 없는 문자를 쓰지 않으며 윤곽선이 있다', (_n, set) => {
    for (const name of FRAME_NAMES) {
      const rows = set.frames[name];
      expect(rows, name).toHaveLength(SIZE);
      for (const row of rows) {
        expect(row, name).toHaveLength(SIZE);
        for (const ch of row) expect(ch === '.' || ch in set.palette, `${name}: '${ch}'`).toBe(true);
      }
      expect(rows.join(''), name).toContain('k');
    }
  });

  it.each(sets)('%s: 팔레트 색은 #rrggbb 형식이다', (_n, set) => {
    for (const hex of Object.values(set.palette)) expect(hex).toMatch(/^#[0-9a-f]{6}$/i);
  });

  it.each(sets)('%s: 서 있는 그림은 맨 아래 줄까지 닿는다(바닥에 붙는다)', (_n, set) => {
    expect(set.frames.stand[SIZE - 1]).toContain('k');
  });

  it.each(animals)('%s: 걷기·뛰기·자기·매달리기가 서 있는 그림과 다르게 움직인다', (_n, set) => {
    const f = set.frames;
    expect(f.walkA).not.toEqual(f.stand);
    expect(f.walkB).not.toEqual(f.stand);
    expect(f.walkA).not.toEqual(f.walkB);
    expect(f.runA).not.toEqual(f.runB);
    expect(f.runA).not.toEqual(f.stand);
    expect(f.sleepA).not.toEqual(f.sleepB);
    expect(f.hangA).not.toEqual(f.hangB);
    expect(f.sleepA).not.toEqual(f.stand);
  });

  it.each(animals)('%s: 눈이 있고, 눈 감을 때 쓸 몸 색이 팔레트에 있다', (_n, set) => {
    for (const name of ['stand', 'sleepA', 'hangA'] as const) {
      expect(set.frames[name].join(''), name).toContain('e');
    }
    expect(set.palette[set.blink]).toBeDefined();
  });

  it('알은 걷지 않으므로 모든 프레임이 같다', () => {
    for (const name of FRAME_NAMES) expect(EGG.frames[name]).toEqual(EGG.frames.stand);
  });
});

describe('frameToRgba', () => {
  it('배율만큼 커진 RGBA 비트맵을 만들고 투명 픽셀은 알파 0이다', () => {
    const bmp = frameToRgba(EGG.frames.stand, EGG.palette, 2);
    expect(bmp.width).toBe(32);
    expect(bmp.data).toHaveLength(32 * 32 * 4);
    expect(bmp.data[3]).toBe(0);
    const opaque = Array.from({ length: 32 * 32 }, (_, i) => bmp.data[i * 4 + 3]).filter((a) => a === 255);
    expect(opaque.length).toBeGreaterThan(0);
  });
});

describe('getSpecies / isSpeciesId', () => {
  it('id로 종을 찾고, 모르는 id는 거부한다', () => {
    expect(getSpecies('cat').name).toBe('고양이');
    expect(() => getSpecies('dragon' as never)).toThrow();
    expect(isSpeciesId('cat')).toBe(true);
    expect(isSpeciesId('dragon')).toBe(false);
    expect(isSpeciesId(3)).toBe(false);
  });
});

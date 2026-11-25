import { describe, expect, it } from 'vitest';
import { mix, tone } from './color.js';
import { SHADE, basePose, makeLook, paletteOf } from './types.js';

const lum = (hex: string): number => {
  const n = parseInt(hex.slice(1), 16);
  return 0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255);
};

describe('색 계산', () => {
  it('mix 는 두 색을 비율대로 섞는다', () => {
    expect(mix('#000000', '#ffffff', 0)).toBe('#000000');
    expect(mix('#000000', '#ffffff', 1)).toBe('#ffffff');
    expect(mix('#000000', '#ffffff', 0.5)).toBe('#808080');
    expect(mix('#ff0000', '#0000ff', 0.5)).toBe('#800080');
  });

  it('tone 은 어두운 색이 더 어둡고 밝은 색이 더 밝다', () => {
    const t = tone('#f4a65e');
    expect(t.base).toBe('#f4a65e');
    expect(lum(t.dark)).toBeLessThan(lum(t.base));
    expect(lum(t.light)).toBeGreaterThan(lum(t.base));
    expect(t.dark).toMatch(/^#[0-9a-f]{6}$/);
  });

  it('그림자는 검정이 아니라 보라빛이 섞인 색이다(칙칙하지 않게)', () => {
    const rgb = (hex: string): [number, number, number] => {
      const n = parseInt(hex.slice(1), 16);
      return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    };
    const t = tone('#f4a65e');
    const [br, , bb] = rgb(t.base);
    const [dr, , db] = rgb(t.dark);
    expect(db / dr).toBeGreaterThan(bb / br); // 어두워지면서 파란 기운이 늘어난다
    expect(dr).toBeGreaterThan(100); // 검정에 가깝게 죽지 않는다
  });
});

describe('종 생김새(look)와 팔레트', () => {
  it('색을 문자열 하나만 적어도 음영이 자동으로 만들어진다', () => {
    const look = makeLook({ fur: '#aabbcc', belly: '#ffffff' });
    expect(look.fur.base).toBe('#aabbcc');
    expect(look.fur.dark).not.toBe(look.fur.base);
    expect(look.belly.base).toBe('#ffffff');
    expect(look.head.base).toBe('#aabbcc'); // 머리 색을 안 정하면 털색
  });

  it('팔레트 문자는 모든 종이 같은 뜻으로 쓴다', () => {
    const p = paletteOf(makeLook({ fur: '#aabbcc', head: '#00ff00', outline: '#112233', eye: '#050505' }));
    expect(p['k']).toBe('#112233');
    expect(p['f']).toBe('#aabbcc');
    expect(p['g']).toBe('#00ff00');
    expect(p['e']).toBe('#050505');
    expect(p['m']).toBe('#050505'); // 입은 눈과 같은 색이지만 따로 칠해서 깜빡일 때 남는다
    expect(p['w']).toBe('#ffffff');
  });

  it('음영 표의 모든 문자가 팔레트에 있다', () => {
    const p = paletteOf(makeLook({ fur: '#aabbcc' }));
    for (const [base, { dark, light }] of Object.entries(SHADE)) {
      expect(p[base], base).toBeDefined();
      expect(p[dark], dark).toBeDefined();
      expect(p[light], light).toBeDefined();
    }
  });

  it('basePose 는 기본 자세를 주고 일부만 덮어쓸 수 있다', () => {
    expect(basePose().eyes).toBe('open');
    expect(basePose({ eyes: 'closed', wing: 2 })).toMatchObject({ eyes: 'closed', wing: 2, crouch: 0, sway: 0 });
  });
});

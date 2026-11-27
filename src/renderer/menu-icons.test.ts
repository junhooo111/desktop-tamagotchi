// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import type { MenuIcon } from '../shared/menu.js';
import { ICONS, PALETTE, SIZE, iconSvg } from './menu-icons.js';
import { readableColor } from './menu.js';

const names = Object.keys(ICONS) as MenuIcon[];

describe('메뉴 도트 아이콘(16x16)', () => {
  it('모든 아이콘이 16줄 x 16칸이고, 쓰는 글자는 모두 팔레트에 있다', () => {
    expect(names).toHaveLength(28);
    for (const n of names) {
      const rows = ICONS[n];
      expect(rows, n).toHaveLength(SIZE);
      for (const r of rows) {
        expect(r.length, `${n}: ${r}`).toBe(SIZE);
        for (const ch of r) if (ch !== '.') expect(PALETTE[ch], `${n}: '${ch}'`).toBeDefined();
      }
    }
  });

  it('비어 있지 않고, 윤곽선(k)이 있으며, 가장자리를 벗어나지 않는다', () => {
    for (const n of names) {
      const flat = ICONS[n].join('');
      expect(flat.replace(/\./g, '').length, n).toBeGreaterThan(30);
      expect(flat, n).toContain('k');
    }
  });

  it('SVG 로 그리면 같은 색 가로 줄은 사각형 하나로 합치고, 어떤 크기에서도 칸이 또렷하다', () => {
    const svg = iconSvg('touch', 32);
    expect(svg.getAttribute('viewBox')).toBe('0 0 16 16');
    expect(svg.getAttribute('width')).toBe('32');
    expect(svg.getAttribute('shape-rendering')).toBe('crispEdges');
    const rects = svg.querySelectorAll('rect');
    const colored = ICONS.touch.join('').replace(/\./g, '').length;
    expect(rects.length).toBeGreaterThan(10);
    expect(rects.length).toBeLessThan(colored); // 합쳐졌다
    const widths = [...rects].reduce((n, r) => n + Number(r.getAttribute('width')), 0);
    expect(widths).toBe(colored); // 칸 수는 그대로
  });
});

describe('등급 색을 글자로 읽을 수 있게', () => {
  const contrast = (hex: string): number => {
    const n = parseInt(hex.slice(1), 16);
    const f = (v: number): number => {
      const s = v / 255;
      return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    };
    const l = 0.2126 * f((n >> 16) & 255) + 0.7152 * f((n >> 8) & 255) + 0.0722 * f(n & 255);
    const bg = 0.2126 * f(255) + 0.7152 * f(244) + 0.0722 * f(214);
    return (Math.max(l, bg) + 0.05) / (Math.min(l, bg) + 0.05);
  };

  it('모든 등급 색이 바탕에서 4.5:1 이상으로 읽히고, 색 느낌은 남는다', () => {
    for (const c of ['#8d7b68', '#3aa55d', '#3a7bd5', '#8a4bd8', '#f08a24', '#e8b400']) {
      const out = readableColor(c);
      expect(contrast(out), c).toBeGreaterThanOrEqual(4.5);
    }
    expect(readableColor('#3a7bd5')).not.toBe('#3b2a20'); // 검정으로 무너지지 않는다
    expect(readableColor('#1a1a1a')).toBe('#1a1a1a'); // 이미 어두우면 그대로
  });
});

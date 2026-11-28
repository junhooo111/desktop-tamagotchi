import { describe, expect, it } from 'vitest';
import { PROPS, PROP_COLORS, PROP_MOTION, propRows } from './props.js';

describe('소품 그림', () => {
  it.each(PROPS.filter((p) => p !== 'none'))('%s: 16칸 안에 들어가고, 쓰는 글자마다 색이 있다', (p) => {
    const rows = propRows(p);
    expect(rows.length).toBeGreaterThan(5);
    expect(rows.length).toBeLessThanOrEqual(16);
    const width = rows[0]!.length;
    expect(width).toBeLessThanOrEqual(16);
    for (const r of rows) expect(r).toHaveLength(width);
    const used = new Set(rows.join('').replaceAll('.', ''));
    for (const ch of used) expect(PROP_COLORS[p][ch], `${p}:${ch}`).toBeDefined();
    expect(PROP_MOTION[p]).toMatch(/ground|float/);
  });

  it('none 은 그림이 없다', () => {
    expect(propRows('none')).toEqual([]);
  });
});

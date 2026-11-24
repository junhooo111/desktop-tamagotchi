import { describe, expect, it } from 'vitest';
import { orientationOf, type Dir, type Surface } from './motion.js';
import { SIZE, blank, orientRows, px } from './pixel.js';

/** 머리(h)는 오른쪽 위쪽, 발(f)은 아래쪽에 하나씩 찍은 그림 */
function marker(): string[] {
  const g = blank();
  px(g, 12, 6, 'h'); // 머리: 오른쪽
  px(g, 7, 13, 'f'); // 발: 아래쪽
  return g.map((r) => r.join(''));
}

function find(rows: string[], ch: string): { x: number; y: number } {
  for (let y = 0; y < SIZE; y++) {
    const x = rows[y]?.indexOf(ch) ?? -1;
    if (x >= 0) return { x, y };
  }
  throw new Error(`${ch} 없음`);
}

function placed(surface: Surface, dir: Dir) {
  const o = orientationOf(surface, dir);
  const rows = orientRows(marker(), o.flip, o.quarter);
  return { head: find(rows, 'h'), feet: find(rows, 'f') };
}

const MID = (SIZE - 1) / 2;

describe('orientationOf', () => {
  it('바닥: 오른쪽이면 그대로, 왼쪽이면 뒤집어서 머리가 진행 방향을 본다', () => {
    const right = placed('floor', 'right');
    expect(right.head.x).toBeGreaterThan(MID);
    expect(right.feet.y).toBeGreaterThan(MID);
    const left = placed('floor', 'left');
    expect(left.head.x).toBeLessThan(MID);
    expect(left.feet.y).toBeGreaterThan(MID);
  });

  it('왼쪽 벽: 발이 왼쪽 벽에 닿고, 올라갈 땐 머리가 위, 내려갈 땐 머리가 아래다', () => {
    const up = placed('wallL', 'up');
    expect(up.feet.x).toBeLessThan(MID);
    expect(up.head.y).toBeLessThan(MID);
    const down = placed('wallL', 'down');
    expect(down.feet.x).toBeLessThan(MID);
    expect(down.head.y).toBeGreaterThan(MID);
  });

  it('오른쪽 벽: 발이 오른쪽 벽에 닿고, 올라갈 땐 머리가 위, 내려갈 땐 머리가 아래다', () => {
    const up = placed('wallR', 'up');
    expect(up.feet.x).toBeGreaterThan(MID);
    expect(up.head.y).toBeLessThan(MID);
    const down = placed('wallR', 'down');
    expect(down.feet.x).toBeGreaterThan(MID);
    expect(down.head.y).toBeGreaterThan(MID);
  });
});

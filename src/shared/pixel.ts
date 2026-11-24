/**
 * 16x16 도트 그림을 코드로 그리는 작은 도구.
 * 타원·사각형을 겹쳐 그리고, 마지막에 윤곽선을 자동으로 두른다.
 * 문자 하나가 픽셀 하나이며 '.' 는 투명이다.
 */

export const SIZE = 16;
export type Grid = string[][];

export function blank(): Grid {
  return Array.from({ length: SIZE }, () => Array<string>(SIZE).fill('.'));
}

/** 범위 밖이면 무시한다. */
export function px(g: Grid, x: number, y: number, c: string): void {
  const row = g[y];
  if (row && x >= 0 && x < SIZE) row[x] = c;
}

export function rect(g: Grid, x: number, y: number, w: number, h: number, c: string): void {
  for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) px(g, xx, yy, c);
}

/** 중심 (cx, cy), 반지름 (rx, ry) 인 속이 찬 타원. 중심은 칸의 정수 좌표다. */
export function ellipse(g: Grid, cx: number, cy: number, rx: number, ry: number, c: string): void {
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const dx = (x - cx) / rx;
      const dy = (y - cy) / ry;
      if (dx * dx + dy * dy <= 1) px(g, x, y, c);
    }
  }
}

/** 이미 칠해진 칸만 다른 색으로 바꾼다(무늬·배 색칠용). 몸 밖으로 번지지 않는다. */
export function mark(g: Grid, x: number, y: number, w: number, h: number, c: string): void {
  for (let yy = y; yy < y + h; yy++) {
    for (let xx = x; xx < x + w; xx++) {
      if (g[yy]?.[xx] !== undefined && g[yy]?.[xx] !== '.') px(g, xx, yy, c);
    }
  }
}

/** 그림 전체를 (dx, dy) 칸 옮긴 새 격자를 돌려준다. 밖으로 나간 칸은 사라진다. */
export function shift(g: Grid, dx: number, dy: number): Grid {
  const out = blank();
  g.forEach((row, y) =>
    row.forEach((c, x) => {
      if (c !== '.') px(out, x + dx, y + dy, c);
    }),
  );
  return out;
}

/** 좌우로 뒤집는다. */
export function flipRows(rows: readonly string[]): string[] {
  return rows.map((r) => [...r].reverse().join(''));
}

/** 시계 방향으로 90도 돌린다. (x, y) 칸은 (15 - y, x) 로 간다. */
export function rotateCW(rows: readonly string[]): string[] {
  return Array.from({ length: SIZE }, (_, r) =>
    Array.from({ length: SIZE }, (_, c) => rows[SIZE - 1 - c]?.[r] ?? '.').join(''),
  );
}

/** 먼저 flip 하고, 시계 방향으로 quarter 번 돌린다. */
export function orientRows(rows: readonly string[], flip: boolean, quarter: number): string[] {
  let out = flip ? flipRows(rows) : [...rows];
  for (let i = 0; i < ((quarter % 4) + 4) % 4; i++) out = rotateCW(out);
  return out;
}

/** 그림 바깥을 한 칸 둘러싸는 윤곽선을 두르고 문자열 행으로 돌려준다. */
export function outline(g: Grid, c = 'k'): string[] {
  const filled = (x: number, y: number): boolean => {
    const v = g[y]?.[x];
    return v !== undefined && v !== '.';
  };
  return g.map((row, y) =>
    row
      .map((cell, x) => {
        if (cell !== '.') return cell;
        const near = filled(x - 1, y) || filled(x + 1, y) || filled(x, y - 1) || filled(x, y + 1);
        return near ? c : '.';
      })
      .join(''),
  );
}

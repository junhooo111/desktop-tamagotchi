/**
 * 32x32 도트 그림을 코드로 그리는 도구.
 *
 * 문자 하나가 픽셀 하나이며 '.' 는 투명이다.
 * 몸을 "부품"(머리·몸통·다리·귀…) 단위로 그린다. 부품마다
 *   1) 모양을 채우고, 2) 위·아래 가장자리에 밝은/어두운 음영을 넣고, 3) 바깥에 윤곽선을 두른 뒤
 * 아래 부품 위에 얹는다(painter's algorithm). 그래서 머리와 몸통이 겹쳐도 경계가 또렷하다.
 */

export const SIZE = 32;
export type Grid = string[][];

export function blank(): Grid {
  return Array.from({ length: SIZE }, () => Array<string>(SIZE).fill('.'));
}

/** 범위 밖이면 무시한다. 소수 좌표는 가장 가까운 칸으로 반올림한다. */
export function px(g: Grid, x: number, y: number, c: string): void {
  const ix = Math.round(x);
  const iy = Math.round(y);
  const row = g[iy];
  if (row && ix >= 0 && ix < SIZE) row[ix] = c;
}

/** 왼쪽 위 (x, y), 폭 w, 높이 h 인 사각형. 가장자리는 가장 가까운 칸으로 반올림한다. */
export function rect(g: Grid, x: number, y: number, w: number, h: number, c: string): void {
  const x0 = Math.round(x);
  const y0 = Math.round(y);
  const x1 = Math.round(x + w);
  const y1 = Math.round(y + h);
  for (let yy = y0; yy < y1; yy++) for (let xx = x0; xx < x1; xx++) px(g, xx, yy, c);
}

/** 중심 (cx, cy), 반지름 (rx, ry) 인 속이 찬 타원. 중심과 반지름은 소수도 된다. */
export function ellipse(g: Grid, cx: number, cy: number, rx: number, ry: number, c: string): void {
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const dx = (x - cx) / rx;
      const dy = (y - cy) / ry;
      if (dx * dx + dy * dy <= 1) px(g, x, y, c);
    }
  }
}

/** 꼭짓점 세 개로 이루어진 속이 찬 삼각형(귀·부리 등). 칸의 중심 기준으로 판정한다. */
export function triangle(
  g: Grid,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  x3: number,
  y3: number,
  c: string,
): void {
  const sign = (ax: number, ay: number, bx: number, by: number, cx: number, cy: number): number =>
    (ax - cx) * (by - cy) - (bx - cx) * (ay - cy);
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const p = { x: x + 0.5, y: y + 0.5 };
      const d1 = sign(p.x, p.y, x1, y1, x2, y2);
      const d2 = sign(p.x, p.y, x2, y2, x3, y3);
      const d3 = sign(p.x, p.y, x3, y3, x1, y1);
      const neg = d1 < 0 || d2 < 0 || d3 < 0;
      const pos = d1 > 0 || d2 > 0 || d3 > 0;
      if (!(neg && pos)) px(g, x, y, c);
    }
  }
}

/** 두 점을 잇는 선. thickness 는 굵기(칸 수)다. 꼬리·팔처럼 휘어진 부분을 그릴 때 쓴다. */
export function line(g: Grid, x1: number, y1: number, x2: number, y2: number, c: string, thickness = 1): void {
  const steps = Math.max(1, Math.ceil(Math.hypot(x2 - x1, y2 - y1) * 2));
  const r = thickness / 2;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = x1 + (x2 - x1) * t;
    const y = y1 + (y2 - y1) * t;
    if (thickness <= 1) px(g, Math.round(x), Math.round(y), c);
    else ellipse(g, x, y, r, r, c);
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

/** 칠해진 칸 중 타원 안쪽만 다른 색으로 바꾼다(배·주둥이·볼 같은 둥근 무늬). */
export function markEllipse(g: Grid, cx: number, cy: number, rx: number, ry: number, c: string): void {
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const dx = (x - cx) / rx;
      const dy = (y - cy) / ry;
      if (dx * dx + dy * dy <= 1 && g[y]?.[x] !== undefined && g[y]?.[x] !== '.') px(g, x, y, c);
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

export function toRows(g: Grid): string[] {
  return g.map((row) => row.join(''));
}

// ---- 부품 그리기: 음영 + 윤곽선 + 겹쳐 놓기 ----

/** 색 문자 → 어두운/밝은 색 문자 */
export type Shade = Readonly<Record<string, { dark: string; light: string }>>;

/**
 * 부품 안쪽의 위·아래 가장자리에 음영을 넣는다.
 * 아래가 비어 있는 칸은 어둡게, 위가 비어 있는 칸은 밝게 바꾼다(아래쪽이 우선).
 */
export function shadeGrid(t: Grid, shade: Shade): void {
  const src = t.map((row) => [...row]);
  const empty = (x: number, y: number): boolean => (src[y]?.[x] ?? '.') === '.';
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const m = shade[src[y]?.[x] ?? '.'];
      if (!m) continue;
      if (empty(x, y + 1)) px(t, x, y, m.dark);
      else if (empty(x, y - 1)) px(t, x, y, m.light);
    }
  }
}

/** 부품(t)을 g 위에 얹고, 바깥에 윤곽선(outline)을 두른다. outline 이 null 이면 윤곽선 없이 얹는다. */
export function stamp(g: Grid, t: Grid, outline: string | null): void {
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      if ((t[y]?.[x] ?? '.') !== '.') continue;
      if (outline === null) continue;
      const near =
        (t[y]?.[x - 1] ?? '.') !== '.' ||
        (t[y]?.[x + 1] ?? '.') !== '.' ||
        (t[y - 1]?.[x] ?? '.') !== '.' ||
        (t[y + 1]?.[x] ?? '.') !== '.';
      if (near) px(g, x, y, outline);
    }
  }
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const c = t[y]?.[x] ?? '.';
      if (c !== '.') px(g, x, y, c);
    }
  }
}

export interface PartOptions {
  /** 윤곽선 문자. null 이면 두르지 않는다. */
  outline: string | null;
  shade?: Shade;
}

/** 부품 하나를 그려서 g 위에 얹는다. draw 는 빈 격자 t 에 모양만 채우면 된다. */
export function part(g: Grid, draw: (t: Grid) => void, opts: PartOptions): void {
  const t = blank();
  draw(t);
  if (opts.shade) shadeGrid(t, opts.shade);
  stamp(g, t, opts.outline);
}

/** 윤곽선 없이 그림 바깥을 한 칸 둘러싸는 선을 두르고 문자열 행으로 돌려준다(단일 부품 그림용). */
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

// ---- 문자열 행(완성된 프레임) 다루기 ----

/** 좌우로 뒤집는다. */
export function flipRows(rows: readonly string[]): string[] {
  return rows.map((r) => [...r].reverse().join(''));
}

/** 시계 방향으로 90도 돌린다. (x, y) 칸은 (SIZE-1 - y, x) 로 간다. */
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

/** 그려진 칸을 모두 감싸는 사각형(양 끝 포함). 아무것도 없으면 null. */
export function boundsOf(rows: readonly string[]): { x0: number; y0: number; x1: number; y1: number } | null {
  let x0 = SIZE;
  let y0 = SIZE;
  let x1 = -1;
  let y1 = -1;
  rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      if (row[x] === '.') continue;
      x0 = Math.min(x0, x);
      y0 = Math.min(y0, y);
      x1 = Math.max(x1, x);
      y1 = Math.max(y1, y);
    }
  });
  return x1 < 0 ? null : { x0, y0, x1, y1 };
}

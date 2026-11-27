/**
 * 우클릭 메뉴의 도트 아이콘(16x16, 색이 있는 도트).
 * 글자 하나가 한 칸이고 색은 PALETTE 에 있다('.' 은 빈 칸). 손으로 그린 것은 8글자 줄(왼쪽 절반)을 쓰면
 * 자동으로 좌우 대칭이 된다. 둥근 것(톱니·공·구름…)은 식으로 그려서 칸이 고르다.
 * SVG 사각형으로 그려서(가로로 이어진 같은 색은 하나로 합친다) 크게 키워도 칸이 뭉개지지 않는다.
 */
import type { MenuIcon } from '../shared/menu.js';

export const SIZE = 16;

export const PALETTE: Record<string, string> = {
  k: '#3b2a20', // 윤곽선
  w: '#fffdf5',
  r: '#e0523f',
  p: '#ff9fb5',
  o: '#f08a24',
  y: '#ffd24a',
  g: '#5fbf5a',
  b: '#4a90d9',
  l: '#bfe3f7',
  n: '#a0693d',
  e: '#d9c69a',
  c: '#9aa5b5',
};

// ---- 식으로 그리기 도구 ----
type Fn = (x: number, y: number) => string;
const EMPTY = '.';

function paint(fn: Fn): string[][] {
  return Array.from({ length: SIZE }, (_, y) => Array.from({ length: SIZE }, (_, x) => fn(x + 0.5, y + 0.5)));
}
/** 색이 있는 칸 바로 옆(위·아래·좌·우)의 빈 칸에 윤곽선을 두른다. */
function outline(g: string[][]): string[][] {
  const out = g.map((r) => [...r]);
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      if (g[y]![x] !== EMPTY) continue;
      const near = [g[y - 1]?.[x], g[y + 1]?.[x], g[y]?.[x - 1], g[y]?.[x + 1]];
      if (near.some((c) => c !== undefined && c !== EMPTY)) out[y]![x] = 'k';
    }
  }
  return out;
}
const rows = (g: string[][]): string[] => g.map((r) => r.join(''));
const dist = (x: number, y: number, cx: number, cy: number): number => Math.hypot(x - cx, y - cy);
function segDist(x: number, y: number, ax: number, ay: number, bx: number, by: number): number {
  const dx = bx - ax;
  const dy = by - ay;
  const t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(x - (ax + t * dx), y - (ay + t * dy));
}
function inPolygon(x: number, y: number, pts: ReadonlyArray<readonly [number, number]>): boolean {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i] as readonly [number, number];
    const [xj, yj] = pts[j] as readonly [number, number];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
/** 같은 칸 위에 그린 것을 덮어쓴다 */
function put(g: string[][], cells: ReadonlyArray<readonly [number, number]>, ch: string): string[][] {
  for (const [x, y] of cells) if (g[y]?.[x] !== undefined) g[y]![x] = ch;
  return g;
}

const gear = (): string[] => {
  const g = outline(
    paint((x, y) => {
      const d = dist(x, y, 8, 8);
      if (d <= 2.4) return EMPTY;
      const a = Math.atan2(y - 8, x - 8);
      const t = ((a % (Math.PI / 4)) + Math.PI / 4) % (Math.PI / 4);
      const toothDelta = Math.min(t, Math.PI / 4 - t);
      if (d <= 5.2) return 'c';
      if (d <= 7.7 && toothDelta <= 0.4) return 'c';
      return EMPTY;
    }),
  );
  // 윗왼쪽에 작은 빛 몇 칸
  return rows(put(g, [[5, 4], [6, 4], [4, 5], [4, 6]], 'w'));
};

const ball = (): string[] => {
  const colors = ['r', 'w', 'y', 'r', 'w', 'y'];
  const g = outline(
    paint((x, y) => {
      if (dist(x, y, 8, 8) > 6.7) return EMPTY;
      const a = Math.atan2(y - 8, x - 8) + Math.PI;
      return colors[Math.min(5, Math.floor((a / (2 * Math.PI)) * 6))] as string;
    }),
  );
  // 가운데 점으로 꼭짓점을 감춘다
  return rows(put(g, [[7, 7], [8, 7], [7, 8], [8, 8]], 'k'));
};

const cloud = (): string[] => {
  const circles: ReadonlyArray<readonly [number, number, number]> = [[5.2, 9, 3.6], [8.8, 7, 4.4], [12, 9.6, 3.2]];
  const g = outline(paint((x, y) => (y < 12.4 && circles.some(([cx, cy, r]) => dist(x, y, cx, cy) <= r) ? 'l' : EMPTY)));
  return rows(put(g, [[6, 4], [7, 4], [5, 5]], 'w'));
};

const tool = (): string[] => {
  const g = outline(
    paint((x, y) => {
      const head = dist(x, y, 11, 5) <= 3.8 && !(x >= 11.2 && x <= 14.6 && y >= 1.2 && y <= 4.3);
      const handle = segDist(x, y, 3, 13, 9.6, 6.4) <= 1.3;
      return head || handle ? 'c' : EMPTY;
    }),
  );
  return rows(put(g, [[4, 12], [5, 11], [6, 10], [9, 7]], 'w'));
};

const scan = (): string[] => {
  const g = outline(
    paint((x, y) => {
      const d = dist(x, y, 6.5, 6.5);
      if (d <= 3.7) return 'l';
      if (d <= 5.2) return 'n';
      if (segDist(x, y, 10.4, 10.4, 14, 14) <= 1.4) return 'n';
      return EMPTY;
    }),
  );
  return rows(put(g, [[4, 4], [5, 4], [4, 5]], 'w'));
};

const bulb = (): string[] => {
  const g = outline(
    paint((x, y) => {
      if (dist(x, y, 8, 6.3) <= 5) return 'y';
      if (x > 6 && x < 10 && y > 10 && y < 13.5) return 'c';
      return EMPTY;
    }),
  );
  return rows(put(put(g, [[5, 4], [6, 4], [5, 5]], 'w'), [[7, 7], [8, 7], [7, 8], [8, 8]], 'o'));
};

const star = (): string[] => {
  const pts: Array<readonly [number, number]> = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const r = i % 2 === 0 ? 7.4 : 3.1;
    pts.push([8 + r * Math.cos(a), 8.8 + r * Math.sin(a)]);
  }
  const g = outline(paint((x, y) => (inPolygon(x, y, pts) ? 'y' : EMPTY)));
  return rows(put(g, [[7, 5], [7, 6], [6, 8], [5, 8]], 'w'));
};

const power = (): string[] => {
  const g = outline(
    paint((x, y) => {
      const d = dist(x, y, 8, 8.6);
      const ring = d >= 4.3 && d <= 6.3 && !(Math.abs(x - 8) < 2.1 && y < 8.6);
      const bar = x > 7 && x < 9 && y > 1.5 && y < 9.2;
      return ring || bar ? 'r' : EMPTY;
    }),
  );
  return rows(g);
};

const info = (): string[] => {
  const g = outline(paint((x, y) => (dist(x, y, 8, 8) <= 6.7 ? 'b' : EMPTY)));
  return rows(put(g, [[7, 4], [8, 4], [7, 5], [8, 5], [7, 7], [8, 7], [7, 8], [8, 8], [7, 9], [8, 9], [7, 10], [8, 10], [7, 11], [8, 11]], 'w'));
};

const globe = (): string[] => {
  const patches: ReadonlyArray<readonly [number, number, number, number]> = [[3, 3, 7, 6], [9, 6, 12, 9], [4, 9, 7, 12], [10, 11, 12, 12]];
  const g = outline(
    paint((x, y) => {
      if (dist(x, y, 8, 8) > 6.7) return EMPTY;
      return patches.some(([x0, y0, x1, y1]) => x >= x0 && x <= x1 + 1 && y >= y0 && y <= y1 + 1) ? 'g' : 'b';
    }),
  );
  return rows(put(g, [[10, 3], [11, 4], [5, 7]], 'w'));
};

const bug = (): string[] => {
  const g = outline(
    paint((x, y) => {
      if (dist(x, y, 8, 3.9) <= 2.6) return 'k';
      if (dist(x, y, 8, 9.6) <= 4.9) return 'r';
      return EMPTY;
    }),
  );
  put(g, [[7, 5], [8, 5], [7, 6], [8, 6], [7, 7], [8, 7], [7, 8], [8, 8], [7, 9], [8, 9], [7, 10], [8, 10], [7, 11], [8, 11], [7, 12], [8, 12], [7, 13], [8, 13]], 'k');
  put(g, [[5, 8], [10, 8], [5, 11], [10, 11], [10, 10]], 'k');
  put(g, [[2, 7], [3, 7], [12, 7], [13, 7], [2, 10], [3, 10], [12, 10], [13, 10], [2, 13], [3, 13], [12, 13], [13, 13]], 'k');
  return rows(g);
};

const refresh = (): string[] => {
  const head: ReadonlyArray<readonly [number, number]> = [[8.6, 0.4], [8.6, 5.4], [13.4, 2.9]];
  const g = outline(
    paint((x, y) => {
      const d = dist(x, y, 8, 8.6);
      const a = Math.atan2(y - 8.6, x - 8);
      const ring = d >= 4.3 && d <= 6.3 && !(a > -1.5 && a < -0.35);
      return ring || inPolygon(x, y, head) ? 'b' : EMPTY;
    }),
  );
  return rows(g);
};

const arrow = (left: boolean, color: string): string[] => {
  const g = outline(
    paint((x, y) => {
      // 왼쪽 화살표(left)와 위쪽 화살표(!left)를 같은 식으로 그린다
      const u = left ? x : y;
      const v = Math.abs((left ? y : x) - 8);
      const head = u >= 2 && u <= 8.5 && v <= (u - 2) * 0.95;
      const shaft = u > 8 && u <= 13.5 && v <= 1.7;
      return head || shaft ? color : EMPTY;
    }),
  );
  return rows(g);
};

// ---- 손으로 그린 것(8글자 줄은 왼쪽 절반 → 자동 대칭) ----
const mirror = (r: string): string => (r.length === 8 ? r + [...r].reverse().join('') : r);
const art = (lines: readonly string[]): string[] => lines.map(mirror);

const HEART = art([
  '................',
  '................',
  '..kkkk....kkkk..',
  '.krrrrk..krrrrk.',
  'krrwwrrkkrrrrrrk',
  'krrwrrrrrrrrrrrk',
  'krrrrrrrrrrrrrrk',
  'krrrrrrrrrrrrrrk',
  '.krrrrrrrrrrrrk.',
  '..krrrrrrrrrrk..',
  '...krrrrrrrrk...',
  '....krrrrrrk....',
  '.....krrrrk.....',
  '......krrk......',
  '.......kk.......',
  '................',
]);

const CARD = art([
  '................',
  '................',
  '................',
  '.kkkkkkkkkkkkkk.',
  'kwwwwwwwwwwwwwwk',
  'kwbbbbbwkkkkkkwk',
  'kwbbbbbwwwwwwwwk',
  'kwbbbbbwkkkkkwwk',
  'kwbbbbbwwwwwwwwk',
  'kwbbbbbwkkkkwwwk',
  'kwwwwwwwwwwwwwwk',
  '.kkkkkkkkkkkkkk.',
  '................',
  '................',
  '................',
  '................',
]);

const LIST = art([
  '................',
  '................',
  '................',
  '..oo.kkkkkkkkk..',
  '..oo.kkkkkkkkk..',
  '................',
  '................',
  '..oo.kkkkkkkkk..',
  '..oo.kkkkkkkkk..',
  '................',
  '................',
  '..oo.kkkkkkkkk..',
  '..oo.kkkkkkkkk..',
  '................',
  '................',
  '................',
]);

const DOTS = art([
  '................',
  '................',
  '................',
  '................',
  '................',
  '.kkkk.kkkk.kkkk.',
  '.kkkk.kkkk.kkkk.',
  '.kkkk.kkkk.kkkk.',
  '.kkkk.kkkk.kkkk.',
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
]);

export const ART: Record<MenuIcon, readonly string[]> = {
  touch: HEART,
  feed: art(['........', '........', '...e....', '....e...', '...e....', '........', '..kkkkkk', '.kyyyyyy', '.kyyoyyy', 'kkkkkkkk', 'kbbbbbbb', 'kbblllbb', '.kbbbbbb', '..kbbbbb', '...kkkkk', '........']),
  play: ball(),
  wash: art(['.......k', '.......k', '......kb', '......kb', '.....kbb', '.....kbb', '....kbbb', '...kbbbb', '..kbbbbb', '..kbllbb', '..kblbbb', '..kbbbbb', '...kbbbb', '....kkbb', '......kk', '........']),
  walk: art(['........', '....kk..', '...knnk.', '...knnk.', '.kk.kk..', 'knnk....', 'knnk..kk', '.kk..knn', '.....knn', '....knnn', '...knnnn', '...knnnn', '...knnnn', '....knnn', '.....kkk', '........']),
  paw: art(['........', '.kk.....', '.kok....', '.kook...', '.kkkkkkk', 'kooooooo', 'kooooooo', 'koookooo', 'koookooo', 'koooooop', 'kooooooo', '.koooooo', '..kooooo', '...kkkkk', '........', '........']),
  ticket: art(['........', '........', '.kkkkkkk', 'kyyyyyyy', 'kyoyyyyy', 'kyyyyyyk', 'kyyyyyyy', 'kyyyyyyk', 'kyyyyyyy', 'kyyyyyyk', 'kyyyyyyy', 'kyoyyyyy', '.kkkkkkk', '........', '........', '........']),
  shop: art(['........', '..kkkkkk', '.krrwwrr', 'krrwwrrw', 'kkkkkkkk', '.kwwwwww', '.kwbbwww', '.kwbbkkk', '.kwwwknn', '.kwwwknn', '.kwwwknn', '.kwwwknn', '.kkkkkkk', '........', '........', '........']),
  trophy: art(['........', '..kkkkkk', '.kyyyyyy', 'kkywyyyy', 'kyyywyyy', 'kkyyyyyy', '.kyyyyyy', '..kyyyyy', '...kyyyy', '....kkyy', '.....kyy', '.....kyy', '..kkkkkk', '.kyyyyyy', '.kkkkkkk', '........']),
  gear: gear(),
  bell: art(['........', '.......k', '......kk', '....kkyy', '...kyyyy', '...kywyy', '..kyyyyy', '..kyyyyy', '..kyyyyy', '.kyyyyyy', '.kyyyyyy', 'kkkkkkkk', '......kk', '......oo', '........', '........']),
  dots: DOTS,
  power: power(),
  cloud: cloud(),
  tool: tool(),
  scan: scan(),
  bulb: bulb(),
  star: star(),
  book: art(['........', '........', '.kkkkkkk', 'kwwwwwwk', 'kweeeewk', 'kwwwwwwk', 'kweeeewk', 'kwwwwwwk', 'kweeeewk', 'kwwwwwwk', 'kkkkkkkk', 'krrrrrrk', '.kkkkkk.', '........', '........', '........']),
  card: CARD,
  home: art(['........', '.......k', '......kr', '.....krr', '....krrr', '...krrrr', '..krrrrr', '.kkkkkkk', '..kwwwww', '..kwwwww', '..kwwknn', '..kwwknn', '..kwwknn', '..kkkkkk', '........', '........']),
  refresh: refresh(),
  back: arrow(true, 'b'),
  update: arrow(false, 'g'),
  list: LIST,
  info: info(),
  globe: globe(),
  bug: bug(),
  friends: art(['........', '..kkkk..', '.kppppk.', '.kpkkpk.', '.kppppk.', '..kkkk..', '.kkbbkkk', 'kbbbbbbk', 'kbbbbbbk', 'kbbbbbbk', '.kkkkkk.', '........', '........', '........', '........', '........']),
};

/** 아이콘 모양(글자 줄). 시험·미리보기에서 쓴다. */
export const ICONS: Record<MenuIcon, readonly string[]> = ART;

const SVG_NS = 'http://www.w3.org/2000/svg';

/** 아이콘 하나를 SVG 요소로 만든다. size 는 한 변의 픽셀 수(16 의 배수가 가장 또렷하다). */
export function iconSvg(name: MenuIcon, size = 32): SVGSVGElement {
  const lines = ICONS[name];
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', `0 0 ${SIZE} ${SIZE}`);
  svg.setAttribute('width', String(size));
  svg.setAttribute('height', String(size));
  svg.setAttribute('shape-rendering', 'crispEdges');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('class', 'icon');
  lines.forEach((line, y) => {
    let x = 0;
    while (x < line.length) {
      const ch = line[x] as string;
      let end = x + 1;
      while (end < line.length && line[end] === ch) end++;
      const color = PALETTE[ch];
      if (ch !== EMPTY && color) {
        const rect = document.createElementNS(SVG_NS, 'rect');
        rect.setAttribute('x', String(x));
        rect.setAttribute('y', String(y));
        rect.setAttribute('width', String(end - x));
        rect.setAttribute('height', '1');
        rect.setAttribute('fill', color);
        svg.appendChild(rect);
      }
      x = end;
    }
  });
  return svg;
}

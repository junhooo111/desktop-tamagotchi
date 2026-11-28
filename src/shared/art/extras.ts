/**
 * 꾸미기의 새 종류 둘: 목 장식(neck)과 효과(effect).
 *
 * - 목 장식: 방울 목줄·스카프·나비넥타이·목걸이. 머리 아래쪽(턱 밑)에 걸리고, 머리가 몸에 가려지지 않게 머리보다 먼저 그린다.
 *   팔레트 글자: N = 주색, M = 보조색.
 * - 효과: 펫 둘레에 떠 있는 반짝이·하트·음표·눈송이, 몸 둘레를 감싸는 불꽃 오라. 완성된(뭉친) 그림 위에 마지막에 얹고,
 *   이미 그려진 칸은 건드리지 않는다. 팔레트 글자: U = 주색, V = 보조색.
 * 모두 2칸 단위(짝수 좌표)로 그린다(마지막에 16칸 굵기로 뭉치는 그림과 어긋나지 않게).
 */
import { part, rect, type Grid } from '../pixel.js';

export type Neck = 'none' | 'bell' | 'scarf' | 'bowtie' | 'pearl' | 'starpendant' | 'goldchain';

export const NECKS: readonly Neck[] = ['none', 'bell', 'scarf', 'bowtie', 'pearl', 'starpendant', 'goldchain'];

export const NECK_COLORS: Record<Neck, { N: string; M: string }> = {
  none: { N: '#ffffff', M: '#ffffff' },
  bell: { N: '#e5484d', M: '#ffd34a' },
  scarf: { N: '#4a9bff', M: '#ffffff' },
  bowtie: { N: '#e5484d', M: '#7a1f2a' },
  pearl: { N: '#ffffff', M: '#cfd6e6' },
  starpendant: { N: '#ffe14a', M: '#8a6b1c' },
  goldchain: { N: '#ffd34a', M: '#c98a1a' },
};

export type Effect = 'none' | 'sparkles' | 'hearts' | 'notes' | 'snow' | 'flameaura';

export const EFFECTS: readonly Effect[] = ['none', 'sparkles', 'hearts', 'notes', 'snow', 'flameaura'];

export const EFFECT_COLORS: Record<Effect, { U: string; V: string }> = {
  none: { U: '#ffffff', V: '#ffffff' },
  sparkles: { U: '#ffe14a', V: '#ffffff' },
  hearts: { U: '#ff6b8b', V: '#ffb3c8' },
  notes: { U: '#7a5cff', V: '#b8a8ff' },
  snow: { U: '#bfe3f7', V: '#ffffff' },
  flameaura: { U: '#ff9b2e', V: '#ffd34a' },
};

export const isNeck = (v: unknown): v is Neck => typeof v === 'string' && (NECKS as readonly string[]).includes(v);
export const isEffect = (v: unknown): v is Effect => typeof v === 'string' && (EFFECTS as readonly string[]).includes(v);

const even = (n: number): number => Math.round(n / 2) * 2;

/** 문자 그림(한 글자 = 2x2 픽셀)을 (x, y)에 그린다. '.' 은 비운다. */
function cells(t: Grid, x: number, y: number, rows: readonly string[]): void {
  rows.forEach((row, ry) => {
    [...row].forEach((ch, rx) => {
      if (ch !== '.' && ch !== ' ') rect(t, x + rx * 2, y + ry * 2, 2, 2, ch);
    });
  });
}

const NECK_ROWS: Record<Exclude<Neck, 'none'>, readonly string[]> = {
  // 빨간 목줄에 금빛 방울
  bell: ['NNNNNN', '..MM..'],
  // 줄무늬 스카프와 늘어진 끝
  scarf: ['NNNNNN', 'MNMNMN', '..NM..'],
  // 나비넥타이
  bowtie: ['NN.NN', 'NNMNN', 'NN.NN'],
  // 진주 목걸이
  pearl: ['MMMMMM', '.NNNN.', '..NN..'],
  // 별 펜던트
  starpendant: ['MMMMMM', '..NN..', '.NNNN.', '..NN..'],
  // 굵은 황금 목걸이
  goldchain: ['NNNNNNN', 'MNMNMNM', '.MNNNM.', '..MNM..'],
};

/** 목 장식. 머리 윗선이 아니라 턱 밑에 걸고, 머리를 그리기 전에 불러서 머리가 위를 덮게 한다. */
export function drawNeckAccessory(g: Grid, neck: Neck | undefined, head: { cx: number; cy: number; rx: number; ry: number }): void {
  if (!neck || neck === 'none') return;
  const rows = NECK_ROWS[neck];
  const width = (rows[0]?.length ?? 0) * 2;
  const x = even(head.cx - head.rx * 0.2) - Math.round(width / 2);
  const y = even(head.cy + head.ry * 0.72);
  part(g, (t) => cells(t, x, y, rows), { outline: 'k' });
}

// ---- 효과 ----

type Put = (x: number, y: number, rows: readonly string[]) => void;

/**
 * 완성된 프레임(32줄, 2x2 로 뭉친 그림)에 효과를 얹는다. 이미 그려진 칸은 그대로 두고 빈 칸만 채운다.
 * 반짝이·하트·음표·눈송이는 캔버스 가장자리 쪽 정해진 자리에, 불꽃 오라는 그림 모양을 따라 둘레에 그린다.
 */
export function applyEffect(rows: readonly string[], effect: Effect | undefined): string[] {
  if (!effect || effect === 'none') return [...rows];
  const grid = rows.map((r) => [...r]);
  const free = (x: number, y: number): boolean => grid[y]?.[x] === '.';
  const put: Put = (x, y, art) => {
    art.forEach((line, ry) => {
      [...line].forEach((ch, rx) => {
        if (ch === '.') return;
        for (let dy = 0; dy < 2; dy++) {
          for (let dx = 0; dx < 2; dx++) {
            const px = x + rx * 2 + dx;
            const py = y + ry * 2 + dy;
            if (free(px, py)) grid[py]![px] = ch;
          }
        }
      });
    });
  };

  if (effect === 'sparkles') {
    const plus = ['.U.', 'UVU', '.U.'];
    put(2, 2, plus);
    put(24, 0, plus);
    put(26, 14, ['.U.', 'UUU', '.U.']);
    put(0, 12, ['.V.']);
  } else if (effect === 'hearts') {
    const heart = ['U.U', 'UUU', '.U.'];
    put(2, 2, heart);
    put(24, 4, ['V.V', 'VVV', '.V.']);
    put(26, 18, heart);
  } else if (effect === 'notes') {
    put(2, 2, ['.UU', '.U.', 'UV.']);
    put(24, 2, ['.VV', '.V.', 'UU.']);
    put(26, 16, ['.UU', '.U.', 'UV.']);
  } else if (effect === 'snow') {
    const flake = ['U.U', '.V.', 'U.U'];
    put(2, 2, flake);
    put(24, 0, flake);
    put(0, 14, ['.U.', 'UVU', '.U.']);
    put(26, 14, flake);
  } else if (effect === 'flameaura') {
    // 그림 둘레 한 칸(2x2 블록 하나)을 주황·금빛으로 번갈아 두른다
    const filled = (bx: number, by: number): boolean => {
      const ch = rows[by * 2]?.[bx * 2];
      return ch !== undefined && ch !== '.';
    };
    for (let by = 0; by < 16; by++) {
      for (let bx = 0; bx < 16; bx++) {
        if (filled(bx, by)) continue;
        let near = false;
        for (let dy = -1; dy <= 1 && !near; dy++) for (let dx = -1; dx <= 1; dx++) if ((dx || dy) && filled(bx + dx, by + dy)) near = true;
        if (!near) continue;
        const ch = (bx + by) % 2 === 0 ? 'U' : 'V';
        for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) grid[by * 2 + dy]![bx * 2 + dx] = ch;
      }
    }
  }
  return grid.map((r) => r.join(''));
}

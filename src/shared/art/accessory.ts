/**
 * 꾸미기 장식(리본·안경·왕관·날개)을 그리는 도구.
 *
 * 장식은 뼈대(quadruped.ts·bird.ts)가 머리·몸을 그린 자리에서 바로 이어서 그린다.
 * 그래서 걷기·앉기·자기·매달리기 같은 모든 자세에서 머리·몸을 따라다닌다.
 * 마지막에 16칸 굵기로 뭉치므로(chunky.ts) 장식도 2칸 단위(짝수 좌표)에 맞춰 그린다.
 *
 * 팔레트 글자: X = 장식의 주색, Y = 보조색(보석·매듭·테두리). 색은 ACCESSORY_COLORS.
 */
import { blank, line, part, px, rect, triangle, type Grid } from '../pixel.js';

export type Accessory =
  | 'none'
  | 'ribbon'
  | 'glasses'
  | 'crown'
  | 'wings'
  | 'sprout'
  | 'flower'
  | 'partyhat'
  | 'halo'
  // 뽑기 전용
  | 'cap'
  | 'witch'
  | 'chef'
  | 'santa'
  // 업적 전용
  | 'headband'
  | 'antenna'
  | 'bunnyears'
  | 'eyepatch'
  | 'monocle'
  | 'star';

export const ACCESSORIES: readonly Accessory[] = [
  'none',
  'ribbon',
  'glasses',
  'crown',
  'wings',
  'sprout',
  'flower',
  'partyhat',
  'halo',
  'cap',
  'witch',
  'chef',
  'santa',
  'headband',
  'antenna',
  'bunnyears',
  'eyepatch',
  'monocle',
  'star',
];

/** 장식별 색: X 주색, Y 보조색(안경의 Y 는 짙은 렌즈 색이라 선글라스로 보인다) */
export const ACCESSORY_COLORS: Record<Accessory, { X: string; Y: string }> = {
  none: { X: '#ffffff', Y: '#ffffff' },
  ribbon: { X: '#ff6b8b', Y: '#c2385a' },
  glasses: { X: '#ffffff', Y: '#2b3a55' },
  crown: { X: '#ffd84a', Y: '#e5484d' },
  wings: { X: '#a8dcff', Y: '#4a9fe0' },
  sprout: { X: '#6fcf6f', Y: '#2f9a45' },
  flower: { X: '#ff9ecb', Y: '#ffd04a' },
  partyhat: { X: '#5ab8ff', Y: '#ff6b8b' },
  halo: { X: '#fff3a0', Y: '#ffd04a' },
  cap: { X: '#e5484d', Y: '#8f1f27' },
  witch: { X: '#6a3fc8', Y: '#ffd84a' },
  chef: { X: '#ffffff', Y: '#cfd6e6' },
  santa: { X: '#e5484d', Y: '#ffffff' },
  headband: { X: '#ff6fae', Y: '#ffd84a' },
  antenna: { X: '#ff4f8b', Y: '#9a2a55' },
  bunnyears: { X: '#ffffff', Y: '#ffb3c8' },
  eyepatch: { X: '#2b2b3a', Y: '#2b2b3a' },
  monocle: { X: '#ffd04a', Y: '#8a6b1c' },
  star: { X: '#ffe14a', Y: '#ffa62e' },
};

export interface HeadGeom {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
}

const even = (n: number): number => Math.round(n / 2) * 2;

/** 문자 그림(한 글자 = 2x2 픽셀)을 (x, y)에 그린다. X·Y 는 장식 색, '.' 은 비운다. */
function cells(t: Grid, x: number, y: number, rows: readonly string[]): void {
  rows.forEach((row, ry) => {
    [...row].forEach((ch, rx) => {
      if (ch !== '.' && ch !== ' ') rect(t, x + rx * 2, y + ry * 2, 2, 2, ch);
    });
  });
}

/** 머리에 쓰는 장식: 리본·왕관은 머리 위에, 안경은 눈 둘레에 그린다. eyes 는 눈(2x2)의 왼쪽 위 칸이다. */
export function drawHeadAccessory(g: Grid, acc: Accessory | undefined, head: HeadGeom, eyes: readonly { x: number; y: number }[]): void {
  switch (acc) {
    case 'crown': {
      // 왕관: 뾰족한 끝 셋과 가운데 보석 (10x6)
      const x = even(head.cx) - 5;
      const y = Math.max(2, even(head.cy - head.ry) - 4);
      part(g, (t) => cells(t, x, y, ['X.X.X', 'XXXXX', 'XXYXX']), { outline: 'k' });
      break;
    }
    case 'ribbon': {
      // 머리 위쪽 뒤편에 단 큰 리본: 좌우 고리와 가운데 매듭, 매듭 위아래는 비어 나비 모양이 된다 (12x6)
      const x = even(head.cx - head.rx * 0.35) - 6;
      const y = Math.max(2, even(head.cy - head.ry) - 4);
      part(g, (t) => cells(t, x, y, ['XX..XX', 'XXYYXX', 'XX..XX']), { outline: 'k' });
      break;
    }
    case 'sprout': {
      // 새싹: 가는 줄기 위로 잎 둘이 V 자로 갈라져 돋는다 (14x10)
      const x = even(head.cx) - 7;
      const y = Math.max(2, even(head.cy - head.ry) - 8);
      part(g, (t) => cells(t, x, y, ['XX...XX', 'XXX.XXX', '.XXYXX.', '...Y...', '...Y...']), { outline: 'k' });
      break;
    }
    case 'flower': {
      // 머리 위쪽 뒤편의 꽃: 꽃잎 다섯과 노란 가운데 (10x10)
      const x = even(head.cx - head.rx * 0.35) - 5;
      const y = Math.max(2, even(head.cy - head.ry) - 8);
      part(g, (t) => cells(t, x, y, ['.X.X.', 'XXXXX', 'XXYXX', 'XXXXX', '.X.X.']), { outline: 'k' });
      break;
    }
    case 'partyhat': {
      // 뾰족한 파티 모자: 끝에 방울, 줄무늬, 아래로 갈수록 넓어진다 (10x10)
      const x = even(head.cx) - 5;
      const y = Math.max(2, even(head.cy - head.ry) - 8);
      part(g, (t) => cells(t, x, y, ['..Y..', '..X..', '.XYX.', '.XXX.', 'XYXYX']), { outline: 'k' });
      break;
    }
    case 'halo': {
      // 머리 위에 떠 있는 금빛 고리 (12x6)
      const x = even(head.cx) - 6;
      const y = Math.max(2, even(head.cy - head.ry) - 8);
      part(g, (t) => cells(t, x, y, ['.YXXY.', 'X....X', '.YXXY.']), { outline: 'k' });
      break;
    }
    case 'cap': {
      // 야구모자: 둥근 모자에 앞으로 나온 챙 (14x6)
      const x = even(head.cx) - 6;
      const y = Math.max(2, even(head.cy - head.ry) - 4);
      part(g, (t) => cells(t, x, y, ['.XXXX..', 'XXXXXX.', 'YYYYYYY']), { outline: 'k' });
      break;
    }
    case 'witch': {
      // 마법사 모자: 뾰족하게 솟은 모자와 넓은 챙, 금빛 띠 (14x12)
      const x = even(head.cx) - 7;
      const y = Math.max(2, even(head.cy - head.ry) - 10);
      part(g, (t) => cells(t, x, y, ['...X...', '...X...', '..XXX..', '..XYX..', '.XXXXX.', 'XXXXXXX']), { outline: 'k' });
      break;
    }
    case 'chef': {
      // 요리사 모자: 부풀어 오른 하얀 모자 (10x8)
      const x = even(head.cx) - 5;
      const y = Math.max(2, even(head.cy - head.ry) - 6);
      part(g, (t) => cells(t, x, y, ['.XXX.', 'XXXXX', 'XXXXX', 'YYYYY']), { outline: 'k' });
      break;
    }
    case 'santa': {
      // 산타 모자: 빨간 모자, 하얀 방울과 둘레 (12x8)
      const x = even(head.cx) - 6;
      const y = Math.max(2, even(head.cy - head.ry) - 6);
      part(g, (t) => cells(t, x, y, ['..XXY.', '.XXXX.', 'XXXXXX', 'YYYYYY']), { outline: 'k' });
      break;
    }
    case 'headband': {
      // 별 머리띠: 머리를 두른 띠 위에 별 하나 (10x6)
      const x = even(head.cx) - 5;
      const y = Math.max(2, even(head.cy - head.ry) - 4);
      part(g, (t) => cells(t, x, y, ['..Y..', '.YYY.', 'XXXXX']), { outline: 'k' });
      break;
    }
    case 'antenna': {
      // 하트 더듬이: 줄기 끝에 달린 하트 (6x8)
      const x = even(head.cx - head.rx * 0.2) - 3;
      const y = Math.max(2, even(head.cy - head.ry) - 6);
      part(g, (t) => cells(t, x, y, ['X.X', 'XXX', '.Y.', '.Y.']), { outline: 'k' });
      break;
    }
    case 'bunnyears': {
      // 토끼 귀 머리띠: 안쪽이 분홍인 귀 둘이 갈라져 선다 (14x8)
      const x = even(head.cx) - 7;
      const y = Math.max(2, even(head.cy - head.ry) - 6);
      part(g, (t) => cells(t, x, y, ['XX...XX', 'XY...YX', 'XY...YX', 'XXXXXXX']), { outline: 'k' });
      break;
    }
    case 'eyepatch': {
      // 안대: 눈을 가리는 까만 천과 뒤로 넘어가는 끈
      const e = eyes[0];
      if (!e) break;
      const ex = e.x - (e.x & 1);
      const ey = e.y - (e.y & 1);
      line(g, ex - 2, ey - 1, ex - 9, ey - 6, 'X', 1);
      rect(g, ex - 2, ey - 2, 6, 6, 'X');
      break;
    }
    case 'monocle': {
      // 외알 안경: 금테 하나와 아래로 늘어진 사슬
      const e = eyes[0];
      if (!e) break;
      const ex = e.x - (e.x & 1);
      const ey = e.y - (e.y & 1);
      rect(g, ex - 3, ey - 3, 8, 2, 'X');
      rect(g, ex - 3, ey + 3, 8, 2, 'X');
      rect(g, ex - 3, ey - 1, 2, 4, 'X');
      rect(g, ex + 3, ey - 1, 2, 4, 'X');
      line(g, ex + 4, ey + 5, ex + 6, ey + 11, 'Y', 1);
      break;
    }
    case 'star': {
      // 머리 위에서 반짝이는 별 (10x10)
      const x = even(head.cx) - 5;
      const y = Math.max(2, even(head.cy - head.ry) - 8);
      part(g, (t) => cells(t, x, y, ['..X..', '.XXX.', 'XXYXX', '.XXX.', '..X..']), { outline: 'k' });
      break;
    }
    case 'glasses': {
      const rings = eyes.map((e) => ({ x: e.x - (e.x & 1), y: e.y - (e.y & 1) }));
      for (const r of rings) {
        // 눈(2x2)을 둘러싼 6x6 테
        rect(g, r.x - 2, r.y - 2, 6, 2, 'Y');
        rect(g, r.x - 2, r.y + 2, 6, 2, 'Y');
        rect(g, r.x - 2, r.y, 2, 2, 'Y');
        rect(g, r.x + 2, r.y, 2, 2, 'Y');
      }
      // 눈이 둘이면(정면) 가운데를 코걸이로 잇는다
      const [a, b] = rings;
      if (a && b) {
        const left = Math.min(a.x, b.x) + 4;
        const right = Math.max(a.x, b.x) - 2;
        if (right > left) rect(g, left, a.y, right - left, 2, 'Y');
      }
      break;
    }
    default:
      break;
  }
}

/** 날개를 그리는 방식: 꾸미기 장식(wings: X·Y 색)이거나, 용·전설 단계처럼 몸에 달린 날개(natural: p·P 색, 종마다 다른 금빛) */
export type WingKind = Accessory | 'natural';

/** 뿔 모양: pair 는 곧은 뿔 한 쌍(용), ossicones 는 끝이 둥근 짧은 뿔, antler 는 갈라진 뿔 한 쌍(청룡), single 은 길고 곧은 외뿔(기린) */
export type Horns = 'pair' | 'ossicones' | 'antler' | 'single';

/** 종의 설계(장식·몸 날개 여부)에서 어떤 날개를 그릴지 정한다. 꾸미기 날개가 있으면 그것이 우선이다. */
export function wingKind(spec: { accessory?: Accessory; bodyWings?: boolean }): WingKind | undefined {
  if (spec.accessory === 'wings') return 'wings';
  return spec.bodyWings ? 'natural' : spec.accessory;
}

/** 머리 위의 뿔. 윤곽선과 함께 p(뿔)·a(끝 장식) 색으로 그린다. */
export function drawHorns(g: Grid, kind: Horns | undefined, head: HeadGeom): void {
  if (!kind) return;
  const x = even(head.cx - head.rx * 0.35);
  const rowsOf: Record<Horns, readonly string[]> = {
    pair: ['p', 'p', 'p'],
    ossicones: ['a', 'p', 'p'],
    antler: ['p.p', 'ppp', '.p.'],
    single: ['p', 'p', 'p', 'p'],
  };
  const rows = rowsOf[kind];
  const y = Math.max(2, even(head.cy - head.ry) - (rows.length * 2 - 2));
  const at = kind === 'antler' ? [x - 2, x + 8] : kind === 'single' ? [x + 4] : [x, x + 6];
  part(
    g,
    (t) => {
      for (const hx of at) cells(t, hx, y, rows);
    },
    { outline: 'k' },
  );
}

/** 등에 다는 날개: (x, y)는 날개가 붙는 등 위쪽 자리. size 는 새끼 비율(0.6~1). */
export function drawBackWings(g: Grid, acc: WingKind | undefined, x: number, y: number, size: number): void {
  if (acc !== 'wings' && acc !== 'natural') return;
  const X = acc === 'wings' ? 'X' : 'p';
  const Y = acc === 'wings' ? 'Y' : 'P';
  const s = Math.max(0.7, size) * 1.05; // 작은 화면에서도 보이게 크게
  const bx = even(x);
  const by = even(y);
  part(
    g,
    (t) => {
      // 깃털 세 갈래가 위·뒤로 부채처럼 펼쳐진다
      line(t, bx, by, bx - 9 * s, by - 3 * s, X, 3 * s);
      line(t, bx, by, bx - 7 * s, by - 8 * s, X, 3 * s);
      line(t, bx, by, bx - 2 * s, by - 11 * s, X, 3 * s);
      // 깃털 끝
      px(t, Math.round(bx - 9 * s), Math.round(by - 3 * s), Y);
      px(t, Math.round(bx - 7 * s), Math.round(by - 8 * s), Y);
      px(t, Math.round(bx - 2 * s), Math.round(by - 11 * s), Y);
      triangle(t, bx + 1, by + 1, bx - 4 * s, by + 1, bx - 1, by - 3 * s, X);
    },
    { outline: 'k' },
  );
}

/** 테스트·미리보기용: 빈 격자에 장식만 그려 본다 */
export function accessoryOnly(acc: Accessory, head: HeadGeom, eyes: readonly { x: number; y: number }[]): Grid {
  const g = blank();
  drawHeadAccessory(g, acc, head, eyes);
  drawBackWings(g, acc, 12, 14, 1);
  return g;
}

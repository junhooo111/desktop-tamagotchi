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
import { fineDetail } from './detail.js';
import { PITY_RESETS_ON, type Rarity } from '../rarity.js';
import { cosmeticRarity } from '../cosmetics.js';

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
  | 'beret'
  | 'beanie'
  | 'bandana'
  | 'cowboy'
  | 'headphones'
  | 'pirate'
  | 'knight'
  | 'devil'
  | 'unicornhorn'
  | 'flamecrown'
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
  'beret',
  'beanie',
  'bandana',
  'cowboy',
  'headphones',
  'pirate',
  'knight',
  'devil',
  'unicornhorn',
  'flamecrown',
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
  beret: { X: '#c43a4a', Y: '#7a1f2a' },
  beanie: { X: '#4a9bff', Y: '#ffffff' },
  bandana: { X: '#e5484d', Y: '#ffffff' },
  cowboy: { X: '#c8975a', Y: '#7a5230' },
  headphones: { X: '#3a3f5a', Y: '#ff6b8b' },
  pirate: { X: '#2b2b3a', Y: '#f2f2f2' },
  knight: { X: '#aeb8c4', Y: '#e5484d' },
  devil: { X: '#e5484d', Y: '#7a1f2a' },
  unicornhorn: { X: '#ffffff', Y: '#ffd34a' },
  flamecrown: { X: '#ff9b2e', Y: '#ffd34a' },
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

/**
 * 머리 위에 얹는 장식 한 점. 장식의 "아랫단"이 머리 윗선(머리 맨 위)에 오도록 밑에서부터 자리를 잡는다.
 * 어른은 머리가 그림 맨 위에 가까워서 위쪽 빈 칸이 모자라는데, 예전에는 모자란 만큼 장식을 아래로 눌러 놓아서
 * 키 큰 모자가 얼굴을 덮었다. 이제는 빈 칸이 모자라면 가운데 줄을 빼서 키를 줄인다(아랫단·윗단은 남는다).
 * overlap: 아랫단이 머리 안으로 겹치는 칸 수(기본 2, 음수면 머리에서 떠 있다). dx: 가로로 옮기는 정도(머리 반폭 비율).
 */
/** 특별 이상 등급의 꾸미기는 1칸 도트 디테일(밝은 면·어두운 면·보석 반짝임)을 더한다 */
const isHighGrade = (r: Rarity): boolean => r === 'special' || PITY_RESETS_ON.includes(r);
let fineNow = false;

function placeOnHead(g: Grid, head: HeadGeom, rows: readonly string[], opts: { overlap?: number; dx?: number } = {}): void {
  const overlap = opts.overlap ?? 2;
  const bottom = even(head.cy - head.ry) + overlap;
  const room = Math.max(2, Math.floor(bottom / 2)); // 위쪽에 남은 줄 수(한 줄 = 2칸)
  const fitted = [...rows];
  while (fitted.length > room && fitted.length > 2) fitted.splice(Math.floor((fitted.length - 1) / 2), 1);
  const width = (fitted[0]?.length ?? 0) * 2;
  const x = even(head.cx + head.rx * (opts.dx ?? 0)) - Math.round(width / 2);
  const y = Math.max(0, bottom - fitted.length * 2);
  part(g, (t) => cells(t, x, y, fitted), { outline: 'k' });
  if (fineNow) fineDetail(g, x, y, fitted, { hi: 'H', sh: 'S' }, 'X', 'Y');
}

/** 중심 (cx, cy) 에서 반지름이 rIn~rOut 사이인 2x2 칸을 채운다(둥근 테·머리띠용). keep 이 있으면 true 인 칸만. */
function ringBlocks(t: Grid, cx: number, cy: number, rIn: number, rOut: number, ch: string, keep?: (x: number, y: number) => boolean): void {
  const r = Math.ceil(rOut / 2) * 2 + 2;
  for (let y = even(cy) - r; y <= even(cy) + r; y += 2) {
    for (let x = even(cx) - r; x <= even(cx) + r; x += 2) {
      const d = Math.hypot(x + 1 - cx, y + 1 - cy);
      if (d >= rIn && d <= rOut && (!keep || keep(x, y))) rect(t, x, y, 2, 2, ch);
    }
  }
}

/** 머리에 쓰는 장식: 모자류는 머리 위에, 안경류는 눈 둘레에 그린다. eyes 는 눈(2x2)의 왼쪽 위 칸이다. */
export function drawHeadAccessory(g: Grid, acc: Accessory | undefined, head: HeadGeom, eyes: readonly { x: number; y: number }[]): void {
  fineNow = acc !== undefined && acc !== 'none' && isHighGrade(cosmeticRarity('accessory', acc));
  switch (acc) {
    case 'crown':
      // 왕관: 뾰족한 끝 셋과 보석 셋이 박힌 띠 (14x6). 끝 사이는 4칸을 비워야 윤곽선에 묻히지 않는다.
      placeOnHead(g, head, ['X..X..X', 'XXXXXXX', 'XYXYXYX']);
      break;
    case 'ribbon':
      // 머리 위쪽 뒤편에 단 큰 리본: 좌우 고리와 가운데 매듭 (12x6)
      placeOnHead(g, head, ['XX..XX', 'XXYYXX', 'XX..XX'], { dx: -0.35 });
      break;
    case 'sprout':
      // 새싹: 가는 줄기 위로 잎 둘이 V 자로 갈라져 돋는다 (14x10)
      placeOnHead(g, head, ['XX...XX', 'XXX.XXX', '.XXYXX.', '...Y...', '...Y...']);
      break;
    case 'flower':
      // 머리 위쪽 뒤편의 꽃: 꽃잎 다섯과 노란 가운데 (10x10)
      placeOnHead(g, head, ['.X.X.', 'XXXXX', 'XXYXX', 'XXXXX', '.X.X.'], { dx: -0.35 });
      break;
    case 'partyhat':
      // 뾰족한 파티 모자: 끝에 방울, 줄무늬, 아래로 갈수록 넓어진다 (10x10)
      placeOnHead(g, head, ['..Y..', '..X..', '.XYX.', '.XXX.', 'XYXYX']);
      break;
    case 'halo':
      // 머리 위에 떠 있는 금빛 고리 (12x6)
      placeOnHead(g, head, ['.YXXY.', 'X....X', '.YXXY.'], { overlap: -2 });
      break;
    case 'cap':
      // 야구모자: 둥근 모자에 앞으로 나온 챙 (14x6)
      placeOnHead(g, head, ['.XXXX..', 'XXXXXX.', 'YYYYYYY']);
      break;
    case 'witch':
      // 마법사 모자: 뾰족하게 솟은 모자와 넓은 챙, 금빛 띠 (14x12)
      placeOnHead(g, head, ['...X...', '...X...', '..XXX..', '..XYX..', '.XXXXX.', 'XXXXXXX']);
      break;
    case 'chef':
      // 요리사 모자: 위가 두 덩이로 부풀어 오른 높은 흰 모자와 아래 띠 (10x10)
      placeOnHead(g, head, ['.X.X.', 'XXXXX', 'XXXXX', 'XXXXX', 'YYYYY']);
      break;
    case 'santa':
      // 산타 모자: 빨간 모자, 하얀 방울과 둘레 (12x8)
      placeOnHead(g, head, ['..XXY.', '.XXXX.', 'XXXXXX', 'YYYYYY']);
      break;
    case 'headband': {
      // 별 머리띠: 머리 윗선을 따라 두른 굽은 띠 위에 별 하나
      part(
        g,
        (t) => ringBlocks(t, head.cx, head.cy, Math.min(head.rx, head.ry) - 1.2, Math.max(head.rx, head.ry) + 0.8, 'X', (_x, y) => y + 1 < head.cy - head.ry * 0.25 && y + 1 > head.cy - head.ry - 3),
        { outline: 'k' },
      );
      placeOnHead(g, head, ['..Y..', '.YYY.', '..Y..'], { dx: 0.15, overlap: 0 });
      break;
    }
    case 'antenna':
      // 하트 더듬이: 가는 줄기 끝에 달린 하트(가운데가 파인 모양) (6x10)
      placeOnHead(g, head, ['X.X', 'XXX', '.X.', '.Y.', '.Y.'], { dx: -0.2 });
      break;
    case 'bunnyears':
      // 토끼 귀 머리띠: 안쪽이 분홍인 귀 둘이 갈라져 선다 (14x8)
      placeOnHead(g, head, ['XX...XX', 'XY...YX', 'XY...YX', 'XXXXXXX']);
      break;
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
      // 외알 안경: 눈 하나를 둘러싼 둥근 금테와, 뒤로 늘어진 사슬
      const e = eyes[0];
      if (!e) break;
      const ex = e.x - (e.x & 1);
      const ey = e.y - (e.y & 1);
      part(g, (t) => ringBlocks(t, ex + 1, ey + 1, 3, 5.4, 'X'), { outline: 'k' });
      // 사슬: 테 아래쪽에서 뒤쪽 아래로 이어지는 짧은 점선
      for (const [dx, dy] of [[-2, 6], [-4, 8], [-4, 10], [-2, 12]] as const) rect(g, ex + dx, ey + dy, 2, 2, 'Y');
      break;
    }
    case 'star': {
      // 머리 위에서 반짝이는 별과, 양옆의 작은 반짝임 (10x10)
      placeOnHead(g, head, ['..X..', '.XXX.', 'XXYXX', '.XXX.', '..X..'], { overlap: 0 });
      const top = even(head.cy - head.ry);
      const sx = even(head.cx);
      rect(g, sx - 10, Math.max(0, top - 8), 2, 2, 'Y');
      rect(g, sx + 8, Math.max(0, top - 6), 2, 2, 'Y');
      break;
    }
    case 'beret':
      // 베레모
      placeOnHead(g, head, ['..Y...', '.XXXX.', 'XXXXXX']);
      break;
    case 'beanie':
      // 비니
      placeOnHead(g, head, ['..YY..', '.XXXX.', 'XXXXXX', 'YYYYYY']);
      break;
    case 'bandana':
      // 두건
      placeOnHead(g, head, ['XXXXXXX', 'XYXYXYX', '..XXX..']);
      break;
    case 'cowboy':
      // 카우보이 모자
      placeOnHead(g, head, ['...XXX...', '..XXXXX..', 'YYYYYYYYY']);
      break;
    case 'headphones':
      // 헤드폰
      placeOnHead(g, head, ['.XXXXXX.', 'X......X', 'YY....YY']);
      break;
    case 'pirate':
      // 해적 모자
      placeOnHead(g, head, ['..XXXX..', 'XXXYYXXX', 'XXXXXXXX']);
      break;
    case 'knight':
      // 기사 투구
      placeOnHead(g, head, ['..Y..', '.YYY.', 'XXXXX', 'XXXXX', 'XXXXX']);
      break;
    case 'devil':
      // 악마 뿔
      placeOnHead(g, head, ['X.....X', 'XX...XX', '.X...X.']);
      break;
    case 'unicornhorn':
      // 유니콘 뿔
      placeOnHead(g, head, ['.Y.', '.X.', 'XYX', 'XXX']);
      break;
    case 'flamecrown':
      // 불꽃 왕관
      placeOnHead(g, head, ['..Y...Y..', '.YXY.YXY.', 'XXXXXXXXX', 'XYXYXYXYX']);
      break;
    case 'glasses': {
      // 선글라스: 눈을 통째로 가리는 짙은 렌즈 하나(옆모습), 윗테의 반짝임, 귀 쪽으로 뻗는 다리
      const e = eyes[0];
      if (!e) break;
      const ex = e.x - (e.x & 1);
      const ey = e.y - (e.y & 1);
      rect(g, ex - 2, ey - 2, 10, 2, 'X'); // 윗테(밝은 색)
      rect(g, ex - 2, ey, 10, 4, 'Y'); // 렌즈
      rect(g, ex, ey + 1, 2, 1, 'X'); // 렌즈 반짝임
      rect(g, ex - 8, ey - 2, 6, 2, 'Y'); // 다리: 눈에서 귀 쪽으로
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
  if (acc === 'wings') {
    // 꾸미기 날개: 어깨에서 위·뒤로 펼친 깃털 날개. 깃이 한 겹씩 계단처럼 늘어나고 Y 색 깃줄이 보인다(2칸 단위 도트).
    const rows = ['XXY....', 'XXXY...', 'XYXXY..', '.XXYXXY', '..XXYXX', '...XXXX'];
    part(g, (t) => cells(t, bx - 12, Math.max(0, by - 11), rows), { outline: 'k' });
    fineDetail(g, bx - 12, Math.max(0, by - 11), rows, { hi: 'H', sh: 'S' }, 'X', 'Y'); // 날개는 전설 등급: 깃털 윗면에 밝은 줄
    void s;
    return;
  }
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

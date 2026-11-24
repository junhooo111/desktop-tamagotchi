/**
 * 펫 종류와 픽셀 스프라이트.
 *
 * 스프라이트는 16x16 옆모습(오른쪽을 본다)이고, pixel.ts 의 도구로 코드로 그린다.
 * 왼쪽을 보거나 벽에 붙을 때는 그림을 뒤집고 돌려서 쓴다(motion.ts 의 방향 규칙).
 * 한 종마다 프레임이 9개다.
 *   stand            서 있는 모습
 *   walkA / walkB    걷기: 다리를 번갈아 내디딘다
 *   runA / runB      뛰기: 몸이 뜨고 다리가 크게 벌어진다
 *   sleepA / sleepB  엎드려 자기: 숨 쉬듯 두 모습을 번갈아 쓴다
 *   hangA / hangB    마우스에 매달린 모습(정면, 다리가 흔들린다)
 * 임시 그림이라 나중에 직접 그린 이미지로 바꿀 수 있다.
 */
import { SIZE, blank, ellipse, mark, outline, px, rect, shift, type Grid } from './pixel.js';

export { SIZE as SPRITE_SIZE };

export type SpeciesId = 'rabbit' | 'cat' | 'dog' | 'turtle' | 'chick' | 'duck';

export const FRAME_NAMES = [
  'stand',
  'walkA',
  'walkB',
  'runA',
  'runB',
  'sleepA',
  'sleepB',
  'hangA',
  'hangB',
] as const;
export type FrameName = (typeof FRAME_NAMES)[number];
export type Frames = Record<FrameName, string[]>;

type WalkPose = 'stand' | 'walkA' | 'walkB' | 'runA' | 'runB';

export interface SpriteSet {
  /** 문자 → '#rrggbb' */
  readonly palette: Readonly<Record<string, string>>;
  readonly frames: Frames;
  /** 눈 감을 때 눈('e') 자리에 칠할 몸 색 문자. 눈이 없으면 비운다. */
  readonly blink: string;
}

export interface Species extends SpriteSet {
  readonly id: SpeciesId;
  readonly name: string;
}

const OUTLINE = '#3b2f2f';

interface Leg {
  x: number;
  w: number;
}

/** 자세별 다리 위치: b/f 는 뒷다리·앞다리의 가로 이동, lb/lf 는 들어 올리는 높이 */
const LEG_POSE: Record<WalkPose, { b: number; f: number; lb: number; lf: number }> = {
  stand: { b: 0, f: 0, lb: 0, lf: 0 },
  walkA: { b: -1, f: 1, lb: 0, lf: 1 },
  walkB: { b: 1, f: -1, lb: 1, lf: 0 },
  runA: { b: -2, f: 2, lb: 1, lf: 1 },
  runB: { b: 1, f: -1, lb: 1, lf: 1 },
};

/** 다리를 그린다. legs[0] 은 뒷다리, legs[1] 은 앞다리다. */
function drawLegs(g: Grid, legs: readonly [Leg, Leg], top: number, bottom: number, c: string, pose: WalkPose): void {
  const [back, front] = legs;
  const p = LEG_POSE[pose];
  rect(g, back.x + p.b, top, back.w, bottom - top + 1 - p.lb, c);
  rect(g, front.x + p.f, top, front.w, bottom - top + 1 - p.lf, c);
}

interface Design {
  walk: (pose: WalkPose) => Grid;
  sleep: (breath: 0 | 1) => Grid;
  hang: (swing: 0 | 1) => Grid;
}

function framesOf(d: Design): Frames {
  // 뛸 때는 몸 전체가 한 칸 떠오른다.
  const walk = (p: WalkPose): string[] =>
    outline(p === 'runA' || p === 'runB' ? shift(d.walk(p), 0, -1) : d.walk(p));
  return {
    stand: walk('stand'),
    walkA: walk('walkA'),
    walkB: walk('walkB'),
    runA: walk('runA'),
    runB: walk('runB'),
    sleepA: outline(d.sleep(0)),
    sleepB: outline(d.sleep(1)),
    hangA: outline(d.hang(0)),
    hangB: outline(d.hang(1)),
  };
}

// ---- 매달린 모습: 한 손으로 마우스를 잡고 대롱대롱 (정면, 종마다 특징만 다르게) ----
interface HangTrait {
  head: string;
  body: string;
  ears: 'cat' | 'dog' | 'rabbit' | 'none';
  beak: boolean;
  marks?: (g: Grid) => void;
}

function hangGrid(t: HangTrait, swing: 0 | 1): Grid {
  const g = blank();
  rect(g, 8, 0, 1, 5, 'o'); // 마우스를 잡은 팔
  if (t.ears === 'cat') {
    rect(g, 5, 3, 2, 3, 'o');
    rect(g, 10, 3, 2, 3, 'o');
  }
  if (t.ears === 'rabbit') {
    rect(g, 6, 0, 1, 6, 'o');
    rect(g, 10, 0, 1, 6, 'o');
  }
  ellipse(g, 8, 7, 3.4, 2.8, t.head);
  ellipse(g, 8, 11, 3.2, 2.2, t.body);
  if (t.ears === 'dog') {
    rect(g, 4, 6, 2, 4, 'd');
    rect(g, 11, 6, 2, 4, 'd');
  }
  const legX = swing === 0 ? [6, 10] : [7, 9];
  legX.forEach((x) => px(g, x, 14, 'o'));
  px(g, 7, 7, 'e');
  px(g, 9, 7, 'e');
  if (t.beak) px(g, 8, 8, 'b');
  t.marks?.(g);
  return g;
}

// ---- 종별 그림 ----
function cat(pose: WalkPose): Grid {
  const g = blank();
  rect(g, 1, 4, 2, 5, 'o'); // 꼬리
  drawLegs(g, [{ x: 3, w: 2 }, { x: 10, w: 2 }], 11, 14, 'o', pose);
  ellipse(g, 7, 10, 5.5, 3.2, 'o'); // 몸
  mark(g, 4, 11, 8, 3, 'l'); // 배
  mark(g, 4, 7, 1, 2, 'd');
  mark(g, 6, 7, 1, 2, 'd');
  mark(g, 8, 7, 1, 2, 'd'); // 줄무늬
  ellipse(g, 11, 6, 3.6, 3.2, 'o'); // 머리
  rect(g, 8, 1, 2, 3, 'o');
  rect(g, 12, 1, 2, 3, 'o'); // 귀
  px(g, 9, 2, 'p');
  px(g, 12, 2, 'p');
  mark(g, 12, 7, 3, 2, 'l'); // 주둥이
  px(g, 12, 5, 'e');
  px(g, 14, 7, 'p');
  return g;
}

function catSleep(b: 0 | 1): Grid {
  const g = blank();
  ellipse(g, 7, 11 - 0.5 * b, 6, 3.2 + 0.4 * b, 'o');
  mark(g, 3, 13, 7, 2, 'l');
  ellipse(g, 11, 12, 3, 2.6, 'o'); // 앞발에 얹은 머리
  rect(g, 9, 9, 2, 2, 'o');
  rect(g, 12, 9, 2, 2, 'o');
  px(g, 10, 10, 'p');
  px(g, 12, 10, 'p');
  px(g, 11, 12, 'e');
  px(g, 12, 12, 'e'); // 감은 눈
  px(g, 14, 13, 'p');
  return g;
}

function dog(pose: WalkPose): Grid {
  const g = blank();
  rect(g, 1, 5, 2, 4, 'o'); // 꼬리
  drawLegs(g, [{ x: 3, w: 2 }, { x: 10, w: 2 }], 11, 14, 'o', pose);
  ellipse(g, 7, 10, 5.5, 3.2, 'o');
  mark(g, 4, 12, 8, 2, 'l');
  ellipse(g, 11, 6, 3.4, 3, 'o');
  mark(g, 12, 7, 3, 2, 'l'); // 주둥이
  px(g, 14, 7, 'n'); // 코(눈과 달리 눈 감을 때도 그대로)
  px(g, 12, 5, 'e');
  rect(g, 9, 4, 2, 4, 'd'); // 늘어진 귀
  return g;
}

function dogSleep(b: 0 | 1): Grid {
  const g = blank();
  rect(g, 1, 11, 2, 2, 'o');
  ellipse(g, 7, 11 - 0.5 * b, 6, 3.2 + 0.4 * b, 'o');
  mark(g, 3, 13, 7, 2, 'l');
  ellipse(g, 11, 12, 3, 2.6, 'o');
  mark(g, 12, 12, 3, 2, 'l');
  rect(g, 9, 11, 2, 3, 'd');
  px(g, 14, 12, 'n');
  px(g, 12, 11, 'e');
  px(g, 13, 11, 'e');
  return g;
}

function rabbit(pose: WalkPose): Grid {
  const g = blank();
  ellipse(g, 2, 10, 1.6, 1.6, 'o'); // 솜방울 꼬리
  drawLegs(g, [{ x: 3, w: 2 }, { x: 10, w: 2 }], 12, 14, 'o', pose);
  ellipse(g, 7, 10, 4.8, 3.2, 'o');
  ellipse(g, 4, 11, 2.6, 2.4, 'o'); // 통통한 뒷다리
  ellipse(g, 11, 7, 3, 2.8, 'o');
  rect(g, 9, 1, 2, 5, 'o');
  rect(g, 12, 1, 2, 5, 'o'); // 긴 귀
  rect(g, 10, 2, 1, 3, 'p');
  rect(g, 12, 2, 1, 3, 'p');
  px(g, 12, 6, 'e');
  px(g, 14, 8, 'p');
  return g;
}

function rabbitSleep(b: 0 | 1): Grid {
  const g = blank();
  ellipse(g, 2, 12, 1.6, 1.6, 'o');
  ellipse(g, 7, 11 - 0.5 * b, 5.5, 3.2 + 0.4 * b, 'o');
  ellipse(g, 11, 12, 2.8, 2.4, 'o');
  rect(g, 8, 9, 4, 1, 'o'); // 뒤로 누운 귀
  mark(g, 9, 9, 2, 1, 'p');
  px(g, 12, 12, 'e');
  px(g, 13, 12, 'e');
  px(g, 14, 13, 'p');
  return g;
}

function chick(pose: WalkPose): Grid {
  const g = blank();
  drawLegs(g, [{ x: 6, w: 1 }, { x: 9, w: 1 }], 13, 14, 'b', pose);
  ellipse(g, 7, 9, 5.2, 4.2, 'o'); // 둥근 몸
  ellipse(g, 10, 6, 3.6, 3.4, 'o'); // 머리
  px(g, 10, 2, 'o');
  px(g, 9, 2, 'o'); // 머리 깃털
  mark(g, 4, 8, 5, 3, 'd'); // 날개
  px(g, 12, 5, 'e');
  rect(g, 14, 6, 1, 2, 'b'); // 부리
  return g;
}

function chickSleep(b: 0 | 1): Grid {
  const g = blank();
  ellipse(g, 7, 11 - 0.5 * b, 5.5, 3.6 + 0.4 * b, 'o');
  ellipse(g, 10, 10, 3.6, 3, 'o');
  mark(g, 4, 10, 5, 3, 'd');
  px(g, 11, 9, 'e');
  px(g, 12, 9, 'e');
  px(g, 14, 10, 'b');
  return g;
}

function duck(pose: WalkPose): Grid {
  const g = blank();
  drawLegs(g, [{ x: 5, w: 1 }, { x: 9, w: 1 }], 13, 14, 'b', pose);
  rect(g, 1, 7, 2, 2, 'o'); // 꼬리
  ellipse(g, 7, 10, 5.3, 3.4, 'o'); // 몸
  mark(g, 4, 9, 6, 3, 'd'); // 날개
  rect(g, 10, 6, 3, 3, 'g'); // 목
  ellipse(g, 11, 5, 2.8, 2.8, 'g'); // 머리
  rect(g, 13, 5, 2, 2, 'b'); // 부리
  px(g, 12, 4, 'e');
  return g;
}

function duckSleep(b: 0 | 1): Grid {
  const g = blank();
  rect(g, 1, 10, 2, 2, 'o');
  ellipse(g, 7, 11 - 0.5 * b, 5.5, 3.4 + 0.4 * b, 'o');
  mark(g, 4, 11, 6, 2, 'd');
  ellipse(g, 10, 9, 2.6, 2.4, 'g'); // 등에 파묻은 머리
  rect(g, 12, 9, 2, 1, 'b');
  px(g, 10, 8, 'e');
  px(g, 11, 8, 'e');
  return g;
}

function turtle(pose: WalkPose): Grid {
  const g = blank();
  px(g, 1, 11, 'o'); // 꼬리
  drawLegs(g, [{ x: 3, w: 2 }, { x: 9, w: 2 }], 12, 14, 'o', pose);
  ellipse(g, 7, 9, 5.5, 3.6, 's'); // 등딱지
  mark(g, 6, 7, 3, 1, 'h');
  mark(g, 5, 9, 1, 2, 'h');
  mark(g, 9, 9, 1, 2, 'h');
  mark(g, 6, 11, 3, 1, 'h'); // 무늬
  ellipse(g, 12, 9, 2.2, 2, 'o'); // 머리
  px(g, 13, 8, 'e');
  return g;
}

function turtleSleep(b: 0 | 1): Grid {
  const g = blank();
  ellipse(g, 7, 11 - 0.5 * b, 5.5, 3.2 + 0.4 * b, 's');
  mark(g, 6, 9, 3, 1, 'h');
  mark(g, 5, 11, 1, 2, 'h');
  mark(g, 9, 11, 1, 2, 'h');
  ellipse(g, 12, 13, 1.8, 1.3, 'o'); // 살짝 내민 머리
  px(g, 12, 13, 'e');
  rect(g, 3, 14, 2, 1, 'o');
  rect(g, 9, 14, 2, 1, 'o');
  return g;
}

function egg(): string[] {
  const g = blank();
  ellipse(g, 7, 8, 4.6, 6, 'o');
  [[6, 5], [9, 8], [5, 10], [8, 3], [10, 6], [7, 12]].forEach(([x, y]) => mark(g, x ?? 0, y ?? 0, 1, 1, 's'));
  return outline(g);
}

const eggFrame = egg();

/** 알은 걷지 않으므로 프레임이 모두 같다(렌더러가 통통 튀게만 한다). */
export const EGG: SpriteSet = {
  palette: { k: OUTLINE, o: '#fffbe8', s: '#e8c46a' },
  frames: Object.fromEntries(FRAME_NAMES.map((n) => [n, eggFrame])) as Frames,
  blink: '',
};

export const SPECIES: readonly Species[] = [
  {
    id: 'rabbit',
    name: '토끼',
    palette: { k: OUTLINE, e: OUTLINE, o: '#f4f4f4', p: '#f4a6b8' },
    frames: framesOf({
      walk: rabbit,
      sleep: rabbitSleep,
      hang: (s) => hangGrid({ head: 'o', body: 'o', ears: 'rabbit', beak: false, marks: (g) => mark(g, 6, 1, 1, 3, 'p') }, s),
    }),
    blink: 'o',
  },
  {
    id: 'cat',
    name: '고양이',
    palette: { k: OUTLINE, e: OUTLINE, o: '#f0a04b', l: '#fbe3c0', p: '#f4a6b8', d: '#c97a2b' },
    frames: framesOf({
      walk: cat,
      sleep: catSleep,
      hang: (s) => hangGrid({ head: 'o', body: 'o', ears: 'cat', beak: false, marks: (g) => mark(g, 7, 11, 3, 3, 'l') }, s),
    }),
    blink: 'o',
  },
  {
    id: 'dog',
    name: '강아지',
    palette: { k: OUTLINE, e: OUTLINE, n: OUTLINE, o: '#d2a679', d: '#8a5a2b', l: '#f5e1c0' },
    frames: framesOf({
      walk: dog,
      sleep: dogSleep,
      hang: (s) => hangGrid({ head: 'o', body: 'o', ears: 'dog', beak: false, marks: (g) => mark(g, 7, 11, 3, 3, 'l') }, s),
    }),
    blink: 'o',
  },
  {
    id: 'turtle',
    name: '거북이',
    palette: { k: OUTLINE, e: OUTLINE, o: '#9bd37a', s: '#4e9f50', h: '#2f6f3a' },
    frames: framesOf({
      walk: turtle,
      sleep: turtleSleep,
      hang: (s) => hangGrid({ head: 'o', body: 's', ears: 'none', beak: false, marks: (g) => mark(g, 7, 11, 3, 2, 'h') }, s),
    }),
    blink: 'o',
  },
  {
    id: 'chick',
    name: '병아리',
    palette: { k: OUTLINE, e: OUTLINE, o: '#ffd84a', d: '#f0b400', b: '#ff9a2e' },
    frames: framesOf({
      walk: chick,
      sleep: chickSleep,
      hang: (s) => hangGrid({ head: 'o', body: 'o', ears: 'none', beak: true, marks: (g) => { mark(g, 5, 11, 1, 2, 'd'); mark(g, 11, 11, 1, 2, 'd'); } }, s),
    }),
    blink: 'o',
  },
  {
    id: 'duck',
    name: '오리',
    palette: { k: OUTLINE, e: OUTLINE, o: '#fafafa', g: '#3e8e5a', d: '#cfd8dc', b: '#ff9a2e' },
    frames: framesOf({
      walk: duck,
      sleep: duckSleep,
      hang: (s) => hangGrid({ head: 'g', body: 'o', ears: 'none', beak: true, marks: (g) => { mark(g, 5, 11, 1, 2, 'd'); mark(g, 11, 11, 1, 2, 'd'); } }, s),
    }),
    blink: 'g',
  },
];

export function getSpecies(id: SpeciesId): Species {
  const found = SPECIES.find((s) => s.id === id);
  if (!found) throw new Error(`알 수 없는 펫 종류: ${id}`);
  return found;
}

export function isSpeciesId(value: unknown): value is SpeciesId {
  return typeof value === 'string' && SPECIES.some((s) => s.id === value);
}

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** 프레임 하나를 정수 배율로 키운 RGBA 비트맵으로 만든다(트레이 아이콘·미리보기용). */
export function frameToRgba(
  rows: readonly string[],
  palette: Readonly<Record<string, string>>,
  scale: number,
): { width: number; height: number; data: Uint8Array } {
  const size = SIZE * scale;
  const data = new Uint8Array(size * size * 4);
  rows.forEach((row, y) => {
    [...row].forEach((ch, x) => {
      const hex = palette[ch];
      if (!hex) return;
      const [r, g, b] = hexToRgb(hex);
      for (let dy = 0; dy < scale; dy++) {
        for (let dx = 0; dx < scale; dx++) {
          const i = ((y * scale + dy) * size + (x * scale + dx)) * 4;
          data[i] = r;
          data[i + 1] = g;
          data[i + 2] = b;
          data[i + 3] = 255;
        }
      }
    });
  });
  return { width: size, height: size, data };
}

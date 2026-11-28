/**
 * 소품: 펫 곁을 따라다니는 작은 물건(공·뼈다귀·풍선…). 꾸미기 뽑기 전용이다.
 * 펫 그림과 따로 그려서(펫의 몸이 바뀌어도 그대로) 렌더러가 펫 옆에 얹는다.
 * 그림은 16x16 안에 그린 뒤 윤곽선을 두르고 빈 둘레를 잘라 낸 문자 그림이다. 색은 소품마다 PROP_COLORS 의 글자(a~d)로 칠한다.
 */
import { blank, ellipse, line, outline, px, rect, type Grid } from '../pixel.js';

export type Prop = 'none' | 'ball' | 'bone' | 'fish' | 'balloon' | 'pot' | 'butterfly' | 'lantern' | 'dragonegg';

export const PROPS: readonly Prop[] = ['none', 'ball', 'bone', 'fish', 'balloon', 'pot', 'butterfly', 'lantern', 'dragonegg'];

export const isProp = (v: unknown): v is Prop => typeof v === 'string' && (PROPS as readonly string[]).includes(v);

/** ground: 펫 앞 바닥에서 통통 튄다 / float: 펫 머리 높이에서 둥실 떠 있다 */
export const PROP_MOTION: Record<Exclude<Prop, 'none'>, 'ground' | 'float'> = {
  ball: 'ground',
  bone: 'ground',
  fish: 'ground',
  pot: 'ground',
  balloon: 'float',
  butterfly: 'float',
  lantern: 'float',
  dragonegg: 'ground',
};

/** 글자 a~d 의 색(k 는 윤곽선, w 는 하이라이트) */
export const PROP_COLORS: Record<Exclude<Prop, 'none'>, Record<string, string>> = {
  ball: { a: '#e5484d', b: '#4a9bff', w: '#ffffff', k: '#3b2f2f' },
  bone: { a: '#fffaf0', b: '#d9cfb8', w: '#ffffff', k: '#3b2f2f' },
  fish: { a: '#ff9b2e', b: '#ffd34a', w: '#ffffff', k: '#3b2f2f' },
  balloon: { a: '#ff6b8b', b: '#ffb3c8', w: '#ffffff', k: '#3b2f2f' },
  pot: { a: '#c8693a', b: '#4fae5a', w: '#ff6b8b', k: '#3b2f2f' },
  butterfly: { a: '#7a5cff', b: '#b8a8ff', w: '#ffffff', k: '#3b2f2f' },
  lantern: { a: '#ff9b2e', b: '#ffe14a', w: '#fff6c8', k: '#3b2f2f' },
  dragonegg: { a: '#7a5cff', b: '#ffd34a', w: '#c9b8ff', k: '#3b2f2f' },
};

type Draw = (g: Grid) => void;

const DRAW: Record<Exclude<Prop, 'none'>, Draw> = {
  ball: (g) => {
    ellipse(g, 6, 6, 5, 5, 'a');
    rect(g, 1, 6, 11, 2, 'w'); // 가운데 줄무늬
    rect(g, 3, 3, 3, 2, 'w');
    px(g, 8, 9, 'b');
  },
  bone: (g) => {
    rect(g, 3, 4, 9, 3, 'a');
    ellipse(g, 3, 4, 2, 2, 'a');
    ellipse(g, 3, 7, 2, 2, 'a');
    ellipse(g, 12, 4, 2, 2, 'a');
    ellipse(g, 12, 7, 2, 2, 'a');
    rect(g, 4, 6, 7, 1, 'b');
  },
  fish: (g) => {
    ellipse(g, 7, 6, 5, 3, 'a');
    rect(g, 11, 4, 3, 5, 'a'); // 꼬리
    rect(g, 12, 3, 2, 1, 'a');
    rect(g, 12, 9, 2, 1, 'a');
    rect(g, 6, 4, 1, 5, 'b'); // 줄무늬
    rect(g, 8, 4, 1, 5, 'b');
    px(g, 3, 5, 'w');
  },
  balloon: (g) => {
    ellipse(g, 7, 5, 4, 5, 'a');
    px(g, 5, 3, 'w');
    px(g, 5, 4, 'w');
    rect(g, 6, 10, 3, 1, 'a'); // 매듭
    line(g, 7, 11, 7, 13, 'b');
  },
  pot: (g) => {
    rect(g, 3, 8, 9, 6, 'a'); // 화분
    rect(g, 2, 7, 11, 2, 'a');
    rect(g, 7, 3, 1, 5, 'b'); // 줄기
    ellipse(g, 5, 5, 2, 1, 'b'); // 잎
    ellipse(g, 10, 4, 2, 1, 'b');
    px(g, 7, 2, 'w'); // 꽃
    px(g, 6, 2, 'w');
    px(g, 8, 2, 'w');
    px(g, 7, 1, 'w');
    px(g, 7, 3, 'w');
  },
  butterfly: (g) => {
    ellipse(g, 4, 5, 3, 3, 'a');
    ellipse(g, 11, 5, 3, 3, 'a');
    ellipse(g, 5, 9, 2, 2, 'b');
    ellipse(g, 10, 9, 2, 2, 'b');
    rect(g, 7, 3, 2, 8, 'w');
    px(g, 4, 5, 'b');
    px(g, 11, 5, 'b');
  },
  lantern: (g) => {
    rect(g, 6, 1, 4, 1, 'a'); // 꼭지
    rect(g, 4, 3, 8, 8, 'a');
    rect(g, 5, 4, 6, 6, 'b'); // 불빛
    rect(g, 6, 5, 4, 4, 'w');
    rect(g, 5, 11, 6, 1, 'a');
    px(g, 8, 12, 'a');
    px(g, 8, 13, 'a');
  },
  dragonegg: (g) => {
    ellipse(g, 7, 7, 5, 6, 'a');
    rect(g, 3, 6, 9, 1, 'b'); // 무늬
    rect(g, 4, 9, 7, 1, 'b');
    px(g, 5, 3, 'w');
    px(g, 6, 3, 'w');
    px(g, 5, 4, 'w');
    px(g, 9, 5, 'b');
    px(g, 7, 12, 'b');
  },
};

const cache = new Map<Prop, string[]>();

/** 소품 그림(문자 그림). 빈 둘레는 잘려 있다. none 이면 빈 배열. */
export function propRows(prop: Prop): string[] {
  if (prop === 'none') return [];
  const hit = cache.get(prop);
  if (hit) return hit;
  const g = blank();
  DRAW[prop](g);
  const rows = outline(g, 'k');
  let x0 = 99;
  let x1 = -1;
  let y0 = 99;
  let y1 = -1;
  rows.forEach((row, y) => {
    [...row].forEach((ch, x) => {
      if (ch === '.') return;
      x0 = Math.min(x0, x);
      x1 = Math.max(x1, x);
      y0 = Math.min(y0, y);
      y1 = Math.max(y1, y);
    });
  });
  const cropped = y1 < 0 ? [] : rows.slice(y0, y1 + 1).map((r) => r.slice(x0, x1 + 1));
  cache.set(prop, cropped);
  return cropped;
}

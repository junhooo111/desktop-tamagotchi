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

/** 2장짜리 움직임: 0 과 1 을 번갈아 보여 준다(소품이 조금씩 움직인다). */
type Draw = (g: Grid, phase: 0 | 1) => void;

const DRAW: Record<Exclude<Prop, 'none'>, Draw> = {
  // 공: 둥근 모양과 살짝 찌그러진 모양이 번갈아(튀는 느낌), 줄무늬가 돈다
  ball: (g, ph) => {
    if (ph === 0) {
      ellipse(g, 7, 7, 6, 6, 'a');
      rect(g, 1, 6, 13, 2, 'w');
      rect(g, 4, 2, 3, 2, 'w');
      px(g, 4, 4, 'w');
      rect(g, 9, 10, 3, 2, 'b');
    } else {
      ellipse(g, 7, 8, 7, 5, 'a');
      rect(g, 0, 7, 15, 2, 'w');
      rect(g, 3, 4, 3, 2, 'w');
      rect(g, 9, 10, 3, 1, 'b');
    }
  },
  // 뼈다귀: 한쪽 끝이 까딱까딱
  bone: (g, ph) => {
    const l = ph === 0 ? 0 : 1;
    const r = ph === 0 ? 1 : 0;
    rect(g, 3, 5 + (l + r) / 2, 10, 4, 'a');
    ellipse(g, 3, 4 + l, 2.2, 2.2, 'a');
    ellipse(g, 3, 9 + l, 2.2, 2.2, 'a');
    ellipse(g, 12, 4 + r, 2.2, 2.2, 'a');
    ellipse(g, 12, 9 + r, 2.2, 2.2, 'a');
    rect(g, 4, 8 + (l + r) / 2, 8, 1, 'b');
    px(g, 2, 3 + l, 'w');
  },
  // 생선: 몸 왼쪽이 머리, 꼬리가 좌우로 살랑살랑
  fish: (g, ph) => {
    ellipse(g, 6, 8, 6, 4, 'a');
    rect(g, 2, 9, 9, 2, 'b'); // 배
    // 등지느러미
    rect(g, 5, 3, 4, 1, 'a');
    rect(g, 6, 2, 2, 1, 'a');
    // 꼬리(위아래로 흔들린다)
    const t = ph === 0 ? 0 : 1;
    rect(g, 11, 6 + t, 2, 5, 'a');
    rect(g, 13, 4 + t, 2, 9, 'a');
    px(g, 14, 3 + t, 'a');
    px(g, 14, 13 + t, 'a');
    // 비늘 줄무늬와 아가미, 눈
    rect(g, 7, 6, 1, 5, 'b');
    rect(g, 9, 6, 1, 5, 'b');
    rect(g, 4, 6, 1, 4, 'k');
    px(g, 2, 7, 'w');
    px(g, 2, 8, 'k');
  },
  // 풍선: 줄이 이리저리 흔들린다
  balloon: (g, ph) => {
    const sway = ph === 0 ? 0 : 1;
    ellipse(g, 7, 5, 5, 5.5, 'a');
    rect(g, 3, 3, 2, 3, 'w');
    px(g, 4, 6, 'w');
    rect(g, 9, 7, 3, 2, 'b');
    rect(g, 6, 10, 3, 2, 'a'); // 매듭
    line(g, 7, 12, 7 + sway, 15, 'b');
  },
  // 꽃 화분: 꽃이 바람에 살랑
  pot: (g, ph) => {
    const sw = ph === 0 ? 0 : 1;
    rect(g, 3, 9, 9, 6, 'a');
    rect(g, 2, 8, 11, 2, 'a');
    rect(g, 3, 12, 9, 1, 'b'); // 화분 띠(진한 색 대신 풀색 줄)
    line(g, 7, 8, 7 + sw, 4, 'b'); // 줄기
    ellipse(g, 4, 6, 2, 1, 'b'); // 잎
    ellipse(g, 11, 6, 2, 1, 'b');
    // 꽃(분홍 잎 + 흰 가운데)
    const fx = 7 + sw;
    rect(g, fx - 2, 1, 5, 3, 'w');
    rect(g, fx - 1, 0, 3, 5, 'w');
    px(g, fx, 2, 'b');
  },
  // 나비: 날개를 폈다 접었다
  butterfly: (g, ph) => {
    if (ph === 0) {
      ellipse(g, 3.5, 5, 3.5, 3.5, 'a');
      ellipse(g, 11.5, 5, 3.5, 3.5, 'a');
      ellipse(g, 4.5, 10, 2.5, 2.5, 'b');
      ellipse(g, 10.5, 10, 2.5, 2.5, 'b');
      px(g, 3, 4, 'w');
      px(g, 12, 4, 'w');
    } else {
      ellipse(g, 5.5, 6, 2, 4, 'a');
      ellipse(g, 9.5, 6, 2, 4, 'a');
      ellipse(g, 6, 10, 1.5, 2, 'b');
      ellipse(g, 9, 10, 1.5, 2, 'b');
      px(g, 5, 4, 'w');
    }
    rect(g, 7, 3, 2, 9, 'k'); // 몸
    px(g, 6, 2, 'k');
    px(g, 9, 2, 'k'); // 더듬이
  },
  // 등불: 불빛이 일렁인다
  lantern: (g, ph) => {
    rect(g, 6, 0, 4, 2, 'a');
    rect(g, 3, 2, 10, 2, 'a');
    rect(g, 3, 4, 10, 9, 'a');
    rect(g, 4, 5, 8, 7, 'b');
    if (ph === 0) rect(g, 5, 6, 6, 5, 'w');
    else rect(g, 6, 7, 4, 4, 'w');
    rect(g, 3, 13, 10, 2, 'a');
    px(g, 7, 15, 'a');
    px(g, 8, 15, 'a');
    if (ph === 1) {
      px(g, 2, 1, 'b');
      px(g, 13, 2, 'b');
    }
  },
  // 용의 알: 좌우로 흔들린다(속에서 무언가 움직이는 듯)
  dragonegg: (g, ph) => {
    const o = ph === 0 ? 0 : 1;
    ellipse(g, 7 + o, 8, 5.5, 7, 'a');
    // 금빛 지그재그 띠
    for (let x = 2; x <= 12; x++) px(g, x + o, 8 + (x % 2), 'b');
    for (let x = 2; x <= 12; x++) px(g, x + o, 12 - (x % 2), 'b');
    // 점무늬와 하이라이트
    rect(g, 4 + o, 2, 3, 2, 'w');
    px(g, 4 + o, 4, 'w');
    px(g, 9 + o, 5, 'b');
    px(g, 6 + o, 14, 'b');
    if (ph === 1) {
      px(g, 8 + o, 6, 'b');
      px(g, 9 + o, 6, 'b');
    }
  },
};

const cache = new Map<Prop, string[][]>();

/**
 * 소품 그림(문자 그림) 두 장: [0, 1]. 두 장은 같은 크기·같은 자리로 잘려 있어서 번갈아 그려도 흔들리지 않는다.
 * none 이면 빈 배열.
 */
export function propFrames(prop: Prop): string[][] {
  if (prop === 'none') return [];
  const hit = cache.get(prop);
  if (hit) return hit;
  const frames = ([0, 1] as const).map((ph) => {
    const g = blank();
    DRAW[prop](g, ph);
    return outline(g, 'k');
  });
  let x0 = 99;
  let x1 = -1;
  let y0 = 99;
  let y1 = -1;
  for (const rows of frames) {
    rows.forEach((row, y) => {
      [...row].forEach((ch, x) => {
        if (ch === '.') return;
        x0 = Math.min(x0, x);
        x1 = Math.max(x1, x);
        y0 = Math.min(y0, y);
        y1 = Math.max(y1, y);
      });
    });
  }
  const cropped = frames.map((rows) => rows.slice(y0, y1 + 1).map((r) => r.slice(x0, x1 + 1)));
  cache.set(prop, cropped);
  return cropped;
}

/** 첫 장(정지 그림: 옷장·경매장 미리보기용). none 이면 빈 배열. */
export const propRows = (prop: Prop): string[] => propFrames(prop)[0] ?? [];

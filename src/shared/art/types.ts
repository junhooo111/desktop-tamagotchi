/**
 * 그림 공통 규칙.
 *
 * 문자 하나가 픽셀 하나이고, 모든 종이 같은 문자를 같은 의미로 쓴다(색 값만 종마다 다르다).
 *   k 윤곽선            e 눈동자  m 입(눈과 같은 색)  w 눈 하이라이트(흰색)
 *   f/F/h 털(기본/그림자/하이라이트)        b/B 배·주둥이
 *   i/I 귀 안쪽·발바닥  a/A 무늬(줄무늬·귀·등딱지)   p/P 부리·발(새)   g/G 머리(오리 등)
 *   n 코   r 볼터치   t 혀
 */
import type { Shade } from '../pixel.js';
import { tone, type Tone } from './color.js';

export type ArtStage = 'baby' | 'adult';

export interface Look {
  outline: string;
  fur: Tone;
  belly: Tone;
  inner: Tone;
  accent: Tone;
  /** 새의 부리·발 */
  beak: Tone;
  /** 새의 머리(오리의 초록 머리 등). 없으면 털색 */
  head: Tone;
  eye: string;
  nose: string;
  blush: string;
  tongue: string;
}

/** 색은 '#rrggbb' 하나만 적으면 음영이 자동으로 만들어지고, Tone 을 직접 줄 수도 있다. */
export interface LookInput {
  fur: string | Tone;
  outline?: string;
  belly?: string | Tone;
  inner?: string | Tone;
  accent?: string | Tone;
  beak?: string | Tone;
  head?: string | Tone;
  eye?: string;
  nose?: string;
  blush?: string;
  tongue?: string;
}

const asTone = (v: string | Tone | undefined, fallback: string): Tone =>
  v === undefined ? tone(fallback) : typeof v === 'string' ? tone(v) : v;

export function makeLook(partial: LookInput): Look {
  const fur = asTone(partial.fur, '#f0a04b');
  return {
    outline: partial.outline ?? '#5a3a2e',
    fur,
    belly: asTone(partial.belly, '#fff0d8'),
    inner: asTone(partial.inner, '#f6a9b8'),
    accent: asTone(partial.accent, '#d9822b'),
    beak: asTone(partial.beak, '#ff9a3c'),
    head: partial.head === undefined ? fur : asTone(partial.head, '#ffffff'),
    eye: partial.eye ?? '#33222a',
    nose: partial.nose ?? '#e8758c',
    blush: partial.blush ?? '#ff9db0',
    tongue: partial.tongue ?? '#ff7f95',
  };
}

/** 문자 → 색 */
export function paletteOf(look: Look): Record<string, string> {
  return {
    k: look.outline,
    e: look.eye,
    m: look.eye,
    w: '#ffffff',
    f: look.fur.base,
    F: look.fur.dark,
    h: look.fur.light,
    b: look.belly.base,
    B: look.belly.dark,
    i: look.inner.base,
    I: look.inner.dark,
    a: look.accent.base,
    A: look.accent.dark,
    p: look.beak.base,
    P: look.beak.dark,
    g: look.head.base,
    G: look.head.dark,
    n: look.nose,
    r: look.blush,
    t: look.tongue,
  };
}

/**
 * 부품 음영: 기본 문자 → (그림자, 하이라이트) 문자.
 *
 * 비워 둔다(= 단색). 가장자리마다 밝고 어두운 줄을 넣어 봤더니 너무 세세해져서 오히려 덜 귀여웠다.
 * "대충 생겨야 귀엽다"는 의견에 따라 덩어리는 한 가지 색으로 칠하고 윤곽선만 두른다.
 * 되살리려면 아래 객체에 f: { dark: 'F', light: 'h' } 같은 항목을 넣으면 모든 부품에 적용된다.
 */
export const SHADE: Shade = {};

/** 눈 표정 */
export type EyePose = 'open' | 'closed' | 'happy' | 'wide' | 'sleepy' | 'dizzy';
export type MouthPose = 'none' | 'smile' | 'open' | 'chew';
export type EarPose = 'up' | 'back' | 'down';

export interface Leg {
  /** 가로 이동(+ 는 앞) */
  dx: number;
  /** 발을 들어 올린 높이 */
  lift: number;
}

export interface Pose {
  /** 몸 전체의 위아래 이동(+ 는 아래). 점프로 공중에 뜰 때 쓴다. */
  dy: number;
  /** 웅크리기: 발은 바닥에 둔 채 몸통·머리만 이만큼 내려온다 */
  crouch: number;
  /** 새의 날개: 0 접음, 1 반쯤 펼침, 2 활짝(위로) */
  wing: number;
  /** 새가 뒤뚱거리며 몸을 좌우로 기울이는 칸 수 */
  sway: number;
  /** 몸통을 앞뒤로 늘이거나 줄인다(-1 ~ 1) */
  stretch: number;
  headDx: number;
  headDy: number;
  /** ff 먼 앞다리, fn 가까운 앞다리, bf 먼 뒷다리, bn 가까운 뒷다리 */
  legs: { ff: Leg; fn: Leg; bf: Leg; bn: Leg };
  /** 꼬리 각도(도): 0 은 뒤로 곧게, 90 은 위로 */
  tailAngle: number;
  /** 꼬리가 끝으로 갈수록 휘는 정도(도) */
  tailCurl: number;
  ears: EarPose;
  eyes: EyePose;
  mouth: MouthPose;
}

export const leg = (dx = 0, lift = 0): Leg => ({ dx, lift });

export function basePose(over: Partial<Pose> = {}): Pose {
  return {
    dy: 0,
    crouch: 0,
    wing: 0,
    sway: 0,
    stretch: 0,
    headDx: 0,
    headDy: 0,
    legs: { ff: leg(), fn: leg(), bf: leg(), bn: leg() },
    tailAngle: 40,
    tailCurl: 20,
    ears: 'up',
    eyes: 'open',
    mouth: 'none',
    ...over,
  };
}

export { tone };

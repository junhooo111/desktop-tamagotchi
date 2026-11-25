/** 네발 동물 4종의 생김새(색·귀·꼬리·무늬). */
import { tone } from './color.js';
import type { QuadSpec } from './quadruped.js';
import { makeLook } from './types.js';

export const CAT: QuadSpec = {
  look: makeLook({
    fur: '#f0a04b',
    outline: '#3b2f2f',
    belly: tone('#fbe3c0'),
    accent: tone('#c97a2b'),
    inner: tone('#f4a6b8'),
    nose: '#f4a6b8',
    eye: '#3b2f2f',
  }),
  ears: 'cat',
  tail: 'cat',
  snout: false,
  whiskers: false, // 수염은 작은 얼굴을 어수선하게 만들어서 뺐다
  stripes: false, // 줄무늬·양말 같은 잔무늬는 "대충 생겨야 귀엽다"는 의견에 따라 뺐다(코드는 남겨 둠)
  patch: false,
  shell: false,
  haunch: false,
  socks: false,
  // 더 귀엽게: 머리는 크고 둥글게, 몸은 짧고 작게(2등신에 가깝게), 눈은 뒤로 옮겨 입가에 여유를 준다
  head: { cx: 20.6, cy: 13.4, rx: 7.6, ry: 6.8 },
  eyeAt: 0.1,
  bodyScale: { rx: 0.9, ry: 0.94 },
};

export const DOG: QuadSpec = {
  look: makeLook({
    fur: '#d2a679',
    outline: '#3b2f2f',
    belly: tone('#f5e1c0'),
    accent: tone('#8a5a2b'),
    inner: tone('#f4a6b8'),
    nose: '#3b2f2f',
    eye: '#3b2f2f',
  }),
  ears: 'dog',
  tail: 'dog',
  snout: true,
  whiskers: false,
  stripes: false,
  patch: true,
  shell: false,
  haunch: false,
  socks: false,
};

export const RABBIT: QuadSpec = {
  look: makeLook({
    fur: '#f4f4f4',
    outline: '#3b2f2f',
    belly: tone('#ffffff'),
    accent: tone('#dcdcdc'),
    inner: tone('#f4a6b8'),
    nose: '#f4a6b8',
    eye: '#3b2f2f',
  }),
  ears: 'rabbit',
  tail: 'rabbit',
  snout: false,
  whiskers: false,
  stripes: false,
  patch: false,
  shell: false,
  haunch: true,
  socks: false,
  head: { cx: 21.2, cy: 15, rx: 6.4, ry: 5.8 },
};

export const TURTLE: QuadSpec = {
  look: makeLook({
    fur: '#9bd37a',
    outline: '#3b2f2f',
    belly: tone('#f4e6aa'),
    accent: tone('#4e9f50'),
    inner: tone('#f4a6b8'),
    nose: '#3b2f2f',
    eye: '#3b2f2f',
  }),
  ears: 'none',
  tail: 'turtle',
  snout: false,
  whiskers: false,
  stripes: false,
  patch: false,
  shell: true,
  haunch: false,
  socks: false,
  head: { cx: 25.2, cy: 22, rx: 4.8, ry: 4.4 },
  bodyScale: { rx: 1.06, ry: 1.12 },
};

/** 여우: 뾰족한 귀와 긴 주둥이, 풍성한 꼬리 */
export const FOX: QuadSpec = {
  look: makeLook({
    fur: '#e8743b',
    outline: '#3b2f2f',
    belly: tone('#fff4e6'),
    accent: tone('#5a3426'),
    inner: tone('#f4a6b8'),
    nose: '#3b2f2f',
    eye: '#3b2f2f',
  }),
  ears: 'cat',
  tail: 'cat',
  snout: true,
  whiskers: false,
  stripes: false,
  patch: false,
  shell: false,
  haunch: false,
  socks: false,
  head: { cx: 20.6, cy: 13.6, rx: 7, ry: 6.2 },
  bodyScale: { rx: 0.95, ry: 0.92 },
};

/** 햄스터: 공처럼 동그란 몸에 짧은 다리, 빵빵한 볼, 큰 동그란 귀, 등의 갈색 무늬, 꼬리는 거의 없다 */
export const HAMSTER: QuadSpec = {
  look: makeLook({
    fur: '#eac690',
    outline: '#3b2f2f',
    belly: tone('#fff5e0'),
    accent: tone('#c98a4b'),
    inner: tone('#f4a6b8'),
    nose: '#f08aa0',
    eye: '#3b2f2f',
  }),
  ears: 'round',
  tail: 'none',
  snout: false,
  whiskers: false,
  stripes: false,
  patch: true,
  shell: false,
  haunch: false,
  socks: false,
  cheeks: true,
  legScale: 0.42,
  head: { cx: 18.8, cy: 16.2, rx: 7.8, ry: 6.6 },
  eyeAt: 0.1,
  bodyScale: { rx: 0.98, ry: 1.3 },
};

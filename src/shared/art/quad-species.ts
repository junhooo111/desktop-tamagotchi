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

// ---- 일반 동물 추가 5종 중 네발 4종(부엉이는 bird-species.ts) ----

/** 판다: 하얀 몸, 까만 귀·눈 무늬·다리 */
export const PANDA: QuadSpec = {
  look: makeLook({
    fur: '#f6f6f2',
    outline: '#5a5a6a',
    belly: tone('#ffffff'),
    accent: tone('#1c1c24'),
    inner: tone('#9a9aa8'),
    nose: '#2b2b33',
    eye: '#ffffff',
  }),
  ears: 'round',
  tail: 'rabbit',
  snout: false,
  whiskers: false,
  stripes: false,
  patch: false,
  shell: false,
  haunch: false,
  socks: false,
  markings: 'panda',
  darkLegs: true,
  head: { cx: 20.4, cy: 14.4, rx: 7.4, ry: 6.4 },
  eyeAt: 0.12,
  bodyScale: { rx: 1.02, ry: 1.08 },
};

/** 곰: 갈색 몸, 동글동글 귀, 도톰한 주둥이 */
export const BEAR: QuadSpec = {
  look: makeLook({
    fur: '#a9703b',
    outline: '#3b2f2f',
    belly: tone('#e2bd8c'),
    accent: tone('#7a4a24'),
    inner: tone('#e2bd8c'),
    nose: '#3b2f2f',
    eye: '#3b2f2f',
  }),
  ears: 'round',
  tail: 'rabbit',
  snout: true,
  whiskers: false,
  stripes: false,
  patch: false,
  shell: false,
  haunch: false,
  socks: false,
  head: { cx: 20.4, cy: 14.4, rx: 7.2, ry: 6.4 },
  bodyScale: { rx: 1.08, ry: 1.1 },
};

/** 돼지: 분홍 몸, 뾰족 귀, 큼직한 코, 동그란 꼬리 */
export const PIG: QuadSpec = {
  look: makeLook({
    fur: '#ffb3c4',
    outline: '#5a3040',
    belly: tone('#ffd6df'),
    accent: tone('#ff8fa8'),
    inner: tone('#ff8fa8'),
    nose: '#d9627f',
    eye: '#3b2f2f',
  }),
  ears: 'cat',
  tail: 'rabbit',
  snout: true,
  whiskers: false,
  stripes: false,
  patch: false,
  shell: false,
  haunch: false,
  socks: false,
  head: { cx: 20.6, cy: 14.6, rx: 7.4, ry: 6.4 },
  eyeAt: 0.12,
  bodyScale: { rx: 1.06, ry: 1.06 },
};

/** 양: 뭉게뭉게 하얀 털, 까만 얼굴·다리, 늘어진 귀 */
export const SHEEP: QuadSpec = {
  look: makeLook({
    fur: '#f7f4ea',
    outline: '#5a5a6e',
    belly: tone('#ffffff'),
    accent: tone('#24242c'),
    inner: tone('#9a9aa8'),
    nose: '#ff9db0',
    eye: '#ffffff',
  }),
  ears: 'dog',
  tail: 'rabbit',
  snout: false,
  whiskers: false,
  stripes: false,
  patch: false,
  shell: false,
  haunch: false,
  socks: false,
  mane: 'ruff',
  darkFace: true,
  darkLegs: true,
  head: { cx: 20.8, cy: 14.4, rx: 6.6, ry: 6 },
  bodyScale: { rx: 1.14, ry: 1.16 },
};

// ---- 히든 동물(뽑기에서만 나온다) ----

/** 용: 붉은 몸, 등의 가시, 곧은 금빛 뿔과 금빛 날개 */
export const DRAGON: QuadSpec = {
  look: makeLook({
    fur: '#d9423e',
    outline: '#3b2f2f',
    belly: tone('#ffd58a'),
    accent: tone('#7a1626'),
    inner: tone('#ff8a3c'),
    beak: tone('#f5b83a'),
    nose: '#3b2f2f',
    eye: '#3b2f2f',
  }),
  ears: 'none',
  tail: 'cat',
  snout: true,
  whiskers: false,
  stripes: false,
  patch: false,
  shell: false,
  haunch: false,
  socks: false,
  horns: 'pair',
  crest: 'spikes',
  bodyWings: true,
  head: { cx: 20.8, cy: 14, rx: 7, ry: 6.2 },
  bodyScale: { rx: 1, ry: 1 },
};

/** 청룡: 푸른 몸, 갈라진 뿔, 코 옆으로 흐르는 긴 수염, 등의 지느러미(날개는 없다) */
export const AZURE: QuadSpec = {
  look: makeLook({
    fur: '#3a9fd6',
    outline: '#22324e',
    belly: tone('#d8f4ff'),
    accent: tone('#1c5f94'),
    inner: tone('#9fe6ff'),
    beak: tone('#ffe9a0'),
    nose: '#22324e',
    eye: '#22324e',
  }),
  ears: 'none',
  tail: 'cat',
  snout: true,
  whiskers: false,
  stripes: false,
  patch: false,
  shell: false,
  haunch: false,
  socks: false,
  horns: 'antler',
  crest: 'fin',
  streamers: true,
  head: { cx: 20.8, cy: 14, rx: 7, ry: 6.2 },
  bodyScale: { rx: 1.04, ry: 0.9 },
};

/** 백호: 따뜻한 흰 털에 굵은 검은 줄무늬, 이마의 왕(王)자, 풍성한 볼 털, 파란 눈 */
export const WHITETIGER: QuadSpec = {
  look: makeLook({
    fur: '#f8f3e8',
    outline: '#2b2b3a',
    belly: tone('#ffffff'),
    accent: tone('#1d2030'),
    inner: tone('#ffa3b5'),
    nose: '#ff8fa3',
    eye: '#2f6fe0',
  }),
  ears: 'cat',
  tail: 'cat',
  snout: false,
  whiskers: false,
  stripes: true,
  patch: false,
  shell: false,
  haunch: false,
  socks: false,
  markings: 'tiger',
  mane: 'ruff',
  head: { cx: 20.6, cy: 13.4, rx: 7.8, ry: 6.8 },
  eyeAt: 0.1,
  bodyScale: { rx: 1, ry: 1.04 },
};
/** 현무: 검푸른 등딱지를 짊어진 거북 */
export const TORTOISE: QuadSpec = {
  look: makeLook({
    fur: '#5f8c96',
    outline: '#1f2a3a',
    belly: tone('#d6e4e4'),
    accent: tone('#233a5e'),
    inner: tone('#9fc3cc'),
    nose: '#1f2a3a',
    eye: '#d83a3a',
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

/** 기린(麒麟): 황금빛 몸, 곧은 외뿔, 불꽃 갈기, 등의 갈색 무늬 */
export const QILIN: QuadSpec = {
  look: makeLook({
    fur: '#f2c14e',
    outline: '#3b2f2f',
    belly: tone('#fff3c8'),
    accent: tone('#b4701f'),
    inner: tone('#ff6a2c'),
    beak: tone('#fff0a8'),
    nose: '#3b2f2f',
    eye: '#3b2f2f',
  }),
  ears: 'round',
  tail: 'dog',
  snout: true,
  whiskers: false,
  stripes: false,
  patch: true,
  shell: false,
  haunch: false,
  socks: false,
  horns: 'single',
  mane: 'flame',
  hooves: true,
  legScale: 1.1,
};

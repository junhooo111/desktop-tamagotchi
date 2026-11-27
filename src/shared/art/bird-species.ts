/** 새 2종의 생김새. */
import { tone } from './color.js';
import type { BirdSpec } from './bird.js';
import { makeLook } from './types.js';

export const CHICK: BirdSpec = {
  kind: 'chick',
  look: makeLook({
    fur: '#ffd84a',
    outline: '#3b2f2f',
    belly: tone('#ffe27a'),
    accent: tone('#f0b400'),
    beak: tone('#ff9a2e'),
    eye: '#3b2f2f',
  }),
};

export const DUCK: BirdSpec = {
  kind: 'duck',
  look: makeLook({
    fur: '#fafafa',
    outline: '#3b2f2f',
    belly: tone('#ffffff'),
    accent: tone('#cfd8dc'),
    beak: tone('#ff9a2e'),
    head: tone('#3e8e5a'),
    eye: '#3b2f2f',
  }),
};

/** 펭귄: 병아리 뼈대에 어두운 등과 하얀 배, 솜털 없음 */
export const PENGUIN: BirdSpec = {
  kind: 'chick',
  tuft: false,
  look: makeLook({
    fur: '#34405e',
    outline: '#141a2b',
    belly: tone('#ffffff'),
    accent: tone('#232c42'),
    beak: tone('#ff9a2e'),
    eye: '#ffffff',
  }),
};

/** 주작: 불꽃처럼 붉은 새, 머리에 솜털 깃 */
export const PHOENIX: BirdSpec = {
  kind: 'chick',
  tuft: true,
  look: makeLook({
    fur: '#ff5a36',
    outline: '#4a1f1a',
    belly: tone('#ffb04a'),
    accent: tone('#c8281e'),
    beak: tone('#ffd34a'),
    eye: '#3b2f2f',
  }),
};

/** 부엉이: 갈색 깃털, 머리의 귀깃, 크고 노란 눈 */
export const OWL: BirdSpec = {
  kind: 'chick',
  tuft: true,
  look: makeLook({
    fur: '#9a7048',
    outline: '#3a2a1e',
    belly: tone('#ecd8b0'),
    accent: tone('#6a4a2c'),
    beak: tone('#ffb02e'),
    eye: '#2a1a10',
  }),
};

/** 앵무새: 초록 몸에 붉은 머리깃, 노란 배, 푸른 날개 끝 */
export const PARROT: BirdSpec = {
  kind: 'chick',
  tuft: true,
  coloredHead: true,
  look: makeLook({
    fur: '#3fbf5a',
    outline: '#1f3a28',
    belly: tone('#d8ef6a'),
    accent: tone('#2f7fe0'),
    beak: tone('#ffc14a'),
    head: tone('#e8473a'),
    eye: '#1f2a1f',
  }),
};

/** 공작: 푸른 몸과 머리, 머리깃, 눈 무늬가 박힌 초록빛 꼬리 부채 */
export const PEACOCK: BirdSpec = {
  kind: 'chick',
  tuft: true,
  coloredHead: true,
  fan: true,
  look: makeLook({
    fur: '#1f86c7',
    outline: '#10283a',
    belly: tone('#58c96e'),
    accent: tone('#1d58a8'),
    beak: tone('#f0c24a'),
    head: tone('#1a62b3'),
    eye: '#10202b',
  }),
};

/** 그리핀: 하얀 독수리 머리, 금빛 갈색 몸(전설 단계에서 금빛 날개가 돋는다) */
export const GRIFFIN: BirdSpec = {
  kind: 'chick',
  tuft: true,
  coloredHead: true,
  look: makeLook({
    fur: '#c98a38',
    outline: '#3f2a14',
    belly: tone('#f0c27a'),
    accent: tone('#8f5a22'),
    beak: tone('#f2b632'),
    head: tone('#f4f0e6'),
    eye: '#2a1a0a',
  }),
};

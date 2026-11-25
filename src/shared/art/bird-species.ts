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

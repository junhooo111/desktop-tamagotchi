/**
 * 펫 종류와 스프라이트.
 *
 * 그림은 32x32 옆모습(오른쪽을 봄)이고 art/ 의 그리기 도구로 코드가 만든다.
 * 단계(알·새끼·성체)마다 그림이 따로 있고, 새끼는 성체를 줄인 것이 아니라 머리가 큰 아기 비율로 새로 그린다.
 * 한 단계에는 동작별 전용 프레임이 있다(프레임 이름과 뜻은 art/frames.ts).
 * 왼쪽을 보거나 벽에 붙을 때는 그림을 뒤집고 돌려서 쓴다(motion.ts 의 방향 규칙).
 *
 * 프레임은 처음 쓸 때 만들어서 기억해 둔다(앱이 뜰 때 전부 그리지 않는다).
 */
import { chunky } from './art/chunky.js';
import { birdFrames } from './art/bird-plan.js';
import { CHICK, DUCK } from './art/bird-species.js';
import { EGG_LOOK, eggFrames } from './art/egg.js';
import { type Frames } from './art/frames.js';
import { quadFrames } from './art/quad-plan.js';
import { CAT, DOG, RABBIT, TURTLE } from './art/quad-species.js';
import { paletteOf, type Look } from './art/types.js';
import { SIZE } from './pixel.js';

export { FRAME_NAMES, type FrameName, type Frames } from './art/frames.js';
export { SIZE as SPRITE_SIZE };

export type SpeciesId = 'rabbit' | 'cat' | 'dog' | 'turtle' | 'chick' | 'duck';
export type SpriteStage = 'egg' | 'baby' | 'adult';

export interface SpriteSet {
  /** 문자 → '#rrggbb' */
  readonly palette: Readonly<Record<string, string>>;
  readonly frames: Frames;
  /** 눈을 깜빡일 때 눈 자리에 칠할 몸 색 문자. 얼굴이 없으면 빈 문자열이다. */
  readonly skin: string;
}

export interface Species {
  readonly id: SpeciesId;
  readonly name: string;
}

interface Design {
  look: Look;
  skin: string;
  make(stage: 'baby' | 'adult'): Frames;
}

const DESIGNS: Record<SpeciesId, Design> = {
  rabbit: { look: RABBIT.look, skin: 'f', make: (s) => quadFrames(RABBIT, s, 'hop') },
  cat: { look: CAT.look, skin: 'f', make: (s) => quadFrames(CAT, s, 'trot') },
  dog: { look: DOG.look, skin: 'f', make: (s) => quadFrames(DOG, s, 'trot') },
  turtle: { look: TURTLE.look, skin: 'f', make: (s) => quadFrames(TURTLE, s, 'trot') },
  chick: { look: CHICK.look, skin: 'f', make: (s) => birdFrames(CHICK, s) },
  duck: { look: DUCK.look, skin: 'g', make: (s) => birdFrames(DUCK, s) },
};

export const SPECIES: readonly Species[] = [
  { id: 'rabbit', name: '토끼' },
  { id: 'cat', name: '고양이' },
  { id: 'dog', name: '강아지' },
  { id: 'turtle', name: '거북이' },
  { id: 'chick', name: '병아리' },
  { id: 'duck', name: '오리' },
];

/** 모든 프레임을 16칸 굵기로 뭉친다(art/chunky.ts) */
function chunkAll(frames: Frames): Frames {
  return Object.fromEntries(Object.entries(frames).map(([k, v]) => [k, chunky(v)])) as Frames;
}

const cache = new Map<string, SpriteSet>();

/** 종과 단계에 맞는 스프라이트. 알 단계는 종과 상관없이 같은 알이다. */
export function spriteSet(id: SpeciesId, stage: SpriteStage): SpriteSet {
  const key = stage === 'egg' ? 'egg' : `${id}/${stage}`;
  const cached = cache.get(key);
  if (cached) return cached;
  const made: SpriteSet =
    stage === 'egg'
      ? { palette: paletteOf(EGG_LOOK), frames: chunkAll(eggFrames()), skin: '' }
      : { palette: paletteOf(DESIGNS[id].look), frames: chunkAll(DESIGNS[id].make(stage)), skin: DESIGNS[id].skin };
  cache.set(key, made);
  return made;
}

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

/** 프레임 하나를 정수 배율로 키운 RGBA 비트맵으로 만든다(트레이 아이콘·앱 아이콘·미리보기용). */
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

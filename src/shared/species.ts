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
import { tone } from './art/color.js';
import { chunky } from './art/chunky.js';
import { accessoryPalette, DEFAULT_STYLE, tintLook, type PetStyle } from './art/style.js';
import { birdFrames } from './art/bird-plan.js';
import { type BirdSpec } from './art/bird.js';
import { CHICK, DUCK, OWL, PENGUIN, PHOENIX } from './art/bird-species.js';
import { EGG_LOOK, eggFrames } from './art/egg.js';
import { type Frames } from './art/frames.js';
import { quadFrames, type Gait } from './art/quad-plan.js';
import { type QuadSpec } from './art/quadruped.js';
import { AZURE, BEAR, CAT, DOG, DRAGON, FOX, HAMSTER, PANDA, PIG, QILIN, RABBIT, SHEEP, TORTOISE, TURTLE, WHITETIGER } from './art/quad-species.js';
import { paletteOf, type Look } from './art/types.js';
import { SIZE } from './pixel.js';

export { FRAME_NAMES, type FrameName, type Frames } from './art/frames.js';
export { ACCESSORIES, type Accessory } from './art/accessory.js';
export { DEFAULT_STYLE, VARIANTS, isAccessory, isVariant, type PetStyle, type Variant } from './art/style.js';
export { SIZE as SPRITE_SIZE };

export type SpeciesId =
  | 'rabbit'
  | 'cat'
  | 'dog'
  | 'turtle'
  | 'chick'
  | 'duck'
  | 'fox'
  | 'hamster'
  | 'penguin'
  | 'panda'
  | 'bear'
  | 'pig'
  | 'sheep'
  | 'owl'
  // 히든 동물: 뽑기에서 아주 드물게 나오고, 성체 다음 단계(전설)까지 자란다
  | 'dragon'
  | 'azure'
  | 'whitetiger'
  | 'tortoise'
  | 'phoenix'
  | 'qilin';
/** 전설(legend)은 히든 동물만 가는 성체 다음 단계다. 히든이 아닌 동물에게 요청하면 성체 그림을 쓴다. */
export type SpriteStage = 'egg' | 'baby' | 'adult' | 'legend';

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
  /** 히든 동물(뽑기 확률이 아주 낮고 전설 단계까지 자란다) */
  readonly hidden?: boolean;
}

type Design =
  | { kind: 'quad'; spec: QuadSpec; gait: Gait; skin: string }
  | { kind: 'bird'; spec: BirdSpec; skin: string };

const DESIGNS: Record<SpeciesId, Design> = {
  rabbit: { kind: 'quad', spec: RABBIT, gait: 'hop', skin: 'f' },
  cat: { kind: 'quad', spec: CAT, gait: 'trot', skin: 'f' },
  dog: { kind: 'quad', spec: DOG, gait: 'trot', skin: 'f' },
  turtle: { kind: 'quad', spec: TURTLE, gait: 'trot', skin: 'f' },
  chick: { kind: 'bird', spec: CHICK, skin: 'f' },
  duck: { kind: 'bird', spec: DUCK, skin: 'g' },
  fox: { kind: 'quad', spec: FOX, gait: 'trot', skin: 'f' },
  hamster: { kind: 'quad', spec: HAMSTER, gait: 'trot', skin: 'f' },
  penguin: { kind: 'bird', spec: PENGUIN, skin: 'f' },
  panda: { kind: 'quad', spec: PANDA, gait: 'trot', skin: 'f' },
  bear: { kind: 'quad', spec: BEAR, gait: 'trot', skin: 'f' },
  pig: { kind: 'quad', spec: PIG, gait: 'trot', skin: 'f' },
  sheep: { kind: 'quad', spec: SHEEP, gait: 'trot', skin: 'f' },
  owl: { kind: 'bird', spec: OWL, skin: 'f' },
  dragon: { kind: 'quad', spec: DRAGON, gait: 'trot', skin: 'f' },
  azure: { kind: 'quad', spec: AZURE, gait: 'trot', skin: 'f' },
  whitetiger: { kind: 'quad', spec: WHITETIGER, gait: 'trot', skin: 'f' },
  tortoise: { kind: 'quad', spec: TORTOISE, gait: 'trot', skin: 'f' },
  phoenix: { kind: 'bird', spec: PHOENIX, skin: 'f' },
  qilin: { kind: 'quad', spec: QILIN, gait: 'trot', skin: 'f' },
};

export const SPECIES: readonly Species[] = [
  { id: 'rabbit', name: '토끼' },
  { id: 'cat', name: '고양이' },
  { id: 'dog', name: '강아지' },
  { id: 'turtle', name: '거북이' },
  { id: 'chick', name: '병아리' },
  { id: 'duck', name: '오리' },
  { id: 'fox', name: '여우' },
  { id: 'hamster', name: '햄스터' },
  { id: 'penguin', name: '펭귄' },
  { id: 'panda', name: '판다' },
  { id: 'bear', name: '곰' },
  { id: 'pig', name: '돼지' },
  { id: 'sheep', name: '양' },
  { id: 'owl', name: '부엉이' },
  { id: 'dragon', name: '용', hidden: true },
  { id: 'azure', name: '청룡', hidden: true },
  { id: 'whitetiger', name: '백호', hidden: true },
  { id: 'tortoise', name: '현무', hidden: true },
  { id: 'phoenix', name: '주작', hidden: true },
  { id: 'qilin', name: '기린', hidden: true },
];

/** 처음부터 뽑을 수 있는 동물과, 히든 동물 */
export const COMMON_SPECIES: readonly Species[] = SPECIES.filter((s) => !s.hidden);
export const HIDDEN_SPECIES: readonly Species[] = SPECIES.filter((s) => s.hidden);
export const isHiddenSpecies = (id: SpeciesId): boolean => HIDDEN_SPECIES.some((s) => s.id === id);

/** 전설 단계: 몸에 금빛 날개가 돋고 불꽃 갈기가 난다(히든 동물만). */
function legendDesign(d: Design): Design {
  if (d.kind === 'bird') return { ...d, spec: { ...d.spec, bodyWings: true } };
  return { ...d, spec: { ...d.spec, look: { ...d.spec.look, beak: d.spec.bodyWings || d.spec.horns ? d.spec.look.beak : tone('#ffd34a') }, bodyWings: true, mane: d.spec.mane ?? 'flame' } };
}

/** 모든 프레임을 16칸 굵기로 뭉친다(art/chunky.ts) */
function chunkAll(frames: Frames): Frames {
  return Object.fromEntries(Object.entries(frames).map(([k, v]) => [k, chunky(v)])) as Frames;
}

const cache = new Map<string, SpriteSet>();

/** 종·단계·스타일에 맞는 스프라이트. 알 단계는 종·스타일과 상관없이 같은 알이다. */
export function spriteSet(id: SpeciesId, stage: SpriteStage, style: PetStyle = DEFAULT_STYLE): SpriteSet {
  const key = stage === 'egg' ? 'egg' : [id, stage === 'legend' && !isHiddenSpecies(id) ? 'adult' : stage, style.variant, style.accessory].join('/');
  const cached = cache.get(key);
  if (cached) return cached;
  let made: SpriteSet;
  if (stage === 'egg') {
    made = { palette: paletteOf(EGG_LOOK), frames: chunkAll(eggFrames()), skin: '' };
  } else {
    const legend = stage === 'legend' && isHiddenSpecies(id);
    const d = legend ? legendDesign(DESIGNS[id]) : DESIGNS[id];
    const artStage = stage === 'baby' ? 'baby' : 'adult';
    const look = tintLook(d.spec.look, style.variant);
    const frames = d.kind === 'quad' ? quadFrames({ ...d.spec, look, accessory: style.accessory }, artStage, d.gait) : birdFrames({ ...d.spec, look, accessory: style.accessory }, artStage);
    made = { palette: { ...paletteOf(look), ...accessoryPalette(style.accessory) }, frames: chunkAll(frames), skin: d.skin };
  }
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

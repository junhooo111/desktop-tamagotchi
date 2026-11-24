/** 메인 프로세스가 렌더러(펫 화면)에 넘기는 값. 타입만 있어서 브라우저에서도 안전하다. */
import type { Dir, Mode, PlayKind, Surface } from './motion.js';
import type { Mood, Stage } from './pet.js';
import type { SpeciesId } from './species.js';

export interface PetView {
  speciesId: SpeciesId;
  stage: Stage;
  level: number;
  mood: Mood;
  mode: Mode;
  surface: Surface;
  dir: Dir;
  play: PlayKind;
  /** 현재 동작이 시작된 시각(ms) */
  since: number;
}

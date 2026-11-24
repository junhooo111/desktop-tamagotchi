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
  /** 말풍선이 화면 밖으로 잘리지 않도록 옆으로 밀 거리(px) */
  bubbleShift: number;
}

/** 펫 위 말풍선으로 보여 주는 FE 지식 */
export interface TipBubble {
  title: string;
  body: string;
  code: string;
  /** 처음 읽는 지식이면 받을 경험치, 이미 읽었으면 0 */
  xp: number;
}

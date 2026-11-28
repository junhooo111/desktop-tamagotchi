/** 메인 프로세스가 렌더러(펫 화면)에 넘기는 값. 타입만 있어서 브라우저에서도 안전하다. */
import type { Dir, Mode, PlayKind, Surface } from './motion.js';
import type { Mood, Stage } from './pet.js';
import type { Accessory, SpeciesId, Variant } from './species.js';
import type { Effect, Neck } from './art/extras.js';
import type { Prop } from './art/props.js';

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
  /** 설정의 펫 크기 배율(1·2·3) */
  scale: number;
  /** 꾸미기: 색 변형과 장식 */
  variant: Variant;
  accessory: Accessory;
  neck?: Neck;
  effect?: Effect;
  /** 펫 곁을 따라다니는 소품 */
  prop?: Prop;
  /** 더러워서 냄새가 난다(청결이 낮다) */
  dirty?: boolean;
  /** 내 펫 옆을 따라다니는 친구의 펫(절반 크기). 없으면 그리지 않는다. */
  companion?: { speciesId: SpeciesId; stage: 'baby' | 'adult' | 'legend' };
}

/** 펫이 찾아 알린 문제의 말풍선. 무엇이 문제인지, 어디인지, 어떻게 고치는지를 함께 보여 준다. */
export interface NoticeBubble {
  /** 무엇이 문제인지 (예: 손가락으로 누르기엔 너무 작아요!) */
  title: string;
  /** 어디에서 찾았는지 (요소 경로와 값) */
  where: string;
  /** 고치는 방법 */
  fix: string;
}

export interface NoticeMessage {
  /** 없으면 기억하던 문제를 지운다(고쳤거나 확인했을 때) */
  notice: NoticeBubble | null;
  /** true 면 바로 띄운다(방금 찾았다). false 면 기억만 해 두고 펫에 마우스를 올릴 때 띄운다. */
  show: boolean;
}

/** 펫 위 말풍선으로 보여 주는 FE 지식 */
export interface TipBubble {
  title: string;
  body: string;
  code: string;
  /** 처음 읽는 지식이면 받을 경험치, 이미 읽었으면 0 */
  xp: number;
}

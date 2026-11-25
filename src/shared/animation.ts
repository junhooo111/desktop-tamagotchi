/**
 * 지금 동작과 시각에 맞는 그림 프레임·방향·미세 이동을 정한다(순수 로직).
 * 렌더러는 이 결과대로 그리기만 한다. 몸의 움직임(웅크림·다리·꼬리·귀)은 프레임 그림 안에 들어 있고,
 * 여기서는 어떤 프레임을 얼마나 빠르게 돌려 쓸지와 화면 위치 보정만 정한다.
 */
import { orientationOf, type Dir, type Mode, type Orientation, type PlayKind, type Surface } from './motion.js';
import type { FrameName } from './art/frames.js';

export interface MotionView {
  mode: Mode;
  surface: Surface;
  dir: Dir;
  play: PlayKind;
  /** 이 동작이 시작된 시각(ms) */
  since: number;
}

export interface Pose {
  frame: FrameName;
  orientation: Orientation;
  /** 그림 픽셀 단위 가로·세로 이동(위로 뛰면 dy 가 음수) */
  dx: number;
  dy: number;
  /** 눈을 깜빡이는 순간이라 눈을 지운다 */
  eyesClosed: boolean;
  /** 졸거나 자는 중이라 'z' 를 띄운다 */
  zzz: boolean;
  /** 문제를 찾았다는 느낌표를 머리 위에 띄운다 */
  alert: boolean;
  /** 좋아서 하트를 띄운다 */
  hearts: boolean;
  /** 먹는 중이라 앞에 먹이를 놓는다 */
  food: boolean;
}

const WALK: readonly FrameName[] = ['walk1', 'walk2', 'walk3', 'walk4'];
const RUN: readonly FrameName[] = ['run1', 'run2', 'run3', 'run4'];
const IDLE: readonly FrameName[] = ['idleA', 'idleB'];
const SIT: readonly FrameName[] = ['sitA', 'sitB'];
const DOZE: readonly FrameName[] = ['dozeA', 'dozeB'];
const SLEEP: readonly FrameName[] = ['sleepA', 'sleepB'];
const CLIMB: readonly FrameName[] = ['climbA', 'climbB'];
const SLIP: readonly FrameName[] = ['slipA', 'slipB'];
const HANG: readonly FrameName[] = ['hangA', 'hangB'];
const STRUGGLE: readonly FrameName[] = ['hangB', 'hangA'];
const ALERT: readonly FrameName[] = ['alertA', 'alertB'];
const HAPPY: readonly FrameName[] = ['happyA', 'happyB'];
const EAT: readonly FrameName[] = ['eatA', 'eatB'];

/** 점프 한 번에 걸리는 시간과, 정점까지 올라가는 그림 픽셀 높이 */
export const HOP_MS = 1_000;
export const HOP_HEIGHT = 7;
const ROLL_QUARTER_MS = 200;
const LOOK_MS = 600;

const FRONT: Orientation = { flip: false, quarter: 0 };

const pick = <T>(cycle: readonly T[], now: number, stepMs: number): T =>
  cycle[Math.floor(now / stepMs) % cycle.length] as T;

const opposite = (d: Dir): Dir => (d === 'left' ? 'right' : d === 'right' ? 'left' : d === 'up' ? 'down' : 'up');

export function resolvePose(v: MotionView, now: number): Pose {
  const age = Math.max(0, now - v.since);
  const base = orientationOf(v.surface, v.dir);
  const make = (frame: FrameName, extra: Partial<Pose> = {}): Pose => ({
    frame,
    orientation: base,
    dx: 0,
    dy: 0,
    eyesClosed: false,
    zzz: false,
    alert: false,
    hearts: false,
    food: false,
    ...extra,
  });
  const blink = now % 3600 < 140;

  switch (v.mode) {
    case 'idle':
      return make(pick(IDLE, now, 650), { eyesClosed: blink });
    case 'sit':
      return make(pick(SIT, now, 500), { eyesClosed: blink });
    case 'walk':
      return make(pick(WALK, now, 120));
    case 'run':
      return make(pick(RUN, now, 70));
    case 'doze':
      return make(pick(DOZE, now, 900), { zzz: true });
    case 'sleep':
      return make(pick(SLEEP, now, 1_100), { zzz: true });
    case 'climb':
      return make(pick(CLIMB, now, 180));
    case 'slip':
      return make(pick(SLIP, now, 70), { dx: Math.floor(now / 70) % 2 === 0 ? 1 : -1 });
    case 'play':
      return playPose(v, age, base, make);
    case 'hang':
      return make(pick(HANG, now, 380), { orientation: FRONT, dx: Math.round(Math.sin(now / 600)) });
    case 'carried':
      return make(pick(STRUGGLE, now, 120), { orientation: FRONT });
    case 'fall':
      return make('fall');
    case 'alert':
      return make(pick(ALERT, now, 300), { alert: true });
    case 'happy':
      return make(pick(HAPPY, now, 180), { hearts: true });
    case 'eat':
      return make(pick(EAT, now, 240), { food: true });
  }
}

function playPose(
  v: MotionView,
  age: number,
  base: Orientation,
  make: (frame: FrameName, extra?: Partial<Pose>) => Pose,
): Pose {
  switch (v.play) {
    case 'hop': {
      // 웅크림 → 도약 → 정점 → 하강 → 착지(웅크림)를 한 번 뛸 때마다 되풀이한다.
      const p = (age % HOP_MS) / HOP_MS;
      const frame: FrameName = p < 0.2 ? 'jumpCrouch' : p < 0.4 ? 'jumpUp' : p < 0.6 ? 'jumpPeak' : p < 0.8 ? 'jumpDown' : 'jumpCrouch';
      const arc = p >= 0.2 && p < 0.8 ? Math.sin((Math.PI * (p - 0.2)) / 0.6) : 0;
      return make(frame, { dy: 0 - Math.round(HOP_HEIGHT * arc) });
    }
    case 'roll': {
      // 공처럼 만 몸이 90도씩 돌며 구른다.
      const turns = Math.floor(age / ROLL_QUARTER_MS) % 4;
      return make('curl', { orientation: { flip: base.flip, quarter: ((base.quarter + turns) % 4) as Orientation['quarter'] } });
    }
    case 'look': {
      const dir = Math.floor(age / LOOK_MS) % 2 === 0 ? v.dir : opposite(v.dir);
      return make(pick(IDLE, age, 650), { orientation: orientationOf(v.surface, dir) });
    }
  }
}

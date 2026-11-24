/**
 * 지금 동작과 시각에 맞는 그림 프레임·방향·미세 이동을 정한다(순수 로직).
 * 렌더러는 이 결과대로 그리기만 한다.
 */
import { orientationOf, type Dir, type Mode, type Orientation, type PlayKind, type Surface } from './motion.js';
import type { FrameName } from './species.js';

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
  eyesClosed: boolean;
  /** 졸거나 자는 중이라 'z' 를 띄운다 */
  zzz: boolean;
}

const WALK_CYCLE: readonly FrameName[] = ['walkA', 'stand', 'walkB', 'stand'];
const RUN_CYCLE: readonly FrameName[] = ['runA', 'runB'];
const SLEEP_CYCLE: readonly FrameName[] = ['sleepA', 'sleepB'];
const HOP_MS = 600;
const HOP_HEIGHT = 5;
const ROLL_QUARTER_MS = 400;
const LOOK_MS = 500;

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
    ...extra,
  });

  switch (v.mode) {
    case 'idle':
      return make('stand', { eyesClosed: now % 3200 < 140 });
    case 'walk': {
      const frame = pick(WALK_CYCLE, now, 140);
      return make(frame, { dy: frame === 'stand' ? -1 : 0 });
    }
    case 'run':
      return make(pick(RUN_CYCLE, now, 90));
    case 'doze':
      return make('stand', { eyesClosed: now % 1400 < 1000, dy: Math.floor(now / 700) % 2, zzz: true });
    case 'sleep':
      return make(pick(SLEEP_CYCLE, now, 900), { zzz: true });
    case 'climb':
      return make(pick(WALK_CYCLE, now, 200));
    case 'slip':
      return make(pick(['walkA', 'walkB'] as const, now, 70), { dx: Math.floor(now / 70) % 2 === 0 ? 1 : -1 });
    case 'play':
      return playPose(v, age, base, make);
    case 'hang':
      return make(pick(['hangA', 'hangB'] as const, now, 350), {
        orientation: FRONT,
        dx: Math.round(Math.sin(now / 600)),
      });
    case 'carried':
      return make(pick(['hangB', 'hangA'] as const, now, 130), { orientation: FRONT });
    case 'fall':
      return make('runB');
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
      const lift = Math.round(HOP_HEIGHT * Math.sin(Math.PI * ((age % HOP_MS) / HOP_MS)));
      return make(lift > 1 ? 'runA' : 'stand', { dy: 0 - lift });
    }
    case 'roll': {
      const turns = Math.floor(age / ROLL_QUARTER_MS) % 4;
      return make('stand', { orientation: { flip: base.flip, quarter: ((base.quarter + turns) % 4) as Orientation['quarter'] } });
    }
    case 'look': {
      const dir = Math.floor(age / LOOK_MS) % 2 === 0 ? v.dir : opposite(v.dir);
      return make('stand', { orientation: orientationOf(v.surface, dir) });
    }
  }
}

/** 새의 프레임별 자세 표. 걷기는 몸을 좌우로 기울이며 뒤뚱거리고, 뛸 때는 날개를 퍼덕인다. */
import { renderBirdShape, type BirdShape, type BirdSpec } from './bird.js';
import { FRAME_NAMES, type FrameName, type Frames } from './frames.js';
import { basePose, leg, type ArtStage, type Pose } from './types.js';

interface Plan {
  shape: BirdShape;
  pose: Pose;
}

const P = basePose;
const stand = (over: Partial<Pose> = {}): Plan => ({ shape: 'stand', pose: P(over) });

/**
 * 뒤뚱 걷기 4박자: 왼발 내딛기(몸이 왼쪽으로 기움) → 통과(오른발을 든다) → 오른발 내딛기(오른쪽으로 기움) → 통과(왼발을 든다).
 * 내딛는 프레임은 몸이 낮고, 통과하는 프레임은 몸이 한 칸 올라간다.
 */
function waddle(i: number, fast: boolean): Plan {
  const reach = fast ? 3 : 2;
  const lift = fast ? 4 : 3;
  const legsByBeat = [
    { bn: leg(reach, 0), fn: leg(-1, lift - 1) },
    { bn: leg(0, 0), fn: leg(1, lift) },
    { fn: leg(reach, 0), bn: leg(-1, lift - 1) },
    { fn: leg(0, 0), bn: leg(1, lift) },
  ];
  const beat = legsByBeat[i % 4] as { bn: ReturnType<typeof leg>; fn: ReturnType<typeof leg> };
  return stand({
    sway: [-1, 0, 1, 0][i % 4] ?? 0,
    crouch: i % 2 === 0 ? 0 : -1,
    headDx: fast ? 1 : 0,
    legs: { ff: leg(), bf: leg(), ...beat },
    wing: fast ? [1, 2, 1, 2][i % 4] ?? 0 : 0,
    mouth: fast ? 'open' : 'none',
    tailAngle: [40, 55, 70, 55][i % 4] ?? 40,
  });
}

export function birdPlan(): Record<FrameName, Plan> {
  return {
    idleA: stand({ tailAngle: 40 }),
    idleB: stand({ tailAngle: 70, headDy: -0.5, crouch: -0.5 }),
    sitA: { shape: 'sit', pose: P({ tailAngle: 40 }) },
    sitB: { shape: 'sit', pose: P({ tailAngle: 70, mouth: 'none', eyes: 'happy' }) },
    walk1: waddle(0, false),
    walk2: waddle(1, false),
    walk3: waddle(2, false),
    walk4: waddle(3, false),
    run1: waddle(0, true),
    run2: waddle(1, true),
    run3: waddle(2, true),
    run4: waddle(3, true),
    dozeA: { shape: 'sit', pose: P({ headDy: 1, eyes: 'sleepy' }) },
    dozeB: { shape: 'sit', pose: P({ headDy: 3, eyes: 'closed' }) },
    sleepA: { shape: 'lie', pose: P({ eyes: 'closed', stretch: 0 }) },
    sleepB: { shape: 'lie', pose: P({ eyes: 'closed', stretch: 1 }) },
    jumpCrouch: stand({ crouch: 3, wing: 0, legs: { ff: leg(), fn: leg(1, 0), bf: leg(), bn: leg(-1, 0) } }),
    jumpUp: stand({ dy: -1, wing: 2, legs: { ff: leg(), fn: leg(1, 3), bf: leg(), bn: leg(-1, 3) }, mouth: 'open' }),
    jumpPeak: stand({ dy: -2, wing: 2, legs: { ff: leg(), fn: leg(1, 4), bf: leg(), bn: leg(-1, 4) }, eyes: 'happy', mouth: 'open' }),
    jumpDown: stand({ dy: -1, wing: 1, legs: { ff: leg(), fn: leg(1, 2), bf: leg(), bn: leg(-1, 2) }, mouth: 'open' }),
    curl: { shape: 'curl', pose: P({ eyes: 'happy' }) },
    climbA: stand({ wing: 2, headDx: 1, legs: { ff: leg(), fn: leg(3, 2), bf: leg(), bn: leg(-2, 0) }, tailAngle: 30 }),
    climbB: stand({ wing: 1, headDx: 1, legs: { ff: leg(), fn: leg(2, 0), bf: leg(), bn: leg(-3, 2) }, tailAngle: 40 }),
    slipA: stand({ wing: 2, eyes: 'wide', mouth: 'open', legs: { ff: leg(), fn: leg(2, 2), bf: leg(), bn: leg(-2, 1) }, tailAngle: 80 }),
    slipB: stand({ wing: 1, dy: -1, eyes: 'wide', mouth: 'open', legs: { ff: leg(), fn: leg(3, 1), bf: leg(), bn: leg(-3, 2) }, tailAngle: 70 }),
    hangA: { shape: 'hang', pose: P({ legs: { ff: leg(), fn: leg(), bf: leg(2), bn: leg() } }) },
    hangB: { shape: 'hang', pose: P({ legs: { ff: leg(), fn: leg(), bf: leg(-2), bn: leg() }, eyes: 'open' }) },
    fall: stand({ wing: 2, eyes: 'wide', mouth: 'open', legs: { ff: leg(), fn: leg(2, 4), bf: leg(), bn: leg(-2, 4) }, tailAngle: 85 }),
    alertA: stand({ wing: 1, eyes: 'wide', mouth: 'open', tailAngle: 75 }),
    alertB: stand({ wing: 0, eyes: 'wide', mouth: 'open', crouch: -1, tailAngle: 88, legs: { ff: leg(), fn: leg(1, 2), bf: leg(), bn: leg() } }),
    happyA: stand({ wing: 2, eyes: 'happy', mouth: 'open', tailAngle: 80 }),
    happyB: stand({ wing: 1, eyes: 'happy', mouth: 'none', crouch: -1, tailAngle: 50 }),
    eatA: stand({ headDx: 3, headDy: 6, crouch: 1, eyes: 'happy', mouth: 'open', tailAngle: 60 }),
    eatB: stand({ headDx: 3, headDy: 5, crouch: 1, eyes: 'happy', mouth: 'none', tailAngle: 40 }),
  };
}

export function birdFrames(spec: BirdSpec, stage: ArtStage): Frames {
  const plan = birdPlan();
  return Object.fromEntries(FRAME_NAMES.map((name) => [name, renderBirdShape(spec, stage, plan[name].shape, plan[name].pose)])) as Frames;
}

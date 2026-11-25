/**
 * 네발 동물의 프레임별 자세 표.
 * 걸음걸이(gait)에 따라 걷기·뛰기 프레임이 달라진다: trot 은 대각선 발을 번갈아 내딛고, hop 은 깡충깡충 뛴다.
 */
import { FRAME_NAMES, type FrameName, type Frames } from './frames.js';
import { renderQuadShape, type QuadShape, type QuadSpec } from './quadruped.js';
import { basePose, leg, type ArtStage, type Leg, type Pose } from './types.js';

export type Gait = 'trot' | 'hop';

interface Plan {
  shape: QuadShape;
  pose: Pose;
}

/** 대각선 쌍(가까운 앞다리 + 먼 뒷다리)과 나머지 쌍이 반 박자 어긋나게 움직인다. */
function trotLegs(phase: number, amp: number, liftH: number): Pose['legs'] {
  const one = (p: number): Leg => {
    const th = 2 * Math.PI * p;
    return leg(Math.round(amp * Math.cos(th)), Math.max(0, Math.round(-Math.sin(th) * liftH)));
  };
  return { fn: one(phase), bf: one(phase), ff: one(phase + 0.5), bn: one(phase + 0.5) };
}

const P = basePose;

function stand(over: Partial<Pose> = {}): Plan {
  return { shape: 'stand', pose: P(over) };
}

function walkAndRun(gait: Gait): Partial<Record<FrameName, Plan>> {
  if (gait === 'hop') {
    return {
      // 걷기: 작은 깡충 — 웅크림 → 도약 → 정점 → 착지
      walk1: stand({ crouch: 2, stretch: -0.5, legs: { ff: leg(1, 0), fn: leg(1, 0), bf: leg(-1, 0), bn: leg(-1, 0) }, ears: 'up', tailAngle: 30 }),
      walk2: stand({ dy: -2, stretch: 0.9, legs: { ff: leg(4, 3), fn: leg(4, 3), bf: leg(-4, 2), bn: leg(-4, 2) }, ears: 'back', tailAngle: 20 }),
      walk3: stand({ dy: -3, stretch: 0.2, legs: { ff: leg(2, 4), fn: leg(2, 4), bf: leg(-2, 4), bn: leg(-2, 4) }, ears: 'back', tailAngle: 30 }),
      walk4: stand({ dy: -1, stretch: 0.4, legs: { ff: leg(3, 0), fn: leg(3, 0), bf: leg(-2, 3), bn: leg(-2, 3) }, ears: 'up', tailAngle: 40 }),
      // 뛰기: 크게 뛴다
      run1: stand({ crouch: 3, stretch: -0.7, legs: { ff: leg(1, 0), fn: leg(1, 0), bf: leg(-1, 0), bn: leg(-1, 0) }, ears: 'back', tailAngle: 20 }),
      run2: stand({ dy: -3, stretch: 1, legs: { ff: leg(5, 4), fn: leg(5, 4), bf: leg(-5, 3), bn: leg(-5, 3) }, ears: 'back', mouth: 'open', tailAngle: 10 }),
      run3: stand({ dy: -4, stretch: 0.3, legs: { ff: leg(2, 5), fn: leg(2, 5), bf: leg(-2, 5), bn: leg(-2, 5) }, ears: 'back', mouth: 'open', tailAngle: 25 }),
      run4: stand({ dy: -2, stretch: 0.6, legs: { ff: leg(4, 0), fn: leg(4, 0), bf: leg(-3, 4), bn: leg(-3, 4) }, ears: 'back', tailAngle: 30 }),
    };
  }
  const walk = (i: number): Plan =>
    stand({
      legs: trotLegs(i / 4, 3, 3),
      crouch: i % 2 === 0 ? 0 : -1,
      tailAngle: [48, 58, 48, 38][i] ?? 45,
      headDy: i % 2 === 0 ? 0 : -0.5,
    });
  const run = (i: number): Plan =>
    stand({
      legs: trotLegs(i / 4, 5, 5),
      crouch: i % 2 === 0 ? 0 : -1,
      dy: i % 2 === 0 ? 0 : -1,
      stretch: i % 2 === 0 ? 0.8 : 0.3,
      ears: 'back',
      mouth: 'smile',
      tailAngle: 15,
      tailCurl: 10,
    });
  return { walk1: walk(0), walk2: walk(1), walk3: walk(2), walk4: walk(3), run1: run(0), run2: run(1), run3: run(2), run4: run(3) };
}

/** 모든 프레임의 자세 표 */
export function quadPlan(gait: Gait): Record<FrameName, Plan> {
  const moving = walkAndRun(gait);
  const plan: Record<FrameName, Plan> = {
    idleA: stand({ tailAngle: 40 }),
    idleB: stand({ tailAngle: 58, stretch: 0.15, headDy: -0.5 }),
    sitA: { shape: 'sit', pose: P({ tailAngle: 28 }) },
    sitB: { shape: 'sit', pose: P({ tailAngle: 52, mouth: 'smile' }) },
    walk1: moving.walk1 as Plan,
    walk2: moving.walk2 as Plan,
    walk3: moving.walk3 as Plan,
    walk4: moving.walk4 as Plan,
    run1: moving.run1 as Plan,
    run2: moving.run2 as Plan,
    run3: moving.run3 as Plan,
    run4: moving.run4 as Plan,
    dozeA: { shape: 'sit', pose: P({ headDy: 2, eyes: 'sleepy', ears: 'down', tailAngle: 20 }) },
    dozeB: { shape: 'sit', pose: P({ headDy: 4, eyes: 'closed', ears: 'down', tailAngle: 20 }) },
    sleepA: { shape: 'lie', pose: P({ eyes: 'closed', ears: 'down', stretch: 0 }) },
    sleepB: { shape: 'lie', pose: P({ eyes: 'closed', ears: 'down', stretch: 1 }) },
    jumpCrouch: stand({ crouch: 3, stretch: -0.6, legs: { ff: leg(1, 0), fn: leg(1, 0), bf: leg(-1, 0), bn: leg(-1, 0) }, ears: 'back', tailAngle: 25 }),
    jumpUp: stand({ dy: -1, stretch: 0.9, legs: { ff: leg(4, 3), fn: leg(4, 2), bf: leg(-4, 2), bn: leg(-4, 1) }, ears: 'back', mouth: 'open', tailAngle: 20 }),
    jumpPeak: stand({ dy: -2, stretch: 0.2, legs: { ff: leg(2, 4), fn: leg(2, 4), bf: leg(-2, 4), bn: leg(-2, 4) }, eyes: 'happy', mouth: 'open', tailAngle: 80 }),
    jumpDown: stand({ dy: -1, stretch: 0.4, legs: { ff: leg(3, 2), fn: leg(3, 1), bf: leg(-1, 3), bn: leg(-1, 3) }, ears: 'back', mouth: 'open', tailAngle: 60 }),
    curl: { shape: 'curl', pose: P({ eyes: 'happy', ears: 'up' }) },
    climbA: stand({ stretch: 1, legs: { ff: leg(5, 2), fn: leg(3, 0), bf: leg(-4, 1), bn: leg(-2, 0) }, ears: 'back', tailAngle: 20 }),
    climbB: stand({ stretch: 1, legs: { ff: leg(3, 0), fn: leg(5, 2), bf: leg(-2, 0), bn: leg(-4, 1) }, ears: 'back', tailAngle: 28 }),
    slipA: stand({ stretch: 0.6, legs: { ff: leg(4, 2), fn: leg(2, 1), bf: leg(-4, 2), bn: leg(-3, 1) }, eyes: 'wide', mouth: 'open', ears: 'back', tailAngle: 85 }),
    slipB: stand({ stretch: 0.6, dy: -1, legs: { ff: leg(5, 1), fn: leg(3, 2), bf: leg(-3, 1), bn: leg(-4, 2) }, eyes: 'wide', mouth: 'open', ears: 'back', tailAngle: 70 }),
    hangA: { shape: 'hang', pose: P({ legs: { ff: leg(), fn: leg(), bf: leg(2), bn: leg() }, mouth: 'none' }) },
    hangB: { shape: 'hang', pose: P({ legs: { ff: leg(), fn: leg(), bf: leg(-2), bn: leg() }, mouth: 'smile' }) },
    fall: stand({ stretch: 0.3, legs: { ff: leg(3, 4), fn: leg(4, 5), bf: leg(-3, 5), bn: leg(-4, 4) }, eyes: 'wide', mouth: 'open', tailAngle: 85 }),
    alertA: stand({ eyes: 'wide', mouth: 'open', ears: 'up', tailAngle: 75 }),
    alertB: stand({ eyes: 'wide', mouth: 'open', ears: 'up', tailAngle: 88, crouch: -1, legs: { ff: leg(), fn: leg(1, 2), bf: leg(), bn: leg() } }),
    happyA: stand({ eyes: 'happy', mouth: 'open', tailAngle: 80 }),
    happyB: stand({ eyes: 'happy', mouth: 'smile', tailAngle: 50, crouch: -1 }),
    eatA: stand({ crouch: 1, headDx: 3, headDy: 5, eyes: 'happy', mouth: 'chew', ears: 'back', tailAngle: 35 }),
    eatB: stand({ crouch: 1, headDx: 3, headDy: 3, eyes: 'happy', mouth: 'none', ears: 'back', tailAngle: 50 }),
  };
  return plan;
}

/** 한 종·한 단계의 모든 프레임을 그린다. */
export function quadFrames(spec: QuadSpec, stage: ArtStage, gait: Gait): Frames {
  const plan = quadPlan(gait);
  return Object.fromEntries(FRAME_NAMES.map((name) => [name, renderQuadShape(spec, stage, plan[name].shape, plan[name].pose)])) as Frames;
}

import { describe, expect, it } from 'vitest';
import {
  DIZZY_MS,
  HOME_RADIUS,
  FAINT_FALL_PX,
  POOP_MS,
  REST_MS,
  STROLL_MS,
  WASH_MS,
  clearHome,
  createBehavior,
  drop,
  isOccupied,
  pickSpot,
  setHome,
  isStrolling,
  react,
  startPoop,
  startStroll,
  startWash,
  step,
  type BehaviorState,
  type Rect,
  type StepContext,
} from './behavior.js';

const SIZE = 48;
const screen: Rect = { x: 0, y: 0, width: 1000, height: 800 };
const ctxOf = (over: Partial<StepContext> = {}): StepContext => ({
  now: 10_000,
  dtMs: 33,
  areas: [screen],
  size: SIZE,
  rng: () => 0.5,
  cursor: { x: 500, y: 400 },
  cursorIdleMs: 0,
  stage: 'adult',
  ...over,
});
const base = (over: Partial<BehaviorState> = {}): BehaviorState => ({ ...createBehavior(100, 200, 0), until: 0, ...over });
const GROUND = 800 - SIZE;

describe('높은 데서 떨어지면 기절한다', () => {
  it('FAINT_FALL_PX 이상 떨어져 바닥에 닿으면 헤롱헤롱(dizzy) 상태가 되고 DIZZY_MS 동안 유지된다', () => {
    const falling = drop(base({ y: GROUND - FAINT_FALL_PX - 10 }), 9_000);
    expect(falling.fallFrom).toBe(GROUND - FAINT_FALL_PX - 10);
    const landed = step({ ...falling, y: GROUND - 1, vy: 2_000 }, ctxOf({ dtMs: 100 }));
    expect(landed).toMatchObject({ mode: 'dizzy', y: GROUND, vy: 0 });
    expect(landed.until).toBe(10_000 + DIZZY_MS);
    // 기절한 동안은 그 자리에 있다가, 시간이 지나면 일어선다.
    expect(step(landed, ctxOf({ now: 11_000 }))).toBe(landed);
    expect(step(landed, ctxOf({ now: 10_000 + DIZZY_MS }))).toMatchObject({ mode: 'idle' });
  });

  it('조금(기준 미만) 떨어지면 기절하지 않는다', () => {
    const falling = drop(base({ y: GROUND - (FAINT_FALL_PX - 20) }), 9_000);
    expect(step({ ...falling, y: GROUND - 1, vy: 2_000 }, ctxOf({ dtMs: 100 }))).toMatchObject({ mode: 'idle' });
  });

  it('매달렸다가 마우스가 움직여 떨어질 때도 떨어진 높이를 잰다', () => {
    const hanging = base({ mode: 'hang', anchorX: 600, anchorY: 100, x: 576, y: 100 });
    const falling = step(hanging, ctxOf({ cursor: { x: 700, y: 100 } }));
    expect(falling).toMatchObject({ mode: 'fall', fallFrom: 100 });
    expect(step({ ...falling, y: GROUND - 1, vy: 2_000 }, ctxOf({ dtMs: 100 }))).toMatchObject({ mode: 'dizzy' });
  });

  it('기절 중에는 매달리러 가거나 반응하지 않는다', () => {
    const dizzy = base({ mode: 'dizzy', until: 20_000 });
    expect(step(dizzy, ctxOf({ cursorIdleMs: 60_000 }))).toBe(dizzy);
    expect(react(dizzy, 'happy', 10_000)).toBe(dizzy);
  });
});

describe('돌봄은 하나가 끝나기 전에 연달아 받지 않는다', () => {
  it('좋아하기·먹기·놀기·씻기·응가·기절 중에는 아직 끝나지 않았으면 바쁜 상태다', () => {
    for (const mode of ['happy', 'eat', 'play', 'wash', 'poop', 'dizzy'] as const) {
      expect(isOccupied(base({ mode, until: 12_000 }), 10_000), mode).toBe(true);
      expect(isOccupied(base({ mode, until: 10_000 }), 10_000), `${mode} 끝남`).toBe(false);
    }
  });

  it('가만히·걷기·자기 같은 평소 동작은 바쁜 상태가 아니다', () => {
    for (const mode of ['idle', 'walk', 'run', 'sit', 'doze', 'sleep', 'hang'] as const) {
      expect(isOccupied(base({ mode, until: 99_999 }), 10_000), mode).toBe(false);
    }
  });

  it('react 로 시작한 좋아하기는 끝나기 전까지 바쁘고, 끝나면 풀린다', () => {
    const happy = react(base({ mode: 'idle' }), 'happy', 10_000);
    expect(isOccupied(happy, 10_500)).toBe(true);
    expect(isOccupied(happy, 99_000)).toBe(false);
  });
});

describe('씻기·응가', () => {
  it('startWash: 씻는 동안 WASH_MS 후 일어서고, 끊으면 안 되는 상태(벽 타기·떨어지는 중)에서는 시작하지 않는다', () => {
    const w = startWash(base({ mode: 'idle' }), 10_000);
    expect(w).toMatchObject({ mode: 'wash', until: 10_000 + WASH_MS });
    expect(step(w, ctxOf({ now: 10_000 + WASH_MS }))).toMatchObject({ mode: 'idle' });
    const climbing = base({ mode: 'climb' });
    expect(startWash(climbing, 10_000)).toBe(climbing);
    const falling = base({ mode: 'fall' });
    expect(startWash(falling, 10_000)).toBe(falling);
  });

  it('startPoop: 웅크리는 동안 POOP_MS 후 끝난다', () => {
    const p = startPoop(base({ mode: 'walk' }), 10_000);
    expect(p).toMatchObject({ mode: 'poop', until: 10_000 + POOP_MS });
    expect(step(p, ctxOf({ now: 10_000 + POOP_MS }))).toMatchObject({ mode: 'idle' });
  });
});

describe('산책', () => {
  it('시작하면 STROLL_MS 범위의 시간 동안 산책 상태가 된다', () => {
    const s = startStroll(base(), ctxOf({ rng: () => 0 }));
    expect(s.strollUntil).toBe(10_000 + STROLL_MS.min);
    expect(isStrolling(s, 10_001)).toBe(true);
    const long = startStroll(base(), ctxOf({ rng: () => 1 }));
    expect(long.strollUntil).toBe(10_000 + STROLL_MS.max);
  });

  it('알이거나 이미 산책 중이거나 쉬는 중이거나 떨어지는 중이면 시작하지 않는다', () => {
    expect(startStroll(base(), ctxOf({ stage: 'egg' })).strollUntil).toBe(0);
    const strolling = startStroll(base(), ctxOf());
    expect(startStroll(strolling, ctxOf({ now: 20_000 }))).toBe(strolling);
    expect(startStroll(base({ restUntil: 50_000 }), ctxOf()).strollUntil).toBe(0);
    expect(startStroll(base({ mode: 'fall' }), ctxOf()).strollUntil).toBe(0);
  });

  it('산책 중에는 마우스 쪽으로 다가가고, 마우스가 오른쪽에 있으면 그 왼쪽에 서서 오른쪽을 본다', () => {
    let s = startStroll(base({ x: 100, y: 400 }), ctxOf());
    const before = Math.hypot(500 - (s.x + SIZE / 2), 400 - (s.y + SIZE / 2));
    for (let i = 0; i < 30; i++) s = step(s, ctxOf({ now: 10_000 + i * 33, dtMs: 33 }));
    const after = Math.hypot(500 - (s.x + SIZE / 2), 400 - (s.y + SIZE / 2));
    expect(after).toBeLessThan(before);
    expect(s.dir).toBe('right');
    expect(['walk', 'run']).toContain(s.mode);
  });

  it('마우스를 움직여도 계속 따라가고, 마우스 옆에 도착하면 가만히 서서 기다린다(매달리지 않는다)', () => {
    let s = startStroll(base({ x: 100, y: 400 }), ctxOf());
    for (let i = 0; i < 2000; i++) s = step(s, ctxOf({ now: 10_000 + i * 33, dtMs: 33, cursorIdleMs: 30_000 }));
    expect(s.mode).toBe('idle');
    expect(s.strollUntil).toBeGreaterThan(0);
    expect(Math.abs(s.x + SIZE / 2 - 500)).toBeLessThan(SIZE * 2);
  });

  it('산책 시간이 끝나면 지쳐서 앉고, 쉬는 동안은 마우스를 따라가거나 매달리지 않는다', () => {
    const s = startStroll(base({ x: 100, y: 400 }), ctxOf({ rng: () => 0 }));
    const end = 10_000 + STROLL_MS.min;
    const tired = step(s, ctxOf({ now: end }));
    expect(tired).toMatchObject({ mode: 'sit', strollUntil: 0, restUntil: end + REST_MS });
    expect(isStrolling(tired, end)).toBe(false);
    // 쉬는 중에는 마우스를 오래 두어도 매달리러 가지 않는다
    const stillTired = step({ ...tired, mode: 'idle', until: 0 }, ctxOf({ now: end + 20_000, cursorIdleMs: 60_000 }));
    expect(stillTired.then).toBe('none');
    // 쉬는 시간이 지나면 다시 산책할 수 있다
    expect(startStroll({ ...tired, mode: 'idle' }, ctxOf({ now: end + REST_MS + 1 })).strollUntil).toBeGreaterThan(0);
  });

  it('산책 중 문제를 알리러 가는 중이면 따라가기를 잠시 멈춘다', () => {
    const s = { ...startStroll(base({ x: 100, y: 400 }), ctxOf()), mode: 'run' as const, then: 'alert' as const, targetX: 900, targetY: 100 };
    const next = step(s, ctxOf({ now: 10_100 }));
    expect(next.then).toBe('alert');
    expect(next.x).toBeGreaterThan(s.x);
  });
});

describe('혼자 놀게 두기(여기서만)', () => {
  const home = { x: 500, y: 400, radius: 200 };

  it('pickSpot: 중심 둘레(반경) 안에 펫이 통째로 들어가는 자리만 고른다', () => {
    for (const r of [0, 0.3, 0.7, 1]) {
      const p = pickSpot([screen], SIZE, () => r, home)!;
      expect(Math.hypot(p.x + SIZE / 2 - home.x, p.y + SIZE / 2 - home.y)).toBeLessThanOrEqual(home.radius * Math.SQRT2 + 1);
      expect(p.x).toBeGreaterThanOrEqual(home.x - home.radius);
      expect(p.x + SIZE).toBeLessThanOrEqual(home.x + home.radius);
      expect(p.y).toBeGreaterThanOrEqual(home.y - home.radius);
      expect(p.y + SIZE).toBeLessThanOrEqual(home.y + home.radius);
    }
  });

  it('중심이 화면 가장자리여도 화면 밖으로 나가지 않는다', () => {
    const p = pickSpot([screen], SIZE, () => 0, { x: 10, y: 10, radius: 200 })!;
    expect(p.x).toBeGreaterThanOrEqual(0);
    expect(p.y).toBeGreaterThanOrEqual(0);
  });

  it('setHome/clearHome', () => {
    const s = setHome(base(), 300, 300);
    expect(s.home).toEqual({ x: 300, y: 300, radius: HOME_RADIUS });
    expect(clearHome(s).home).toBeNull();
  });

  it('돌아다닐 곳을 정할 때 범위 안만 고르고, 벽 타러 멀리 가지 않는다', () => {
    const s = setHome(base({ x: 480, y: 380, mode: 'idle', until: 0 }), 500, 400);
    for (const r of [0.05, 0.35, 0.45, 0.8]) {
      const next = step(s, ctxOf({ rng: () => r }));
      if (next.mode === 'walk' || next.mode === 'run') {
        expect(Math.abs(next.targetX + SIZE / 2 - 500)).toBeLessThanOrEqual(HOME_RADIUS + SIZE);
        expect(Math.abs(next.targetY + SIZE / 2 - 400)).toBeLessThanOrEqual(HOME_RADIUS + SIZE);
      }
      expect(next.then).not.toBe('climb');
    }
  });

  it('범위 밖에 나와 있으면 쉬는 시간이 끝났을 때 먼저 범위 안으로 돌아온다', () => {
    const s = setHome(base({ x: 900, y: 700, mode: 'idle', until: 0 }), 300, 300);
    const next = step(s, ctxOf());
    expect(next.mode).toBe('walk');
    expect(next.targetX).toBeLessThan(600);
    expect(next.targetY).toBeLessThan(600);
  });

  it('마우스가 범위 밖에 있으면 오래 가만히 둬도 매달리러 가지 않는다', () => {
    const s = setHome(base({ x: 480, y: 380, mode: 'idle', until: 99_999 }), 500, 400);
    expect(step(s, ctxOf({ cursorIdleMs: 60_000, cursor: { x: 950, y: 750 } })).then).toBe('none');
    expect(step(s, ctxOf({ cursorIdleMs: 60_000, cursor: { x: 520, y: 420 } })).then).toBe('hang');
  });
});

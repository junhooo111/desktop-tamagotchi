import { describe, expect, it } from 'vitest';
import {
  ALERT_MS,
  GRAVITY,
  HANG_AFTER_MS,
  SPEED,
  canInspect,
  carry,
  clampToAreas,
  createBehavior,
  drop,
  callToSpot,
  endAlert,
  goInspect,
  pickSpot,
  react,
  REACT_MS,
  resize,
  step,
  trigger,
  wake,
  type BehaviorState,
  type Rect,
  type StepContext,
} from './behavior.js';

const SIZE = 48;
const screenA: Rect = { x: 0, y: 0, width: 1000, height: 800 };
const screenB: Rect = { x: 1000, y: 0, width: 1920, height: 1040 };

/** 정해 둔 값을 차례로 돌려주는 난수(다 쓰면 마지막 값 반복) */
const seq = (...values: number[]) => {
  let i = 0;
  return () => values[Math.min(i++, values.length - 1)] ?? 0;
};

const ctxOf = (over: Partial<StepContext> = {}): StepContext => ({
  now: 10_000,
  dtMs: 33,
  areas: [screenA],
  size: SIZE,
  rng: () => 0.5,
  cursor: { x: 500, y: 400 },
  cursorIdleMs: 0,
  stage: 'adult',
  ...over,
});

const base = (over: Partial<BehaviorState> = {}): BehaviorState => ({
  ...createBehavior(100, 200, 0),
  until: 0,
  ...over,
});

describe('pickSpot', () => {
  it('모니터 안에 펫이 통째로 들어가는 위치만 고른다(난수가 1이어도)', () => {
    for (const r of [0, 0.5, 0.999, 1]) {
      const t = pickSpot([screenA], SIZE, () => r)!;
      expect(t.x + SIZE).toBeLessThanOrEqual(1000);
      expect(t.y + SIZE).toBeLessThanOrEqual(800);
      expect(t.x).toBeGreaterThanOrEqual(0);
    }
  });

  it('여러 모니터 중 하나를 골라 그 안에서 위치를 정하고, 없으면 null', () => {
    expect(pickSpot([screenA, screenB], SIZE, seq(0.99, 0, 0))).toEqual({ x: 1000, y: 0 });
    expect(pickSpot([], SIZE, () => 0.5)).toBeNull();
  });
});

describe('가만히 → 다음 행동', () => {
  it('쉬는 시간이 남아 있으면 그대로다', () => {
    const s = base({ until: 20_000 });
    expect(step(s, ctxOf())).toBe(s);
  });

  it.each([
    [0.1, 'walk'],
    [0.35, 'run'],
    [0.45, 'sit'],
    [0.55, 'doze'],
    [0.65, 'play'],
    [0.8, 'walk'], // 벽까지 걸어간다
    [0.95, 'idle'],
  ])('난수 %s 이면 %s 를 시작한다', (r, mode) => {
    const next = step(base(), ctxOf({ rng: () => r }));
    expect(next.mode).toBe(mode);
  });

  it('알은 걷거나 뛰어오를 뿐, 졸거나 달리거나 벽을 타지 않는다', () => {
    const modes = [0.1, 0.5, 0.65, 0.8, 0.95].map((r) => step(base(), ctxOf({ rng: () => r, stage: 'egg' })));
    expect(modes.map((s) => s.mode)).toEqual(['walk', 'walk', 'play', 'idle', 'idle']);
    expect(modes[2]?.play).toBe('hop');
  });
});

describe('걷기·뛰기', () => {
  const travel = (mode: 'walk' | 'run', over: Partial<BehaviorState> = {}) =>
    base({ mode, targetX: 400, targetY: 200, x: 100, y: 200, dir: 'right', ...over });

  it('속도만큼 목표로 다가가고 진행 방향을 본다', () => {
    const r = step(travel('walk', { targetX: 0 }), ctxOf({ dtMs: 1000 }));
    expect(r.x).toBeCloseTo(100 - SPEED.walk);
    expect(r.dir).toBe('left');
    const run = step(travel('run'), ctxOf({ dtMs: 1000 }));
    expect(run.x).toBeCloseTo(100 + SPEED.run);
  });

  it('목표에 닿으면 가만히 서서 쉰다', () => {
    const r = step(travel('walk', { x: 399 }), ctxOf({ dtMs: 1000 }));
    expect(r).toMatchObject({ mode: 'idle', x: 400, y: 200 });
    expect(r.until).toBeGreaterThan(10_000);
  });
});

describe('앉기', () => {
  const sitting = base({ mode: 'sit', until: 30_000 });

  it('앉아 있는 동안은 그대로이고, 시간이 지나면 가끔 졸고 대개는 일어선다', () => {
    expect(step(sitting, ctxOf({ now: 29_999 }))).toBe(sitting);
    expect(step(sitting, ctxOf({ now: 30_000, rng: () => 0.1 })).mode).toBe('doze');
    expect(step(sitting, ctxOf({ now: 30_000, rng: () => 0.9 })).mode).toBe('idle');
  });

  it('앉은 채로도 마우스를 오래 두면 매달리러 가고, 문제를 알리러 갈 수도 있다', () => {
    expect(step(sitting, ctxOf({ cursorIdleMs: HANG_AFTER_MS })).then).toBe('hang');
    expect(canInspect(sitting, 'adult')).toBe(true);
  });
});

describe('반응: 쓰다듬으면 좋아하고 밥을 주면 먹는다', () => {
  it('react 는 좋아하기(happy)·먹기(eat) 동작을 일정 시간 한 뒤 가만히 서는 상태로 돌아온다', () => {
    const happy = react(base({ mode: 'walk' }), 'happy', 1_000);
    expect(happy).toMatchObject({ mode: 'happy', since: 1_000, until: 1_000 + REACT_MS.happy, then: 'none' });
    const eat = react(base(), 'eat', 1_000);
    expect(eat).toMatchObject({ mode: 'eat', until: 1_000 + REACT_MS.eat });

    expect(step(happy, ctxOf({ now: happy.until - 1 }))).toBe(happy);
    expect(step(happy, ctxOf({ now: happy.until })).mode).toBe('idle');
    expect(step(eat, ctxOf({ now: eat.until })).mode).toBe('idle');
  });

  it('자거나 조는 중이어도 반응하고(깨어난다), 앉아 있어도 반응한다', () => {
    expect(react(base({ mode: 'sleep' }), 'happy', 5).mode).toBe('happy');
    expect(react(base({ mode: 'doze' }), 'eat', 5).mode).toBe('eat');
    expect(react(base({ mode: 'sit' }), 'happy', 5).mode).toBe('happy');
  });

  it('벽을 타거나 매달리거나 떨어지는 중, 문제를 알리러 가는 중에는 끊지 않는다', () => {
    for (const s of [
      base({ mode: 'climb', surface: 'wallL' }),
      base({ mode: 'hang' }),
      base({ mode: 'fall' }),
      base({ mode: 'carried' }),
      base({ mode: 'alert' }),
      base({ mode: 'run', then: 'alert' }),
      base({ mode: 'run', then: 'hang' }),
    ]) {
      expect(react(s, 'happy', 5), `${s.mode}/${s.then}`).toBe(s);
    }
  });
});

describe('졸기·자기', () => {
  it('졸다가 시간이 되면 대개 잠들고, 가끔 깬다', () => {
    const dozing = base({ mode: 'doze', until: 10_000 });
    expect(step(dozing, ctxOf({ rng: () => 0.1 })).mode).toBe('sleep');
    expect(step(dozing, ctxOf({ rng: () => 0.9 })).mode).toBe('idle');
    expect(step({ ...dozing, until: 99_999 }, ctxOf())).toMatchObject({ mode: 'doze' });
  });

  it('자는 동안은 그대로이고 시간이 되면 일어난다', () => {
    const sleeping = base({ mode: 'sleep', until: 30_000 });
    expect(step(sleeping, ctxOf({ now: 29_999 }))).toBe(sleeping);
    expect(step(sleeping, ctxOf({ now: 30_000 })).mode).toBe('idle');
  });

  it('wake 는 자거나 조는 펫만 깨운다', () => {
    expect(wake(base({ mode: 'sleep' }), 5).mode).toBe('idle');
    expect(wake(base({ mode: 'doze' }), 5).mode).toBe('idle');
    const walking = base({ mode: 'walk' });
    expect(wake(walking, 5)).toBe(walking);
  });
});

describe('벽 타기', () => {
  it('벽 가장자리로 걸어가서 도착하면 벽에 붙어 기어오른다', () => {
    const toWall = step(base(), ctxOf({ rng: seq(0.8, 0, 0.3, 0.5) })); // 벽 타기 선택 → 영역0 → 왼쪽 → y
    expect(toWall).toMatchObject({ mode: 'walk', then: 'climb', side: 'left', targetX: 0 });

    const arrived = step({ ...toWall, x: 1, y: toWall.targetY }, ctxOf({ dtMs: 1000, rng: seq(0.1) }));
    expect(arrived).toMatchObject({ mode: 'climb', surface: 'wallL', x: 0 });
    expect(['up', 'down']).toContain(arrived.dir);
  });

  it('오른쪽 벽이면 펫이 화면 오른쪽 끝에 붙는다', () => {
    const toWall = step(base(), ctxOf({ rng: seq(0.8, 0, 0.9, 0.5) }));
    expect(toWall).toMatchObject({ then: 'climb', side: 'right', targetX: 1000 - SIZE });
    const arrived = step({ ...toWall, x: toWall.targetX - 1, y: toWall.targetY }, ctxOf({ dtMs: 1000, rng: seq(0.1) }));
    expect(arrived).toMatchObject({ mode: 'climb', surface: 'wallR', x: 1000 - SIZE });
  });

  const climbing = (over: Partial<BehaviorState> = {}) =>
    base({ mode: 'climb', surface: 'wallL', side: 'left', dir: 'up', x: 0, y: 400, targetY: 100, ...over });

  it('목표 높이까지 오르고 도착하면 바닥으로 돌아와 안쪽을 본다', () => {
    const moving = step(climbing(), ctxOf({ dtMs: 1000, rng: () => 0.99 }));
    expect(moving.y).toBeCloseTo(400 - SPEED.climb);
    expect(moving.surface).toBe('wallL');
    const done = step(climbing({ y: 101 }), ctxOf({ dtMs: 1000, rng: () => 0.99 }));
    expect(done).toMatchObject({ mode: 'idle', surface: 'floor', dir: 'right', y: 100 });
  });

  it('오르다가 가끔 미끄러져 내려가고, 시간이 지나면 다시 오른다', () => {
    const slipping = step(climbing(), ctxOf({ dtMs: 33, rng: () => 0 }));
    expect(slipping).toMatchObject({ mode: 'slip', dir: 'down' });

    const sliding = step({ ...slipping, until: 99_999 }, ctxOf({ dtMs: 1000 }));
    expect(sliding.y).toBeCloseTo(400 + SPEED.slip);

    const resumed = step({ ...slipping, until: 10_000 }, ctxOf());
    expect(resumed).toMatchObject({ mode: 'climb', dir: 'up' });
  });

  it('미끄러져 맨 아래까지 내려오면 멈추고 바닥에 선다', () => {
    const bottom = 800 - SIZE;
    const r = step(base({ mode: 'slip', surface: 'wallL', side: 'left', x: 0, y: bottom - 1, until: 99_999 }), ctxOf());
    expect(r).toMatchObject({ mode: 'idle', surface: 'floor', y: bottom });
  });
});

describe('혼자 놀기', () => {
  it('시간이 끝나면 놀기를 마치고 쉰다', () => {
    const playing = base({ mode: 'play', play: 'hop', until: 10_000 });
    expect(step(playing, ctxOf()).mode).toBe('idle');
    expect(step({ ...playing, until: 99_999 }, ctxOf())).toMatchObject({ mode: 'play' });
  });

  it('구르면 진행 방향으로 움직이되 화면 밖으로 나가지 않는다', () => {
    const rolling = base({ mode: 'play', play: 'roll', dir: 'right', x: 100, until: 99_999 });
    expect(step(rolling, ctxOf({ dtMs: 1000 })).x).toBeCloseTo(100 + SPEED.roll);
    expect(step({ ...rolling, x: 950 }, ctxOf({ dtMs: 1000 })).x).toBe(1000 - SIZE);
    expect(step({ ...rolling, dir: 'left', x: 10 }, ctxOf({ dtMs: 1000 })).x).toBe(0);
  });
});

describe('마우스 매달리기', () => {
  const idleCursor = ctxOf({ cursorIdleMs: HANG_AFTER_MS, cursor: { x: 600, y: 300 } });

  it('마우스를 10초 가만히 두면 마우스 쪽으로 뛰어간다', () => {
    const r = step(base(), idleCursor);
    expect(r).toMatchObject({ mode: 'run', then: 'hang', targetX: 600 - SIZE / 2, targetY: 300 });
    const notYet = step(base(), ctxOf({ cursorIdleMs: HANG_AFTER_MS - 1 }));
    expect(notYet.then).toBe('none'); // 9.999초면 아직 매달리러 가지 않는다
  });

  it('알·자는 펫·벽을 타는 펫은 매달리러 가지 않는다', () => {
    expect(step(base(), { ...idleCursor, stage: 'egg' }).then).toBe('none');
    const sleeping = base({ mode: 'sleep', until: 99_999 });
    expect(step(sleeping, idleCursor)).toBe(sleeping);
    expect(step(base({ mode: 'climb', surface: 'wallL', targetY: 100 }), idleCursor).mode).not.toBe('run');
  });

  it('도착하면 마우스에 매달리고, 마우스가 가만히 있는 동안은 그 자리를 따라간다', () => {
    const running = step(base(), idleCursor);
    const hanging = step({ ...running, x: 600 - SIZE / 2 - 1, y: 300 }, { ...idleCursor, dtMs: 1000 });
    expect(hanging).toMatchObject({ mode: 'hang', anchorX: 600, anchorY: 300 });
    const still = step(hanging, idleCursor);
    expect(still).toMatchObject({ mode: 'hang', x: 600 - SIZE / 2, y: 300 });
  });

  it('달려가는 도중 마우스가 움직이면 포기한다', () => {
    const running = step(base(), idleCursor);
    expect(step(running, { ...idleCursor, cursorIdleMs: 200 }).mode).toBe('idle');
  });

  it('매달린 뒤 마우스가 움직이면 놓치고 떨어져 바닥에 내려앉는다', () => {
    const hanging = base({ mode: 'hang', anchorX: 600, anchorY: 300, x: 576, y: 300 });
    const falling = step(hanging, ctxOf({ cursor: { x: 640, y: 300 } }));
    expect(falling).toMatchObject({ mode: 'fall', vy: 0 });

    const next = step(falling, ctxOf({ dtMs: 100 }));
    expect(next.vy).toBeCloseTo((GRAVITY * 100) / 1000);
    expect(next.y).toBeGreaterThan(300);

    // 높이가 낮은(300px 미만) 데서 떨어지면 기절하지 않고 그냥 내려앉는다.
    const short = step({ ...falling, fallFrom: 800 - SIZE - 100, y: 800 - SIZE - 1, vy: 2_000 }, ctxOf({ dtMs: 100 }));
    expect(short).toMatchObject({ mode: 'idle', y: 800 - SIZE, surface: 'floor' });
    // 높은 데서 떨어졌으면(여기서는 y=300 에서 시작) 바닥에서 기절한다.
    const landed = step({ ...falling, y: 800 - SIZE - 1, vy: 2_000 }, ctxOf({ dtMs: 100 }));
    expect(landed).toMatchObject({ mode: 'dizzy', y: 800 - SIZE, surface: 'floor' });
  });
});

describe('검사 알림', () => {
  it('canInspect: 알이거나 자거나 다른 일을 하러 가는 중이면 갈 수 없다', () => {
    expect(canInspect(base(), 'adult')).toBe(true);
    expect(canInspect(base({ mode: 'walk' }), 'baby')).toBe(true);
    expect(canInspect(base(), 'egg')).toBe(false);
    expect(canInspect(base({ mode: 'sleep' }), 'adult')).toBe(false);
    expect(canInspect(base({ mode: 'climb', surface: 'wallL' }), 'adult')).toBe(false);
    expect(canInspect(base({ mode: 'run', then: 'hang' }), 'adult')).toBe(false);
    expect(canInspect(base({ mode: 'run', then: 'alert' }), 'adult')).toBe(false);
  });

  it('goInspect: 문제 자리로 뛰어가고, 도착하면 알림 상태로 기다린다', () => {
    const going = goInspect(base({ x: 100, y: 200 }), ctxOf(), 400, 200);
    expect(going).toMatchObject({ mode: 'run', then: 'alert', targetX: 400, targetY: 200, dir: 'right' });

    const midway = step(going, ctxOf({ dtMs: 1000 }));
    expect(midway.mode).toBe('run');
    expect(midway.x).toBeCloseTo(100 + SPEED.run);

    const arrived = step({ ...going, x: 399 }, ctxOf({ dtMs: 1000, now: 50_000 }));
    expect(arrived).toMatchObject({ mode: 'alert', x: 400, then: 'none', since: 50_000, until: 50_000 + ALERT_MS });
  });

  it('callToSpot: 자고 있든 벽을 타든 하던 일을 멈추고 그 자리로 뛰어간다(들려 있는 중에는 그대로)', () => {
    for (const mode of ['sleep', 'climb', 'hang', 'doze', 'sit', 'play'] as const) {
      const called = callToSpot(base({ x: 100, y: 200, mode, surface: 'wallL', strollUntil: 9_999_999 }), ctxOf(), 700, 300);
      expect(called, mode).toMatchObject({ mode: 'run', then: 'alert', targetX: 700, targetY: 300, surface: 'floor', strollUntil: 0 });
    }
    const carried = base({ mode: 'carried' });
    expect(callToSpot(carried, ctxOf(), 700, 300)).toBe(carried);
  });

  it('알림 상태는 제자리에서 기다리다가 시간이 지나면 쉬는 상태로 돌아간다', () => {
    const alerting = base({ mode: 'alert', until: 60_000 });
    expect(step(alerting, ctxOf({ now: 59_999 }))).toBe(alerting);
    expect(step(alerting, ctxOf({ now: 60_000 })).mode).toBe('idle');
  });

  it('endAlert: 확인하거나 미루면 가만히 선다', () => {
    expect(endAlert(base({ mode: 'alert' }), 5)).toMatchObject({ mode: 'idle', then: 'none', since: 5 });
  });

  it('문제를 알리러 가는 중이거나 알리는 중이면, 마우스를 오래 두어도 매달리러 가지 않는다', () => {
    // 화면을 읽느라 마우스를 안 움직이는 동안에도 알림이 끊기지 않아야 한다.
    const idleCursor = ctxOf({ cursorIdleMs: HANG_AFTER_MS, cursor: { x: 600, y: 300 } });
    const alerting = base({ mode: 'alert', until: 99_999 });
    expect(step(alerting, idleCursor)).toBe(alerting);
    const going = step(base({ mode: 'run', then: 'alert', x: 100, y: 200, targetX: 900, targetY: 200 }), idleCursor);
    expect(going).toMatchObject({ mode: 'run', then: 'alert' });
  });

  it('clampToAreas: 가장 가까운 모니터 안으로 펫이 통째로 들어가게 옮긴다', () => {
    expect(clampToAreas(-30, 900, SIZE, [screenA])).toEqual({ x: 0, y: 800 - SIZE });
    expect(clampToAreas(1500, 100, SIZE, [screenA, screenB])).toEqual({ x: 1500, y: 100 });
    expect(clampToAreas(5, 5, SIZE, [])).toEqual({ x: 5, y: 5 });
  });
});

describe('집기·놓기·크기 변경·메뉴 실행', () => {
  it('집으면 행동을 멈추고 step 이 위치를 건드리지 않는다', () => {
    const held = carry(base({ mode: 'walk' }), 5);
    expect(held.mode).toBe('carried');
    expect(step(held, ctxOf())).toBe(held);
  });

  it('놓으면 떨어진다', () => {
    expect(drop(carry(base(), 5), 6)).toMatchObject({ mode: 'fall', vy: 0, surface: 'floor' });
  });

  it('크기가 커지면 발 위치(아래쪽 가운데)를 유지하도록 좌표를 옮긴다', () => {
    const r = resize(base({ x: 100, y: 200, targetX: 300, targetY: 400 }), 32, 48);
    expect(r).toMatchObject({ x: 92, y: 184, targetX: 292, targetY: 384 });
    const same = base();
    expect(resize(same, 48, 48)).toBe(same);
  });

  it('메뉴에서 시킨 동작이 바로 시작된다', () => {
    expect(trigger(base(), 'sleep', ctxOf()).mode).toBe('sleep');
    expect(trigger(base(), 'run', ctxOf()).mode).toBe('run');
    expect(trigger(base(), 'climb', ctxOf({ rng: seq(0, 0.2, 0.5) }))).toMatchObject({ mode: 'walk', then: 'climb' });
    expect(trigger(base(), 'play', ctxOf()).mode).toBe('play');
  });

  it('알은 메뉴로 시켜도 아무것도 하지 않는다', () => {
    const s = base();
    expect(trigger(s, 'sleep', ctxOf({ stage: 'egg' }))).toBe(s);
  });
});

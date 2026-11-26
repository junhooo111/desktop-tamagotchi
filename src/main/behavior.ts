/**
 * 펫의 행동을 정하는 상태 머신(순수 로직, 화면·Electron 과 무관).
 *
 * 위치(x, y)는 펫 그림의 왼쪽 위 모서리이고, 화면(모니터 작업 영역) 좌표다.
 * 행동: 가만히(idle) · 걷기 · 뛰기 · 졸기 · 자기 · 벽 타기 · 미끄러지기 · 놀기 ·
 *       마우스에 매달리기 · 떨어지기 · 잡혀 있기(carried)
 */
import type { Dir, Mode, PlayKind, Surface } from '../shared/motion.js';
import type { Stage } from '../shared/pet.js';

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** 걷거나 뛰어서 도착한 뒤 이어서 할 일 */
export type Then = 'none' | 'climb' | 'hang' | 'alert';
export type Side = 'left' | 'right';

export interface BehaviorState {
  x: number;
  y: number;
  surface: Surface;
  dir: Dir;
  mode: Mode;
  /** 현재 동작이 시작된 시각(ms) */
  since: number;
  /** 시간이 정해진 동작(가만히·졸기·자기·놀기·미끄러지기)이 끝나는 시각(ms) */
  until: number;
  targetX: number;
  targetY: number;
  then: Then;
  /** 어느 쪽 벽을 탈지 */
  side: Side;
  play: PlayKind;
  /** 떨어지는 속도(px/s) */
  vy: number;
  /** 매달린 자리(마우스 위치) */
  anchorX: number;
  anchorY: number;
  /** 떨어지기 시작한 높이(펫 위쪽 y). 얼마나 높은 데서 떨어졌는지 잰다. */
  fallFrom: number;
  /** 산책이 끝나는 시각(ms). 0 이면 산책 중이 아니다. 산책 동안 마우스를 따라다닌다. */
  strollUntil: number;
  /** 산책하고 지쳐서 쉬는 시간이 끝나는 시각(ms). 쉬는 동안은 마우스를 따라가지 않는다. */
  restUntil: number;
  /** 혼자 놀게 두기: 이 점 둘레(radius px) 안에서만 돌아다닌다. null 이면 화면 전체를 자유롭게 다닌다. */
  home: { x: number; y: number; radius: number } | null;
}

export interface StepContext {
  now: number;
  dtMs: number;
  /** 모니터별 작업 영역 */
  areas: readonly Rect[];
  /** 펫 그림 한 변의 화면 픽셀 */
  size: number;
  rng: () => number;
  cursor: { x: number; y: number };
  /** 마우스가 가만히 있은 시간(ms) */
  cursorIdleMs: number;
  stage: Stage;
}

/** 초당 이동 픽셀 */
export const SPEED = { walk: 35, run: 100, climb: 28, slip: 100, roll: 32 } as const;
export const GRAVITY = 1800;
/** 마우스를 이 시간 이상 가만히 두면 펫이 매달리러 온다 */
export const HANG_AFTER_MS = 10_000;
/** 매달린 뒤 마우스가 이만큼 움직이면 놓친다 */
export const HANG_RELEASE_PX = 6;
/** 벽을 타는 동안 초당 미끄러질 확률 */
export const SLIP_PER_SEC = 0.12;
/** 문제를 찾은 자리에서 사용자를 기다리는 최대 시간 */
export const ALERT_MS = 90_000;
/** 이 높이(px) 이상에서 떨어져 바닥에 닿으면 기절한다 */
export const FAINT_FALL_PX = 300;
/** 기절해서 헤롱헤롱하는 시간 */
export const DIZZY_MS = 4_500;
/** 산책 시간(ms)의 범위. 이 시간 동안 마우스를 따라다니다가 지친다. */
export const STROLL_MS = { min: 60_000, max: 120_000 } as const;
/** 산책하고 지쳐서 마우스를 따라가지 않고 쉬는 시간 */
export const REST_MS = 120_000;
export const POOP_MS = 1_400;
export const WASH_MS = 3_000;
/** 산책 중 마우스 옆에서 이만큼(펫 크기 배수) 떨어져 따라간다 */
const FOLLOW_GAP = 1.4;

const PLAY_MS: Record<PlayKind, number> = { hop: 1_800, roll: 1_600, look: 2_400 };

const rand = (rng: () => number, lo: number, hi: number): number => lo + rng() * (hi - lo);
const horizontal = (d: Dir): Dir => (d === 'left' ? 'left' : 'right');

export function createBehavior(x: number, y: number, now: number): BehaviorState {
  return {
    x,
    y,
    surface: 'floor',
    dir: 'right',
    mode: 'idle',
    since: now,
    until: now + 1_000,
    targetX: x,
    targetY: y,
    then: 'none',
    side: 'left',
    play: 'hop',
    vy: 0,
    anchorX: 0,
    anchorY: 0,
    fallFrom: y,
    strollUntil: 0,
    restUntil: 0,
    home: null,
  };
}

/** 펫 크기가 바뀌었을 때 발 위치(아래쪽 가운데)를 유지하도록 좌표를 옮긴다. */
export function resize(s: BehaviorState, from: number, to: number): BehaviorState {
  if (from === to) return s;
  const dx = (to - from) / 2;
  const dy = to - from;
  return { ...s, x: s.x - dx, y: s.y - dy, targetX: s.targetX - dx, targetY: s.targetY - dy };
}

// ---- 영역 도우미 ----

function areaAt(areas: readonly Rect[], cx: number, cy: number): Rect | undefined {
  const inside = areas.find((a) => cx >= a.x && cx < a.x + a.width && cy >= a.y && cy < a.y + a.height);
  if (inside) return inside;
  let best: Rect | undefined;
  let bestDist = Infinity;
  for (const a of areas) {
    const d = Math.hypot(a.x + a.width / 2 - cx, a.y + a.height / 2 - cy);
    if (d < bestDist) {
      best = a;
      bestDist = d;
    }
  }
  return best;
}

function currentArea(s: BehaviorState, ctx: StepContext): Rect | undefined {
  return areaAt(ctx.areas, s.x + ctx.size / 2, s.y + ctx.size / 2);
}

/**
 * 모니터 하나를 골라 그 안에서 펫이 통째로 들어가는 임의의 위치를 돌려준다.
 * home 이 있으면 그 점 둘레 안(모니터와 겹치는 부분)에서만 고른다.
 */
export function pickSpot(
  areas: readonly Rect[],
  size: number,
  rng: () => number,
  home: BehaviorState['home'] = null,
): { x: number; y: number } | null {
  const pool = home ? areas.filter((a) => areaContains(a, home.x, home.y)) : areas;
  const list = pool.length > 0 ? pool : areas;
  const area = list[Math.min(list.length - 1, Math.floor(rng() * list.length))];
  if (!area) return null;
  let minX = area.x;
  let maxX = area.x + Math.max(0, area.width - size);
  let minY = area.y;
  let maxY = area.y + Math.max(0, area.height - size);
  if (home) {
    // 펫 그림의 왼쪽 위 모서리가 home 중심에서 radius 안(그림이 통째로 들어가게)에 오도록 좁힌다.
    minX = Math.min(maxX, Math.max(minX, home.x - home.radius));
    maxX = Math.max(minX, Math.min(maxX, home.x + home.radius - size));
    minY = Math.min(maxY, Math.max(minY, home.y - home.radius));
    maxY = Math.max(minY, Math.min(maxY, home.y + home.radius - size));
  }
  return { x: minX + Math.round(rng() * (maxX - minX)), y: minY + Math.round(rng() * (maxY - minY)) };
}

const areaContains = (a: Rect, x: number, y: number): boolean => x >= a.x && x < a.x + a.width && y >= a.y && y < a.y + a.height;

// ---- 상태 전환 도우미 ----

function toIdle(s: BehaviorState, ctx: StepContext, minMs: number, maxMs: number, dir?: Dir): BehaviorState {
  return {
    ...s,
    mode: 'idle',
    surface: 'floor',
    dir: dir ?? horizontal(s.dir),
    since: ctx.now,
    until: ctx.now + rand(ctx.rng, minMs, maxMs),
    then: 'none',
    vy: 0,
  };
}

function startTravel(
  s: BehaviorState,
  ctx: StepContext,
  mode: 'walk' | 'run',
  tx: number,
  ty: number,
  then: Then,
  side: Side = s.side,
): BehaviorState {
  return {
    ...s,
    mode,
    surface: 'floor',
    dir: tx >= s.x ? 'right' : 'left',
    since: ctx.now,
    targetX: tx,
    targetY: ty,
    then,
    side,
  };
}

function startPlay(s: BehaviorState, ctx: StepContext, kind: PlayKind): BehaviorState {
  return { ...s, mode: 'play', play: kind, surface: 'floor', dir: horizontal(s.dir), since: ctx.now, until: ctx.now + PLAY_MS[kind] };
}

function randomPlay(rng: () => number, egg: boolean): PlayKind {
  if (egg) return 'hop';
  const r = rng();
  return r < 0.4 ? 'hop' : r < 0.75 ? 'roll' : 'look';
}

function startRoute(s: BehaviorState, ctx: StepContext, mode: 'walk' | 'run'): BehaviorState {
  const spot = pickSpot(ctx.areas, ctx.size, ctx.rng, s.home);
  return spot ? startTravel(s, ctx, mode, spot.x, spot.y, 'none') : toIdle(s, ctx, 2_000, 4_000);
}

/** 벽 쪽으로 걸어가서, 닿으면 기어오른다. */
function startWallRoute(s: BehaviorState, ctx: StepContext): BehaviorState {
  // 혼자 놀게 두는 동안에는 멀리 있는 벽까지 가지 않는다.
  if (s.home) return toIdle(s, ctx, 2_000, 4_000);
  const area = ctx.areas[Math.min(ctx.areas.length - 1, Math.floor(ctx.rng() * ctx.areas.length))];
  if (!area) return toIdle(s, ctx, 2_000, 4_000);
  const side: Side = ctx.rng() < 0.5 ? 'left' : 'right';
  // 고른 모니터의 왼쪽 또는 오른쪽 가장자리의 임의의 높이로 간다.
  const wallX = side === 'left' ? area.x : area.x + area.width - ctx.size;
  const wallY = area.y + Math.round(ctx.rng() * Math.max(0, area.height - ctx.size));
  return startTravel(s, ctx, 'walk', wallX, wallY, 'climb', side);
}

function startClimb(s: BehaviorState, ctx: StepContext): BehaviorState {
  const area = currentArea(s, ctx);
  if (!area) return toIdle(s, ctx, 1_000, 2_000);
  const top = area.y;
  const bottom = area.y + area.height - ctx.size;
  let ty = top + ctx.rng() * Math.max(0, bottom - top);
  if (Math.abs(ty - s.y) < 60) ty = s.y - top > (bottom - top) / 2 ? top : bottom;
  const wallX = s.side === 'left' ? area.x : area.x + area.width - ctx.size;
  return {
    ...s,
    x: wallX,
    surface: s.side === 'left' ? 'wallL' : 'wallR',
    dir: ty < s.y ? 'up' : 'down',
    mode: 'climb',
    since: ctx.now,
    targetY: ty,
    then: 'none',
  };
}

// ---- 외부에서 부르는 전환 ----

/** 사용자가 펫을 집었다. */
export function carry(s: BehaviorState, now: number): BehaviorState {
  return { ...s, mode: 'carried', surface: 'floor', dir: horizontal(s.dir), since: now, then: 'none', vy: 0 };
}

/** 사용자가 펫을 놓았다. 중력으로 떨어진다. */
export function drop(s: BehaviorState, now: number): BehaviorState {
  return { ...s, mode: 'fall', surface: 'floor', since: now, vy: 0, fallFrom: s.y };
}

/** 자거나 조는 펫을 깨운다. */
export function wake(s: BehaviorState, now: number): BehaviorState {
  if (s.mode !== 'sleep' && s.mode !== 'doze') return s;
  return { ...s, mode: 'idle', since: now, until: now + 1_500 };
}

/** 점 (x, y) 에 펫이 통째로 들어가도록 가장 가까운 모니터 안으로 옮긴다. */
export function clampToAreas(
  x: number,
  y: number,
  size: number,
  areas: readonly Rect[],
): { x: number; y: number } {
  const area = areaAt(areas, x + size / 2, y + size / 2);
  if (!area) return { x, y };
  return {
    x: Math.min(Math.max(x, area.x), area.x + Math.max(0, area.width - size)),
    y: Math.min(Math.max(y, area.y), area.y + Math.max(0, area.height - size)),
  };
}

/** 검사하러 갈 수 있는 상태인지: 알이 아니고, 자거나 벽을 타거나 다른 일을 하는 중이 아니어야 한다. */
export function canInspect(s: BehaviorState, stage: Stage): boolean {
  if (stage === 'egg' || s.then !== 'none') return false;
  return s.mode === 'idle' || s.mode === 'walk' || s.mode === 'run' || s.mode === 'play' || s.mode === 'sit';
}

/** 지금 하는 동작이 끝나기 전에는 새 돌봄(쓰다듬기·밥·놀기·씻기)을 받지 않는다. */
const BUSY: readonly Mode[] = ['happy', 'eat', 'play', 'wash', 'poop', 'dizzy'];
export function isOccupied(s: BehaviorState, now: number): boolean {
  return BUSY.includes(s.mode) && now < s.until;
}

/** 산책을 시작한다: 정해진 시간 동안 마우스를 따라다닌다. 쉬는 중이거나 이미 산책 중이면 그대로. */
export function startStroll(s: BehaviorState, ctx: StepContext): BehaviorState {
  if (ctx.stage === 'egg' || s.strollUntil > ctx.now || ctx.now < s.restUntil) return s;
  if (s.mode === 'carried' || s.mode === 'fall' || s.mode === 'dizzy' || s.then !== 'none') return s;
  return {
    ...s,
    mode: 'idle',
    surface: 'floor',
    since: ctx.now,
    until: ctx.now,
    then: 'none',
    strollUntil: ctx.now + rand(ctx.rng, STROLL_MS.min, STROLL_MS.max),
  };
}

/** 산책 중에 응가를 한다(웅크려서 잠시 멈춘다). */
export function startPoop(s: BehaviorState, now: number): BehaviorState {
  return { ...s, mode: 'poop', surface: 'floor', since: now, until: now + POOP_MS, then: 'none' };
}

/** 씻는다. 하던 일이 끊겨도 되는 상태일 때만 시작한다. */
export function startWash(s: BehaviorState, now: number): BehaviorState {
  if (!REACTABLE.includes(s.mode) || s.then !== 'none') return s;
  return { ...s, mode: 'wash', surface: 'floor', dir: horizontal(s.dir), since: now, until: now + WASH_MS, then: 'none' };
}

/** 혼자 놀게 두기 반경(px) */
export const HOME_RADIUS = 220;

/** 혼자 놀게 둔다: (x, y) 근방에서만 행동하게 한다. */
export function setHome(s: BehaviorState, x: number, y: number): BehaviorState {
  return { ...s, home: { x, y, radius: HOME_RADIUS } };
}

/** 혼자 놀게 두기를 풀고 다시 자유롭게 돌아다니게 한다. */
export function clearHome(s: BehaviorState): BehaviorState {
  return { ...s, home: null };
}

/** 펫이 home 범위 밖에 있는지(펫 중심 기준) */
function outsideHome(s: BehaviorState, size: number): boolean {
  if (!s.home) return false;
  return Math.hypot(s.x + size / 2 - s.home.x, s.y + size / 2 - s.home.y) > s.home.radius;
}

/** 산책 중인지 */
export const isStrolling = (s: BehaviorState, now: number): boolean => s.strollUntil > now;

/** 반응 동작이 이어지는 시간(ms) */
export const REACT_MS = { happy: 1_600, eat: 2_400 } as const;
const REACTABLE: readonly Mode[] = ['idle', 'walk', 'run', 'doze', 'sleep', 'sit', 'play', 'happy', 'eat'];

/**
 * 사용자의 손길에 반응한다: 쓰다듬으면 좋아하고(happy), 밥을 주면 먹는다(eat).
 * 벽을 타거나 매달리거나 문제를 알리러 가는 중처럼 끊으면 안 되는 동작은 그대로 둔다.
 */
export function react(s: BehaviorState, kind: 'happy' | 'eat', now: number): BehaviorState {
  if (!REACTABLE.includes(s.mode) || s.then !== 'none') return s;
  return { ...s, mode: kind, surface: 'floor', dir: horizontal(s.dir), since: now, until: now + REACT_MS[kind], then: 'none' };
}

/** 문제 자리로 달려가서, 도착하면 알림(alert) 상태로 기다린다. */
export function goInspect(s: BehaviorState, ctx: StepContext, x: number, y: number): BehaviorState {
  return startTravel(s, ctx, 'run', x, y, 'alert');
}

/** 알림을 끝내고 가만히 선다(확인했거나 나중에 보기로 했을 때). */
export function endAlert(s: BehaviorState, now: number): BehaviorState {
  return { ...s, mode: 'idle', surface: 'floor', since: now, until: now + 2_000, then: 'none' };
}

export type Trigger = 'sleep' | 'run' | 'climb' | 'play';

/** 메뉴에서 특정 동작을 바로 시켜 본다(알은 아무것도 하지 않는다). */
export function trigger(s: BehaviorState, what: Trigger, ctx: StepContext): BehaviorState {
  if (ctx.stage === 'egg') return s;
  switch (what) {
    case 'sleep':
      return { ...s, mode: 'sleep', surface: 'floor', dir: horizontal(s.dir), since: ctx.now, until: ctx.now + rand(ctx.rng, 15_000, 30_000), then: 'none' };
    case 'run':
      return startRoute(s, ctx, 'run');
    case 'climb':
      return startWallRoute(s, ctx);
    case 'play':
      return startPlay(s, ctx, randomPlay(ctx.rng, false));
  }
}

// ---- 한 틱 진행 ----

const HANGABLE: readonly Mode[] = ['idle', 'walk', 'run', 'doze', 'play', 'sit'];

export function step(s: BehaviorState, ctx: StepContext): BehaviorState {
  if (s.mode === 'carried') return s;

  // 산책 중이면 마우스를 따라다닌다(끝나면 지쳐서 쉰다).
  if (s.strollUntil > 0) {
    const walked = stepStroll(s, ctx);
    if (walked) return walked;
  }

  // 마우스를 한참 가만히 두면 매달리러 간다(알은 제외).
  // 문제를 알리러 가는 중이면 방해하지 않는다: 화면을 읽느라 마우스를 안 움직이는 때가 많기 때문이다.
  if (
    ctx.stage !== 'egg' &&
    ctx.cursorIdleMs >= HANG_AFTER_MS &&
    ctx.now >= s.restUntil &&
    s.strollUntil === 0 &&
    (!s.home || Math.hypot(ctx.cursor.x - s.home.x, ctx.cursor.y - s.home.y) <= s.home.radius + ctx.size) &&
    HANGABLE.includes(s.mode) &&
    s.then !== 'hang' &&
    s.then !== 'alert'
  ) {
    return startTravel(s, ctx, 'run', ctx.cursor.x - ctx.size / 2, ctx.cursor.y, 'hang');
  }

  switch (s.mode) {
    case 'idle':
      return stepIdle(s, ctx);
    case 'walk':
    case 'run':
      return stepTravel(s, ctx);
    case 'doze':
      if (ctx.now < s.until) return s;
      return ctx.rng() < 0.7
        ? { ...s, mode: 'sleep', since: ctx.now, until: ctx.now + rand(ctx.rng, 15_000, 40_000) }
        : toIdle(s, ctx, 1_000, 3_000);
    case 'sleep':
      return ctx.now < s.until ? s : toIdle(s, ctx, 1_000, 3_000);
    case 'climb':
      return stepClimb(s, ctx);
    case 'slip':
      return stepSlip(s, ctx);
    case 'play':
      return stepPlay(s, ctx);
    case 'hang':
      return stepHang(s, ctx);
    case 'fall':
      return stepFall(s, ctx);
    case 'alert':
      return ctx.now < s.until ? s : toIdle(s, ctx, 1_000, 3_000);
    case 'sit':
      if (ctx.now < s.until) return s;
      // 한참 앉아 있다가 졸기도 한다
      return ctx.rng() < 0.4
        ? { ...s, mode: 'doze', since: ctx.now, until: ctx.now + rand(ctx.rng, 3_000, 7_000) }
        : toIdle(s, ctx, 1_000, 3_000);
    case 'happy':
    case 'eat':
    case 'wash':
    case 'poop':
    case 'dizzy':
      return ctx.now < s.until ? s : toIdle(s, ctx, 1_000, 3_000);
    default:
      return s;
  }
}

/**
 * 산책 한 틱. 끝났으면 지쳐서 쉬는 상태로 바꾸고, 따라갈 수 없는 상태(떨어지는 중·반응 중·문제 알리러 가는 중 등)면 null 을 돌려
 * 평소 규칙이 처리하게 한다.
 */
function stepStroll(s: BehaviorState, ctx: StepContext): BehaviorState | null {
  if (ctx.now >= s.strollUntil) {
    return { ...s, strollUntil: 0, restUntil: ctx.now + REST_MS, mode: 'sit', surface: 'floor', since: ctx.now, until: ctx.now + 8_000, then: 'none' };
  }
  const FOLLOWING: readonly Mode[] = ['idle', 'walk', 'run', 'sit', 'doze', 'sleep'];
  if (!FOLLOWING.includes(s.mode) || s.then !== 'none') return null;
  const left = ctx.cursor.x >= s.x + ctx.size / 2; // 마우스가 오른쪽에 있으면 그 왼쪽에, 아니면 오른쪽에 선다
  const tx = ctx.cursor.x - ctx.size / 2 + (left ? -1 : 1) * ctx.size * FOLLOW_GAP;
  const ty = ctx.cursor.y - ctx.size / 2;
  const target = clampToAreas(tx, ty, ctx.size, ctx.areas);
  const dx = target.x - s.x;
  const dy = target.y - s.y;
  const dist = Math.hypot(dx, dy);
  const facing: Dir = ctx.cursor.x >= s.x + ctx.size / 2 ? 'right' : 'left';
  if (dist <= ctx.size * 0.35) return { ...s, mode: 'idle', surface: 'floor', dir: facing, since: s.mode === 'idle' ? s.since : ctx.now, until: ctx.now + 400 };
  const mode = dist > ctx.size * 4 ? 'run' : 'walk';
  const stepPx = Math.min(dist, (SPEED[mode] * ctx.dtMs) / 1000);
  return {
    ...s,
    mode,
    surface: 'floor',
    dir: Math.abs(dx) > 1 ? (dx > 0 ? 'right' : 'left') : facing,
    since: s.mode === mode ? s.since : ctx.now,
    x: s.x + (dx / dist) * stepPx,
    y: s.y + (dy / dist) * stepPx,
  };
}

function stepIdle(s: BehaviorState, ctx: StepContext): BehaviorState {
  if (ctx.now < s.until) return s;
  // 혼자 놀게 두는 중인데 범위 밖으로 나와 있으면(떨어졌거나 산책했거나) 먼저 돌아온다.
  if (ctx.stage !== 'egg' && outsideHome(s, ctx.size)) {
    const back = pickSpot(ctx.areas, ctx.size, ctx.rng, s.home);
    if (back) return startTravel(s, ctx, 'walk', back.x, back.y, 'none');
  }
  const r = ctx.rng();
  if (ctx.stage === 'egg') {
    if (r < 0.6) return startRoute(s, ctx, 'walk');
    if (r < 0.8) return startPlay(s, ctx, 'hop');
    return toIdle(s, ctx, 2_000, 6_000);
  }
  if (r < 0.3) return startRoute(s, ctx, 'walk');
  if (r < 0.4) return startRoute(s, ctx, 'run');
  if (r < 0.5) return { ...s, mode: 'sit', surface: 'floor', since: ctx.now, until: ctx.now + rand(ctx.rng, 4_000, 9_000) };
  if (r < 0.58) return { ...s, mode: 'doze', surface: 'floor', since: ctx.now, until: ctx.now + rand(ctx.rng, 3_000, 7_000) };
  if (r < 0.72) return startPlay(s, ctx, randomPlay(ctx.rng, false));
  if (r < 0.85) return startWallRoute(s, ctx);
  return toIdle(s, ctx, 2_000, 6_000);
}

function stepTravel(s: BehaviorState, ctx: StepContext): BehaviorState {
  let { targetX, targetY } = s;
  if (s.then === 'hang') {
    // 마우스가 다시 움직이면 포기한다. 아니면 마우스 위치를 계속 따라간다.
    if (ctx.cursorIdleMs < 1_000) return toIdle(s, ctx, 1_000, 2_500);
    targetX = ctx.cursor.x - ctx.size / 2;
    targetY = ctx.cursor.y;
  }
  const dx = targetX - s.x;
  const dy = targetY - s.y;
  const dist = Math.hypot(dx, dy);
  const stepPx = (SPEED[s.mode === 'run' ? 'run' : 'walk'] * ctx.dtMs) / 1000;

  if (dist <= stepPx) {
    const arrived = { ...s, x: targetX, y: targetY, targetX, targetY };
    if (s.then === 'climb') return startClimb(arrived, ctx);
    if (s.then === 'alert') {
      return { ...arrived, mode: 'alert', surface: 'floor', since: ctx.now, until: ctx.now + ALERT_MS, then: 'none' };
    }
    if (s.then === 'hang') {
      return { ...arrived, mode: 'hang', surface: 'floor', since: ctx.now, then: 'none', anchorX: ctx.cursor.x, anchorY: ctx.cursor.y };
    }
    return toIdle(arrived, ctx, 2_000, 8_000);
  }
  return {
    ...s,
    x: s.x + (dx / dist) * stepPx,
    y: s.y + (dy / dist) * stepPx,
    targetX,
    targetY,
    dir: Math.abs(dx) > 1 ? (dx > 0 ? 'right' : 'left') : s.dir,
  };
}

function inwardDir(side: Side): Dir {
  return side === 'left' ? 'right' : 'left';
}

function stepClimb(s: BehaviorState, ctx: StepContext): BehaviorState {
  const dy = s.targetY - s.y;
  const stepPx = (SPEED.climb * ctx.dtMs) / 1000;
  if (Math.abs(dy) <= stepPx) return toIdle({ ...s, y: s.targetY }, ctx, 1_000, 3_000, inwardDir(s.side));
  if (ctx.rng() < (SLIP_PER_SEC * ctx.dtMs) / 1000) {
    return { ...s, mode: 'slip', dir: 'down', since: ctx.now, until: ctx.now + rand(ctx.rng, 700, 1_400) };
  }
  return { ...s, y: s.y + Math.sign(dy) * stepPx, dir: dy < 0 ? 'up' : 'down' };
}

function stepSlip(s: BehaviorState, ctx: StepContext): BehaviorState {
  const area = currentArea(s, ctx);
  const bottom = area ? area.y + area.height - ctx.size : s.y;
  const y = Math.min(bottom, s.y + (SPEED.slip * ctx.dtMs) / 1000);
  if (y >= bottom) return toIdle({ ...s, y }, ctx, 1_000, 3_000, inwardDir(s.side));
  if (ctx.now >= s.until) {
    return { ...s, y, mode: 'climb', since: ctx.now, dir: s.targetY < y ? 'up' : 'down' };
  }
  return { ...s, y };
}

function stepPlay(s: BehaviorState, ctx: StepContext): BehaviorState {
  if (ctx.now >= s.until) return toIdle(s, ctx, 800, 2_500);
  if (s.play !== 'roll') return s;
  const area = currentArea(s, ctx);
  const dirSign = s.dir === 'left' ? -1 : 1;
  let x = s.x + (dirSign * SPEED.roll * ctx.dtMs) / 1000;
  if (area) x = Math.min(Math.max(x, area.x), area.x + area.width - ctx.size);
  return { ...s, x };
}

function stepHang(s: BehaviorState, ctx: StepContext): BehaviorState {
  if (Math.hypot(ctx.cursor.x - s.anchorX, ctx.cursor.y - s.anchorY) > HANG_RELEASE_PX) {
    return { ...s, mode: 'fall', since: ctx.now, vy: 0, fallFrom: s.y };
  }
  return { ...s, x: s.anchorX - ctx.size / 2, y: s.anchorY };
}

function stepFall(s: BehaviorState, ctx: StepContext): BehaviorState {
  const area = currentArea(s, ctx);
  if (!area) return toIdle(s, ctx, 1_000, 2_500);
  const ground = area.y + area.height - ctx.size;
  const vy = s.vy + (GRAVITY * ctx.dtMs) / 1000;
  const y = s.y + (vy * ctx.dtMs) / 1000;
  if (y >= ground) {
    // 높은 데서 떨어졌으면 기절해서 헤롱헤롱한다.
    if (ground - s.fallFrom >= FAINT_FALL_PX) {
      return { ...s, y: ground, vy: 0, mode: 'dizzy', surface: 'floor', since: ctx.now, until: ctx.now + DIZZY_MS, then: 'none' };
    }
    return toIdle({ ...s, y: ground }, ctx, 1_000, 2_500);
  }
  return { ...s, y, vy };
}

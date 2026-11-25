import { describe, expect, it } from 'vitest';
import { HOP_HEIGHT, HOP_MS, resolvePose, type MotionView } from './animation.js';

const view = (over: Partial<MotionView> = {}): MotionView => ({
  mode: 'idle',
  surface: 'floor',
  dir: 'right',
  play: 'hop',
  since: 0,
  ...over,
});

const frames = (v: MotionView, times: number[]): string[] => times.map((t) => resolvePose(v, t).frame);

describe('resolvePose: 걷기·쉬기', () => {
  it('가만히 있으면 서서 숨을 쉬고(두 프레임), 몇 초에 한 번 눈을 깜빡인다', () => {
    expect(frames(view(), [0, 650, 1300])).toEqual(['idleA', 'idleB', 'idleA']);
    expect(resolvePose(view(), 1_000)).toMatchObject({ eyesClosed: false, zzz: false, alert: false, hearts: false, food: false });
    expect(resolvePose(view(), 3_600 + 50).eyesClosed).toBe(true);
    expect(resolvePose(view(), 3_600 + 140).eyesClosed).toBe(false);
  });

  it('왼쪽으로 가면 뒤집어서 그린다', () => {
    expect(resolvePose(view({ dir: 'left' }), 0).orientation).toEqual({ flip: true, quarter: 0 });
    expect(resolvePose(view({ dir: 'right' }), 0).orientation).toEqual({ flip: false, quarter: 0 });
  });

  it('걸을 땐 4프레임 사이클을 120ms 마다 돌린다', () => {
    expect(frames(view({ mode: 'walk' }), [0, 120, 240, 360, 480])).toEqual(['walk1', 'walk2', 'walk3', 'walk4', 'walk1']);
  });

  it('뛸 땐 4프레임 사이클을 70ms 마다 돌려서 걷기보다 빠르다', () => {
    expect(frames(view({ mode: 'run' }), [0, 70, 140, 210, 280])).toEqual(['run1', 'run2', 'run3', 'run4', 'run1']);
  });

  it('앉으면 꼬리를 흔드는 두 프레임을 번갈아 쓴다', () => {
    expect(frames(view({ mode: 'sit' }), [0, 500, 1_000])).toEqual(['sitA', 'sitB', 'sitA']);
    expect(resolvePose(view({ mode: 'sit' }), 100).zzz).toBe(false);
  });

  it('졸 때는 앉아서 꾸벅꾸벅 하며 z 를 띄운다', () => {
    const a = resolvePose(view({ mode: 'doze' }), 0);
    const b = resolvePose(view({ mode: 'doze' }), 900);
    expect([a.frame, b.frame]).toEqual(['dozeA', 'dozeB']);
    expect(a.zzz && b.zzz).toBe(true);
  });

  it('잘 때는 엎드린 두 프레임을 숨 쉬듯 번갈아 쓰며 z 를 띄운다', () => {
    const p = [0, 1_100].map((t) => resolvePose(view({ mode: 'sleep' }), t));
    expect(p.map((x) => x.frame)).toEqual(['sleepA', 'sleepB']);
    expect(p.every((x) => x.zzz)).toBe(true);
  });
});

describe('resolvePose: 벽·매달리기·떨어지기', () => {
  it('왼쪽 벽을 오르면 발이 벽에 닿도록 돌려서 그린다', () => {
    const p = resolvePose(view({ mode: 'climb', surface: 'wallL', dir: 'up' }), 0);
    expect(p.orientation).toEqual({ flip: true, quarter: 1 });
    expect(frames(view({ mode: 'climb', surface: 'wallL', dir: 'up' }), [0, 180])).toEqual(['climbA', 'climbB']);
  });

  it('미끄러질 땐 팔다리를 휘저으며 좌우로 떨린다', () => {
    const v = view({ mode: 'slip', surface: 'wallR', dir: 'down' });
    const a = resolvePose(v, 0);
    const b = resolvePose(v, 70);
    expect(a.frame).not.toBe(b.frame);
    expect(a.dx).toBe(-b.dx);
    expect(a.orientation).toEqual({ flip: true, quarter: 3 });
  });

  it('매달리면 정면 그림을 쓰고 흔들린다', () => {
    const p = resolvePose(view({ mode: 'hang' }), 0);
    expect(['hangA', 'hangB']).toContain(p.frame);
    expect(p.orientation).toEqual({ flip: false, quarter: 0 });
    expect(Math.abs(p.dx)).toBeLessThanOrEqual(1);
  });

  it('집혀 있을 땐 매달린 그림을 빠르게 바꿔 버둥거린다', () => {
    expect(frames(view({ mode: 'carried' }), [0, 120])).toEqual(['hangB', 'hangA']);
  });

  it('떨어질 땐 허둥지둥하는 전용 그림이다', () => {
    expect(resolvePose(view({ mode: 'fall' }), 0).frame).toBe('fall');
  });
});

describe('resolvePose: 반응(알림·좋아하기·먹기)', () => {
  it('문제를 찾아 알릴 땐 눈이 커지고 통통 뛰며 느낌표를 띄운다', () => {
    expect(frames(view({ mode: 'alert' }), [0, 300])).toEqual(['alertA', 'alertB']);
    expect(resolvePose(view({ mode: 'alert' }), 0).alert).toBe(true);
    expect(resolvePose(view({ mode: 'idle' }), 0).alert).toBe(false);
  });

  it('쓰다듬으면 좋아하는 두 프레임을 빠르게 번갈아 쓰며 하트를 띄운다', () => {
    expect(frames(view({ mode: 'happy' }), [0, 180])).toEqual(['happyA', 'happyB']);
    expect(resolvePose(view({ mode: 'happy' }), 0).hearts).toBe(true);
  });

  it('밥을 먹을 땐 오물오물 하며 먹이를 놓는다', () => {
    expect(frames(view({ mode: 'eat' }), [0, 240])).toEqual(['eatA', 'eatB']);
    expect(resolvePose(view({ mode: 'eat' }), 0).food).toBe(true);
  });
});

describe('resolvePose: 놀기', () => {
  const hop = (age: number) => resolvePose(view({ mode: 'play', play: 'hop', since: 5_000 }), 5_000 + age);

  it('hop: 웅크림 → 도약 → 정점 → 하강 → 착지 순서로 한 번 뛴다', () => {
    expect([0, 250, 450, 650, 850].map((a) => hop(a).frame)).toEqual(['jumpCrouch', 'jumpUp', 'jumpPeak', 'jumpDown', 'jumpCrouch']);
  });

  it('hop: 땅에서 출발해 정점에서 가장 높고 다시 땅으로 돌아온다(포물선)', () => {
    expect(hop(0).dy).toBe(0);
    expect(hop(HOP_MS * 0.5).dy).toBe(-HOP_HEIGHT);
    expect(hop(HOP_MS * 0.5).dy).toBeLessThan(hop(HOP_MS * 0.3).dy);
    expect(hop(HOP_MS * 0.85).dy).toBe(0);
    expect(hop(HOP_MS).dy).toBe(0); // 다음 뛰기 시작
  });

  it('roll: 공처럼 만 몸이 200ms 마다 90도씩 돌아 한 바퀴를 구른다', () => {
    const q = (age: number) => resolvePose(view({ mode: 'play', play: 'roll', since: 0 }), age);
    expect([0, 200, 400, 600, 800].map((a) => q(a).orientation.quarter)).toEqual([0, 1, 2, 3, 0]);
    expect(q(0).frame).toBe('curl');
  });

  it('look: 600ms 마다 좌우를 번갈아 본다', () => {
    const flip = (age: number) =>
      resolvePose(view({ mode: 'play', play: 'look', dir: 'right', since: 0 }), age).orientation.flip;
    expect([0, 600, 1_200].map(flip)).toEqual([false, true, false]);
  });
});

import { describe, expect, it } from 'vitest';
import { resolvePose, type MotionView } from './animation.js';

const view = (over: Partial<MotionView> = {}): MotionView => ({
  mode: 'idle',
  surface: 'floor',
  dir: 'right',
  play: 'hop',
  since: 0,
  ...over,
});

describe('resolvePose', () => {
  it('가만히 있으면 서 있고, 몇 초에 한 번 눈을 깜빡인다', () => {
    expect(resolvePose(view(), 1_000)).toMatchObject({ frame: 'stand', eyesClosed: false, zzz: false });
    expect(resolvePose(view(), 3_200 + 50).eyesClosed).toBe(true);
    expect(resolvePose(view(), 3_200 + 140).eyesClosed).toBe(false);
  });

  it('왼쪽으로 가면 뒤집어서 그린다', () => {
    expect(resolvePose(view({ dir: 'left' }), 0).orientation).toEqual({ flip: true, quarter: 0 });
    expect(resolvePose(view({ dir: 'right' }), 0).orientation).toEqual({ flip: false, quarter: 0 });
  });

  it('걸을 땐 걷기 프레임을 돌려 쓰고, 다리 든 프레임 사이에는 한 칸 뜬다', () => {
    const frames = [0, 140, 280, 420].map((t) => resolvePose(view({ mode: 'walk' }), t).frame);
    expect(frames).toEqual(['walkA', 'stand', 'walkB', 'stand']);
    expect(resolvePose(view({ mode: 'walk' }), 140).dy).toBe(-1);
    expect(resolvePose(view({ mode: 'walk' }), 0).dy).toBe(0);
  });

  it('뛸 때는 뛰기 프레임 둘을 빠르게 번갈아 쓴다', () => {
    const frames = [0, 90, 180].map((t) => resolvePose(view({ mode: 'run' }), t).frame);
    expect(frames).toEqual(['runA', 'runB', 'runA']);
  });

  it('졸 때는 서서 고개를 끄덕이며 z 를 띄운다', () => {
    const a = resolvePose(view({ mode: 'doze' }), 0);
    const b = resolvePose(view({ mode: 'doze' }), 700);
    expect(a).toMatchObject({ frame: 'stand', zzz: true, eyesClosed: true });
    expect(a.dy).not.toBe(b.dy);
    expect(resolvePose(view({ mode: 'doze' }), 1_200).eyesClosed).toBe(false);
  });

  it('잘 때는 엎드린 두 프레임을 번갈아 쓰며 z 를 띄운다', () => {
    const frames = [0, 900].map((t) => resolvePose(view({ mode: 'sleep' }), t));
    expect(frames.map((p) => p.frame)).toEqual(['sleepA', 'sleepB']);
    expect(frames.every((p) => p.zzz)).toBe(true);
  });

  it('왼쪽 벽을 오르면 발이 벽에 닿도록 돌려서 그린다', () => {
    const p = resolvePose(view({ mode: 'climb', surface: 'wallL', dir: 'up' }), 0);
    expect(p.orientation).toEqual({ flip: true, quarter: 1 });
    expect(['walkA', 'stand', 'walkB']).toContain(p.frame);
  });

  it('미끄러질 땐 빠르게 다리를 휘저으며 좌우로 떨린다', () => {
    const a = resolvePose(view({ mode: 'slip', surface: 'wallR', dir: 'down' }), 0);
    const b = resolvePose(view({ mode: 'slip', surface: 'wallR', dir: 'down' }), 70);
    expect(a.frame).not.toBe(b.frame);
    expect(a.dx).toBe(-b.dx);
    expect(a.orientation).toEqual({ flip: true, quarter: 3 });
  });

  it('매달리면 정면 그림을 쓰고 마우스를 잡은 채 흔들린다', () => {
    const p = resolvePose(view({ mode: 'hang' }), 0);
    expect(['hangA', 'hangB']).toContain(p.frame);
    expect(p.orientation).toEqual({ flip: false, quarter: 0 });
    expect(Math.abs(p.dx)).toBeLessThanOrEqual(1);
  });

  it('집혀 있을 땐 매달린 그림을 빠르게 바꿔 버둥거린다', () => {
    const a = resolvePose(view({ mode: 'carried' }), 0).frame;
    const b = resolvePose(view({ mode: 'carried' }), 130).frame;
    expect(a).not.toBe(b);
  });

  it('떨어질 땐 다리를 벌린 뛰기 그림이다', () => {
    expect(resolvePose(view({ mode: 'fall' }), 0).frame).toBe('runB');
  });

  describe('놀기', () => {
    it('hop: 포물선으로 뛰어올랐다가 내려온다', () => {
      const p = (age: number) => resolvePose(view({ mode: 'play', play: 'hop', since: 1_000 }), 1_000 + age);
      expect(p(0)).toMatchObject({ frame: 'stand', dy: 0 });
      expect(p(300).dy).toBe(-5);
      expect(p(300).frame).toBe('runA');
      expect(p(600).dy).toBe(0); // 다음 뛰기 시작
    });

    it('roll: 400ms 마다 90도씩 돌아 한 바퀴를 구른다', () => {
      const q = (age: number) =>
        resolvePose(view({ mode: 'play', play: 'roll', since: 0 }), age).orientation.quarter;
      expect([0, 400, 800, 1_200, 1_600].map(q)).toEqual([0, 1, 2, 3, 0]);
    });

    it('look: 500ms 마다 좌우를 번갈아 본다', () => {
      const flip = (age: number) =>
        resolvePose(view({ mode: 'play', play: 'look', dir: 'right', since: 0 }), age).orientation.flip;
      expect([0, 500, 1_000].map(flip)).toEqual([false, true, false]);
    });
  });
});

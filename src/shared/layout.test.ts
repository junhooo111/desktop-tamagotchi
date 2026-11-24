import { describe, expect, it } from 'vitest';
import { BUBBLE_GAP, STAGE_SCALE, TIP_BUBBLE, WINDOW, bubbleShift, petPixelSize } from './layout.js';

describe('petPixelSize', () => {
  it('그림 16칸에 단계별 배율을 곱한다(커서 정도의 크기)', () => {
    expect(petPixelSize('egg')).toBe(16 * STAGE_SCALE.egg);
    expect(petPixelSize('baby')).toBe(32);
    expect(petPixelSize('adult')).toBe(48);
  });
});

describe('WINDOW', () => {
  it('가장 큰 말풍선(코드를 펼친 것)과 펫, 둘 사이 간격이 모두 들어간다', () => {
    expect(WINDOW.width).toBeGreaterThanOrEqual(TIP_BUBBLE.width);
    expect(WINDOW.height).toBeGreaterThanOrEqual(TIP_BUBBLE.maxHeight + BUBBLE_GAP + petPixelSize('adult'));
  });
});

describe('창 폭과 말풍선 밀기', () => {
  it('펫이 화면 맨 끝에 있어도, 안쪽으로 밀린 말풍선이 창 안에 들어간다', () => {
    const room = (WINDOW.width - TIP_BUBBLE.width) / 2; // 말풍선이 창 안에서 좌우로 움직일 수 있는 거리
    for (const stage of ['egg', 'baby', 'adult'] as const) {
      const half = petPixelSize(stage) / 2;
      expect(Math.abs(bubbleShift(half, TIP_BUBBLE.width, 0, 1920))).toBeLessThanOrEqual(room); // 왼쪽 끝
      expect(Math.abs(bubbleShift(1920 - half, TIP_BUBBLE.width, 0, 1920))).toBeLessThanOrEqual(room); // 오른쪽 끝
    }
  });
});

describe('bubbleShift', () => {
  const left = 0;
  const right = 1920;

  it('화면 안이면 밀지 않는다', () => {
    expect(bubbleShift(960, 240, left, right)).toBe(0);
    expect(bubbleShift(120, 240, left, right)).toBe(0); // 정확히 왼쪽 끝에 맞닿음
  });

  it('왼쪽으로 잘리면 오른쪽으로, 오른쪽으로 잘리면 왼쪽으로 민다', () => {
    expect(bubbleShift(30, 240, left, right)).toBe(90);
    expect(bubbleShift(1900, 240, left, right)).toBe(-100);
  });

  it('왼쪽 모니터처럼 좌표가 음수인 영역도 다룬다', () => {
    expect(bubbleShift(-1900, 240, -1920, 0)).toBe(100);
    expect(bubbleShift(-10, 240, -1920, 0)).toBe(-110);
  });

  it('말풍선이 화면보다 넓으면 밀지 않는다', () => {
    expect(bubbleShift(100, 240, 0, 200)).toBe(0);
  });
});

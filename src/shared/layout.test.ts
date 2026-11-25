import { describe, expect, it } from 'vitest';
import { BUBBLE_GAP, STAGE_SCALE, TIP_BUBBLE, WINDOW, bubbleShift, drawScale, petPixelSize } from './layout.js';
import { MAX_PET_SCALE } from './settings.js';

describe('petPixelSize', () => {
  it('그림 32칸에 단계별 배율을 곱한 정사각형 칸이다(모든 단계가 같은 칸을 쓰고, 마우스 커서 정도인 32px)', () => {
    expect(petPixelSize('egg')).toBe(32 * STAGE_SCALE.egg);
    expect(petPixelSize('baby')).toBe(32);
    expect(petPixelSize('adult')).toBe(32);
  });
});

describe('WINDOW', () => {
  it('가장 큰 말풍선(코드를 펼친 것)과 펫, 둘 사이 간격이 모두 들어간다', () => {
    expect(WINDOW.width).toBeGreaterThanOrEqual(TIP_BUBBLE.width);
    // 가장 크게 키운 펫(3배)이 있어도 가장 큰 말풍선이 들어간다
    expect(WINDOW.height).toBeGreaterThanOrEqual(TIP_BUBBLE.maxHeight + BUBBLE_GAP + petPixelSize('adult', MAX_PET_SCALE));
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

describe('펫 크기 배율', () => {
  it('설정 배율(1~3)만큼 펫 칸과 그림 한 칸이 커진다', () => {
    expect(petPixelSize('adult', 1)).toBe(32);
    expect(petPixelSize('adult', 2)).toBe(64);
    expect(petPixelSize('baby', 3)).toBe(96);
    expect(drawScale('adult', 2)).toBe(2);
    expect(drawScale('egg')).toBe(1);
  });

  it('허용 범위 밖의 값은 1~3 으로 잘라서 쓴다(창 밖으로 커지지 않게)', () => {
    expect(petPixelSize('adult', 0)).toBe(32);
    expect(petPixelSize('adult', 10)).toBe(32 * MAX_PET_SCALE);
    expect(drawScale('adult', -4)).toBe(1);
  });
});

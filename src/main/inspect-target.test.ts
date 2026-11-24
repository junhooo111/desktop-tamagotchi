import { describe, expect, it } from 'vitest';
import type { Finding } from '../inspect/scan.js';
import { petTargetFor } from './inspect-target.js';

const SIZE = 48;
const screen = { x: 0, y: 0, width: 1920, height: 1040 };
const page = { x: 100, y: 120, width: 1200, height: 700 };

const finding = (rect: Finding['rect']): Finding => ({
  key: 'k',
  ruleId: 'img-alt',
  url: 'http://localhost:5173/',
  selector: 'img',
  detail: '',
  rect,
  page,
});

describe('petTargetFor', () => {
  it('요소의 왼쪽 옆, 요소 아래 끝에 발을 맞춰 선다', () => {
    const t = petTargetFor(finding({ x: 400, y: 300, width: 200, height: 100 }), SIZE, [screen]);
    expect(t).toEqual({ x: 400 - SIZE - 6, y: 300 + 100 - SIZE });
  });

  it('브라우저 왼쪽 끝에 붙은 요소는 오른쪽 옆에 선다', () => {
    const t = petTargetFor(finding({ x: 110, y: 300, width: 200, height: 100 }), SIZE, [screen]);
    expect(t.x).toBe(110 + 200 + 6);
  });

  it('위치가 없는 문제(문서 설정)는 내용 영역 위쪽 가운데에 선다', () => {
    const t = petTargetFor(finding(null), SIZE, [screen]);
    expect(t).toEqual({ x: 100 + 600 - SIZE / 2, y: 120 + 700 * 0.15 });
  });

  it('모니터 밖으로 나가는 자리는 모니터 안으로 맞춘다', () => {
    const t = petTargetFor(finding({ x: 1900, y: 1030, width: 100, height: 100 }), SIZE, [screen]);
    expect(t.x + SIZE).toBeLessThanOrEqual(1920);
    expect(t.y + SIZE).toBeLessThanOrEqual(1040);
    const top = petTargetFor(finding({ x: 400, y: -20, width: 100, height: 10 }), SIZE, [screen]);
    expect(top.y).toBe(0);
  });

  it('모니터 정보가 없으면 계산한 그대로 돌려준다', () => {
    const t = petTargetFor(finding({ x: 400, y: 300, width: 200, height: 100 }), SIZE, []);
    expect(t).toEqual({ x: 346, y: 352 });
  });
});

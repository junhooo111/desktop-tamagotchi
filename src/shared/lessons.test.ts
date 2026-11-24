import { describe, expect, it } from 'vitest';
import { LESSONS, RULE_IDS } from './lessons.js';

describe('학습 카드', () => {
  it.each(RULE_IDS)('%s: 모든 항목이 채워져 있다', (id) => {
    const lesson = LESSONS[id];
    for (const field of ['title', 'bubble', 'problem', 'why', 'fix', 'code'] as const) {
      expect(lesson[field].trim().length, field).toBeGreaterThan(0);
    }
  });

  it('말풍선 한 줄은 짧아서 창 안에 들어간다', () => {
    for (const id of RULE_IDS) expect(LESSONS[id].bubble.length).toBeLessThanOrEqual(24);
  });

  it('규칙 id 가 겹치지 않는다', () => {
    expect(new Set(RULE_IDS).size).toBe(RULE_IDS.length);
  });
});

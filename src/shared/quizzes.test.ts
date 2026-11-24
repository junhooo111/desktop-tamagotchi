import { describe, expect, it } from 'vitest';
import { RULE_IDS } from './lessons.js';
import { QUIZZES } from './quizzes.js';

describe('확인 퀴즈', () => {
  it.each(RULE_IDS)('%s: 문제·보기 셋·정답·해설이 채워져 있다', (id) => {
    const quiz = QUIZZES[id];
    expect(quiz.question.trim().length).toBeGreaterThan(0);
    expect(quiz.explain.trim().length).toBeGreaterThan(0);
    expect(quiz.options).toHaveLength(3);
    expect(new Set(quiz.options).size).toBe(3);
    expect(quiz.options.every((o) => o.trim().length > 0)).toBe(true);
    expect([0, 1, 2]).toContain(quiz.answer);
  });

  it('정답 위치가 한쪽으로만 쏠려 있지 않다', () => {
    const counts = [0, 1, 2].map((n) => RULE_IDS.filter((id) => QUIZZES[id].answer === n).length);
    expect(Math.max(...counts)).toBeLessThanOrEqual(5);
    expect(Math.min(...counts)).toBeGreaterThanOrEqual(1);
  });
});

import { describe, expect, it } from 'vitest';
import { LESSONS, RULE_IDS } from './lessons.js';
import { QUIZZES } from './quizzes.js';
import { LESSONS_EN, QUIZZES_EN, lessonFor, quizFor } from './lessons-en.js';
import { noticeOf } from './notice.js';

const hangul = /[가-힣]/;

describe('검사 카드·퀴즈 영어', () => {
  it.each(RULE_IDS)('%s: 영어 카드와 퀴즈가 한글 없이 채워져 있다', (id) => {
    const l = LESSONS_EN[id];
    for (const k of ['title', 'bubble', 'problem', 'why', 'fix'] as const) {
      expect(l[k].trim(), `${id}.${k}`).not.toBe('');
      expect(l[k], `${id}.${k}`).not.toMatch(hangul);
    }
    expect(l.bubble.length, id + ' bubble').toBeLessThanOrEqual(40);
    const q = QUIZZES_EN[id];
    expect(q.options).toHaveLength(QUIZZES[id].options.length);
    for (const t of [q.question, q.explain, ...q.options]) expect(t, id).not.toMatch(hangul);
  });

  it('언어에 맞는 카드·퀴즈를 고르고, 코드와 정답 위치는 한국어 원본을 따른다', () => {
    expect(lessonFor('img-alt', 'ko').title).toBe(LESSONS['img-alt'].title);
    expect(lessonFor('img-alt', 'en').title).toBe(LESSONS_EN['img-alt'].title);
    expect(lessonFor('img-alt', 'en').code).toBe(LESSONS['img-alt'].code);
    expect(quizFor('img-alt', 'en').answer).toBe(QUIZZES['img-alt'].answer);
    expect(quizFor('img-alt', 'en').options[2]).toContain('alt=""');
  });

  it('검사 말풍선도 영어로 만든다', () => {
    const n = noticeOf({ ruleId: 'landmark-main', selector: 'document', detail: '' }, 'en');
    expect(n.title).toBe(LESSONS_EN['landmark-main'].bubble);
    expect(n.where).toBe('Whole page');
    expect(noticeOf({ ruleId: 'landmark-main', selector: 'document', detail: '' }).where).toBe('페이지 전체');
  });
});

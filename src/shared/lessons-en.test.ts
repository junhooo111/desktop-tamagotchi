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

  it('언어에 맞는 카드·퀴즈를 고르고, 정답 위치는 한국어 원본을 따른다', () => {
    expect(lessonFor('img-alt', 'ko').title).toBe(LESSONS['img-alt'].title);
    expect(lessonFor('img-alt', 'en').title).toBe(LESSONS_EN['img-alt'].title);
    expect(lessonFor('img-alt', 'en').code).toContain('Five teammates'); // 영어 모드는 영어 코드 예시
    expect(lessonFor('img-alt', 'ko').code).toBe(LESSONS['img-alt'].code);
    expect(lessonFor('frame-title', 'en').code).toContain('Store location map');
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

describe('코드 예시 영어', () => {
  it('영어 모드의 검사 카드·지식 코드에는 한글이 없다(다른 언어 표시를 보여 주는 예시만 예외)', async () => {
    const { LESSON_CODE_EN, TIP_CODE_EN } = await import('./code-en.js');
    for (const [id, code] of Object.entries(LESSON_CODE_EN)) expect(code, id).not.toMatch(hangul);
    for (const [id, code] of Object.entries(TIP_CODE_EN)) if (id !== 'lang-switch') expect(code, id).not.toMatch(hangul);
    for (const id of RULE_IDS) if (hangul.test(LESSONS[id].code)) expect(LESSON_CODE_EN[id], id + ' 영어 코드 없음').toBeDefined();
    const { TIPS } = await import('./tips.js');
    for (const t of TIPS) if (hangul.test(t.code)) expect(TIP_CODE_EN[t.id], t.id + ' 영어 코드 없음').toBeDefined();
  });

  it('영어 코드는 구조(줄 수)가 원본과 같다', async () => {
    const { LESSON_CODE_EN, TIP_CODE_EN } = await import('./code-en.js');
    const { TIPS } = await import('./tips.js');
    for (const [id, code] of Object.entries(LESSON_CODE_EN)) expect(code.split('\n').length, id).toBe(LESSONS[id as keyof typeof LESSONS].code.split('\n').length);
    for (const t of TIPS) if (TIP_CODE_EN[t.id]) expect(TIP_CODE_EN[t.id]!.split('\n').length, t.id).toBe(t.code.split('\n').length);
  });
});

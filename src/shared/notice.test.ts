import { describe, expect, it } from 'vitest';
import { LESSONS, RULE_IDS } from './lessons.js';
import { noticeOf } from './notice.js';

describe('noticeOf', () => {
  it('무엇이 문제인지·어디인지·어떻게 고치는지를 한 말풍선에 담는다', () => {
    const n = noticeOf({ ruleId: 'touch-target', selector: 'button#save', detail: '20x18px' });
    expect(n.title).toBe(LESSONS['touch-target'].bubble);
    expect(n.where).toBe('button#save (20x18px)');
    expect(n.fix).toBe(LESSONS['touch-target'].fix);
  });

  it('위치 값이 없으면 요소 경로만, 페이지 전체 문제는 "페이지 전체"로 보여 준다', () => {
    expect(noticeOf({ ruleId: 'img-alt', selector: 'body > img', detail: '' }).where).toBe('body > img');
    expect(noticeOf({ ruleId: 'html-lang', selector: 'document', detail: '<html lang> 없음' }).where).toBe('페이지 전체 (<html lang> 없음)');
  });

  it('모든 규칙에 고치는 방법이 있다(말풍선이 비지 않는다)', () => {
    for (const id of RULE_IDS) {
      const n = noticeOf({ ruleId: id, selector: 'x', detail: '' });
      expect(n.title, id).not.toBe('');
      expect(n.fix, id).not.toBe('');
    }
  });
});

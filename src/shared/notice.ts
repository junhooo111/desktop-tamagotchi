/** 펫이 찾아 알린 문제를 말풍선에 보여 줄 내용으로 바꾼다: 무엇이 문제인지, 어디인지, 어떻게 고치는지. */
import { LESSONS, type RuleId } from './lessons.js';
import type { NoticeBubble } from './view.js';

export function noticeOf(f: { ruleId: RuleId; selector: string; detail: string }): NoticeBubble {
  const lesson = LESSONS[f.ruleId];
  const where = f.selector === 'document' ? '페이지 전체' : f.selector;
  return { title: lesson.bubble, where: f.detail ? where + ' (' + f.detail + ')' : where, fix: lesson.fix };
}

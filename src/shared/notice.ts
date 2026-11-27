/** 펫이 찾아 알린 문제를 말풍선에 보여 줄 내용으로 바꾼다: 무엇이 문제인지, 어디인지, 어떻게 고치는지. */
import type { Lang } from './i18n.js';
import { lessonFor } from './lessons-en.js';
import type { RuleId } from './lessons.js';
import type { NoticeBubble } from './view.js';

export function noticeOf(f: { ruleId: RuleId; selector: string; detail: string }, lang: Lang = 'ko'): NoticeBubble {
  const lesson = lessonFor(f.ruleId, lang);
  const where = f.selector === 'document' ? (lang === 'en' ? 'Whole page' : '페이지 전체') : f.selector;
  return { title: lesson.bubble, where: f.detail ? where + ' (' + f.detail + ')' : where, fix: lesson.fix };
}

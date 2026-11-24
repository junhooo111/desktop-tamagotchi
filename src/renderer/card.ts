/** 배움 카드 화면. 내용은 textContent 로만 넣는다(페이지에서 가져온 글자가 섞여 있으므로 HTML 로 해석하지 않는다). */
import type { Lesson } from '../shared/lessons.js';

interface CardData {
  ruleId: string;
  lesson: Lesson;
  selector: string;
  detail: string;
  xp: number;
}

interface CardApi {
  getCard(): Promise<CardData | null>;
  confirm(): void;
  later(): void;
}

declare global {
  interface Window {
    cardApi: CardApi;
  }
}

const $ = <T extends HTMLElement>(id: string): T => document.getElementById(id) as T;

function setText(id: string, text: string): void {
  $(id).textContent = text;
}

void window.cardApi.getCard().then((card) => {
  if (!card) {
    $('empty').hidden = false;
    return;
  }
  setText('title', card.lesson.title);
  setText('where', `${card.selector}${card.detail ? ` · ${card.detail}` : ''}`);
  setText('problem', card.lesson.problem);
  setText('why', card.lesson.why);
  setText('fix', card.lesson.fix);
  setText('code', card.lesson.code);
  setText('confirm', `확인했어요 (+${card.xp})`);
  $('card').hidden = false;
  $('confirm').focus();
});

$('confirm').addEventListener('click', () => window.cardApi.confirm());
$('later').addEventListener('click', () => window.cardApi.later());
$('close').addEventListener('click', () => window.cardApi.later());
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') window.cardApi.later();
});

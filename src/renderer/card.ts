/**
 * 배움 카드 화면(찾은 문제를 설명하고 확인 퀴즈를 푼다).
 * 내용은 textContent 로만 넣는다(페이지에서 가져온 글자가 섞여 있으므로 HTML 로 해석하지 않는다).
 */
import type { Lang } from '../shared/i18n.js';
import type { Lesson } from '../shared/lessons.js';
import { localize, setUiLang } from './dom-i18n.js';
import type { Quiz } from '../shared/quizzes.js';

interface LessonCard {
  lesson: Lesson;
  quiz: Quiz;
  selector: string;
  detail: string;
  xp: number;
  bonus: number;
  /** 메인이 정한 언어. 학습 내용은 이미 그 언어로 들어 있다. */
  lang?: Lang;
}

interface CardApi {
  getCard(): Promise<LessonCard | null>;
  confirm(choice: number | null): void;
  later(): void;
  ignore(): void;
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

let choice: number | null = null;

function render(card: LessonCard): void {
  setText('title', card.lesson.title);
  setText('where', `${card.selector}${card.detail ? ` · ${card.detail}` : ''}`);
  setText('problem', card.lesson.problem);
  setText('why', card.lesson.why);
  setText('fix', card.lesson.fix);
  setText('code', card.lesson.code);
  setText('confirm', `확인했어요 (+${card.xp})`);

  // 퀴즈를 풀어야 확인할 수 있다(대충 누르기 방지). 틀려도 해설을 읽고 확인할 수 있다.
  setText('question', card.quiz.question);
  const buttons = card.quiz.options.map((text, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = text;
    button.addEventListener('click', () => {
      choice = index;
      buttons.forEach((b, i) => {
        b.disabled = true;
        if (i === card.quiz.answer) b.classList.add('correct');
        else if (i === index) b.classList.add('wrong');
      });
      const right = index === card.quiz.answer;
      setText('explain', `${right ? `정답이에요! (+${card.bonus} 보너스) ` : '아쉬워요. '}${card.quiz.explain}`);
      localizeTail();
      $('explain').hidden = false;
      ($('confirm') as HTMLButtonElement).disabled = false;
      $('confirm').focus();
    });
    return button;
  });
  $('options').replaceChildren(...buttons);
  ($('confirm') as HTMLButtonElement).disabled = true;
  localizeTail();
}

/** 영어일 때 카드 틀(제목·버튼)과 "정답이에요!" 같은 말을 바꿔 끼운다. 내용은 이미 영어다. */
function localizeTail(): void {
  localize();
}

void window.cardApi.getCard().then((card) => {
  if (card?.lang) setUiLang(card.lang);
  if (!card) {
    $('empty').hidden = false;
    localize();
    return;
  }
  render(card);
  $('card').hidden = false;
});

$('confirm').addEventListener('click', () => window.cardApi.confirm(choice));
$('later').addEventListener('click', () => window.cardApi.later());
$('ignore').addEventListener('click', () => window.cardApi.ignore());
$('close').addEventListener('click', () => window.cardApi.later());
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') window.cardApi.later();
});

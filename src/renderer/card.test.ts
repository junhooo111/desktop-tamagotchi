// @vitest-environment jsdom
import fs from 'node:fs';
import path from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LESSONS } from '../shared/lessons.js';
import { QUIZZES } from '../shared/quizzes.js';

const html = fs.readFileSync(path.join(process.cwd(), 'static', 'card.html'), 'utf8');
const body = /<body>([\s\S]*)<\/body>/.exec(html)?.[1]?.replace(/<script[\s\S]*?<\/script>/g, '') ?? '';

const el = (id: string): HTMLElement => document.getElementById(id) as HTMLElement;
const flush = (): Promise<void> => new Promise((r) => setTimeout(r, 0));

type Card = Record<string, unknown> | null;

async function open(card: Card) {
  const api = { getCard: vi.fn(async () => card), confirm: vi.fn(), later: vi.fn() };
  (window as unknown as { cardApi: typeof api }).cardApi = api;
  vi.resetModules();
  await import('./card.js');
  await flush();
  return api;
}

const lessonCard = {
  lesson: LESSONS['img-alt'],
  quiz: QUIZZES['img-alt'],
  selector: 'body > img',
  detail: '/hero.png',
  xp: 10,
  bonus: 5,
};
beforeEach(() => {
  document.body.innerHTML = body;
});

describe('배움 카드(문제)', () => {
  it('설명과 퀴즈를 보여 주고, 퀴즈를 풀기 전에는 확인할 수 없다', async () => {
    await open(lessonCard);
    expect(el('card').hidden).toBe(false);
    expect(el('title').textContent).toBe(LESSONS['img-alt'].title);
    expect(el('where').textContent).toBe('body > img · /hero.png');
    expect(el('why').textContent).toBe(LESSONS['img-alt'].why);
    expect(el('options').querySelectorAll('button')).toHaveLength(3);
    expect((el('confirm') as HTMLButtonElement).disabled).toBe(true);
    expect(el('confirm').textContent).toBe('확인했어요 (+10)');
  });

  it('정답을 고르면 표시와 해설이 나오고 확인할 수 있게 된다', async () => {
    const api = await open(lessonCard);
    const buttons = [...el('options').querySelectorAll('button')];
    buttons[QUIZZES['img-alt'].answer]?.click();

    expect(buttons[QUIZZES['img-alt'].answer]?.classList.contains('correct')).toBe(true);
    expect(buttons.every((b) => b.disabled)).toBe(true);
    expect(el('explain').hidden).toBe(false);
    expect(el('explain').textContent).toContain('정답이에요');
    expect(el('explain').textContent).toContain('+5');
    expect((el('confirm') as HTMLButtonElement).disabled).toBe(false);

    el('confirm').click();
    expect(api.confirm).toHaveBeenCalledWith(QUIZZES['img-alt'].answer);
  });

  it('오답을 골라도 정답을 알려 주고, 고른 번호를 그대로 넘긴다', async () => {
    const api = await open(lessonCard);
    const buttons = [...el('options').querySelectorAll('button')];
    const wrong = buttons.findIndex((_, i) => i !== QUIZZES['img-alt'].answer);
    buttons[wrong]?.click();

    expect(buttons[wrong]?.classList.contains('wrong')).toBe(true);
    expect(buttons[QUIZZES['img-alt'].answer]?.classList.contains('correct')).toBe(true);
    expect(el('explain').textContent).toContain('아쉬워요');
    el('confirm').click();
    expect(api.confirm).toHaveBeenCalledWith(wrong);
  });

  it('나중에·×·Esc 는 모두 later 로 처리한다', async () => {
    const api = await open(lessonCard);
    el('later').click();
    expect(api.later).toHaveBeenCalledTimes(1);
    el('close').click();
    expect(api.later).toHaveBeenCalledTimes(2);
    // document 는 테스트 사이에 이어지므로 앞선 테스트에서 붙은 Esc 리스너도 함께 반응한다. 늘어나는지만 본다.
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));
    expect(api.later).toHaveBeenCalledTimes(2);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(api.later.mock.calls.length).toBeGreaterThan(2);
    expect(api.confirm).not.toHaveBeenCalled();
  });

  it('페이지에서 가져온 글자를 HTML 로 해석하지 않는다', async () => {
    await open({ ...lessonCard, selector: '<img src=x onerror=alert(1)>', detail: '' });
    expect(el('where').textContent).toBe('<img src=x onerror=alert(1)>');
    expect(el('where').querySelector('img')).toBeNull();
  });
});

describe('카드가 없을 때', () => {
  it('안내 문구만 보여 준다', async () => {
    await open(null);
    expect(el('card').hidden).toBe(true);
    expect(el('empty').hidden).toBe(false);
  });
});

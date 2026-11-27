/**
 * 검사 결과 창: 지금 열려 있는 로컬 페이지에서 찾은 문제를 한눈에 보고, 무시하거나 되돌린다.
 * 내용은 textContent 로만 넣는다(페이지에서 가져온 글자가 섞여 있으므로 HTML 로 해석하지 않는다).
 */
import type { Lang } from '../shared/i18n.js';
import { startUiLocalization } from './dom-i18n.js';
import type { ResultItem, ResultState, ResultsView } from '../shared/results.js';

interface ResultsApi {
  get(): Promise<ResultsView>;
  lang?(): Promise<Lang>;
  ignore(key: string): Promise<void>;
  unignore(key: string): Promise<void>;
  onRefresh(callback: () => void): void;
  close(): void;
}

declare global {
  interface Window {
    resultsApi: ResultsApi;
  }
}

const $ = <T extends HTMLElement>(id: string): T => document.getElementById(id) as T;

function make<K extends keyof HTMLElementTagNameMap>(tag: K, className = '', text = ''): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (className) e.className = className;
  if (text) e.textContent = text;
  return e;
}

const STATE_LABEL: Record<ResultState, string> = {
  new: '새 문제',
  confirmed: '확인함',
  snoozed: '나중에',
  ignored: '무시함',
  disabled: '규칙 꺼짐',
};

function button(label: string, onClick: () => void): HTMLButtonElement {
  const b = make('button', '', label);
  b.type = 'button';
  b.addEventListener('click', onClick);
  return b;
}

function renderItem(item: ResultItem): HTMLLIElement {
  const li = make('li', 'item');
  li.dataset['state'] = item.state;
  const top = make('div', 'top');
  const left = make('div');
  left.append(make('div', 'title', item.title), make('div', 'where', item.where));
  const chips = make('div', 'chips');
  chips.append(make('span', 'chip cat', item.categoryLabel), make('span', 'chip', STATE_LABEL[item.state]));
  top.append(left, chips);

  const details = make('details');
  details.append(make('summary', '', '고치는 법'), make('p', '', item.fix));
  li.append(top, details);

  // 꺼 둔 규칙의 문제는 설정에서 규칙을 다시 켜야 하므로 여기서는 버튼이 없다.
  if (item.state !== 'disabled') {
    const actions = make('div', 'actions');
    actions.append(
      item.state === 'ignored'
        ? button('무시 해제', () => void window.resultsApi.unignore(item.key).then(refresh))
        : button('이 문제 무시', () => void window.resultsApi.ignore(item.key).then(refresh)),
    );
    li.append(actions);
  }
  return li;
}

function render(v: ResultsView): void {
  const c = v.counts;
  $('summary').textContent = `새 문제 ${c.new} · 확인함 ${c.confirmed} · 나중에 ${c.snoozed} · 무시함 ${c.ignored} · 규칙 꺼짐 ${c.disabled}`;

  const empty = $('empty');
  const pages = $('pages');
  pages.textContent = '';
  if (v.pages.length === 0) {
    empty.hidden = false;
    empty.textContent = v.connected
      ? '지금 열려 있는 로컬 페이지에서 찾은 문제가 없어요!'
      : '연결된 localhost 페이지가 없어요. 크롬 확장을 켜거나 검사용 브라우저로 페이지를 열어 주세요.';
  } else {
    empty.hidden = true;
  }
  for (const page of v.pages) {
    pages.append(make('h2', '', page.url));
    const ul = make('ul');
    for (const item of page.items) ul.append(renderItem(item));
    pages.append(ul);
  }

  const box = $('ignored-box');
  box.hidden = v.ignored.length === 0;
  $('ignored-count').textContent = `(${v.ignored.length})`;
  const list = $('ignored');
  list.textContent = '';
  for (const e of v.ignored) {
    const li = make('li');
    const text = make('div');
    text.append(make('div', 'title', e.title), make('div', 'where', `${e.url} · ${e.where}`));
    if (!e.present) text.append(make('div', 'gone', '지금 열린 페이지에는 없어요'));
    li.append(text, button('해제', () => void window.resultsApi.unignore(e.key).then(refresh)));
    list.append(li);
  }
}

async function refresh(): Promise<void> {
  render(await window.resultsApi.get());
}

$('close').addEventListener('click', () => window.resultsApi.close());
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') window.resultsApi.close();
});
window.resultsApi.onRefresh(() => void refresh());
void startUiLocalization(window.resultsApi.lang?.bind(window.resultsApi));
void refresh();

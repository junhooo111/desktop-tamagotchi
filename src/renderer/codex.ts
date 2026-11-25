/**
 * 도감·기록 창 화면: 연속 사용 기록, 배운 문제 종류(도감), 업적.
 * 값은 메인이 계산해서(buildCodex) 넘겨 주고, 여기서는 textContent 로만 그린다.
 */
import type { CodexView } from '../shared/growth.js';

interface CodexApi {
  get(): Promise<CodexView>;
  onRefresh(callback: () => void): void;
  close(): void;
}

declare global {
  interface Window {
    codexApi: CodexApi;
  }
}

const $ = <T extends HTMLElement>(id: string): T => document.getElementById(id) as T;

function make<K extends keyof HTMLElementTagNameMap>(tag: K, className = '', text = ''): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (className) e.className = className;
  if (text) e.textContent = text;
  return e;
}

function tile(value: string, label: string): HTMLElement {
  const t = make('div', 'tile');
  t.append(make('strong', '', value), make('span', '', label));
  return t;
}

const STATUS_LABEL = { unseen: '아직', learned: '배움', fixed: '고침' } as const;

function render(v: CodexView): void {
  const records = $('records');
  records.textContent = '';
  records.append(
    tile(`${v.streak.current}일`, '연속 사용'),
    tile(`${v.streak.best}일`, '최고 연속'),
    tile(`${v.streak.totalDays}일`, '함께한 날'),
    tile(`${v.rulesLearned}/${v.rulesTotal}`, '배운 문제 종류'),
    tile(`${v.tipsSeen}/${v.tipsTotal}`, '읽은 지식'),
    tile(String(v.counters.fixes), '고친 문제'),
  );

  $('rules-count').textContent = `${v.rulesLearned} / ${v.rulesTotal}`;
  const rules = $('rules');
  rules.textContent = '';
  for (const r of v.rules) {
    const li = make('li');
    li.dataset['status'] = r.status;
    const detail = r.status === 'unseen' ? '' : ` · 확인 ${r.confirms}회${r.fixes > 0 ? ` · 고침 ${r.fixes}회` : ''}`;
    li.append(make('span', 'title', r.title + detail), make('span', 'badge', STATUS_LABEL[r.status]));
    rules.append(li);
  }

  const done = v.achievements.filter((a) => a.unlocked).length;
  $('ach-count').textContent = `${done} / ${v.achievements.length}`;
  const list = $('achievements');
  list.textContent = '';
  for (const a of v.achievements) {
    const li = make('li');
    li.dataset['unlocked'] = String(a.unlocked);
    const body = make('div', 'body');
    const bar = make('div', 'bar');
    const fill = make('i');
    fill.style.width = `${Math.round((a.progress / a.goal) * 100)}%`;
    bar.append(fill);
    body.append(make('div', 'name', a.name), make('div', 'desc', `${a.description} (${a.progress}/${a.goal})`), bar);
    li.append(body, make('span', 'badge', a.unlocked ? '달성' : `+${a.xp} XP`));
    list.append(li);
  }
}

async function refresh(): Promise<void> {
  render(await window.codexApi.get());
}

$('close').addEventListener('click', () => window.codexApi.close());
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') window.codexApi.close();
});
window.codexApi.onRefresh(() => void refresh());
void refresh();

// @vitest-environment jsdom
import fs from 'node:fs';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LESSONS } from '../shared/lessons.js';
import { buildResults, type ResultFinding, type ResultsView } from '../shared/results.js';

const html = fs.readFileSync(path.join(process.cwd(), 'static', 'results.html'), 'utf8');
const body = /<body>([\s\S]*)<\/body>/.exec(html)?.[1]?.replace(/<script[\s\S]*?<\/script>/g, '') ?? '';

const el = <T extends HTMLElement = HTMLElement>(id: string): T => document.getElementById(id) as T;
const flush = async (): Promise<void> => {
  for (let i = 0; i < 5; i++) await Promise.resolve();
  await new Promise((r) => setTimeout(r, 0));
};

const finding = (ruleId: ResultFinding['ruleId'], selector: string, url = 'http://localhost:3000/'): ResultFinding => ({
  key: `${url}|${ruleId}|${selector}`,
  ruleId,
  url,
  selector,
  detail: '',
});

const view = (findings: ResultFinding[], over: Partial<Parameters<typeof buildResults>[1]> = {}): ResultsView =>
  buildResults(findings, {
    connected: true,
    confirmed: new Set(),
    snoozedUntil: {},
    settings: { disabledRules: [], ignored: [] },
    now: 1000,
    ...over,
  });

async function open(initial: ResultsView) {
  let current = initial;
  let refresh: () => void = () => {};
  const api = {
    get: vi.fn(async () => current),
    ignore: vi.fn(async () => undefined),
    unignore: vi.fn(async () => undefined),
    onRefresh: (cb: () => void) => (refresh = cb),
    close: vi.fn(),
  };
  (window as unknown as { resultsApi: typeof api }).resultsApi = api;
  vi.resetModules();
  await import('./results.js');
  await flush();
  return { api, refresh: () => refresh(), set: (v: ResultsView) => (current = v) };
}

// document 는 테스트 사이에 이어지므로, 앞선 테스트에서 붙은 리스너가 다음 테스트에 섞이지 않게 정리한다.
const attached: [string, EventListenerOrEventListenerObject][] = [];
beforeEach(() => {
  const original = document.addEventListener.bind(document);
  vi.spyOn(document, 'addEventListener').mockImplementation((type: string, listener: EventListenerOrEventListenerObject) => {
    attached.push([type, listener]);
    original(type, listener);
  });
  document.body.innerHTML = body;
});
afterEach(() => {
  for (const [type, listener] of attached.splice(0)) document.removeEventListener(type, listener);
  vi.restoreAllMocks();
});

describe('검사 결과 창', () => {
  it('요약과 페이지별 문제 목록(규칙 이름·위치·분류·상태·고치는 법)을 보여 준다', async () => {
    await open(view([finding('img-alt', 'img#hero'), finding('contrast', 'p.faint', 'http://localhost:5173/b')]));
    expect(el('summary').textContent).toBe('새 문제 2 · 확인함 0 · 나중에 0 · 무시함 0 · 규칙 꺼짐 0');
    expect([...el('pages').querySelectorAll('h2')].map((h) => h.textContent)).toEqual(['http://localhost:3000/', 'http://localhost:5173/b']);
    const first = el('pages').querySelector('.item') as HTMLElement;
    expect(first.dataset['state']).toBe('new');
    expect(first.textContent).toContain(LESSONS['img-alt'].title);
    expect(first.textContent).toContain('img#hero');
    expect(first.textContent).toContain('접근성');
    expect(first.textContent).toContain('새 문제');
    expect(first.querySelector('details p')?.textContent).toBe(LESSONS['img-alt'].fix);
  });

  it('새 문제의 "이 문제 무시"를 누르면 그 키로 무시를 요청한다', async () => {
    const f = finding('img-alt', 'img#hero');
    const { api } = await open(view([f]));
    (el('pages').querySelector('.actions button') as HTMLButtonElement).click();
    await flush();
    expect(api.ignore).toHaveBeenCalledWith(f.key);
    expect(api.get).toHaveBeenCalledTimes(2); // 누른 뒤 다시 가져와 그린다
  });

  it('무시한 문제는 "무시 해제" 버튼이 있고, 규칙을 꺼 둔 문제는 버튼이 없다', async () => {
    const a = finding('img-alt', 'img#a');
    const b = finding('contrast', 'p');
    const { api } = await open(view([a, b], { settings: { disabledRules: ['contrast'], ignored: [a.key] } }));
    const items = [...el('pages').querySelectorAll('.item')] as HTMLElement[];
    const ignored = items.find((i) => i.dataset['state'] === 'ignored')!;
    const disabled = items.find((i) => i.dataset['state'] === 'disabled')!;
    expect(ignored.querySelector('button')?.textContent).toBe('무시 해제');
    expect(disabled.querySelector('.actions')).toBeNull();
    (ignored.querySelector('button') as HTMLButtonElement).click();
    await flush();
    expect(api.unignore).toHaveBeenCalledWith(a.key);
  });

  it('무시 목록: 개수와 항목을 보여 주고, 지금 페이지에 없는 항목은 그렇게 표시하며, 해제할 수 있다', async () => {
    const gone = 'http://localhost:3000/old|contrast|p.faint';
    const { api } = await open(view([], { settings: { disabledRules: [], ignored: [gone] } }));
    expect(el('ignored-box').hidden).toBe(false);
    expect(el('ignored-count').textContent).toBe('(1)');
    expect(el('ignored').textContent).toContain('지금 열린 페이지에는 없어요');
    (el('ignored').querySelector('button') as HTMLButtonElement).click();
    await flush();
    expect(api.unignore).toHaveBeenCalledWith(gone);
  });

  it('무시한 것이 없으면 무시 목록을 숨긴다', async () => {
    await open(view([finding('img-alt', 'a')]));
    expect(el('ignored-box').hidden).toBe(true);
  });

  it('문제가 없으면 이유를 구분해서 안내한다(연결 안 됨 / 문제 없음)', async () => {
    await open(view([], { connected: false }));
    expect(el('empty').hidden).toBe(false);
    expect(el('empty').textContent).toContain('연결된 localhost 페이지가 없어요');
    document.body.innerHTML = body;
    await open(view([], { connected: true }));
    expect(el('empty').textContent).toContain('찾은 문제가 없어요');
  });

  it('글자를 HTML 로 해석하지 않는다(페이지에서 가져온 요소 경로)', async () => {
    await open(view([finding('img-alt', '<img src=x onerror=alert(1)>')]));
    expect(el('pages').querySelector('.where img')).toBeNull();
    expect(el('pages').textContent).toContain('<img src=x onerror=alert(1)>');
  });

  it('메인이 새로고침 신호를 보내면 다시 가져와 그리고, 항목이 중복으로 쌓이지 않는다', async () => {
    const { api, refresh, set } = await open(view([finding('img-alt', 'a')]));
    set(view([finding('img-alt', 'a'), finding('contrast', 'b')]));
    refresh();
    await flush();
    expect(api.get).toHaveBeenCalledTimes(2);
    expect(el('pages').querySelectorAll('.item')).toHaveLength(2);
  });

  it('닫기 버튼과 Esc 로 닫는다', async () => {
    const { api } = await open(view([]));
    el('close').click();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(api.close).toHaveBeenCalledTimes(2);
  });
});

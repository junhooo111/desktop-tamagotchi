// @vitest-environment jsdom
import fs from 'node:fs';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { RankingView } from './ranking.js';

const html = fs.readFileSync(path.join(process.cwd(), 'static', 'ranking.html'), 'utf8');
const body = /<body>([\s\S]*)<\/body>/.exec(html)?.[1]?.replace(/<script[\s\S]*?<\/script>/g, '') ?? '';
const el = <T extends HTMLElement = HTMLElement>(id: string): T => document.getElementById(id) as T;
const flush = async (): Promise<void> => {
  for (let i = 0; i < 5; i++) await Promise.resolve();
  await new Promise((r) => setTimeout(r, 0));
};

const view = (over: Partial<RankingView> = {}): RankingView => ({
  ok: true,
  metric: 'species',
  rows: [
    { rank: 1, github_login: 'alice', avatar_url: 'https://avatars.githubusercontent.com/u/1', value: 12, is_me: false },
    { rank: 2, github_login: '<img src=x onerror=alert(1)>', avatar_url: 'https://evil.example/x.png', value: 9, is_me: true },
  ],
  me: { github_login: 'me', show_in_ranking: true, scores: { species: 9 }, ranks: { species: 2 } },
  ...over,
});

async function open(v: RankingView) {
  const api = { get: vi.fn(async () => v), setVisible: vi.fn(async () => {}), close: vi.fn() };
  (window as unknown as { rankingApi: typeof api }).rankingApi = api;
  vi.resetModules();
  await import('./ranking.js');
  await flush();
  return api;
}

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

describe('랭킹 창', () => {
  it('항목 탭 6개를 만들고 처음에는 도감(종 수)을 불러온다', async () => {
    const api = await open(view());
    expect(el('tabs').querySelectorAll('button')).toHaveLength(6);
    expect(api.get).toHaveBeenCalledWith('species');
    expect(el('tabs').querySelector('[aria-selected="true"]')?.textContent).toContain('도감');
  });

  it('순위·이름·점수를 보여 주고 내 줄을 표시한다', async () => {
    await open(view());
    const rows = [...el('board').querySelectorAll('li')];
    expect(rows).toHaveLength(2);
    expect(rows[0]?.textContent).toContain('1위');
    expect(rows[0]?.textContent).toContain('alice');
    expect(rows[0]?.textContent).toContain('12종');
    expect(rows[1]?.className).toBe('me');
    expect(el('me').textContent).toContain('9종');
    expect(el('me').textContent).toContain('2위');
  });

  it('이름은 글자로만 그리고(HTML 로 해석하지 않음), GitHub 가 아닌 아바타 주소는 쓰지 않는다', async () => {
    await open(view());
    expect(el('board').querySelector('li:nth-child(2) img')).toBeNull();
    expect(el('board').querySelector('li:nth-child(2)')?.textContent).toContain('<img src=x onerror=alert(1)>');
    expect(el('board').querySelectorAll('img')).toHaveLength(1); // GitHub 아바타 한 개만
    expect(el('board').querySelector('img')?.getAttribute('src')).toBe('https://avatars.githubusercontent.com/u/1');
  });

  it('탭을 누르면 그 항목을 다시 불러온다', async () => {
    const api = await open(view());
    (el('tabs').querySelectorAll('button')[3] as HTMLButtonElement).click();
    await flush();
    expect(api.get).toHaveBeenLastCalledWith('level');
  });

  it('오류면 안내 문구만 보여 준다', async () => {
    await open(view({ ok: false, message: '로그인하면 랭킹을 볼 수 있어요', rows: [], me: undefined }));
    expect(el('note').textContent).toContain('로그인하면');
    expect(el('board').children).toHaveLength(0);
  });

  it('기록이 없으면 안내하고, 랭킹에서 숨긴 상태를 보여 준다', async () => {
    await open(view({ rows: [], me: { github_login: 'me', show_in_ranking: false, scores: { species: 3 }, ranks: {} } }));
    expect(el('note').textContent).toContain('아직');
    expect(el('me').textContent).toContain('숨김');
    expect(el<HTMLInputElement>('visible').checked).toBe(false);
  });

  it('공개 체크를 바꾸면 서버에 알리고 다시 불러온다', async () => {
    const api = await open(view());
    const box = el<HTMLInputElement>('visible');
    box.checked = false;
    box.dispatchEvent(new Event('change'));
    await flush();
    expect(api.setVisible).toHaveBeenCalledWith(false);
    expect(api.get.mock.calls.length).toBeGreaterThanOrEqual(2);
  });

  it('닫기 단추가 창을 닫는다', async () => {
    const api = await open(view());
    el('close').click();
    expect(api.close).toHaveBeenCalled();
  });
});

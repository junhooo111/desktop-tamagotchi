// @vitest-environment jsdom
import fs from 'node:fs';
import path from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const html = fs.readFileSync(path.join(process.cwd(), 'static', 'friends.html'), 'utf8');
const body = /<body>([\s\S]*)<\/body>/.exec(html)![1]!.replace(/<script[\s\S]*?<\/script>/g, '');

const row = (o: Record<string, unknown> = {}) => ({
  friendship_id: 'f1', friend_id: 'u1', login: 'octocat', avatar_url: null, status: 'friend', xp: 30, level: 2, next_xp: 60,
  since: new Date(Date.now() - 3 * 86_400_000).toISOString(), waved_today: false, they_waved_today: false, species_id: 'cat', pet_xp: 5, ...o,
});
const view = (rows: unknown[], tickets = 2) => ({ ok: true, tickets, rows });
const tick = () => new Promise((r) => setTimeout(r, 0));

async function mount(v: unknown, extra: Record<string, unknown> = {}) {
  vi.resetModules();
  document.body.innerHTML = body;
  const api = { get: vi.fn().mockResolvedValue(v), request: vi.fn(), respond: vi.fn(), remove: vi.fn(), wave: vi.fn(), gift: vi.fn(), close: vi.fn(), ...extra };
  (window as unknown as { friendsApi: unknown }).friendsApi = api;
  await import('./friends.js');
  await tick();
  return api;
}

describe('친구 창 화면', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('레벨 막대는 지금 레벨 안에서의 비율로 채우고, 마지막 레벨은 꽉 찬다', async () => {
    const { levelProgress, tierOf } = await import('./friends.js');
    expect(levelProgress(30, 2)).toBeCloseTo(0.25);
    expect(levelProgress(5000, 10)).toBe(1);
    expect(tierOf(1)).toBe(1);
    expect(tierOf(10)).toBe(4);
  });

  it('남이 쓴 아이디는 글자로만 보여 주고 친밀도 레벨을 표시한다', async () => {
    await mount(view([row({ login: '<b>x</b>' })]));
    expect(document.querySelector('#friends')!.innerHTML).not.toContain('<b>');
    expect(document.querySelector('.lv')!.textContent).toBe('Lv.2');
    expect(document.querySelector('#wallet')!.textContent).toContain('2');
  });

  it('인사하기는 서버에 부탁하고, 이미 했으면 꺼져 있다', async () => {
    const wave = vi.fn().mockResolvedValue({ ok: true, message: '인사했어요', view: view([row({ waved_today: true })]) });
    await mount(view([row()]), { wave });
    (document.querySelector('.actions button') as HTMLButtonElement).click();
    await tick();
    expect(wave).toHaveBeenCalledWith('f1');
    expect((document.querySelector('.actions button') as HTMLButtonElement).disabled).toBe(true);
    expect(document.querySelector('#note')!.textContent).toBe('인사했어요');
  });

  it('뽑기권이 없으면 선물 버튼이 꺼진다', async () => {
    await mount(view([row()], 0));
    const buttons = document.querySelectorAll('.actions button');
    expect((buttons[1] as HTMLButtonElement).disabled).toBe(true);
  });

  it('받은 요청은 수락·거절하고, 보낸 요청은 취소한다', async () => {
    const respond = vi.fn().mockResolvedValue({ ok: true, message: '친구가 되었어요!', view: view([]) });
    const remove = vi.fn().mockResolvedValue({ ok: true, message: '', view: view([]) });
    await mount(view([row({ friendship_id: 'in1', status: 'incoming' }), row({ friendship_id: 'out1', status: 'outgoing', login: 'bob' })]), { respond, remove });
    expect((document.querySelector('#incoming-box') as HTMLElement).hidden).toBe(false);
    (document.querySelector('#incoming button') as HTMLButtonElement).click();
    await tick();
    expect(respond).toHaveBeenCalledWith('in1', true);
  });

  it('GitHub 아이디를 적어 요청을 보낸다(앞의 @ 는 뗀다)', async () => {
    const request = vi.fn().mockResolvedValue({ ok: true, message: '보냈어요', view: view([]) });
    await mount(view([]), { request });
    (document.querySelector('#login') as HTMLInputElement).value = ' @octocat ';
    (document.querySelector('#add') as HTMLFormElement).dispatchEvent(new Event('submit', { cancelable: true }));
    await tick();
    expect(request).toHaveBeenCalledWith('octocat');
  });

  it('서버에 닿지 않으면 안내만 보여 준다', async () => {
    await mount({ ok: false, message: '로그인하면 친구를 사귈 수 있어요', tickets: 0, rows: [] });
    expect(document.querySelector('#note')!.textContent).toContain('로그인');
    expect(document.querySelector('#friends')!.children).toHaveLength(0);
  });
});

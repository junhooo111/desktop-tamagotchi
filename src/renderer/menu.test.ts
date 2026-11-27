// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { MenuModel } from '../shared/menu.js';

const model = (): MenuModel => ({
  header: { name: '<b>콩이</b>', sub: '병아리 · 성체', level: 12, tierName: '숙련', tierColor: '#3aa55d', bars: [{ label: '배부름', value: 80, level: 'high' }, { label: '청결', value: 20, level: 'low' }] },
  update: null,
  care: [
    { id: 'care:touch', label: '쓰다듬기', icon: 'touch' },
    { id: 'care:feed', label: '밥 주기', icon: 'feed' },
    { id: 'care:wash', label: '씻기기', icon: 'wash', enabled: false },
  ],
  tabs: [
    { id: 'pet', label: '내 펫', icon: 'paw', items: [{ id: 'wardrobe', label: '꾸미기…', icon: 'star' }, { id: 'collection', label: '뽑기', icon: 'ticket', badge: '7' }] },
    { id: 'dev', label: '개발', icon: 'tool', items: [{ id: 'tools', label: '검사 도구', icon: 'tool', children: [{ id: 'tools:demo', label: '체험', icon: 'bug' }] }, { id: 'scan', label: '검사', hint: '연결 안 됨' }] },
  ],
  tab: 'pet',
  footer: [
    { id: 'settings', label: '설정', icon: 'gear' },
    { id: 'more', label: '더보기', icon: 'dots', children: [{ id: 'autostart', label: '자동 실행', checked: true }, { id: 'version', label: '버전', enabled: false }] },
    { id: 'quit', label: '종료', icon: 'power' },
  ],
  text: { back: '뒤로', close: '닫기', empty: '없어요' },
});

const tick = () => new Promise((r) => setTimeout(r, 0));
const html = '<div id="app" class="panel"></div>';

// 불러올 때마다 document 에 단축키 듣기가 더해지므로, 다음 시험 전에 지운다.
const added: Array<[string, EventListenerOrEventListenerObject]> = [];
const realAdd = document.addEventListener.bind(document);
document.addEventListener = ((type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions) => {
  added.push([type, listener]);
  realAdd(type, listener, options);
}) as typeof document.addEventListener;

async function mount(m: MenuModel | null = model()) {
  for (const [type, listener] of added.splice(0)) document.removeEventListener(type, listener);
  vi.resetModules();
  document.body.innerHTML = html;
  const api = { get: vi.fn().mockResolvedValue(m), ready: vi.fn(), resize: vi.fn(), tab: vi.fn(), click: vi.fn(), close: vi.fn() };
  (window as unknown as { menuApi: unknown }).menuApi = api;
  await import('./menu.js');
  await tick();
  return api;
}
const q = <T extends Element>(s: string): T => document.querySelector(s) as T;
const key = (k: string) => document.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true }));

describe('우클릭 도트 메뉴 화면', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('머리말(이름·레벨·막대)과 돌보기 버튼, 탭, 아래 줄을 그리고 높이를 한 번 알린다', async () => {
    const api = await mount();
    expect(q('.name').textContent).toBe('<b>콩이</b>'); // HTML 로 해석하지 않는다
    expect(q('.name').innerHTML).not.toContain('<b>');
    expect(q('.lv').textContent).toBe('Lv.12');
    expect(document.querySelectorAll('.bar-line')).toHaveLength(2);
    expect(document.querySelectorAll('.bar-line')[0]?.querySelectorAll('.seg.on')).toHaveLength(8);
    expect(document.querySelectorAll('.care')).toHaveLength(3);
    expect([...document.querySelectorAll('.tab')].map((t) => t.getAttribute('aria-selected'))).toEqual(['true', 'false']);
    expect([...document.querySelectorAll('.foot .label')].map((l) => l.textContent)).toEqual(['설정', '더보기', '종료']);
    expect(api.ready).toHaveBeenCalledTimes(1);
    expect(typeof api.ready.mock.calls[0]?.[0]).toBe('number');
  });

  it('모든 아이콘이 도트 SVG 로 그려진다', async () => {
    await mount();
    const svgs = document.querySelectorAll('svg.icon');
    expect(svgs.length).toBeGreaterThan(8);
    expect(svgs[0]?.querySelectorAll('rect').length).toBeGreaterThan(10);
    expect(svgs[0]?.getAttribute('shape-rendering')).toBe('crispEdges');
  });

  it('항목을 누르면 id 만 메인에 보내고, 꺼진 항목은 보내지 않는다', async () => {
    const api = await mount();
    q<HTMLButtonElement>('.care[data-id="care:touch"]').click();
    q<HTMLButtonElement>('.care[data-id="care:wash"]').click();
    q<HTMLButtonElement>('.row[data-id="wardrobe"]').click();
    expect(api.click.mock.calls).toEqual([['care:touch'], ['wardrobe']]);
    expect(q('.care[data-id="care:wash"]').getAttribute('aria-disabled')).toBe('true');
  });

  it('탭을 바꾸면 그 탭의 항목을 보이고 마지막 탭을 메인에 알린다', async () => {
    const api = await mount();
    q<HTMLButtonElement>('.tab[data-tab="dev"]').click();
    expect([...document.querySelectorAll('.list .row .label')].map((l) => l.textContent)).toEqual(['검사 도구', '검사']);
    expect(api.tab).toHaveBeenCalledWith('dev');
    expect(q('.tab.sel').getAttribute('data-tab')).toBe('dev');
    expect(api.resize).toHaveBeenCalled();
  });

  it('하위 항목이 있으면 하위 페이지가 열리고, 뒤로 가기·Esc 로 돌아오며, Esc 가 맨 위에서는 메뉴를 닫는다', async () => {
    const api = await mount();
    q<HTMLButtonElement>('.tab[data-tab="dev"]').click();
    q<HTMLButtonElement>('.row[data-id="tools"]').click();
    expect(q('.subtitle').textContent).toBe('검사 도구');
    expect(document.querySelector('.tabs')).toBeNull();
    expect(api.click).not.toHaveBeenCalled(); // 하위 페이지를 여는 것은 동작이 아니다
    key('Escape');
    expect(document.querySelector('.tabs')).not.toBeNull();
    q<HTMLButtonElement>('.row[data-id="tools"]').click();
    q<HTMLButtonElement>('.back').click();
    expect(document.querySelector('.tabs')).not.toBeNull();
    expect(api.close).not.toHaveBeenCalled();
    key('Escape');
    expect(api.close).toHaveBeenCalledTimes(1);
  });

  it('체크 항목은 상태를 보이고, 설명(hint)과 뱃지를 함께 보인다', async () => {
    await mount();
    expect(q('.row[data-id="collection"] .badge').textContent).toBe('7');
    q<HTMLButtonElement>('.tab[data-tab="dev"]').click();
    expect(q('.row[data-id="scan"] .hint').textContent).toBe('연결 안 됨');
    q<HTMLButtonElement>('.foot[data-id="more"]').click();
    const auto = q('.row[data-id="autostart"]');
    expect(auto.getAttribute('role')).toBe('menuitemcheckbox');
    expect(auto.getAttribute('aria-checked')).toBe('true');
    expect(auto.querySelector('.check.on')).not.toBeNull();
    expect(q('.row[data-id="version"]').getAttribute('aria-disabled')).toBe('true');
  });

  it('방향키로 단추 사이를 움직인다(꺼진 단추는 건너뜀)', async () => {
    await mount();
    q<HTMLButtonElement>('.care[data-id="care:touch"]').focus();
    key('ArrowRight');
    expect((document.activeElement as HTMLElement).dataset['id']).toBe('care:feed');
    key('ArrowRight'); // care:wash 는 꺼져 있어 건너뛰고 다음 단추로
    expect((document.activeElement as HTMLElement).dataset['id']).not.toBe('care:wash');
    key('ArrowLeft');
    expect((document.activeElement as HTMLElement).dataset['id']).toBe('care:feed');
  });

  it('모델이 없으면 메뉴를 닫는다', async () => {
    const api = await mount(null);
    expect(api.close).toHaveBeenCalled();
    expect(api.ready).not.toHaveBeenCalled();
  });
});

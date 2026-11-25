// @vitest-environment jsdom
import fs from 'node:fs';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { emptyGrowth, type Growth } from '../shared/growth.js';
import { SPECIES } from '../shared/species.js';
import { buildWardrobe, type WardrobePatch } from '../shared/wardrobe.js';
import type { WardrobeData } from './wardrobe.js';

const html = fs.readFileSync(path.join(process.cwd(), 'static', 'wardrobe.html'), 'utf8');
const body = /<body>([\s\S]*)<\/body>/.exec(html)?.[1]?.replace(/<script[\s\S]*?<\/script>/g, '') ?? '';

const el = <T extends HTMLElement = HTMLElement>(id: string): T => document.getElementById(id) as T;
const flush = async (): Promise<void> => {
  for (let i = 0; i < 5; i++) await Promise.resolve();
  await new Promise((r) => setTimeout(r, 0));
};
const withAchievements = (...ids: string[]): Growth => ({ ...emptyGrowth(), achievements: Object.fromEntries(ids.map((id) => [id, 1])) });
const data = (g: Growth, over: Partial<WardrobeData['current']> = {}): WardrobeData => ({
  ...buildWardrobe(g, { speciesId: 'cat', variant: 'default', accessory: 'none', ...over }),
  stage: 'adult',
});
const buttons = (id: string): HTMLButtonElement[] => [...el(id).querySelectorAll('button')] as HTMLButtonElement[];

const fillRect = vi.fn();

async function open(initial: WardrobeData) {
  let current = initial;
  let refresh: () => void = () => {};
  const api = {
    get: vi.fn(async () => current),
    set: vi.fn(async (patch: WardrobePatch) => (current = { ...current, current: { ...current.current, ...patch } })),
    onRefresh: (cb: () => void) => (refresh = cb),
    close: vi.fn(),
  };
  (window as unknown as { wardrobeApi: typeof api }).wardrobeApi = api;
  vi.resetModules();
  await import('./wardrobe.js');
  await flush();
  return { api, refresh: () => refresh(), set: (d: WardrobeData) => (current = d) };
}

// document 는 테스트 사이에 이어지므로, 앞선 테스트에서 붙은 리스너가 다음 테스트에 섞이지 않게 정리한다.
const attached: [string, EventListenerOrEventListenerObject][] = [];
beforeEach(() => {
  fillRect.mockClear();
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation((() => ({ clearRect: vi.fn(), fillRect, fillStyle: '' })) as never);
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

describe('꾸미기 창', () => {
  it('동물·색·장식을 모두 보여 주고 지금 입고 있는 것을 눌린 상태로 표시한다', async () => {
    await open(data(emptyGrowth(), { speciesId: 'dog' }));
    expect(buttons('species')).toHaveLength(SPECIES.length);
    expect(buttons('variants')).toHaveLength(4);
    expect(buttons('accessories')).toHaveLength(5);
    const pressed = (id: string): string[] => buttons(id).filter((b) => b.getAttribute('aria-pressed') === 'true').map((b) => b.dataset['id'] ?? '');
    expect(pressed('species')).toEqual(['dog']);
    expect(pressed('variants')).toEqual(['default']);
    expect(pressed('accessories')).toEqual(['none']);
  });

  it('미리보기에 지금 모습을 그린다', async () => {
    await open(data(emptyGrowth()));
    expect(fillRect).toHaveBeenCalled();
  });

  it('열린 것을 누르면 그 값만 메인에 보내고, 돌려받은 상태로 다시 그린다', async () => {
    const { api } = await open(data(emptyGrowth()));
    buttons('species').find((b) => b.dataset['id'] === 'rabbit')!.click();
    await flush();
    expect(api.set).toHaveBeenCalledWith({ speciesId: 'rabbit' });
    expect(buttons('species').find((b) => b.dataset['id'] === 'rabbit')!.getAttribute('aria-pressed')).toBe('true');
    buttons('variants').find((b) => b.dataset['id'] === 'default')!.click();
    await flush();
    expect(api.set).toHaveBeenLastCalledWith({ variant: 'default' });
  });

  it('잠긴 것은 🔒 표시에 aria-disabled 이고, 눌러도 메인에 보내지 않고 여는 방법을 보여 준다', async () => {
    const { api } = await open(data(emptyGrowth()));
    const crown = buttons('accessories').find((b) => b.dataset['id'] === 'crown')!;
    expect(crown.textContent).toContain('🔒');
    expect(crown.getAttribute('aria-disabled')).toBe('true');
    expect(crown.title).toContain('도감 완성');
    crown.click();
    await flush();
    expect(api.set).not.toHaveBeenCalled();
    expect(el('lock-hint').textContent).toContain('도감 완성');
    expect(crown.getAttribute('aria-pressed')).toBe('false');
  });

  it('업적을 달성한 것은 잠김 표시가 없고 눌러서 쓸 수 있다', async () => {
    const { api } = await open(data(withAchievements('rules-all', 'first-confirm')));
    const crown = buttons('accessories').find((b) => b.dataset['id'] === 'crown')!;
    expect(crown.textContent).not.toContain('🔒');
    crown.click();
    await flush();
    expect(api.set).toHaveBeenCalledWith({ accessory: 'crown' });
    expect(buttons('species').find((b) => b.dataset['id'] === 'fox')!.getAttribute('aria-disabled')).toBeNull();
  });

  it('고르면 이전의 잠김 안내가 사라진다', async () => {
    await open(data(withAchievements()));
    buttons('accessories').find((b) => b.dataset['id'] === 'wings')!.click();
    expect(el('lock-hint').textContent).not.toBe('');
    buttons('species')[0]!.click();
    await flush();
    expect(el('lock-hint').textContent).toBe('');
  });

  it('메인이 새로고침 신호를 보내면(업적 달성 등) 다시 가져와 그린다', async () => {
    const { api, refresh, set } = await open(data(emptyGrowth()));
    set(data(withAchievements('rules-all')));
    refresh();
    await flush();
    expect(api.get).toHaveBeenCalledTimes(2);
    expect(buttons('accessories').find((b) => b.dataset['id'] === 'crown')!.getAttribute('aria-disabled')).toBeNull();
    expect(buttons('species')).toHaveLength(SPECIES.length); // 중복으로 쌓이지 않는다
  });

  it('닫기 버튼과 Esc 로 닫는다', async () => {
    const { api } = await open(data(emptyGrowth()));
    el('close').click();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(api.close).toHaveBeenCalledTimes(2);
  });
});

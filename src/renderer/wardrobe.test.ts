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
  // 고양이와 강아지만 가지고 있다(나머지 동물은 뽑기로 얻어야 한다)
  ...buildWardrobe(g, { speciesId: 'cat', variant: 'default', accessory: 'none', ...over }, { accessories: [], variants: [], species: ['cat', 'dog'] }),
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
  it('색·장식을 모두 보여 주고 지금 입고 있는 것을 눌린 상태로 표시하며, 동물은 여기서 고르지 않는다(뽑기·컬렉션에서 꺼낸다)', async () => {
    await open(data(emptyGrowth(), { speciesId: 'dog' }));
    expect(document.getElementById('species')).toBeNull();
    expect(buttons('variants')).toHaveLength(4);
    expect(buttons('accessories')).toHaveLength(29);
    const pressed = (id: string): string[] => buttons(id).filter((b) => b.getAttribute('aria-pressed') === 'true').map((b) => b.dataset['id'] ?? '');
    expect(pressed('variants')).toEqual(['default']);
    expect(pressed('accessories')).toEqual(['none']);
  });

  it('색·장식 칸마다 입은 모습의 작은 그림이 있고, 미리보기는 고정 영역에 있다', async () => {
    await open(data(emptyGrowth()));
    for (const b of [...buttons('variants'), ...buttons('accessories')]) expect(b.querySelector('canvas'), b.dataset['id']).not.toBeNull();
    expect(document.querySelector('.stage #preview')).not.toBeNull();
  });

  it('미리보기에 지금 모습을 그린다', async () => {
    await open(data(emptyGrowth()));
    expect(fillRect).toHaveBeenCalled();
  });

  it('열린 것을 누르면 그 값만 메인에 보내고, 돌려받은 상태로 다시 그린다', async () => {
    const { api } = await open(data(emptyGrowth()));
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
    const { api } = await open(data(withAchievements('rules-all')));
    const crown = buttons('accessories').find((b) => b.dataset['id'] === 'crown')!;
    expect(crown.textContent).not.toContain('🔒');
    crown.click();
    await flush();
    expect(api.set).toHaveBeenCalledWith({ accessory: 'crown' });
  });

  it('고르면 이전의 잠김 안내가 사라진다', async () => {
    await open(data(withAchievements()));
    buttons('accessories').find((b) => b.dataset['id'] === 'wings')!.click();
    expect(el('lock-hint').textContent).not.toBe('');
    buttons('variants')[0]!.click();
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
    expect(buttons('card-species')).toHaveLength(SPECIES.length + 1); // 중복으로 쌓이지 않는다
  });

  it('이름을 쓰고 저장(또는 Enter)하면 이름만 메인에 보내고, 입력칸에는 저장된 이름이 보인다', async () => {
    const { api } = await open(data(emptyGrowth(), { name: '콩이' }));
    expect(el<HTMLInputElement>('pet-name').value).toBe('콩이');
    el<HTMLInputElement>('pet-name').value = '두부';
    el('name-save').click();
    await flush();
    expect(api.set).toHaveBeenLastCalledWith({ name: '두부' });
    expect(api.close).toHaveBeenCalledTimes(1); // 저장하면 창이 닫힌다(적용됐다는 걸 알 수 있게)
    el<HTMLInputElement>('pet-name').value = '모찌';
    el('pet-name').dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    await flush();
    expect(api.set).toHaveBeenLastCalledWith({ name: '모찌' });
    expect(api.close).toHaveBeenCalledTimes(2); // Enter 로 저장해도 닫힌다
  });

  it('프로필 카드에 보여 줄 펫: 지금 키우는 펫 + 모든 동물을 보여 주고, 열린 것만 고른다', async () => {
    const { api } = await open(data(emptyGrowth()));
    const ids = buttons('card-species').map((b) => b.dataset['id']);
    expect(ids).toEqual(['current', ...SPECIES.map((s) => s.id)]);
    expect(buttons('card-species').find((b) => b.dataset['id'] === 'current')!.getAttribute('aria-pressed')).toBe('true');
    buttons('card-species').find((b) => b.dataset['id'] === 'dog')!.click();
    await flush();
    expect(api.set).toHaveBeenLastCalledWith({ cardSpecies: 'dog' });
    const locked = buttons('card-species').find((b) => b.dataset['id'] === 'penguin')!;
    expect(locked.getAttribute('aria-disabled')).toBe('true');
    api.set.mockClear();
    locked.click();
    await flush();
    expect(api.set).not.toHaveBeenCalled();
  });

  it('모습(성장 단계): 자동과 지나온 단계가 열려 있고, 누르면 그 단계만 메인에 보낸다', async () => {
    const { api } = await open(data(emptyGrowth()));
    expect(buttons('stages').map((b) => b.dataset['id'])).toEqual(['auto', 'baby', 'adult']);
    expect(buttons('stages').find((b) => b.dataset['id'] === 'auto')!.getAttribute('aria-pressed')).toBe('true');
    buttons('stages').find((b) => b.dataset['id'] === 'baby')!.click();
    await flush();
    expect(api.set).toHaveBeenLastCalledWith({ displayStage: 'baby' });
    expect(buttons('stages').find((b) => b.dataset['id'] === 'baby')!.getAttribute('aria-pressed')).toBe('true');
  });

  it('아직 안 지나온 단계는 잠겨 있고 눌러도 보내지 않는다', async () => {
    const baby = { ...data(emptyGrowth()), ...buildWardrobe(emptyGrowth(), { speciesId: 'cat', variant: 'default', accessory: 'none' }, { accessories: [], variants: [], species: ['cat'], stage: 'baby' }), stage: 'baby' as const };
    const { api } = await open(baby);
    const adult = buttons('stages').find((b) => b.dataset['id'] === 'adult')!;
    expect(adult.getAttribute('aria-disabled')).toBe('true');
    adult.click();
    await flush();
    expect(api.set).not.toHaveBeenCalled();
    expect(el('lock-hint').textContent).toContain('지나오지');
  });

  it('닫기 버튼과 Esc 로 닫는다', async () => {
    const { api } = await open(data(emptyGrowth()));
    el('close').click();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(api.close).toHaveBeenCalledTimes(2);
  });
});

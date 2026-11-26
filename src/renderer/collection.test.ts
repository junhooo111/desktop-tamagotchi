// @vitest-environment jsdom
import fs from 'node:fs';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { buildCollectionView, pullSpecies, startCollection, type Collection, type CollectionView } from '../shared/collection.js';
import { createPet } from '../shared/pet.js';

const html = fs.readFileSync(path.join(process.cwd(), 'static', 'collection.html'), 'utf8');
const body = /<body>([\s\S]*)<\/body>/.exec(html)?.[1]?.replace(/<script[\s\S]*?<\/script>/g, '') ?? '';

const el = <T extends HTMLElement = HTMLElement>(id: string): T => document.getElementById(id) as T;
const flush = async (ms = 0): Promise<void> => {
  for (let i = 0; i < 5; i++) await Promise.resolve();
  await new Promise((r) => setTimeout(r, ms));
};

const base = (tickets: number): Collection => ({ ...startCollection({ ...createPet('cat', 1), xp: 300 }, 1), tickets });
const view = (c: Collection, left = 5): CollectionView => buildCollectionView(c, left);
const pets = (): HTMLElement[] => [...document.querySelectorAll<HTMLElement>('#grid .pet')];
const pet = (id: string): HTMLElement => pets().find((p) => p.dataset['id'] === id)!;

const fillRect = vi.fn();
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

async function open(initial: CollectionView) {
  let current = initial;
  let refresh: () => void = () => {};
  const api = {
    get: vi.fn(async () => current),
    pullSpecies: vi.fn(),
    pullCosmetic: vi.fn(),
    switchTo: vi.fn(),
    onRefresh: (cb: () => void) => (refresh = cb),
    close: vi.fn(),
  };
  (window as unknown as { collectionApi: typeof api }).collectionApi = api;
  vi.resetModules();
  await import('./collection.js');
  await flush();
  return { api, refresh: () => refresh(), set: (v: CollectionView) => (current = v) };
}

describe('뽑기·컬렉션 창', () => {
  it('뽑기권, 가진 동물 수, 비용, 확률, 천장을 보여 준다', async () => {
    await open(view(base(5)));
    expect(el('tickets').textContent).toContain('5장');
    expect(el('owned-count').textContent).toContain('1/20');
    expect(el('pull-species').textContent).toContain('3장');
    expect(el('pull-cosmetic').textContent).toContain('2장');
    expect(el('chances').textContent).toContain('14종');
    expect(el('chances').textContent).toContain('1%');
    expect(el('pity').textContent).toContain('40번');
  });

  it('모든 동물 칸을 보여 준다: 가진 동물은 정보와 꺼내기, 없는 동물은 점선 칸이고 히든은 ???로 숨긴다', async () => {
    await open(view(base(0)));
    expect(pets()).toHaveLength(20);
    const cat = pet('cat');
    expect(cat.textContent).toContain('고양이');
    expect(cat.textContent).toContain('Lv.6');
    expect(cat.textContent).toContain('성체');
    expect(cat.classList.contains('active')).toBe(true);
    expect(cat.querySelector('button')!.disabled).toBe(true); // 키우는 중
    expect(cat.querySelector('button')!.textContent).toBe('키우는 중');
    expect(pet('dog').classList.contains('empty')).toBe(true);
    expect(pet('dog').textContent).toContain('강아지');
    expect(pet('dog').querySelector('button')).toBeNull();
    expect(pet('dragon').textContent).toContain('???');
    expect(pet('dragon').textContent).not.toContain('용');
    expect(pet('dragon').classList.contains('hidden-pet')).toBe(true);
  });

  it('뽑기권이 모자라면 뽑기 버튼이 막힌다', async () => {
    await open(view(base(1)));
    expect(el<HTMLButtonElement>('pull-species').disabled).toBe(true);
    expect(el<HTMLButtonElement>('pull-cosmetic').disabled).toBe(true);
    const { api } = await open(view(base(2)));
    expect(el<HTMLButtonElement>('pull-species').disabled).toBe(true);
    expect(el<HTMLButtonElement>('pull-cosmetic').disabled).toBe(false);
    el('pull-species').click();
    expect(api.pullSpecies).not.toHaveBeenCalled();
  });

  it('꾸미기를 다 모았으면 꾸미기 뽑기가 막힌다', async () => {
    await open(view(base(9), 0));
    expect(el<HTMLButtonElement>('pull-cosmetic').disabled).toBe(true);
    expect(el('pull-cosmetic').textContent).toContain('모두');
  });

  it('동물 뽑기: 누르면 연출을 하고, 결과(새 동물)와 늘어난 목록을 보여 준다', async () => {
    const after = pullSpecies(base(3), 2, () => 0.99).collection;
    const { api } = await open(view(base(3)));
    api.pullSpecies.mockResolvedValue({ ok: true, message: '부엉이(이)가 새로 왔어요!', id: 'owl', isNew: true, hidden: false, count: 1, view: view(after) });
    el('pull-species').click();
    await flush();
    expect(el('result').hidden).toBe(false);
    expect(el('result').classList.contains('shaking')).toBe(true);
    expect(el('result-text').textContent).toBe('뽑는 중…');
    await flush(1_000);
    expect(el('result').classList.contains('shaking')).toBe(false);
    expect(el('result-text').textContent).toContain('부엉이');
    expect(el('tickets').textContent).toContain('0장');
    expect(pet('owl').classList.contains('empty')).toBe(false);
    expect(pet('owl').querySelector('button')!.textContent).toBe('꺼내기');
    expect(fillRect).toHaveBeenCalled();
  });

  it('뽑고 나면 뽑기권·가진 수·천장·뽑은 횟수 문구가 새 값으로 바뀐다', async () => {
    const before = base(7);
    const after = pullSpecies(before, 2, () => 0.99).collection; // 부엉이
    const { api } = await open(view(before));
    expect(el('pity').textContent).toContain('40번 안에');
    expect(el('pity').textContent).toContain('지금까지 0번');
    expect(el('tickets').textContent).toContain('7장');
    expect(el('owned-count').textContent).toContain('1/20');
    api.pullSpecies.mockResolvedValue({ ok: true, message: '부엉이(이)가 새로 왔어요!', id: 'owl', isNew: true, hidden: false, count: 1, view: view(after) });
    el('pull-species').click();
    await flush(1_000);
    expect(el('pity').textContent).toContain('39번 안에');
    expect(el('pity').textContent).toContain('지금까지 1번');
    expect(el('tickets').textContent).toContain('4장');
    expect(el('owned-count').textContent).toContain('2/20');
  });

  it('뽑는 중에 새로고침 신호가 와도 연출이 끝난 뒤 최신 값으로 다시 맞춘다', async () => {
    const before = base(7);
    const after = pullSpecies(before, 2, () => 0.99).collection;
    const newer: Collection = { ...after, tickets: after.tickets + 2 }; // 뽑는 사이에 레벨 보상으로 뽑기권이 늘었다
    const { api, refresh, set } = await open(view(before));
    api.pullSpecies.mockResolvedValue({ ok: true, message: '부엉이(이)가 새로 왔어요!', id: 'owl', isNew: true, hidden: false, count: 1, view: view(after) });
    el('pull-species').click();
    await flush();
    set(view(newer));
    refresh(); // 연출 중이라 바로 반영하지 못한다
    await flush(1_000);
    expect(api.get).toHaveBeenCalledTimes(2); // 처음 한 번 + 연출이 끝난 뒤 한 번
    expect(el('tickets').textContent).toContain('6장');
  });

  it('히든이 나오면 특별한 모습으로 보여 준다', async () => {
    const after = pullSpecies(base(3), 2, () => 0).collection;
    const { api } = await open(view(base(3)));
    api.pullSpecies.mockResolvedValue({ ok: true, message: '용(이)가 새로 왔어요! ✨히든 동물!', id: 'dragon', isNew: true, hidden: true, count: 1, view: view(after) });
    el('pull-species').click();
    await flush(1_000);
    expect(el('result').classList.contains('win-hidden')).toBe(true);
    expect(pet('dragon').textContent).toContain('용');
  });

  it('실패하면(예: 뽑기권 부족) 이유만 보여 주고 목록은 그대로다', async () => {
    const { api } = await open(view(base(9)));
    api.pullCosmetic.mockResolvedValue({ ok: false, message: '꾸미기를 모두 모았어요!', view: view(base(9), 0) });
    el('pull-cosmetic').click();
    await flush(1_000);
    expect(el('result-text').textContent).toContain('모두 모았어요');
  });

  it('꺼내기를 누르면 그 동물만 메인에 보내고, 돌려받은 상태(키우는 중 표시)로 다시 그린다', async () => {
    const two = pullSpecies(base(3), 2, () => 0.99).collection;
    const { api } = await open(view(two));
    const switched: Collection = { ...two, active: 'owl' };
    api.switchTo.mockResolvedValue({ ok: true, message: '펭귄(을)를 꺼냈어요', view: view(switched) });
    pet('owl').querySelector('button')!.click();
    await flush();
    expect(api.switchTo).toHaveBeenCalledWith('owl');
    expect(pet('owl').classList.contains('active')).toBe(true);
    expect(pet('cat').classList.contains('active')).toBe(false);
    expect(pet('cat').querySelector('button')!.textContent).toBe('꺼내기');
    expect(el('result-text').textContent).toContain('꺼냈어요');
  });

  it('메인이 새로고침 신호를 보내면 다시 가져와 그린다(중복으로 쌓이지 않는다)', async () => {
    const { api, refresh, set } = await open(view(base(0)));
    set(view(base(7)));
    refresh();
    await flush();
    expect(api.get).toHaveBeenCalledTimes(2);
    expect(el('tickets').textContent).toContain('7장');
    expect(pets()).toHaveLength(20);
  });

  it('닫기 버튼과 Esc 로 닫는다', async () => {
    const { api } = await open(view(base(0)));
    el('close').click();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(api.close).toHaveBeenCalledTimes(2);
  });
});

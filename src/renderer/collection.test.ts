// @vitest-environment jsdom
import fs from 'node:fs';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { buildCollectionView, pullSpecies, startCollection, type Collection, type CollectionView } from '../shared/collection.js';
import { createPet } from '../shared/pet.js';

// 뽑기 창과 내 펫 창은 같은 스크립트를 쓴다. 시험에서는 두 화면을 함께 올려 놓고 본다.
const pageBody = (name: string): string => /<body>([\s\S]*)<\/body>/.exec(fs.readFileSync(path.join(process.cwd(), 'static', name), 'utf8'))?.[1]?.replace(/<script[\s\S]*?<\/script>/g, '') ?? '';
const body = pageBody('collection.html') + pageBody('pets.html');

const el = <T extends HTMLElement = HTMLElement>(id: string): T => document.getElementById(id) as T;
const flush = async (ms = 0): Promise<void> => {
  for (let i = 0; i < 5; i++) await Promise.resolve();
  await new Promise((r) => setTimeout(r, ms));
};

/** 뽑기 연출(룰렛)이 끝날 때까지 기다린다. 컴퓨터가 바쁠 때도 흔들리지 않게 시간을 고정하지 않고 상태를 본다. */
const settle = async (): Promise<void> => {
  for (let i = 0; i < 250; i++) {
    await new Promise((r) => setTimeout(r, 20));
    if (el('reel').hidden && el('result-text').textContent !== '뽑는 중…' && !el('result').classList.contains('shaking') && el('result-text').textContent !== '') return;
  }
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
  // "동작 줄이기"로 룰렛을 짧게 돌려, 시험이 오래 기다리지 않게 한다
  (window as unknown as { matchMedia: unknown }).matchMedia = () => ({ matches: true });
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
    expect(el('owned-count').textContent).toContain('1/28');
    expect(el('pull-species').textContent).toContain('3장');
    expect(el('pull-cosmetic').textContent).toContain('2장');
    expect(el('chances').textContent).toContain('일반 7종 각 7.1%');
    expect(el('chances').textContent).toContain('고급 3종 각 8%');
    expect(el('chances').textContent).toContain('히든 5종 각 0.20%');
    expect(el('chances').querySelectorAll('.grade')).toHaveLength(6);
    expect(el('pity').textContent).toContain('전설');
    expect(el('pity').textContent).toContain('50번');
  });

  it('내 펫 목록에는 가진 동물만 보여 주고, 키우는 동물이 정보와 함께 나온다(못 만난 동물은 도감에서 본다)', async () => {
    await open(view(base(0)));
    expect(pets()).toHaveLength(1);
    expect(pets()[0]!.dataset['id']).toBe('cat');
    const cat = pet('cat');
    expect(cat.textContent).toContain('고양이');
    expect(cat.textContent).toContain('Lv.6');
    expect(cat.textContent).toContain('성체');
    expect(cat.classList.contains('active')).toBe(true);
    expect(cat.querySelector('button')!.disabled).toBe(true); // 키우는 중
    expect(cat.querySelector('button')!.textContent).toBe('키우는 중');
    expect(pets().some((p) => p.dataset['id'] === 'dog')).toBe(false);
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
    const after = pullSpecies(base(3), 2, () => 0.75).collection;
    const { api } = await open(view(base(3)));
    // 서버 응답이 오기 전까지는 알이 흔들리며 "뽑는 중"이 보인다
    api.pullSpecies.mockImplementation(() => new Promise((r) => setTimeout(() => r({ ok: true, message: '부엉이(이)가 새로 왔어요!', id: 'owl', isNew: true, hidden: false, count: 1, view: view(after) }), 50)));
    el('pull-species').click();
    await flush();
    expect(el('result').hidden).toBe(false);
    expect(el('result').classList.contains('shaking')).toBe(true);
    expect(el('result-text').textContent).toBe('뽑는 중…');
    await settle();
    expect(el('result').classList.contains('shaking')).toBe(false);
    expect(el('result-text').textContent).toContain('부엉이');
    expect(el('tickets').textContent).toContain('0장');
    expect(pet('owl').classList.contains('empty')).toBe(false);
    expect(pet('owl').querySelector('button')!.textContent).toBe('꺼내기');
    expect(fillRect).toHaveBeenCalled();
  });

  it('뽑고 나면 뽑기권·가진 수·천장·뽑은 횟수 문구가 새 값으로 바뀐다', async () => {
    const before = base(7);
    const after = pullSpecies(before, 2, () => 0.75).collection; // 부엉이
    const { api } = await open(view(before));
    expect(el('pity').textContent).toContain('50번 안에');
    expect(el('pity').textContent).toContain('지금까지 0번');
    expect(el('tickets').textContent).toContain('7장');
    expect(el('owned-count').textContent).toContain('1/28');
    api.pullSpecies.mockResolvedValue({ ok: true, message: '부엉이(이)가 새로 왔어요!', id: 'owl', isNew: true, hidden: false, count: 1, view: view(after) });
    el('pull-species').click();
    await settle();
    expect(el('pity').textContent).toContain('49번 안에');
    expect(el('pity').textContent).toContain('지금까지 1번');
    expect(el('tickets').textContent).toContain('4장');
    expect(el('owned-count').textContent).toContain('2/28');
  });

  it('뽑는 중에 새로고침 신호가 와도 연출이 끝난 뒤 최신 값으로 다시 맞춘다', async () => {
    const before = base(7);
    const after = pullSpecies(before, 2, () => 0.75).collection;
    const newer: Collection = { ...after, tickets: after.tickets + 2 }; // 뽑는 사이에 레벨 보상으로 뽑기권이 늘었다
    const { api, refresh, set } = await open(view(before));
    api.pullSpecies.mockResolvedValue({ ok: true, message: '부엉이(이)가 새로 왔어요!', id: 'owl', isNew: true, hidden: false, count: 1, view: view(after) });
    el('pull-species').click();
    await flush();
    set(view(newer));
    refresh(); // 연출 중이라 바로 반영하지 못한다
    await settle();
    expect(api.get).toHaveBeenCalledTimes(2); // 처음 한 번 + 연출이 끝난 뒤 한 번
    expect(el('tickets').textContent).toContain('6장');
  });

  it('히든이 나오면 특별한 모습으로 보여 주고, 등급 이름이 무지개로 흐른다', async () => {
    const after = pullSpecies(base(3), 2, () => 0.995).collection; // 현무
    const { api } = await open(view(base(3)));
    api.pullSpecies.mockResolvedValue({ ok: true, message: '', id: 'tortoise', rarity: 'hidden', isNew: true, hidden: true, count: 1, view: view(after) });
    el('pull-species').click();
    await settle();
    expect(el('result').classList.contains('win-hidden')).toBe(true);
    expect(pet('tortoise').textContent).toContain('현무');
    expect(el('result-text').textContent).toBe('현무가 나왔어요! (히든) ✨ 새로 왔어요!');
    expect(el('result-text').querySelector('.grade-hidden')!.textContent).toBe('히든');
  });

  it('결과 문구는 "~가 나왔어요! (등급)" 이고 등급마다 색 클래스가 붙으며, 받침에 따라 이/가가 바뀐다', async () => {
    const cases: Array<[string, string, string, string]> = [['rabbit', 'common', '토끼가', 'common'], ['bear', 'uncommon', '곰이', 'uncommon'], ['owl', 'rare', '부엉이가', 'rare'], ['panda', 'special', '판다가', 'special'], ['dragon', 'legend', '용이', 'legend']];
    // 한 화면에서 여러 번 뽑으면 앞 결과가 남아 있으니, 케이스마다 새로 연다
    for (const [id, rarity, who, cls] of cases) {
      document.body.innerHTML = body;
      const after = base(3);
      const { api } = await open(view(base(3)));
      api.pullSpecies.mockResolvedValue({ ok: true, message: '', id, rarity, isNew: false, hidden: false, count: 2, view: view(after) });
      el('pull-species').click();
      await settle();
      expect(el('result-text').textContent, id).toContain(`${who} 나왔어요!`);
      expect(el('result-text').querySelector(`.grade-${cls}`), id).not.toBeNull();
      expect(el('result-text').textContent, id).toContain('2번째');
    }
    expect(el('result').classList.contains('win-legend')).toBe(true);
  });

  it('실패하면(예: 뽑기권 부족) 이유만 보여 주고 목록은 그대로다', async () => {
    const { api } = await open(view(base(9)));
    api.pullCosmetic.mockResolvedValue({ ok: false, message: '꾸미기를 모두 모았어요!', view: view(base(9), 0) });
    el('pull-cosmetic').click();
    await settle();
    expect(el('result-text').textContent).toContain('모두 모았어요');
  });

  it('꺼내기를 누르면 그 동물만 메인에 보내고, 돌려받은 상태(키우는 중 표시)로 다시 그린다', async () => {
    const two = pullSpecies(base(3), 2, () => 0.75).collection;
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
    expect(pets()).toHaveLength(1);
  });

  it('닫기 버튼과 Esc 로 닫는다', async () => {
    const { api } = await open(view(base(0)));
    el('close').click();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(api.close).toHaveBeenCalledTimes(2);
  });
});

describe('뽑기 룰렛', () => {
  it('결과 칸이 정해진 자리에 놓이고, 지나가는 칸은 동물 모습(히든도 ???가 아님)이며 희귀도 표시가 있다', async () => {
    const { buildReel } = await import('./collection.js');
    const entries = view(base(0)).entries;
    const owl = entries.find((e) => e.id === 'owl')!;
    const result = { ok: true as const, message: '', view: view(base(0)), id: 'owl' as const, isNew: true, hidden: false, count: 1 };
    const { items, final } = buildReel(result, entries);
    expect(items.length).toBeGreaterThan(final + 2);
    expect(items[final]!.rarity).toBe(owl.hidden ? 'hidden' : 'common');
    expect(items.every((i) => i.rows.length > 0)).toBe(true);
    const dragon = buildReel({ ...result, id: 'dragon' as const, hidden: true }, entries);
    expect(dragon.items[dragon.final]!.rarity).toBe('hidden');
  });

  it('동물 뽑기를 하면 룰렛이 칸을 만들고 끝나면 결과 그림이 다시 보인다', async () => {
    const after = pullSpecies(base(3), 2, () => 0.75).collection;
    const { api } = await open(view(base(3)));
    api.pullSpecies.mockResolvedValue({ ok: true, message: '부엉이(이)가 새로 왔어요!', id: 'owl', isNew: true, hidden: false, count: 1, view: view(after) });
    el('pull-species').click();
    await flush(100);
    expect(el('strip').children.length).toBeGreaterThan(10);
    expect(el('strip').querySelector('.final')).not.toBeNull();
    await settle();
    expect(el('reel').hidden).toBe(true);
    expect(el<HTMLCanvasElement>('result-canvas').hidden).toBe(false);
  });
});

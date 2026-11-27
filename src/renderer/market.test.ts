// @vitest-environment jsdom
import fs from 'node:fs';
import path from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const html = fs.readFileSync(path.join(process.cwd(), 'static', 'market.html'), 'utf8');
const body = /<body>([\s\S]*)<\/body>/.exec(html)![1]!.replace(/<script[\s\S]*?<\/script>/g, '');

const listing = { listing_id: 'l1', price: 120, species_id: 'dragon', species_name: '드래곤', rarity: 'hidden', level: 11, seller_login: '<b>hax</b>', is_mine: false };
const pet = (o: Partial<{ pet_id: string; listing_id: string | null; price: number | null }> = {}) => ({
  pet_id: 'p1', species_id: 'cat', species_name: '고양이', rarity: 'common', level: 3, equipped: true, listing_id: null, price: null, ...o,
});
const tick = () => new Promise((r) => setTimeout(r, 0));

async function mount(view: unknown, extra: Record<string, unknown> = {}) {
  vi.resetModules();
  document.body.innerHTML = body;
  const api = { get: vi.fn().mockResolvedValue(view), buy: vi.fn(), sell: vi.fn(), cancel: vi.fn(), close: vi.fn(), ...extra };
  (window as unknown as { marketApi: unknown }).marketApi = api;
  await import('./market.js');
  await tick();
  return api;
}

describe('경매장 화면', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('남이 쓴 이름은 글자로만 보여 준다', async () => {
    await mount({ ok: true, coins: 500, listings: [listing], pets: [] });
    expect(document.querySelector('#list')!.innerHTML).not.toContain('<b>');
    expect(document.querySelector('#list')!.textContent).toContain('<b>hax</b>');
    expect(document.querySelector('#wallet')!.textContent).toContain('500');
  });

  it('게임머니가 모자라면 사기 버튼이 꺼져 있고, 충분하면 눌러서 산다', async () => {
    await mount({ ok: true, coins: 100, listings: [listing], pets: [] });
    expect((document.querySelector('#list button') as HTMLButtonElement).disabled).toBe(true);
    const buy = vi.fn().mockResolvedValue({ ok: true, message: '샀어요', view: { ok: true, coins: 380, listings: [], pets: [] } });
    await mount({ ok: true, coins: 500, listings: [listing], pets: [] }, { buy });
    (document.querySelector('#list button') as HTMLButtonElement).click();
    await tick();
    expect(buy).toHaveBeenCalledWith('l1');
    expect(document.querySelector('#note')!.textContent).toBe('샀어요');
  });

  it('마지막 한 마리는 팔기 버튼이 꺼진다', async () => {
    await mount({ ok: true, coins: 0, listings: [], pets: [pet()] });
    (document.querySelector('[data-tab="mine"]') as HTMLButtonElement).click();
    expect((document.querySelector('#list button') as HTMLButtonElement).disabled).toBe(true);
  });

  it('펫이 둘이면 가격을 적어 판다', async () => {
    const both = [pet(), pet({ pet_id: 'p2' })];
    const sell = vi.fn().mockResolvedValue({ ok: true, message: '올렸어요', view: { ok: true, coins: 0, listings: [], pets: both } });
    await mount({ ok: true, coins: 0, listings: [], pets: both }, { sell });
    (document.querySelector('[data-tab="mine"]') as HTMLButtonElement).click();
    (document.querySelector('#list input') as HTMLInputElement).value = '250';
    (document.querySelector('#list button') as HTMLButtonElement).click();
    await tick();
    expect(sell).toHaveBeenCalledWith('p1', 250);
  });

  it('판매 중인 펫은 내리기 버튼으로 내린다', async () => {
    const cancel = vi.fn().mockResolvedValue({ ok: true, message: '내렸어요', view: { ok: true, coins: 0, listings: [], pets: [] } });
    await mount({ ok: true, coins: 0, listings: [], pets: [pet(), pet({ pet_id: 'p2', listing_id: 'l9', price: 77 })] }, { cancel });
    (document.querySelector('[data-tab="mine"]') as HTMLButtonElement).click();
    const buttons = [...document.querySelectorAll('#list button')] as HTMLButtonElement[];
    buttons.find((b) => b.textContent === '내리기')!.click();
    await tick();
    expect(cancel).toHaveBeenCalledWith('l9');
  });

  it('서버에 닿지 않으면 안내만 보여 준다', async () => {
    await mount({ ok: false, message: '로그인하면 볼 수 있어요', coins: 0, listings: [], pets: [] });
    expect(document.querySelector('#note')!.textContent).toBe('로그인하면 볼 수 있어요');
  });
});

// @vitest-environment jsdom
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { localize, setUiLang, translateUi } from './dom-i18n.js';

const body = (name: string): string => /<body>([\s\S]*)<\/body>/.exec(fs.readFileSync(path.join(process.cwd(), 'static', name), 'utf8'))![1]!.replace(/<script[\s\S]*?<\/script>/g, '');
const tick = () => new Promise((r) => setTimeout(r, 0));

describe('창 화면 영어 전환', () => {
  it('사전·규칙·" · " 조각 순서로 번역하고, 모르는 말은 그대로 둔다', () => {
    expect(translateUi('경매장')).toBe('Auction house');
    expect(translateUi('내 게임머니: 1,250 게임머니')).toBe('Game money: 1,250');
    expect(translateUi('히든 · 판매자 kim')).toBe('Hidden · seller kim');
    expect(translateUi('일반 · 지금 키우는 펫 · 판매 중')).toBe('Common · Current pet · Listed');
    expect(translateUi('3위')).toBe('#3');
    expect(translateUi('내 기록: 12종 · 4위')).toBe('My record: 12 species · #4');
    expect(translateUi('20분')).toBe('20 min');
    expect(translateUi('알 수 없는 문장')).toBe('알 수 없는 문장');
  });

  it('설정 창 HTML 을 영어로 바꾸고 한국어로 되돌린다(입력칸은 그대로)', () => {
    document.body.innerHTML = body('settings.html');
    const box = document.getElementById('inspectEnabled') as HTMLInputElement;
    setUiLang('en');
    localize();
    expect(document.querySelector('h1')?.textContent).toBe('Settings');
    expect(document.body.textContent).toContain('Find missed basics on open localhost pages');
    expect(document.getElementById('petScale')?.getAttribute('aria-label')).toBe('Pet size');
    expect(document.getElementById('inspectEnabled')).toBe(box); // 입력칸이 지워지지 않았다
    setUiLang('ko');
    localize();
    expect(document.querySelector('h1')?.textContent).toBe('설정');
    expect(document.getElementById('petScale')?.getAttribute('aria-label')).toBe('펫 크기');
  });

  it('경매장 창이 영어로 그려진다', async () => {
    vi.resetModules();
    document.body.innerHTML = body('market.html');
    const view = { ok: true, coins: 500, listings: [{ listing_id: 'l1', price: 120, species_id: 'cat', species_name: '고양이', rarity: 'hidden', level: 3, seller_login: 'kim', is_mine: false }], pets: [] };
    (window as unknown as { marketApi: unknown }).marketApi = { get: vi.fn().mockResolvedValue(view), buy: vi.fn(), sell: vi.fn(), cancel: vi.fn(), close: vi.fn(), lang: vi.fn().mockResolvedValue('en') };
    await import('./market.js');
    await tick();
    await tick();
    expect(document.getElementById('wallet')?.textContent).toBe('Game money: 500');
    expect(document.getElementById('list')?.textContent).toContain('Hidden · seller kim');
    expect(document.getElementById('list')?.textContent).toContain('120 game money');
    expect(document.getElementById('list')?.textContent).toContain('Cat Lv.3');
    expect(document.querySelector('#tabs button')?.textContent).toBe('Buy');
    setUiLang('ko');
  });
});

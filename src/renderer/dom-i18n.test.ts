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
    expect(translateUi('확인했어요 (+5)')).toBe('Got it (+5)');
    expect(translateUi('정답이에요! (+3 보너스) Good.')).toBe('Correct! (+3 bonus) Good.');
    expect(translateUi('아쉬워요. Because.')).toBe('Not quite. Because.');
    expect(translateUi('무엇이 문제인가요?')).toBe('What is the problem?');
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

const hangul = /[가-힣]/;
describe('모든 창의 고정 글자가 영어에서 한글 없이 나온다', () => {
  it.each(['settings.html', 'market.html', 'ranking.html', 'card.html', 'codex.html', 'collection.html', 'results.html', 'wardrobe.html', 'friends.html', 'index.html'])('%s', (name) => {
    document.body.innerHTML = body(name);
    setUiLang('en');
    localize();
    const leftovers: string[] = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      if (n.nodeType === Node.TEXT_NODE) {
        if (hangul.test(n.textContent ?? '') && n.parentElement?.tagName !== 'SCRIPT') leftovers.push((n.textContent ?? '').trim());
      } else {
        for (const a of ['aria-label', 'placeholder', 'title']) {
          const v = (n as Element).getAttribute(a);
          if (v && hangul.test(v)) leftovers.push(`${a}=${v}`);
        }
      }
    }
    // 언어 선택 칸은 한/영을 함께 적어 둔 것이라 제외한다
    expect(leftovers.filter((t) => !t.includes('Language') && !t.includes('Default follows'))).toEqual([]);
    setUiLang('ko');
    localize();
  });

  it('업적 이름·설명, 규칙 제목·고치는 법, 등급·장식 이름이 번역된다', async () => {
    const { ACHIEVEMENTS } = await import('../shared/growth.js');
    const { LESSONS, RULE_IDS } = await import('../shared/lessons.js');
    for (const a of ACHIEVEMENTS) {
      expect(translateUi(a.name), a.id).not.toMatch(hangul);
      expect(translateUi(a.description), a.id).not.toMatch(hangul);
    }
    for (const id of RULE_IDS) {
      expect(translateUi(LESSONS[id].title), id).not.toMatch(hangul);
      expect(translateUi(LESSONS[id].fix), id).not.toMatch(hangul);
    }
    expect(translateUi('🔒 왕관')).toBe('🔒 Crown');
    expect(translateUi("업적 '도감 완성' 달성하거나 꾸미기 뽑기로 얻어요")).toContain("'Codex complete'");
    expect(translateUi(' · 확인 3회 · 고침 1회')).toContain('Confirmed 3×');
    expect(translateUi('새 문제 2 · 확인함 1 · 나중에 0 · 무시함 3 · 규칙 꺼짐 1')).toBe('New 2 · Confirmed 1 · Later 0 · Ignored 3 · Rule off 1');
  });
});

describe('직접 지은 이름은 번역하지 않는다', () => {
  it('data-no-translate 아래의 글자는 영어 모드에서도 그대로고, 종 이름은 번역된다', () => {
    document.body.innerHTML = '<div><span id="mine" data-no-translate>토끼</span> <span id="species">토끼</span> <b data-no-translate><i id="deep">고양이</i></b></div>';
    setUiLang('en');
    localize();
    expect(document.getElementById('mine')?.textContent).toBe('토끼'); // 사용자가 '토끼'라고 이름 붙인 펫
    expect(document.getElementById('species')?.textContent).toBe('Rabbit');
    expect(document.getElementById('deep')?.textContent).toBe('고양이');
    setUiLang('ko');
    localize();
  });
});

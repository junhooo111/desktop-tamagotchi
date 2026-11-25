// @vitest-environment jsdom
import fs from 'node:fs';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ACHIEVEMENTS, applyEvent, buildCodex, emptyGrowth, type CodexView } from '../shared/growth.js';
import { RULE_IDS } from '../shared/lessons.js';

const html = fs.readFileSync(path.join(process.cwd(), 'static', 'codex.html'), 'utf8');
const body = /<body>([\s\S]*)<\/body>/.exec(html)?.[1]?.replace(/<script[\s\S]*?<\/script>/g, '') ?? '';

const el = <T extends HTMLElement = HTMLElement>(id: string): T => document.getElementById(id) as T;
const flush = async (): Promise<void> => {
  for (let i = 0; i < 5; i++) await Promise.resolve();
  await new Promise((r) => setTimeout(r, 0));
};
const day = (d: number): number => new Date(2026, 10, d, 12).getTime();

function sample(): CodexView {
  let g = emptyGrowth();
  const ctx = { tipsSeen: 3 };
  g = applyEvent(g, { kind: 'confirm', ruleId: 'img-alt', correct: true }, day(24), ctx).growth;
  g = applyEvent(g, { kind: 'confirm', ruleId: 'contrast', correct: false }, day(25), ctx).growth;
  g = applyEvent(g, { kind: 'fix', ruleId: 'contrast' }, day(25), ctx).growth;
  return buildCodex(g, ctx, day(25));
}

async function open(view: CodexView) {
  let refresh: () => void = () => {};
  const api = { get: vi.fn(async () => view), onRefresh: (cb: () => void) => (refresh = cb), close: vi.fn() };
  (window as unknown as { codexApi: typeof api }).codexApi = api;
  vi.resetModules();
  await import('./codex.js');
  await flush();
  return { api, refresh: () => refresh() };
}

// document 는 테스트 사이에 이어지므로, 앞선 테스트에서 붙은 리스너가 다음 테스트에 섞이지 않게 정리한다.
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

describe('도감·기록 창', () => {
  it('기록 타일에 연속 사용·최고 연속·함께한 날·배운 종류·읽은 지식·고친 문제를 보여 준다', async () => {
    await open(sample());
    const tiles = [...el('records').querySelectorAll('.tile')].map((t) => t.textContent);
    expect(tiles).toHaveLength(6);
    expect(tiles[0]).toContain('2일'); // 24일, 25일 연속
    expect(tiles[2]).toContain('2일'); // 함께한 날
    expect(tiles[3]).toContain(`2/${RULE_IDS.length}`);
    expect(tiles[4]).toContain('3/');
    expect(tiles[5]).toContain('1');
  });

  it('도감: 규칙 수만큼 그리고, 못 배운 것은 이름을 숨기고, 배운 것·고친 것은 상태를 구분한다', async () => {
    await open(sample());
    const items = [...el('rules').querySelectorAll('li')];
    expect(items).toHaveLength(RULE_IDS.length);
    const byStatus = (s: string) => items.filter((li) => li.dataset['status'] === s);
    expect(byStatus('learned')).toHaveLength(1);
    expect(byStatus('fixed')).toHaveLength(1);
    expect(byStatus('unseen')).toHaveLength(RULE_IDS.length - 2);
    expect(byStatus('unseen')[0]?.textContent).toContain('???');
    expect(byStatus('fixed')[0]?.textContent).toContain('고침 1회');
    expect(el('rules-count').textContent).toBe(`2 / ${RULE_IDS.length}`);
  });

  it('업적: 모두 그리고, 달성한 것은 표시하고, 진행도 막대를 목표 비율로 채운다', async () => {
    await open(sample());
    const items = [...el('achievements').querySelectorAll('li')];
    expect(items).toHaveLength(ACHIEVEMENTS.length);
    const first = items.find((li) => li.textContent?.includes('첫 배움'));
    expect(first?.dataset['unlocked']).toBe('true');
    expect(first?.querySelector('.badge')?.textContent).toBe('달성');
    const c10 = items.find((li) => li.textContent?.includes('열심히 배우는 중'));
    expect(c10?.dataset['unlocked']).toBe('false');
    expect(c10?.querySelector('.badge')?.textContent).toBe('+15 XP');
    expect((c10?.querySelector('.bar i') as HTMLElement).style.width).toBe('20%'); // 2 / 10
    expect(el('ach-count').textContent).toMatch(/^\d+ \/ \d+$/);
  });

  it('글자를 HTML 로 해석하지 않는다', async () => {
    const view = sample();
    view.achievements[0]!.name = '<img src=x onerror=alert(1)>';
    await open(view);
    expect(el('achievements').querySelector('img')).toBeNull();
    expect(el('achievements').textContent).toContain('<img src=x onerror=alert(1)>');
  });

  it('메인이 새로고침 신호를 보내면 다시 가져와 그린다', async () => {
    const { api, refresh } = await open(sample());
    expect(api.get).toHaveBeenCalledTimes(1);
    refresh();
    await flush();
    expect(api.get).toHaveBeenCalledTimes(2);
    expect(el('rules').querySelectorAll('li')).toHaveLength(RULE_IDS.length); // 중복으로 쌓이지 않는다
  });

  it('닫기 버튼과 Esc 로 닫는다', async () => {
    const { api } = await open(sample());
    el('close').click();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(api.close).toHaveBeenCalledTimes(2);
  });
});

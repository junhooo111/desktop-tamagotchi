// @vitest-environment jsdom
import fs from 'node:fs';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CATEGORY_LABELS, LESSONS, RULE_IDS } from '../shared/lessons.js';
import { DEFAULT_SETTINGS, SETTING_CHOICES, type Settings } from '../shared/settings.js';

const html = fs.readFileSync(path.join(process.cwd(), 'static', 'settings.html'), 'utf8');
const body = /<body>([\s\S]*)<\/body>/.exec(html)?.[1]?.replace(/<script[\s\S]*?<\/script>/g, '') ?? '';

const el = <T extends HTMLElement = HTMLElement>(id: string): T => document.getElementById(id) as T;
const flush = async (): Promise<void> => {
  for (let i = 0; i < 5; i++) await Promise.resolve();
  await new Promise((r) => setTimeout(r, 0));
};
const pressed = (id: string): string[] =>
  [...el(id).querySelectorAll('button')].filter((b) => b.getAttribute('aria-pressed') === 'true').map((b) => b.textContent ?? '');

async function open(initial: Settings = DEFAULT_SETTINGS) {
  let current = initial;
  let onStatus: (t: string) => void = () => {};
  const api = {
    get: vi.fn(async () => current),
    // 메인처럼 합쳐서 저장된 전체 설정을 돌려준다
    set: vi.fn(async (patch: Partial<Settings>) => (current = { ...current, ...patch } as Settings)),
    version: vi.fn(async () => '0.4.0'),
    checkUpdate: vi.fn(async () => '최신 버전이에요'),
    onUpdateStatus: (cb: (t: string) => void) => (onStatus = cb),
    close: vi.fn(),
  };
  (window as unknown as { settingsApi: typeof api }).settingsApi = api;
  vi.resetModules();
  await import('./settings.js');
  await flush();
  return { api, status: (t: string) => onStatus(t) };
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

describe('설정 창', () => {
  it('선택지를 모두 그리고, 지금 설정을 눌린 상태로 보여 준다', async () => {
    await open();
    expect([...el('petScale').querySelectorAll('button')].map((b) => b.textContent)).toEqual(['1배 (커서 크기)', '2배', '3배']);
    expect(el('scanSeconds').querySelectorAll('button')).toHaveLength(SETTING_CHOICES.scanSeconds.length);
    expect(el('tipMinutes').querySelectorAll('button')).toHaveLength(SETTING_CHOICES.tipMinutes.length);
    expect(pressed('petScale')).toEqual(['1배 (커서 크기)']);
    expect(pressed('scanSeconds')).toEqual(['10초']);
    expect(pressed('tipMinutes')).toEqual(['20분']);
    expect(el<HTMLInputElement>('inspectEnabled').checked).toBe(true);
    expect(el<HTMLInputElement>('autoUpdate').checked).toBe(true);
    expect(el('version').textContent).toBe('버전 0.4.0');
  });

  it('선택지를 누르면 그 값만 메인에 보내고, 돌려받은 설정으로 다시 그린다', async () => {
    const { api } = await open();
    (el('petScale').querySelectorAll('button')[2] as HTMLButtonElement).click();
    await flush();
    expect(api.set).toHaveBeenCalledWith({ petScale: 3 });
    expect(pressed('petScale')).toEqual(['3배']);
    (el('tipMinutes').querySelectorAll('button')[0] as HTMLButtonElement).click(); // 끄기
    await flush();
    expect(api.set).toHaveBeenLastCalledWith({ tipMinutes: 0 });
    expect(pressed('tipMinutes')).toEqual(['끄기']);
  });

  it('체크박스를 바꾸면 그 항목만 보낸다', async () => {
    const { api } = await open();
    const box = el<HTMLInputElement>('autoUpdate');
    box.checked = false;
    box.dispatchEvent(new Event('change'));
    await flush();
    expect(api.set).toHaveBeenCalledWith({ autoUpdate: false });
  });

  it('공지 체크박스는 기본으로 켜져 있고, 바꾸면 그 항목만 보낸다', async () => {
    const { api } = await open();
    const box = el<HTMLInputElement>('showNews');
    expect(box.checked).toBe(true);
    box.checked = false;
    box.dispatchEvent(new Event('change'));
    await flush();
    expect(api.set).toHaveBeenCalledWith({ showNews: false });
  });

  it('검사를 끄면 검사 주기 선택이 비활성이 되고, 다시 켜면 풀린다', async () => {
    await open({ ...DEFAULT_SETTINGS, inspectEnabled: false });
    expect([...el('scanSeconds').querySelectorAll('button')].every((b) => (b as HTMLButtonElement).disabled)).toBe(true);
    const box = el<HTMLInputElement>('inspectEnabled');
    box.checked = true;
    box.dispatchEvent(new Event('change'));
    await flush();
    expect([...el('scanSeconds').querySelectorAll('button')].some((b) => (b as HTMLButtonElement).disabled)).toBe(false);
  });

  it('업데이트 확인을 누르면 결과 문구를 보여 주고, 메인이 보내는 진행 상태도 반영한다', async () => {
    const { api, status } = await open();
    el('check-update').click();
    expect(el('update-status').textContent).toBe('확인하는 중…');
    await flush();
    expect(api.checkUpdate).toHaveBeenCalledTimes(1);
    expect(el('update-status').textContent).toBe('최신 버전이에요');
    status('새 버전 0.5.0 을 받는 중이에요');
    expect(el('update-status').textContent).toBe('새 버전 0.5.0 을 받는 중이에요');
  });

  it('닫기 버튼과 Esc 로 닫는다', async () => {
    const { api } = await open();
    el('close').click();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(api.close).toHaveBeenCalledTimes(2);
  });

  describe('검사할 규칙', () => {
    const boxes = (): HTMLInputElement[] => [...el('rules').querySelectorAll('input[type="checkbox"]')] as HTMLInputElement[];

    it('모든 규칙을 분류별로 묶어 체크박스로 보여 주고, 켜 둔 규칙은 체크되어 있다', async () => {
      await open({ ...DEFAULT_SETTINGS, disabledRules: ['contrast'] });
      expect(boxes()).toHaveLength(RULE_IDS.length);
      expect([...el('rules').querySelectorAll('h3')].map((h) => h.textContent)).toEqual(Object.values(CATEGORY_LABELS));
      const byRule = Object.fromEntries(boxes().map((b) => [b.dataset['rule'], b.checked]));
      expect(byRule['contrast']).toBe(false);
      expect(byRule['img-alt']).toBe(true);
      expect(el('rules').textContent).toContain(LESSONS['img-alt'].title);
    });

    it('체크를 해제하면 꺼 둔 규칙 목록에 그 규칙이 더해져서 메인에 간다', async () => {
      const { api } = await open({ ...DEFAULT_SETTINGS, disabledRules: ['contrast'] });
      const box = boxes().find((b) => b.dataset['rule'] === 'img-alt')!;
      box.checked = false;
      box.dispatchEvent(new Event('change'));
      await flush();
      expect(api.set).toHaveBeenCalledWith({ disabledRules: ['img-alt', 'contrast'] });
    });

    it('다시 체크하면 목록에서 빠지고, "모두 켜기"는 목록을 비운다', async () => {
      const { api } = await open({ ...DEFAULT_SETTINGS, disabledRules: ['img-alt', 'contrast'] });
      const box = boxes().find((b) => b.dataset['rule'] === 'img-alt')!;
      box.checked = true;
      box.dispatchEvent(new Event('change'));
      await flush();
      expect(api.set).toHaveBeenLastCalledWith({ disabledRules: ['contrast'] });
      el('rules-all-on').click();
      await flush();
      expect(api.set).toHaveBeenLastCalledWith({ disabledRules: [] });
      expect(boxes().every((b) => b.checked)).toBe(true);
    });
  });
});

// @vitest-environment jsdom
import fs from 'node:fs';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BUBBLE_GAP, WINDOW, petPixelSize } from '../shared/layout.js';
import type { PetView, TipBubble } from '../shared/view.js';

const html = fs.readFileSync(path.join(process.cwd(), 'static', 'index.html'), 'utf8');
const body = /<body>([\s\S]*)<\/body>/.exec(html)?.[1]?.replace(/<script[\s\S]*?<\/script>/g, '') ?? '';

const el = (id: string): HTMLElement => document.getElementById(id) as HTMLElement;
const flush = async (): Promise<void> => {
  await Promise.resolve();
  await Promise.resolve();
};

const view = (over: Partial<PetView> = {}): PetView => ({
  speciesId: 'cat',
  stage: 'adult',
  level: 5,
  mood: 'happy',
  mode: 'idle',
  surface: 'floor',
  dir: 'right',
  play: 'hop',
  since: 0,
  bubbleShift: 0,
  ...over,
});

const tip: TipBubble = { title: '지식 제목', body: '지식 본문', code: 'const a = 1;', xp: 2 };

interface Harness {
  api: {
    getView: ReturnType<typeof vi.fn>;
    act: ReturnType<typeof vi.fn>;
    setInteractive: ReturnType<typeof vi.fn>;
    drag: ReturnType<typeof vi.fn>;
    contextMenu: ReturnType<typeof vi.fn>;
    tipConfirm: ReturnType<typeof vi.fn>;
  };
  emitView: (v: PetView) => void;
  emitSay: (t: string) => void;
  emitTip: (t: TipBubble | null) => void;
}

async function start(initial: PetView = view()): Promise<Harness> {
  let onView: (v: PetView) => void = () => {};
  let onSay: (t: string) => void = () => {};
  let onTip: (t: TipBubble | null) => void = () => {};
  const api = {
    getView: vi.fn(async () => initial),
    act: vi.fn(async () => true),
    setInteractive: vi.fn(),
    drag: vi.fn(),
    contextMenu: vi.fn(),
    tipConfirm: vi.fn(),
    onView: (cb: (v: PetView) => void) => (onView = cb),
    onSay: (cb: (t: string) => void) => (onSay = cb),
    onTip: (cb: (t: TipBubble | null) => void) => (onTip = cb),
  };
  (window as unknown as { petApi: typeof api }).petApi = api;
  vi.resetModules();
  await import('./renderer.js');
  await flush();
  return { api, emitView: (v) => onView(v), emitSay: (t) => onSay(t), emitTip: (t) => onTip(t) };
}

/** 지식 말풍선의 화면 위치를 흉내 낸다(jsdom 은 레이아웃을 계산하지 않는다). */
function placeTip(rect: { left: number; top: number; right: number; bottom: number }): void {
  vi.spyOn(el('tip'), 'getBoundingClientRect').mockReturnValue({
    ...rect,
    x: rect.left,
    y: rect.top,
    width: rect.right - rect.left,
    height: rect.bottom - rect.top,
    toJSON: () => ({}),
  });
}

// document 는 테스트 사이에 이어지므로, 앞선 테스트에서 붙은 리스너가 다음 테스트에 섞이지 않게 정리한다.
const attached: [string, EventListenerOrEventListenerObject][] = [];

beforeEach(() => {
  vi.useFakeTimers();
  const original = document.addEventListener.bind(document);
  vi.spyOn(document, 'addEventListener').mockImplementation((type: string, listener: EventListenerOrEventListenerObject) => {
    attached.push([type, listener]);
    original(type, listener);
  });
  document.body.innerHTML = body;
  document.documentElement.style.removeProperty('--shift');
  const ctx = { clearRect: vi.fn(), fillRect: vi.fn(), fillStyle: '', imageSmoothingEnabled: true };
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(ctx as unknown as CanvasRenderingContext2D);
});

afterEach(() => {
  for (const [type, listener] of attached.splice(0)) document.removeEventListener(type, listener);
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('시작', () => {
  it('캔버스를 창 크기로 맞추고 첫 화면을 그린 뒤 준비 완료를 알린다', async () => {
    await start();
    const canvas = el('pet') as HTMLCanvasElement;
    expect([canvas.width, canvas.height]).toEqual([WINDOW.width, WINDOW.height]);
    expect((window as unknown as { __petReady?: boolean }).__petReady).toBe(true);
    expect(el('tip').hidden).toBe(true);
  });

  it('말풍선은 펫 머리 위(펫 높이 + 간격)에 붙는다', async () => {
    await start(view({ stage: 'adult' }));
    const petTop = WINDOW.height - petPixelSize('adult');
    expect(el('tip').style.bottom).toBe(`${WINDOW.height - petTop + BUBBLE_GAP}px`);
  });
});

describe('FE 지식 말풍선', () => {
  it('지식이 오면 제목·본문·코드와 경험치가 적힌 확인 버튼을 보여 준다', async () => {
    const h = await start();
    h.emitTip(tip);
    expect(el('tip').hidden).toBe(false);
    expect(el('tip-title').textContent).toBe('지식 제목');
    expect(el('tip-body').textContent).toBe('지식 본문');
    expect(el('tip-code').textContent).toBe('const a = 1;');
    expect(el('tip-ok').textContent).toBe('확인 (+2)');
  });

  it('이미 읽은 지식은 경험치 표시 없이 확인만 보인다', async () => {
    const h = await start();
    h.emitTip({ ...tip, xp: 0 });
    expect(el('tip-ok').textContent).toBe('확인');
  });

  it('확인을 누르면 메인에 알리고 말풍선이 사라진다', async () => {
    const h = await start();
    h.emitTip(tip);
    el('tip-ok').click();
    expect(h.api.tipConfirm).toHaveBeenCalledTimes(1);
    expect(el('tip').hidden).toBe(true);
  });

  it('null 이 오면(시간 초과·다른 곳에서 확인) 말풍선을 거둔다', async () => {
    const h = await start();
    h.emitTip(tip);
    h.emitTip(null);
    expect(el('tip').hidden).toBe(true);
  });

  it('글자를 HTML 로 해석하지 않는다', async () => {
    const h = await start();
    h.emitTip({ ...tip, title: '<img src=x onerror=alert(1)>', body: '<b>굵게</b>' });
    expect(el('tip-title').textContent).toBe('<img src=x onerror=alert(1)>');
    expect(el('tip').querySelector('img')).toBeNull();
    expect(el('tip-body').querySelector('b')).toBeNull();
  });

  it('지식 말풍선이 있으면 한마디 말풍선은 그 위에 선다', async () => {
    const h = await start();
    placeTip({ left: 20, top: 60, right: 260, bottom: 240 });
    h.emitTip(tip);
    h.emitSay('좋아요!');
    expect(el('bubble').textContent).toBe('좋아요!');
    expect(el('bubble').style.bottom).toBe(`${WINDOW.height - 60 + 8}px`);
  });

  it('화면 가장자리에서 잘리지 않도록 옆으로 미는 거리를 반영한다', async () => {
    const h = await start();
    h.emitView(view({ bubbleShift: 70 }));
    expect(document.documentElement.style.getPropertyValue('--shift')).toBe('70px');
    h.emitView(view({ bubbleShift: -40 }));
    expect(document.documentElement.style.getPropertyValue('--shift')).toBe('-40px');
  });
});

describe('클릭 통과', () => {
  const move = (x: number, y: number): void => {
    document.dispatchEvent(new MouseEvent('mousemove', { clientX: x, clientY: y, bubbles: true }));
  };
  const petX = Math.round(WINDOW.width / 2);
  const petY = WINDOW.height - 10;

  it('펫 위에서만 클릭을 받고, 빈 곳에서는 아래 창으로 통과시킨다', async () => {
    const h = await start();
    move(petX, petY);
    expect(h.api.setInteractive).toHaveBeenLastCalledWith(true);
    move(5, 5);
    expect(h.api.setInteractive).toHaveBeenLastCalledWith(false);
  });

  it('지식 말풍선 위에서도 클릭을 받아 확인 버튼을 누를 수 있다', async () => {
    const h = await start();
    placeTip({ left: 20, top: 60, right: 260, bottom: 240 });
    h.emitTip(tip);
    move(100, 100); // 펫이 아니라 말풍선 안
    expect(h.api.setInteractive).toHaveBeenLastCalledWith(true);
    move(5, 5);
    expect(h.api.setInteractive).toHaveBeenLastCalledWith(false);
  });

  it('말풍선이 사라지면 그 자리는 다시 통과한다', async () => {
    const h = await start();
    placeTip({ left: 20, top: 60, right: 260, bottom: 240 });
    h.emitTip(tip);
    h.emitTip(null);
    move(100, 100);
    expect(h.api.setInteractive).not.toHaveBeenLastCalledWith(true);
  });

  it('마우스에 매달린 동안에는 펫이 입력을 받지 않는다', async () => {
    const h = await start(view({ mode: 'hang' }));
    move(petX, petY);
    expect(h.api.setInteractive).not.toHaveBeenCalledWith(true);
  });
});

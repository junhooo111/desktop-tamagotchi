// @vitest-environment jsdom
import fs from 'node:fs';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BUBBLE_GAP, STAGE_SCALE, WINDOW, petPixelSize } from '../shared/layout.js';
import { boundsOf } from '../shared/pixel.js';
import { spriteSet } from '../shared/species.js';
import type { StatusBubble } from '../shared/status.js';
import type { NoticeBubble, NoticeMessage, PetView, TipBubble } from '../shared/view.js';

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
  scale: 1,
  variant: 'default',
  accessory: 'none',
  ...over,
});

const notice: NoticeBubble = {
  title: '손가락으로 누르기엔 너무 작아요!',
  where: 'button#save (20x18px)',
  fix: '누르는 영역을 24px 이상으로 키우세요.',
};

const tip: TipBubble = { title: '지식 제목', body: '지식 본문', code: 'const a = 1;', xp: 2 };

interface Harness {
  api: {
    getView: ReturnType<typeof vi.fn>;
    act: ReturnType<typeof vi.fn>;
    setInteractive: ReturnType<typeof vi.fn>;
    drag: ReturnType<typeof vi.fn>;
    contextMenu: ReturnType<typeof vi.fn>;
    tipConfirm: ReturnType<typeof vi.fn>;
    openNotice: ReturnType<typeof vi.fn>;
  };
  emitView: (v: PetView) => void;
  emitSay: (t: string) => void;
  emitTip: (t: TipBubble | null) => void;
  emitStatus: (s: StatusBubble) => void;
  emitNotice: (n: NoticeBubble | null, show: boolean) => void;
}

async function start(initial: PetView = view()): Promise<Harness> {
  let onView: (v: PetView) => void = () => {};
  let onSay: (t: string) => void = () => {};
  let onTip: (t: TipBubble | null) => void = () => {};
  let onStatus: (s: StatusBubble) => void = () => {};
  let onNotice: (m: NoticeMessage) => void = () => {};
  const api = {
    getView: vi.fn(async () => initial),
    act: vi.fn(async () => true),
    setInteractive: vi.fn(),
    drag: vi.fn(),
    contextMenu: vi.fn(),
    tipConfirm: vi.fn(),
    openNotice: vi.fn(),
    onNotice: (cb: (m: NoticeMessage) => void) => (onNotice = cb),
    onView: (cb: (v: PetView) => void) => (onView = cb),
    onSay: (cb: (t: string) => void) => (onSay = cb),
    onTip: (cb: (t: TipBubble | null) => void) => (onTip = cb),
    onStatus: (cb: (s: StatusBubble) => void) => (onStatus = cb),
  };
  (window as unknown as { petApi: typeof api }).petApi = api;
  vi.resetModules();
  await import('./renderer.js');
  await flush();
  return { api, emitView: (v) => onView(v), emitSay: (t) => onSay(t), emitTip: (t) => onTip(t), emitStatus: (s) => onStatus(s), emitNotice: (n, show) => onNotice({ notice: n, show }) };
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

/** 캔버스에 칠한 색들과 fillRect 호출(그림이 실제로 그려졌는지 확인하는 데 쓴다) */
const fillStyles: string[] = [];
let fillRect = vi.fn();

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
  fillStyles.length = 0;
  fillRect = vi.fn();
  const ctx = {
    clearRect: vi.fn(),
    fillRect,
    set fillStyle(v: string) {
      fillStyles.push(v);
    },
    get fillStyle(): string {
      return fillStyles[fillStyles.length - 1] ?? '';
    },
    imageSmoothingEnabled: true,
    globalAlpha: 1,
  };
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

  it('말풍선은 서 있는 펫의 머리 꼭대기 위(간격만큼)에 붙는다 — 새끼는 낮으니 더 아래에 붙는다', async () => {
    const topOf = (stage: 'baby' | 'adult'): number => {
      const y0 = boundsOf(spriteSet('cat', stage).frames.idleA)!.y0;
      return WINDOW.height - petPixelSize(stage) + y0 * STAGE_SCALE[stage];
    };
    await start(view({ stage: 'adult' }));
    const adultBottom = el('tip').style.bottom;
    expect(adultBottom).toBe(`${WINDOW.height - topOf('adult') + BUBBLE_GAP}px`);

    await start(view({ stage: 'baby' }));
    expect(el('tip').style.bottom).toBe(`${WINDOW.height - topOf('baby') + BUBBLE_GAP}px`);
    expect(topOf('baby')).toBeGreaterThan(topOf('adult')); // 새끼는 머리가 더 낮다
  });
});

describe('그림 그리기', () => {
  const PINK = '#ff6b8b';

  it('고른 종의 팔레트 색으로 몸을 칠한다', async () => {
    await start(view({ speciesId: 'cat', stage: 'adult' }));
    const palette = spriteSet('cat', 'adult').palette;
    expect(fillRect).toHaveBeenCalled();
    expect(fillStyles).toContain(palette['f']);
    expect(fillStyles).toContain(palette['k']); // 윤곽선
    expect(fillStyles).not.toContain(PINK);
  });

  it('장식·색을 바꾸면 바로 새 모습으로 그린다(같은 자세의 옛 그림을 재사용하지 않는다)', async () => {
    const h = await start(view({ speciesId: 'cat', accessory: 'none', variant: 'default' }));
    expect(fillStyles).not.toContain('#5ab8ff'); // 파티 모자 색
    h.emitView(view({ speciesId: 'cat', accessory: 'partyhat', variant: 'default' }));
    vi.advanceTimersByTime(200);
    expect(fillStyles).toContain('#5ab8ff');
    fillStyles.length = 0;
    h.emitView(view({ speciesId: 'cat', accessory: 'none', variant: 'pastel' }));
    vi.advanceTimersByTime(200);
    expect(fillStyles).not.toContain('#5ab8ff');
    expect(fillStyles).toContain(spriteSet('cat', 'adult', { variant: 'pastel', accessory: 'none' }).palette['f']);
  });

  it('씻는 동안에는 머리 위 하얀 거품과 파란 비누방울을 그리고, 씻지 않을 때는 그리지 않는다', async () => {
    await start(view({ mode: 'idle' }));
    expect(fillStyles).not.toContain('#4aa8e8');
    fillStyles.length = 0;
    await start(view({ mode: 'wash', since: 0 }));
    expect(fillStyles).toContain('#4aa8e8'); // 비누방울
    expect(fillStyles).toContain('#ffffff'); // 거품
    expect(fillStyles).toContain('#7cbfee'); // 거품 그림자
  });

  it('설정한 배율만큼 그림 한 칸을 크게 그린다(2배면 한 칸이 2px)', async () => {
    await start(view({ scale: 2 }));
    const sizes = new Set(fillRect.mock.calls.map((c) => c[2]));
    expect(sizes.has(2)).toBe(true);
    expect(sizes.has(1)).toBe(false);
  });

  it('쓰다듬어서 좋아하는 동안에는 하트(분홍색)를 그린다', async () => {
    const h = await start();
    h.emitView(view({ mode: 'happy', since: Date.now() }));
    fillStyles.length = 0;
    vi.advanceTimersByTime(200);
    expect(fillStyles).toContain(PINK);
  });

  it('먹는 동안에는 먹이(빨간색)를 그린다', async () => {
    const h = await start();
    h.emitView(view({ mode: 'eat', since: Date.now() }));
    fillStyles.length = 0;
    vi.advanceTimersByTime(200);
    expect(fillStyles).toContain('#e8504a');
  });

  it('문제를 알릴 때는 느낌표(빨간색)를, 잘 때는 z(파란색)를 띄운다', async () => {
    const h = await start();
    h.emitView(view({ mode: 'alert', since: Date.now() }));
    fillStyles.length = 0;
    vi.advanceTimersByTime(200);
    expect(fillStyles).toContain('#e5484d');
    h.emitView(view({ mode: 'sleep', since: Date.now() }));
    fillStyles.length = 0;
    vi.advanceTimersByTime(200);
    expect(fillStyles).toContain('#5b6bbf');
  });

  it.each(['idle', 'sit', 'walk', 'run', 'doze', 'sleep', 'climb', 'slip', 'play', 'hang', 'carried', 'fall', 'alert', 'happy', 'eat'] as const)(
    '%s 동작도 오류 없이 그린다(알·새끼·성체 모두)',
    async (mode) => {
      for (const stage of ['egg', 'baby', 'adult'] as const) {
        const h = await start(view({ stage, mode, since: Date.now() }));
        h.emitView(view({ stage, mode, surface: mode === 'climb' || mode === 'slip' ? 'wallL' : 'floor', dir: mode === 'climb' || mode === 'slip' ? 'up' : 'right', since: Date.now() }));
        expect(() => vi.advanceTimersByTime(500)).not.toThrow();
      }
    },
  );
});

describe('상태 보기 말풍선', () => {
  const status = (over: Partial<StatusBubble> = {}): StatusBubble => ({
    name: '콩이',
    sub: '병아리 · 새끼',
    level: 12,
    tier: { tier: 1, name: '숙련', color: '#3aa55d', onColor: '#ffffff' },
    xp: 500,
    bars: [
      { kind: 'xp', label: '경험치', value: 47, level: 'high', text: '52/110', color: '#3aa55d' },
      { kind: 'hunger', label: '배부름', value: 67, level: 'high', text: '67/100' },
      { kind: 'happiness', label: '기분', value: 20, level: 'low', text: '20/100' },
      { kind: 'clean', label: '청결', value: 99, level: 'high', text: '99/100' },
    ],
    ...over,
  });

  it('이름·단계, 레벨 배지(등급 이름·색), 막대 네 줄(경험치·배부름·기분·청결)을 숫자와 함께 보여 준다', async () => {
    const h = await start();
    h.emitStatus(status());
    expect(el('status').hidden).toBe(false);
    expect(el('st-name').textContent).toBe('콩이'); // 이름 옆에 레벨 배지
    expect(el('st-sub').textContent).toBe('병아리 · 새끼'); // 종·단계는 다음 줄
    expect(el('st-lv').textContent).toBe('Lv.12 숙련');
    expect(el('st-lv').style.background).toBeTruthy();
    const rows = [...el('st-bars').querySelectorAll('.row')];
    expect(rows.map((r) => (r as HTMLElement).dataset['kind'])).toEqual(['xp', 'hunger', 'happiness', 'clean']);
    expect(rows.map((r) => r.textContent)).toEqual(['경험치52/110', '배부름67/100', '기분20/100', '청결99/100']);
  });

  it('막대의 찬 정도와 색: 경험치는 등급 색, 나머지는 낮으면 빨강·높으면 초록', async () => {
    const h = await start();
    h.emitStatus(status());
    const fills = [...el('st-bars').querySelectorAll<HTMLElement>('.fill')];
    expect(fills.map((f) => f.style.width)).toEqual(['47%', '67%', '20%', '99%']);
    expect(fills[0]!.style.background).toBeTruthy(); // 등급 색
    expect(fills[2]!.className).toContain('low');
    expect(fills[1]!.className).toContain('high');
  });

  it('잠시 뒤 사라지고, 다시 부르면 막대가 쌓이지 않고 새로 그려진다', async () => {
    const h = await start();
    h.emitStatus(status());
    h.emitStatus(status({ name: '다음' }));
    expect(el('st-bars').querySelectorAll('.row')).toHaveLength(4);
    vi.advanceTimersByTime(7_100);
    expect(el('status').hidden).toBe(true);
  });

  it('글자를 HTML 로 해석하지 않는다', async () => {
    const h = await start();
    h.emitStatus(status({ name: '<img src=x onerror=alert(1)>', sub: '<b>x</b>' }));
    expect(el('st-name').querySelector('img')).toBeNull();
    expect(el('st-name').textContent).toContain('<img');
    expect(el('st-sub').querySelector('b')).toBeNull();
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

  it('펫 칸(64px) 안이라도 몸이 없는 가장자리는 클릭이 통과한다(그려진 몸 영역 기준)', async () => {
    const h = await start(view({ stage: 'baby' }));
    const size = petPixelSize('baby');
    const cellX = Math.round((WINDOW.width - size) / 2);
    const cellY = WINDOW.height - size;
    move(cellX + 1, cellY + 1); // 칸의 왼쪽 위 모서리: 새끼 몸 밖
    expect(h.api.setInteractive).not.toHaveBeenCalledWith(true);
    move(cellX + size / 2, cellY + size - 4); // 몸 한가운데 아래쪽
    expect(h.api.setInteractive).toHaveBeenLastCalledWith(true);
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

describe('찾은 문제 말풍선', () => {
  const move = (x: number, y: number): void => {
    document.dispatchEvent(new MouseEvent('mousemove', { clientX: x, clientY: y, bubbles: true }));
  };
  const petX = Math.round(WINDOW.width / 2);
  const petY = WINDOW.height - 10;
  const click = (x: number, y: number): void => {
    const canvas = el('pet') as HTMLCanvasElement;
    (canvas as unknown as { setPointerCapture: () => void }).setPointerCapture = () => {};
    const ev = (type: string): Event =>
      Object.assign(new MouseEvent(type, { clientX: x, clientY: y, screenX: 10, screenY: 10, button: 0, bubbles: true }), { pointerId: 1 });
    canvas.dispatchEvent(ev('pointerdown'));
    canvas.dispatchEvent(ev('pointerup'));
  };

  it('문제를 찾으면 무엇이 문제인지·어디인지·어떻게 고치는지를 함께 보여 준다', async () => {
    const h = await start();
    h.emitNotice(notice, true);
    expect(el('notice').hidden).toBe(false);
    expect(el('notice-title').textContent).toBe('손가락으로 누르기엔 너무 작아요!');
    expect(el('notice-where').textContent).toBe('button#save (20x18px)');
    expect(el('notice-fix').textContent).toBe('누르는 영역을 24px 이상으로 키우세요.');
  });

  it('시간이 지나면 사라진다', async () => {
    const h = await start();
    h.emitNotice(notice, true);
    vi.advanceTimersByTime(11_000);
    expect(el('notice').hidden).toBe(false);
    vi.advanceTimersByTime(2_000);
    expect(el('notice').hidden).toBe(true);
  });

  it('사라진 뒤 펫에 마우스를 올리면 다시 나오고, 벗어나면 잠시 뒤 사라진다', async () => {
    const h = await start();
    h.emitNotice(notice, true);
    vi.advanceTimersByTime(13_000);
    expect(el('notice').hidden).toBe(true);
    move(petX, petY);
    expect(el('notice').hidden).toBe(false);
    vi.advanceTimersByTime(60_000); // 올려 둔 동안은 계속 보인다
    expect(el('notice').hidden).toBe(false);
    move(5, 5);
    vi.advanceTimersByTime(600);
    expect(el('notice').hidden).toBe(true);
  });

  it('기억만 해 둔 문제(show=false)는 처음엔 안 보이고, hover 하면 나온다', async () => {
    const h = await start();
    h.emitNotice(notice, false);
    expect(el('notice').hidden).toBe(true);
    move(petX, petY);
    expect(el('notice').hidden).toBe(false);
  });

  it('기억하는 문제가 없으면 hover 해도 아무것도 나오지 않는다', async () => {
    await start();
    move(petX, petY);
    expect(el('notice').hidden).toBe(true);
  });

  it('고치거나 확인해서 문제가 지워지면(null) 말풍선도 사라지고 hover 해도 안 나온다', async () => {
    const h = await start();
    h.emitNotice(notice, true);
    h.emitNotice(null, false);
    expect(el('notice').hidden).toBe(true);
    move(5, 5);
    move(petX, petY);
    expect(el('notice').hidden).toBe(true);
  });

  it('말풍선이 떠 있을 때 펫을 누르면 쓰다듬기 대신 배움 카드를 연다', async () => {
    const h = await start();
    h.emitNotice(notice, true);
    click(petX, petY);
    expect(h.api.openNotice).toHaveBeenCalledTimes(1);
    expect(h.api.act).not.toHaveBeenCalled();
    expect(el('notice').hidden).toBe(true);
  });

  it('말풍선이 없을 때는 평소처럼 쓰다듬는다', async () => {
    const h = await start();
    click(petX, petY);
    expect(h.api.act).toHaveBeenCalledWith('touch');
    expect(h.api.openNotice).not.toHaveBeenCalled();
  });

  it('FE 지식 말풍선이 떠 있으면 양보하고, 글자를 HTML 로 해석하지 않는다', async () => {
    const h = await start();
    h.emitNotice({ ...notice, title: '<img src=x onerror=alert(1)>' }, true);
    expect(el('notice').querySelector('img')).toBeNull();
    h.emitTip(tip);
    expect(el('notice').hidden).toBe(true);
    move(petX, petY);
    expect(el('notice').hidden).toBe(true);
  });

  it('지식·문제 말풍선 중 보이는 것의 위에 한마디 말풍선이 선다', async () => {
    const h = await start();
    vi.spyOn(el('notice'), 'getBoundingClientRect').mockReturnValue({
      left: 20, top: 80, right: 260, bottom: 240, x: 20, y: 80, width: 240, height: 160, toJSON: () => ({}),
    });
    h.emitNotice(notice, true);
    h.emitSay('안녕!');
    expect(el('bubble').style.bottom).toBe(String(WINDOW.height - 80 + 8) + 'px');
  });
});

describe('클릭과 드래그', () => {
  const petX = Math.round(WINDOW.width / 2);
  const petY = WINDOW.height - 10;
  const fire = (type: string, screenX: number, screenY: number): void => {
    const canvas = el('pet') as HTMLCanvasElement;
    (canvas as unknown as { setPointerCapture: () => void }).setPointerCapture = () => {};
    canvas.dispatchEvent(
      Object.assign(new MouseEvent(type, { clientX: petX, clientY: petY, screenX, screenY, button: 0, bubbles: true }), { pointerId: 1 }),
    );
  };

  it('그냥 누르기만 하면 펫을 들어 올리지 않는다(공중·벽에 있던 펫이 바닥에 떨어지지 않는다)', async () => {
    const h = await start();
    fire('pointerdown', 100, 100);
    fire('pointerup', 100, 100);
    expect(h.api.drag).not.toHaveBeenCalled();
    expect(h.api.act).toHaveBeenCalledWith('touch');
  });

  it('누른 채 살짝 떨리는 정도(4px 미만)는 클릭으로 본다', async () => {
    const h = await start();
    fire('pointerdown', 100, 100);
    fire('pointermove', 102, 101);
    fire('pointerup', 102, 101);
    expect(h.api.drag).not.toHaveBeenCalled();
    expect(h.api.act).toHaveBeenCalledWith('touch');
  });

  it('누른 채 4px 이상 움직여야 들어 올리고, 놓으면 내려놓으며 쓰다듬기는 하지 않는다', async () => {
    const h = await start();
    fire('pointerdown', 100, 100);
    fire('pointermove', 106, 100);
    fire('pointermove', 140, 100); // 계속 움직여도 들어 올리기는 한 번만
    expect(h.api.drag).toHaveBeenCalledTimes(1);
    expect(h.api.drag).toHaveBeenLastCalledWith('start');
    fire('pointerup', 140, 100);
    expect(h.api.drag).toHaveBeenCalledTimes(2);
    expect(h.api.drag).toHaveBeenLastCalledWith('end');
    expect(h.api.act).not.toHaveBeenCalled();
  });

  it('문제 말풍선이 떠 있을 때 눌러도 펫을 들어 올리지 않고 배움 카드만 연다', async () => {
    const h = await start();
    h.emitNotice({ title: '문제', where: 'a', fix: 'b' }, true);
    fire('pointerdown', 100, 100);
    fire('pointerup', 100, 100);
    expect(h.api.drag).not.toHaveBeenCalled();
    expect(h.api.openNotice).toHaveBeenCalledTimes(1);
  });
});

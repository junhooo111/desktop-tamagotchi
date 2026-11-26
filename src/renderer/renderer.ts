/** 펫 화면: 캔버스에 픽셀 스프라이트를 그리고 마우스 입력을 메인으로 넘긴다. */
import { resolvePose } from '../shared/animation.js';
import { BUBBLE_GAP, WINDOW, drawScale, petPixelSize } from '../shared/layout.js';
import { boundsOf, orientRows } from '../shared/pixel.js';
import { spriteSet, type FrameName, type SpriteSet } from '../shared/species.js';
import type { NoticeBubble, NoticeMessage, PetView, TipBubble } from '../shared/view.js';

interface PetApi {
  getView(): Promise<PetView>;
  act(type: 'touch' | 'feed' | 'play'): Promise<boolean>;
  setInteractive(value: boolean): void;
  drag(phase: 'start' | 'end'): void;
  contextMenu(): void;
  tipConfirm(): void;
  openNotice(): void;
  onNotice(callback: (message: NoticeMessage) => void): void;
  onView(callback: (view: PetView) => void): void;
  onSay(callback: (text: string) => void): void;
  onTip(callback: (tip: TipBubble | null) => void): void;
}

declare global {
  interface Window {
    petApi: PetApi;
    __petReady?: boolean;
  }
}

const CLICK_MOVE_LIMIT = 4;
const HIT_PADDING = 5;
const BUBBLE_MS = 4_000;
/** 문제를 찾았을 때 말풍선이 떠 있는 시간 */
const NOTICE_MS = 12_000;
/** 펫에서 마우스가 벗어난 뒤 말풍선을 거두기까지의 시간 */
const NOTICE_LEAVE_MS = 500;
const ZZZ_COLOR = '#5b6bbf';
const ALERT_COLOR = '#e5484d';
/** 'Z' 모양 4x4 도트 */
const Z_GLYPH = ['###.', '..#.', '.#..', '###.'];

const canvas = document.getElementById('pet') as HTMLCanvasElement;
const bubble = document.getElementById('bubble') as HTMLDivElement;
const tipEl = document.getElementById('tip') as HTMLElement;
const noticeEl = document.getElementById('notice') as HTMLElement;
canvas.width = WINDOW.width;
canvas.height = WINDOW.height;
const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
ctx.imageSmoothingEnabled = false;

let view: PetView | null = null;
let bubbleTimer: number | undefined;

function sheetOf(v: PetView): SpriteSet {
  return spriteSet(v.speciesId, v.stage, { variant: v.variant ?? 'default', accessory: v.accessory ?? 'none' });
}

/** 펫이 서 있는 자리(창의 아래쪽 가운데). 그림이 돌아가도 같은 칸을 쓴다. */
function petRect(v: PetView): { x: number; y: number; size: number } {
  const size = petPixelSize(v.stage, v.scale);
  return { x: Math.round((WINDOW.width - size) / 2), y: WINDOW.height - size, size };
}

/** 서 있는 모습의 머리 꼭대기 화면 좌표. 말풍선·느낌표의 기준이라 프레임이 바뀌어도 흔들리지 않는다. */
function figureTop(v: PetView): number {
  const rows = sheetOf(v).frames.idleA;
  const b = boundsOf(rows);
  return petRect(v).y + (b ? b.y0 : 0) * drawScale(v.stage, v.scale);
}

// 같은 자세는 매번 다시 뒤집고 돌리지 않도록 저장해 둔다.
const rowCache = new Map<string, string[]>();
function rowsFor(v: PetView, frame: FrameName, eyesClosed: boolean, flip: boolean, quarter: number): string[] {
  const key = `${v.stage === 'egg' ? 'egg' : `${v.speciesId}|${v.variant ?? 'default'}|${v.accessory ?? 'none'}`}|${v.stage}|${frame}|${eyesClosed}|${flip}|${quarter}`;
  const cached = rowCache.get(key);
  if (cached) return cached;
  const sheet = sheetOf(v);
  let rows = sheet.frames[frame];
  // 눈 깜빡임: 눈동자와 눈 하이라이트를 몸 색으로 덮는다.
  if (eyesClosed && sheet.skin) rows = rows.map((r) => r.replaceAll('e', sheet.skin).replaceAll('w', sheet.skin));
  const oriented = orientRows(rows, flip, quarter);
  rowCache.set(key, oriented);
  return oriented;
}

/** 지금 화면에 그려진 펫의 몸 영역(캔버스 좌표). 클릭 판정에 쓴다. */
let figure: { x0: number; y0: number; x1: number; y1: number } | null = null;

function drawZzz(rect: { x: number; y: number; size: number }, now: number): void {
  ctx.fillStyle = ZZZ_COLOR;
  [0, 0.5].forEach((offset, i) => {
    const t = ((now / 1600 + offset) % 1 + 1) % 1;
    const unit = i === 0 ? 1 : 2; // 작은 z 와 큰 z
    const left = rect.x + rect.size - 4 * unit + Math.round(t * 6);
    const top = rect.y - 4 * unit - Math.round(t * 14);
    Z_GLYPH.forEach((row, y) => {
      [...row].forEach((ch, x) => {
        if (ch === '#') ctx.fillRect(left + x * unit, top + y * unit, unit, unit);
      });
    });
  });
}

/** 머리 위에 빨간 느낌표를 띄운다. top 은 서 있는 펫의 머리 꼭대기 화면 좌표다. */
function drawAlert(centerX: number, top: number, bounce: number): void {
  ctx.fillStyle = ALERT_COLOR;
  const unit = 2;
  const left = Math.round(centerX - unit / 2);
  const y = top - 8 * unit + bounce;
  ctx.fillRect(left, y, unit, 4 * unit);
  ctx.fillRect(left, y + 5 * unit, unit, unit);
}

/** 도트로 그린 작은 그림(문자 '#' 은 color, 'G' 는 잎 색)을 (x, y)에 그린다. */
function drawGlyph(rows: readonly string[], x: number, y: number, unit: number, color: string, alpha = 1): void {
  ctx.globalAlpha = alpha;
  rows.forEach((row, ry) => {
    [...row].forEach((ch, rx) => {
      if (ch === '.') return;
      ctx.fillStyle = ch === 'G' ? '#4fae5a' : color;
      ctx.fillRect(x + rx * unit, y + ry * unit, unit, unit);
    });
  });
  ctx.globalAlpha = 1;
}

const HEART = ['.##.##.', '#######', '#######', '.#####.', '..###..', '...#...'];
const BERRY = ['..G..', '.###.', '#####', '#####', '.###.'];

/** 좋아서 하트 두 개가 머리 위로 떠오르며 사라진다. */
function drawHearts(centerX: number, top: number, now: number, unit: number): void {
  [0, 0.5].forEach((offset, i) => {
    const t = ((now / 1000 + offset) % 1 + 1) % 1;
    drawGlyph(HEART, Math.round(centerX - 10 + i * 11 + Math.sin(t * 6) * 2), Math.round(top - 8 * unit - t * 10), unit, '#ff6b8b', 1 - t * 0.8);
  });
}

function draw(now: number): void {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (!view) return;
  const scale = drawScale(view.stage, view.scale);
  const rect = petRect(view);
  const pose = resolvePose(view, now);
  const rows = rowsFor(view, pose.frame, pose.eyesClosed, pose.orientation.flip, pose.orientation.quarter);
  const sheet = sheetOf(view);

  // 알은 걷는 대신 통통 튄다.
  const eggHop = view.stage === 'egg' && view.mode === 'walk' ? -Math.abs(Math.round(Math.sin(now / 120) * 2)) : 0;
  const offsetX = rect.x + pose.dx * scale;
  const offsetY = rect.y + (pose.dy + eggHop) * scale;

  rows.forEach((row, y) => {
    [...row].forEach((ch, x) => {
      const color = sheet.palette[ch];
      if (!color) return;
      ctx.fillStyle = color;
      ctx.fillRect(offsetX + x * scale, offsetY + y * scale, scale, scale);
    });
  });

  const b = boundsOf(rows);
  figure = b
    ? { x0: offsetX + b.x0 * scale, y0: offsetY + b.y0 * scale, x1: offsetX + (b.x1 + 1) * scale, y1: offsetY + (b.y1 + 1) * scale }
    : null;

  const centerX = rect.x + rect.size / 2 + pose.dx * scale;
  const top = figureTop(view);
  if (pose.zzz) drawZzz({ x: rect.x, y: top, size: rect.size }, now);
  if (pose.alert) drawAlert(centerX, top, Math.floor(now / 300) % 2 === 0 ? 0 : -2);
  if (pose.hearts) drawHearts(centerX, top, now, scale);
  if (pose.food && figure) {
    // 먹이는 바라보는 쪽(앞) 바닥에 놓는다.
    const front = pose.orientation.flip ? figure.x0 - 5 * scale - 1 : figure.x1 + 1;
    drawGlyph(BERRY, Math.round(front), Math.round(rect.y + rect.size - 5 * scale - 1), scale, '#e8504a');
  }
}

function showBubble(text: string): void {
  bubble.textContent = text;
  bubble.hidden = false;
  window.clearTimeout(bubbleTimer);
  bubbleTimer = window.setTimeout(() => {
    bubble.hidden = true;
  }, BUBBLE_MS);
}

/**
 * 말풍선들을 펫 머리 위에 쌓는다. 지식 말풍선이 펫 바로 위에 서고,
 * 한마디 말풍선(쓰다듬기·알림 등)은 지식 말풍선이 있으면 그 위에, 없으면 펫 바로 위에 선다.
 */
function anchorBubbles(): void {
  if (!view) return;
  const petTop = figureTop(view);
  const base = WINDOW.height - petTop + BUBBLE_GAP;
  tipEl.style.bottom = `${base}px`;
  noticeEl.style.bottom = `${base}px`;
  const lower = !tipEl.hidden ? tipEl : !noticeEl.hidden ? noticeEl : null;
  const above = lower ? WINDOW.height - lower.getBoundingClientRect().top + 8 : base;
  bubble.style.bottom = `${above}px`;
  document.documentElement.style.setProperty('--shift', `${view.bubbleShift}px`);
}

// ---- 찾은 문제 말풍선: 알릴 때 떠 있다가 사라지고, 펫에 마우스를 올리면 다시 나온다 ----
let notice: NoticeBubble | null = null;
let noticeTimer: number | undefined;
let hovering = false;

function hideNotice(): void {
  window.clearTimeout(noticeTimer);
  noticeEl.hidden = true;
  anchorBubbles();
}

/** 기억하는 문제가 있으면 말풍선을 띄운다. ms 가 있으면 그 시간 뒤에 거둔다. FE 지식 말풍선이 떠 있으면 양보한다. */
function showNotice(ms?: number): void {
  window.clearTimeout(noticeTimer);
  if (!notice || !tipEl.hidden) return;
  noticeEl.hidden = false;
  anchorBubbles();
  if (ms !== undefined) noticeTimer = window.setTimeout(hideNotice, ms);
}

function onNotice(message: NoticeMessage): void {
  notice = message.notice;
  if (!notice) {
    hideNotice();
    return;
  }
  // 글자는 textContent 로만 넣는다(HTML 로 해석하지 않는다).
  (document.getElementById('notice-title') as HTMLElement).textContent = notice.title;
  (document.getElementById('notice-where') as HTMLElement).textContent = notice.where;
  (document.getElementById('notice-fix') as HTMLElement).textContent = notice.fix;
  if (message.show) showNotice(hovering ? undefined : NOTICE_MS);
}

function hoverPet(on: boolean): void {
  if (on === hovering) return;
  hovering = on;
  if (on) showNotice(); // 마우스가 올라가 있는 동안은 계속 보여 준다
  else if (!noticeEl.hidden) showNotice(NOTICE_LEAVE_MS);
}

function showTip(tip: TipBubble | null): void {
  if (tip) hideNotice(); // 지식 말풍선이 우선이다
  if (!tip) {
    tipEl.hidden = true;
  } else {
    // 글자는 textContent 로만 넣는다(HTML 로 해석하지 않는다).
    (document.getElementById('tip-title') as HTMLElement).textContent = tip.title;
    (document.getElementById('tip-body') as HTMLElement).textContent = tip.body;
    // 코드는 접어 두었다가 `코드 보기`를 누르면 펼친다(말풍선이 너무 커지지 않게).
    const code = document.getElementById('tip-code') as HTMLElement;
    code.textContent = tip.code;
    code.hidden = true;
    const toggle = document.getElementById('tip-toggle') as HTMLElement;
    toggle.textContent = '코드 보기';
    toggle.hidden = tip.code.trim() === '';
    (document.getElementById('tip-ok') as HTMLElement).textContent = tip.xp > 0 ? `확인 (+${tip.xp})` : '확인';
    tipEl.hidden = false;
  }
  anchorBubbles();
}

function insideTip(x: number, y: number): boolean {
  if (tipEl.hidden) return false;
  const r = tipEl.getBoundingClientRect();
  return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
}

/** 마우스에 매달려 있을 땐 클릭이 그대로 통과해야 하므로 펫이 입력을 받지 않는다. */
function acceptsInput(v: PetView): boolean {
  return v.mode !== 'hang';
}

function insidePet(x: number, y: number): boolean {
  if (!view || !acceptsInput(view)) return false;
  // 그려진 몸 영역(없으면 펫 칸 전체)을 기준으로 한다. 그래야 몸 둘레의 빈 곳은 클릭이 통과한다.
  const r = petRect(view);
  const box = figure ?? { x0: r.x, y0: r.y, x1: r.x + r.size, y1: r.y + r.size };
  return (
    x >= box.x0 - HIT_PADDING &&
    x <= box.x1 + HIT_PADDING &&
    y >= box.y0 - HIT_PADDING &&
    y <= box.y1 + HIT_PADDING
  );
}

// ---- 마우스: 펫 위에서만 클릭을 받고, 나머지는 아래 창으로 통과시킨다 ----
let interactive = false;
let pointer: { id: number; startX: number; startY: number; dragging: boolean } | null = null;

function setInteractive(value: boolean): void {
  if (value === interactive) return;
  interactive = value;
  window.petApi.setInteractive(value);
}

document.addEventListener('mousemove', (e) => {
  // 펫이나 지식 말풍선(확인 버튼) 위에서만 클릭을 받는다.
  const onPet = insidePet(e.clientX, e.clientY);
  hoverPet(onPet);
  if (!pointer) setInteractive(onPet || insideTip(e.clientX, e.clientY));
});

(document.getElementById('tip-toggle') as HTMLElement).addEventListener('click', (e) => {
  const code = document.getElementById('tip-code') as HTMLElement;
  code.hidden = !code.hidden;
  (e.currentTarget as HTMLElement).textContent = code.hidden ? '코드 보기' : '코드 접기';
  anchorBubbles(); // 말풍선이 커지거나 작아지면 한마디 말풍선 자리도 다시 잡는다
});

(document.getElementById('tip-ok') as HTMLElement).addEventListener('click', () => {
  window.petApi.tipConfirm();
  showTip(null);
  setInteractive(false);
});

canvas.addEventListener('pointerdown', (e) => {
  if (e.button !== 0 || !insidePet(e.clientX, e.clientY)) return;
  // 누르기만 해서는 펫을 "잡은" 것으로 치지 않는다. 마우스가 실제로 움직여야 들어 올린다.
  // (눌렀다 떼는 순간 바로 들어 올렸다 놓으면, 공중이나 벽에 있던 펫이 클릭만으로 바닥에 떨어진다.)
  pointer = { id: e.pointerId, startX: e.screenX, startY: e.screenY, dragging: false };
  canvas.setPointerCapture(e.pointerId);
});

canvas.addEventListener('pointermove', (e) => {
  if (!pointer || pointer.id !== e.pointerId || pointer.dragging) return;
  if (Math.hypot(e.screenX - pointer.startX, e.screenY - pointer.startY) >= CLICK_MOVE_LIMIT) {
    pointer.dragging = true;
    window.petApi.drag('start');
  }
});

function endPointer(e: PointerEvent): void {
  if (!pointer || pointer.id !== e.pointerId) return;
  const moved = Math.hypot(e.screenX - pointer.startX, e.screenY - pointer.startY);
  const wasDragging = pointer.dragging;
  pointer = null;
  if (wasDragging) window.petApi.drag('end');
  if (!wasDragging && moved < CLICK_MOVE_LIMIT) {
    // 찾은 문제 말풍선이 떠 있을 때 펫을 누르면 쓰다듬기 대신 배움 카드가 열린다.
    if (!noticeEl.hidden) {
      window.petApi.openNotice();
      hideNotice();
    } else {
      void window.petApi.act('touch');
    }
  }
}
canvas.addEventListener('pointerup', endPointer);
canvas.addEventListener('pointercancel', endPointer);

document.addEventListener('contextmenu', (e) => {
  e.preventDefault();
  if (insidePet(e.clientX, e.clientY)) window.petApi.contextMenu();
});

// ---- 시작 ----
window.petApi.onView((next) => {
  const moved = !view || view.stage !== next.stage || view.bubbleShift !== next.bubbleShift;
  view = next;
  if (moved) anchorBubbles();
  // 매달리기처럼 입력을 받지 않는 동작으로 바뀌면 바로 클릭 통과로 돌린다.
  if (interactive && !acceptsInput(next) && tipEl.hidden) setInteractive(false);
});
window.petApi.onSay((text) => {
  showBubble(text);
  anchorBubbles();
});
window.petApi.onTip(showTip);
window.petApi.onNotice(onNotice);

void window.petApi.getView().then((initial) => {
  view = initial;
  anchorBubbles();
  draw(Date.now());
  window.__petReady = true;
});
window.setInterval(() => draw(Date.now()), 50);

/** 펫 화면: 캔버스에 픽셀 스프라이트를 그리고 마우스 입력을 메인으로 넘긴다. */
import { resolvePose } from '../shared/animation.js';
import { STAGE_SCALE, WINDOW, petPixelSize } from '../shared/layout.js';
import { orientRows } from '../shared/pixel.js';
import { EGG, getSpecies, type FrameName, type SpriteSet } from '../shared/species.js';
import type { PetView } from '../shared/view.js';

interface PetApi {
  getView(): Promise<PetView>;
  act(type: 'touch' | 'feed' | 'play'): Promise<boolean>;
  setInteractive(value: boolean): void;
  drag(phase: 'start' | 'end'): void;
  contextMenu(): void;
  onView(callback: (view: PetView) => void): void;
  onSay(callback: (text: string) => void): void;
}

declare global {
  interface Window {
    petApi: PetApi;
    __petReady?: boolean;
  }
}

const CLICK_MOVE_LIMIT = 4;
const HIT_PADDING = 3;
const BUBBLE_MS = 4_000;
const ZZZ_COLOR = '#5b6bbf';
/** 'Z' 모양 4x4 도트 */
const Z_GLYPH = ['###.', '..#.', '.#..', '###.'];

const canvas = document.getElementById('pet') as HTMLCanvasElement;
const bubble = document.getElementById('bubble') as HTMLDivElement;
const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
ctx.imageSmoothingEnabled = false;

let view: PetView | null = null;
let bubbleTimer: number | undefined;

function sheetOf(v: PetView): SpriteSet {
  return v.stage === 'egg' ? EGG : getSpecies(v.speciesId);
}

/** 펫이 서 있는 자리(창의 아래쪽 가운데). 그림이 돌아가도 같은 칸을 쓴다. */
function petRect(v: PetView): { x: number; y: number; size: number } {
  const size = petPixelSize(v.stage);
  return { x: Math.round((WINDOW.width - size) / 2), y: WINDOW.height - size, size };
}

// 같은 자세는 매번 다시 뒤집고 돌리지 않도록 저장해 둔다.
const rowCache = new Map<string, string[]>();
function rowsFor(v: PetView, frame: FrameName, eyesClosed: boolean, flip: boolean, quarter: number): string[] {
  const key = `${v.stage === 'egg' ? 'egg' : v.speciesId}|${frame}|${eyesClosed}|${flip}|${quarter}`;
  const cached = rowCache.get(key);
  if (cached) return cached;
  const sheet = sheetOf(v);
  let rows = sheet.frames[frame];
  if (eyesClosed && sheet.blink) rows = rows.map((r) => r.replaceAll('e', sheet.blink));
  const oriented = orientRows(rows, flip, quarter);
  rowCache.set(key, oriented);
  return oriented;
}

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

function draw(now: number): void {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (!view) return;
  const scale = STAGE_SCALE[view.stage];
  const rect = petRect(view);
  const pose = resolvePose(view, now);
  const rows = rowsFor(view, pose.frame, pose.eyesClosed, pose.orientation.flip, pose.orientation.quarter);
  const sheet = sheetOf(view);

  // 알은 걷는 대신 통통 튄다.
  const eggHop = view.stage === 'egg' && view.mode === 'walk' ? -Math.abs(Math.round(Math.sin(now / 120) * 2)) : 0;

  rows.forEach((row, y) => {
    [...row].forEach((ch, x) => {
      const color = sheet.palette[ch];
      if (!color) return;
      ctx.fillStyle = color;
      ctx.fillRect(rect.x + (x + pose.dx) * scale, rect.y + (y + pose.dy) * scale + eggHop * scale, scale, scale);
    });
  });
  if (pose.zzz) drawZzz(rect, now);
}

function showBubble(text: string): void {
  bubble.textContent = text;
  bubble.hidden = false;
  window.clearTimeout(bubbleTimer);
  bubbleTimer = window.setTimeout(() => {
    bubble.hidden = true;
  }, BUBBLE_MS);
}

/** 마우스에 매달려 있을 땐 클릭이 그대로 통과해야 하므로 펫이 입력을 받지 않는다. */
function acceptsInput(v: PetView): boolean {
  return v.mode !== 'hang';
}

function insidePet(x: number, y: number): boolean {
  if (!view || !acceptsInput(view)) return false;
  const r = petRect(view);
  return (
    x >= r.x - HIT_PADDING &&
    x <= r.x + r.size + HIT_PADDING &&
    y >= r.y - HIT_PADDING &&
    y <= r.y + r.size + HIT_PADDING
  );
}

// ---- 마우스: 펫 위에서만 클릭을 받고, 나머지는 아래 창으로 통과시킨다 ----
let interactive = false;
let pointer: { id: number; startX: number; startY: number } | null = null;

function setInteractive(value: boolean): void {
  if (value === interactive) return;
  interactive = value;
  window.petApi.setInteractive(value);
}

document.addEventListener('mousemove', (e) => {
  if (!pointer) setInteractive(insidePet(e.clientX, e.clientY));
});

canvas.addEventListener('pointerdown', (e) => {
  if (e.button !== 0 || !insidePet(e.clientX, e.clientY)) return;
  pointer = { id: e.pointerId, startX: e.screenX, startY: e.screenY };
  canvas.setPointerCapture(e.pointerId);
  window.petApi.drag('start');
});

function endPointer(e: PointerEvent): void {
  if (!pointer || pointer.id !== e.pointerId) return;
  const moved = Math.hypot(e.screenX - pointer.startX, e.screenY - pointer.startY);
  pointer = null;
  window.petApi.drag('end');
  if (moved < CLICK_MOVE_LIMIT) void window.petApi.act('touch');
}
canvas.addEventListener('pointerup', endPointer);
canvas.addEventListener('pointercancel', endPointer);

document.addEventListener('contextmenu', (e) => {
  e.preventDefault();
  if (insidePet(e.clientX, e.clientY)) window.petApi.contextMenu();
});

// ---- 시작 ----
window.petApi.onView((next) => {
  view = next;
  // 매달리기처럼 입력을 받지 않는 동작으로 바뀌면 바로 클릭 통과로 돌린다.
  if (interactive && !acceptsInput(next)) setInteractive(false);
});
window.petApi.onSay(showBubble);

void window.petApi.getView().then((initial) => {
  view = initial;
  draw(Date.now());
  window.__petReady = true;
});
window.setInterval(() => draw(Date.now()), 50);

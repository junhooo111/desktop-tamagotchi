/**
 * Electron 메인 프로세스.
 * 투명한 창 하나에 펫을 띄우고, 창을 움직여 화면을 돌아다니게 한다.
 * 규칙(성장·행동·저장)은 순수 모듈에 있고, 여기서는 창·메뉴·IPC·마우스 위치만 다룬다.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { BrowserWindow, Menu, Tray, app, ipcMain, nativeImage, screen } from 'electron';
import { WINDOW, petPixelSize } from '../shared/layout.js';
import {
  applyElapsed,
  createPet,
  feed,
  levelOf,
  moodOf,
  play,
  stageOf,
  statusText,
  touch,
  type ActionResult,
  type PetState,
} from '../shared/pet.js';
import { EGG, SPECIES, frameToRgba, getSpecies, type SpeciesId } from '../shared/species.js';
import type { PetView } from '../shared/view.js';
import {
  carry,
  createBehavior,
  drop,
  resize,
  step,
  trigger,
  wake,
  type BehaviorState,
  type StepContext,
  type Trigger,
} from './behavior.js';
import { loadPet, savePet } from './store.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(here, '..', '..');
const SMOKE = process.argv.includes('--smoke');

const TICK_MS = 33;
const SAVE_MS = 30_000;
const HUNGRY_NOTICE_MS = 5 * 60_000;
/** 마우스가 이 거리 이상 움직여야 "움직였다"고 본다 */
const CURSOR_MOVE_PX = 3;

if (SMOKE) {
  // 스모크 실행은 사용자의 실제 저장 파일을 건드리지 않는다.
  app.setPath('userData', fs.mkdtempSync(path.join(os.tmpdir(), 'pet-smoke-')));
}

let win: BrowserWindow | null = null;
let tray: Tray | null = null;
let pet: PetState;
let behavior: BehaviorState;
let petSize = 0;
let drag: { offsetX: number; offsetY: number } | null = null;
let lastCursor = { x: 0, y: 0 };
let lastCursorMoveAt = Date.now();
let lastSentKey = '';
let lastHungryNoticeAt = 0;
let savePath = '';

const randomSpecies = (): SpeciesId => {
  const pick = SPECIES[Math.floor(Math.random() * SPECIES.length)];
  return (pick ?? SPECIES[0]!).id;
};

function currentView(): PetView {
  return {
    speciesId: pet.speciesId,
    stage: stageOf(pet),
    level: levelOf(pet.xp),
    mood: moodOf(pet),
    mode: behavior.mode,
    surface: behavior.surface,
    dir: behavior.dir,
    play: behavior.play,
    since: behavior.since,
  };
}

function sendView(force = false): void {
  if (!win || win.isDestroyed()) return;
  const view = currentView();
  const key = JSON.stringify(view);
  if (!force && key === lastSentKey) return;
  lastSentKey = key;
  win.webContents.send('pet:view', view);
}

function say(text: string): void {
  if (text && win && !win.isDestroyed()) win.webContents.send('pet:say', text);
}

function persist(): void {
  try {
    savePet(savePath, pet);
  } catch (error) {
    console.error('저장 실패', error);
  }
}

function stepContext(now: number, dtMs: number): StepContext {
  const cursor = screen.getCursorScreenPoint();
  return {
    now,
    dtMs,
    areas: screen.getAllDisplays().map((d) => d.workArea),
    size: petSize,
    rng: Math.random,
    cursor,
    cursorIdleMs: now - lastCursorMoveAt,
    stage: stageOf(pet),
  };
}

function act(type: 'touch' | 'feed' | 'play'): ActionResult {
  const now = Date.now();
  const current = applyElapsed(pet, now);
  const result = type === 'touch' ? touch(current, now) : type === 'feed' ? feed(current) : play(current);
  pet = result.pet;
  if (result.ok) behavior = wake(behavior, now);
  say(result.message);
  updateTray();
  sendView();
  if (result.ok) persist();
  return result;
}

function changeSpecies(id: SpeciesId): void {
  pet = { ...pet, speciesId: id };
  updateTray();
  sendView();
  persist();
}

function applyElapsedInPlace(): PetState {
  pet = applyElapsed(pet, Date.now());
  return pet;
}

function buildMenu(): Menu {
  const egg = stageOf(pet) === 'egg';
  const demo = (label: string, what: Trigger) => ({
    label,
    enabled: !egg,
    click: () => {
      const now = Date.now();
      behavior = trigger(behavior, what, stepContext(now, TICK_MS));
      sendView();
    },
  });
  return Menu.buildFromTemplate([
    { label: '상태 보기', click: () => say(statusText(applyElapsedInPlace())) },
    { type: 'separator' },
    { label: '쓰다듬기', click: () => act('touch') },
    { label: '밥 주기', enabled: !egg, click: () => act('feed') },
    { label: '놀아주기', enabled: !egg, click: () => act('play') },
    { type: 'separator' },
    {
      label: '동작 보기 (테스트용)',
      submenu: [
        demo('잠자기', 'sleep'),
        demo('달리기', 'run'),
        demo('벽 타기', 'climb'),
        demo('혼자 놀기', 'play'),
        { label: '마우스에 매달리기: 마우스를 10초 가만히 두세요', enabled: false },
      ],
    },
    {
      label: '펫 종류 (테스트용)',
      submenu: SPECIES.map((s) => ({
        label: s.name,
        type: 'radio' as const,
        checked: s.id === pet.speciesId,
        click: () => changeSpecies(s.id),
      })),
    },
    { type: 'separator' },
    { label: '종료', click: () => app.quit() },
  ]);
}

function trayIcon() {
  const set = stageOf(pet) === 'egg' ? EGG : getSpecies(pet.speciesId);
  const { width, height, data } = frameToRgba(set.frames.stand, set.palette, 2);
  // Electron 의 비트맵은 BGRA 순서다.
  const bgra = Buffer.alloc(data.length);
  for (let i = 0; i < data.length; i += 4) {
    bgra[i] = data[i + 2] ?? 0;
    bgra[i + 1] = data[i + 1] ?? 0;
    bgra[i + 2] = data[i] ?? 0;
    bgra[i + 3] = data[i + 3] ?? 0;
  }
  return nativeImage.createFromBitmap(bgra, { width, height });
}

function updateTray(): void {
  if (!tray) return;
  tray.setImage(trayIcon());
  tray.setContextMenu(buildMenu());
}

/** 창은 펫보다 크다(말풍선·점프 공간). 펫이 창의 아래쪽 가운데에 오도록 창 위치를 정한다. */
function placeWindow(): void {
  if (!win || win.isDestroyed()) return;
  win.setBounds({
    x: Math.round(behavior.x - (WINDOW.width - petSize) / 2),
    y: Math.round(behavior.y - (WINDOW.height - petSize)),
    width: WINDOW.width,
    height: WINDOW.height,
  });
}

function createWindow(): BrowserWindow {
  const w = new BrowserWindow({
    ...WINDOW,
    x: 0,
    y: 0,
    transparent: true,
    frame: false,
    resizable: false,
    movable: false,
    hasShadow: false,
    skipTaskbar: true,
    focusable: false,
    show: false,
    webPreferences: {
      preload: path.join(projectRoot, 'static', 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });
  w.setAlwaysOnTop(true, 'screen-saver');
  // 투명한 부분은 클릭이 아래 창으로 통과하고, 펫 위에 올라갔을 때만 렌더러가 켠다.
  w.setIgnoreMouseEvents(true, { forward: true });
  w.once('ready-to-show', () => {
    placeWindow();
    w.showInactive();
  });
  void w.loadFile(path.join(projectRoot, 'static', 'index.html'));
  return w;
}

function tick(lastAt: number): number {
  const now = Date.now();
  if (!win || win.isDestroyed()) return now;

  const cursor = screen.getCursorScreenPoint();
  if (Math.hypot(cursor.x - lastCursor.x, cursor.y - lastCursor.y) > CURSOR_MOVE_PX) {
    lastCursor = cursor;
    lastCursorMoveAt = now;
  }

  const size = petPixelSize(stageOf(pet));
  if (size !== petSize) {
    behavior = resize(behavior, petSize, size);
    petSize = size;
  }

  if (drag) {
    behavior = { ...behavior, x: cursor.x - drag.offsetX, y: cursor.y - drag.offsetY };
  } else {
    behavior = step(behavior, stepContext(now, now - lastAt));
  }
  placeWindow();
  sendView();

  const hungryDue = now - lastHungryNoticeAt > HUNGRY_NOTICE_MS;
  if (hungryDue && moodOf(applyElapsedInPlace()) === 'hungry' && stageOf(pet) !== 'egg') {
    lastHungryNoticeAt = now;
    say('배고파요…');
  }
  return now;
}

function setupIpc(): void {
  ipcMain.handle('pet:get-view', () => currentView());
  ipcMain.handle('pet:act', (_event, type: unknown) => {
    if (type === 'touch' || type === 'feed' || type === 'play') return act(type).ok;
    return false;
  });
  ipcMain.on('pet:interactive', (_event, value: unknown) => {
    win?.setIgnoreMouseEvents(value !== true, { forward: true });
  });
  ipcMain.on('pet:drag', (_event, phase: unknown) => {
    const now = Date.now();
    if (phase === 'start') {
      const p = screen.getCursorScreenPoint();
      drag = { offsetX: p.x - behavior.x, offsetY: p.y - behavior.y };
      behavior = carry(behavior, now);
    } else if (drag) {
      drag = null;
      behavior = drop(behavior, now);
    }
    sendView();
  });
  ipcMain.on('pet:context-menu', () => {
    if (win) buildMenu().popup({ window: win });
  });
}

/** 스모크 실행: 렌더러가 에러 없이 뜨는지만 확인하고 종료한다. */
function runSmoke(w: BrowserWindow): void {
  const errors: string[] = [];
  w.webContents.on('console-message', (event) => {
    const details = event as unknown as { level?: string; message?: string };
    if (details.level === 'error') errors.push(details.message ?? '');
  });
  w.webContents.once('did-finish-load', () => {
    setTimeout(() => {
      void w.webContents
        .executeJavaScript('window.__petReady === true')
        .then((ready: boolean) => {
          const ok = ready && errors.length === 0;
          console.log(ok ? 'SMOKE_OK' : `SMOKE_FAIL ready=${String(ready)} errors=${JSON.stringify(errors)}`);
          app.exit(ok ? 0 : 1);
        })
        .catch((error: unknown) => {
          console.log(`SMOKE_FAIL ${String(error)}`);
          app.exit(1);
        });
    }, 1_500);
  });
}

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.whenReady().then(() => {
    savePath = path.join(app.getPath('userData'), 'pet.json');
    const now = Date.now();
    // 처음 실행하면 임의의 종이 든 알로 시작한다. 알은 쓰다듬으면 부화한다.
    pet = applyElapsed(loadPet(savePath) ?? createPet(randomSpecies(), now), now);
    persist();

    petSize = petPixelSize(stageOf(pet));
    const first = screen.getPrimaryDisplay().workArea;
    behavior = createBehavior(first.x + first.width - petSize - 80, first.y + first.height - petSize, now);
    lastCursor = screen.getCursorScreenPoint();
    lastCursorMoveAt = now;

    setupIpc();
    win = createWindow();
    tray = new Tray(trayIcon());
    tray.setToolTip('desktop-tamagotchi');
    tray.setContextMenu(buildMenu());
    if (SMOKE) runSmoke(win);

    let lastAt = Date.now();
    setInterval(() => {
      lastAt = tick(lastAt);
    }, TICK_MS);
    setInterval(() => {
      pet = applyElapsed(pet, Date.now());
      persist();
    }, SAVE_MS);
  });

  app.on('before-quit', () => {
    if (savePath && pet) persist();
  });
  // 창이 하나뿐이고 트레이로 끝낼 수 있으므로, 창이 닫혀도 앱은 유지한다.
  app.on('window-all-closed', () => {});
}

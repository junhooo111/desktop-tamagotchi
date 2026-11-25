/**
 * Electron 메인 프로세스.
 * 투명한 창 하나에 펫을 띄우고, 창을 움직여 화면을 돌아다니게 한다.
 * 규칙(성장·행동·저장)은 순수 모듈에 있고, 여기서는 창·메뉴·IPC·마우스 위치만 다룬다.
 */
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { BrowserWindow, Menu, Tray, app, ipcMain, nativeImage, screen } from 'electron';
import { scanLocalPages, type Finding } from '../inspect/scan.js';
import { LESSONS } from '../shared/lessons.js';
import { QUIZZES } from '../shared/quizzes.js';
import { TIP_PENDING_MS, pickTip, shouldOfferTip, type Tip } from '../shared/tips.js';
import { BUBBLE_GAP, TIP_BUBBLE, WINDOW, bubbleShift, petPixelSize } from '../shared/layout.js';
import {
  LEARN_XP,
  QUIZ_BONUS,
  applyElapsed,
  createPet,
  feed,
  learn,
  levelOf,
  moodOf,
  play,
  stageOf,
  statusText,
  touch,
  type ActionResult,
  type PetState,
} from '../shared/pet.js';
import { SPECIES, frameToRgba, spriteSet, type SpeciesId } from '../shared/species.js';
import type { PetView, TipBubble } from '../shared/view.js';
import { debugProfileDir, findBrowser, launchArgs, type BrowserEnv } from './browser.js';
import { startDemoServer, type DemoServer } from './demo-server.js';
import {
  canInspect,
  carry,
  createBehavior,
  drop,
  endAlert,
  goInspect,
  react,
  resize,
  step,
  trigger,
  wake,
  type BehaviorState,
  type StepContext,
  type Trigger,
} from './behavior.js';
import { petTargetFor } from './inspect-target.js';
import {
  confirm,
  detectFixes,
  emptyProgress,
  loadProgress,
  markFixed,
  markTipSeen,
  pendingFindings,
  prune,
  saveProgress,
  snooze,
  type Progress,
} from './progress.js';
import { loadPet, savePet } from './store.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(here, '..', '..');
const SMOKE = process.argv.includes('--smoke');

const TICK_MS = 33;
const SAVE_MS = 30_000;
const HUNGRY_NOTICE_MS = 5 * 60_000;
/** 마우스가 이 거리 이상 움직여야 "움직였다"고 본다 */
const CURSOR_MOVE_PX = 3;
/** 크롬 원격 디버깅 포트. 환경 변수 PET_CDP_PORT 로 바꿀 수 있다. */
const CDP_PORT = Number(process.env['PET_CDP_PORT'] ?? 9222);
const SCAN_MS = 10_000;
/** 문제를 찾아 알린 뒤 다음 문제를 알리기까지 최소 간격 */
const INSPECT_GAP_MS = 30_000;
const STATUS_OFF = '검사: 연결 안 됨 (메뉴 ▸ 검사 도구 ▸ 검사용 브라우저 열기)';
const CARD_SIZE = { width: 380, height: 600 } as const;
/** 검사 체험용 시험 페이지 서버 포트 */
const DEMO_PORT = Number(process.env['PET_DEMO_PORT'] ?? 5199);

if (SMOKE) {
  // 스모크 실행은 사용자의 실제 저장 파일을 건드리지 않는다.
  app.setPath('userData', fs.mkdtempSync(path.join(os.tmpdir(), 'pet-smoke-')));
} else {
  // 개발 실행과 설치본이 같은 저장 폴더를 쓰도록 이름을 고정한다(설치본의 표시 이름이 달라도 저장이 갈라지지 않게).
  app.setPath('userData', path.join(app.getPath('appData'), 'desktop-tamagotchi'));
}

let win: BrowserWindow | null = null;
let tray: Tray | null = null;
let demoServer: DemoServer | null = null;
let pet: PetState;
let behavior: BehaviorState;
let petSize = 0;
let drag: { offsetX: number; offsetY: number } | null = null;
let lastCursor = { x: 0, y: 0 };
let lastCursorMoveAt = Date.now();
let lastSentKey = '';
let lastHungryNoticeAt = 0;
let savePath = '';

// 검사 상태: 찾은 문제 대기열, 지금 알리는 문제, 학습 진행도
let progress: Progress = emptyProgress();
let progressPath = '';
let queue: Finding[] = [];
let active: Finding | null = null;
let announcedKey = '';
let lastInspectAt = 0;
let scanning = false;
let scanStatus = STATUS_OFF;
let cardWin: BrowserWindow | null = null;

// FE 지식: 펫 위 말풍선으로 보여 주고 사용자가 확인하기를 기다리는 지식
let pendingTip: { tip: Tip; until: number } | null = null;
let lastTipAt = Date.now();
/** 지식 말풍선이 화면 밖으로 잘리지 않도록 옆으로 미는 거리 */
let tipShift = 0;

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
    bubbleShift: tipShift,
  };
}

// ---- FE 지식 말풍선 ----

function tipPayload(tip: Tip): TipBubble {
  const seen = progress.tipsSeen.includes(tip.id);
  return { title: tip.title, body: tip.body, code: tip.code, xp: seen ? 0 : LEARN_XP.tip };
}

function sendTip(): void {
  if (win && !win.isDestroyed()) win.webContents.send('pet:tip', pendingTip ? tipPayload(pendingTip.tip) : null);
}

/** 펫 머리 위 말풍선에 FE 지식을 띄운다. 직접 요청(menu)이면 위쪽에 자리가 없을 때 펫을 아래로 떨어뜨린다. */
function offerTip(now: number, requested = false): void {
  if (pendingTip) return;
  if (requested && !roomAboveForTip()) behavior = drop(behavior, now);
  pendingTip = { tip: pickTip(progress.tipsSeen, Math.random), until: now + TIP_PENDING_MS };
  lastTipAt = now;
  sendTip();
}

/** 말풍선의 `확인`: 처음 읽는 지식이면 경험치를 주고, 말풍선을 지운다. */
function confirmTip(): void {
  const current = pendingTip;
  if (!current) return;
  if (!progress.tipsSeen.includes(current.tip.id)) {
    const result = learn(applyElapsedInPlace(), 'tip');
    pet = result.pet;
    say(result.message);
    persist();
    updateTray();
  }
  progress = markTipSeen(progress, current.tip.id);
  persistProgress();
  pendingTip = null;
  sendTip();
}

function roomAboveForTip(): boolean {
  const area = screen.getDisplayNearestPoint({ x: Math.round(behavior.x), y: Math.round(behavior.y) }).workArea;
  return behavior.y - (TIP_BUBBLE.maxHeight + BUBBLE_GAP) >= area.y;
}

/** 지식 말풍선이 있으면, 화면 가장자리에서 잘리지 않도록 옆으로 밀 거리를 계산한다. */
function computeTipShift(): number {
  if (!pendingTip) return 0;
  const area = screen.getDisplayNearestPoint({ x: Math.round(behavior.x), y: Math.round(behavior.y) }).workArea;
  return bubbleShift(behavior.x + petSize / 2, TIP_BUBBLE.width, area.x, area.x + area.width);
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

function setScanStatus(text: string): void {
  if (text === scanStatus) return;
  scanStatus = text;
  updateTray();
}

function persistProgress(): void {
  try {
    saveProgress(progressPath, progress);
  } catch (error) {
    console.error('진행도 저장 실패', error);
  }
}

/** 열려 있는 로컬 페이지를 검사해서 새 문제를 대기열에 넣고, 고친 것을 찾아 보상한다. */
async function scanOnce(): Promise<void> {
  if (scanning) return;
  if (stageOf(pet) === 'egg') {
    queue = [];
    setScanStatus('검사: 알이 부화하면 시작해요');
    return;
  }
  scanning = true;
  try {
    const result = await scanLocalPages(CDP_PORT);
    const now = Date.now();
    if (!result.reachable) {
      queue = [];
      setScanStatus(STATUS_OFF);
      return;
    }
    setScanStatus(`검사: 연결됨 · 로컬 페이지 ${result.scannedUrls.length}개`);

    const fixed = detectFixes(progress, result.scannedUrls, new Set(result.findings.map((f) => f.key)));
    if (fixed.length > 0) {
      progress = markFixed(progress, fixed);
      let message = '';
      for (let i = 0; i < fixed.length; i++) {
        const r = learn(applyElapsedInPlace(), 'fixed');
        pet = r.pet;
        message = r.message;
      }
      say(fixed.length === 1 ? message : `${fixed.length}개나 고쳤네요! 경험치 +${fixed.length * LEARN_XP.fixed}`);
      updateTray();
      sendView();
      persist();
    }

    progress = prune(progress, now);
    // 화면에 위치가 있는 문제를 먼저 알린다.
    queue = pendingFindings(result.findings, progress, now).sort((a, b) => Number(b.rect !== null) - Number(a.rect !== null));
    persistProgress();
  } finally {
    scanning = false;
  }
}

function closeCard(): void {
  if (cardWin && !cardWin.isDestroyed()) cardWin.destroy();
  cardWin = null;
}

/** 펫 근처에 찾은 문제의 배움 카드 창을 연다. */
function openCard(): void {
  if (!active) return;
  closeCard();
  const area = screen.getDisplayNearestPoint({ x: Math.round(behavior.x), y: Math.round(behavior.y) }).workArea;
  const { width, height } = CARD_SIZE;
  const x = Math.round(Math.min(Math.max(behavior.x + petSize / 2 - width / 2, area.x), area.x + area.width - width));
  let y = behavior.y - height - 8;
  if (y < area.y) y = behavior.y + petSize + 8;
  y = Math.round(Math.min(Math.max(y, area.y), area.y + area.height - height));

  const w = new BrowserWindow({
    x,
    y,
    width,
    height,
    frame: false,
    resizable: false,
    skipTaskbar: true,
    show: false,
    backgroundColor: '#fffdf5',
    webPreferences: {
      preload: path.join(projectRoot, 'static', 'card-preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });
  w.setAlwaysOnTop(true, 'screen-saver');
  w.once('ready-to-show', () => w.show());
  w.on('closed', () => {
    if (cardWin === w) cardWin = null;
  });
  void w.loadFile(path.join(projectRoot, 'static', 'card.html'));
  cardWin = w;
}

/**
 * 배움 카드를 닫는다: 퀴즈를 풀고 확인하면 경험치(맞히면 보너스), 나중에 보기로 하면 한동안 다시 알리지 않는다.
 * choice 는 퀴즈에서 고른 보기 번호다. 채점은 여기서 한다.
 */
function finishCard(kind: 'confirm' | 'later', choice: number | null = null): void {
  const now = Date.now();
  const finding = active;
  if (finding) {
    if (kind === 'confirm') {
      // 퀴즈를 풀지 않은 확인은 받아 주지 않는다.
      if (choice === null || choice < 0 || choice > 2) return;
      const correct = choice === QUIZZES[finding.ruleId].answer;
      progress = confirm(progress, finding.key, now);
      const result = learn(applyElapsedInPlace(), 'confirm', correct ? QUIZ_BONUS : 0);
      pet = result.pet;
      say(result.message);
      persist();
      updateTray();
    } else {
      progress = snooze(progress, finding.key, now);
    }
    persistProgress();
    queue = queue.filter((f) => f.key !== finding.key);
    active = null;
    behavior = endAlert(behavior, now);
  }
  closeCard();
  sendView();
}

function act(type: 'touch' | 'feed' | 'play'): ActionResult {
  // 문제를 찾아 알리는 중에 펫을 누르면 쓰다듬기 대신 배움 카드가 열린다.
  if (type === 'touch' && active && behavior.mode === 'alert') {
    openCard();
    return { pet, ok: true, message: '' };
  }
  const now = Date.now();
  const current = applyElapsed(pet, now);
  const result = type === 'touch' ? touch(current, now) : type === 'feed' ? feed(current) : play(current);
  pet = result.pet;
  if (result.ok) {
    behavior = wake(behavior, now);
    // 손길에 반응하는 동작: 쓰다듬으면 좋아하고, 밥을 주면 먹고, 놀아 주면 폴짝폴짝 논다.
    if (type === 'touch') behavior = react(behavior, 'happy', now);
    else if (type === 'feed') behavior = react(behavior, 'eat', now);
    else behavior = trigger(behavior, 'play', stepContext(now, TICK_MS));
  }
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

/** 원격 디버깅 포트가 열린 별도 프로필의 크롬/엣지를 연다. 브라우저를 못 찾으면 false. */
function openInspectBrowser(url: string): boolean {
  const env = process.env as BrowserEnv;
  const exe = findBrowser(env);
  if (!exe) {
    say('크롬이나 엣지를 찾지 못했어요');
    return false;
  }
  const profile = debugProfileDir(env);
  fs.mkdirSync(profile, { recursive: true });
  spawn(exe, launchArgs({ port: CDP_PORT, profile, url }), { detached: true, stdio: 'ignore' }).unref();
  return true;
}

/** 시험 페이지(문제를 일부러 넣어 둔 페이지)를 열어서 검사를 체험해 본다. */
async function openDemo(): Promise<void> {
  let url = `http://localhost:${DEMO_PORT}/`;
  try {
    demoServer ??= await startDemoServer(path.join(projectRoot, 'test-pages'), DEMO_PORT);
    url = demoServer.url;
  } catch {
    // 포트가 이미 쓰이는 중이다(예: npm run demo 가 떠 있음). 그 서버를 그대로 연다.
  }
  if (openInspectBrowser(url)) say('시험 페이지를 열었어요. 곧 문제를 찾아볼게요!');
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
    { label: scanStatus, enabled: false },
    { label: '지금 검사하기', enabled: !egg, click: () => void scanOnce() },
    {
      label: '검사 도구',
      submenu: [
        {
          label: '검사용 브라우저 열기',
          click: () => {
            if (openInspectBrowser('about:blank')) say('여기서 localhost 주소를 열면 제가 살펴볼게요');
          },
        },
        { label: '검사 체험 (시험 페이지 열기)', click: () => void openDemo() },
        { type: 'separator' },
        { label: `연결 포트 ${CDP_PORT} · localhost 페이지만 검사`, enabled: false },
      ],
    },
    {
      label: '오늘의 FE 지식',
      enabled: !egg,
      click: () => offerTip(Date.now(), true),
    },
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
    {
      // 설치본에서만 동작한다(개발 실행에서 켜면 electron.exe 가 로그인 항목에 등록되기 때문).
      label: app.isPackaged ? '로그인할 때 자동 실행' : '로그인할 때 자동 실행 (설치본에서만)',
      type: 'checkbox',
      enabled: app.isPackaged,
      checked: app.isPackaged && app.getLoginItemSettings().openAtLogin,
      click: (item) => app.setLoginItemSettings({ openAtLogin: item.checked }),
    },
    { label: `버전 ${app.getVersion()}`, enabled: false },
    { label: '종료', click: () => app.quit() },
  ]);
}

function trayIcon() {
  const set = spriteSet(pet.speciesId, stageOf(pet));
  // 트레이 아이콘은 32x32 그림 그대로(배율 1)
  const { width, height, data } = frameToRgba(set.frames.idleA, set.palette, 1);
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

/** 찾은 문제가 있으면 그 자리로 가고, 도착하면 알리고, 다른 일로 끊기면 한동안 미룬다. */
function updateInspection(now: number, dtMs: number): void {
  // 말풍선으로 알려 준 FE 지식을 한참 확인하지 않으면 거둔다.
  if (pendingTip && now >= pendingTip.until) {
    pendingTip = null;
    sendTip();
  }
  // 지식 말풍선이 떠 있는 동안에는 펫이 돌아다니지 않고 그 자리에 서 있는다(확인 버튼을 누를 수 있게).
  if (pendingTip && behavior.mode === 'idle') behavior = { ...behavior, until: now + 1_500 };
  const busy = active !== null || queue.length > 0 || cardWin !== null || drag !== null || pendingTip !== null;
  if (shouldOfferTip({ now, lastTipAt, mode: behavior.mode, stage: stageOf(pet), busy, roomAbove: roomAboveForTip() })) {
    offerTip(now);
  }

  if (active) {
    const traveling = behavior.mode === 'run' && behavior.then === 'alert';
    if (behavior.mode === 'alert') {
      if (announcedKey !== active.key) {
        announcedKey = active.key;
        say(LESSONS[active.ruleId].bubble);
      }
    } else if (!traveling && !cardWin) {
      progress = snooze(progress, active.key, now);
      persistProgress();
      queue = queue.filter((f) => f.key !== active?.key);
      active = null;
    }
    return;
  }
  const next = queue[0];
  if (!next || drag || cardWin || now - lastInspectAt < INSPECT_GAP_MS) return;
  if (!canInspect(behavior, stageOf(pet))) return;

  queue = queue.slice(1);
  active = next;
  lastInspectAt = now;
  const ctx = stepContext(now, dtMs);
  const target = petTargetFor(next, petSize, ctx.areas);
  behavior = goInspect(behavior, ctx, target.x, target.y);
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
  updateInspection(now, now - lastAt);
  tipShift = Math.round(computeTipShift());
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
  ipcMain.handle('card:get', () => {
    if (!active) return null;
    return {
      lesson: LESSONS[active.ruleId],
      quiz: QUIZZES[active.ruleId],
      selector: active.selector,
      detail: active.detail,
      xp: LEARN_XP.confirm,
      bonus: QUIZ_BONUS,
    };
  });
  ipcMain.on('tip:confirm', () => confirmTip());
  ipcMain.on('card:confirm', (_event, choice: unknown) =>
    finishCard('confirm', typeof choice === 'number' ? choice : null),
  );
  ipcMain.on('card:later', () => finishCard('later'));
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
    progressPath = path.join(app.getPath('userData'), 'progress.json');
    progress = loadProgress(progressPath);
    const now = Date.now();
    lastTipAt = now;
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

    setTimeout(() => void scanOnce(), 3_000);
    setInterval(() => void scanOnce(), SCAN_MS);
  });

  app.on('before-quit', () => {
    if (savePath && pet) persist();
    void demoServer?.close();
  });
  // 창이 하나뿐이고 트레이로 끝낼 수 있으므로, 창이 닫혀도 앱은 유지한다.
  app.on('window-all-closed', () => {});
}

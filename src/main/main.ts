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
import { BrowserWindow, Menu, Notification, Tray, app, dialog, ipcMain, nativeImage, safeStorage, screen, shell } from 'electron';
import electronUpdater from 'electron-updater';
import { SnapshotFeed, mergeScans } from '../inspect/feed.js';
import { scanLocalPages, type Finding } from '../inspect/scan.js';
import { renderProfileCard } from '../shared/card.js';
import { BACKEND } from '../shared/backend.js';
import { AccountSync, type Choice, type ConflictInfo } from './account-sync.js';
import { ServerGame, applyServerPull, mirrorCollection, type Grant } from './server-game.js';
import { AUTH_SCHEME, AuthService, EncryptedFileStorage } from './auth.js';
import { applyEvent, buildCodex, emptyGrowth, localDay, type Growth, type GrowthEvent } from '../shared/growth.js';
import { LESSONS, RULE_IDS, type RuleId } from '../shared/lessons.js';
import { noticeOf } from '../shared/notice.js';
import type { NoticeMessage } from '../shared/view.js';
import { QUIZZES } from '../shared/quizzes.js';
import { addIgnored, buildResults, isMuted, visibleFindings } from '../shared/results.js';
import { DEFAULT_SETTINGS, sanitizeSettings, tipIntervalMs, type Settings } from '../shared/settings.js';
import { TIP_PENDING_MS, pickTip, shouldOfferTip, type Tip } from '../shared/tips.js';
import { BUBBLE_GAP, TIP_BUBBLE, WINDOW, bubbleShift, petPixelSize } from '../shared/layout.js';
import {
  LEARN_XP,
  QUIZ_BONUS,
  applyElapsed,
  afterPoop,
  canStroll,
  createPet,
  effectiveStage,
  finishStroll,
  isDisplayStage,
  isDirty,
  wash,
  feed,
  gainXp,
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
import { ACCESSORIES, COMMON_SPECIES, SPECIES, VARIANTS, frameToRgba, getSpecies, isAccessory, isHiddenSpecies, isSpeciesId, isVariant, spriteSet, type SpeciesId } from '../shared/species.js';
import {
  ACCESSORY_NAMES,
  GACHA_ACCESSORIES,
  VARIANT_NAMES,
  accessoryUnlocked,
  allowedPatch,
  buildWardrobe,
  cardSpeciesOf,
  rewardText,
  rewardsFor,
  variantUnlocked,
  type Extra,
  type WardrobePatch,
} from '../shared/wardrobe.js';
import {
  DUPLICATE_XP,
  buildCollectionView,
  claimCare,
  addUptime,
  claimDaily,
  claimUpdateGift,
  levelRewards,
  migrateCollection,
  ownedIds,
  pullCosmetic,
  pullSpecies,
  switchActive,
  syncActive,
  type Collection,
} from '../shared/collection.js';
import { loadCollection, saveCollection } from './collection-store.js';
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
  clearHome,
  isOccupied,
  isStrolling,
  react,
  resize,
  setHome,
  startPoop,
  startStroll,
  startWash,
  step,
  trigger,
  wake,
  type BehaviorState,
  type StepContext,
  type Trigger,
} from './behavior.js';
import { FEED_PORT_DEFAULT, startFeedServer, type FeedServer } from './feed-server.js';
import { petTargetFor } from './inspect-target.js';
import { loadGrowth, saveGrowth } from './growth-store.js';
import { loadSettings, saveSettings } from './settings-store.js';
import { newsText, pickNews, type NewsItem } from '../shared/news.js';
import { buildStatus } from '../shared/status.js';
import { GIFT_LIFE_MS, GIFT_WINDOW, giftHtml, giftText, nextGiftDelayMs, offerGift, rollGift } from '../shared/gift.js';
import { POOP_LIFE_MS, POOP_SIZE, poopHtml } from '../shared/poop.js';
import { fetchNews, loadSeen, saveSeen } from './news.js';
import { createMacUpdater } from './mac-updater-node.js';
import type { MacAutoUpdater } from './mac-updater.js';
import { UPDATE_EVERY_MS, UPDATE_FIRST_CHECK_MS, UPDATE_REMIND_MS, UpdateController, type AutoUpdaterLike } from './updater.js';
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
/** 브라우저 확장이 검사 결과를 보내는 로컬 포트(127.0.0.1 전용). 환경 변수 PET_FEED_PORT 로 바꿀 수 있다. */
const FEED_PORT = Number(process.env['PET_FEED_PORT'] ?? FEED_PORT_DEFAULT);
/** 문제를 찾아 알린 뒤 다음 문제를 알리기까지 최소 간격 */
const INSPECT_GAP_MS = 30_000;
const STATUS_OFF = '검사: 연결 안 됨 (크롬 확장을 켜고 localhost 페이지를 여세요)';
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
/** 브라우저 확장이 보낸 검사 결과 */
const extensionFeed = new SnapshotFeed();
let feedServer: FeedServer | null = null;
/** 사용자 설정(설정 창에서 바꾸면 바로 적용·저장한다) */
let settings: Settings = { ...DEFAULT_SETTINGS };
/** GitHub 로그인(Supabase). 서버 주소가 비어 있으면 꺼진 채로 둔다. */
let auth: AuthService | null = null;
/** 로그인한 계정과 이 PC의 저장 파일을 맞춘다(첫 로그인 때 기존 진행을 올리고, 다른 PC에서는 받아 온다). */
let accountSync: AccountSync | null = null;
/** 로그인하면 뽑기·뽑기권·컬렉션은 서버가 기준이다(로그인하지 않으면 지금처럼 로컬). */
let serverGame: ServerGame | null = null;
const serverOn = (): boolean => Boolean(auth?.user && serverGame?.ready);
let settingsPath = '';
let settingsWin: BrowserWindow | null = null;
let scanTimer: ReturnType<typeof setInterval> | undefined;
/** 자동 업데이트(설치본에서만 만든다) */
let updates: UpdateController | null = null;
let macUpdater: MacAutoUpdater | null = null;
/** 성장 기록: 연속 사용·업적·도감 */
let growth: Growth = emptyGrowth();
let growthPath = '';
/** 가진 동물 목록·뽑기권(지금 키우는 동물은 이 중 하나) */
let collection: Collection;
let collectionPath = '';
let collectionWin: BrowserWindow | null = null;
let newsPath = '';
/** 마지막으로 가져온 공지(메뉴에 보여 준다) */
let newsItems: NewsItem[] = [];
let codexWin: BrowserWindow | null = null;
/** 가장 최근 검사에서 찾은 모든 문제(꺼 둔 규칙·무시한 문제 포함). 검사 결과 창이 보여 준다. */
let lastFindings: Finding[] = [];
let lastConnected = false;
let resultsWin: BrowserWindow | null = null;
let wardrobeWin: BrowserWindow | null = null;
let queue: Finding[] = [];
let active: Finding | null = null;
/** 마지막으로 알린 문제. 말풍선이 사라진 뒤에도 기억해 두었다가, 펫에 마우스를 올리면 다시 보여 준다. */
let notice: Finding | null = null;
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

/** 처음 시작할 때 받는 동물(히든은 나오지 않는다) */
const randomSpecies = (): SpeciesId => {
  const pick = COMMON_SPECIES[Math.floor(Math.random() * COMMON_SPECIES.length)];
  return (pick ?? SPECIES[0]!).id;
};

function currentView(): PetView {
  return {
    speciesId: pet.speciesId,
    stage: effectiveStage(stageOf(pet), settings.displayStage),
    level: levelOf(pet.xp),
    mood: moodOf(pet),
    mode: behavior.mode,
    surface: behavior.surface,
    dir: behavior.dir,
    play: behavior.play,
    since: behavior.since,
    bubbleShift: tipShift,
    scale: settings.petScale,
    variant: settings.variant,
    accessory: settings.accessory,
    dirty: isDirty(pet),
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
  const firstRead = !progress.tipsSeen.includes(current.tip.id);
  if (firstRead) {
    const result = learn(applyElapsedInPlace(), 'tip');
    pet = result.pet;
    say(result.message);
    persist();
    updateTray();
  }
  progress = markTipSeen(progress, current.tip.id);
  persistProgress();
  if (firstRead) recordGrowth({ kind: 'tip' });
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

/** 렌더러에 기억할 문제를 알린다. show 면 바로 띄우고, 아니면 hover 때만 나온다. null 이면 지운다. */
function setNotice(finding: Finding | null, show: boolean): void {
  notice = finding;
  if (!win || win.isDestroyed()) return;
  const message: NoticeMessage = { notice: finding ? noticeOf(finding) : null, show };
  win.webContents.send('pet:notice', message);
}

/** 상태 보기: 이름·레벨(등급 색)과 배부름·기분·청결 막대를 말풍선으로 띄운다. */
function showStatus(): void {
  if (!win || win.isDestroyed()) return;
  win.webContents.send('pet:status', buildStatus(applyElapsedInPlace(), settings.petName, settings.displayStage));
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
  if (!collectionPath) return;
  // 컬렉션에 지금 동물의 상태를 반영하고, 레벨이 올랐으면 레벨 보상(뽑기권)을 준다.
  collection = syncActive(collection, pet, settings.petName);
  const reward = levelRewards(collection, collection.active);
  collection = reward.collection;
  if (reward.tickets > 0 && !serverAward('level', reward.tickets, reward.tickets, `${collection.active}:${reward.level}`, (g) => `레벨 ${reward.level} 보상! 뽑기권 +${g}장`)) {
    announceTickets(`레벨 ${reward.level} 보상! 뽑기권 +${reward.tickets}장`);
  }
  saveCollectionSafe();
}

function saveCollectionSafe(): void {
  try {
    saveCollection(collectionPath, collection);
  } catch (error) {
    console.error('컬렉션 저장 실패', error);
  }
  refreshCollection();
}

/**
 * 로그인(서버 기준) 상태에서 앱이 로컬로 올린 뽑기권을 되돌리고, 서버에 획득을 보내 서버가 인정한 만큼만 받는다.
 * 서버에 닿지 않으면 대기열에 두었다가 다시 보낸다. 서버 기준이 아니면 아무것도 하지 않고 false 를 돌려준다(호출한 쪽이 로컬로 처리).
 */
function serverAward(kind: Grant['kind'], count: number, perCall: number, keyBase: string, text: (granted: number) => string): boolean {
  const game = serverGame;
  if (!serverOn() || !game || count <= 0) return false;
  collection = { ...collection, tickets: Math.max(0, collection.tickets - count) };
  saveCollectionSafe();
  void (async () => {
    let granted = 0;
    for (let i = 0; i < Math.ceil(count / perCall); i++) {
      const r = await game.grant({ kind, amount: Math.min(perCall, count - i * perCall), key: `${keyBase}:${i}` });
      if (r) {
        granted += r.granted;
        collection = { ...collection, tickets: r.tickets };
      }
    }
    saveCollectionSafe();
    if (granted > 0) announceTickets(text(granted));
  })();
  return true;
}

/** 뽑기권을 받았다고 알린다(방금 한 일의 말풍선이 지나간 뒤에). */
function announceTickets(text: string): void {
  setTimeout(() => say(`🎟 ${text}\n메뉴의 '뽑기·컬렉션…'에서 뽑아 보세요 (보유 ${collection.tickets}장)`), 3_000);
}

// ---- 선물 상자: 하루 두세 번 펫이 선물을 가져온다(뽑기권·경험치·응가(꽝)) ----
let giftWin: BrowserWindow | null = null;
let giftTimer: ReturnType<typeof setTimeout> | undefined;
let nextGiftAt = 0;

function closeGift(): void {
  clearTimeout(giftTimer);
  if (giftWin && !giftWin.isDestroyed()) giftWin.destroy();
  giftWin = null;
}

/** 선물 상자를 펫 옆(발 높이)에 붙인다. 펫이 움직이면 따라온다. */
function positionGift(): void {
  if (!giftWin || giftWin.isDestroyed()) return;
  giftWin.setPosition(Math.round(behavior.x + petSize * 0.85), Math.round(behavior.y + petSize - GIFT_WINDOW.height));
}

function openGiftBox(): void {
  closeGift();
  const w = new BrowserWindow({
    ...GIFT_WINDOW,
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
    webPreferences: { preload: path.join(projectRoot, 'static', 'gift-preload.cjs'), contextIsolation: true, nodeIntegration: false, sandbox: true },
  });
  w.setAlwaysOnTop(true, 'screen-saver');
  w.once('ready-to-show', () => {
    positionGift();
    w.showInactive();
  });
  void w.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(giftHtml()));
  giftWin = w;
  positionGift();
  say('선물을 가져왔어요! 🎁 눌러 보세요');
  // 누르지 않으면 잠시 뒤 사라진다.
  giftTimer = setTimeout(() => {
    if (giftWin === w) {
      closeGift();
      say('선물 상자가 사라졌어요…');
    }
  }, GIFT_LIFE_MS);
}

/** 선물 상자를 눌렀다: 뽑기권·경험치·응가(꽝) 중 하나가 나온다. */
function resolveGift(): void {
  if (!giftWin) return;
  setTimeout(closeGift, 200); // 줄어들며 사라지는 연출이 끝난 뒤 창을 닫는다
  clearTimeout(giftTimer);
  const result = rollGift(Math.random);
  let note = '';
  if (result.kind === 'ticket') {
    collection = { ...collection, tickets: collection.tickets + result.tickets };
    saveCollectionSafe();
    serverAward('gift', result.tickets, 1, `gift:${Date.now()}`, (g) => `선물 상자에서 뽑기권 +${g}장!`);
  } else if (result.kind === 'xp') {
    const gained = gainXp(applyElapsedInPlace(), result.xp);
    pet = gained.pet;
    note = gained.note;
    persist();
    updateTray();
    sendView();
  } else {
    spawnPoop(); // 꽝: 응가가 나온다(눌러서 치울 수 있다)
  }
  if (result.kind !== 'dud') behavior = react(behavior, 'happy', Date.now());
  say(giftText(result) + note);
}

/** 1분마다: 때가 되었고 오늘 한도(3번)가 남았으면 선물을 가져온다. */
function maybeOfferGift(now: number): void {
  if (!collectionPath || (giftWin && !giftWin.isDestroyed()) || stageOf(pet) === 'egg' || now < nextGiftAt) return;
  const r = offerGift(collection, localDay(now));
  collection = r.collection;
  if (!r.ok) {
    nextGiftAt = now + 60 * 60_000; // 오늘은 다 가져왔다: 날짜가 바뀐 뒤 다시 본다
    return;
  }
  saveCollectionSafe();
  nextGiftAt = now + nextGiftDelayMs(Math.random);
  openGiftBox();
}

/** 켜 둔 시간으로 받는 뽑기권: 1분마다 흐른 시간을 더한다(컴퓨터가 잠든 사이 같은 긴 공백은 1분만 센다). */
let lastUptimeAt = 0;
function accrueUptime(): void {
  if (!collectionPath) return;
  const now = Date.now();
  const gap = lastUptimeAt === 0 ? 0 : Math.min(now - lastUptimeAt, 2 * 60_000);
  lastUptimeAt = now;
  const r = addUptime(collection, gap, localDay(now));
  collection = r.collection;
  if (r.tickets > 0) {
    saveCollectionSafe();
    if (!serverAward('uptime', r.tickets, 1, localDay(now), (g) => `함께 있어 줘서 고마워요! 뽑기권 +${g}장`)) {
      announceTickets(`함께 있어 줘서 고마워요! 뽑기권 +${r.tickets}장`);
    }
  }
}

/** 오늘 처음 켰으면 출석 보상을 준다. */
function checkDaily(): void {
  if (!collectionPath) return;
  if (serverOn() && serverGame) {
    // 서버 기준: 하루 한 번 서버가 정한 만큼 받는다(로컬 출석 기록은 건드리지 않는다).
    void serverGame.claimDaily().then((r) => {
      if (!r) return;
      collection = { ...collection, tickets: r.tickets };
      saveCollectionSafe();
      if (r.granted > 0) announceTickets(`오늘의 출석 보상! 뽑기권 +${r.granted}장`);
    });
    return;
  }
  const r = claimDaily(collection, localDay(Date.now()));
  if (r.tickets === 0) return;
  collection = r.collection;
  saveCollectionSafe();
  announceTickets(`오늘의 출석 보상! 뽑기권 +${r.tickets}장`);
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
  if (!settings.inspectEnabled) {
    queue = [];
    setScanStatus('검사: 꺼져 있어요 (설정에서 켤 수 있어요)');
    return;
  }
  if (stageOf(pet) === 'egg') {
    queue = [];
    setScanStatus('검사: 알이 부화하면 시작해요');
    return;
  }
  scanning = true;
  try {
    const now = Date.now();
    const fromExtension = extensionFeed.scan(now);
    const result = mergeScans(await scanLocalPages(CDP_PORT), fromExtension);
    lastFindings = result.findings;
    lastConnected = result.reachable;
    refreshResults();
    if (!result.reachable) {
      queue = [];
      if (notice) setNotice(null, false);
      setScanStatus(STATUS_OFF);
      return;
    }
    setScanStatus(`검사: ${fromExtension.reachable ? '확장 연결됨' : '연결됨'} · 로컬 페이지 ${result.scannedUrls.length}개`);

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
      for (const key of fixed) {
        const ruleId = ruleIdOfKey(key);
        if (ruleId) recordGrowth({ kind: 'fix', ruleId });
      }
      updateTray();
      sendView();
      persist();
    }

    // 고쳐서 사라진 문제는 더 알리지 않는다.
    if (notice && (!result.findings.some((f) => f.key === notice?.key) || isMuted(notice, settings))) setNotice(null, false);
    progress = prune(progress, now);
    // 화면에 위치가 있는 문제를 먼저 알린다.
    queue = pendingFindings(visibleFindings(result.findings, settings), progress, now).sort((a, b) => Number(b.rect !== null) - Number(a.rect !== null));
    persistProgress();
  } finally {
    scanning = false;
  }
}

/** 검사 주기를 설정에 맞춰 다시 건다 */
function scheduleScan(): void {
  if (scanTimer) clearInterval(scanTimer);
  scanTimer = setInterval(() => void scanOnce(), settings.scanSeconds * 1000);
}

/** 설정을 바꿔 저장하고 바로 적용한다. 어떤 값이 와도 sanitizeSettings 로 걸러서 항상 유효한 설정만 쓴다. */
function applySettings(patch: unknown): Settings {
  const before = settings;
  const incoming = typeof patch === 'object' && patch !== null ? (patch as Record<string, unknown>) : {};
  settings = sanitizeSettings({ ...settings, ...incoming });
  try {
    saveSettings(settingsPath, settings);
  } catch (error) {
    console.error('설정 저장 실패', error);
  }
  if (settings.scanSeconds !== before.scanSeconds) scheduleScan();
  queue = visibleFindings(queue, settings);
  if (notice && isMuted(notice, settings)) setNotice(null, false);
  refreshResults();
  if (!settings.inspectEnabled) {
    queue = [];
    setNotice(null, false);
  } else if (!before.inspectEnabled) {
    void scanOnce();
  }
  updateTray();
  sendView();
  return settings;
}

/** 문제 키(주소|규칙|요소 경로)에서 규칙 id 를 꺼낸다. 모르는 규칙이면 null. */
function ruleIdOfKey(key: string): RuleId | null {
  const id = key.split('|')[1];
  return (RULE_IDS as readonly string[]).includes(id ?? '') ? (id as RuleId) : null;
}

/** 업적 계산에 쓰는 바깥 정보: 읽은 지식 수와 컬렉션 현황 */
function growthCtx(): { tipsSeen: number; collected: number; pulls: number; hiddenOwned: number } {
  const owned = collection ? ownedIds(collection) : [];
  return {
    tipsSeen: progress.tipsSeen.length,
    collected: owned.length,
    pulls: collection?.pulls ?? 0,
    hiddenOwned: owned.filter((id) => isHiddenSpecies(id)).length,
  };
}

/** 한 일을 성장 기록에 남기고, 새로 달성한 업적이 있으면 경험치를 주고 펫이 알린다. */
function recordGrowth(event: GrowthEvent): void {
  const result = applyEvent(growth, event, Date.now(), growthCtx());
  growth = result.growth;
  if (event.kind === 'care' && collectionPath) {
    const care = claimCare(collection, growth.counters.care);
    if (care.tickets > 0) {
      collection = care.collection;
      saveCollectionSafe();
      if (!serverAward('care', care.tickets, 1, `care:${collection.careTicketsGiven - care.tickets}`, (g) => `열심히 돌봐 줘서 뽑기권 +${g}장!`)) {
        announceTickets(`열심히 돌봐 줘서 뽑기권 +${care.tickets}장!`);
      }
    }
  }
  try {
    saveGrowth(growthPath, growth);
  } catch (error) {
    console.error('성장 기록 저장 실패', error);
  }
  if (codexWin && !codexWin.isDestroyed()) codexWin.webContents.send('codex:refresh');
  if (result.unlocked.length === 0) return;

  let xp = 0;
  let note = '';
  for (const a of result.unlocked) {
    const gained = gainXp(applyElapsedInPlace(), a.xp);
    pet = gained.pet;
    xp += a.xp;
    note += gained.note;
  }
  persist();
  updateTray();
  sendView();
  // 방금 한 일의 말풍선이 지나간 뒤에 알린다.
  const names = result.unlocked.map((a) => a.name).join(', ');
  const rewards = rewardsFor(result.unlocked.map((a) => a.id));
  let text = '업적 달성: ' + names + '! 경험치 +' + xp + note;
  const reward = rewardText(rewards);
  if (reward) text += '\n' + reward;
  const firstAccessory = rewards.accessories[0];
  if (firstAccessory && settings.accessory === 'none') {
    applySettings({ accessory: firstAccessory });
    text += '\n' + ACCESSORY_NAMES[firstAccessory] + ' 을(를) 바로 달아 줬어요!';
  }
  refreshWardrobe();
  setTimeout(() => say(text), 2_500);
}

function refreshResults(): void {
  if (resultsWin && !resultsWin.isDestroyed()) resultsWin.webContents.send('results:refresh');
}

function closeResults(): void {
  if (resultsWin && !resultsWin.isDestroyed()) resultsWin.close();
  resultsWin = null;
}

function openResults(): void {
  if (resultsWin && !resultsWin.isDestroyed()) {
    resultsWin.show();
    resultsWin.focus();
    return;
  }
  const area = screen.getDisplayNearestPoint({ x: Math.round(behavior.x), y: Math.round(behavior.y) }).workArea;
  const width = 520;
  const height = Math.min(680, area.height - 40);
  const w = new BrowserWindow({
    x: area.x + Math.round((area.width - width) / 2),
    y: area.y + Math.round((area.height - height) / 2),
    width,
    height,
    resizable: true,
    minimizable: false,
    maximizable: false,
    autoHideMenuBar: true,
    title: '검사 결과',
    backgroundColor: '#fffdf5',
    show: false,
    webPreferences: {
      preload: path.join(projectRoot, 'static', 'results-preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });
  w.setMenu(null);
  w.setAlwaysOnTop(true, 'screen-saver');
  w.once('ready-to-show', () => w.show());
  w.on('closed', () => {
    if (resultsWin === w) resultsWin = null;
  });
  void w.loadFile(path.join(projectRoot, 'static', 'results.html'));
  resultsWin = w;
}

/** IPC 로 받은 문제 키가 쓸 만한 문자열인지 */
const isKey = (v: unknown): v is string => typeof v === 'string' && v !== '' && v.length <= 600;

/** 뽑기로 얻은 꾸미기와 가진 동물(업적으로 연 것과 합쳐서 쓴다) */
function wardrobeExtra(): Extra {
  return { accessories: collection.accessories, variants: collection.variants, species: ownedIds(collection), stage: stageOf(pet) };
}

/** 꾸미기 창에 보여 줄 값. 알이면 새끼 모습으로 미리 보여 준다. */
function wardrobeData() {
  const stage = effectiveStage(stageOf(pet), settings.displayStage);
  return {
    ...buildWardrobe(growth, { speciesId: pet.speciesId, variant: settings.variant, accessory: settings.accessory, name: settings.petName, cardSpecies: settings.cardSpecies, displayStage: settings.displayStage }, wardrobeExtra()),
    stage: (stage === 'egg' ? 'baby' : stage) as 'baby' | 'adult' | 'legend',
  };
}

/** 꾸미기를 바꾼다. 요청이 어떤 값이든 아는 값만 받고, 업적으로 아직 안 열린 것은 버린다. */
function applyWardrobe(raw: unknown) {
  const r = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {};
  const wanted: WardrobePatch = {};
  if (isVariant(r['variant'])) wanted.variant = r['variant'];
  if (isAccessory(r['accessory'])) wanted.accessory = r['accessory'];
  if (typeof r['name'] === 'string') wanted.name = r['name'];
  if (isDisplayStage(r['displayStage'])) wanted.displayStage = r['displayStage'];
  if (r['cardSpecies'] === 'current' || isSpeciesId(r['cardSpecies'])) wanted.cardSpecies = r['cardSpecies'];
  const ok = allowedPatch(growth, wanted, wardrobeExtra());
  const settingsPatch = {
    ...(ok.variant !== undefined ? { variant: ok.variant } : {}),
    ...(ok.accessory !== undefined ? { accessory: ok.accessory } : {}),
    ...(ok.name !== undefined ? { petName: ok.name } : {}),
    ...(ok.displayStage !== undefined ? { displayStage: ok.displayStage } : {}),
    ...(ok.cardSpecies !== undefined ? { cardSpecies: ok.cardSpecies } : {}),
  };
  if (Object.keys(settingsPatch).length > 0) applySettings(settingsPatch);
  return wardrobeData();
}

function refreshWardrobe(): void {
  if (wardrobeWin && !wardrobeWin.isDestroyed()) wardrobeWin.webContents.send('wardrobe:refresh');
}

function closeWardrobe(): void {
  if (wardrobeWin && !wardrobeWin.isDestroyed()) wardrobeWin.close();
  wardrobeWin = null;
}

function openWardrobe(): void {
  if (wardrobeWin && !wardrobeWin.isDestroyed()) {
    wardrobeWin.show();
    wardrobeWin.focus();
    return;
  }
  const area = screen.getDisplayNearestPoint({ x: Math.round(behavior.x), y: Math.round(behavior.y) }).workArea;
  const width = 420;
  const height = Math.min(640, area.height - 40);
  const w = new BrowserWindow({
    x: area.x + Math.round((area.width - width) / 2),
    y: area.y + Math.round((area.height - height) / 2),
    width,
    height,
    resizable: false,
    minimizable: false,
    maximizable: false,
    autoHideMenuBar: true,
    title: '꾸미기',
    backgroundColor: '#fffdf5',
    show: false,
    webPreferences: {
      preload: path.join(projectRoot, 'static', 'wardrobe-preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });
  w.setMenu(null);
  w.setAlwaysOnTop(true, 'screen-saver');
  w.once('ready-to-show', () => w.show());
  w.on('closed', () => {
    if (wardrobeWin === w) wardrobeWin = null;
  });
  void w.loadFile(path.join(projectRoot, 'static', 'wardrobe.html'));
  wardrobeWin = w;
}

/** 지금 펫의 프로필 카드(SVG)를 파일로 저장한다. GitHub 프로필 README 에 걸 수 있다. */
async function exportCard(): Promise<void> {
  const current = applyElapsedInPlace();
  collection = syncActive(collection, current, settings.petName);
  // 카드에는 고른 동물(없으면 지금 키우는 동물) 자신의 레벨·모습이 나온다.
  const cardId = cardSpeciesOf(settings.cardSpecies, collection.active, ownedIds(collection));
  const entry = collection.owned[cardId];
  const svg = renderProfileCard({
    pet: cardId === collection.active ? current : (entry?.pet ?? current),
    stage: cardId === collection.active ? effectiveStage(stageOf(current), settings.displayStage) : undefined,
    name: cardId === collection.active ? settings.petName : (entry?.name ?? ''),
    style: { variant: settings.variant, accessory: settings.accessory },
    codex: buildCodex(growth, growthCtx(), Date.now()),
  });
  const result = await dialog.showSaveDialog({
    title: '프로필 카드 저장',
    defaultPath: path.join(app.getPath('documents'), 'pet-card.svg'),
    filters: [{ name: 'SVG 이미지', extensions: ['svg'] }],
  });
  if (result.canceled || !result.filePath) return;
  try {
    fs.writeFileSync(result.filePath, svg + '\n', 'utf8');
    say('움직이는 프로필 카드를 저장했어요! 프로필 저장소의 assets 폴더에 올리면 돼요');
    shell.showItemInFolder(result.filePath);
  } catch (error) {
    console.error('프로필 카드 저장 실패', error);
    say('프로필 카드를 저장하지 못했어요');
  }
}

function closeCodex(): void {
  if (codexWin && !codexWin.isDestroyed()) codexWin.close();
  codexWin = null;
}

function openCodex(): void {
  if (codexWin && !codexWin.isDestroyed()) {
    codexWin.show();
    codexWin.focus();
    return;
  }
  const area = screen.getDisplayNearestPoint({ x: Math.round(behavior.x), y: Math.round(behavior.y) }).workArea;
  const width = 440;
  const height = Math.min(680, area.height - 40);
  const w = new BrowserWindow({
    x: area.x + Math.round((area.width - width) / 2),
    y: area.y + Math.round((area.height - height) / 2),
    width,
    height,
    resizable: false,
    minimizable: false,
    maximizable: false,
    autoHideMenuBar: true,
    title: '도감·기록',
    backgroundColor: '#fffdf5',
    show: false,
    webPreferences: {
      preload: path.join(projectRoot, 'static', 'codex-preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });
  w.setMenu(null);
  w.setAlwaysOnTop(true, 'screen-saver');
  w.once('ready-to-show', () => w.show());
  w.on('closed', () => {
    if (codexWin === w) codexWin = null;
  });
  void w.loadFile(path.join(projectRoot, 'static', 'codex.html'));
  codexWin = w;
}

function closeSettings(): void {
  if (settingsWin && !settingsWin.isDestroyed()) settingsWin.close();
  settingsWin = null;
}

function openSettings(): void {
  if (settingsWin && !settingsWin.isDestroyed()) {
    settingsWin.show();
    settingsWin.focus();
    return;
  }
  const area = screen.getDisplayNearestPoint({ x: Math.round(behavior.x), y: Math.round(behavior.y) }).workArea;
  const width = 400;
  const height = Math.min(760, area.height - 40);
  const w = new BrowserWindow({
    x: area.x + Math.round((area.width - width) / 2),
    y: area.y + Math.round((area.height - height) / 2),
    width,
    height,
    resizable: false,
    minimizable: false,
    maximizable: false,
    autoHideMenuBar: true,
    title: 'Desktop Tamagotchi 설정',
    backgroundColor: '#fffdf5',
    show: false,
    webPreferences: {
      preload: path.join(projectRoot, 'static', 'settings-preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });
  w.setMenu(null);
  w.setAlwaysOnTop(true, 'screen-saver');
  w.once('ready-to-show', () => w.show());
  w.on('closed', () => {
    if (settingsWin === w) settingsWin = null;
  });
  void w.loadFile(path.join(projectRoot, 'static', 'settings.html'));
  settingsWin = w;
}

/** 자동 업데이트: 설치본에서만, 시작 30초 뒤와 6시간마다 새 버전을 확인한다. */
function setupUpdates(): void {
  if (!app.isPackaged) return;
  // 맥은 서명이 없어 electron-updater 를 쓸 수 없으므로 같은 모양의 직접 만든 업데이트기를 쓴다.
  macUpdater = process.platform === 'darwin' ? createMacUpdater() : null;
  const updater = macUpdater ?? (electronUpdater.autoUpdater as unknown as AutoUpdaterLike);
  updates = new UpdateController(updater, {
    enabled: () => settings.autoUpdate,
    onStatus: (text) => {
      if (settingsWin && !settingsWin.isDestroyed()) settingsWin.webContents.send('update:status', text);
    },
    onDownloaded: () => {
      remindUpdate();
      updateTray();
    },
  });
  setTimeout(() => void updates?.check(false), UPDATE_FIRST_CHECK_MS);
  setInterval(() => void updates?.check(false), UPDATE_EVERY_MS);
  // 받아 둔 새 버전이 있으면 계속 다시 알린다(설치 전까지)
  setInterval(remindUpdate, UPDATE_REMIND_MS);
}

/** 공지: 시작 1분 뒤와 1시간마다 저장소의 news.json 을 읽어 새 공지를 알린다. */
const NEWS_FIRST_CHECK_MS = 60_000;
const NEWS_EVERY_MS = 60 * 60_000;
const NEWS_GAP_MS = 9_000;

async function checkNews(): Promise<void> {
  if (!settings.showNews) return;
  const items = await fetchNews();
  if (!items) return; // 오프라인이거나 응답이 이상하면 조용히 넘어간다
  newsItems = items;
  const { seen, firstRun } = loadSeen(newsPath);
  const pick = pickNews(items, seen, firstRun);
  try {
    saveSeen(newsPath, pick.seen);
  } catch (error) {
    console.error('공지 기록 저장 실패', error);
    return; // 저장하지 못하면 같은 공지를 계속 알리게 되므로 이번엔 알리지 않는다
  }
  pick.show.forEach((item, i) => setTimeout(() => say(newsText(item)), i * NEWS_GAP_MS));
  const first = pick.show[0];
  if (first && Notification.isSupported()) new Notification({ title: 'Desktop Tamagotchi 공지', body: first.title }).show();
  updateTray();
}

function setupNews(): void {
  setTimeout(() => void checkNews(), NEWS_FIRST_CHECK_MS);
  setInterval(() => void checkNews(), NEWS_EVERY_MS);
}

/** 새 버전이 준비돼 있으면 말풍선으로, 가끔은 시스템 알림(눌러서 바로 설치)으로 알린다. */
function remindUpdate(): void {
  const r = updates?.remind();
  if (!r) return;
  say(r.text);
  if (r.toast && Notification.isSupported()) {
    const n = new Notification({ title: 'Desktop Tamagotchi 새 버전', body: r.text.replace(/^새 버전 /, '') + '\n이 알림을 누르면 바로 설치해요.', silent: false });
    n.on('click', () => void updates?.installNow());
    n.show();
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
function finishCard(kind: 'confirm' | 'later' | 'ignore', choice: number | null = null): void {
  const now = Date.now();
  const finding = active;
  if (finding) {
    if (kind === 'confirm') {
      // 퀴즈를 풀지 않은 확인은 받아 주지 않는다.
      if (choice === null || choice < 0 || choice > 2) return;
      const correct = choice === QUIZZES[finding.ruleId].answer;
      progress = confirm(progress, finding.key, now);
      recordGrowth({ kind: 'confirm', ruleId: finding.ruleId, correct });
      if (notice?.key === finding.key) setNotice(null, false);
      const result = learn(applyElapsedInPlace(), 'confirm', correct ? QUIZ_BONUS : 0);
      pet = result.pet;
      say(result.message);
      persist();
      updateTray();
    } else if (kind === 'ignore') {
      applySettings({ ignored: addIgnored(settings.ignored, finding.key) });
      say('이 문제는 더 알리지 않을게요. 검사 결과에서 되돌릴 수 있어요');
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

/** 산책 중인지 지난 틱의 값(끝나는 순간을 알아채기 위해) */
let wasStrolling = false;
/** 우클릭 메뉴를 연 화면 위치(혼자 놀게 두기의 중심) */
let menuPoint: { x: number; y: number } | null = null;
let nextPoopAt = 0;
const poopWins = new Set<BrowserWindow>();

/** 펫 발치에 응가 창을 띄운다. 잠시 뒤 저절로 닫힌다. */
function spawnPoop(): void {
  const { width, height } = POOP_SIZE;
  const x = Math.round(behavior.x + petSize / 2 - width / 2 + (behavior.dir === 'left' ? petSize * 0.35 : -petSize * 0.35));
  const y = Math.round(behavior.y + petSize - height);
  const w = new BrowserWindow({
    x,
    y,
    width,
    height,
    transparent: true,
    frame: false,
    resizable: false,
    movable: false,
    hasShadow: false,
    skipTaskbar: true,
    focusable: false,
    show: false,
  });
  w.setAlwaysOnTop(true, 'screen-saver');
  // 누르면 사라지는 응가: 클릭을 받아야 하므로 클릭 통과는 켜지 않는다(창이 응가 크기뿐이라 방해되지 않는다).
  w.once('ready-to-show', () => w.showInactive());
  void w.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(poopHtml()));
  poopWins.add(w);
  const timer = setTimeout(() => {
    if (!w.isDestroyed()) w.destroy();
  }, POOP_LIFE_MS);
  w.on('closed', () => {
    clearTimeout(timer);
    poopWins.delete(w);
  });
}

/** 산책을 시작한다(메뉴). 알이거나 너무 배고프거나 쉬는 중이면 이유를 말풍선으로 알린다. */
function startStrollNow(): void {
  const now = Date.now();
  const can = canStroll(applyElapsedInPlace());
  if (!can.ok) {
    say(can.message);
    return;
  }
  if (isOccupied(behavior, now)) return;
  if (isStrolling(behavior, now)) {
    say('지금 산책 중이에요!');
    return;
  }
  if (now < behavior.restUntil) {
    say('아직 지쳐서 쉬는 중이에요…');
    return;
  }
  behavior = wake(startStroll(behavior, stepContext(now, TICK_MS)), now);
  if (!isStrolling(behavior, now)) return; // 다른 일을 하느라 시작하지 못했다
  nextPoopAt = now + 12_000 + Math.random() * 10_000;
  say(can.message);
  updateTray();
  sendView();
}

function act(type: 'touch' | 'feed' | 'play' | 'wash'): ActionResult {
  // 문제를 찾아 알리는 중에 펫을 누르면 쓰다듬기 대신 배움 카드가 열린다.
  if (type === 'touch' && active && behavior.mode === 'alert') {
    openCard();
    return { pet, ok: true, message: '' };
  }
  const now = Date.now();
  // 하나의 행동이 끝나기 전(기절·씻기·먹기·놀기 중)에는 새 돌봄을 받지 않는다.
  if (isOccupied(behavior, now)) return { pet, ok: false, message: '' };
  const current = applyElapsed(pet, now);
  const result = type === 'touch' ? touch(current, now) : type === 'feed' ? feed(current) : type === 'play' ? play(current) : wash(current);
  pet = result.pet;
  if (result.ok) {
    behavior = wake(behavior, now);
    // 손길에 반응하는 동작: 쓰다듬으면 좋아하고, 밥을 주면 먹고, 놀아 주면 폴짝폴짝 논다.
    if (type === 'touch') behavior = react(behavior, 'happy', now);
    else if (type === 'feed') behavior = react(behavior, 'eat', now);
    else if (type === 'wash') behavior = startWash(behavior, now);
    else behavior = trigger(behavior, 'play', stepContext(now, TICK_MS));
  }
  say(result.message);
  updateTray();
  sendView();
  if (result.ok) {
    persist();
    recordGrowth({ kind: 'care', care: type });
  }
  return result;
}

/** 가진 동물 중 하나를 꺼내서 키운다(한 번에 한 마리). 지금 동물은 상태를 저장해 넣어 둔다. */
function switchPet(id: SpeciesId): { ok: boolean; message: string } {
  if (id === collection.active) return { ok: false, message: '이미 키우고 있어요' };
  const now = Date.now();
  const r = switchActive(collection, id, applyElapsedInPlace(), settings.petName, now);
  if (!r) return { ok: false, message: '아직 없는 동물이에요' };
  collection = r.collection;
  pet = r.pet;
  behavior = { ...behavior, strollUntil: 0 };
  applySettings({ petName: r.name, displayStage: 'auto' }); // 다른 동물은 지금 단계 그대로 보여 준다
  persist();
  refreshWardrobe();
  updateTray();
  sendView(true);
  const name = r.name || getSpecies(id).name;
  say(`${name}(이)가 나왔어요!`);
  return { ok: true, message: `${name}(을)를 꺼냈어요` };
}

function refreshCollection(): void {
  if (collectionWin && !collectionWin.isDestroyed()) collectionWin.webContents.send('collection:refresh');
}

function closeCollection(): void {
  if (collectionWin && !collectionWin.isDestroyed()) collectionWin.close();
  collectionWin = null;
}

/** 꾸미기 뽑기로 아직 얻을 수 있는 장식·색 수 */
function cosmeticLeft(): number {
  const a = GACHA_ACCESSORIES.filter((x) => x !== 'none' && !accessoryUnlocked(growth, x, wardrobeExtra())).length;
  const v = VARIANTS.filter((x) => x !== 'default' && !variantUnlocked(growth, x, wardrobeExtra())).length;
  return a + v;
}

function collectionData() {
  return buildCollectionView(collection, cosmeticLeft());
}

/** 동물 뽑기: 로그인(서버 기준)이면 서버가 뽑고 결과만 앱에 반영한다. 서버에 닿지 않으면 뽑지 않고 안내한다. */
async function doPullSpecies() {
  if (auth?.user && serverGame) {
    if (!serverGame.ready) return { ok: false as const, message: '아직 서버와 연결되지 않았어요. 잠시 뒤에 다시 해 주세요', view: collectionData() };
    const r = await serverGame.pullSpecies();
    if (!r.ok) return { ok: false as const, message: r.message, view: collectionData() };
    collection = syncActive(collection, applyElapsedInPlace(), settings.petName);
    const applied = applyServerPull(collection, r.result, Date.now());
    if (!applied) return { ok: false as const, message: '알 수 없는 동물이 나왔어요. 앱을 업데이트해 주세요', view: collectionData() };
    collection = applied.collection;
    const activeOwned = collection.owned[collection.active];
    if (activeOwned) pet = activeOwned.pet;
    persist();
    updateTray();
    sendView();
    recordGrowth({ kind: 'sync' });
    const sp = getSpecies(r.result.speciesId as Parameters<typeof getSpecies>[0]);
    const message = applied.isNew
      ? `${sp.name}(이)가 새로 왔어요!${applied.hidden ? ' ✨히든 동물!' : ''}`
      : `${sp.name}(이)가 또 나왔어요! (${applied.count}번째) 경험치 +${DUPLICATE_XP}`;
    return { ok: true as const, message, id: r.result.speciesId as Parameters<typeof getSpecies>[0], isNew: applied.isNew, hidden: applied.hidden, count: applied.count, view: collectionData() };
  }
  return doPullSpeciesLocal();
}

/** 동물 뽑기(로컬). 이미 가진 동물이 나오면 그 동물이 경험치를 받는다. */
function doPullSpeciesLocal() {
  const now = Date.now();
  collection = syncActive(collection, applyElapsedInPlace(), settings.petName);
  const r = pullSpecies(collection, now, Math.random);
  collection = r.collection;
  if (!r.result.ok) return { ok: false as const, message: r.result.reason, view: collectionData() };
  // 중복으로 지금 키우는 동물이 경험치를 받았으면 살아 있는 상태에도 반영한다.
  const active = collection.owned[collection.active];
  if (active) pet = active.pet;
  persist();
  updateTray();
  sendView();
  recordGrowth({ kind: 'sync' }); // 모은 동물·뽑기 횟수가 늘었으니 업적을 다시 본다
  const sp = getSpecies(r.result.id);
  const message = r.result.isNew
    ? `${sp.name}(이)가 새로 왔어요!${r.result.hidden ? ' ✨히든 동물!' : ''}`
    : `${sp.name}(이)가 또 나왔어요! (${r.result.count}번째) 경험치 +${DUPLICATE_XP}`;
  return { ok: true as const, message, id: r.result.id, isNew: r.result.isNew, hidden: r.result.hidden, count: r.result.count, view: collectionData() };
}

/** 꾸미기 뽑기: 로그인(서버 기준)이면 서버가 뽑는다. */
async function doPullCosmetic() {
  if (auth?.user && serverGame) {
    if (!serverGame.ready) return { ok: false as const, message: '아직 서버와 연결되지 않았어요. 잠시 뒤에 다시 해 주세요', view: collectionData() };
    const r = await serverGame.pullCosmetic();
    if (!r.ok) return { ok: false as const, message: r.message, view: collectionData() };
    const { kind, itemId } = r.result;
    collection = {
      ...collection,
      tickets: r.result.tickets,
      accessories: kind === 'accessory' && !collection.accessories.includes(itemId as never) ? [...collection.accessories, itemId as never] : collection.accessories,
      variants: kind === 'variant' && !collection.variants.includes(itemId as never) ? [...collection.variants, itemId as never] : collection.variants,
    };
    saveCollectionSafe();
    refreshWardrobe();
    const name = kind === 'accessory' ? ACCESSORY_NAMES[itemId as keyof typeof ACCESSORY_NAMES] : VARIANT_NAMES[itemId as keyof typeof VARIANT_NAMES] + ' 색';
    return { ok: true as const, message: `${name}(을)를 얻었어요!`, kind, itemId: itemId as never, view: collectionData() };
  }
  return doPullCosmeticLocal();
}

/** 꾸미기 뽑기(로컬): 아직 못 가진 장식·색 중 하나를 같은 확률로 뽑는다. */
function doPullCosmeticLocal() {
  const achieved = {
    accessories: new Set(ACCESSORIES.filter((a) => a !== 'none' && accessoryUnlocked(growth, a))),
    variants: new Set(VARIANTS.filter((v) => v !== 'default' && variantUnlocked(growth, v))),
  };
  const r = pullCosmetic(collection, { accessories: GACHA_ACCESSORIES, variants: VARIANTS }, achieved, Math.random);
  collection = r.collection;
  if (!r.result.ok) return { ok: false as const, message: r.result.reason, view: collectionData() };
  saveCollectionSafe();
  refreshWardrobe();
  const item = r.result.item;
  const name = item.kind === 'accessory' ? ACCESSORY_NAMES[item.id] : VARIANT_NAMES[item.id] + ' 색';
  return { ok: true as const, message: `${name}(을)를 얻었어요!`, kind: item.kind, itemId: item.id, view: collectionData() };
}

function openCollection(): void {
  if (collectionWin && !collectionWin.isDestroyed()) {
    collectionWin.show();
    collectionWin.focus();
    return;
  }
  const area = screen.getDisplayNearestPoint({ x: Math.round(behavior.x), y: Math.round(behavior.y) }).workArea;
  const width = 560;
  const height = Math.min(720, area.height - 40);
  const w = new BrowserWindow({
    x: area.x + Math.round((area.width - width) / 2),
    y: area.y + Math.round((area.height - height) / 2),
    width,
    height,
    resizable: true,
    minimizable: false,
    maximizable: false,
    autoHideMenuBar: true,
    title: '뽑기·컬렉션',
    backgroundColor: '#fffdf5',
    show: false,
    webPreferences: {
      preload: path.join(projectRoot, 'static', 'collection-preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });
  w.setMenu(null);
  w.setAlwaysOnTop(true, 'screen-saver');
  w.once('ready-to-show', () => w.show());
  w.on('closed', () => {
    if (collectionWin === w) collectionWin = null;
  });
  void w.loadFile(path.join(projectRoot, 'static', 'collection.html'));
  collectionWin = w;
}

function applyElapsedInPlace(): PetState {
  pet = applyElapsed(pet, Date.now());
  return pet;
}

/** 크롬 확장이 들어 있는 폴더. 설치본은 resources/extension, 개발 중에는 저장소의 extension 폴더다. */
function extensionDir(): string {
  return app.isPackaged ? path.join(process.resourcesPath, 'extension') : path.join(projectRoot, 'extension');
}

/** 탐색기로 확장 폴더를 연다. 크롬의 "압축해제된 확장 프로그램을 로드합니다"에서 이 폴더를 고르면 된다. */
function openExtensionFolder(): void {
  void shell.openPath(extensionDir()).then((error) => {
    if (error) say('확장 폴더를 열지 못했어요');
    else say('크롬 주소창에 chrome://extensions → 개발자 모드 → 이 폴더를 로드하세요');
  });
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

/** 딥링크(desktop-tamagotchi://auth?code=…)로 돌아온 로그인 결과를 처리한다. */
async function handleAuthUrl(url: string): Promise<void> {
  if (!auth) return;
  announceAuth(await auth.handleCallback(url));
}

/** 로그인하고 저장분 동기화가 끝난 뒤: 기존 진행을 서버로 한 번 가져오고, 서버 상태를 앱의 컬렉션에 반영한다. */
async function activateServer(): Promise<void> {
  if (!serverGame || !auth?.user) return;
  const r = await serverGame.activate();
  if (!r.ok || !serverGame.state) {
    say(r.message ?? '서버와 연결하지 못했어요. 뽑기는 연결된 뒤에 할 수 있어요');
    return;
  }
  collection = mirrorCollection(collection, serverGame.state, Date.now());
  // 업데이트 선물: 서버가 버전마다 한 번만 인정한다(앱이 시작할 때 로컬로 받은 것은 서버 기준으로 덮어쓰였을 수 있어 여기서 다시 확인한다).
  if (app.isPackaged) {
    const gift = await serverGame.grant({ kind: 'update', amount: 2, key: app.getVersion() });
    if (gift) collection = { ...collection, tickets: gift.tickets };
  }
  saveCollectionSafe();
  say(`서버와 연결됐어요. 뽑기권 ${collection.tickets}장 · 어느 PC에서든 같은 계정이에요`);
}

/** 연결이 없어서 대기 중이던 뽑기권 획득을 다시 보낸다. */
async function flushServerGrants(): Promise<void> {
  if (!serverGame || !serverOn() || serverGame.pendingCount === 0) return;
  const r = await serverGame.flushPending();
  if (r.tickets !== null) {
    collection = { ...collection, tickets: r.tickets };
    saveCollectionSafe();
    if (r.granted > 0) announceTickets(`연결이 돌아와서 뽑기권 +${r.granted}장을 받았어요`);
  }
}

/** 이 PC와 계정에 서로 다른 진행이 있을 때 어느 쪽을 쓸지 묻는다. 어느 쪽을 골라도 덮어쓰이는 쪽은 백업된다. */
async function askSyncChoice(info: ConflictInfo): Promise<Choice> {
  const line = (label: string, s: ConflictInfo['local']) => `${label}: 동물 ${s.pets}마리 · 뽑기권 ${s.tickets}장 · 뽑기 ${s.pulls}회`;
  const when = info.accountUpdatedAt ? new Date(info.accountUpdatedAt).toLocaleString() : '';
  const r = await dialog.showMessageBox({
    type: 'question',
    title: 'Desktop Tamagotchi — 계정과 맞추기',
    message: '이 PC와 계정에 서로 다른 진행이 있어요. 어느 쪽을 쓸까요?',
    detail: [line('이 PC', info.local), line(`계정(${info.accountDevice ?? '다른 PC'}${when ? ', ' + when : ''})`, info.account), '', '덮어쓰이는 쪽의 진행은 백업돼서 나중에 되돌릴 수 있어요.'].join('\n'),
    buttons: ['계정의 진행을 이 PC에 받기 (다시 시작)', '이 PC의 진행을 계정에 올리기', '나중에'],
    defaultId: 0,
    cancelId: 2,
    noLink: true,
  });
  return r.response === 0 ? 'account' : r.response === 1 ? 'local' : 'later';
}

function announceAuth(r: { handled: boolean; ok: boolean; message?: string }): void {
  if (!r.handled) return;
  if (r.ok) say(`GitHub 로그인 완료! ${auth?.user?.login ?? ''} 님, 어느 PC에서든 같은 계정이에요`);
  else say('로그인하지 못했어요' + (r.message ? ': ' + r.message : ''));
}

/** 계정 메뉴: 서버가 설정되지 않았거나, 로그인·로그아웃. */
function accountMenuItem(): Electron.MenuItemConstructorOptions {
  if (!auth?.enabled) return { label: '☁ 계정 (서버 준비 중)', enabled: false };
  const user = auth.user;
  if (user) {
    return {
      label: `☁ ${user.login}`,
      submenu: [
        { label: '지금 계정과 맞추기', click: () => void accountSync?.reconcile(user.id) },
        { label: '로그아웃', click: () => void auth?.signOut().then(() => say('로그아웃했어요. 펫은 이 PC에 그대로 있어요')) },
      ],
    };
  }
  return {
    label: '☁ GitHub로 로그인…',
    click: () => {
      say('브라우저에서 GitHub 로그인을 마치면 돌아와요');
      void auth?.signIn().catch((e: unknown) => say('로그인을 시작하지 못했어요: ' + String(e instanceof Error ? e.message : e)));
    },
  };
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
    ...(updates?.ready
      ? [{ label: '🆕 새 버전 ' + updates.ready + ' 설치하고 다시 시작', click: () => void updates?.installNow() }, { type: 'separator' as const }]
      : []),
    { label: '상태 보기', click: () => showStatus() },
    { label: '검사 결과…', click: () => openResults() },
    { label: '도감·기록…', click: () => openCodex() },
    { label: '🎟 뽑기·컬렉션… (' + collection.tickets + '장)', click: () => openCollection() },
    { label: '프로필 카드 내보내기…', click: () => void exportCard() },
    {
      label: '📢 공지',
      enabled: newsItems.length > 0,
      submenu: newsItems.slice(0, 5).flatMap((item) => [
        { label: `${item.date} ${item.title}`, click: () => say(newsText(item)) },
        ...(item.url ? [{ label: '    ↗ 자세히 보기', click: () => void shell.openExternal(item.url) }] : []),
      ]),
    },
    accountMenuItem(),
    { label: '설정…', click: () => openSettings() },
    {
      // 새 버전이 준비돼 있지 않을 때도 직접 확인할 수 있게 항상 둔다
      label: app.isPackaged ? `업데이트 확인 (현재 v${app.getVersion()})` : '업데이트 확인 (설치본에서만)',
      enabled: app.isPackaged,
      click: () => {
        say('새 버전이 있는지 확인하고 있어요…');
        void updates?.check(true).then((text) => {
          if (text) say(text);
        });
      },
    },
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
        { label: '크롬 확장 폴더 열기 (평소 쓰는 크롬에서 검사)', click: () => openExtensionFolder() },
        { type: 'separator' },
        { label: `확장 수신 포트 ${FEED_PORT} · 디버그 포트 ${CDP_PORT} · localhost 페이지만 검사`, enabled: false },
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
    { label: '씻기기', enabled: !egg, click: () => act('wash') },
    behavior.home
      ? {
          label: '자유롭게 돌아다니게 하기',
          click: () => {
            behavior = clearHome(behavior);
            say('이제 마음대로 돌아다닐게요!');
          },
        }
      : {
          label: '혼자 놀게 두기 (여기서만)',
          enabled: !egg,
          click: () => {
            const p = menuPoint ?? { x: behavior.x + petSize / 2, y: behavior.y + petSize / 2 };
            behavior = setHome(behavior, p.x, p.y);
            say('여기서 혼자 놀고 있을게요!');
          },
        },
    { label: isStrolling(behavior, Date.now()) ? '산책 중…' : '산책하기', enabled: !egg && !isStrolling(behavior, Date.now()), click: () => startStrollNow() },
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
    { label: '꾸미기…', click: () => openWardrobe() },
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
  const set = spriteSet(pet.speciesId, effectiveStage(stageOf(pet), settings.displayStage));
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
  if (shouldOfferTip({ now, lastTipAt, mode: behavior.mode, stage: stageOf(pet), busy, roomAbove: roomAboveForTip(), everyMs: tipIntervalMs(settings) })) {
    offerTip(now);
  }

  if (active) {
    const traveling = behavior.mode === 'run' && behavior.then === 'alert';
    if (behavior.mode === 'alert') {
      if (announcedKey !== active.key) {
        announcedKey = active.key;
        setNotice(active, true);
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

/** 산책 중 응가를 하고, 산책이 끝나는 순간 지친 모습과 보상을 알린다. */
function updateStroll(now: number): void {
  const strolling = isStrolling(behavior, now);
  if (strolling && now >= nextPoopAt && !drag && ['walk', 'run', 'idle'].includes(behavior.mode)) {
    behavior = startPoop(behavior, now);
    spawnPoop();
    pet = afterPoop(applyElapsed(pet, now));
    nextPoopAt = now + 15_000 + Math.random() * 15_000;
    persist();
  }
  if (wasStrolling && !strolling && behavior.strollUntil === 0) {
    const result = finishStroll(applyElapsed(pet, now));
    pet = result.pet;
    say(result.message);
    persist();
    updateTray();
    recordGrowth({ kind: 'stroll' });
  }
  wasStrolling = strolling;
}

function tick(lastAt: number): number {
  const now = Date.now();
  if (!win || win.isDestroyed()) return now;

  const cursor = screen.getCursorScreenPoint();
  if (Math.hypot(cursor.x - lastCursor.x, cursor.y - lastCursor.y) > CURSOR_MOVE_PX) {
    lastCursor = cursor;
    lastCursorMoveAt = now;
  }

  const size = petPixelSize(stageOf(pet), settings.petScale);
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
  updateStroll(now);
  tipShift = Math.round(computeTipShift());
  placeWindow();
  positionGift();
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
    if (type === 'touch' || type === 'feed' || type === 'play' || type === 'wash') return act(type).ok;
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
    if (!win) return;
    menuPoint = screen.getCursorScreenPoint();
    const w = win;
    // 펫 창은 포커스를 받지 않는 창이라, 그대로 메뉴를 띄우면 바깥을 눌러도 메뉴가 닫히지 않는다.
    // 메뉴가 떠 있는 동안만 포커스를 받게 하고, 닫히면(바깥 클릭·선택·Esc) 원래대로 돌린다.
    w.setFocusable(true);
    w.focus();
    buildMenu().popup({
      window: w,
      callback: () => {
        if (!w.isDestroyed()) w.setFocusable(false);
      },
    });
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
  ipcMain.on('card:ignore', () => finishCard('ignore'));
  ipcMain.handle('wardrobe:get', () => wardrobeData());
  ipcMain.on('gift:open', (event) => {
    if (giftWin && !giftWin.isDestroyed() && event.sender === giftWin.webContents) resolveGift();
  });
  ipcMain.handle('collection:get', () => collectionData());
  ipcMain.handle('collection:pull-species', () => doPullSpecies());
  ipcMain.handle('collection:pull-cosmetic', () => doPullCosmetic());
  ipcMain.handle('collection:switch', (_event, id: unknown) => {
    if (!isSpeciesId(id)) return { ok: false, message: '알 수 없는 동물이에요', view: collectionData() };
    const r = switchPet(id);
    return { ...r, view: collectionData() };
  });
  ipcMain.on('collection:close', () => closeCollection());
  ipcMain.handle('wardrobe:set', (_event, patch: unknown) => applyWardrobe(patch));
  ipcMain.on('wardrobe:close', () => closeWardrobe());
  ipcMain.handle('results:get', () =>
    buildResults(lastFindings, {
      connected: lastConnected,
      confirmed: new Set(Object.keys(progress.confirmed)),
      snoozedUntil: progress.snoozed,
      settings,
      now: Date.now(),
    }),
  );
  ipcMain.handle('results:ignore', (_event, key: unknown) => {
    if (isKey(key)) applySettings({ ignored: addIgnored(settings.ignored, key) });
  });
  ipcMain.handle('results:unignore', (_event, key: unknown) => {
    if (isKey(key)) applySettings({ ignored: settings.ignored.filter((k) => k !== key) });
  });
  ipcMain.on('results:close', () => closeResults());
  ipcMain.handle('codex:get', () => buildCodex(growth, growthCtx(), Date.now()));
  ipcMain.on('codex:close', () => closeCodex());
  ipcMain.handle('settings:get', () => settings);
  ipcMain.handle('settings:set', (_event, patch: unknown) => applySettings(patch));
  ipcMain.handle('app:version', () => app.getVersion());
  ipcMain.handle('update:check', async () => (updates ? updates.check(true) : '설치한 앱에서만 업데이트를 확인해요'));
  ipcMain.on('settings:close', () => closeSettings());
  // 사라진 말풍선을 hover 로 다시 띄운 뒤 펫을 누르면, 그 문제의 배움 카드를 연다.
  ipcMain.on('notice:open', () => {
    if (!notice || cardWin) return;
    if (active?.key !== notice.key) {
      queue = queue.filter((f) => f.key !== notice?.key);
      active = notice;
    }
    openCard();
  });
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

// 로그인 딥링크(desktop-tamagotchi://)를 이 앱이 받도록 등록한다. 개발 실행(electron .)은 실행 경로를 같이 알려야 한다.
if (app.isPackaged) app.setAsDefaultProtocolClient(AUTH_SCHEME);
else if (process.defaultApp && process.argv[1]) app.setAsDefaultProtocolClient(AUTH_SCHEME, process.execPath, [path.resolve(process.argv[1])]);

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  // 윈도우·리눅스: 딥링크는 두 번째 실행의 인자로 오고, 맥은 open-url 로 온다.
  app.on('second-instance', (_e, argv) => {
    const url = argv.find((a) => a.startsWith(AUTH_SCHEME + '://'));
    if (url) void handleAuthUrl(url);
  });
  app.on('open-url', (event, url) => {
    event.preventDefault();
    void handleAuthUrl(url);
  });
  app.whenReady().then(() => {
    auth = new AuthService({
      config: { url: process.env.PET_SUPABASE_URL ?? BACKEND.url, anonKey: process.env.PET_SUPABASE_ANON_KEY ?? BACKEND.anonKey },
      storage: new EncryptedFileStorage(path.join(app.getPath('userData'), 'auth.bin'), {
        isAvailable: () => safeStorage.isEncryptionAvailable(),
        encrypt: (t) => safeStorage.encryptString(t),
        decrypt: (b) => safeStorage.decryptString(b),
      }),
      openExternal: (u) => shell.openExternal(u),
    });
    auth.onChange((user) => {
      tray?.setContextMenu(buildMenu());
      if (user) void accountSync?.reconcile(user.id).then(() => activateServer());
      else serverGame?.deactivate();
    });
    auth.onCallbackResult(announceAuth);
    const rpc = auth.syncRpc;
    if (rpc) {
      accountSync = new AccountSync({
        rpc,
        dir: app.getPath('userData'),
        appVersion: app.getVersion(),
        device: os.hostname().slice(0, 60),
        flush: () => {
          persist();
          persistProgress();
        },
        ask: askSyncChoice,
        // 받아 온 저장분을 파일에 쓴 직후 바로 끝낸다(종료 처리가 낡은 메모리 상태를 다시 쓰지 않게 app.exit 를 쓴다).
        restartWithNewSave: () => {
          app.relaunch();
          app.exit(0);
        },
        say: (t) => say(t),
      });
      serverGame = new ServerGame(auth.serverRpc!, app.getPath('userData'));
      setInterval(() => {
        if (auth?.user) void accountSync?.tick(auth.user.id);
        void flushServerGrants();
      }, 10 * 60_000);
    }
    void auth.restore();
    const startUrl = process.argv.find((a) => a.startsWith(AUTH_SCHEME + '://'));
    if (startUrl) setTimeout(() => void handleAuthUrl(startUrl), 2_000);
    savePath = path.join(app.getPath('userData'), 'pet.json');
    progressPath = path.join(app.getPath('userData'), 'progress.json');
    progress = loadProgress(progressPath);
    settingsPath = path.join(app.getPath('userData'), 'settings.json');
    settings = loadSettings(settingsPath);
    growthPath = path.join(app.getPath('userData'), 'growth.json');
    growth = loadGrowth(growthPath);
    newsPath = path.join(app.getPath('userData'), 'news.json');
    const now = Date.now();
    lastTipAt = now;
    // 컬렉션이 없으면(처음 실행이거나 예전 버전에서 올라온 경우) 지금 펫과 이미 열어 둔 동물로 만든다.
    // 처음 실행하면 임의의 종이 든 알로 시작한다. 알은 쓰다듬으면 부화한다.
    collectionPath = path.join(app.getPath('userData'), 'collection.json');
    const loadedCollection = loadCollection(collectionPath);
    const starter = loadPet(savePath) ?? createPet(randomSpecies(), now);
    collection = loadedCollection ?? migrateCollection(starter, growth.achievements, now, settings.petName);
    // 업데이트해서 처음 켠 사용자에게는 뽑기권을 선물한다(처음 설치한 사용자는 시작 선물이 있으니 버전만 기억한다).
    let updateGift = 0;
    if (app.isPackaged) {
      if (!loadedCollection) {
        collection = { ...collection, appVersion: app.getVersion() };
      } else {
        const gift = claimUpdateGift(collection, app.getVersion());
        collection = gift.collection;
        updateGift = gift.tickets;
      }
    }
    pet = applyElapsed(collection.owned[collection.active]?.pet ?? starter, now);
    persist();
    if (updateGift > 0) setTimeout(() => announceTickets(`새 버전으로 업데이트해 줘서 고마워요! 뽑기권 +${updateGift}장`), 5_000);
    if (!loadedCollection) {
      setTimeout(() => say(`🎟 새 기능! 뽑기권 ${collection.tickets}장을 드렸어요.\n메뉴의 '뽑기·컬렉션…'에서 새 동물을 뽑아 보세요`), 6_000);
    }
    lastUptimeAt = Date.now();
    setInterval(() => accrueUptime(), 60_000);
    nextGiftAt = Date.now() + nextGiftDelayMs(Math.random, true);
    setInterval(() => maybeOfferGift(Date.now()), 60_000);
    setTimeout(() => checkDaily(), 9_000);
    setTimeout(() => recordGrowth({ kind: 'sync' }), 12_000); // 이미 조건을 채운 업적(예전 사용자) 확인
    setInterval(() => checkDaily(), 30 * 60_000);

    petSize = petPixelSize(stageOf(pet), settings.petScale);
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

    void startFeedServer(extensionFeed, FEED_PORT, Date.now, (e) => console.error('확장 수신 서버를 열지 못했습니다', e.message)).then((s) => {
      feedServer = s;
    });
    setTimeout(() => void scanOnce(), 3_000);
    scheduleScan();
    setupUpdates();
    setupNews();
  });

  app.on('before-quit', () => {
    if (savePath && pet) persist();
    macUpdater?.installOnQuit(); // 받아 둔 새 버전이 있으면 끝나는 순간 교체한다(맥)
    void demoServer?.close();
    feedServer?.close();
    for (const w of poopWins) if (!w.isDestroyed()) w.destroy();
    closeGift();
  });
  // 창이 하나뿐이고 트레이로 끝낼 수 있으므로, 창이 닫혀도 앱은 유지한다.
  app.on('window-all-closed', () => {});
}

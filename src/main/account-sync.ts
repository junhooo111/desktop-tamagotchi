/**
 * 계정 동기화: 이 PC의 저장 파일(펫·컬렉션·도감·진행도)을 계정(서버)에 맡기고, 다른 PC에서 받아 온다.
 *
 * 원칙 — 진행을 잃지 않는다
 *   * 서버에 올리거나 서버 것으로 덮어쓰기 전에 **항상 이 PC의 파일을 백업**한다(backups/ 아래, 최근 10개).
 *   * 서로 다른 진행이 둘 다 있으면 자동으로 덮어쓰지 않고 사용자에게 묻는다.
 *   * 서버는 "내가 마지막으로 본 버전"이 맞을 때만 저장을 받는다(낙관적 잠금). 다른 PC가 먼저 저장했으면 거절한다.
 * 화면·Electron 에 닿는 부분(대화상자·재시작)은 밖에서 받아서 이 모듈은 파일과 규칙만 다룬다.
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

export const SAVE_FILES = ['pet.json', 'collection.json', 'growth.json', 'progress.json'] as const;
export const SCHEMA_VERSION = 1;
const KEEP_BACKUPS = 10;

export interface Snapshot {
  schema: number;
  appVersion: string;
  files: Record<string, unknown>;
}

export interface SyncState {
  userId: string;
  /** 마지막으로 서버와 맞춘 서버 버전 */
  version: number;
}

export interface RpcResult<T> {
  data: T | null;
  error: { message: string; hint?: string } | null;
}
export interface SaveRow {
  version: number;
  schema_version: number;
  data: Snapshot;
  device: string | null;
  updated_at: string;
}
export interface SyncRpc {
  saveGet(): Promise<RpcResult<SaveRow | null>>;
  savePut(data: Snapshot, schemaVersion: number, expectedVersion: number, device: string): Promise<RpcResult<{ version: number }>>;
}

export type Choice = 'account' | 'local' | 'later';
export interface ConflictInfo {
  local: Summary;
  account: Summary;
  accountUpdatedAt: string;
  accountDevice: string | null;
}
export interface Summary {
  pets: number;
  tickets: number;
  pulls: number;
}

// ---------- 파일 ----------

export function readSnapshot(dir: string, appVersion: string): Snapshot {
  const files: Record<string, unknown> = {};
  for (const name of SAVE_FILES) {
    try {
      files[name] = JSON.parse(fs.readFileSync(path.join(dir, name), 'utf8'));
    } catch {
      /* 없거나 깨진 파일은 건너뛴다 */
    }
  }
  return { schema: SCHEMA_VERSION, appVersion, files };
}

function writeAtomic(file: string, text: string): void {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = file + '.tmp';
  fs.writeFileSync(tmp, text, 'utf8');
  fs.renameSync(tmp, file);
}

/** 서버에서 받은 저장분을 파일로 쓴다. 우리가 아는 파일 이름만 쓴다(경로 조작 방지). */
export function applySnapshot(dir: string, snap: Snapshot): void {
  for (const name of SAVE_FILES) {
    if (!(name in snap.files)) continue;
    writeAtomic(path.join(dir, name), JSON.stringify(snap.files[name], null, 2));
  }
}

/** 이 PC의 저장 파일을 backups/<이름>/ 으로 복사해 둔다. 오래된 백업은 최근 10개만 남긴다. */
export function backupLocal(dir: string, label: string, now = Date.now()): string {
  const root = path.join(dir, 'backups');
  const stamp = new Date(now).toISOString().replace(/[:.]/g, '-');
  const target = path.join(root, `${stamp}-${label}`);
  fs.mkdirSync(target, { recursive: true });
  for (const name of SAVE_FILES) {
    const src = path.join(dir, name);
    if (fs.existsSync(src)) fs.copyFileSync(src, path.join(target, name));
  }
  const all = fs.readdirSync(root).sort();
  for (const old of all.slice(0, Math.max(0, all.length - KEEP_BACKUPS))) fs.rmSync(path.join(root, old), { recursive: true, force: true });
  return target;
}

export function loadState(file: string): SyncState | null {
  try {
    const s = JSON.parse(fs.readFileSync(file, 'utf8')) as Partial<SyncState>;
    return typeof s.userId === 'string' && Number.isInteger(s.version) ? { userId: s.userId, version: s.version as number } : null;
  } catch {
    return null;
  }
}
export function saveState(file: string, state: SyncState): void {
  writeAtomic(file, JSON.stringify(state));
}

// ---------- 규칙 ----------

type Loose = Record<string, unknown>;
const obj = (v: unknown): Loose => (v && typeof v === 'object' ? (v as Loose) : {});

export function summarize(snap: Snapshot): Summary {
  const c = obj(snap.files['collection.json']);
  return {
    pets: Object.keys(obj(c.owned)).length,
    tickets: typeof c.tickets === 'number' ? c.tickets : 0,
    pulls: typeof c.pulls === 'number' ? c.pulls : 0,
  };
}

/** 지켜야 할 만큼 진행이 있는가(처음 설치해서 알 한 개뿐인 상태는 아니다). */
export function hasProgress(snap: Snapshot): boolean {
  const s = summarize(snap);
  const growth = obj(snap.files['growth.json']);
  const days = Array.isArray(growth.days) ? growth.days.length : 0;
  const counters = Object.values(obj(growth.counters)).reduce<number>((sum, v) => sum + (typeof v === 'number' ? v : 0), 0);
  const grew = Object.keys(obj(growth.achievements)).length > 0 || days >= 2 || counters >= 30;
  return s.pets > 1 || s.pulls > 0 || grew;
}

/** 서버가 보낸 저장분이 우리가 읽을 수 있는 모양인지 검사한다. */
export function isValidSnapshot(v: unknown): v is Snapshot {
  const s = obj(v);
  if (typeof s.schema !== 'number' || s.schema > SCHEMA_VERSION) return false;
  const files = obj(s.files);
  return Object.keys(files).every((k) => (SAVE_FILES as readonly string[]).includes(k)) && 'collection.json' in files;
}

// ---------- 동기화 ----------

export interface SyncDeps {
  rpc: SyncRpc;
  dir: string;
  appVersion: string;
  device: string;
  /** 메모리의 최신 상태를 파일로 내보낸다(읽기 전에 호출) */
  flush: () => void;
  ask: (info: ConflictInfo) => Promise<Choice>;
  /** 받아 온 저장분을 적용한 뒤 앱을 다시 시작한다(되돌아오지 않는다) */
  restartWithNewSave: () => void;
  say: (text: string) => void;
}

export class AccountSync {
  private paused = false;
  private busy = false;
  constructor(private readonly d: SyncDeps) {}

  private get stateFile(): string {
    return path.join(this.d.dir, 'sync-state.json');
  }

  /** 로그인했을 때·앱을 켰을 때: 서버와 이 PC를 맞춘다. */
  async reconcile(userId: string): Promise<void> {
    if (this.busy) return;
    this.busy = true;
    try {
      this.paused = false;
      this.d.flush();
      const local = readSnapshot(this.d.dir, this.d.appVersion);
      const got = await this.d.rpc.saveGet();
      if (got.error) return this.d.say('계정과 맞추지 못했어요: ' + got.error.message);
      const server = got.data;
      const state = loadState(this.stateFile);
      const linked = state?.userId === userId;

      if (!server) {
        if (!hasProgress(local)) return;
        backupLocal(this.d.dir, 'before-first-upload');
        await this.put(local, 0, userId, '이 PC의 진행을 계정에 올렸어요. 다른 PC에서 같은 GitHub 계정으로 로그인하면 이어서 할 수 있어요');
        return;
      }
      if (!isValidSnapshot(server.data)) return this.d.say('계정에 저장된 진행을 읽을 수 없어서 건드리지 않았어요');

      if (state && linked && state.version === server.version) {
        await this.put(local, server.version, userId);
        return;
      }
      if (!hasProgress(local)) {
        backupLocal(this.d.dir, 'before-download');
        saveState(this.stateFile, { userId, version: server.version });
        applySnapshot(this.d.dir, server.data);
        this.d.restartWithNewSave();
        return;
      }
      const choice = await this.d.ask({
        local: summarize(local),
        account: summarize(server.data),
        accountUpdatedAt: server.updated_at,
        accountDevice: server.device,
      });
      if (choice === 'account') {
        backupLocal(this.d.dir, 'before-download');
        saveState(this.stateFile, { userId, version: server.version });
        applySnapshot(this.d.dir, server.data);
        this.d.restartWithNewSave();
      } else if (choice === 'local') {
        backupLocal(this.d.dir, 'before-overwrite-account');
        await this.put(local, server.version, userId, '이 PC의 진행을 계정에 올렸어요(이전 계정 진행은 서버에 백업돼 있어요)');
      } else {
        this.paused = true;
        this.d.say('나중에 맞출게요. 그때까지는 이 PC의 진행이 계정에 올라가지 않아요');
      }
    } finally {
      this.busy = false;
    }
  }

  /** 주기적으로: 맞춰 둔 상태라면 이 PC의 변경을 계정에 올린다. */
  async tick(userId: string): Promise<void> {
    if (this.paused || this.busy) return;
    const state = loadState(this.stateFile);
    if (!state || state.userId !== userId) return;
    this.busy = true;
    try {
      this.d.flush();
      await this.put(readSnapshot(this.d.dir, this.d.appVersion), state.version, userId);
    } finally {
      this.busy = false;
    }
  }

  private async put(local: Snapshot, expected: number, userId: string, okMessage?: string): Promise<void> {
    const r = await this.d.rpc.savePut(local, SCHEMA_VERSION, expected, this.d.device);
    if (r.error) {
      if (/version_conflict/.test(r.error.message)) {
        this.paused = true;
        this.d.say('다른 PC에서 먼저 저장했어요. 메뉴의 "지금 계정과 맞추기"로 어느 쪽을 쓸지 골라 주세요');
      } else if (/too_large/.test(r.error.message)) {
        this.paused = true;
        this.d.say('저장 데이터가 너무 커서 계정에 올리지 못했어요');
      } else {
        this.d.say('계정에 저장하지 못했어요: ' + r.error.message);
      }
      return;
    }
    saveState(this.stateFile, { userId, version: r.data?.version ?? expected + 1 });
    if (okMessage) this.d.say(okMessage);
  }
}

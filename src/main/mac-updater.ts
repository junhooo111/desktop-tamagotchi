/**
 * macOS 자동 업데이트(직접 만든 방식).
 *
 * electron-updater 는 맥에서 코드 서명된 앱만 업데이트할 수 있는데 이 앱은 서명이 없다. 그래서 같은 모양(AutoUpdaterLike)의
 * 간단한 업데이트기를 따로 둔다: 릴리스의 latest-mac.json 으로 새 버전을 확인 → 맞는 아키텍처의 zip 을 받아 해시를 검증 →
 * `ditto` 로 풀어 두었다가 → 앱이 끝나는 순간 셸 스크립트가 앱 폴더를 바꿔치고 다시 실행한다(실패하면 원래 앱으로 되돌린다).
 * 앱이 직접 받은 파일에는 "인터넷에서 받음" 표시가 붙지 않아 따로 허용할 필요가 없다.
 *
 * 외부와 닿는 부분(네트워크·파일·프로세스)은 모두 deps 로 받아서 맥이 없어도 테스트한다.
 * 주의: 맥에서 실제로 돌려 보지는 못했다.
 */
import type { AutoUpdaterLike, UpdateInfoLike } from './updater.js';

/** 업데이트 파일은 이 저장소의 릴리스에서만 받는다(매니페스트가 주는 주소는 쓰지 않는다). */
export const MAC_RELEASE_BASE = 'https://github.com/junhooo111/desktop-tamagotchi/releases';
export const MAC_MANIFEST_URL = `${MAC_RELEASE_BASE}/latest/download/latest-mac.json`;

export type MacArch = 'x64' | 'arm64';

export interface MacManifestFile {
  arch: MacArch;
  name: string;
  /** 소문자 16진수 sha512(128자) */
  sha512: string;
  size: number;
}

export interface MacManifest {
  version: string;
  files: MacManifestFile[];
}

const VERSION = /^\d+\.\d+\.\d+$/;
const FILE_NAME = /^Desktop-Tamagotchi-\d+\.\d+\.\d+-mac-(x64|arm64)\.zip$/;
const SHA512 = /^[0-9a-f]{128}$/;

/** latest-mac.json 을 검증한다. 이상하면 null. 파일 이름·해시·크기가 형식에 맞지 않는 항목은 버린다. */
export function parseManifest(raw: unknown): MacManifest | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const r = raw as Record<string, unknown>;
  if (typeof r['version'] !== 'string' || !VERSION.test(r['version']) || !Array.isArray(r['files'])) return null;
  const version = r['version'];
  const files: MacManifestFile[] = [];
  for (const f of r['files']) {
    if (typeof f !== 'object' || f === null) continue;
    const e = f as Record<string, unknown>;
    const name = typeof e['name'] === 'string' ? e['name'] : '';
    const m = FILE_NAME.exec(name);
    const sha512 = typeof e['sha512'] === 'string' ? e['sha512'].toLowerCase() : '';
    const size = typeof e['size'] === 'number' && Number.isFinite(e['size']) && e['size'] > 0 ? e['size'] : 0;
    // 파일 이름의 버전·아키텍처가 매니페스트와 어긋나면 믿지 않는다.
    if (!m || name !== `Desktop-Tamagotchi-${version}-mac-${m[1]}.zip` || !SHA512.test(sha512) || size === 0) continue;
    files.push({ arch: m[1] as MacArch, name, sha512, size });
  }
  return { version, files };
}

/** a 가 b 보다 새 버전인지(x.y.z 숫자 비교) */
export function isNewerVersion(a: string, b: string): boolean {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (d !== 0) return d > 0;
  }
  return false;
}

/** 실행 파일 경로에서 앱 번들(…/Desktop Tamagotchi.app)을 찾는다. 개발 실행처럼 .app 안이 아니면 null. */
export function appBundleOf(execPath: string): string | null {
  const i = execPath.indexOf('.app/');
  return i < 0 ? null : execPath.slice(0, i + 4);
}

/** 셸에 넘길 문자열을 작은따옴표로 안전하게 감싼다(작은따옴표 자체는 '\'' 로 이스케이프). */
export const shellQuote = (s: string): string => `'${s.replace(/'/g, `'\\''`)}'`;

/**
 * 앱이 끝나기를 기다렸다가 앱 폴더를 새 것으로 바꾸고 다시 실행하는 스크립트.
 * 바꾸는 데 실패하면 원래 앱으로 되돌린 뒤 원래 앱을 다시 실행한다. relaunch 가 false 면(끝날 때 설치) 다시 실행하지 않는다.
 */
export function buildInstallScript(opts: { pid: number; appPath: string; newAppPath: string; relaunch: boolean }): string {
  const app = shellQuote(opts.appPath);
  const next = shellQuote(opts.newAppPath);
  return [
    '#!/bin/sh',
    '# Desktop Tamagotchi 업데이트: 앱이 끝나면 새 앱으로 바꾼다(실패하면 되돌린다).',
    `APP=${app}`,
    `NEW=${next}`,
    `PID=${Math.trunc(opts.pid)}`,
    'i=0',
    'while kill -0 "$PID" 2>/dev/null && [ "$i" -lt 60 ]; do sleep 0.5; i=$((i+1)); done',
    'BACKUP="$APP.old"',
    'rm -rf "$BACKUP"',
    'if mv "$APP" "$BACKUP"; then',
    '  if mv "$NEW" "$APP"; then',
    '    xattr -cr "$APP" 2>/dev/null',
    '    rm -rf "$BACKUP"',
    '  else',
    '    mv "$BACKUP" "$APP"',
    '  fi',
    'fi',
    opts.relaunch ? 'open "$APP"' : ':',
    '',
  ].join('\n');
}

export interface MacUpdaterDeps {
  /** 지금 설치된 앱 버전 */
  currentVersion: string;
  arch: MacArch;
  /** 실행 중인 앱 번들 경로(개발 실행이면 null) */
  appPath: string | null;
  fetchJson(url: string): Promise<unknown>;
  /** url 의 파일을 dest 로 내려받는다 */
  download(url: string, dest: string): Promise<void>;
  sha512(file: string): Promise<string>;
  /** zip 을 dir 안에 푼다(ditto -x -k: 심볼릭 링크 보존) */
  extract(zip: string, dir: string): Promise<void>;
  /** 작업 폴더를 비우고 새로 만든 뒤 경로를 돌려준다 */
  workDir(): Promise<string>;
  /** 압축을 푼 폴더 안에 새 앱 번들이 있는지 */
  exists(file: string): boolean;
  /** 스크립트 파일을 만들고 경로를 돌려준다(앱이 끝나는 순간에도 쓸 수 있게 동기) */
  writeScript(content: string): string;
  /** 스크립트를 앱과 떨어진 프로세스로 실행한다 */
  spawnScript(script: string): void;
  pid: number;
  quit(): void;
}

type Listener = (arg: never) => void;

/** AutoUpdaterLike 와 같은 모양이라 UpdateController 가 그대로 쓴다. */
export class MacAutoUpdater implements AutoUpdaterLike {
  autoDownload = true;
  autoInstallOnAppQuit = true;
  private readonly listeners: Record<string, Listener[]> = {};
  private downloaded: { version: string; newAppPath: string } | null = null;
  private installed = false;

  constructor(private readonly deps: MacUpdaterDeps) {}

  on(event: 'update-available' | 'update-not-available' | 'update-downloaded', listener: (info: UpdateInfoLike) => void): unknown;
  on(event: 'error', listener: (error: Error) => void): unknown;
  on(event: string, listener: Listener): unknown {
    (this.listeners[event] ??= []).push(listener);
    return this;
  }

  private emit(event: string, arg: unknown): void {
    for (const l of this.listeners[event] ?? []) l(arg as never);
  }

  async checkForUpdates(): Promise<void> {
    try {
      const manifest = parseManifest(await this.deps.fetchJson(MAC_MANIFEST_URL));
      if (!manifest) throw new Error('업데이트 정보를 읽지 못했습니다');
      const file = manifest.files.find((f) => f.arch === this.deps.arch);
      if (!file || !isNewerVersion(manifest.version, this.deps.currentVersion)) {
        this.emit('update-not-available', { version: this.deps.currentVersion });
        return;
      }
      this.emit('update-available', { version: manifest.version });
      if (this.autoDownload) await this.download(manifest.version, file);
    } catch (error) {
      this.emit('error', error instanceof Error ? error : new Error(String(error)));
    }
  }

  private async download(version: string, file: MacManifestFile): Promise<void> {
    const dir = await this.deps.workDir();
    const zip = `${dir}/${file.name}`;
    await this.deps.download(`${MAC_RELEASE_BASE}/download/v${version}/${file.name}`, zip);
    const actual = (await this.deps.sha512(zip)).toLowerCase();
    if (actual !== file.sha512) throw new Error('받은 파일이 올바르지 않습니다(해시가 다릅니다)');
    const out = `${dir}/extracted`;
    await this.deps.extract(zip, out);
    const newAppPath = `${out}/Desktop Tamagotchi.app`;
    if (!this.deps.exists(newAppPath)) throw new Error('받은 파일에서 앱을 찾지 못했습니다');
    this.downloaded = { version, newAppPath };
    this.emit('update-downloaded', { version });
  }

  private run(relaunch: boolean): boolean {
    const ready = this.downloaded;
    if (!ready || this.installed || !this.deps.appPath) return false;
    this.installed = true; // 두 번 실행하지 않는다
    const script = this.deps.writeScript(buildInstallScript({ pid: this.deps.pid, appPath: this.deps.appPath, newAppPath: ready.newAppPath, relaunch }));
    this.deps.spawnScript(script);
    return true;
  }

  /** 지금 설치하고 다시 시작한다. */
  quitAndInstall(): void {
    if (this.run(true)) this.deps.quit();
  }

  /** 앱이 끝날 때(autoInstallOnAppQuit) 받아 둔 새 버전이 있으면 교체한다. 다시 실행하지는 않는다. */
  installOnQuit(): void {
    if (this.autoInstallOnAppQuit) this.run(false);
  }
}

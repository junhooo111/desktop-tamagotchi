import { describe, expect, it, vi } from 'vitest';
import { MAC_MANIFEST_URL, MAC_RELEASE_BASE, MacAutoUpdater, appBundleOf, buildInstallScript, isNewerVersion, parseManifest, shellQuote, type MacUpdaterDeps } from './mac-updater.js';
import { UpdateController, type AutoUpdaterLike } from './updater.js';

const HASH = 'a'.repeat(128);
const file = (arch: 'x64' | 'arm64', version = '0.9.0', over: Record<string, unknown> = {}) => ({ arch, name: `Desktop-Tamagotchi-${version}-mac-${arch}.zip`, sha512: HASH, size: 1_000, ...over });
const manifest = (version = '0.9.0', files: unknown[] = [file('x64', version), file('arm64', version)]) => ({ version, files });

describe('parseManifest', () => {
  it('올바른 매니페스트는 버전과 두 아키텍처 파일을 돌려준다', () => {
    const m = parseManifest(manifest())!;
    expect(m.version).toBe('0.9.0');
    expect(m.files.map((f) => f.arch)).toEqual(['x64', 'arm64']);
  });

  it('형식이 틀리면 null 이거나 그 항목만 버린다(버전·파일 이름·해시·크기·아키텍처 불일치)', () => {
    for (const bad of [null, undefined, 1, 'x', [], {}, { version: '1.0', files: [] }, { version: '0.9.0' }, { version: '0.9.0', files: 'x' }]) expect(parseManifest(bad)).toBeNull();
    const m = parseManifest(
      manifest('0.9.0', [
        file('x64'),
        file('arm64', '0.9.0', { sha512: 'short' }),
        file('arm64', '0.9.0', { size: 0 }),
        file('arm64', '0.9.0', { name: '../evil.zip' }),
        file('arm64', '0.9.0', { name: 'Desktop-Tamagotchi-0.8.0-mac-arm64.zip' }), // 버전이 다르다
        file('arm64', '0.9.0', { name: 'Desktop-Tamagotchi-0.9.0-mac-x64.zip' }), // 아키텍처 표시가 다르면 x64 로 읽힌다
        null,
        42,
      ]),
    )!;
    expect(m.files.map((f) => f.name)).toEqual(['Desktop-Tamagotchi-0.9.0-mac-x64.zip', 'Desktop-Tamagotchi-0.9.0-mac-x64.zip']);
  });

  it('해시는 대문자여도 소문자로 맞춘다', () => {
    expect(parseManifest(manifest('0.9.0', [file('x64', '0.9.0', { sha512: 'A'.repeat(128) })]))!.files[0]!.sha512).toBe(HASH);
  });
});

describe('버전 비교·경로·셸', () => {
  it('isNewerVersion: x.y.z 를 숫자로 비교한다(0.10.0 > 0.9.0)', () => {
    expect(isNewerVersion('0.9.0', '0.8.1')).toBe(true);
    expect(isNewerVersion('0.10.0', '0.9.0')).toBe(true);
    expect(isNewerVersion('1.0.0', '0.99.99')).toBe(true);
    expect(isNewerVersion('0.8.1', '0.8.1')).toBe(false);
    expect(isNewerVersion('0.8.0', '0.8.1')).toBe(false);
  });

  it('appBundleOf: 실행 파일 경로에서 .app 번들을 찾고, 개발 실행이면 null', () => {
    expect(appBundleOf('/Applications/Desktop Tamagotchi.app/Contents/MacOS/Desktop Tamagotchi')).toBe('/Applications/Desktop Tamagotchi.app');
    expect(appBundleOf('/Users/a/node_modules/electron/dist/Electron.app/Contents/MacOS/Electron')).toBe('/Users/a/node_modules/electron/dist/Electron.app');
    expect(appBundleOf('/usr/local/bin/node')).toBeNull();
  });

  it("shellQuote: 공백·작은따옴표·$·백틱이 있어도 하나의 인자로 안전하다", () => {
    expect(shellQuote('/Applications/Desktop Tamagotchi.app')).toBe("'/Applications/Desktop Tamagotchi.app'");
    expect(shellQuote("it's")).toBe("'it'\\''s'");
    expect(shellQuote('$(rm -rf ~)`x`')).toBe("'$(rm -rf ~)`x`'");
  });

  it('buildInstallScript: 앱이 끝나길 기다렸다가 바꿔치고, 실패하면 되돌리고, 필요하면 다시 연다', () => {
    const s = buildInstallScript({ pid: 123, appPath: '/Applications/Desktop Tamagotchi.app', newAppPath: '/tmp/u/extracted/Desktop Tamagotchi.app', relaunch: true });
    expect(s.startsWith('#!/bin/sh')).toBe(true);
    expect(s).toContain("APP='/Applications/Desktop Tamagotchi.app'");
    expect(s).toContain("NEW='/tmp/u/extracted/Desktop Tamagotchi.app'");
    expect(s).toContain('PID=123');
    expect(s).toContain('kill -0 "$PID"'); // 끝나길 기다린다
    expect(s).toContain('mv "$APP" "$BACKUP"'); // 먼저 백업
    expect(s).toContain('mv "$BACKUP" "$APP"'); // 실패하면 되돌린다
    expect(s).toContain('xattr -cr "$APP"');
    expect(s).toContain('open "$APP"');
    expect(buildInstallScript({ pid: 1, appPath: '/a.app', newAppPath: '/b.app', relaunch: false })).not.toContain('open "$APP"');
  });

  it('buildInstallScript: pid 는 정수만 들어간다(문자열 끼워 넣기 방지)', () => {
    expect(buildInstallScript({ pid: 12.9, appPath: '/a.app', newAppPath: '/b.app', relaunch: true })).toContain('PID=12\n');
    expect(buildInstallScript({ pid: Number('1; rm -rf /'), appPath: '/a.app', newAppPath: '/b.app', relaunch: true })).toContain('PID=NaN');
  });
});

function setup(over: Partial<MacUpdaterDeps> = {}, current = '0.8.1', arch: 'x64' | 'arm64' = 'arm64') {
  const deps: MacUpdaterDeps = {
    currentVersion: current,
    arch,
    appPath: '/Applications/Desktop Tamagotchi.app',
    fetchJson: vi.fn(async () => manifest()),
    download: vi.fn(async () => undefined),
    sha512: vi.fn(async () => HASH),
    extract: vi.fn(async () => undefined),
    workDir: vi.fn(async () => '/tmp/u'),
    exists: vi.fn(() => true),
    writeScript: vi.fn(() => '/tmp/u.sh'),
    spawnScript: vi.fn(),
    pid: 99,
    quit: vi.fn(),
    ...over,
  };
  const updater = new MacAutoUpdater(deps);
  const events: [string, unknown][] = [];
  for (const e of ['update-available', 'update-not-available', 'update-downloaded'] as const) updater.on(e, (info) => events.push([e, info.version]));
  updater.on('error', (err) => events.push(['error', err.message]));
  return { deps, updater, events };
}

describe('MacAutoUpdater 확인·받기', () => {
  it('새 버전이 있으면 알리고(update-available) 내 아키텍처 파일을 이 저장소 릴리스 주소에서 받아 푼 뒤 update-downloaded 를 낸다', async () => {
    const { deps, updater, events } = setup();
    await updater.checkForUpdates();
    expect(deps.fetchJson).toHaveBeenCalledWith(MAC_MANIFEST_URL);
    expect(deps.download).toHaveBeenCalledWith(`${MAC_RELEASE_BASE}/download/v0.9.0/Desktop-Tamagotchi-0.9.0-mac-arm64.zip`, '/tmp/u/Desktop-Tamagotchi-0.9.0-mac-arm64.zip');
    expect(deps.extract).toHaveBeenCalledWith('/tmp/u/Desktop-Tamagotchi-0.9.0-mac-arm64.zip', '/tmp/u/extracted');
    expect(events).toEqual([['update-available', '0.9.0'], ['update-downloaded', '0.9.0']]);
  });

  it('Intel 맥이면 x64 파일을 받는다', async () => {
    const { deps, updater } = setup({}, '0.8.1', 'x64');
    await updater.checkForUpdates();
    expect(vi.mocked(deps.download).mock.calls[0]![0]).toContain('mac-x64.zip');
  });

  it('최신이거나 더 낮은 버전이면 update-not-available 이고 아무것도 받지 않는다', async () => {
    for (const current of ['0.9.0', '1.0.0']) {
      const { deps, updater, events } = setup({}, current);
      await updater.checkForUpdates();
      expect(events).toEqual([['update-not-available', current]]);
      expect(deps.download).not.toHaveBeenCalled();
    }
  });

  it('내 아키텍처 파일이 매니페스트에 없으면 업데이트가 없는 것으로 본다', async () => {
    const { deps, updater, events } = setup({ fetchJson: vi.fn(async () => manifest('0.9.0', [file('x64')])) });
    await updater.checkForUpdates();
    expect(events[0]![0]).toBe('update-not-available');
    expect(deps.download).not.toHaveBeenCalled();
  });

  it('autoDownload 가 꺼져 있으면 알리기만 하고 받지 않는다', async () => {
    const { deps, updater, events } = setup();
    updater.autoDownload = false;
    await updater.checkForUpdates();
    expect(events).toEqual([['update-available', '0.9.0']]);
    expect(deps.download).not.toHaveBeenCalled();
  });

  it('해시가 다르면 오류를 내고, 받은 것으로 치지 않는다', async () => {
    const { updater, events } = setup({ sha512: vi.fn(async () => 'b'.repeat(128)) });
    await updater.checkForUpdates();
    expect(events.at(-1)).toEqual(['error', '받은 파일이 올바르지 않습니다(해시가 다릅니다)']);
    expect(events.some(([e]) => e === 'update-downloaded')).toBe(false);
    updater.quitAndInstall();
  });

  it('네트워크 오류·잘못된 매니페스트·앱 없음은 오류로 알린다(앱이 죽지 않는다)', async () => {
    for (const over of [
      { fetchJson: vi.fn(async () => { throw new Error('offline'); }) },
      { fetchJson: vi.fn(async () => ({ nope: 1 })) },
      { exists: vi.fn(() => false) },
      { download: vi.fn(async () => { throw new Error('끊김'); }) },
    ]) {
      const { updater, events } = setup(over);
      await expect(updater.checkForUpdates()).resolves.toBeUndefined();
      expect(events.at(-1)![0]).toBe('error');
    }
  });
});

describe('MacAutoUpdater 설치', () => {
  const ready = async (over: Partial<MacUpdaterDeps> = {}) => {
    const s = setup(over);
    await s.updater.checkForUpdates();
    return s;
  };

  it('quitAndInstall: 스크립트(다시 열기 포함)를 만들어 실행하고 앱을 끝낸다', async () => {
    const { deps, updater } = await ready();
    updater.quitAndInstall();
    const script = vi.mocked(deps.writeScript).mock.calls[0]![0];
    expect(script).toContain('PID=99');
    expect(script).toContain("NEW='/tmp/u/extracted/Desktop Tamagotchi.app'");
    expect(script).toContain('open "$APP"');
    expect(deps.spawnScript).toHaveBeenCalledWith('/tmp/u.sh');
    expect(deps.quit).toHaveBeenCalledTimes(1);
  });

  it('받아 둔 것이 없으면 아무것도 하지 않는다', () => {
    const { deps, updater } = setup();
    updater.quitAndInstall();
    expect(deps.spawnScript).not.toHaveBeenCalled();
    expect(deps.quit).not.toHaveBeenCalled();
  });

  it('개발 실행(앱 번들 없음)이면 설치하지 않는다', async () => {
    const { deps, updater } = await ready({ appPath: null });
    updater.quitAndInstall();
    expect(deps.spawnScript).not.toHaveBeenCalled();
  });

  it('installOnQuit: 끝날 때 교체하되 다시 열지는 않고, 한 번만 실행한다', async () => {
    const { deps, updater } = await ready();
    updater.installOnQuit();
    updater.installOnQuit();
    updater.quitAndInstall();
    expect(deps.spawnScript).toHaveBeenCalledTimes(1);
    expect(vi.mocked(deps.writeScript).mock.calls[0]![0]).not.toContain('open "$APP"');
    expect(deps.quit).not.toHaveBeenCalled();
  });

  it('installOnQuit: autoInstallOnAppQuit 가 꺼져 있으면 하지 않는다', async () => {
    const { deps, updater } = await ready();
    updater.autoInstallOnAppQuit = false;
    updater.installOnQuit();
    expect(deps.spawnScript).not.toHaveBeenCalled();
  });
});

describe('UpdateController 와 함께 쓴다(같은 모양)', () => {
  it('확인 → 준비됨 → 지금 설치: 컨트롤러가 상태 문구를 만들고 펫에게 알리고 설치를 시작한다', async () => {
    const { deps, updater } = setup();
    const status: string[] = [];
    const downloaded: string[] = [];
    const ctl = new UpdateController(updater as unknown as AutoUpdaterLike, { enabled: () => true, onStatus: (t) => status.push(t), onDownloaded: (v) => downloaded.push(v) });
    await ctl.check(false);
    expect(ctl.ready).toBe('0.9.0');
    expect(downloaded).toEqual(['0.9.0']);
    expect(status.at(-1)).toContain('준비됐어요');
    expect(ctl.installNow()).toBe(true);
    expect(deps.spawnScript).toHaveBeenCalled();
    expect(deps.quit).toHaveBeenCalled();
  });
});

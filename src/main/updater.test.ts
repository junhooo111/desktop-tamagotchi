import { describe, expect, it, vi } from 'vitest';
import { UpdateController, type AutoUpdaterLike, type UpdateInfoLike } from './updater.js';

function fakeUpdater() {
  const handlers: Record<string, ((arg: never) => void)[]> = {};
  const u = {
    autoDownload: false,
    autoInstallOnAppQuit: false,
    on: (event: string, cb: (arg: never) => void) => {
      (handlers[event] ??= []).push(cb);
    },
    checkForUpdates: vi.fn(async () => undefined),
    quitAndInstall: vi.fn(),
    emit: (event: string, arg?: UpdateInfoLike | Error) => handlers[event]?.forEach((cb) => cb(arg as never)),
  };
  return u;
}

function setup(enabled = true) {
  const updater = fakeUpdater();
  const status: string[] = [];
  const downloaded: string[] = [];
  const ctl = new UpdateController(updater as unknown as AutoUpdaterLike, {
    enabled: () => enabled,
    onStatus: (t) => status.push(t),
    onDownloaded: (v) => downloaded.push(v),
  });
  return { updater, ctl, status, downloaded };
}

describe('UpdateController', () => {
  it('종료할 때 자동으로 설치하도록 켜 둔다', () => {
    const { updater } = setup();
    expect(updater.autoInstallOnAppQuit).toBe(true);
  });

  it('확인하면 "확인하는 중"을 알리고, 최신이면 그렇게 알린다', async () => {
    const { updater, ctl, status } = setup();
    updater.checkForUpdates.mockImplementation(async () => {
      updater.emit('update-not-available', { version: '0.3.0' });
      return undefined;
    });
    expect(await ctl.check(true)).toBe('최신 버전이에요');
    expect(status[0]).toBe('확인하는 중…');
    expect(ctl.ready).toBeNull();
  });

  it('새 버전이 있으면 받는 중 → 준비됨 순서로 알리고 펫에게 알려 준다', async () => {
    const { updater, ctl, status, downloaded } = setup();
    updater.checkForUpdates.mockImplementation(async () => {
      updater.emit('update-available', { version: '0.4.0' });
      return undefined;
    });
    expect(await ctl.check(true)).toContain('0.4.0');
    expect(updater.autoDownload).toBe(true);
    updater.emit('update-downloaded', { version: '0.4.0' });
    expect(status.at(-1)).toContain('준비됐어요');
    expect(downloaded).toEqual(['0.4.0']);
    expect(ctl.ready).toBe('0.4.0');
  });

  it('자동 업데이트를 껐으면 자동 점검은 하지 않고, 직접 누른 확인만 한다(그때는 받아 둔다)', async () => {
    const { updater, ctl } = setup(false);
    await ctl.check(false);
    expect(updater.checkForUpdates).not.toHaveBeenCalled();
    await ctl.check(true);
    expect(updater.checkForUpdates).toHaveBeenCalledTimes(1);
    expect(updater.autoDownload).toBe(true);
  });

  it('자동 점검이 켜져 있으면 받기도 자동이다', async () => {
    const { updater, ctl } = setup(true);
    await ctl.check(false);
    expect(updater.checkForUpdates).toHaveBeenCalledTimes(1);
    expect(updater.autoDownload).toBe(true);
  });

  it('직접 확인했는데 실패하면 안내하고, 자동 점검이 실패하면 조용히 넘어간다', async () => {
    const manual = setup();
    manual.updater.checkForUpdates.mockRejectedValue(new Error('offline'));
    expect(await manual.ctl.check(true)).toContain('확인하지 못했어요');

    const auto = setup();
    auto.updater.checkForUpdates.mockRejectedValue(new Error('offline'));
    expect(await auto.ctl.check(false)).toBe('');
  });

  it('error 이벤트도 직접 확인일 때만 안내한다', async () => {
    const { updater, ctl, status } = setup();
    updater.checkForUpdates.mockImplementation(async () => {
      updater.emit('error', new Error('x'));
      return undefined;
    });
    await ctl.check(true);
    expect(status.at(-1)).toContain('확인하지 못했어요');
  });

  it('이미 받아 둔 새 버전이 있으면 다시 확인하지 않는다', async () => {
    const { updater, ctl } = setup();
    updater.emit('update-downloaded', { version: '0.4.0' });
    await ctl.check(true);
    expect(updater.checkForUpdates).not.toHaveBeenCalled();
  });

  it('installNow: 받아 둔 것이 있을 때만 다시 시작해 설치한다', () => {
    const { updater, ctl } = setup();
    expect(ctl.installNow()).toBe(false);
    expect(updater.quitAndInstall).not.toHaveBeenCalled();
    updater.emit('update-downloaded', { version: '0.4.0' });
    expect(ctl.installNow()).toBe(true);
    expect(updater.quitAndInstall).toHaveBeenCalledTimes(1);
  });
});

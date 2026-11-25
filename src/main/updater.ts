/**
 * 자동 업데이트 제어. electron-updater 에 직접 묶이지 않고 AutoUpdaterLike 로만 말하므로 테스트할 수 있다.
 *
 * 흐름: 확인 → (새 버전이 있으면) 받기 → 받기 끝 → 종료할 때 설치(또는 지금 다시 시작해 설치).
 * 업데이트 파일은 이 저장소의 GitHub Releases 에서만 받는다(package.json 의 build.publish).
 */

export interface UpdateInfoLike {
  version: string;
}

export interface AutoUpdaterLike {
  autoDownload: boolean;
  autoInstallOnAppQuit: boolean;
  on(event: 'update-available' | 'update-not-available' | 'update-downloaded', listener: (info: UpdateInfoLike) => void): unknown;
  on(event: 'error', listener: (error: Error) => void): unknown;
  checkForUpdates(): Promise<unknown>;
  quitAndInstall(): void;
}

export interface UpdateHooks {
  /** 설정에서 자동 업데이트가 켜져 있는지 */
  enabled(): boolean;
  /** 사용자에게 보여 줄 상태 문구(설정 창 등) */
  onStatus(text: string): void;
  /** 새 버전을 다 받았을 때(펫이 알려 주는 용도) */
  onDownloaded(version: string): void;
}

export class UpdateController {
  private status = '';
  private downloadedVersion: string | null = null;
  private manual = false;

  constructor(
    private readonly updater: AutoUpdaterLike,
    private readonly hooks: UpdateHooks,
  ) {
    updater.autoInstallOnAppQuit = true;
    updater.on('update-available', (info) => {
      // 자동 받기가 꺼져 있어도 사용자가 직접 확인했으면 받는다(check 에서 autoDownload 를 켠다).
      this.set(this.updater.autoDownload ? `새 버전 ${info.version} 을 받는 중이에요` : `새 버전 ${info.version} 이 있어요`);
    });
    updater.on('update-not-available', () => this.set('최신 버전이에요'));
    updater.on('update-downloaded', (info) => {
      this.downloadedVersion = info.version;
      this.set(`새 버전 ${info.version} 이 준비됐어요. 펫을 종료하면 설치돼요`);
      this.hooks.onDownloaded(info.version);
    });
    updater.on('error', () => this.set(this.manual ? '업데이트를 확인하지 못했어요. 인터넷 연결을 확인해 주세요' : this.status));
  }

  private set(text: string): void {
    this.status = text;
    this.hooks.onStatus(text);
  }

  /** 받아 둔 새 버전이 있으면 그 버전, 없으면 null */
  get ready(): string | null {
    return this.downloadedVersion;
  }

  /** 새 버전을 확인한다. manual 이면 사용자가 직접 누른 것이다. 결과 문구를 돌려준다. */
  async check(manual: boolean): Promise<string> {
    if (this.downloadedVersion) return this.status;
    if (!manual && !this.hooks.enabled()) return this.status;
    this.manual = manual;
    this.updater.autoDownload = manual || this.hooks.enabled();
    this.set('확인하는 중…');
    try {
      await this.updater.checkForUpdates();
    } catch {
      this.set(manual ? '업데이트를 확인하지 못했어요. 인터넷 연결을 확인해 주세요' : '');
    }
    return this.status;
  }

  /** 받아 둔 새 버전을 지금 설치하고 다시 시작한다. 받아 둔 것이 없으면 false. */
  installNow(): boolean {
    if (!this.downloadedVersion) return false;
    this.updater.quitAndInstall();
    return true;
  }
}

/** 점검 주기: 시작 30초 뒤 한 번, 이후 6시간마다 */
export const UPDATE_FIRST_CHECK_MS = 30_000;
export const UPDATE_EVERY_MS = 6 * 60 * 60_000;

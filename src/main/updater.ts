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
  /** 확인·받기가 실패했을 때 원인(영어 오류 메시지 그대로). 로그 파일에 남기는 용도 */
  onError?(message: string, manual: boolean): void;
}

/** 실패한 자동 확인을 다시 시도하는 간격(첫 실패 2분 뒤, 그다음 10분 뒤. 그래도 안 되면 30분 주기 점검이 이어받는다) */
export const UPDATE_RETRY_MS = [2 * 60_000, 10 * 60_000] as const;

/**
 * 업데이트 오류 메시지를 사용자가 이해할 문구로 바꾼다. 원인별로 다르게 안내해서
 * "인터넷 연결을 확인하세요" 한 가지로 뭉뚱그리지 않는다(네트워크 문제가 아닐 때 헷갈리지 않게).
 */
export function describeUpdateError(message: string): string {
  if (/ENOTFOUND|EAI_AGAIN|ETIMEDOUT|ECONNRESET|ECONNREFUSED|ENETUNREACH|net::ERR|socket hang up|getaddrinfo|timed? ?out/i.test(message)) {
    return '업데이트를 확인하지 못했어요. 인터넷 연결을 확인해 주세요';
  }
  if (/\b(403|429)\b|rate limit/i.test(message)) return 'GitHub 에서 잠시 요청을 막았어요. 몇 분 뒤에 다시 눌러 주세요';
  if (/\b404\b|cannot find|latest(-mac)?\.(yml|json)|no published versions/i.test(message)) {
    return '업데이트 정보를 찾지 못했어요. 새 버전을 올리는 중일 수 있으니 잠시 뒤에 다시 해 주세요';
  }
  if (/sha512|checksum|signature|hash/i.test(message)) return '받은 파일을 확인하지 못했어요. 잠시 뒤에 다시 해 주세요';
  return `업데이트를 확인하지 못했어요. 잠시 뒤에 다시 해 주세요 (원인: ${message.replace(/\s+/g, ' ').slice(0, 80)})`;
}

export class UpdateController {
  private status = '';
  private downloadedVersion: string | null = null;
  private manual = false;
  private reminders = 0;
  /** 이번 확인의 오류를 이미 처리했는지('error' 이벤트와 거절된 Promise 가 둘 다 오기 때문에 한 번만 센다) */
  private reported = false;
  private retries = 0;
  private retryTimer: ReturnType<typeof setTimeout> | null = null;

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
    updater.on('error', (error) => this.fail(error));
  }

  /** 실패를 한 번만 처리한다: 원인을 기록하고, 직접 누른 경우에만 문구를 보여 주며, 자동 확인이면 잠시 뒤 다시 시도한다. */
  private fail(error: unknown): void {
    if (this.reported) return;
    this.reported = true;
    const message = error instanceof Error ? error.message : String(error);
    this.hooks.onError?.(message, this.manual);
    if (this.manual) {
      this.set(describeUpdateError(message));
      return;
    }
    this.set(this.status === '확인하는 중…' ? '' : this.status);
    const wait = UPDATE_RETRY_MS[this.retries];
    if (wait !== undefined && !this.retryTimer) {
      this.retries += 1;
      this.retryTimer = setTimeout(() => {
        this.retryTimer = null;
        void this.check(false);
      }, wait);
    }
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
    this.reported = false;
    this.updater.autoDownload = manual || this.hooks.enabled();
    this.set('확인하는 중…');
    try {
      await this.updater.checkForUpdates();
      if (!this.reported) this.retries = 0; // 성공했으니 다음 실패 때는 다시 처음부터 재시도한다
    } catch (error) {
      this.fail(error);
    }
    return this.status;
  }

  /**
   * 받아 둔 새 버전을 다시 알릴 때 쓰는 안내. 받아 둔 것이 없으면 null.
   * 말풍선은 매번, 눈에 잘 띄는 시스템 알림(toast)은 첫 번째와 이후 TOAST_EVERY 번에 한 번씩만 띄운다.
   */
  remind(): { text: string; toast: boolean } | null {
    if (!this.downloadedVersion) return null;
    const toast = this.reminders % TOAST_EVERY === 0;
    this.reminders += 1;
    return { text: `새 버전 ${this.downloadedVersion} 이 준비됐어요! 우클릭 → '설치하고 다시 시작'을 눌러 주세요`, toast };
  }

  /** 받아 둔 새 버전을 지금 설치하고 다시 시작한다. 받아 둔 것이 없으면 false. */
  installNow(): boolean {
    if (!this.downloadedVersion) return false;
    this.updater.quitAndInstall();
    return true;
  }
}

/** 점검 주기: 시작 30초 뒤 한 번, 이후 30분마다(항상 최신으로 쓰는 게 좋아서 자주 본다) */
export const UPDATE_FIRST_CHECK_MS = 30_000;
export const UPDATE_EVERY_MS = 30 * 60_000;
/** 받아 둔 새 버전이 있으면 이 간격으로 다시 알린다 */
export const UPDATE_REMIND_MS = 10 * 60_000;
/** 다시 알릴 때 시스템 알림(toast)은 몇 번에 한 번 띄울지(첫 알림은 항상 띄운다) */
export const TOAST_EVERY = 3;

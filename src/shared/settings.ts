/**
 * 사용자 설정. 설정 창에서 바꾸고 settings.json 에 저장한다.
 * 파일이 깨졌거나 허용하지 않는 값이 들어 있어도 앱이 죽지 않도록, 읽을 때마다 sanitizeSettings 로 걸러 낸다.
 */

export interface Settings {
  /** 펫 크기 배율. 도트가 뭉개지지 않게 정수 배율만 쓴다(1 = 마우스 커서 정도). */
  petScale: 1 | 2 | 3;
  /** 문제 검사를 켜는지. 끄면 펫은 놀기만 한다. */
  inspectEnabled: boolean;
  /** 열려 있는 로컬 페이지를 검사하는 주기(초) */
  scanSeconds: 5 | 10 | 30 | 60;
  /** FE 지식을 말풍선으로 알리는 주기(분). 0 이면 알리지 않는다. */
  tipMinutes: 0 | 10 | 20 | 60;
  /** 새 버전이 있으면 알려 주고 받아 두는지(설치본에서만 동작) */
  autoUpdate: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  petScale: 1,
  inspectEnabled: true,
  scanSeconds: 10,
  tipMinutes: 20,
  autoUpdate: true,
};

/** 설정 창이 보여 주는 선택지(허용하는 값과 같다) */
export const SETTING_CHOICES = {
  petScale: [1, 2, 3],
  scanSeconds: [5, 10, 30, 60],
  tipMinutes: [0, 10, 20, 60],
} as const;

/** 가장 큰 펫 배율. 투명 창 높이는 이 크기의 펫까지 들어가게 잡는다. */
export const MAX_PET_SCALE = 3;

function pick<T extends number>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === 'number' && (allowed as readonly number[]).includes(value) ? (value as T) : fallback;
}

/** 어떤 값이 와도 항상 유효한 설정을 돌려준다. 모르는 항목은 버리고, 빠진 항목은 기본값으로 채운다. */
export function sanitizeSettings(raw: unknown): Settings {
  const r = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {};
  const bool = (v: unknown, fallback: boolean): boolean => (typeof v === 'boolean' ? v : fallback);
  return {
    petScale: pick(r['petScale'], SETTING_CHOICES.petScale, DEFAULT_SETTINGS.petScale),
    inspectEnabled: bool(r['inspectEnabled'], DEFAULT_SETTINGS.inspectEnabled),
    scanSeconds: pick(r['scanSeconds'], SETTING_CHOICES.scanSeconds, DEFAULT_SETTINGS.scanSeconds),
    tipMinutes: pick(r['tipMinutes'], SETTING_CHOICES.tipMinutes, DEFAULT_SETTINGS.tipMinutes),
    autoUpdate: bool(r['autoUpdate'], DEFAULT_SETTINGS.autoUpdate),
  };
}

/** 지식 알림 간격(ms). 알리지 않는 설정이면 Infinity. */
export function tipIntervalMs(s: Pick<Settings, 'tipMinutes'>): number {
  return s.tipMinutes === 0 ? Infinity : s.tipMinutes * 60_000;
}

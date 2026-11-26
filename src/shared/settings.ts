/**
 * 사용자 설정. 설정 창에서 바꾸고 settings.json 에 저장한다.
 * 파일이 깨졌거나 허용하지 않는 값이 들어 있어도 앱이 죽지 않도록, 읽을 때마다 sanitizeSettings 로 걸러 낸다.
 */
import type { Accessory } from './art/accessory.js';
import { isAccessory, isVariant, type Variant } from './art/style.js';
import { isDisplayStage, type DisplayStage } from './pet.js';
import { isSpeciesId, type SpeciesId } from './species.js';
import { RULE_IDS, type RuleId } from './lessons.js';

export const MAX_IGNORED_KEYS = 500;
const MAX_KEY_LENGTH = 600;

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
  /** 저장소의 공지(news.json)를 가끔 읽어 와서 새 공지를 알리는지 */
  showNews: boolean;
  /** 검사하지 않을 규칙(꺼 둔 규칙은 알리지 않는다) */
  disabledRules: RuleId[];
  /** 무시한 문제의 키(주소|규칙|요소 경로). 다시 알리지 않는다. */
  ignored: string[];
  /** 꾸미기: 색 변형과 장식(업적으로 연 것만 고를 수 있다. 검증은 메인에서) */
  variant: Variant;
  accessory: Accessory;
  /** 펫 이름(없으면 빈 문자열). 말풍선·프로필 카드에 보인다. */
  petName: string;
  /** 꾸미기에서 고른 모습: auto 는 지금 단계 그대로, 아니면 이미 지나온 단계(새끼·성체·전설)로 되돌린 모습. 동물을 바꾸면 auto 로 돌아간다. */
  displayStage: DisplayStage;
  /** 프로필 카드에 보여 줄 동물('current' = 지금 키우는 동물). 열려 있는 동물만 쓴다(검증은 메인에서). */
  cardSpecies: SpeciesId | 'current';
}

export const MAX_PET_NAME = 12;

/** 이름을 다듬는다: 문자열이 아니면 빈 값, 제어문자·꺾쇠 제거, 공백 정리, 12자까지. */
export function sanitizePetName(v: unknown): string {
  if (typeof v !== 'string') return '';
  // eslint-disable-next-line no-control-regex
  const cleaned = v.replace(/[\u0000-\u001f\u007f<>&"]/g, '').replace(/\s+/g, ' ').trim();
  return Array.from(cleaned).slice(0, MAX_PET_NAME).join('').trim();
}

export const DEFAULT_SETTINGS: Settings = {
  petScale: 1,
  inspectEnabled: true,
  scanSeconds: 10,
  tipMinutes: 20,
  autoUpdate: true,
  showNews: true,
  disabledRules: [],
  ignored: [],
  variant: 'default',
  accessory: 'none',
  petName: '',
  displayStage: 'auto',
  cardSpecies: 'current',
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

function ruleList(v: unknown): RuleId[] {
  if (!Array.isArray(v)) return [];
  return RULE_IDS.filter((id) => v.includes(id));
}

function keyList(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  const keys = v.filter((k): k is string => typeof k === 'string' && k !== '' && k.length <= MAX_KEY_LENGTH);
  return [...new Set(keys)].slice(-MAX_IGNORED_KEYS);
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
    showNews: bool(r['showNews'], DEFAULT_SETTINGS.showNews),
    disabledRules: ruleList(r['disabledRules']),
    ignored: keyList(r['ignored']),
    variant: isVariant(r['variant']) ? r['variant'] : DEFAULT_SETTINGS.variant,
    accessory: isAccessory(r['accessory']) ? r['accessory'] : DEFAULT_SETTINGS.accessory,
    petName: sanitizePetName(r['petName']),
    displayStage: isDisplayStage(r['displayStage']) ? r['displayStage'] : DEFAULT_SETTINGS.displayStage,
    cardSpecies: r['cardSpecies'] === 'current' || isSpeciesId(r['cardSpecies']) ? r['cardSpecies'] : DEFAULT_SETTINGS.cardSpecies,
  };
}

/** 지식 알림 간격(ms). 알리지 않는 설정이면 Infinity. */
export function tipIntervalMs(s: Pick<Settings, 'tipMinutes'>): number {
  return s.tipMinutes === 0 ? Infinity : s.tipMinutes * 60_000;
}

/**
 * 한/영 언어 처리의 바탕.
 * 설정의 language 는 'auto'(기본)·'ko'·'en' 이고, auto 면 이 PC 의 언어·지역으로 정한다:
 * 한국어 설정이거나 지역이 한국(KR)이면 한국어, 그 밖에는 영어.
 * 문구는 {ko, en} 한 쌍으로 두고 pick 으로 고른다(번역이 빠진 곳은 한국어로 돌아간다).
 */
export type Lang = 'ko' | 'en';
export type LangSetting = 'auto' | Lang;

export const LANG_SETTINGS: readonly LangSetting[] = ['auto', 'ko', 'en'];

export interface Localized<T> {
  ko: T;
  en?: T;
}

/** 이 PC 의 언어 태그(예: "ko", "en-US")와 지역 코드(예: "KR")로 기본 언어를 정한다. */
export function detectLang(locale: string | undefined, country?: string | undefined): Lang {
  const l = (locale ?? '').toLowerCase();
  if (l.startsWith('ko')) return 'ko';
  if ((country ?? '').toUpperCase() === 'KR') return 'ko';
  return 'en';
}

/** 설정과 PC 정보로 실제로 쓸 언어를 정한다. */
export function resolveLang(setting: LangSetting, locale: string | undefined, country?: string | undefined): Lang {
  return setting === 'auto' ? detectLang(locale, country) : setting;
}

/** 언어에 맞는 문구를 고른다. 번역이 없으면 한국어. */
export function pick<T>(lang: Lang, text: Localized<T>): T {
  return lang === 'en' && text.en !== undefined ? text.en : text.ko;
}

export function isLangSetting(v: unknown): v is LangSetting {
  return v === 'auto' || v === 'ko' || v === 'en';
}

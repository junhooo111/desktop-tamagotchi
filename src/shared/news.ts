/**
 * 공지: 저장소의 news.json 을 앱이 가끔 읽어 와서 새 공지를 펫이 알려 준다.
 *
 * 서버가 따로 없다. 메인테이너가 news.json 에 항목을 추가해 push 하면, 켜 둔 앱이 다음 확인 때 읽는다.
 * 남이 고친 파일이 와도 안전하도록 읽을 때마다 sanitizeNews 로 걸러 낸다(글자 수 제한, 제어문자 제거, 링크는 이 저장소 것만).
 * 순수 함수라서 네트워크·파일·시계 없이 테스트한다. 가져오기는 main/news.ts 가 맡는다.
 */

export interface NewsItem {
  /** 공지를 구분하는 값(한 번 본 공지는 다시 알리지 않는다) */
  id: string;
  /** YYYY-MM-DD */
  date: string;
  title: string;
  body: string;
  /** 영어 제목·본문(없으면 한국어를 보여 준다) */
  en?: { title: string; body: string };
  /** 자세히 보기 링크(이 저장소 주소만 허용). 없으면 빈 문자열 */
  url: string;
}

export const NEWS_URL = 'https://raw.githubusercontent.com/junhooo111/desktop-tamagotchi/main/news.json';
/** 공지 링크로 허용하는 주소의 앞부분 */
export const NEWS_LINK_PREFIX = 'https://github.com/junhooo111/';

export const MAX_NEWS_ITEMS = 30;
export const MAX_NEWS_BYTES = 64 * 1024;
const MAX_ID = 60;
const MAX_TITLE = 40;
const MAX_BODY = 200;
const MAX_SEEN = 200;
/** 한 번에 알리는 새 공지의 최대 개수(나머지는 본 것으로 친다) */
export const MAX_SHOWN_AT_ONCE = 3;

// eslint-disable-next-line no-control-regex
const CONTROL = /[\u0000-\u001f\u007f]/g;

function text(v: unknown, max: number): string {
  if (typeof v !== 'string') return '';
  return Array.from(v.replace(CONTROL, ' ').replace(/\s+/g, ' ').trim())
    .slice(0, max)
    .join('')
    .trim();
}

/** 어떤 값이 와도 항상 유효한 공지 목록(최신 날짜 순)을 돌려준다. 이상한 항목은 그 항목만 버린다. */
export function sanitizeNews(raw: unknown): NewsItem[] {
  const list = typeof raw === 'object' && raw !== null ? (raw as { items?: unknown }).items : undefined;
  if (!Array.isArray(list)) return [];
  const items: NewsItem[] = [];
  const ids = new Set<string>();
  for (const entry of list) {
    if (typeof entry !== 'object' || entry === null) continue;
    const e = entry as Record<string, unknown>;
    const id = typeof e['id'] === 'string' ? e['id'] : '';
    if (id.length === 0 || id.length > MAX_ID || !/^[A-Za-z0-9._-]+$/.test(id) || ids.has(id)) continue;
    const date = typeof e['date'] === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(e['date']) ? e['date'] : '';
    const title = text(e['title'], MAX_TITLE);
    if (date === '' || title === '') continue;
    const url = typeof e['url'] === 'string' && e['url'].startsWith(NEWS_LINK_PREFIX) && e['url'].length <= 300 && !/\s/.test(e['url']) ? e['url'] : '';
    ids.add(id);
    const enRaw = typeof e['en'] === 'object' && e['en'] !== null ? (e['en'] as Record<string, unknown>) : null;
    const enTitle = enRaw ? text(enRaw['title'], MAX_TITLE * 2) : '';
    const en = enTitle !== '' ? { title: enTitle, body: text(enRaw?.['body'], MAX_BODY * 2) } : undefined;
    items.push({ id, date, title, body: text(e['body'], MAX_BODY), ...(en ? { en } : {}), url });
    if (items.length >= MAX_NEWS_ITEMS) break;
  }
  return items.sort((a, b) => (a.date === b.date ? (a.id < b.id ? 1 : -1) : a.date < b.date ? 1 : -1));
}

export interface NewsPick {
  /** 지금 알릴 공지(최신 것부터) */
  show: NewsItem[];
  /** 저장할 '본 공지' 목록 */
  seen: string[];
}

/**
 * 아직 안 본 공지를 골라 알릴 것과 저장할 목록을 만든다.
 * 처음 실행(firstRun)이면 지난 공지를 쏟아 내지 않고 가장 최신 하나만 알린다.
 * 한 번에 MAX_SHOWN_AT_ONCE 개까지만 알리고, 넘친 것은 본 것으로 쳐서 다음에 다시 쏟아지지 않게 한다.
 */
export function pickNews(items: readonly NewsItem[], seen: readonly string[], firstRun: boolean): NewsPick {
  const unseen = items.filter((i) => !seen.includes(i.id));
  const show = unseen.slice(0, firstRun ? 1 : MAX_SHOWN_AT_ONCE);
  const merged = [...seen, ...unseen.map((i) => i.id)];
  return { show, seen: [...new Set(merged)].slice(-MAX_SEEN) };
}

/** 저장 파일(본 공지 id 목록)을 검증한다. */
export function sanitizeSeen(raw: unknown): string[] {
  const list = typeof raw === 'object' && raw !== null ? (raw as { seen?: unknown }).seen : undefined;
  if (!Array.isArray(list)) return [];
  return [...new Set(list.filter((v): v is string => typeof v === 'string' && v.length > 0 && v.length <= MAX_ID))].slice(-MAX_SEEN);
}

/** 언어에 맞는 공지 제목·본문(영어가 없으면 한국어). */
export function newsLocal(item: NewsItem, lang: 'ko' | 'en' = 'ko'): { title: string; body: string } {
  return lang === 'en' && item.en ? item.en : { title: item.title, body: item.body };
}

/** 공지를 말풍선 문구로 만든다. */
export function newsText(item: NewsItem, lang: 'ko' | 'en' = 'ko'): string {
  const t = newsLocal(item, lang);
  return t.body ? `📢 ${t.title}\n${t.body}` : `📢 ${t.title}`;
}

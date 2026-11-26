/** 공지 가져오기와 '본 공지' 저장. 네트워크·파일만 다루고 규칙은 shared/news.ts 에 있다. */
import fs from 'node:fs';
import path from 'node:path';
import { MAX_NEWS_BYTES, NEWS_URL, sanitizeNews, sanitizeSeen, type NewsItem } from '../shared/news.js';

/** news.json 을 읽어 온다. 실패(오프라인·잘못된 응답·너무 큼)면 null. */
export async function fetchNews(fetchFn: typeof fetch = fetch, url = NEWS_URL): Promise<NewsItem[] | null> {
  try {
    const res = await fetchFn(url, { signal: AbortSignal.timeout(10_000), headers: { accept: 'application/json' } });
    if (!res.ok) return null;
    const body = await res.text();
    if (body.length > MAX_NEWS_BYTES) return null;
    return sanitizeNews(JSON.parse(body));
  } catch {
    return null;
  }
}

/** 본 공지 목록. 파일이 없으면 firstRun 이다. */
export function loadSeen(file: string): { seen: string[]; firstRun: boolean } {
  try {
    return { seen: sanitizeSeen(JSON.parse(fs.readFileSync(file, 'utf8'))), firstRun: false };
  } catch {
    return { seen: [], firstRun: !fs.existsSync(file) };
  }
}

/** 임시 파일에 쓴 뒤 바꿔치기해서, 쓰는 도중 꺼져도 파일이 깨지지 않게 한다. */
export function saveSeen(file: string, seen: readonly string[]): void {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = file + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify({ seen }, null, 2), 'utf8');
  fs.renameSync(tmp, file);
}

import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { MAX_NEWS_ITEMS, sanitizeNews } from './news.js';

const root = process.cwd();
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8')) as { version: string };
const raw = JSON.parse(fs.readFileSync(path.join(root, 'news.json'), 'utf8')) as { items: unknown[] };

describe('릴리스마다 공지를 남긴다(news.json)', () => {
  it('모든 공지가 앱의 검사(제목 40자·본문 200자·이 저장소 주소만)를 통과해서 하나도 버려지지 않는다', () => {
    expect(sanitizeNews(raw).length).toBe(raw.items.length);
    expect(raw.items.length).toBeLessThanOrEqual(MAX_NEWS_ITEMS);
  });

  it(`현재 버전(v${pkg.version})의 새 소식이 있다: id 가 "v${pkg.version}-" 로 시작하는 공지를 news.json 에 추가하세요`, () => {
    const ids = sanitizeNews(raw).map((n) => n.id);
    expect(ids.some((id) => id.startsWith(`v${pkg.version}-`)), `news.json 에 v${pkg.version}- 로 시작하는 공지가 없어요`).toBe(true);
  });
});

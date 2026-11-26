import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { fetchNews, loadSeen, saveSeen } from './news.js';

const ok = (body: string, status = 200) => (async () => new Response(body, { status })) as unknown as typeof fetch;
const good = JSON.stringify({ items: [{ id: 'a', date: '2026-11-26', title: '제목', body: '본문' }] });

describe('fetchNews', () => {
  it('정상 응답이면 걸러 낸 공지 목록을 돌려준다', async () => {
    const items = await fetchNews(ok(good));
    expect(items?.map((i) => i.id)).toEqual(['a']);
  });

  it('실패(오류 상태·네트워크 오류·JSON 아님·너무 큼)는 null 이라 조용히 넘어간다', async () => {
    expect(await fetchNews(ok('nope', 404))).toBeNull();
    expect(await fetchNews(ok('not json'))).toBeNull();
    expect(await fetchNews(ok('x'.repeat(70_000)))).toBeNull();
    expect(
      await fetchNews((async () => {
        throw new Error('offline');
      }) as unknown as typeof fetch),
    ).toBeNull();
  });

  it('응답이 이상한 모양이면 빈 목록이다', async () => {
    expect(await fetchNews(ok('{"items":"x"}'))).toEqual([]);
  });
});

describe('본 공지 저장', () => {
  const dirs: string[] = [];
  const tmp = () => {
    const d = fs.mkdtempSync(path.join(os.tmpdir(), 'news-'));
    dirs.push(d);
    return path.join(d, 'sub', 'news.json');
  };
  afterEach(() => dirs.splice(0).forEach((d) => fs.rmSync(d, { recursive: true, force: true })));

  it('파일이 없으면 처음 실행이다', () => {
    expect(loadSeen(tmp())).toEqual({ seen: [], firstRun: true });
  });

  it('저장하고 다시 읽으면 처음 실행이 아니다', () => {
    const f = tmp();
    saveSeen(f, ['a', 'b']);
    expect(loadSeen(f)).toEqual({ seen: ['a', 'b'], firstRun: false });
  });

  it('파일이 깨졌으면 빈 목록이되 처음 실행으로 보지 않는다(공지를 쏟아 내지 않게)', () => {
    const f = tmp();
    fs.mkdirSync(path.dirname(f), { recursive: true });
    fs.writeFileSync(f, '{broken');
    expect(loadSeen(f)).toEqual({ seen: [], firstRun: false });
  });
});

import { describe, expect, it } from 'vitest';
import type { PageSnapshot } from './collector.js';
import { SNAPSHOT_TTL_MS, SnapshotFeed, cleanSnapshot, mergeScans } from './feed.js';
import type { ScanResult } from './scan.js';

const snap = (over: Partial<PageSnapshot> = {}): PageSnapshot => ({
  url: 'http://localhost:5173/dash?x=1#top',
  title: '대시보드',
  visible: true,
  screenX: 100,
  screenY: 50,
  outerWidth: 1216,
  outerHeight: 808,
  innerWidth: 1200,
  innerHeight: 700,
  findings: [{ ruleId: 'img-alt', selector: 'body > img', rect: { x: 20, y: 30, w: 100, h: 60 }, detail: '/a.png' }],
  ...over,
});

describe('cleanSnapshot (확장이 보낸 값을 의심한다)', () => {
  it('정상 스냅샷은 그대로 받는다', () => {
    expect(cleanSnapshot(snap())).toEqual(snap());
  });

  it('localhost 계열이 아닌 주소는 거절한다(다른 사이트 정보를 받지 않는다)', () => {
    expect(cleanSnapshot(snap({ url: 'https://bank.example.com/account' }))).toBeNull();
    expect(cleanSnapshot(snap({ url: 'http://localhost.evil.com/' }))).toBeNull();
    expect(cleanSnapshot(snap({ url: 'javascript:alert(1)' }))).toBeNull();
  });

  it('*.localhost 와 127.0.0.1 은 받는다', () => {
    expect(cleanSnapshot(snap({ url: 'http://app.localhost:3000/' }))).not.toBeNull();
    expect(cleanSnapshot(snap({ url: 'http://127.0.0.1:8080/' }))).not.toBeNull();
  });

  it('형식이 틀린 값은 거절한다', () => {
    expect(cleanSnapshot(null)).toBeNull();
    expect(cleanSnapshot('x')).toBeNull();
    expect(cleanSnapshot({ ...snap(), innerWidth: 'wide' })).toBeNull();
    expect(cleanSnapshot({ ...snap(), screenX: Number.NaN })).toBeNull();
    expect(cleanSnapshot({ ...snap(), findings: 'many' })).toBeNull();
  });

  it('모르는 규칙·깨진 문제 항목은 버리고 나머지만 받는다', () => {
    const raw = {
      ...snap(),
      findings: [
        { ruleId: 'img-alt', selector: 'a', rect: null, detail: '' },
        { ruleId: 'hack', selector: 'b', rect: null, detail: '' },
        'text',
        { ruleId: 'contrast', selector: 'c', rect: { x: 'no' }, detail: 'd' },
      ],
    };
    const out = cleanSnapshot(raw);
    expect(out?.findings.map((f) => f.ruleId)).toEqual(['img-alt', 'contrast']);
    expect(out?.findings[1]?.rect).toBeNull();
  });

  it('너무 많은 문제와 너무 긴 글은 잘라 낸다', () => {
    const many = Array.from({ length: 500 }, () => ({ ruleId: 'img-alt', selector: 'x'.repeat(5000), rect: null, detail: 'y'.repeat(5000) }));
    const out = cleanSnapshot({ ...snap(), findings: many });
    expect(out?.findings.length).toBe(60);
    expect(out?.findings[0]?.selector.length).toBe(300);
    expect(out?.findings[0]?.detail.length).toBe(300);
  });

  it('visible 은 정확히 true 일 때만 보이는 것으로 본다', () => {
    expect(cleanSnapshot({ ...snap(), visible: 'true' })?.visible).toBe(false);
  });
});

describe('SnapshotFeed', () => {
  it('받은 스냅샷을 화면 좌표가 붙은 검사 결과로 바꾼다', () => {
    const feed = new SnapshotFeed();
    expect(feed.ingest(snap(), 1000)).toBe(true);
    const r = feed.scan(2000);
    expect(r.reachable).toBe(true);
    expect(r.scannedUrls).toEqual(['http://localhost:5173/dash']);
    expect(r.findings).toHaveLength(1);
    expect(r.findings[0]?.rect).toEqual({ x: 128, y: 180, width: 100, height: 60 }); // x 100+8, y 50+(108-8)+30
  });

  it('아무것도 받지 못했거나 오래됐으면 연결 안 됨이다', () => {
    const feed = new SnapshotFeed();
    expect(feed.scan(0)).toEqual({ reachable: false, scannedUrls: [], findings: [] });
    feed.ingest(snap(), 0);
    expect(feed.scan(SNAPSHOT_TTL_MS).reachable).toBe(true);
    expect(feed.scan(SNAPSHOT_TTL_MS + 1).reachable).toBe(false);
  });

  it('닫힌 탭(더는 오지 않는 페이지)은 사라진다', () => {
    const feed = new SnapshotFeed();
    feed.ingest(snap({ url: 'http://localhost:3000/a' }), 0);
    feed.ingest(snap({ url: 'http://localhost:3000/b' }), 10_000);
    expect(feed.scan(20_000).scannedUrls).toEqual(['http://localhost:3000/b']);
  });

  it('같은 페이지를 다시 받으면 최신 내용으로 바뀐다(고친 문제가 사라진다)', () => {
    const feed = new SnapshotFeed();
    feed.ingest(snap(), 0);
    feed.ingest(snap({ findings: [] }), 4000);
    expect(feed.scan(5000).findings).toEqual([]);
  });

  it('보이지 않는 탭은 연결은 된 것이지만 검사 대상·문제에서 뺀다', () => {
    const feed = new SnapshotFeed();
    feed.ingest(snap({ visible: false }), 0);
    const r = feed.scan(1);
    expect(r.reachable).toBe(true);
    expect(r.scannedUrls).toEqual([]);
    expect(r.findings).toEqual([]);
  });

  it('잘못된 값은 받지 않는다', () => {
    const feed = new SnapshotFeed();
    expect(feed.ingest({ url: 'https://evil.com' }, 0)).toBe(false);
    expect(feed.scan(1).reachable).toBe(false);
  });

  it('보관하는 페이지 수에 상한이 있다', () => {
    const feed = new SnapshotFeed();
    for (let i = 0; i < 100; i++) feed.ingest(snap({ url: 'http://localhost:3000/p' + i }), i);
    expect(feed.scan(100).scannedUrls.length).toBe(30);
  });
});

describe('mergeScans', () => {
  const f = (key: string) => ({ key, ruleId: 'img-alt' as const, url: 'u', selector: 's', detail: '', rect: null, page: { x: 0, y: 0, width: 1, height: 1 } });
  const scan = (reachable: boolean, urls: string[], keys: string[]): ScanResult => ({ reachable, scannedUrls: urls, findings: keys.map(f) });

  it('연결은 하나라도 됐으면 연결됨이고, 주소는 합치고, 같은 문제는 한 번만 센다', () => {
    expect(mergeScans(scan(false, [], []), scan(true, ['a', 'b'], ['k1', 'k2'])).reachable).toBe(true);
    const both = mergeScans(scan(true, ['a'], ['k1']), scan(true, ['a', 'b'], ['k1', 'k2']));
    expect(both.scannedUrls).toEqual(['a', 'b']);
    expect(both.findings.map((x) => x.key)).toEqual(['k1', 'k2']);
  });

  it('둘 다 연결이 안 되면 연결 안 됨이다', () => {
    expect(mergeScans(scan(false, [], []), scan(false, [], [])).reachable).toBe(false);
  });
});

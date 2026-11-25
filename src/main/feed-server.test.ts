import net from 'node:net';
import { afterEach, describe, expect, it } from 'vitest';
import { SnapshotFeed } from '../inspect/feed.js';
import { isExtensionOrigin, isLocalHostHeader, startFeedServer, type FeedServer } from './feed-server.js';

const EXT = 'chrome-extension://abcdefghijklmnopabcdefghijklmnop';

const snapshot = {
  url: 'http://localhost:5173/',
  title: 't',
  visible: true,
  screenX: 0,
  screenY: 0,
  outerWidth: 1000,
  outerHeight: 800,
  innerWidth: 1000,
  innerHeight: 700,
  findings: [{ ruleId: 'html-lang', selector: 'document', rect: null, detail: '<html lang> 없음' }],
};

function freePort(): Promise<number> {
  return new Promise((resolve) => {
    const s = net.createServer();
    s.listen(0, '127.0.0.1', () => {
      const { port } = s.address() as net.AddressInfo;
      s.close(() => resolve(port));
    });
  });
}

let server: FeedServer | null = null;
afterEach(() => {
  server?.close();
  server = null;
});

async function start() {
  const feed = new SnapshotFeed();
  const port = await freePort();
  server = await startFeedServer(feed, port, () => 1000);
  const url = 'http://127.0.0.1:' + port;
  const post = (body: unknown, headers: Record<string, string> = { origin: EXT }) =>
    fetch(url + '/snapshot', {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...headers },
      body: typeof body === 'string' ? body : JSON.stringify(body),
    });
  return { feed, port, url, post };
}

describe('origin·host 판별', () => {
  it('브라우저 확장 Origin 만 받는다', () => {
    expect(isExtensionOrigin(EXT)).toBe(true);
    expect(isExtensionOrigin('http://localhost:3000')).toBe(false);
    expect(isExtensionOrigin('https://evil.com')).toBe(false);
    expect(isExtensionOrigin('chrome-extension://abc/evil')).toBe(false);
    expect(isExtensionOrigin(undefined)).toBe(false);
  });

  it('Host 헤더는 로컬 주소와 이 포트만 받는다', () => {
    expect(isLocalHostHeader('127.0.0.1:47831', 47831)).toBe(true);
    expect(isLocalHostHeader('localhost:47831', 47831)).toBe(true);
    expect(isLocalHostHeader('evil.com:47831', 47831)).toBe(false);
    expect(isLocalHostHeader('127.0.0.1:1', 47831)).toBe(false);
    expect(isLocalHostHeader(undefined, 47831)).toBe(false);
  });
});

describe('확장 수신 서버', () => {
  it('확장이 보낸 스냅샷을 받아서 피드에 쌓는다', async () => {
    const { feed, post } = await start();
    const res = await post(snapshot);
    expect(res.status).toBe(200);
    expect(feed.scan(1000).findings.map((f) => f.ruleId)).toEqual(['html-lang']);
  });

  it('일반 웹페이지(Origin 이 http)의 요청은 거절한다', async () => {
    const { feed, post } = await start();
    expect((await post(snapshot, { origin: 'https://evil.com' })).status).toBe(403);
    expect((await post(snapshot, {})).status).toBe(403);
    expect(feed.scan(1000).reachable).toBe(false);
  });

  it('로컬 주소가 아닌 페이지 정보나 깨진 값은 400 으로 거절한다', async () => {
    const { feed, post } = await start();
    expect((await post({ ...snapshot, url: 'https://bank.com/' })).status).toBe(400);
    expect((await post('not json')).status).toBe(400);
    expect(feed.scan(1000).reachable).toBe(false);
  });

  it('1MB 를 넘는 본문은 받지 않는다', async () => {
    const { feed, post } = await start();
    const big = JSON.stringify({ ...snapshot, title: 'x'.repeat(1024 * 1024 + 10) });
    const res = await post(big).catch(() => null); // 서버가 연결을 끊으면 fetch 가 실패할 수도 있다
    if (res) expect(res.status).toBe(413);
    expect(feed.scan(1000).reachable).toBe(false);
  });

  it('/ping 은 고정된 한 줄만 돌려주고, 다른 경로는 열어 주지 않는다', async () => {
    const { url } = await start();
    const ping = await fetch(url + '/ping');
    expect(await ping.json()).toEqual({ ok: true, app: 'desktop-tamagotchi' });
    const other = await fetch(url + '/snapshot', { headers: { origin: EXT } });
    expect(other.status).toBe(404);
    const noOrigin = await fetch(url + '/anything');
    expect(noOrigin.status).toBe(403);
  });

  it('확장의 사전 요청(OPTIONS)에는 그 확장 Origin 만 허용한다', async () => {
    const { url } = await start();
    const res = await fetch(url + '/snapshot', { method: 'OPTIONS', headers: { origin: EXT } });
    expect(res.status).toBe(204);
    expect(res.headers.get('access-control-allow-origin')).toBe(EXT);
    const web = await fetch(url + '/snapshot', { method: 'OPTIONS', headers: { origin: 'https://evil.com' } });
    expect(web.status).toBe(403);
    expect(web.headers.get('access-control-allow-origin')).toBeNull();
  });

  it('포트가 이미 쓰이고 있어도 앱이 죽지 않고 null 을 돌려준다', async () => {
    const port = await freePort();
    const a = await startFeedServer(new SnapshotFeed(), port);
    let message = '';
    const b = await startFeedServer(new SnapshotFeed(), port, Date.now, (e) => (message = e.message));
    expect(a).not.toBeNull();
    expect(b).toBeNull();
    expect(message).not.toBe('');
    a?.close();
  });
});

/**
 * 확장이 검사 결과를 보내는 작은 로컬 서버. Electron 에 의존하지 않는다.
 *
 * 안전 장치(웹페이지가 이 서버로 가짜 값을 보내거나 읽어 가지 못하게):
 *  - 127.0.0.1 에만 열고, Host 헤더도 로컬 주소여야 한다(DNS 리바인딩 방지).
 *  - 받는 쪽은 Origin 이 브라우저 확장(chrome-extension://)인 요청만 받는다. 일반 웹페이지의 요청은 거절한다.
 *  - 본문은 1MB 까지만, 받은 값은 SnapshotFeed 가 다시 검증한다.
 *  - 읽기 전용 /ping 외에는 아무것도 돌려주지 않는다(검사 결과·진행도를 내보내지 않는다).
 */
import http from 'node:http';
import type { SnapshotFeed } from '../inspect/feed.js';

export const FEED_PORT_DEFAULT = 47831;
const MAX_BODY = 1024 * 1024;

export function isExtensionOrigin(origin: string | undefined): boolean {
  return typeof origin === 'string' && /^(chrome|moz)-extension:\/\/[a-z0-9-]+$/i.test(origin);
}

export function isLocalHostHeader(host: string | undefined, port: number): boolean {
  return host === `127.0.0.1:${port}` || host === `localhost:${port}`;
}

export interface FeedServer {
  close(): void;
}

export function startFeedServer(
  feed: SnapshotFeed,
  port: number,
  now: () => number = Date.now,
  onError: (e: Error) => void = () => {},
): Promise<FeedServer | null> {
  const server = http.createServer((req, res) => {
    const origin = req.headers.origin;
    const send = (status: number, body = ''): void => {
      const headers: Record<string, string> = { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' };
      if (isExtensionOrigin(origin)) {
        headers['access-control-allow-origin'] = origin as string;
        headers['access-control-allow-headers'] = 'content-type';
        headers['access-control-allow-methods'] = 'POST, GET, OPTIONS';
      }
      res.writeHead(status, headers);
      res.end(body);
    };

    if (!isLocalHostHeader(req.headers.host, port)) return send(403, '{"error":"host"}');
    // /ping 은 확장이 연결 상태를 확인하는 용도라 Origin 이 없어도(주소창 확인) 답하지만, 내용은 고정된 한 줄뿐이다.
    if (req.method === 'GET' && req.url === '/ping') return send(200, '{"ok":true,"app":"desktop-tamagotchi"}');
    if (!isExtensionOrigin(origin)) return send(403, '{"error":"origin"}');
    if (req.method === 'OPTIONS') return send(204);
    if (req.method !== 'POST' || req.url !== '/snapshot') return send(404, '{"error":"not found"}');

    const chunks: Buffer[] = [];
    let size = 0;
    let rejected = false;
    req.on('data', (c: Buffer) => {
      size += c.length;
      if (size > MAX_BODY) {
        rejected = true;
        send(413, '{"error":"too large"}');
        req.destroy();
        return;
      }
      chunks.push(c);
    });
    req.on('end', () => {
      if (rejected) return;
      try {
        const ok = feed.ingest(JSON.parse(Buffer.concat(chunks).toString('utf8')), now());
        send(ok ? 200 : 400, ok ? '{"ok":true}' : '{"error":"rejected"}');
      } catch {
        send(400, '{"error":"json"}');
      }
    });
  });

  return new Promise((resolve) => {
    server.once('error', (e: Error) => {
      onError(e);
      resolve(null); // 포트가 이미 쓰이고 있어도 앱은 계속 뜬다(디버그 포트 검사는 그대로 쓸 수 있다).
    });
    server.listen(port, '127.0.0.1', () => resolve({ close: () => server.close() }));
  });
}

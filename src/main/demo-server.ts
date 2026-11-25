/**
 * 검사를 체험해 볼 수 있는 작은 서버: 시험 페이지(test-pages)를 http://localhost:포트 로 보여 준다.
 * 이 PC 안(127.0.0.1)에서만 열리고, test-pages 폴더 밖의 파일은 절대 내주지 않는다.
 */
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';

const TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
};

/** 요청 경로를 root 안의 파일 경로로 바꾼다. root 밖으로 나가는 경로면 null. */
export function resolveDemoFile(root: string, pathname: string): string | null {
  const name = pathname === '/' ? 'sample.html' : pathname.replace(/^\/+/, '');
  const base = path.resolve(root);
  const file = path.resolve(base, name);
  return file.startsWith(base + path.sep) ? file : null;
}

export interface DemoServer {
  port: number;
  url: string;
  close(): Promise<void>;
}

/** port 가 0 이면 비어 있는 포트를 골라 쓴다(테스트용). */
export function startDemoServer(root: string, port: number): Promise<DemoServer> {
  const server = http.createServer((req, res) => {
    let pathname: string;
    try {
      pathname = decodeURIComponent(new URL(req.url ?? '/', 'http://localhost').pathname);
    } catch {
      res.writeHead(400).end();
      return;
    }
    const file = resolveDemoFile(root, pathname);
    if (!file || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
      res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
      res.end('없는 페이지');
      return;
    }
    res.writeHead(200, {
      'content-type': TYPES[path.extname(file)] ?? 'application/octet-stream',
      'cache-control': 'no-store',
    });
    fs.createReadStream(file).pipe(res);
  });

  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, '127.0.0.1', () => {
      const actual = (server.address() as { port: number }).port;
      resolve({
        port: actual,
        url: `http://localhost:${actual}/`,
        close: () => new Promise<void>((done) => server.close(() => done())),
      });
    });
  });
}

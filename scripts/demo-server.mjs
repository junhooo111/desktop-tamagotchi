// 펫 검사를 시험해 볼 수 있는 작은 서버. test-pages 폴더를 http://localhost:5199 로 보여 준다.
// 사용: npm run demo   (종료: Ctrl+C)
// test-pages/sample.html 을 고치고 새로고침하면, 고친 문제는 펫이 "고쳤네요!" 하고 보상한다.
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'test-pages');
const port = Number(process.env.PET_DEMO_PORT ?? 5199);

const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml' };

const server = http.createServer((req, res) => {
  const pathname = decodeURIComponent(new URL(req.url ?? '/', 'http://localhost').pathname);
  const name = pathname === '/' ? 'sample.html' : pathname.slice(1);
  const file = path.join(root, name);
  // test-pages 밖으로 나가는 경로는 막는다.
  if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
    res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    res.end('없는 페이지');
    return;
  }
  res.writeHead(200, { 'content-type': types[path.extname(file)] ?? 'application/octet-stream', 'cache-control': 'no-store' });
  fs.createReadStream(file).pipe(res);
});

server.listen(port, '127.0.0.1', () => {
  console.log(`시험 페이지: http://localhost:${port}/  (test-pages/sample.html)`);
});

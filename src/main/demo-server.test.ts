import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { resolveDemoFile, startDemoServer, type DemoServer } from './demo-server.js';

let root: string;
let outside: string;
let server: DemoServer;

beforeAll(async () => {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), 'pet-demo-'));
  root = path.join(base, 'pages');
  fs.mkdirSync(root);
  fs.writeFileSync(path.join(root, 'sample.html'), '<h1>샘플</h1>');
  fs.writeFileSync(path.join(root, 'style.css'), 'body{}');
  outside = path.join(base, 'secret.txt');
  fs.writeFileSync(outside, '비밀');
  server = await startDemoServer(root, 0);
});

afterAll(async () => {
  await server.close();
  fs.rmSync(path.dirname(root), { recursive: true, force: true });
});

describe('resolveDemoFile', () => {
  it('/ 는 sample.html 로, 나머지는 root 안의 파일로 바꾼다', () => {
    expect(resolveDemoFile(root, '/')).toBe(path.join(root, 'sample.html'));
    expect(resolveDemoFile(root, '/style.css')).toBe(path.join(root, 'style.css'));
  });

  it('root 밖으로 나가는 경로는 거부한다', () => {
    expect(resolveDemoFile(root, '/../secret.txt')).toBeNull();
    expect(resolveDemoFile(root, '/a/../../secret.txt')).toBeNull();
    expect(resolveDemoFile(root, '//../secret.txt')).toBeNull();
  });
});

describe('startDemoServer', () => {
  it('시험 페이지를 localhost 로 내주고 캐시하지 않는다', async () => {
    const res = await fetch(server.url);
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('text/html');
    expect(res.headers.get('cache-control')).toBe('no-store');
    expect(await res.text()).toBe('<h1>샘플</h1>');
    expect(server.url).toMatch(/^http:\/\/localhost:\d+\/$/);
  });

  it('종류에 맞는 content-type 을 준다', async () => {
    expect((await fetch(`${server.url}style.css`)).headers.get('content-type')).toContain('text/css');
  });

  it('없는 파일은 404, root 밖의 파일은 내주지 않는다', async () => {
    expect((await fetch(`${server.url}none.html`)).status).toBe(404);
    const escaped = await fetch(`${server.url}..%2Fsecret.txt`);
    expect(escaped.status).toBe(404);
    expect(await escaped.text()).not.toContain('비밀');
  });

  it('이미 쓰는 포트에서는 시작에 실패한다', async () => {
    await expect(startDemoServer(root, server.port)).rejects.toThrow();
  });
});

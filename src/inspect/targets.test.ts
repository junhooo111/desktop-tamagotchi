import { describe, expect, it } from 'vitest';
import { isLocalHost, isLocalUrl, normalizeUrl, pickPageTargets, type CdpTarget } from './targets.js';

const target = (over: Partial<CdpTarget> = {}): CdpTarget => ({
  id: '1',
  type: 'page',
  title: 't',
  url: 'http://localhost:5173/',
  webSocketDebuggerUrl: 'ws://127.0.0.1:9222/devtools/page/1',
  ...over,
});

describe('isLocalUrl', () => {
  it.each([
    'http://localhost:3000/',
    'https://localhost/app',
    'http://127.0.0.1:8080/x?y=1',
    'http://[::1]:5173/',
    'http://my-app.localhost:3000/',
  ])('%s 는 로컬이다', (url) => {
    expect(isLocalUrl(url)).toBe(true);
  });

  it.each([
    'https://example.com/',
    'http://localhost.evil.com/',
    'http://192.168.0.10:3000/',
    'file:///C:/x.html',
    'chrome://settings',
    'about:blank',
    'not a url',
    '',
  ])('%s 는 로컬이 아니다', (url) => {
    expect(isLocalUrl(url)).toBe(false);
  });

  it('호스트 이름만 따로 판정할 수도 있다', () => {
    expect(isLocalHost('localhost')).toBe(true);
    expect(isLocalHost('example.com')).toBe(false);
  });
});

describe('pickPageTargets', () => {
  it('로컬 페이지 탭만 고르고 확장 프로그램·워커·외부 사이트는 제외한다', () => {
    const list = [
      target({ id: 'a' }),
      target({ id: 'b', url: 'https://mail.example.com/' }),
      target({ id: 'c', type: 'service_worker' }),
      target({ id: 'd', url: 'chrome-extension://abc/popup.html' }),
      target({ id: 'e', webSocketDebuggerUrl: undefined }),
      target({ id: 'f', url: 'http://127.0.0.1:4000/' }),
    ];
    expect(pickPageTargets(list).map((t) => t.id)).toEqual(['a', 'f']);
  });
});

describe('normalizeUrl', () => {
  it('해시와 쿼리를 뺀다', () => {
    expect(normalizeUrl('http://localhost:3000/a/b?x=1#top')).toBe('http://localhost:3000/a/b');
    expect(normalizeUrl('garbage')).toBe('garbage');
  });
});

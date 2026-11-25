import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { browserCandidates, debugProfileDir, findBrowser, launchArgs } from './browser.js';

const env = {
  ProgramFiles: 'C:\\Program Files',
  'ProgramFiles(x86)': 'C:\\Program Files (x86)',
  LOCALAPPDATA: 'C:\\Users\\me\\AppData\\Local',
};

describe('browserCandidates', () => {
  it('크롬 세 곳을 먼저, 엣지 두 곳을 그다음에 찾아본다', () => {
    const list = browserCandidates(env).map((p) => p.replaceAll('\\', '/'));
    expect(list).toEqual([
      'C:/Program Files/Google/Chrome/Application/chrome.exe',
      'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
      'C:/Users/me/AppData/Local/Google/Chrome/Application/chrome.exe',
      'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
      'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
    ]);
  });

  it('환경 변수가 없는 위치는 건너뛴다', () => {
    expect(browserCandidates({})).toEqual([]);
    expect(browserCandidates({ LOCALAPPDATA: 'C:\\L' })).toHaveLength(1);
  });
});

describe('findBrowser', () => {
  it('설치된 첫 번째 브라우저를 돌려주고, 크롬이 없으면 엣지를 쓴다', () => {
    const edgeOnly = (p: string) => p.includes('msedge');
    expect(findBrowser(env, edgeOnly)).toMatch(/msedge\.exe$/);
    const both = () => true;
    expect(findBrowser(env, both)).toMatch(/chrome\.exe$/);
  });

  it('아무것도 없으면 null', () => {
    expect(findBrowser(env, () => false)).toBeNull();
  });
});

describe('debugProfileDir / launchArgs', () => {
  it('프로필은 평소 프로필과 분리된 앱 전용 폴더다', () => {
    expect(debugProfileDir(env)).toBe(path.join('C:\\Users\\me\\AppData\\Local', 'desktop-tamagotchi', 'browser-profile'));
    expect(debugProfileDir({}, '/tmp')).toBe(path.join('/tmp', 'desktop-tamagotchi', 'browser-profile'));
  });

  it('디버그 포트와 분리된 프로필, 열 주소를 인자로 만든다', () => {
    expect(launchArgs({ port: 9222, profile: 'P', url: 'http://localhost:5173/' })).toEqual([
      '--remote-debugging-port=9222',
      '--user-data-dir=P',
      '--no-first-run',
      '--no-default-browser-check',
      'http://localhost:5173/',
    ]);
  });
});

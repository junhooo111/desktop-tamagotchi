/**
 * 검사용 브라우저(원격 디버깅 포트가 열린 별도 프로필의 크롬/엣지)를 찾고 실행 인자를 만든다.
 * Electron 에 의존하지 않아서 개발용 스크립트(npm run chrome)와 앱 메뉴가 같은 코드를 쓴다.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export interface BrowserEnv {
  ProgramFiles?: string;
  'ProgramFiles(x86)'?: string;
  LOCALAPPDATA?: string;
}

/** 찾아볼 설치 위치: 크롬 → 엣지 순서 */
export function browserCandidates(env: BrowserEnv): string[] {
  const chrome = ['Google', 'Chrome', 'Application', 'chrome.exe'];
  const edge = ['Microsoft', 'Edge', 'Application', 'msedge.exe'];
  const roots: [string | undefined, string[]][] = [
    [env.ProgramFiles, chrome],
    [env['ProgramFiles(x86)'], chrome],
    [env.LOCALAPPDATA, chrome],
    [env['ProgramFiles(x86)'], edge],
    [env.ProgramFiles, edge],
  ];
  return roots.filter(([root]) => !!root).map(([root, parts]) => path.join(root as string, ...parts));
}

/** 설치된 브라우저 중 첫 번째. 없으면 null. */
export function findBrowser(env: BrowserEnv, exists: (p: string) => boolean = fs.existsSync): string | null {
  return browserCandidates(env).find((p) => exists(p)) ?? null;
}

/**
 * 검사용 브라우저의 프로필 폴더. 평소 쓰는 프로필과 분리된 새 프로필이라 로그인 정보가 없다.
 * (최신 크롬은 기본 프로필에서 디버그 포트를 열 수 없기도 하다.)
 */
export function debugProfileDir(env: BrowserEnv, tmp: string = os.tmpdir()): string {
  return path.join(env.LOCALAPPDATA ?? tmp, 'desktop-tamagotchi', 'browser-profile');
}

export function launchArgs(opts: { port: number; profile: string; url: string }): string[] {
  return [
    `--remote-debugging-port=${opts.port}`,
    `--user-data-dir=${opts.profile}`,
    '--no-first-run',
    '--no-default-browser-check',
    opts.url,
  ];
}

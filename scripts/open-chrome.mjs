// 펫이 페이지를 검사할 수 있도록, 원격 디버깅 포트가 열린 별도 프로필의 브라우저를 띄운다.
// 사용: npm run chrome [열 주소]
//
// - 평소 쓰는 프로필과 분리된 새 프로필이라 로그인 정보·쿠키가 없다(최신 크롬은 기본 프로필에서 디버그 포트를 열 수 없다).
// - 펫은 이 포트로 localhost 계열 탭만 읽는다. 다른 사이트 탭에는 연결하지 않는다.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const port = process.env.PET_CDP_PORT ?? '9222';
const url = process.argv[2] ?? 'http://localhost:5199/';

const env = process.env;
const candidates = [
  [env['ProgramFiles'], 'Google', 'Chrome', 'Application', 'chrome.exe'],
  [env['ProgramFiles(x86)'], 'Google', 'Chrome', 'Application', 'chrome.exe'],
  [env['LOCALAPPDATA'], 'Google', 'Chrome', 'Application', 'chrome.exe'],
  [env['ProgramFiles(x86)'], 'Microsoft', 'Edge', 'Application', 'msedge.exe'],
  [env['ProgramFiles'], 'Microsoft', 'Edge', 'Application', 'msedge.exe'],
]
  .filter(([root]) => root)
  .map((parts) => path.join(...parts));

const exe = candidates.find((p) => fs.existsSync(p));
if (!exe) {
  console.error('크롬 또는 엣지를 찾지 못했습니다. 아래 위치를 확인했습니다.');
  for (const c of candidates) console.error(`  ${c}`);
  process.exit(1);
}

const profile = path.join(env['LOCALAPPDATA'] ?? os.tmpdir(), 'desktop-tamagotchi', 'browser-profile');
fs.mkdirSync(profile, { recursive: true });

spawn(
  exe,
  [
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profile}`,
    '--no-first-run',
    '--no-default-browser-check',
    url,
  ],
  { detached: true, stdio: 'ignore' },
).unref();

console.log(`브라우저를 열었습니다: ${path.basename(exe)} (디버그 포트 ${port}, 별도 프로필)`);
console.log(`열린 주소: ${url}`);

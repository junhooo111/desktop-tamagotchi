// 브라우저 확장의 content.js 를 만든다.
// 앱이 크롬 디버그 포트로 주입하던 검사 수집기(collectPage)를 그대로 복사해 넣어서, 앱과 확장이 같은 규칙으로 검사한다.
// 사용: npm run build:extension   (dist 가 먼저 빌드돼 있어야 한다. npm run build 가 이 스크립트를 이어서 부른다)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const { collectPage } = await import(pathToFileURL(path.join(root, 'dist', 'inspect', 'collector.js')).href);

const source = `// 자동 생성 파일 — 직접 고치지 마세요. 원본: src/inspect/collector.ts, 생성: scripts/build-extension.mjs
(() => {
  const collectPage = ${collectPage.toString()};

  const EVERY_MS = 4000;

  function send() {
    // 보이는 탭만 검사한다(안 보이는 탭은 화면 좌표를 쓸 수 없다).
    if (document.visibilityState !== 'visible') return;
    try {
      const snapshot = collectPage({ requireLayout: true });
      const sent = chrome.runtime.sendMessage({ type: 'snapshot', snapshot });
      if (sent && sent.catch) sent.catch(() => {});
    } catch {
      // 확장을 다시 불러온 직후처럼 연결이 끊겼으면 이 페이지는 새로고침 전까지 조용히 멈춘다.
    }
  }

  send();
  const timer = setInterval(send, EVERY_MS);
  document.addEventListener('visibilitychange', send);
  window.addEventListener('pagehide', () => clearInterval(timer));
})();
`;

fs.writeFileSync(path.join(root, 'extension', 'content.js'), source);
console.log('확장 content.js 를 만들었습니다.');

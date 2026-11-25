// 펫 검사를 시험해 볼 수 있는 작은 서버. test-pages 폴더를 http://localhost:5199 로 보여 준다.
// 사용: npm run demo   (종료: Ctrl+C)      (앱 메뉴의 "검사 체험"과 같은 코드를 쓴다)
// test-pages/sample.html 을 고치고 새로고침하면, 고친 문제는 펫이 "고쳤네요!" 하고 보상한다.
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const { startDemoServer } = await import(pathToFileURL(path.join(root, 'dist', 'main', 'demo-server.js')).href);

const port = Number(process.env.PET_DEMO_PORT ?? 5199);
const server = await startDemoServer(path.join(root, 'test-pages'), port);
console.log(`시험 페이지: ${server.url}  (test-pages/sample.html)`);

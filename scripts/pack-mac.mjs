// macOS 배포 zip(Intel·Apple Silicon)을 Windows 에서 만든다. electron-builder 는 macOS 에서만 mac 빌드가 되므로,
// 공식 Electron macOS zip 에 우리 앱을 넣어 새 zip 으로 묶는다(scripts/mac-zip.py). 서명·공증은 없고, 동작은 맥에서 확인하지 못한다.
// Python 3 가 필요하다. `python` 이 Microsoft Store 껍데기이면 환경 변수 PYTHON 에 실제 python.exe 경로를 준다.
// 사용: npm run pack:mac   →   release-mac/Desktop-Tamagotchi-<버전>-mac-<arch>.zip
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';

const require = createRequire(import.meta.url);
const root = process.cwd();
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const electronVersion = require('electron/package.json').version;
const { downloadArtifact } = require('@electron/get');

const work = path.join(root, '.mac-build');
const appDir = path.join(work, 'app');
const outDir = path.join(root, 'release-mac');
fs.rmSync(work, { recursive: true, force: true });
fs.mkdirSync(appDir, { recursive: true });
fs.mkdirSync(outDir, { recursive: true });

// 1) 앱 파일: 빌드 결과·정적 파일·테스트 페이지·package.json, 그리고 실행에 필요한 패키지(devDependencies 제외)
for (const entry of ['dist', 'static', 'test-pages']) fs.cpSync(path.join(root, entry), path.join(appDir, entry), { recursive: true });
fs.rmSync(path.join(appDir, 'dist', 'shared', 'art', 'dev-preview.js'), { force: true });
fs.copyFileSync(path.join(root, 'package.json'), path.join(appDir, 'package.json'));
fs.copyFileSync(path.join(root, 'package-lock.json'), path.join(appDir, 'package-lock.json'));
console.log('실행용 패키지를 설치합니다…');
execFileSync('npm', ['ci', '--omit=dev', '--ignore-scripts', '--no-audit', '--no-fund'], { cwd: appDir, stdio: 'inherit', shell: true });
fs.rmSync(path.join(appDir, 'package-lock.json'), { force: true });

// 2) 아키텍처별로 공식 Electron macOS zip 을 받아 우리 앱을 넣는다
const files = [];
for (const arch of ['x64', 'arm64']) {
  const zip = await downloadArtifact({ version: electronVersion, platform: 'darwin', arch, artifactName: 'electron' });
  const out = path.join(outDir, `Desktop-Tamagotchi-${pkg.version}-mac-${arch}.zip`);
  execFileSync(process.env['PYTHON'] ?? 'python', [path.join(root, 'scripts', 'mac-zip.py'), zip, appDir, path.join(root, 'extension'), out, pkg.version], { stdio: 'inherit' });
  const bytes = fs.readFileSync(out);
  files.push({ arch, name: path.basename(out), sha512: createHash('sha512').update(bytes).digest('hex'), size: bytes.length });
}
// 3) 맥 자동 업데이트가 읽는 정보 파일(버전·해시). 릴리스에 zip 과 함께 올린다.
fs.writeFileSync(path.join(outDir, 'latest-mac.json'), JSON.stringify({ version: pkg.version, files }, null, 2) + '\n');
fs.rmSync(work, { recursive: true, force: true });
console.log(`완료: ${outDir}`);

// 지금 키우는 펫이 뛰어다니는 프로필 카드(움직이는 SVG)를 만든다. 앱을 켜 두지 않아도 저장된 상태(%APPDATA%\desktop-tamagotchi)를 읽는다.
// 사용: npm run card                 ./pet-card.svg 로 저장
//       npm run card -- <저장할 경로>   예) npm run card -- ..\junhooo111\assets\pet-card.svg
//
// GitHub 프로필 저장소(<아이디>/<아이디>)의 assets 폴더에 올리고 README 에 <img src="./assets/pet-card.svg"> 로 걸면 된다.
// 카드는 내보낸 순간의 모습이다. 자동으로 갱신되지 않으므로 바뀐 모습을 보이고 싶을 때 다시 내보낸다.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const load = (p) => import(pathToFileURL(path.join(root, 'dist', p)).href);
const { renderProfileCard } = await load('shared/card.js');
const { sanitizeSettings } = await load('shared/settings.js');

const dataDir = process.env.PET_DATA_DIR ?? path.join(process.env.APPDATA ?? path.join(os.homedir(), 'AppData', 'Roaming'), 'desktop-tamagotchi');
const read = (name) => {
  try {
    return JSON.parse(fs.readFileSync(path.join(dataDir, name), 'utf8'));
  } catch {
    return null;
  }
};

const pet = read('pet.json');
if (!pet) {
  console.error(`저장된 펫을 찾지 못했습니다: ${path.join(dataDir, 'pet.json')}\n앱을 한 번 실행해 펫을 만든 뒤 다시 시도하세요.`);
  process.exit(1);
}
const settings = sanitizeSettings(read('settings.json'));
const svg = renderProfileCard({ pet, style: { variant: settings.variant, accessory: settings.accessory } });

const out = path.resolve(process.argv[2] ?? 'pet-card.svg');
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, svg + '\n', 'utf8');
console.log(`프로필 카드를 저장했습니다: ${out} (${svg.length.toLocaleString()}자)`);

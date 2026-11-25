// 앱 아이콘(build/icon.png, build/icon.ico)을 펫 도트에서 만든다. 도트를 바꾸면 다시 실행한다.
// 사용: npm run icon   (먼저 빌드되어 있어야 한다)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { encodeIco, encodePng } from './lib/image.mjs';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const { spriteSet, frameToRgba } = await import(pathToFileURL(path.join(root, 'dist', 'shared', 'species.js')).href);

// 성체 병아리가 서 있는 모습. 그림은 32x32 칸이다.
const sprite = spriteSet('chick', 'adult');
const png = (scale) => {
  const { width, height, data } = frameToRgba(sprite.frames.idleA, sprite.palette, scale);
  return { size: width, png: encodePng(width, height, data) };
};

const out = path.join(root, 'build');
fs.mkdirSync(out, { recursive: true });

// 도트 한 칸을 정수 픽셀로 키워서 흐려지지 않게 한다: 8 → 256, 4 → 128, 2 → 64, 1 → 32
const sizes = [8, 4, 2, 1].map(png);
fs.writeFileSync(path.join(out, 'icon.ico'), encodeIco(sizes));
fs.writeFileSync(path.join(out, 'icon.png'), png(16).png); // 512x512 (electron-builder 의 기본 아이콘)
console.log('아이콘을 만들었습니다:', path.join(out, 'icon.ico'), '+ icon.png');

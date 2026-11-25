// 빌드 전에 dist 를 비운다. 지운 소스의 옛 컴파일 결과가 남아서 설치 파일에 같이 들어가는 것을 막는다.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dist = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist');
fs.rmSync(dist, { recursive: true, force: true });

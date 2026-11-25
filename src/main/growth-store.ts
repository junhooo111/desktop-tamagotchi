/** 성장 기록(스트릭·업적·도감)을 JSON 파일로 저장·복원한다. */
import fs from 'node:fs';
import path from 'node:path';
import { emptyGrowth, sanitizeGrowth, type Growth } from '../shared/growth.js';

/** 파일이 없거나 깨졌으면 빈 기록. 일부만 이상하면 그 항목만 버린다. */
export function loadGrowth(file: string): Growth {
  try {
    return sanitizeGrowth(JSON.parse(fs.readFileSync(file, 'utf8')));
  } catch {
    return emptyGrowth();
  }
}

/** 임시 파일에 쓴 뒤 바꿔치기해서, 쓰는 도중 꺼져도 파일이 깨지지 않게 한다. */
export function saveGrowth(file: string, growth: Growth): void {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = file + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(growth, null, 2), 'utf8');
  fs.renameSync(tmp, file);
}

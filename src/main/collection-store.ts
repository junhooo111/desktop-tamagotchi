/** 컬렉션(가진 동물·뽑기권)을 JSON 파일로 저장·복원한다. */
import fs from 'node:fs';
import path from 'node:path';
import { sanitizeCollection, type Collection } from '../shared/collection.js';
import { ACCESSORIES, VARIANTS } from '../shared/species.js';

/** 파일이 없거나 깨졌으면 null(호출한 쪽이 예전 저장에서 옮겨 온다). */
export function loadCollection(file: string): Collection | null {
  try {
    return sanitizeCollection(JSON.parse(fs.readFileSync(file, 'utf8')), ACCESSORIES, VARIANTS);
  } catch {
    return null;
  }
}

/** 임시 파일에 쓴 뒤 바꿔치기해서, 쓰는 도중 꺼져도 파일이 깨지지 않게 한다. */
export function saveCollection(file: string, collection: Collection): void {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = `${file}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(collection, null, 2), 'utf8');
  fs.renameSync(tmp, file);
}

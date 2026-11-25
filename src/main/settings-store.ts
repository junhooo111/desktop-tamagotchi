/** 설정을 JSON 파일로 저장·복원한다(store.ts 와 같은 방식). */
import fs from 'node:fs';
import path from 'node:path';
import { DEFAULT_SETTINGS, sanitizeSettings, type Settings } from '../shared/settings.js';

/** 파일이 없거나 깨졌으면 기본 설정. 일부만 깨졌으면 그 항목만 기본값으로 채운다. */
export function loadSettings(file: string): Settings {
  try {
    return sanitizeSettings(JSON.parse(fs.readFileSync(file, 'utf8')));
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

/** 임시 파일에 쓴 뒤 바꿔치기해서, 쓰는 도중 꺼져도 파일이 깨지지 않게 한다. */
export function saveSettings(file: string, settings: Settings): void {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = file + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(settings, null, 2), 'utf8');
  fs.renameSync(tmp, file);
}

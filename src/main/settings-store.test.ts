import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS } from '../shared/settings.js';
import { loadSettings, saveSettings } from './settings-store.js';

let dir = '';
beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pet-settings-'));
});
afterEach(() => {
  fs.rmSync(dir, { recursive: true, force: true });
});

describe('설정 저장·복원', () => {
  it('파일이 없으면 기본 설정이다', () => {
    expect(loadSettings(path.join(dir, 'none.json'))).toEqual(DEFAULT_SETTINGS);
  });

  it('저장한 설정을 그대로 불러온다', () => {
    const file = path.join(dir, 'settings.json');
    const s = { ...DEFAULT_SETTINGS, petScale: 3 as const, tipMinutes: 60 as const, inspectEnabled: false };
    saveSettings(file, s);
    expect(loadSettings(file)).toEqual(s);
  });

  it('깨진 파일이면 기본 설정이고, 일부만 이상하면 그 항목만 기본값이 된다', () => {
    const file = path.join(dir, 'settings.json');
    fs.writeFileSync(file, '{ not json');
    expect(loadSettings(file)).toEqual(DEFAULT_SETTINGS);
    fs.writeFileSync(file, JSON.stringify({ petScale: 2, scanSeconds: 7 }));
    expect(loadSettings(file)).toEqual({ ...DEFAULT_SETTINGS, petScale: 2 });
  });

  it('없는 폴더에도 저장하고 임시 파일을 남기지 않는다', () => {
    const file = path.join(dir, 'a', 'b', 'settings.json');
    saveSettings(file, DEFAULT_SETTINGS);
    expect(fs.existsSync(file)).toBe(true);
    expect(fs.existsSync(file + '.tmp')).toBe(false);
  });
});

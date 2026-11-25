import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { applyEvent, emptyGrowth } from '../shared/growth.js';
import { loadGrowth, saveGrowth } from './growth-store.js';

let dir = '';
beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pet-growth-'));
});
afterEach(() => {
  fs.rmSync(dir, { recursive: true, force: true });
});

describe('성장 기록 저장·복원', () => {
  it('파일이 없으면 빈 기록이다', () => {
    expect(loadGrowth(path.join(dir, 'none.json'))).toEqual(emptyGrowth());
  });

  it('저장한 기록(업적 포함)을 그대로 불러온다', () => {
    const file = path.join(dir, 'growth.json');
    const g = applyEvent(emptyGrowth(), { kind: 'confirm', ruleId: 'img-alt', correct: true }, new Date(2026, 10, 25, 12).getTime(), { tipsSeen: 0 }).growth;
    saveGrowth(file, g);
    expect(loadGrowth(file)).toEqual(g);
    expect(loadGrowth(file).achievements['first-confirm']).toBeDefined();
  });

  it('깨진 파일이면 빈 기록이고, 임시 파일을 남기지 않는다', () => {
    const file = path.join(dir, 'a', 'growth.json');
    saveGrowth(file, emptyGrowth());
    expect(fs.existsSync(file + '.tmp')).toBe(false);
    fs.writeFileSync(file, '{ broken');
    expect(loadGrowth(file)).toEqual(emptyGrowth());
  });
});

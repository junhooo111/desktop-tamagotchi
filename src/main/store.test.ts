import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createPet } from '../shared/pet.js';
import { loadPet, savePet } from './store.js';

let dir: string;
beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pet-store-'));
});
afterEach(() => {
  fs.rmSync(dir, { recursive: true, force: true });
});

describe('store', () => {
  it('저장한 펫을 그대로 불러온다(없는 폴더도 만든다)', () => {
    const file = path.join(dir, 'nested', 'pet.json');
    const pet = { ...createPet('duck', 123), xp: 42 };
    savePet(file, pet);
    expect(loadPet(file)).toEqual(pet);
    expect(fs.existsSync(`${file}.tmp`)).toBe(false);
  });

  it('파일이 없으면 null', () => {
    expect(loadPet(path.join(dir, 'none.json'))).toBeNull();
  });

  it('JSON 이 깨졌으면 null', () => {
    const file = path.join(dir, 'broken.json');
    fs.writeFileSync(file, '{ not json');
    expect(loadPet(file)).toBeNull();
  });

  it('모르는 종이나 숫자가 아닌 값이 있으면 null', () => {
    const file = path.join(dir, 'bad.json');
    fs.writeFileSync(file, JSON.stringify({ ...createPet('cat', 1), speciesId: 'unicorn' }));
    expect(loadPet(file)).toBeNull();
    fs.writeFileSync(file, JSON.stringify({ ...createPet('cat', 1), xp: 'many' }));
    expect(loadPet(file)).toBeNull();
    fs.writeFileSync(file, 'null');
    expect(loadPet(file)).toBeNull();
  });
});

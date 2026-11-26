import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { pullSpecies, startCollection } from '../shared/collection.js';
import { createPet } from '../shared/pet.js';
import { loadCollection, saveCollection } from './collection-store.js';
import { loadPet, savePet } from './store.js';

const dirs: string[] = [];
const tmp = (name = 'collection.json') => {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'collection-'));
  dirs.push(d);
  return path.join(d, 'sub', name);
};
afterEach(() => dirs.splice(0).forEach((d) => fs.rmSync(d, { recursive: true, force: true })));

describe('컬렉션 저장', () => {
  it('저장하고 다시 읽으면 같다(폴더가 없어도 만든다)', () => {
    const f = tmp();
    const c = pullSpecies({ ...startCollection({ ...createPet('cat', 1), xp: 300 }, 1), tickets: 9 }, 2, () => 0.99).collection;
    saveCollection(f, c);
    expect(loadCollection(f)).toEqual(c);
  });

  it('파일이 없거나 깨졌으면 null 이다(예전 저장에서 옮겨 오게)', () => {
    expect(loadCollection(tmp())).toBeNull();
    const f = tmp();
    fs.mkdirSync(path.dirname(f), { recursive: true });
    fs.writeFileSync(f, '{broken');
    expect(loadCollection(f)).toBeNull();
    fs.writeFileSync(f, JSON.stringify({ owned: {} }));
    expect(loadCollection(f)).toBeNull();
  });

  it('쓰는 도중 꺼져도 남는 임시 파일이 없다', () => {
    const f = tmp();
    saveCollection(f, startCollection(createPet('cat', 1), 1));
    expect(fs.readdirSync(path.dirname(f))).toEqual(['collection.json']);
  });
});

describe('펫 저장의 청결', () => {
  it('예전 저장 파일(청결 없음)은 깨끗한 상태로 이어 가고, 새 값은 0~100 으로 맞춘다', () => {
    const f = tmp('pet.json');
    const { clean: _clean, ...old } = createPet('cat', 1);
    fs.mkdirSync(path.dirname(f), { recursive: true });
    fs.writeFileSync(f, JSON.stringify(old));
    expect(loadPet(f)?.clean).toBe(100);
    savePet(f, { ...createPet('cat', 1), clean: 37 });
    expect(loadPet(f)?.clean).toBe(37);
    fs.writeFileSync(f, JSON.stringify({ ...old, clean: 900 }));
    expect(loadPet(f)?.clean).toBe(100);
    fs.writeFileSync(f, JSON.stringify({ ...old, clean: -5 }));
    expect(loadPet(f)?.clean).toBe(0);
  });
});

/** 펫 상태를 JSON 파일로 저장·복원한다. */
import fs from 'node:fs';
import path from 'node:path';
import type { PetState } from '../shared/pet.js';
import { isSpeciesId } from '../shared/species.js';

const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

/** 파일이 없거나 깨졌으면 null. */
export function loadPet(file: string): PetState | null {
  try {
    const raw: unknown = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (typeof raw !== 'object' || raw === null) return null;
    const p = raw as Record<string, unknown>;
    if (
      !isSpeciesId(p['speciesId']) ||
      !isNum(p['xp']) ||
      !isNum(p['hunger']) ||
      !isNum(p['happiness']) ||
      !isNum(p['lastTickAt']) ||
      !isNum(p['lastTouchAt'])
    ) {
      return null;
    }
    return {
      speciesId: p['speciesId'],
      xp: p['xp'],
      hunger: p['hunger'],
      happiness: p['happiness'],
      lastTickAt: p['lastTickAt'],
      lastTouchAt: p['lastTouchAt'],
    };
  } catch {
    return null;
  }
}

/** 임시 파일에 쓴 뒤 바꿔치기해서, 쓰는 도중 꺼져도 파일이 깨지지 않게 한다. */
export function savePet(file: string, pet: PetState): void {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = `${file}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(pet, null, 2), 'utf8');
  fs.renameSync(tmp, file);
}

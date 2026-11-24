/**
 * 펫의 상태와 성장 규칙(순수 로직, 화면·파일과 무관).
 * 모든 함수는 새 객체를 돌려주고 원본을 바꾸지 않는다.
 */
import { getSpecies, type SpeciesId } from './species.js';

export type Stage = 'egg' | 'baby' | 'adult';
export type Mood = 'happy' | 'normal' | 'hungry' | 'sad';

export interface PetState {
  speciesId: SpeciesId;
  xp: number;
  /** 0(굶주림) ~ 100(배부름) */
  hunger: number;
  /** 0(우울) ~ 100(행복) */
  happiness: number;
  /** 시간 경과를 마지막으로 반영한 시각(ms) */
  lastTickAt: number;
  /** 마지막으로 쓰다듬은 시각(ms) */
  lastTouchAt: number;
}

export interface ActionResult {
  pet: PetState;
  ok: boolean;
  /** 말풍선에 띄울 문구. 비어 있으면 아무것도 띄우지 않는다. */
  message: string;
}

export const HATCH_XP = 20;
export const ADULT_LEVEL = 5;
/** 배고픔이 1 줄어드는 데 걸리는 분 */
export const HUNGER_MINUTES = 6;
/** 기분이 1 줄어드는 데 걸리는 분 */
export const HAPPINESS_MINUTES = 10;

const EGG_TOUCH_COOLDOWN_MS = 5_000;
const TOUCH_COOLDOWN_MS = 30_000;

const clamp = (v: number): number => Math.min(100, Math.max(0, v));

export function levelOf(xp: number): number {
  return 1 + Math.floor(Math.sqrt(Math.max(0, xp) / 10));
}

export function stageOf(pet: PetState): Stage {
  if (pet.xp < HATCH_XP) return 'egg';
  return levelOf(pet.xp) >= ADULT_LEVEL ? 'adult' : 'baby';
}

export function moodOf(pet: PetState): Mood {
  if (pet.hunger < 30) return 'hungry';
  if (pet.happiness < 30) return 'sad';
  if (pet.hunger >= 70 && pet.happiness >= 70) return 'happy';
  return 'normal';
}

export function createPet(speciesId: SpeciesId, now: number): PetState {
  return { speciesId, xp: 0, hunger: 80, happiness: 80, lastTickAt: now, lastTouchAt: 0 };
}

/** 앱이 꺼져 있던 시간까지 포함해, 흐른 시간만큼 배고픔·기분을 줄인다. */
export function applyElapsed(pet: PetState, now: number): PetState {
  const minutes = Math.max(0, now - pet.lastTickAt) / 60_000;
  return {
    ...pet,
    hunger: clamp(pet.hunger - minutes / HUNGER_MINUTES),
    happiness: clamp(pet.happiness - minutes / HAPPINESS_MINUTES),
    lastTickAt: Math.max(now, pet.lastTickAt),
  };
}

function gainXp(pet: PetState, amount: number): { pet: PetState; note: string } {
  const before = pet.xp;
  const after = before + amount;
  const next = { ...pet, xp: after };
  if (before < HATCH_XP && after >= HATCH_XP) {
    return { pet: next, note: ` 알이 부화했어요! ${getSpecies(pet.speciesId).name}(이)가 태어났어요.` };
  }
  const lv = levelOf(after);
  if (lv > levelOf(before)) return { pet: next, note: ` 레벨 ${lv}이 되었어요!` };
  return { pet: next, note: '' };
}

export function touch(pet: PetState, now: number): ActionResult {
  const egg = stageOf(pet) === 'egg';
  const cooldown = egg ? EGG_TOUCH_COOLDOWN_MS : TOUCH_COOLDOWN_MS;
  if (now - pet.lastTouchAt < cooldown) return { pet, ok: false, message: '' };
  const touched = { ...pet, lastTouchAt: now, happiness: clamp(pet.happiness + 3) };
  const gained = gainXp(touched, egg ? 2 : 1);
  return { pet: gained.pet, ok: true, message: (egg ? '따뜻해요…' : '좋아요!') + gained.note };
}

export function feed(pet: PetState): ActionResult {
  if (stageOf(pet) === 'egg') return { pet, ok: false, message: '알은 아직 밥을 못 먹어요.' };
  if (pet.hunger >= 90) return { pet, ok: false, message: '배불러요!' };
  const fed = { ...pet, hunger: clamp(pet.hunger + 30) };
  const gained = gainXp(fed, 5);
  return { pet: gained.pet, ok: true, message: '냠냠, 맛있어요!' + gained.note };
}

export function play(pet: PetState): ActionResult {
  if (stageOf(pet) === 'egg') return { pet, ok: false, message: '알은 아직 못 놀아요.' };
  if (pet.hunger < 15) return { pet, ok: false, message: '배고파서 못 놀겠어요…' };
  const played = { ...pet, happiness: clamp(pet.happiness + 25), hunger: clamp(pet.hunger - 5) };
  const gained = gainXp(played, 8);
  return { pet: gained.pet, ok: true, message: '신나요!' + gained.note };
}

export function statusText(pet: PetState): string {
  const stageName = { egg: '알', baby: '새끼', adult: '성체' }[stageOf(pet)];
  const name = stageOf(pet) === 'egg' ? '알' : getSpecies(pet.speciesId).name;
  return [
    `${name} · ${stageName} · Lv.${levelOf(pet.xp)}`,
    `경험치 ${Math.floor(pet.xp)}`,
    `배고픔 ${Math.floor(pet.hunger)}/100 · 기분 ${Math.floor(pet.happiness)}/100`,
  ].join('\n');
}

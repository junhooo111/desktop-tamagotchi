/**
 * 펫의 상태와 성장 규칙(순수 로직, 화면·파일과 무관).
 * 모든 함수는 새 객체를 돌려주고 원본을 바꾸지 않는다.
 */
import { getSpecies, hasLegendForm, type SpeciesId } from './species.js';

export type Stage = 'egg' | 'baby' | 'adult' | 'legend';
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
  /** 0(더러움) ~ 100(깨끗함). 시간이 지나거나 산책·응가를 하면 줄고, 씻기면 100 이 된다. */
  clean: number;
}

export interface ActionResult {
  pet: PetState;
  ok: boolean;
  /** 말풍선에 띄울 문구. 비어 있으면 아무것도 띄우지 않는다. */
  message: string;
}

export const HATCH_XP = 20;
export const ADULT_LEVEL = 5;
/** 히든 동물이 성체에서 전설 단계로 진화하는 레벨 */
export const LEGEND_LEVEL = 10;
/** 배고픔이 1 줄어드는 데 걸리는 분 */
export const HUNGER_MINUTES = 6;
/** 기분이 1 줄어드는 데 걸리는 분 */
export const HAPPINESS_MINUTES = 10;
/** 청결이 1 줄어드는 데 걸리는 분 */
export const CLEAN_MINUTES = 12;
/** 청결이 이 값보다 낮으면 더러운 펫이다(냄새 표시) */
export const DIRTY_BELOW = 30;

const EGG_TOUCH_COOLDOWN_MS = 5_000;
const TOUCH_COOLDOWN_MS = 30_000;

const clamp = (v: number): number => Math.min(100, Math.max(0, v));

export function levelOf(xp: number): number {
  return 1 + Math.floor(Math.sqrt(Math.max(0, xp) / 10));
}

export function stageOf(pet: PetState): Stage {
  if (pet.xp < HATCH_XP) return 'egg';
  const level = levelOf(pet.xp);
  if (level >= LEGEND_LEVEL && hasLegendForm(pet.speciesId)) return 'legend';
  return level >= ADULT_LEVEL ? 'adult' : 'baby';
}

/** 레벨 등급: 10 레벨마다 이름과 색이 바뀐다(레벨 1~9 새내기, 10~19 숙련, …, 50 이상 신화). */
export interface LevelTier {
  /** 0 부터 5 까지 */
  tier: number;
  name: string;
  /** 글자·막대에 쓰는 대표 색 */
  color: string;
  /** 배지 위의 글자 색 */
  onColor: string;
}

export const LEVEL_TIERS: readonly LevelTier[] = [
  { tier: 0, name: '새내기', color: '#8d7b68', onColor: '#ffffff' },
  { tier: 1, name: '숙련', color: '#3aa55d', onColor: '#ffffff' },
  { tier: 2, name: '베테랑', color: '#3a7bd5', onColor: '#ffffff' },
  { tier: 3, name: '달인', color: '#8a4bd8', onColor: '#ffffff' },
  { tier: 4, name: '명인', color: '#f08a24', onColor: '#ffffff' },
  { tier: 5, name: '신화', color: '#e8b400', onColor: '#3b2f2f' },
];

export const tierIndexOf = (level: number): number => Math.min(LEVEL_TIERS.length - 1, Math.floor(Math.max(1, level) / 10));
export const levelTier = (level: number): LevelTier => LEVEL_TIERS[tierIndexOf(level)]!;

export const isDirty = (pet: PetState): boolean => pet.clean < DIRTY_BELOW;

/** 꾸미기에서 고르는 모습: auto 는 지금 단계 그대로, 나머지는 이미 지나온 단계로 되돌린 모습 */
export type DisplayStage = 'auto' | 'baby' | 'adult' | 'legend';
export const DISPLAY_STAGES: readonly DisplayStage[] = ['auto', 'baby', 'adult', 'legend'];
export const isDisplayStage = (v: unknown): v is DisplayStage => typeof v === 'string' && (DISPLAY_STAGES as readonly string[]).includes(v);

const STAGE_RANK: Record<Stage, number> = { egg: 0, baby: 1, adult: 2, legend: 3 };

/** 지금 단계까지 지나온 단계들(알은 모습으로 고를 수 없으니 뺀다). 알이면 없다. */
export function reachedStages(actual: Stage): Exclude<Stage, 'egg'>[] {
  return (['baby', 'adult', 'legend'] as const).filter((s) => STAGE_RANK[s] <= STAGE_RANK[actual]);
}

/**
 * 화면에 보여 줄 단계. 고른 모습이 아직 안 지나온 단계이거나 알이면 지금 단계 그대로다.
 * (경험치·레벨·돌봄은 늘 진짜 단계 기준이고, 모습만 바뀐다.)
 */
export function effectiveStage(actual: Stage, chosen: DisplayStage): Stage {
  if (chosen === 'auto' || actual === 'egg') return actual;
  return STAGE_RANK[chosen] <= STAGE_RANK[actual] ? chosen : actual;
}

export function moodOf(pet: PetState): Mood {
  if (pet.hunger < 30) return 'hungry';
  if (pet.happiness < 30) return 'sad';
  if (pet.hunger >= 70 && pet.happiness >= 70) return 'happy';
  return 'normal';
}

export function createPet(speciesId: SpeciesId, now: number): PetState {
  return { speciesId, xp: 0, hunger: 80, happiness: 80, lastTickAt: now, lastTouchAt: 0, clean: 100 };
}

/** 앱이 꺼져 있던 시간까지 포함해, 흐른 시간만큼 배고픔·기분을 줄인다. */
export function applyElapsed(pet: PetState, now: number): PetState {
  const minutes = Math.max(0, now - pet.lastTickAt) / 60_000;
  return {
    ...pet,
    hunger: clamp(pet.hunger - minutes / HUNGER_MINUTES),
    happiness: clamp(pet.happiness - minutes / HAPPINESS_MINUTES),
    clean: clamp(pet.clean - minutes / CLEAN_MINUTES),
    lastTickAt: Math.max(now, pet.lastTickAt),
  };
}

/** 경험치를 더한다(부화·레벨업이면 note 에 문구가 담긴다). 업적 보상 같은 곳에서도 쓴다. */
export function gainXp(pet: PetState, amount: number): { pet: PetState; note: string } {
  const before = pet.xp;
  const after = before + amount;
  const next = { ...pet, xp: after };
  if (before < HATCH_XP && after >= HATCH_XP) {
    return { pet: next, note: ` 알이 부화했어요! ${getSpecies(pet.speciesId).name}(이)가 태어났어요.` };
  }
  const lv = levelOf(after);
  if (lv > levelOf(before)) {
    const evolved = lv === LEGEND_LEVEL && hasLegendForm(pet.speciesId) ? ` ${getSpecies(pet.speciesId).name}(이)가 전설의 모습으로 진화했어요!` : '';
    const tier = tierIndexOf(lv) > tierIndexOf(levelOf(before)) ? ` ✨ '${levelTier(lv).name}' 등급이 되었어요!` : '';
    return { pet: next, note: ` 레벨 ${lv}이 되었어요!${tier}${evolved}` };
  }
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

/** 씻기기: 청결을 가득 채운다. 이미 깨끗하면(90 이상) 하지 않는다. */
export function wash(pet: PetState): ActionResult {
  if (stageOf(pet) === 'egg') return { pet, ok: false, message: '알은 아직 못 씻어요.' };
  if (pet.clean >= 90) return { pet, ok: false, message: '이미 깨끗해요!' };
  const washed = { ...pet, clean: 100, happiness: clamp(pet.happiness + 5) };
  const gained = gainXp(washed, 4);
  return { pet: gained.pet, ok: true, message: '보글보글! 깨끗해졌어요!' + gained.note };
}

/** 산책을 나갈 수 있는지(알이 아니고 너무 배고프지 않아야 한다). 못 나가면 이유를 message 로 돌려준다. */
export function canStroll(pet: PetState): { ok: boolean; message: string } {
  if (stageOf(pet) === 'egg') return { ok: false, message: '알은 아직 산책을 못 가요.' };
  if (pet.hunger < 20) return { ok: false, message: '배고파서 산책 못 가요…' };
  return { ok: true, message: '산책 가요! 마우스를 따라갈게요' };
}

/** 산책을 마치고 돌아왔을 때: 기분이 좋아지고 배고프고 지저분해진다. */
export function finishStroll(pet: PetState): ActionResult {
  const walked = { ...pet, happiness: clamp(pet.happiness + 15), hunger: clamp(pet.hunger - 10), clean: clamp(pet.clean - 10) };
  const gained = gainXp(walked, 6);
  return { pet: gained.pet, ok: true, message: '산책 끝! 지쳤어요…' + gained.note };
}

/** 응가를 하면 조금 더러워진다. */
export function afterPoop(pet: PetState): PetState {
  return { ...pet, clean: clamp(pet.clean - 6) };
}

export const LEARN_XP = { confirm: 10, fixed: 20, tip: 2 } as const;
/** 확인 퀴즈를 맞히면 더해 주는 경험치 */
export const QUIZ_BONUS = 5;

const LEARN_HEAD = {
  confirm: '배웠어요!',
  fixed: '고쳤네요, 대단해요!',
  tip: '새로 알았어요!',
} as const;

/**
 * 학습으로 경험치를 준다.
 *   confirm  배움 카드를 확인했다(퀴즈를 맞히면 bonus 로 QUIZ_BONUS 를 더한다)
 *   fixed    확인했던 문제를 고친 것이 확인됐다
 *   tip      FE 지식을 처음 읽었다
 */
export function learn(pet: PetState, kind: keyof typeof LEARN_XP, bonus = 0): ActionResult {
  const xp = LEARN_XP[kind] + bonus;
  const gained = gainXp(pet, xp);
  const head = kind === 'confirm' && bonus > 0 ? '정답! 배웠어요!' : LEARN_HEAD[kind];
  return { pet: gained.pet, ok: true, message: `${head} 경험치 +${xp}${gained.note}` };
}

/** 펫 상태 설명. 이름을 지어 줬으면 `이름(종)` 으로 보여 준다. */
export function statusText(pet: PetState, petName = ''): string {
  const stageName = { egg: '알', baby: '새끼', adult: '성체', legend: '전설' }[stageOf(pet)];
  const species = stageOf(pet) === 'egg' ? '알' : getSpecies(pet.speciesId).name;
  const name = petName && stageOf(pet) !== 'egg' ? `${petName}(${species})` : species;
  return [
    `${name} · ${stageName} · Lv.${levelOf(pet.xp)}`,
    `경험치 ${Math.floor(pet.xp)}`,
    `배고픔 ${Math.floor(pet.hunger)}/100 · 기분 ${Math.floor(pet.happiness)}/100 · 청결 ${Math.floor(pet.clean)}/100`,
  ].join('\n');
}

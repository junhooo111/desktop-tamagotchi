/**
 * 성장 요소: 연속 사용(스트릭), 업적, 도감(배운 규칙 현황).
 *
 * 전부 순수 함수라서 시계·파일·화면 없이 테스트한다. 저장은 main/growth-store.ts, 화면은 renderer/codex.ts.
 * 레벨·경험치 자체는 pet.ts 가 맡고, 여기서는 "무엇을 했는지"를 세고 업적을 풀어 준다.
 */
import { LESSONS, RULE_IDS, type RuleId } from './lessons.js';
import { TIPS } from './tips.js';
import { COSMETIC_ITEMS } from './cosmetics.js';
import type { Rarity } from './rarity.js';

export type CareKind = 'touch' | 'feed' | 'play' | 'wash';

export type GrowthEvent =
  | { kind: 'confirm'; ruleId: RuleId; correct: boolean }
  | { kind: 'fix'; ruleId: RuleId }
  | { kind: 'tip' }
  | { kind: 'care'; care: CareKind }
  /** 산책을 마쳤다 */
  | { kind: 'stroll' }
  /** 컬렉션이 바뀌었다(뽑기·꺼내기): 숫자는 올리지 않고 업적만 다시 본다 */
  | { kind: 'sync' };

export interface RuleStat {
  confirms: number;
  fixes: number;
}

export interface Growth {
  /** 앱으로 무언가를 한 날(로컬 날짜 'YYYY-MM-DD'), 오래된 순, 최근 400일까지 */
  days: string[];
  counters: { confirms: number; fixes: number; quizCorrect: number; tips: number; care: number; washes: number; strolls: number };
  rules: Partial<Record<RuleId, RuleStat>>;
  /** 업적 id → 달성한 시각(ms) */
  achievements: Record<string, number>;
}

export const emptyGrowth = (): Growth => ({
  days: [],
  counters: { confirms: 0, fixes: 0, quizCorrect: 0, tips: 0, care: 0, washes: 0, strolls: 0 },
  rules: {},
  achievements: {},
});

const MAX_DAYS = 400;

// ---- 날짜·스트릭 ----

const pad = (n: number): string => String(n).padStart(2, '0');

/** 로컬 시간 기준의 날짜 문자열. 자정을 넘기면 다음 날이다. */
export function localDay(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** 'YYYY-MM-DD' 를 날짜 번호로 바꾼다(여름시간·시간대와 상관없이 하루 차이는 1). */
function dayNumber(day: string): number {
  const [y, m, d] = day.split('-').map(Number);
  return Math.floor(Date.UTC(y ?? 1970, (m ?? 1) - 1, d ?? 1) / 86_400_000);
}

export function addDay(days: readonly string[], day: string): string[] {
  if (days.includes(day)) return [...days];
  return [...days, day].sort().slice(-MAX_DAYS);
}

/**
 * 연속 사용 일수. current 는 오늘(아직 안 했으면 어제)까지 이어진 일수이고, best 는 지금까지 가장 길었던 연속 일수다.
 * 오늘 아직 아무것도 안 했어도 어제까지 이어졌다면 스트릭은 살아 있다(오늘 안에 하면 이어진다).
 */
export function streakOf(days: readonly string[], today: string): { current: number; best: number } {
  const nums = [...new Set(days.map(dayNumber))].sort((a, b) => a - b);
  let best = 0;
  let run = 0;
  let prev = -Infinity;
  for (const n of nums) {
    run = n === prev + 1 ? run + 1 : 1;
    best = Math.max(best, run);
    prev = n;
  }
  const set = new Set(nums);
  const t = dayNumber(today);
  let cursor = set.has(t) ? t : set.has(t - 1) ? t - 1 : null;
  let current = 0;
  while (cursor !== null && set.has(cursor)) {
    current++;
    cursor--;
  }
  return { current, best };
}

// ---- 업적 ----

export type Metric = 'confirms' | 'fixes' | 'quizCorrect' | 'rulesLearned' | 'tipsSeen' | 'streak' | 'care' | 'washes' | 'strolls' | 'collected' | 'pulls' | 'hiddenOwned' | 'friends' | 'friendLevel' | 'cosmetics' | 'legendCosmetics' | 'props';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  metric: Metric;
  goal: number;
  /** 달성하면 받는 경험치 */
  xp: number;
}

export const ACHIEVEMENTS: readonly Achievement[] = [
  { id: 'first-confirm', name: '첫 배움', description: '배움 카드를 처음 확인했어요', metric: 'confirms', goal: 1, xp: 5 },
  { id: 'confirm-10', name: '열심히 배우는 중', description: '배움 카드를 10번 확인했어요', metric: 'confirms', goal: 10, xp: 15 },
  { id: 'confirm-50', name: 'FE 꿈나무', description: '배움 카드를 50번 확인했어요', metric: 'confirms', goal: 50, xp: 40 },
  { id: 'quiz-5', name: '퀴즈 척척', description: '확인 퀴즈를 5번 맞혔어요', metric: 'quizCorrect', goal: 5, xp: 10 },
  { id: 'quiz-25', name: '퀴즈 박사', description: '확인 퀴즈를 25번 맞혔어요', metric: 'quizCorrect', goal: 25, xp: 30 },
  { id: 'first-fix', name: '첫 수정', description: '펫이 찾은 문제를 처음 고쳤어요', metric: 'fixes', goal: 1, xp: 10 },
  { id: 'fix-10', name: '문제 해결사', description: '찾은 문제를 10개 고쳤어요', metric: 'fixes', goal: 10, xp: 30 },
  { id: 'fix-30', name: 'FE 장인', description: '찾은 문제를 30개 고쳤어요', metric: 'fixes', goal: 30, xp: 80 },
  { id: 'rules-5', name: '다섯 가지 기본기', description: '서로 다른 문제 5종을 배웠어요', metric: 'rulesLearned', goal: 5, xp: 20 },
  { id: 'rules-10', name: '열 가지 기본기', description: '서로 다른 문제 10종을 배웠어요', metric: 'rulesLearned', goal: 10, xp: 40 },
  { id: 'rules-all', name: '도감 완성', description: '모든 종류의 문제를 한 번씩 배웠어요', metric: 'rulesLearned', goal: RULE_IDS.length, xp: 100 },
  { id: 'tips-10', name: '지식 수집가', description: 'FE 지식을 10개 읽었어요', metric: 'tipsSeen', goal: 10, xp: 10 },
  { id: 'tips-all', name: '지식 박사', description: '모든 FE 지식을 읽었어요', metric: 'tipsSeen', goal: TIPS.length, xp: 50 },
  { id: 'streak-3', name: '사흘 연속', description: '3일 연속으로 펫과 함께했어요', metric: 'streak', goal: 3, xp: 10 },
  { id: 'streak-7', name: '일주일 연속', description: '7일 연속으로 펫과 함께했어요', metric: 'streak', goal: 7, xp: 30 },
  { id: 'streak-30', name: '한 달 연속', description: '30일 연속으로 펫과 함께했어요', metric: 'streak', goal: 30, xp: 100 },
  { id: 'care-50', name: '다정한 친구', description: '쓰다듬고, 밥 주고, 놀아 준 횟수가 50번이에요', metric: 'care', goal: 50, xp: 10 },
  { id: 'care-200', name: '금손 집사', description: '돌봐 준 횟수가 200번이에요', metric: 'care', goal: 200, xp: 60 },
  { id: 'wash-20', name: '깔끔쟁이', description: '펫을 20번 씻겼어요', metric: 'washes', goal: 20, xp: 30 },
  { id: 'stroll-10', name: '산책 친구', description: '산책을 10번 다녀왔어요', metric: 'strolls', goal: 10, xp: 30 },
  { id: 'collect-5', name: '동물 수집가', description: '서로 다른 동물을 5종 모았어요', metric: 'collected', goal: 5, xp: 40 },
  { id: 'pull-10', name: '뽑기 단골', description: '동물 뽑기를 10번 했어요', metric: 'pulls', goal: 10, xp: 40 },
  { id: 'hidden-1', name: '전설의 만남', description: '히든 동물을 처음 만났어요', metric: 'hiddenOwned', goal: 1, xp: 80 },
  { id: 'friend-1', name: '첫 친구', description: '친구를 처음 사귀었어요', metric: 'friends', goal: 1, xp: 10 },
  { id: 'friend-3', name: '친구 부자', description: '친구가 3명이 되었어요', metric: 'friends', goal: 3, xp: 25 },
  { id: 'friendship-3', name: '단짝', description: '친구와 친밀도 레벨 3이 되었어요', metric: 'friendLevel', goal: 3, xp: 25 },
  { id: 'friendship-5', name: '절친', description: '친구와 친밀도 레벨 5가 되었어요', metric: 'friendLevel', goal: 5, xp: 50 },
  { id: 'friendship-10', name: '영혼의 단짝', description: '친구와 친밀도 레벨 10이 되었어요', metric: 'friendLevel', goal: 10, xp: 150 },
  { id: 'cos-5', name: '옷장 채우기', description: '꾸미기를 5개 모았어요', metric: 'cosmetics', goal: 5, xp: 20 },
  { id: 'cos-15', name: '패셔니스타', description: '꾸미기를 15개 모았어요', metric: 'cosmetics', goal: 15, xp: 50 },
  { id: 'cos-legend', name: '전설의 옷장', description: '전설 꾸미기를 얻었어요', metric: 'legendCosmetics', goal: 1, xp: 80 },
  { id: 'prop-1', name: '첫 소품', description: '소품을 처음 얻었어요', metric: 'props', goal: 1, xp: 20 },
  { id: 'prop-all', name: '소품 수집가', description: '소품을 모두 모았어요', metric: 'props', goal: COSMETIC_ITEMS.filter((i) => i.kind === 'prop').length, xp: 100 },
  { id: 'cos-all', name: '옷장 완성', description: '뽑기에 나오는 꾸미기를 모두 모았어요', metric: 'cosmetics', goal: COSMETIC_ITEMS.filter((i) => i.gacha).length, xp: 200 },
];

/** 업적 계산에 필요한 바깥 정보(읽은 지식 수는 progress 가 갖고 있다) */
export interface GrowthContext {
  tipsSeen: number;
  /** 모은 동물 수·동물 뽑기 횟수·가진 히든 동물 수(컬렉션에서 온다). 모르면 0 으로 본다. */
  collected?: number;
  pulls?: number;
  hiddenOwned?: number;
  /** 꾸미기 수집: 가진 수와 그중 전설 이상의 수, 그리고 등급별 현황(도감 창) */
  cosmetics?: number;
  legendCosmetics?: number;
  /** 가진 소품 수 */
  props?: number;
  cosmeticProgress?: CosmeticProgress;
  /** 친구 수와 가장 높은 친밀도 레벨(서버의 친구 목록에서 온다). 모르면 0 으로 본다. */
  friends?: number;
  friendLevel?: number;
}

export function rulesLearned(g: Growth): number {
  return RULE_IDS.filter((id) => (g.rules[id]?.confirms ?? 0) > 0).length;
}

export function metricValue(g: Growth, ctx: GrowthContext, metric: Metric, today: string): number {
  switch (metric) {
    case 'confirms':
      return g.counters.confirms;
    case 'fixes':
      return g.counters.fixes;
    case 'quizCorrect':
      return g.counters.quizCorrect;
    case 'rulesLearned':
      return rulesLearned(g);
    case 'tipsSeen':
      return ctx.tipsSeen;
    case 'streak':
      return streakOf(g.days, today).best;
    case 'care':
      return g.counters.care;
    case 'washes':
      return g.counters.washes;
    case 'strolls':
      return g.counters.strolls;
    case 'collected':
      return ctx.collected ?? 0;
    case 'pulls':
      return ctx.pulls ?? 0;
    case 'hiddenOwned':
      return ctx.hiddenOwned ?? 0;
    case 'friends':
      return ctx.friends ?? 0;
    case 'friendLevel':
      return ctx.friendLevel ?? 0;
    case 'cosmetics':
      return ctx.cosmetics ?? 0;
    case 'legendCosmetics':
      return ctx.legendCosmetics ?? 0;
    case 'props':
      return ctx.props ?? 0;
  }
}

/** 새로 달성한 업적을 찾아 기록한다. */
function unlockNew(g: Growth, ctx: GrowthContext, now: number): { growth: Growth; unlocked: Achievement[] } {
  const today = localDay(now);
  const unlocked = ACHIEVEMENTS.filter((a) => g.achievements[a.id] === undefined && metricValue(g, ctx, a.metric, today) >= a.goal);
  if (unlocked.length === 0) return { growth: g, unlocked };
  const achievements = { ...g.achievements };
  for (const a of unlocked) achievements[a.id] = now;
  return { growth: { ...g, achievements }, unlocked };
}

/** 한 일을 기록하고, 이 일로 새로 달성한 업적을 돌려준다. */
export function applyEvent(g: Growth, event: GrowthEvent, now: number, ctx: GrowthContext): { growth: Growth; unlocked: Achievement[] } {
  const counters = { ...g.counters };
  const rules = { ...g.rules };
  switch (event.kind) {
    case 'confirm': {
      counters.confirms++;
      if (event.correct) counters.quizCorrect++;
      const prev = rules[event.ruleId] ?? { confirms: 0, fixes: 0 };
      rules[event.ruleId] = { ...prev, confirms: prev.confirms + 1 };
      break;
    }
    case 'fix': {
      counters.fixes++;
      const prev = rules[event.ruleId] ?? { confirms: 0, fixes: 0 };
      rules[event.ruleId] = { ...prev, fixes: prev.fixes + 1 };
      break;
    }
    case 'tip':
      counters.tips++;
      break;
    case 'care':
      counters.care++;
      if (event.care === 'wash') counters.washes++;
      break;
    case 'stroll':
      counters.strolls++;
      counters.care++; // 산책도 돌봄이다
      break;
    case 'sync':
      break;
  }
  const next: Growth = { ...g, days: addDay(g.days, localDay(now)), counters, rules };
  return unlockNew(next, ctx, now);
}

// ---- 도감(화면에 보여 줄 값) ----

export interface CodexRule {
  id: RuleId;
  /** 아직 못 배운 규칙은 이름을 숨긴다('???') */
  title: string;
  status: 'unseen' | 'learned' | 'fixed';
  confirms: number;
  fixes: number;
}

export interface CodexAchievement {
  id: string;
  name: string;
  description: string;
  xp: number;
  unlocked: boolean;
  progress: number;
  goal: number;
}

/** 꾸미기 수집 현황(등급별 가진 수 / 전체 수) */
export interface CosmeticProgress {
  owned: number;
  total: number;
  byGrade: Array<{ rarity: Rarity; owned: number; total: number }>;
}

export interface CodexView {
  cosmetics?: CosmeticProgress;
  streak: { current: number; best: number; totalDays: number };
  counters: Growth['counters'];
  rulesLearned: number;
  rulesTotal: number;
  tipsSeen: number;
  tipsTotal: number;
  rules: CodexRule[];
  achievements: CodexAchievement[];
}

export function buildCodex(g: Growth, ctx: GrowthContext, now: number): CodexView {
  const today = localDay(now);
  const streak = streakOf(g.days, today);
  return {
    streak: { ...streak, totalDays: g.days.length },
    counters: { ...g.counters },
    rulesLearned: rulesLearned(g),
    rulesTotal: RULE_IDS.length,
    tipsSeen: ctx.tipsSeen,
    tipsTotal: TIPS.length,
    ...(ctx.cosmeticProgress ? { cosmetics: ctx.cosmeticProgress } : {}),
    rules: RULE_IDS.map((id) => {
      const stat = g.rules[id] ?? { confirms: 0, fixes: 0 };
      const status = stat.fixes > 0 ? 'fixed' : stat.confirms > 0 ? 'learned' : 'unseen';
      return { id, title: status === 'unseen' ? '???' : LESSONS[id].title, status, confirms: stat.confirms, fixes: stat.fixes };
    }),
    achievements: ACHIEVEMENTS.map((a) => ({
      id: a.id,
      name: a.name,
      description: a.description,
      xp: a.xp,
      unlocked: g.achievements[a.id] !== undefined,
      // 달성했으면 목표까지 채운 것으로 보여 준다(스트릭이 끊겨 현재 값이 줄어도 달성은 그대로).
      progress: g.achievements[a.id] !== undefined ? a.goal : Math.min(a.goal, metricValue(g, ctx, a.metric, today)),
      goal: a.goal,
    })),
  };
}

// ---- 저장 파일 검증 ----

const count = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) && v >= 0 ? Math.floor(v) : 0);
const isDay = (v: unknown): v is string => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v);

/** 어떤 값이 와도 항상 유효한 Growth 를 돌려준다(저장 파일이 깨져도 앱이 죽지 않게). */
export function sanitizeGrowth(raw: unknown): Growth {
  const r = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {};
  const c = typeof r['counters'] === 'object' && r['counters'] !== null ? (r['counters'] as Record<string, unknown>) : {};
  const rules: Growth['rules'] = {};
  const rawRules = typeof r['rules'] === 'object' && r['rules'] !== null ? (r['rules'] as Record<string, unknown>) : {};
  for (const id of RULE_IDS) {
    const s = rawRules[id];
    if (typeof s === 'object' && s !== null) {
      const stat = s as Record<string, unknown>;
      rules[id] = { confirms: count(stat['confirms']), fixes: count(stat['fixes']) };
    }
  }
  const achievements: Record<string, number> = {};
  const rawAch = typeof r['achievements'] === 'object' && r['achievements'] !== null ? (r['achievements'] as Record<string, unknown>) : {};
  for (const a of ACHIEVEMENTS) {
    const at = rawAch[a.id];
    if (typeof at === 'number' && Number.isFinite(at)) achievements[a.id] = at;
  }
  const days = Array.isArray(r['days']) ? [...new Set((r['days'] as unknown[]).filter(isDay))].sort().slice(-MAX_DAYS) : [];
  return {
    days,
    counters: { confirms: count(c['confirms']), fixes: count(c['fixes']), quizCorrect: count(c['quizCorrect']), tips: count(c['tips']), care: count(c['care']), washes: count(c['washes']), strolls: count(c['strolls']) },
    rules,
    achievements,
  };
}

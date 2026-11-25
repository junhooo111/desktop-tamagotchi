import { describe, expect, it } from 'vitest';
import {
  ACHIEVEMENTS,
  addDay,
  applyEvent,
  buildCodex,
  emptyGrowth,
  localDay,
  rulesLearned,
  sanitizeGrowth,
  streakOf,
  type Growth,
  type GrowthEvent,
} from './growth.js';
import { RULE_IDS } from './lessons.js';
import { TIPS } from './tips.js';

const at = (y: number, m: number, d: number, h = 12): number => new Date(y, m - 1, d, h).getTime();
const ctx = { tipsSeen: 0 };

describe('날짜와 스트릭', () => {
  it('로컬 날짜 문자열을 만든다(자정을 넘기면 다음 날)', () => {
    expect(localDay(at(2026, 11, 25, 0))).toBe('2026-11-25');
    expect(localDay(at(2026, 11, 25, 23))).toBe('2026-11-25');
    expect(localDay(at(2026, 12, 1, 0))).toBe('2026-12-01');
  });

  it('addDay 는 중복 없이 날짜순으로 쌓고 400일까지만 둔다', () => {
    expect(addDay(['2026-11-24'], '2026-11-24')).toEqual(['2026-11-24']);
    expect(addDay(['2026-11-25'], '2026-11-23')).toEqual(['2026-11-23', '2026-11-25']);
    const many = Array.from({ length: 405 }, (_, i) => localDay(at(2025, 1, 1 + i)));
    expect(many.reduce<string[]>((acc, d) => addDay(acc, d), [])).toHaveLength(400);
  });

  it('streakOf: 오늘까지 이어진 일수와 최고 기록을 센다', () => {
    const days = ['2026-11-20', '2026-11-21', '2026-11-23', '2026-11-24', '2026-11-25'];
    expect(streakOf(days, '2026-11-25')).toEqual({ current: 3, best: 3 });
  });

  it('오늘 아직 안 했어도 어제까지 이어졌다면 스트릭은 살아 있다', () => {
    expect(streakOf(['2026-11-23', '2026-11-24'], '2026-11-25')).toEqual({ current: 2, best: 2 });
  });

  it('하루 이상 빠지면 현재 스트릭은 0 이고 최고 기록은 남는다', () => {
    expect(streakOf(['2026-11-20', '2026-11-21', '2026-11-22'], '2026-11-25')).toEqual({ current: 0, best: 3 });
    expect(streakOf([], '2026-11-25')).toEqual({ current: 0, best: 0 });
  });

  it('월말·연말·윤년·여름시간을 넘어도 하루 차이로 센다', () => {
    expect(streakOf(['2026-12-31', '2027-01-01'], '2027-01-01').current).toBe(2);
    expect(streakOf(['2028-02-28', '2028-02-29', '2028-03-01'], '2028-03-01').current).toBe(3);
    expect(streakOf(['2026-03-07', '2026-03-08', '2026-03-09'], '2026-03-09').current).toBe(3);
  });
});

describe('applyEvent', () => {
  const confirm = (ruleId: (typeof RULE_IDS)[number], correct = true): GrowthEvent => ({ kind: 'confirm', ruleId, correct });

  it('확인을 세고, 규칙별로 기록하고, 퀴즈를 맞힌 것만 따로 센다', () => {
    const a = applyEvent(emptyGrowth(), confirm('img-alt', true), at(2026, 11, 25), ctx).growth;
    const b = applyEvent(a, confirm('img-alt', false), at(2026, 11, 25), ctx).growth;
    expect(b.counters).toMatchObject({ confirms: 2, quizCorrect: 1 });
    expect(b.rules['img-alt']).toEqual({ confirms: 2, fixes: 0 });
    expect(b.days).toEqual(['2026-11-25']);
  });

  it('고침·지식·돌보기도 센다', () => {
    let g = emptyGrowth();
    g = applyEvent(g, { kind: 'fix', ruleId: 'contrast' }, at(2026, 11, 25), ctx).growth;
    g = applyEvent(g, { kind: 'tip' }, at(2026, 11, 25), ctx).growth;
    g = applyEvent(g, { kind: 'care', care: 'feed' }, at(2026, 11, 25), ctx).growth;
    expect(g.counters).toMatchObject({ fixes: 1, tips: 1, care: 1 });
    expect(g.rules['contrast']).toEqual({ confirms: 0, fixes: 1 });
  });

  it('원본 Growth 를 바꾸지 않는다', () => {
    const g = emptyGrowth();
    applyEvent(g, confirm('img-alt'), at(2026, 11, 25), ctx);
    expect(g).toEqual(emptyGrowth());
  });

  it('조건을 채우는 순간 업적이 한 번만 풀린다', () => {
    const first = applyEvent(emptyGrowth(), confirm('img-alt'), at(2026, 11, 25), ctx);
    expect(first.unlocked.map((a) => a.id)).toEqual(['first-confirm']);
    expect(first.growth.achievements['first-confirm']).toBe(at(2026, 11, 25));
    const second = applyEvent(first.growth, confirm('img-alt'), at(2026, 11, 26), ctx);
    expect(second.unlocked).toEqual([]); // 이미 푼 업적은 다시 풀리지 않는다
  });

  it('한 번에 여러 업적이 풀릴 수 있다(첫 퀴즈 정답 5번째 등)', () => {
    let g: Growth = emptyGrowth();
    const unlockedIds: string[] = [];
    for (let i = 0; i < 5; i++) {
      const r = applyEvent(g, confirm(RULE_IDS[i % RULE_IDS.length]!, true), at(2026, 11, 25), ctx);
      g = r.growth;
      unlockedIds.push(...r.unlocked.map((a) => a.id));
    }
    expect(unlockedIds).toEqual(expect.arrayContaining(['first-confirm', 'rules-5', 'quiz-5']));
  });

  it('서로 다른 규칙 수(도감)로 푸는 업적은 같은 규칙을 반복해서는 안 풀린다', () => {
    let g: Growth = emptyGrowth();
    for (let i = 0; i < 10; i++) g = applyEvent(g, confirm('img-alt'), at(2026, 11, 25), ctx).growth;
    expect(rulesLearned(g)).toBe(1);
    expect(g.achievements['rules-5']).toBeUndefined();
  });

  it('스트릭 업적은 연속된 날에 활동해야 풀린다', () => {
    let g: Growth = emptyGrowth();
    let last: string[] = [];
    for (const d of [23, 24, 25]) {
      const r = applyEvent(g, { kind: 'care', care: 'touch' }, at(2026, 11, d), ctx);
      g = r.growth;
      last = r.unlocked.map((a) => a.id);
    }
    expect(last).toContain('streak-3');
    // 하루 건너뛰면 풀리지 않는다
    let h: Growth = emptyGrowth();
    for (const d of [20, 22, 24]) h = applyEvent(h, { kind: 'care', care: 'touch' }, at(2026, 11, d), ctx).growth;
    expect(h.achievements['streak-3']).toBeUndefined();
  });

  it('지식 업적은 바깥에서 알려 주는 읽은 지식 수를 쓴다', () => {
    const r = applyEvent(emptyGrowth(), { kind: 'tip' }, at(2026, 11, 25), { tipsSeen: 10 });
    expect(r.unlocked.map((a) => a.id)).toContain('tips-10');
    const all = applyEvent(emptyGrowth(), { kind: 'tip' }, at(2026, 11, 25), { tipsSeen: TIPS.length });
    expect(all.unlocked.map((a) => a.id)).toContain('tips-all');
  });
});

describe('업적 정의', () => {
  it('id 가 겹치지 않고, 목표·경험치가 양수이고, 문구가 채워져 있다', () => {
    expect(new Set(ACHIEVEMENTS.map((a) => a.id)).size).toBe(ACHIEVEMENTS.length);
    for (const a of ACHIEVEMENTS) {
      expect(a.goal, a.id).toBeGreaterThan(0);
      expect(a.xp, a.id).toBeGreaterThan(0);
      expect(a.name.trim().length, a.id).toBeGreaterThan(0);
      expect(a.description.trim().length, a.id).toBeGreaterThan(0);
    }
  });

  it('도감 완성·지식 박사의 목표는 실제 규칙·지식 개수와 같다(새 규칙·지식을 추가해도 따라간다)', () => {
    expect(ACHIEVEMENTS.find((a) => a.id === 'rules-all')?.goal).toBe(RULE_IDS.length);
    expect(ACHIEVEMENTS.find((a) => a.id === 'tips-all')?.goal).toBe(TIPS.length);
  });

  it('도달할 수 없는 목표가 없다(규칙 종류 수 이하)', () => {
    for (const a of ACHIEVEMENTS.filter((x) => x.metric === 'rulesLearned')) expect(a.goal).toBeLessThanOrEqual(RULE_IDS.length);
  });
});

describe('buildCodex', () => {
  it('아직 못 배운 규칙은 이름을 숨기고, 배운 것·고친 것을 구분한다', () => {
    let g = emptyGrowth();
    g = applyEvent(g, { kind: 'confirm', ruleId: 'img-alt', correct: true }, at(2026, 11, 25), ctx).growth;
    g = applyEvent(g, { kind: 'confirm', ruleId: 'contrast', correct: false }, at(2026, 11, 25), ctx).growth;
    g = applyEvent(g, { kind: 'fix', ruleId: 'contrast' }, at(2026, 11, 25), ctx).growth;
    const codex = buildCodex(g, ctx, at(2026, 11, 25));
    const byId = Object.fromEntries(codex.rules.map((r) => [r.id, r]));
    expect(byId['img-alt']).toMatchObject({ status: 'learned', confirms: 1 });
    expect(byId['img-alt']?.title).not.toBe('???');
    expect(byId['contrast']).toMatchObject({ status: 'fixed', confirms: 1, fixes: 1 });
    expect(byId['form-label']).toMatchObject({ status: 'unseen', title: '???' });
    expect(codex.rulesLearned).toBe(2);
    expect(codex.rulesTotal).toBe(RULE_IDS.length);
    expect(codex.rules).toHaveLength(RULE_IDS.length);
  });

  it('업적의 진행도는 목표를 넘지 않고, 달성한 것은 목표까지 채워 보여 준다', () => {
    let g = emptyGrowth();
    for (let i = 0; i < 12; i++) g = applyEvent(g, { kind: 'confirm', ruleId: 'img-alt', correct: false }, at(2026, 11, 25), ctx).growth;
    const codex = buildCodex(g, ctx, at(2026, 11, 25));
    const c10 = codex.achievements.find((a) => a.id === 'confirm-10');
    expect(c10).toMatchObject({ unlocked: true, progress: 10, goal: 10 });
    const c50 = codex.achievements.find((a) => a.id === 'confirm-50');
    expect(c50).toMatchObject({ unlocked: false, progress: 12, goal: 50 });
  });

  it('스트릭이 끊겨도 달성한 스트릭 업적은 그대로 달성이다', () => {
    let g = emptyGrowth();
    for (const d of [1, 2, 3]) g = applyEvent(g, { kind: 'care', care: 'touch' }, at(2026, 11, d), ctx).growth;
    const codex = buildCodex(g, ctx, at(2026, 11, 25));
    expect(codex.streak).toMatchObject({ current: 0, best: 3, totalDays: 3 });
    expect(codex.achievements.find((a) => a.id === 'streak-3')?.unlocked).toBe(true);
  });
});

describe('sanitizeGrowth', () => {
  it('아무 값이나 와도 빈 성장 기록이다', () => {
    for (const bad of [undefined, null, 'x', 5, []]) expect(sanitizeGrowth(bad)).toEqual(emptyGrowth());
  });

  it('정상 값은 그대로 받는다', () => {
    const g: Growth = {
      days: ['2026-11-24', '2026-11-25'],
      counters: { confirms: 3, fixes: 1, quizCorrect: 2, tips: 4, care: 9 },
      rules: { 'img-alt': { confirms: 2, fixes: 1 } },
      achievements: { 'first-confirm': 123 },
    };
    expect(sanitizeGrowth(JSON.parse(JSON.stringify(g)))).toEqual(g);
  });

  it('이상한 항목은 버리거나 0 으로 만든다(음수·소수·문자열·모르는 규칙·모르는 업적·잘못된 날짜)', () => {
    const g = sanitizeGrowth({
      days: ['2026-11-25', 'yesterday', 5, '2026-11-25'],
      counters: { confirms: -3, fixes: 2.9, quizCorrect: '4', tips: Infinity, care: 7 },
      rules: { 'img-alt': { confirms: 'x', fixes: 2 }, hacker: { confirms: 99 } },
      achievements: { 'first-confirm': 5, nope: 6, 'fix-10': 'late' },
    });
    expect(g.days).toEqual(['2026-11-25']);
    expect(g.counters).toEqual({ confirms: 0, fixes: 2, quizCorrect: 0, tips: 0, care: 7 });
    expect(g.rules).toEqual({ 'img-alt': { confirms: 0, fixes: 2 } });
    expect(g.achievements).toEqual({ 'first-confirm': 5 });
  });
});

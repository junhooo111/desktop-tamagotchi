import { describe, expect, it } from 'vitest';
import {
  HATCH_XP,
  applyElapsed,
  createPet,
  feed,
  learn,
  levelOf,
  moodOf,
  play,
  QUIZ_BONUS,
  stageOf,
  statusText,
  touch,
  type PetState,
} from './pet.js';

const T0 = 1_000_000;
const base = (over: Partial<PetState> = {}): PetState => ({ ...createPet('cat', T0), ...over });
const hatched = (over: Partial<PetState> = {}): PetState => base({ xp: HATCH_XP, ...over });

describe('레벨과 단계', () => {
  it('경험치가 쌓이면 레벨이 오른다', () => {
    expect(levelOf(0)).toBe(1);
    expect(levelOf(10)).toBe(2);
    expect(levelOf(40)).toBe(3);
    expect(levelOf(160)).toBe(5);
  });

  it('알 → 새끼 → 성체 순서로 바뀐다', () => {
    expect(stageOf(base({ xp: HATCH_XP - 1 }))).toBe('egg');
    expect(stageOf(base({ xp: HATCH_XP }))).toBe('baby');
    expect(stageOf(base({ xp: 159 }))).toBe('baby');
    expect(stageOf(base({ xp: 160 }))).toBe('adult');
  });
});

describe('applyElapsed', () => {
  it('흐른 시간만큼 배고픔과 기분이 줄고 마지막 반영 시각이 갱신된다', () => {
    const r = applyElapsed(base({ hunger: 80, happiness: 80 }), T0 + 60 * 60_000);
    expect(r.hunger).toBeCloseTo(70); // 60분 / 6분
    expect(r.happiness).toBeCloseTo(74); // 60분 / 10분
    expect(r.lastTickAt).toBe(T0 + 60 * 60_000);
  });

  it('아주 오래 꺼 두어도 0 아래로 내려가지 않는다', () => {
    const r = applyElapsed(base(), T0 + 30 * 24 * 60 * 60_000);
    expect(r.hunger).toBe(0);
    expect(r.happiness).toBe(0);
  });

  it('시계가 거꾸로 가도 값이 늘거나 시각이 뒤로 가지 않는다', () => {
    const r = applyElapsed(base(), T0 - 10_000);
    expect(r.hunger).toBe(80);
    expect(r.lastTickAt).toBe(T0);
  });

  it('원본 객체를 바꾸지 않는다', () => {
    const p = base();
    applyElapsed(p, T0 + 600_000);
    expect(p.hunger).toBe(80);
  });
});

describe('moodOf', () => {
  it('배고픔 > 우울 > 행복 > 보통 순으로 판정한다', () => {
    expect(moodOf(base({ hunger: 10, happiness: 10 }))).toBe('hungry');
    expect(moodOf(base({ hunger: 80, happiness: 10 }))).toBe('sad');
    expect(moodOf(base({ hunger: 90, happiness: 90 }))).toBe('happy');
    expect(moodOf(base({ hunger: 50, happiness: 50 }))).toBe('normal');
  });
});

describe('touch', () => {
  it('알은 5초 쿨다운으로 경험치 2씩 오른다', () => {
    const first = touch(base(), T0 + 100_000);
    expect(first.ok).toBe(true);
    expect(first.pet.xp).toBe(2);
    const tooSoon = touch(first.pet, T0 + 100_000 + 4_999);
    expect(tooSoon.ok).toBe(false);
    expect(tooSoon.message).toBe('');
    expect(touch(first.pet, T0 + 100_000 + 5_000).ok).toBe(true);
  });

  it('알이 마지막 경험치를 받으면 부화 문구가 나온다', () => {
    const r = touch(base({ xp: HATCH_XP - 2 }), T0 + 100_000);
    expect(stageOf(r.pet)).toBe('baby');
    expect(r.message).toContain('부화');
    expect(r.message).toContain('고양이');
  });

  it('부화한 뒤에는 30초 쿨다운이고 경험치 1, 기분 +3이다', () => {
    const r = touch(hatched({ happiness: 50 }), T0 + 100_000);
    expect(r.pet.xp).toBe(HATCH_XP + 1);
    expect(r.pet.happiness).toBe(53);
    expect(touch(r.pet, T0 + 100_000 + 29_999).ok).toBe(false);
    expect(touch(r.pet, T0 + 100_000 + 30_000).ok).toBe(true);
  });
});

describe('feed', () => {
  it('알에게는 밥을 줄 수 없다', () => {
    const r = feed(base());
    expect(r.ok).toBe(false);
    expect(r.pet).toEqual(base());
  });

  it('배고픔이 90 이상이면 거절한다', () => {
    expect(feed(hatched({ hunger: 90 })).ok).toBe(false);
    expect(feed(hatched({ hunger: 89 })).ok).toBe(true);
  });

  it('배고픔 +30(최대 100), 경험치 +5', () => {
    const r = feed(hatched({ hunger: 50 }));
    expect(r.pet.hunger).toBe(80);
    expect(r.pet.xp).toBe(HATCH_XP + 5);
    expect(feed(hatched({ hunger: 85 })).pet.hunger).toBe(100);
  });

  it('레벨이 오르면 문구에 레벨이 붙는다', () => {
    const r = feed(hatched({ hunger: 10, xp: 38 }));
    expect(levelOf(r.pet.xp)).toBe(3);
    expect(r.message).toContain('레벨 3');
  });
});

describe('play', () => {
  it('알은 못 놀고, 너무 배고파도 못 논다', () => {
    expect(play(base()).ok).toBe(false);
    const hungry = play(hatched({ hunger: 14 }));
    expect(hungry.ok).toBe(false);
    expect(hungry.message).toContain('배고파');
  });

  it('기분 +25(최대 100), 배고픔 -5, 경험치 +8', () => {
    const r = play(hatched({ hunger: 50, happiness: 50 }));
    expect(r.pet.happiness).toBe(75);
    expect(r.pet.hunger).toBe(45);
    expect(r.pet.xp).toBe(HATCH_XP + 8);
    expect(play(hatched({ happiness: 90 })).pet.happiness).toBe(100);
  });
});

describe('learn', () => {
  it('카드를 확인하면 경험치 +10, 고친 걸 확인하면 +20 을 준다', () => {
    const a = learn(hatched(), 'confirm');
    expect(a.pet.xp).toBe(HATCH_XP + 10);
    expect(a.message).toContain('+10');
    const b = learn(hatched(), 'fixed');
    expect(b.pet.xp).toBe(HATCH_XP + 20);
    expect(b.message).toContain('+20');
    expect(a.ok && b.ok).toBe(true);
  });

  it('퀴즈를 맞히면 보너스 +5 가 더해지고, 지식을 읽으면 +2 다', () => {
    const quiz = learn(hatched(), 'confirm', QUIZ_BONUS);
    expect(quiz.pet.xp).toBe(HATCH_XP + 15);
    expect(quiz.message).toContain('정답');
    expect(quiz.message).toContain('+15');
    const tip = learn(hatched(), 'tip');
    expect(tip.pet.xp).toBe(HATCH_XP + 2);
    expect(tip.message).toContain('+2');
    expect(learn(hatched(), 'confirm').message).not.toContain('정답');
  });

  it('경험치로 알이 부화하거나 레벨이 오르면 문구가 붙는다', () => {
    expect(learn(base({ xp: HATCH_XP - 5 }), 'confirm').message).toContain('부화');
    expect(learn(hatched({ xp: 35 }), 'confirm').message).toContain('레벨 3');
  });

  it('원본 펫을 바꾸지 않는다', () => {
    const p = hatched();
    learn(p, 'fixed');
    expect(p.xp).toBe(HATCH_XP);
  });
});

describe('statusText', () => {
  it('알이면 종 이름을 숨긴다', () => {
    expect(statusText(base())).toContain('알 · 알 · Lv.1');
    expect(statusText(hatched())).toContain('고양이 · 새끼 · Lv.2');
  });

  it('이름이 있으면 이름(종)으로 보여 주고, 알은 이름을 숨긴다', () => {
    expect(statusText(hatched(), '콩이')).toContain('콩이(고양이) · 새끼');
    expect(statusText(base(), '콩이')).toContain('알 · 알');
  });
});

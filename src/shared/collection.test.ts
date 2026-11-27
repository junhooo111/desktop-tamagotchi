import { describe, expect, it } from 'vitest';
import {
  CARE_PER_TICKET,
  COST,
  DAILY_TICKETS,
  DUPLICATE_XP,
  LEGEND_PITY,
  PULLED_START_XP,
  WELCOME_TICKETS,
  buildCollectionView,
  claimCare,
  claimDaily,
  percentEach,
  levelRewards,
  migrateCollection,
  newOwned,
  ownedIds,
  pullCosmetic,
  pullSpecies,
  rollSpecies,
  sanitizeCollection,
  startCollection,
  switchActive,
  syncActive,
  ticketsForLevel,
  type Collection,
} from './collection.js';
import { LEGEND_LEVEL, createPet, levelOf, stageOf } from './pet.js';
import { GRADE_PERCENT, RARITIES } from './rarity.js';
import { ACCESSORIES, HIDDEN_SPECIES, SPECIES, VARIANTS, speciesOf } from './species.js';

const NOW = 1_000_000;
const start = (): Collection => startCollection({ ...createPet('cat', NOW), xp: 300 }, NOW);
const withTickets = (c: Collection, tickets: number): Collection => ({ ...c, tickets });
/** 정해 둔 값을 차례로 돌려주는 난수(다 쓰면 마지막 값 반복) */
const seq = (...values: number[]) => {
  let i = 0;
  return () => values[Math.min(i++, values.length - 1)] ?? 0;
};

describe('확률', () => {
  it('등급 합계는 일반 50·고급 24·희귀 15·특별 7·전설 3·히든 1(합 100)이고, 같은 등급 안에서는 종이 똑같이 나눈다', () => {
    expect(RARITIES.reduce((n, r) => n + GRADE_PERCENT[r], 0)).toBe(100);
    expect(speciesOf('common')).toHaveLength(7);
    expect(speciesOf('uncommon').map((s) => s.id)).toEqual(['hamster', 'bear', 'pig']);
    expect(speciesOf('rare').map((s) => s.id)).toEqual(['owl', 'sheep', 'otter', 'alpaca', 'parrot', 'raccoon']);
    expect(speciesOf('special').map((s) => s.id)).toEqual(['panda', 'penguin', 'redpanda', 'arcticfox', 'peacock', 'lion']);
    expect(speciesOf('legend').map((s) => s.id)).toEqual(['dragon', 'unicorn', 'kumiho', 'griffin']);
    expect(HIDDEN_SPECIES.map((s) => s.id)).toEqual(['azure', 'whitetiger', 'tortoise', 'phoenix', 'qilin']);
    expect(percentEach('common')).toBeCloseTo(50 / 7);
    expect(percentEach('uncommon')).toBeCloseTo(8);
    expect(percentEach('rare')).toBeCloseTo(2.5);
    expect(percentEach('legend')).toBeCloseTo(0.75);
    expect(percentEach('hidden')).toBeCloseTo(0.2);
    expect(SPECIES.reduce((n, s) => n + percentEach(s.rarity), 0)).toBeCloseTo(100);
  });

  it('rollSpecies: 낮은 등급부터 누적 구간으로 나뉜다(일반 0~50 · 고급 ~74 · 희귀 ~89 · 특별 ~96 · 전설 ~99 · 히든 ~100)', () => {
    expect(rollSpecies(() => 0, 0)).toEqual({ id: 'rabbit', rarity: 'common', hidden: false });
    expect(rollSpecies(() => 0.4999, 0).id).toBe('fox'); // 일반의 마지막
    expect(rollSpecies(() => 0.5001, 0)).toEqual({ id: 'hamster', rarity: 'uncommon', hidden: false });
    expect(rollSpecies(() => 0.7399, 0).id).toBe('pig');
    expect(rollSpecies(() => 0.7401, 0)).toEqual({ id: 'owl', rarity: 'rare', hidden: false });
    expect(rollSpecies(() => 0.7649, 0).id).toBe('owl');
    expect(rollSpecies(() => 0.7651, 0).id).toBe('sheep');
    expect(rollSpecies(() => 0.8149, 0).id).toBe('otter');
    expect(rollSpecies(() => 0.8399, 0).id).toBe('alpaca');
    expect(rollSpecies(() => 0.8649, 0).id).toBe('parrot');
    expect(rollSpecies(() => 0.8899, 0).id).toBe('raccoon');
    expect(rollSpecies(() => 0.8901, 0)).toEqual({ id: 'panda', rarity: 'special', hidden: false });
    expect(rollSpecies(() => 0.9599, 0).id).toBe('lion'); // 특별의 마지막
    expect(rollSpecies(() => 0.9601, 0)).toEqual({ id: 'dragon', rarity: 'legend', hidden: false });
    expect(rollSpecies(() => 0.9669, 0).id).toBe('dragon');
    expect(rollSpecies(() => 0.9701, 0).id).toBe('unicorn');
    expect(rollSpecies(() => 0.9801, 0).id).toBe('kumiho');
    expect(rollSpecies(() => 0.9899, 0).id).toBe('griffin'); // 전설의 마지막
    expect(rollSpecies(() => 0.9901, 0)).toEqual({ id: 'azure', rarity: 'hidden', hidden: true });
    expect(rollSpecies(() => 0.9999, 0)).toEqual({ id: 'qilin', rarity: 'hidden', hidden: true });
  });

  it('난수를 고르게 뿌리면 종마다 표의 확률에 가깝게 나온다', () => {
    const counts: Record<string, number> = {};
    const N = 200_000;
    for (let i = 0; i < N; i++) {
      const r = rollSpecies(() => (i + 0.5) / N, 0);
      counts[r.id] = (counts[r.id] ?? 0) + 1;
    }
    for (const s of SPECIES) expect((counts[s.id] ?? 0) / N, s.id).toBeCloseTo(percentEach(s.rarity) / 100, 3);
  });

  it('천장: 전설이 안 나온 채 쌓이면 다음 뽑기는 반드시 전설이고, 히든은 천장으로 나오지 않는다', () => {
    expect(rollSpecies(() => 0.5, LEGEND_PITY - 2).rarity).toBe('common');
    expect(rollSpecies(() => 0.5, LEGEND_PITY - 1)).toEqual({ id: 'kumiho', rarity: 'legend', hidden: false }); // 전설 4종 중 고른다
    expect(rollSpecies(() => 0, LEGEND_PITY - 1).id).toBe('dragon');
    expect(rollSpecies(() => 0.9999, LEGEND_PITY - 1).rarity).toBe('legend'); // 난수가 히든 구간이어도 천장이면 전설
    expect(rollSpecies(() => 0.9999, LEGEND_PITY - 2).rarity).toBe('hidden'); // 천장이 아니면 히든도 그냥 나온다
  });
});

describe('동물 뽑기', () => {
  it('뽑기권이 모자라면 아무것도 바뀌지 않는다', () => {
    const c = withTickets(start(), COST.species - 1);
    const r = pullSpecies(c, NOW, () => 0.5);
    expect(r.result).toMatchObject({ ok: false });
    expect(r.collection).toBe(c);
  });

  it('처음 나온 동물은 새끼로 컬렉션에 들어오고, 뽑기권과 횟수가 바뀐다', () => {
    const c = withTickets(start(), 5);
    const { collection, result } = pullSpecies(c, NOW, () => 0.75); // 부엉이(희귀)
    expect(result).toMatchObject({ ok: true, id: 'owl', rarity: 'rare', isNew: true, hidden: false, count: 1, xpBonus: 0 });
    expect(collection.tickets).toBe(5 - COST.species);
    expect(collection.pulls).toBe(1);
    expect(collection.owned.owl).toMatchObject({ count: 1, name: '' });
    expect(collection.owned.owl!.pet.xp).toBe(PULLED_START_XP);
    expect(stageOf(collection.owned.owl!.pet)).toBe('baby'); // 알이 아니라 바로 새끼로 나온다
    expect(collection.active).toBe('cat'); // 꺼내는 건 따로 한다
  });

  it('이미 가진 동물이 나오면 중복으로 세고, 그 동물이 경험치를 받는다', () => {
    const c = withTickets(start(), 10);
    const first = pullSpecies(c, NOW, () => 0.75).collection;
    const { collection, result } = pullSpecies(first, NOW, () => 0.75);
    expect(result).toMatchObject({ ok: true, id: 'owl', isNew: false, count: 2, xpBonus: DUPLICATE_XP });
    expect(collection.owned.owl!.count).toBe(2);
    expect(collection.owned.owl!.pet.xp).toBe(PULLED_START_XP + DUPLICATE_XP);
  });

  it('전설이나 히든이 나오면 천장 카운터가 0 으로 돌아가고, 아니면 늘어난다', () => {
    const c = { ...withTickets(start(), 20), sinceHidden: 7 };
    const legend = pullSpecies(c, NOW, () => 0.9601).collection;
    expect(legend.sinceHidden).toBe(0);
    expect(legend.owned.dragon).toBeDefined();
    const hidden = pullSpecies({ ...legend, sinceHidden: 9 }, NOW, () => 0.995).collection;
    expect(hidden.sinceHidden).toBe(0);
    expect(hidden.owned.tortoise).toBeDefined();
    const common = pullSpecies(hidden, NOW, () => 0.1).collection;
    expect(common.sinceHidden).toBe(1);
  });

  it('뽑기를 거듭하면 천장 안에 반드시 전설이 한 번은 나온다', () => {
    let c = withTickets(start(), 1_000);
    let n = 0;
    let rng = 0.3;
    for (; n < LEGEND_PITY; n++) {
      rng = (rng * 7 + 0.13) % 1 || 0.3;
      const r = pullSpecies(c, NOW, () => Math.min(0.9, rng)); // 일부러 전설·히든 구간을 피하는 난수
      c = r.collection;
      if (r.result.ok && r.result.rarity === 'legend') break;
    }
    expect(n).toBeLessThan(LEGEND_PITY);
  });
});

describe('꾸미기 뽑기', () => {
  const all = { accessories: ACCESSORIES, variants: VARIANTS };
  const none = { accessories: new Set<never>(), variants: new Set<never>() };

  it('뽑기권이 모자라면 못 뽑는다', () => {
    const c = withTickets(start(), COST.cosmetic - 1);
    expect(pullCosmetic(c, all, none, () => 0).result).toMatchObject({ ok: false });
  });

  it('아직 못 가진 장식·색 중에서 하나를 뽑아 가진 목록에 넣고 뽑기권을 쓴다', () => {
    const c = withTickets(start(), 4);
    const { collection, result } = pullCosmetic(c, all, none, () => 0);
    expect(result).toMatchObject({ ok: true, item: { kind: 'accessory', id: 'ribbon' } });
    expect(collection.tickets).toBe(4 - COST.cosmetic);
    expect(collection.accessories).toEqual(['ribbon']);
  });

  it('색도 뽑히고, 이미 업적으로 연 것이나 이미 뽑은 것은 후보에서 빠진다', () => {
    const c = withTickets({ ...start(), accessories: ['ribbon'] }, 10);
    const unlocked = { accessories: new Set(['glasses' as const]), variants: new Set(['pastel' as const]) };
    const seen = new Set<string>();
    for (let i = 0; i < 200; i++) {
      const r = pullCosmetic(c, all, unlocked, () => i / 200).result;
      if (r.ok) seen.add(`${r.item.kind}:${r.item.id}`);
    }
    expect(seen.has('accessory:ribbon')).toBe(false);
    expect(seen.has('accessory:glasses')).toBe(false);
    expect(seen.has('variant:pastel')).toBe(false);
    expect(seen.has('variant:deep')).toBe(true);
    expect(seen.has('accessory:none')).toBe(false);
    expect(seen.has('variant:default')).toBe(false);
  });

  it('다 모으면 더 뽑을 수 없고 뽑기권도 쓰지 않는다', () => {
    const c = withTickets({ ...start(), accessories: ACCESSORIES.filter((a) => a !== 'none'), variants: VARIANTS.filter((v) => v !== 'default') }, 10);
    const r = pullCosmetic(c, all, none, () => 0);
    expect(r.result).toMatchObject({ ok: false, reason: expect.stringContaining('모두') });
    expect(r.collection.tickets).toBe(10);
  });
});

describe('뽑기권을 버는 길', () => {
  it('레벨 보상: 5·10·15…는 2장, 8·13·18…은 1장, 나머지와 레벨 5 미만은 없다', () => {
    expect(Array.from({ length: 21 }, (_, i) => ticketsForLevel(i + 1))).toEqual([0, 0, 0, 0, 2, 0, 0, 1, 0, 2, 0, 0, 1, 0, 2, 0, 0, 1, 0, 2, 0]);
  });

  it('levelRewards: 아직 안 준 레벨 보상을 한꺼번에 주고, 같은 보상을 두 번 주지 않는다', () => {
    const c = start(); // 고양이 xp 300 → 레벨 6, 보상 이미 받은 것으로 시작
    expect(levelRewards(c, 'cat').tickets).toBe(0);
    const up = { ...c, owned: { cat: { ...c.owned.cat!, pet: { ...c.owned.cat!.pet, xp: 10 * 9 ** 2 } } } }; // 레벨 10
    const r = levelRewards(up, 'cat');
    expect(r.level).toBe(10);
    expect(r.tickets).toBe(ticketsForLevel(8) + ticketsForLevel(10));
    expect(r.collection.tickets).toBe(up.tickets + r.tickets);
    expect(levelRewards(r.collection, 'cat').tickets).toBe(0);
  });

  it('동물마다 레벨 보상을 따로 센다(새로 뽑은 동물의 낮은 레벨에는 보상이 없다)', () => {
    const c = pullSpecies(withTickets(start(), 3), NOW, () => 0.75).collection;
    expect(levelRewards(c, 'owl').tickets).toBe(0);
  });

  it('출석 보상은 하루에 한 번이다', () => {
    const c = start();
    const a = claimDaily(c, '2026-11-26');
    expect(a.tickets).toBe(DAILY_TICKETS);
    expect(a.collection.tickets).toBe(c.tickets + DAILY_TICKETS);
    expect(claimDaily(a.collection, '2026-11-26').tickets).toBe(0);
    expect(claimDaily(a.collection, '2026-11-27').tickets).toBe(DAILY_TICKETS);
  });

  it(`돌봄 ${CARE_PER_TICKET}번마다 1장, 이미 받은 만큼은 다시 주지 않는다`, () => {
    const c = start();
    expect(claimCare(c, CARE_PER_TICKET - 1).tickets).toBe(0);
    const a = claimCare(c, CARE_PER_TICKET);
    expect(a.tickets).toBe(1);
    expect(claimCare(a.collection, CARE_PER_TICKET + 5).tickets).toBe(0);
    expect(claimCare(a.collection, CARE_PER_TICKET * 3).tickets).toBe(2);
  });

  it('돌보기·출석만으로도 뽑을 수 있다(FE 문제를 고치지 않아도)', () => {
    // 시작 뽑기권 + 며칠 출석 + 돌봄 으로 동물 한 번(3장)은 금방 가능하다.
    expect(WELCOME_TICKETS).toBeGreaterThanOrEqual(COST.species);
  });
});

describe('시작과 옮겨 오기', () => {
  it('startCollection: 받은 동물 하나와 시작 뽑기권', () => {
    const c = start();
    expect(ownedIds(c)).toEqual(['cat']);
    expect(c).toMatchObject({ active: 'cat', tickets: WELCOME_TICKETS, pulls: 0 });
    expect(c.owned.cat!.rewardedLevel).toBe(levelOf(300));
  });

  it('예전 버전에서 올라오면 이미 업적으로 열어 둔 동물도 새끼로 함께 넣어 준다', () => {
    const pet = { ...createPet('cat', NOW), xp: 300 };
    const c = migrateCollection(pet, { 'first-confirm': 1, 'fix-10': 1 }, NOW, '콩이');
    expect(ownedIds(c)).toEqual(['cat', 'fox', 'penguin']);
    expect(c.owned.cat!.name).toBe('콩이');
    expect(c.owned.fox!.pet.xp).toBe(PULLED_START_XP);
    expect(c.active).toBe('cat');
    // 지금 키우는 동물이 열어 둔 동물이면 중복해서 넣지 않는다
    expect(ownedIds(migrateCollection({ ...pet, speciesId: 'fox' }, { 'first-confirm': 1 }, NOW))).toEqual(['fox']);
  });
});

describe('한 마리만 꺼내기', () => {
  const two = (): Collection => pullSpecies(withTickets(start(), 6), NOW, () => 0.75).collection; // 고양이 + 부엉이

  it('가진 동물만 꺼낼 수 있다', () => {
    expect(switchActive(two(), 'dragon', createPet('cat', NOW), '', NOW)).toBeNull();
  });

  it('바꾸면 지금 동물의 상태·이름이 저장되고, 꺼낸 동물은 자기 상태·이름으로 나온다', () => {
    const c = two();
    const cat = { ...c.owned.cat!.pet, xp: 777, hunger: 12 };
    const r = switchActive(c, 'owl', cat, '야옹이', NOW + 5_000)!;
    expect(r.collection.active).toBe('owl');
    expect(r.collection.owned.cat).toMatchObject({ name: '야옹이' });
    expect(r.collection.owned.cat!.pet).toMatchObject({ xp: 777, hunger: 12 }); // 넣어 둔 동안 상태가 그대로다
    expect(r.pet.speciesId).toBe('owl');
    expect(r.pet.xp).toBe(PULLED_START_XP);
    expect(r.pet.lastTickAt).toBe(NOW + 5_000); // 꺼낸 순간부터 시간이 흐른다
    expect(r.name).toBe('');
    // 다시 고양이로 돌아오면 저장해 둔 상태 그대로다
    const back = switchActive(r.collection, 'cat', r.pet, '', NOW + 9_000)!;
    expect(back.pet).toMatchObject({ xp: 777, hunger: 12, lastTickAt: NOW + 9_000 });
    expect(back.name).toBe('야옹이');
  });

  it('이미 꺼낸 동물을 고르면 그대로다', () => {
    const c = two();
    const r = switchActive(c, 'cat', c.owned.cat!.pet, '', NOW)!;
    expect(r.collection.active).toBe('cat');
  });

  it('syncActive: 지금 동물의 상태를 컬렉션에 반영하고, 바뀐 게 없으면 같은 객체를 돌려준다', () => {
    const c = start();
    expect(syncActive(c, c.owned.cat!.pet, '')).toBe(c);
    const grown = syncActive(c, { ...c.owned.cat!.pet, xp: 999 }, '두부');
    expect(grown.owned.cat).toMatchObject({ name: '두부' });
    expect(grown.owned.cat!.pet.xp).toBe(999);
  });
});

describe('화면에 보여 줄 값', () => {
  it('모든 동물을 보여 주고 가진 것·꺼낸 것을 표시하며, 천장까지 남은 수를 센다', () => {
    const c = pullSpecies(withTickets(start(), 3), NOW, () => 0.75).collection;
    const v = buildCollectionView(c, 5);
    expect(v.entries).toHaveLength(31);
    expect(v.ownedCount).toBe(2);
    expect(v.total).toBe(31);
    expect(v.entries.find((e) => e.id === 'cat')).toMatchObject({ owned: true, active: true, level: 6, stage: 'adult' });
    expect(v.entries.find((e) => e.id === 'owl')).toMatchObject({ owned: true, active: false, stage: 'baby', count: 1 });
    expect(v.entries.find((e) => e.id === 'azure')).toMatchObject({ owned: false, hidden: true, rarity: 'hidden' });
    expect(v.entries.find((e) => e.id === 'dragon')).toMatchObject({ owned: false, hidden: false, rarity: 'legend' }); // 전설은 이름을 숨기지 않는다
    expect(v.entries.find((e) => e.id === 'owl')!.rarity).toBe('rare');
    expect(v.untilPity).toBe(LEGEND_PITY - 1);
    expect(v.cosmeticLeft).toBe(5);
    expect(v.chances.map((c) => [c.rarity, c.count, c.total])).toEqual([['common', 7, 50], ['uncommon', 3, 24], ['rare', 6, 15], ['special', 6, 7], ['legend', 4, 3], ['hidden', 5, 1]]);
    expect(v.chances.find((c) => c.rarity === 'hidden')!.each).toBeCloseTo(0.2);
  });

  it('히든 동물이 충분히 자라면 전설 단계로 보인다', () => {
    const c = start();
    const dragon = newOwned('dragon', NOW, 10 * (LEGEND_LEVEL - 1) ** 2);
    const v = buildCollectionView({ ...c, owned: { ...c.owned, dragon } }, 0);
    expect(v.entries.find((e) => e.id === 'dragon')).toMatchObject({ stage: 'legend', level: LEGEND_LEVEL });
  });
});

describe('저장 파일 검증', () => {
  const ok = JSON.parse(JSON.stringify(start()));
  const clean = (raw: unknown) => sanitizeCollection(raw, ACCESSORIES, VARIANTS);

  it('멀쩡한 컬렉션은 그대로 읽는다', () => {
    expect(clean(ok)).toEqual(start());
  });

  it('깨졌거나 비어 있으면 null 이라 예전 저장에서 옮겨 오게 한다', () => {
    for (const bad of [null, undefined, 1, 'x', [], {}, { owned: {} }, { owned: { cat: { pet: 'x' } } }]) expect(clean(bad)).toBeNull();
  });

  it('이상한 항목만 버리고 나머지는 살린다(모르는 동물·음수·범위 밖 값·없는 장식)', () => {
    const raw = {
      ...ok,
      owned: { ...ok.owned, chimera: ok.owned.cat, dog: { pet: { xp: 5, hunger: 500, happiness: -3, lastTickAt: 1 }, name: '<b>멍멍</b>', count: -4 } },
      tickets: -7,
      accessories: ['ribbon', 'laser', 3],
      variants: ['mono', 'neon'],
      active: 'chimera',
      lastDaily: 'yesterday',
    };
    const c = clean(raw)!;
    expect(ownedIds(c)).toEqual(['cat', 'dog']);
    expect(c.owned.dog!.pet).toMatchObject({ hunger: 100, happiness: 0, clean: 100 });
    expect(c.owned.dog!.name).toBe('b멍멍/b');
    expect(c.owned.dog!.count).toBe(1);
    expect(c.tickets).toBe(0);
    expect(c.accessories).toEqual(['ribbon']);
    expect(c.variants).toEqual(['mono']);
    expect(c.active).toBe('cat'); // 없는 동물이면 가진 동물 중 첫 번째
    expect(c.lastDaily).toBe('');
  });
});

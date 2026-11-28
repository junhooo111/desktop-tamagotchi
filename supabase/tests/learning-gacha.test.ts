import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { COST, DAILY_TICKETS, LEGEND_PITY, WELCOME_TICKETS, percentEach } from '../../src/shared/collection.js';
import { GRADE_PERCENT, RARITIES } from '../../src/shared/rarity.js';
import { COSMETIC_ITEMS, COSMETIC_PITY } from '../../src/shared/cosmetics.js';
import { SPECIES } from '../../src/shared/species.js';
import { admin, as, coinsOf, createDb, errorOf, givePet, ledgerMismatches, setTickets, signUp, ticketMismatches, ticketsOf, type Db } from './helpers.js';

let db: Db;

beforeAll(async () => {
  db = await createDb();
}, 60_000);

afterAll(async () => {
  expect(await ledgerMismatches(db)).toEqual([]);
  expect(await ticketMismatches(db)).toEqual([]); // 어떤 테스트를 거쳐도 재화와 원장이 어긋나지 않는다
  await db.close();
});

const uuid = (n: number): string => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const ev = (n: number, kind: string) => ({ id: uuid(n), kind });

const report = async (user: string, events: unknown): Promise<{ granted: number; ignored: number; coins: number }> =>
  as(db, user, async () => (await db.query<{ r: { granted: number; ignored: number; coins: number } }>(
    'select public.report_learning($1::jsonb) as r', [JSON.stringify(events)])).rows[0]!.r);

const equipped = async (user: string): Promise<string | null> =>
  (await db.query<{ e: string | null }>('select equipped_pet_id as e from public.profiles where user_id = $1', [user])).rows[0]!.e;

describe('학습 이벤트 보고 (report_learning)', () => {
  it('종류별로 서버가 정한 양만큼 재화를 주고 원장에 남긴다(앱이 양을 정할 수 없다)', async () => {
    const u = await signUp(db, 'learner1');
    const res = await report(u, [ev(1, 'confirm'), ev(2, 'quiz_bonus'), ev(3, 'fixed'), ev(4, 'tip')]);
    expect(res).toEqual({ granted: 37, ignored: 0, coins: 137 });
    const reasons = (await db.query('select delta, reason from public.ledger where user_id = $1 and reason = $2 order by delta', [u, 'learn'])).rows;
    expect(reasons).toEqual([{ delta: 2, reason: 'learn' }, { delta: 5, reason: 'learn' }, { delta: 10, reason: 'learn' }, { delta: 20, reason: 'learn' }]);
  });

  it('같은 이벤트를 다시 보내면 무시한다(멱등)', async () => {
    const u = await signUp(db, 'learner2');
    await report(u, [ev(11, 'fixed')]);
    const again = await report(u, [ev(11, 'fixed'), ev(12, 'tip')]);
    expect(again).toEqual({ granted: 2, ignored: 1, coins: 100 + 20 + 2 });
  });

  it('다른 사람이 같은 이벤트 id 를 써도 가로챌 수 없다', async () => {
    const a = await signUp(db, 'learner3a');
    const b = await signUp(db, 'learner3b');
    await report(a, [ev(21, 'fixed')]);
    expect(await report(b, [ev(21, 'fixed')])).toMatchObject({ granted: 0, ignored: 1 });
  });

  it('하루 상한(150)을 넘기면 더 주지 않고, 상한에 걸린 이벤트도 처리된 것으로 기록한다', async () => {
    const u = await signUp(db, 'capped');
    const events = Array.from({ length: 8 }, (_, i) => ev(100 + i, 'fixed')); // 20 x 8 = 160
    const res = await report(u, events);
    expect(res.granted).toBe(150);
    expect(await coinsOf(db, u)).toBe(250);
    // 같은 날 더 보내도 0, 그 이벤트들을 다시 보내도 무시
    expect(await report(u, [ev(200, 'fixed')])).toMatchObject({ granted: 0 });
    expect(await report(u, events)).toMatchObject({ granted: 0, ignored: 8 });
  });

  it('어제 받은 몫은 오늘 상한에 포함되지 않는다', async () => {
    const u = await signUp(db, 'nextday');
    await report(u, Array.from({ length: 8 }, (_, i) => ev(300 + i, 'fixed')));
    await admin(db, "update public.ledger set created_at = now() - interval '2 days' where user_id = $1 and reason = 'learn'", [u]);
    expect(await report(u, [ev(310, 'fixed')])).toMatchObject({ granted: 20 });
  });

  it('장착한 펫이 있으면 받은 양만큼 경험치도 준다', async () => {
    const u = await signUp(db, 'xp1');
    const pet = await givePet(db, u, 'cat', 0);
    await admin(db, 'update public.profiles set equipped_pet_id = $2 where user_id = $1', [u, pet]);
    await report(u, [ev(400, 'confirm'), ev(401, 'quiz_bonus')]);
    const p = (await db.query<{ xp: number; level: number }>('select xp, level from public.pets where id = $1', [pet])).rows[0];
    expect(p).toEqual({ xp: 15, level: 2 });
  });

  it('장착한 펫이 없어도 재화는 받는다', async () => {
    const u = await signUp(db, 'xp2');
    expect(await report(u, [ev(410, 'confirm')])).toMatchObject({ granted: 10 });
  });

  it.each([
    ['배열이 아님', { id: uuid(500), kind: 'confirm' }],
    ['모르는 종류', [ev(501, 'cheat')]],
    ['양을 직접 지정', [{ id: uuid(502), kind: 'confirm', amount: 9999, coins: 9999 }, { id: 'not-a-uuid', kind: 'tip' }]],
    ['id 형식 오류', [{ id: 'abc', kind: 'tip' }]],
    ['종류 없음', [{ id: uuid(503) }]],
    ['51개 초과', Array.from({ length: 51 }, (_, i) => ev(600 + i, 'tip'))],
  ])('잘못된 입력은 거부한다: %s', async (_name, events) => {
    const u = await signUp(db, `bad-${_name}`);
    expect(await errorOf(() => report(u, events))).toMatch(/invalid_events/);
    expect(await coinsOf(db, u)).toBe(100); // 일부만 처리되고 남는 일이 없다
  });

  it('앱이 보낸 amount 같은 추가 필드는 무시되고 서버가 정한 양만 지급된다', async () => {
    const u = await signUp(db, 'extra-fields');
    const res = await report(u, [{ id: uuid(700), kind: 'tip', amount: 9999 }]);
    expect(res.granted).toBe(2);
  });
});

describe('동물 뽑기 (gacha_pull) — 앱 규칙(src/shared/collection.ts)과 같은 값', () => {
  /** 0015 의 원래 가중치로 되돌린다 */
  const restoreWeights = () =>
    admin(db, "update public.species set gacha_weight = case rarity when 'common' then 3000 when 'uncommon' then 3360 when 'rare' then 1050 when 'special' then 490 when 'legend' then 315 else 84 end");

  const pull = async (user: string) =>
    as(db, user, async () => (await db.query<{ r: { pet_id: string; species_id: string; rarity: string; tickets: number } }>(
      'select public.gacha_pull() as r')).rows[0]!.r);

  it('서버의 동물 20종과 가입 선물·확률이 앱의 값과 같다', async () => {
    const rows = (await db.query<{ id: string; rarity: string; gacha_weight: number }>('select id, rarity, gacha_weight from public.species order by id')).rows;
    expect(rows.map((r) => r.id).sort()).toEqual(SPECIES.map((s) => s.id).sort());
    for (const s of SPECIES) expect(rows.find((r) => r.id === s.id)?.rarity, s.id).toBe(s.rarity);
    const total = rows.reduce((n, r) => n + r.gacha_weight, 0);
    // 종마다 확률이 앱의 표(등급 합계를 종이 똑같이 나눔)와 같다
    for (const s of SPECIES) expect(((rows.find((r) => r.id === s.id)?.gacha_weight ?? 0) / total) * 100, s.id).toBeCloseTo(percentEach(s.rarity), 5);
    // 등급 합계는 앱의 GRADE_PERCENT 와 같다
    for (const g of RARITIES) expect(rows.filter((r) => r.rarity === g).reduce((n, r) => n + (r.gacha_weight / total) * 100, 0), g).toBeCloseTo(GRADE_PERCENT[g], 5);
    const u = await signUp(db, 'rules');
    expect(await ticketsOf(db, u)).toBe(WELCOME_TICKETS);
  });

  it('뽑기권 3장을 내고 펫 1마리를 얻으며, 첫 펫은 자동으로 장착되고 원장(뽑기권)에 남는다', async () => {
    const u = await signUp(db, 'puller1');
    const r = await pull(u);
    expect(r.tickets).toBe(WELCOME_TICKETS - COST.species);
    expect(await ticketsOf(db, u)).toBe(0);
    expect(await coinsOf(db, u)).toBe(100); // 게임머니는 건드리지 않는다
    expect(await equipped(u)).toBe(r.pet_id);
    const pet = (await db.query('select species_id, xp, level from public.pets where id = $1', [r.pet_id])).rows[0];
    expect(pet).toMatchObject({ species_id: r.species_id, xp: 0, level: 1 });
    const ledger = (await db.query('select delta, reason, ref_id, currency from public.ledger where user_id = $1 and reason = $2', [u, 'gacha'])).rows;
    expect(ledger).toEqual([{ delta: -COST.species, reason: 'gacha', ref_id: r.pet_id, currency: 'ticket' }]);
  });

  it('이미 장착한 펫이 있으면 새 펫으로 바꾸지 않는다', async () => {
    const u = await signUp(db, 'puller2');
    await setTickets(db, u, 9);
    const first = await pull(u);
    await pull(u);
    expect(await equipped(u)).toBe(first.pet_id);
  });

  it('뽑기권이 모자라면 거절하고 아무것도 바뀌지 않는다', async () => {
    const u = await signUp(db, 'poor');
    await setTickets(db, u, COST.species - 1);
    expect(await errorOf(() => pull(u))).toMatch(/insufficient_tickets/);
    expect(await ticketsOf(db, u)).toBe(COST.species - 1);
    expect((await db.query('select id from public.pets where owner_id = $1', [u])).rows).toHaveLength(0);
  });

  it('게임머니가 많아도 뽑기권이 없으면 뽑을 수 없다(재화가 섞이지 않는다)', async () => {
    const u = await signUp(db, 'rich');
    await setTickets(db, u, 0);
    await admin(db, 'update public.profiles set coins = 9999 where user_id = $1', [u]);
    await admin(db, "insert into public.ledger (user_id, delta, reason, currency) values ($1, 9899, 'learn', 'coin')", [u]);
    expect(await errorOf(() => pull(u))).toMatch(/insufficient_tickets/);
  });

  it('같은 동물이 또 나와도 별개의 펫(개체)이 생긴다 — 경매장에 올릴 수 있게', async () => {
    const u = await signUp(db, 'dupes');
    await setTickets(db, u, COST.species * 3);
    await admin(db, "update public.species set gacha_weight = 0 where id <> 'duck'");
    try {
      for (let i = 0; i < 3; i++) expect((await pull(u)).species_id).toBe('duck');
      expect((await db.query('select id from public.pets where owner_id = $1 and species_id = $2', [u, 'duck'])).rows).toHaveLength(3);
    } finally {
      await restoreWeights();
    }
  });

  it(`전설이 안 나온 채 ${LEGEND_PITY}번 뽑으면 다음은 전설이 확정이고(히든이 아니라), 전설이 나오면 카운트가 0 으로 돌아간다`, async () => {
    const u = await signUp(db, 'pity');
    await setTickets(db, u, COST.species * 12);
    for (let i = 0; i < 10; i++) {
      await admin(db, 'update public.profiles set pity = $2 where user_id = $1', [u, LEGEND_PITY]);
      const r = await pull(u);
      expect(r.rarity, `${i}번째`).toBe('legend');
      expect((await db.query<{ pity: number }>('select pity from public.profiles where user_id = $1', [u])).rows[0]!.pity).toBe(0);
    }
  });

  it('천장 직전(49)까지는 전설이 확정이 아니고, 히든이 나와도 카운트가 0 으로 돌아가며, 히든은 천장으로는 나오지 않는다', async () => {
    const u = await signUp(db, 'pity49');
    await setTickets(db, u, COST.species * 6);
    await admin(db, "update public.species set gacha_weight = 0 where rarity = 'legend'");
    try {
      await admin(db, 'update public.profiles set pity = $2 where user_id = $1', [u, LEGEND_PITY - 1]);
      const r = await pull(u);
      expect(r.rarity).not.toBe('legend');
      if (r.rarity !== 'hidden') expect((await db.query<{ pity: number }>('select pity from public.profiles where user_id = $1', [u])).rows[0]!.pity).toBe(LEGEND_PITY);
      // 전설도 히든도 가중치를 줘 놓고 천장에 닿게 하면, 전설만 나온다(히든 가중치가 아주 커도)
      await admin(db, "update public.species set gacha_weight = 315 where rarity = 'legend'");
      await admin(db, "update public.species set gacha_weight = 100000 where rarity = 'hidden'");
      for (let i = 0; i < 4; i++) {
        await admin(db, 'update public.profiles set pity = $2 where user_id = $1', [u, LEGEND_PITY]);
        expect((await pull(u)).rarity, `${i}번째`).toBe('legend');
      }
    } finally {
      await restoreWeights();
    }
  });

  it('확률: 등급별 비율이 표(일반 50 · 고급 24 · 희귀 15 · 특별 7 · 전설 3 · 히든 1)와 크게 다르지 않다 (천장 영향 제외)', async () => {
    const u = await signUp(db, 'stats');
    const N = 600;
    await setTickets(db, u, N * COST.species);
    for (let i = 0; i < N; i++) {
      await admin(db, 'update public.profiles set pity = 0 where user_id = $1', [u]); // 천장이 분포를 바꾸지 않게
      await pull(u);
    }
    const rows = (await db.query<{ rarity: string; n: number }>(
      `select s.rarity, count(*)::int as n from public.pets p join public.species s on s.id = p.species_id where p.owner_id = $1 group by s.rarity`, [u])).rows;
    const share = Object.fromEntries(rows.map((r) => [r.rarity, r.n / N]));
    // 표본 600 에서 표준편차는 큰 등급이 약 2%, 작은 등급이 1% 안팎이다. 넓은 허용 범위로 우연한 실패를 피한다.
    for (const g of RARITIES) {
      const expected = GRADE_PERCENT[g] / 100;
      const tol = expected >= 0.15 ? 0.09 : 0.05;
      expect(share[g] ?? 0, g).toBeGreaterThan(expected - tol);
      expect(share[g] ?? 0, g).toBeLessThan(expected + tol);
    }
  }, 180_000);
});

describe('꾸미기 뽑기 (gacha_cosmetic)', () => {
  const cosmetic = async (user: string) =>
    as(db, user, async () => (await db.query<{ r: { kind: string; item_id: string; tickets: number } }>('select public.gacha_cosmetic() as r')).rows[0]!.r);

  it(`뽑기권 ${COST.cosmetic}장으로 아직 없는 꾸미기를 하나 얻고 원장에 남는다`, async () => {
    const u = await signUp(db, 'dresser');
    await setTickets(db, u, 5);
    const r = await cosmetic(u);
    expect(r.tickets).toBe(5 - COST.cosmetic);
    expect(['accessory', 'variant']).toContain(r.kind);
    expect((await db.query('select kind, item_id from public.cosmetics where user_id = $1', [u])).rows).toEqual([{ kind: r.kind, item_id: r.item_id }]);
    expect((await db.query("select delta, currency from public.ledger where user_id = $1 and reason = 'gacha_cosmetic'", [u])).rows).toEqual([{ delta: -COST.cosmetic, currency: 'ticket' }]);
  });

  it('서버의 꾸미기 표(종류·등급·뽑기 여부)가 앱의 COSMETIC_ITEMS 와 같다', async () => {
    const rows = (await db.query<{ kind: string; item_id: string; rarity: string; gacha: boolean }>('select kind, item_id, rarity, gacha from public.cosmetic_items order by kind, item_id')).rows;
    const mine = [...COSMETIC_ITEMS].map((i) => ({ kind: i.kind, item_id: i.id, rarity: i.rarity, gacha: i.gacha })).sort((x, y) => (x.kind + x.item_id).localeCompare(y.kind + y.item_id));
    expect(rows).toEqual(mine);
  });

  it('이미 가진 꾸미기는 다시 나오지 않고, 뽑기에 나오는 것만 다 모으면 거절한다(업적 전용 6종은 나오지 않는다)', async () => {
    const u = await signUp(db, 'collector');
    const pool = COSMETIC_ITEMS.filter((i) => i.gacha);
    await setTickets(db, u, COST.cosmetic * (pool.length + 4));
    const seen = new Set<string>();
    for (let i = 0; i < pool.length; i++) {
      const r = await cosmetic(u);
      const key = `${r.kind}:${r.item_id}`;
      expect(seen.has(key), key).toBe(false);
      seen.add(key);
    }
    expect([...seen].sort()).toEqual(pool.map((i) => `${i.kind}:${i.id}`).sort());
    expect(await errorOf(() => cosmetic(u))).toMatch(/all_collected/);
    expect(await ticketsOf(db, u)).toBe(COST.cosmetic * 4);
  });

  it('결과에 등급이 들어 있고, 앱의 표와 같은 등급이다', async () => {
    const u = await signUp(db, 'grader');
    await setTickets(db, u, COST.cosmetic * 6);
    for (let i = 0; i < 6; i++) {
      const r = await as(db, u, async () => (await db.query<{ r: { kind: string; item_id: string; rarity: string } }>('select public.gacha_cosmetic() as r')).rows[0]!.r);
      expect(r.rarity, r.item_id).toBe(COSMETIC_ITEMS.find((x) => x.kind === r.kind && x.id === r.item_id)!.rarity);
    }
  });

  it(`전설이 안 나온 채 ${COSMETIC_PITY}번 뽑으면 다음은 안 가진 전설이 확정이고, 전설이 나오면 카운트가 0 으로 돌아간다`, async () => {
    const u = await signUp(db, 'cpity');
    await setTickets(db, u, COST.cosmetic * 7);
    await admin(db, 'update public.profiles set cosmetic_pity = $2 where user_id = $1', [u, COSMETIC_PITY]);
    const r = await as(db, u, async () => (await db.query<{ r: { item_id: string; rarity: string } }>('select public.gacha_cosmetic() as r')).rows[0]!.r);
    expect(r.rarity).toBe('legend');
    const legends = ['wings', 'flamecrown', 'goldchain', 'flameaura'];
    expect(legends).toContain(r.item_id);
    expect((await db.query<{ c: number }>('select cosmetic_pity as c from public.profiles where user_id = $1', [u])).rows[0]!.c).toBe(0);
    // 천장이면 남은 전설이 나온다(전설은 4종이라 천장마다 하나씩, 안 가진 것으로)
    const got = [r.item_id];
    for (let i = 0; i < 3; i++) {
      await admin(db, 'update public.profiles set cosmetic_pity = $2 where user_id = $1', [u, COSMETIC_PITY]);
      const next = await as(db, u, async () => (await db.query<{ r: { item_id: string; rarity: string } }>('select public.gacha_cosmetic() as r')).rows[0]!.r);
      expect(next.rarity).toBe('legend');
      expect(got.includes(next.item_id)).toBe(false);
      got.push(next.item_id);
    }
    expect([...got].sort()).toEqual([...legends].sort());
    // 전설을 다 가졌으면 천장이어도 다른 등급이 나온다(거절하지 않는다)
    await admin(db, 'update public.profiles set cosmetic_pity = $2 where user_id = $1', [u, COSMETIC_PITY]);
    expect((await as(db, u, async () => (await db.query<{ r: { rarity: string } }>('select public.gacha_cosmetic() as r')).rows[0]!.r)).rarity).not.toBe('legend');
  });

  it('등급 확률: 안 가진 것이 남은 등급끼리 표의 비율로 나온다(일반이 절반쯤)', async () => {
    const u = await signUp(db, 'cstats');
    const N = 300;
    let common = 0;
    for (let i = 0; i < N; i++) {
      await admin(db, 'delete from public.cosmetics where user_id = $1', [u]);
      await admin(db, 'update public.profiles set cosmetic_pity = 0 where user_id = $1', [u]);
      await setTickets(db, u, 100);
      const r = await as(db, u, async () => (await db.query<{ r: { rarity: string } }>('select public.gacha_cosmetic() as r')).rows[0]!.r);
      if (r.rarity === 'common') common++;
    }
    // 모두 비어 있을 때 일반 50 / (50+24+15+7+3) = 약 50.5%
    const expected = GRADE_PERCENT.common / (GRADE_PERCENT.common + GRADE_PERCENT.uncommon + GRADE_PERCENT.rare + GRADE_PERCENT.special + GRADE_PERCENT.legend);
    expect(common / N).toBeGreaterThan(expected - 0.12);
    expect(common / N).toBeLessThan(expected + 0.12);
  }, 120_000);

  it('뽑기권이 모자라면 거절한다', async () => {
    const u = await signUp(db, 'poor2');
    await setTickets(db, u, 1);
    expect(await errorOf(() => cosmetic(u))).toMatch(/insufficient_tickets/);
  });
});

describe('출석 뽑기권 (claim_daily_ticket)', () => {
  const claim = async (user: string) =>
    as(db, user, async () => (await db.query<{ r: { granted: number; tickets: number } }>('select public.claim_daily_ticket() as r')).rows[0]!.r);

  it('하루에 한 번 1장을 주고, 같은 날 다시 부르면 0장이다', async () => {
    const u = await signUp(db, 'daily1');
    expect(await claim(u)).toEqual({ granted: DAILY_TICKETS, tickets: WELCOME_TICKETS + DAILY_TICKETS });
    expect(await claim(u)).toEqual({ granted: 0, tickets: WELCOME_TICKETS + DAILY_TICKETS });
  });

  it('어제 받았으면 오늘 또 받는다', async () => {
    const u = await signUp(db, 'daily2');
    await claim(u);
    await admin(db, "update public.ledger set created_at = created_at - interval '1 day' where user_id = $1 and reason = 'daily'", [u]);
    expect((await claim(u)).granted).toBe(DAILY_TICKETS);
  });

  it('로그인하지 않으면 부를 수 없다', async () => {
    expect(await errorOf(() => as(db, null, () => db.query('select public.claim_daily_ticket()')))).toMatch(/permission denied/);
  });
});

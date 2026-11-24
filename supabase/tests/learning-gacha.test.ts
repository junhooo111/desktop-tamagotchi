import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { admin, as, coinsOf, createDb, errorOf, givePet, ledgerMismatches, signUp, type Db } from './helpers.js';

let db: Db;

beforeAll(async () => {
  db = await createDb();
}, 60_000);

afterAll(async () => {
  expect(await ledgerMismatches(db)).toEqual([]); // 어떤 테스트를 거쳐도 재화와 원장이 어긋나지 않는다
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

describe('뽑기 (gacha_pull)', () => {
  const pull = async (user: string) =>
    as(db, user, async () => (await db.query<{ r: { pet_id: string; species_id: string; rarity: string; coins: number } }>(
      'select public.gacha_pull() as r')).rows[0]!.r);

  it('100 을 내고 펫 1마리를 얻으며, 첫 펫은 자동으로 장착되고 원장에 남는다', async () => {
    const u = await signUp(db, 'puller1');
    const r = await pull(u);
    expect(r.coins).toBe(0);
    expect(await coinsOf(db, u)).toBe(0);
    expect(await equipped(u)).toBe(r.pet_id);
    const pet = (await db.query('select species_id, xp, level from public.pets where id = $1', [r.pet_id])).rows[0];
    expect(pet).toMatchObject({ species_id: r.species_id, xp: 0, level: 1 });
    const ledger = (await db.query('select delta, reason, ref_id from public.ledger where user_id = $1 and reason = $2', [u, 'gacha'])).rows;
    expect(ledger).toEqual([{ delta: -100, reason: 'gacha', ref_id: r.pet_id }]);
  });

  it('이미 장착한 펫이 있으면 새 펫으로 바꾸지 않는다', async () => {
    const u = await signUp(db, 'puller2');
    await admin(db, 'update public.profiles set coins = 500 where user_id = $1', [u]);
    await admin(db, "insert into public.ledger (user_id, delta, reason) values ($1, 400, 'welcome')", [u]);
    const first = await pull(u);
    await pull(u);
    expect(await equipped(u)).toBe(first.pet_id);
  });

  it('재화가 부족하면 거절하고 아무것도 바뀌지 않는다', async () => {
    const u = await signUp(db, 'poor');
    await admin(db, 'update public.profiles set coins = 99 where user_id = $1', [u]);
    await admin(db, "insert into public.ledger (user_id, delta, reason) values ($1, -1, 'learn')", [u]);
    expect(await errorOf(() => pull(u))).toMatch(/insufficient_coins/);
    expect(await coinsOf(db, u)).toBe(99);
    expect((await db.query('select id from public.pets where owner_id = $1', [u])).rows).toHaveLength(0);
  });

  it('가중치가 0 인 종은 나오지 않고, 하나만 남기면 그 종만 나온다', async () => {
    const u = await signUp(db, 'weights');
    await admin(db, 'update public.profiles set coins = 1000 where user_id = $1', [u]);
    await admin(db, "insert into public.ledger (user_id, delta, reason) values ($1, 900, 'welcome')", [u]);
    await admin(db, "update public.species set gacha_weight = 0 where id <> 'duck'");
    try {
      for (let i = 0; i < 5; i++) expect((await pull(u)).species_id).toBe('duck');
    } finally {
      await admin(db, "update public.species set gacha_weight = case id when 'chick' then 25 when 'duck' then 25 when 'rabbit' then 20 when 'cat' then 11 when 'dog' then 11 else 8 end");
    }
  });

  it('연속 일반 9번 뒤에는 희귀 이상이 확정이고, 희귀 이상이 나오면 카운트가 0 으로 돌아간다', async () => {
    const u = await signUp(db, 'pity');
    await admin(db, 'update public.profiles set coins = 1000, pity = 9 where user_id = $1', [u]);
    await admin(db, "insert into public.ledger (user_id, delta, reason) values ($1, 900, 'welcome')", [u]);
    for (let i = 0; i < 10; i++) {
      await admin(db, 'update public.profiles set pity = 9 where user_id = $1', [u]);
      const r = await pull(u);
      expect(r.rarity, `${i}번째`).not.toBe('common');
      expect((await db.query<{ pity: number }>('select pity from public.profiles where user_id = $1', [u])).rows[0]!.pity).toBe(0);
    }
  });

  it('일반이 나오면 천장 카운트가 1 늘어난다', async () => {
    const u = await signUp(db, 'pity2');
    await admin(db, 'update public.profiles set coins = 300 where user_id = $1', [u]);
    await admin(db, "insert into public.ledger (user_id, delta, reason) values ($1, 200, 'welcome')", [u]);
    await admin(db, "update public.species set gacha_weight = 0 where rarity <> 'common'");
    try {
      await pull(u);
      await pull(u);
      expect((await db.query<{ pity: number }>('select pity from public.profiles where user_id = $1', [u])).rows[0]!.pity).toBe(2);
    } finally {
      await admin(db, "update public.species set gacha_weight = case id when 'cat' then 11 when 'dog' then 11 when 'turtle' then 8 else gacha_weight end");
    }
  });

  it('확률이 가중치를 따른다: 일반 70% 안팎, 희귀 22%, 에픽 8% (천장 영향 제외)', async () => {
    const u = await signUp(db, 'stats');
    const N = 600;
    await admin(db, 'update public.profiles set coins = $2 where user_id = $1', [u, N * 100]);
    await admin(db, "insert into public.ledger (user_id, delta, reason) values ($1, $2, 'welcome')", [u, N * 100 - 100]);
    for (let i = 0; i < N; i++) {
      await admin(db, 'update public.profiles set pity = 0 where user_id = $1', [u]); // 천장이 분포를 바꾸지 않게
      await pull(u);
    }
    // 뽑은 펫을 등급별로 센다(펫 테이블이 정답지다).
    const rows = (await db.query<{ rarity: string; n: number }>(
      `select s.rarity, count(*)::int as n
         from public.pets p join public.species s on s.id = p.species_id
        where p.owner_id = $1 group by s.rarity`, [u])).rows;
    const share = Object.fromEntries(rows.map((r) => [r.rarity, r.n / N]));
    // 표본 600 에서 표준편차는 약 2%. 넓은 허용 범위로 우연한 실패를 피한다.
    expect(share['common']).toBeGreaterThan(0.58);
    expect(share['common']).toBeLessThan(0.82);
    expect(share['rare']).toBeGreaterThan(0.12);
    expect(share['rare']).toBeLessThan(0.34);
    expect(share['epic']).toBeGreaterThan(0.03);
    expect(share['epic']).toBeLessThan(0.16);
  }, 120_000);
});

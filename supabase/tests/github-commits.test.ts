import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { as, coinsOf, createDb, errorOf, ledgerMismatches, signUp, type Db } from './helpers.js';

let db: Db;
beforeAll(async () => {
  db = await createDb();
}, 60_000);
afterAll(async () => {
  expect(await ledgerMismatches(db)).toEqual([]);
  await db.close();
});

const dayAgo = async (n: number) => (await db.query<{ d: string }>(`select ((now() at time zone 'utc')::date - ${n})::text as d`)).rows[0]!.d;
const grant = async (uid: string, days: unknown) => {
  await db.exec('set role service_role');
  try {
    return (await db.query<{ r: { granted: number; coins: number } }>('select public.grant_commit_coins($1, $2::jsonb) as r', [uid, JSON.stringify(days)])).rows[0]!.r;
  } finally {
    await db.exec('reset role');
  }
};

describe('GitHub 기여 → 게임머니', () => {
  it('기여 1건당 2, 하루 40까지', async () => {
    const u = await signUp(db, 'dev1');
    const today = await dayAgo(0);
    expect(await grant(u, [{ day: today, count: 5 }])).toEqual({ granted: 10, coins: 110 });
    const u2 = await signUp(db, 'dev2');
    expect((await grant(u2, [{ day: today, count: 500 }])).granted).toBe(40);
  });

  it('같은 날을 다시 읽으면 모자란 만큼만 더 준다(멱등)', async () => {
    const u = await signUp(db, 'dev3');
    const today = await dayAgo(0);
    await grant(u, [{ day: today, count: 5 }]);
    expect((await grant(u, [{ day: today, count: 5 }])).granted).toBe(0);
    expect((await grant(u, [{ day: today, count: 8 }])).granted).toBe(6);
    expect(await coinsOf(db, u)).toBe(100 + 16);
    expect((await grant(u, [{ day: today, count: 2 }])).granted).toBe(0); // 줄어들어도 회수하지 않는다
  });

  it('최근 3일만 인정하고, 여러 날을 한 번에 받는다', async () => {
    const u = await signUp(db, 'dev4');
    const r = await grant(u, [
      { day: await dayAgo(0), count: 1 },
      { day: await dayAgo(2), count: 3 },
      { day: await dayAgo(5), count: 9 },
    ]);
    expect(r.granted).toBe(2 + 6);
  });

  it('잘못된 입력은 거절한다', async () => {
    const u = await signUp(db, 'dev5');
    const today = await dayAgo(0);
    expect(await errorOf(() => grant(u, [{ day: 'x', count: 1 }]))).toMatch(/invalid_days/);
    expect(await errorOf(() => grant(u, [{ day: today, count: -1 }]))).toMatch(/invalid_days/);
    expect(await errorOf(() => grant(u, { day: 1 }))).toMatch(/invalid_days/);
  });

  it('앱(로그인 사용자)은 직접 부를 수 없고, 내 기록만 읽을 수 있다', async () => {
    const u = await signUp(db, 'dev6');
    const other = await signUp(db, 'dev7');
    expect(await errorOf(() => as(db, u, () => db.query('select public.grant_commit_coins($1, $2::jsonb)', [u, '[]'])))).toMatch(/permission denied/);
    expect(await errorOf(() => as(db, null, () => db.query('select * from public.my_commit_days()')))).toMatch(/permission denied/);
    await grant(other, [{ day: await dayAgo(0), count: 4 }]);
    expect(await as(db, u, async () => (await db.query('select * from public.my_commit_days()')).rows)).toEqual([]);
    expect(await as(db, other, async () => (await db.query('select counted, granted from public.my_commit_days()')).rows)).toEqual([{ counted: 4, granted: 8 }]);
    expect(await errorOf(() => as(db, u, () => db.query('select * from public.commit_days')))).toMatch(/permission denied/);
  });
});

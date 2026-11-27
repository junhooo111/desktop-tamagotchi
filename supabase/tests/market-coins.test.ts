import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { admin, as, coinsOf, createDb, errorOf, givePet, ledgerMismatches, signUp, type Db } from './helpers.js';

let db: Db;
beforeAll(async () => {
  db = await createDb();
}, 60_000);
afterAll(async () => {
  expect(await ledgerMismatches(db)).toEqual([]);
  await db.close();
});

const coins = (uid: string, kind: string, key: string) =>
  as(db, uid, async () => (await db.query<{ r: { granted: number; coins: number } }>('select public.grant_coins($1, $2) as r', [kind, key])).rows[0]!.r);

describe('게임머니 획득 (grant_coins)', () => {
  it('돌봄은 한 번에 5, 업적은 30 — 양은 서버가 정한다', async () => {
    const u = await signUp(db, 'earner1');
    expect(await coins(u, 'care', 'c1')).toEqual({ granted: 5, coins: 105 });
    expect(await coins(u, 'achievement', 'first-fix')).toEqual({ granted: 30, coins: 135 });
    expect((await db.query("select reason, delta, currency from public.ledger where user_id = $1 and reason in ('care_coin','achievement') order by reason", [u])).rows).toEqual([
      { reason: 'achievement', delta: 30, currency: 'coin' },
      { reason: 'care_coin', delta: 5, currency: 'coin' },
    ]);
  });

  it('같은 열쇠는 한 번만 인정한다(멱등)', async () => {
    const u = await signUp(db, 'earner2');
    await coins(u, 'achievement', 'a1');
    expect(await coins(u, 'achievement', 'a1')).toEqual({ granted: 0, coins: 130 });
  });

  it('하루 상한: 돌봄 100(20번), 업적 300(10개)', async () => {
    const u = await signUp(db, 'cap');
    let care = 0;
    for (let i = 0; i < 25; i++) care += (await coins(u, 'care', `c${i}`)).granted;
    expect(care).toBe(100);
    let ach = 0;
    for (let i = 0; i < 12; i++) ach += (await coins(u, 'achievement', `a${i}`)).granted;
    expect(ach).toBe(300);
    await admin(db, "update public.coin_grants set created_at = created_at - interval '1 day' where user_id = $1", [u]);
    expect((await coins(u, 'care', 'next-day')).granted).toBe(5);
  });

  it('모르는 종류·잘못된 열쇠는 거절하고, 로그인하지 않으면 못 부른다', async () => {
    const u = await signUp(db, 'bad');
    expect(await errorOf(() => coins(u, 'hack', 'x'))).toMatch(/invalid_grant/);
    expect(await errorOf(() => coins(u, 'care', ''))).toMatch(/invalid_grant/);
    expect(await errorOf(() => coins(u, 'care', 'k'.repeat(65)))).toMatch(/invalid_grant/);
    expect(await coinsOf(db, u)).toBe(100);
    expect(await errorOf(() => as(db, null, () => db.query("select public.grant_coins('care','x')")))).toMatch(/permission denied/);
    expect(await errorOf(() => as(db, u, () => db.query("insert into public.coin_grants (user_id, kind, key, amount) values ($1,'care','z',500)", [u])))).toMatch(/permission denied/);
  });
});

describe('경매장 조회와 마지막 펫 보호', () => {
  type Listing = { listing_id: string; price: number; species_id: string; species_name: string; level: number; seller_login: string; is_mine: boolean };
  const market = (uid: string) => as(db, uid, async () => (await db.query<Listing>('select * from public.market_listings()')).rows);
  const sell = (uid: string, pet: string, price: number) =>
    as(db, uid, async () => (await db.query<{ r: string }>('select public.create_listing($1, $2) as r', [pet, price])).rows[0]!.r);

  it('팔리는 펫을 싼 순으로 보여 주고, 판매자 이름·종·레벨·가격과 내 것 표시만 있다', async () => {
    const s1 = await signUp(db, 'seller1');
    const s2 = await signUp(db, 'seller2');
    const buyer = await signUp(db, 'buyer');
    const a = await givePet(db, s1, 'cat', 0);
    await givePet(db, s1, 'dog', 0);
    const b = await givePet(db, s2, 'dragon', 1000);
    await givePet(db, s2, 'owl', 0);
    await sell(s1, a, 500);
    await sell(s2, b, 120);
    const rows = await market(buyer);
    expect(rows.map((r) => [r.price, r.species_id, r.seller_login, r.is_mine])).toEqual([[120, 'dragon', 'seller2', false], [500, 'cat', 'seller1', false]]);
    expect(rows[0]?.level).toBe(11);
    expect(Object.keys(rows[0]!).sort()).toEqual(['created_at', 'is_mine', 'level', 'listing_id', 'price', 'rarity', 'seller_login', 'species_id', 'species_name']);
    expect((await market(s2)).map((r) => r.is_mine)).toEqual([true, false]);
  });

  it('내 펫 목록: 레벨·장착·판매 중 여부', async () => {
    const u = await signUp(db, 'owner');
    const p1 = await givePet(db, u, 'cat', 40);
    const p2 = await givePet(db, u, 'fox', 0);
    await admin(db, 'update public.profiles set equipped_pet_id = $2 where user_id = $1', [u, p1]);
    await sell(u, p2, 77);
    const rows = await as(db, u, async () => (await db.query<{ species_id: string; level: number; equipped: boolean; price: number | null }>('select species_id, level, equipped, price from public.my_pets()')).rows);
    expect(rows).toEqual([{ species_id: 'cat', level: 3, equipped: true, price: null }, { species_id: 'fox', level: 1, equipped: false, price: 77 }]);
  });

  it('마지막 한 마리(판매 중인 펫은 세지 않음)는 팔 수 없다', async () => {
    const u = await signUp(db, 'lastpet');
    const only = await givePet(db, u, 'duck', 0);
    expect(await errorOf(() => sell(u, only, 10))).toMatch(/last_pet/);
    const second = await givePet(db, u, 'owl', 0);
    await sell(u, second, 10); // 하나는 남으니 가능
    expect(await errorOf(() => sell(u, only, 10))).toMatch(/last_pet/); // 이제 둘 다 팔면 남는 게 없다
  });

  it('로그인하지 않으면 경매장을 볼 수 없다', async () => {
    expect(await errorOf(() => as(db, null, () => db.query('select * from public.market_listings()')))).toMatch(/permission denied/);
    expect(await errorOf(() => as(db, null, () => db.query('select * from public.my_pets()')))).toMatch(/permission denied/);
  });
});

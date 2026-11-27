import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { as, createDb, errorOf, givePet, ledgerMismatches, signUp, type Db } from './helpers.js';

let db: Db;
beforeAll(async () => {
  db = await createDb();
}, 60_000);
afterAll(async () => {
  expect(await ledgerMismatches(db)).toEqual([]);
  await db.close();
});

type Sale = { listing_id: string; price: number; species_id: string; level: number; buyer_login: string; sold_at: string };
const sales = (uid: string, since: string | null = null) =>
  as(db, uid, async () => (await db.query<Sale>('select * from public.my_sales($1)', [since])).rows);
const sell = (uid: string, pet: string, price: number) => as(db, uid, async () => (await db.query<{ r: string }>('select public.create_listing($1, $2) as r', [pet, price])).rows[0]!.r);
const buy = (uid: string, listing: string) => as(db, uid, () => db.query('select public.buy_listing($1)', [listing]));

describe('내 판매 조회 (my_sales)', () => {
  it('내가 판 글만, 산 사람 이름·종·레벨·가격과 함께 팔린 순서로 보인다', async () => {
    const seller = await signUp(db, 'seller');
    const buyer = await signUp(db, 'buyer');
    const other = await signUp(db, 'other');
    await givePet(db, seller, 'duck', 0);
    const a = await givePet(db, seller, 'cat', 40);
    const b = await givePet(db, seller, 'fox', 0);
    const la = await sell(seller, a, 30);
    const lb = await sell(seller, b, 20);
    expect(await sales(seller)).toEqual([]); // 아직 안 팔림
    await buy(buyer, lb);
    await buy(buyer, la);
    const rows = await sales(seller);
    expect(rows.map((r) => [r.price, r.species_id, r.buyer_login])).toEqual([[20, 'fox', 'buyer'], [30, 'cat', 'buyer']]);
    expect(rows[1]?.level).toBe(3);
    expect(await sales(other)).toEqual([]); // 남의 판매는 보이지 않는다
    expect(await sales(buyer)).toEqual([]); // 산 사람은 판매자가 아니다
  });

  it('p_since 이후에 팔린 것만 돌려주고, 취소한 글은 안 보인다', async () => {
    const seller = await signUp(db, 'seller2');
    const buyer = await signUp(db, 'buyer2');
    await givePet(db, seller, 'duck', 0);
    const a = await givePet(db, seller, 'cat', 0);
    const b = await givePet(db, seller, 'fox', 0);
    const la = await sell(seller, a, 10);
    const lb = await sell(seller, b, 10);
    await buy(buyer, la);
    const [first] = await sales(seller);
    await as(db, seller, () => db.query('select public.cancel_listing($1)', [lb]));
    expect(await sales(seller, first!.sold_at)).toEqual([]); // 그 시각 이후에는 없다
    expect((await sales(seller, '2000-01-01')).length).toBe(1); // 취소한 것은 팔린 게 아니다
  });

  it('로그인하지 않으면 부를 수 없다', async () => {
    expect(await errorOf(() => as(db, null, () => db.query('select * from public.my_sales()')))).toMatch(/permission denied/);
  });
});

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { admin, as, coinsOf, createDb, errorOf, ledgerMismatches, signUp, ticketMismatches, type Db } from './helpers.js';

let db: Db;
beforeAll(async () => {
  db = await createDb();
}, 60_000);
afterAll(async () => {
  expect(await ledgerMismatches(db)).toEqual([]);
  expect(await ticketMismatches(db)).toEqual([]);
  await db.close();
});

const setCoins = async (user: string, coins: number): Promise<void> => {
  const cur = await coinsOf(db, user);
  await admin(db, 'update public.profiles set coins = $2 where user_id = $1', [user, coins]);
  await admin(db, "insert into public.ledger (user_id, delta, reason) values ($1, $2, 'welcome')", [user, coins - cur]);
};
const own = (user: string, kind: string, item: string) => admin(db, 'insert into public.cosmetics (user_id, kind, item_id) values ($1, $2, $3)', [user, kind, item]);
const owns = async (user: string, kind: string, item: string): Promise<boolean> =>
  (await db.query('select 1 from public.cosmetics where user_id = $1 and kind = $2 and item_id = $3', [user, kind, item])).rows.length > 0;

const sell = (user: string, kind: string, item: string, price: number) =>
  as(db, user, async () => (await db.query<{ id: string }>('select public.create_cosmetic_listing($1, $2, $3) as id', [kind, item, price])).rows[0]!.id);
const buy = (user: string, id: string) => as(db, user, async () => (await db.query<{ r: { coins: number } }>('select public.buy_cosmetic_listing($1) as r', [id])).rows[0]!.r);
const cancel = (user: string, id: string) => as(db, user, () => db.query('select public.cancel_cosmetic_listing($1)', [id]));
const active = (user: string) => as(db, user, async () => (await db.query<{ listing_id: string; kind: string; item_id: string; rarity: string; price: number; is_mine: boolean }>('select * from public.cosmetic_listings_active()')).rows);
const mine = (user: string) => as(db, user, async () => (await db.query<{ kind: string; item_id: string; tradable: boolean; listing_id: string | null; price: number | null }>('select * from public.my_cosmetics()')).rows);

describe('꾸미기 거래', () => {
  it('팔 수 있는 꾸미기 33종은 뽑기 전용(업적으로 못 여는 것)이고, 업적으로도 열리는 11종은 못 판다', async () => {
    const rows = (await db.query<{ kind: string; item_id: string; tradable: boolean }>('select kind, item_id, tradable from public.cosmetic_items where gacha')).rows;
    expect(rows.filter((r) => r.tradable)).toHaveLength(33);
    const locked = rows.filter((r) => !r.tradable).map((r) => r.item_id).sort();
    expect(locked).toEqual(['crown', 'deep', 'flower', 'glasses', 'halo', 'mono', 'partyhat', 'pastel', 'ribbon', 'sprout', 'wings']);
    const u = await signUp(db, 'cm-lock');
    await own(u, 'accessory', 'crown');
    expect(await errorOf(() => sell(u, 'accessory', 'crown', 10))).toMatch(/not_tradable/);
  });

  it('올리고 → 사면 주인과 게임머니가 함께 바뀌고 원장에 남으며, 수수료는 없다', async () => {
    const seller = await signUp(db, 'cm-seller');
    const buyer = await signUp(db, 'cm-buyer');
    await own(seller, 'neck', 'goldchain');
    await setCoins(buyer, 500);
    const id = await sell(seller, 'neck', 'goldchain', 300);
    expect((await mine(seller))[0]).toMatchObject({ kind: 'neck', item_id: 'goldchain', tradable: true, listing_id: id, price: 300 });
    expect((await active(buyer)).map((r) => [r.kind, r.item_id, r.rarity, r.price, r.is_mine])).toEqual([['neck', 'goldchain', 'legend', 300, false]]);
    const r = await buy(buyer, id);
    expect(r.coins).toBe(200);
    expect(await owns(seller, 'neck', 'goldchain')).toBe(false);
    expect(await owns(buyer, 'neck', 'goldchain')).toBe(true);
    expect(await coinsOf(db, seller)).toBe(100 + 300);
    expect(await active(buyer)).toEqual([]);
  });

  it('내 글은 못 사고, 게임머니가 모자라거나 이미 가진 꾸미기는 못 사며, 다른 사람이 먼저 사면 거절된다', async () => {
    const seller = await signUp(db, 'cm-s2');
    const poor = await signUp(db, 'cm-poor');
    const rich = await signUp(db, 'cm-rich');
    await own(seller, 'effect', 'flameaura');
    const id = await sell(seller, 'effect', 'flameaura', 400);
    expect(await errorOf(() => buy(seller, id))).toMatch(/own_listing/);
    expect(await errorOf(() => buy(poor, id))).toMatch(/insufficient_coins/);
    await setCoins(rich, 1000);
    await own(rich, 'effect', 'flameaura');
    expect(await errorOf(() => buy(rich, id))).toMatch(/already_owned/);
    await admin(db, "delete from public.cosmetics where user_id = $1 and item_id = 'flameaura'", [rich]);
    await buy(rich, id);
    expect(await errorOf(() => buy(rich, id))).toMatch(/listing_unavailable/);
  });

  it('남의 꾸미기·없는 꾸미기는 못 올리고, 같은 것을 두 번 올릴 수 없으며, 내리면 다시 쓸 수 있다', async () => {
    const a = await signUp(db, 'cm-a');
    const b = await signUp(db, 'cm-b');
    await own(a, 'accessory', 'pirate');
    expect(await errorOf(() => sell(b, 'accessory', 'pirate', 10))).toMatch(/not_yours/);
    expect(await errorOf(() => sell(a, 'accessory', 'pirate', 0))).toMatch(/invalid_price/);
    expect(await errorOf(() => sell(a, 'accessory', 'pirate', 2_000_000))).toMatch(/invalid_price/);
    const id = await sell(a, 'accessory', 'pirate', 50);
    expect(await errorOf(() => sell(a, 'accessory', 'pirate', 60))).toMatch(/already_listed/);
    await cancel(a, id);
    expect(await errorOf(() => cancel(a, id))).toMatch(/listing_unavailable/);
    expect((await mine(a))[0]!.listing_id).toBeNull();
    await sell(a, 'accessory', 'pirate', 60); // 내렸으니 다시 올릴 수 있다
  });

  it('판매 알림: 내가 올린 꾸미기가 팔리면 구매자 이름과 함께 나온다', async () => {
    const s = await signUp(db, 'cm-notify-s');
    const b = await signUp(db, 'cm-notify-b');
    await own(s, 'accessory', 'knight');
    await setCoins(b, 90);
    const id = await sell(s, 'accessory', 'knight', 90);
    await buy(b, id);
    const sales = await as(db, s, async () => (await db.query<{ buyer_login: string; kind: string; item_id: string; price: number }>('select * from public.my_cosmetic_sales()')).rows);
    expect(sales).toMatchObject([{ buyer_login: 'cm-notify-b', kind: 'accessory', item_id: 'knight', price: 90 }]);
  });

  it('로그인하지 않으면 부를 수 없고, 표를 직접 읽거나 고칠 수도 없다', async () => {
    expect(await errorOf(() => as(db, null, () => db.query('select * from public.cosmetic_listings_active()')))).toMatch(/permission denied/);
    const u = await signUp(db, 'cm-sec');
    expect(await errorOf(() => as(db, u, () => db.query('select * from public.cosmetic_listings')))).toMatch(/permission denied/);
    expect(await errorOf(() => as(db, u, () => db.query("update public.cosmetic_items set tradable = true where item_id = 'crown'")))).toMatch(/permission denied/);
  });
});

describe('친구에게 꾸미기 선물', () => {
  async function friends(a: string, b: string) {
    const ua = await signUp(db, a);
    const ub = await signUp(db, b);
    const fr = await as(db, ua, async () => (await db.query<{ r: { friendship_id: string } }>('select public.friend_request($1) as r', [b])).rows[0]!.r);
    await as(db, ub, () => db.query('select public.friend_respond($1, true)', [fr.friendship_id]));
    return { ua, ub, id: fr.friendship_id };
  }
  const give = (user: string, id: string, kind: string, item: string) =>
    as(db, user, async () => (await db.query<{ r: { granted: number } }>('select public.friend_gift_cosmetic($1, $2, $3) as r', [id, kind, item])).rows[0]!.r);

  it('친구에게 꾸미기를 주면 주인이 바뀌고 친밀도 +5. 친구가 아니거나 못 파는 것·이미 가진 것은 못 준다', async () => {
    const { ua, ub, id } = await friends('cg-a', 'cg-b');
    await own(ua, 'neck', 'bell');
    await own(ua, 'accessory', 'ribbon'); // 업적으로도 열리는 것: 못 준다
    expect(await errorOf(() => give(ua, id, 'accessory', 'ribbon'))).toMatch(/not_tradable/);
    const r = await give(ua, id, 'neck', 'bell');
    expect(r.granted).toBe(5);
    expect(await owns(ua, 'neck', 'bell')).toBe(false);
    expect(await owns(ub, 'neck', 'bell')).toBe(true);
    // 받는 사람이 같은 것을 이미 가졌으면 못 준다
    await own(ua, 'neck', 'scarf');
    await own(ub, 'neck', 'scarf');
    expect(await errorOf(() => give(ua, id, 'neck', 'scarf'))).toMatch(/already_owned/);
    // 낯선 사람에게는 못 준다
    const stranger = await signUp(db, 'cg-stranger');
    expect(await errorOf(() => give(stranger, id, 'neck', 'scarf'))).toMatch(/not_found/);
    // 받은 선물 알림
    const got = await as(db, ub, async () => (await db.query<{ kind: string; item_id: string; from_login: string }>('select * from public.cosmetic_gifts_received()')).rows);
    expect(got).toMatchObject([{ kind: 'neck', item_id: 'bell', from_login: 'cg-a' }]);
  });

  it('하루 3번까지만 줄 수 있고, 판매 중인 꾸미기는 못 준다', async () => {
    const { ua, id } = await friends('cg-c', 'cg-d');
    for (const item of ['bell', 'scarf', 'bowtie', 'pearl']) await own(ua, 'neck', item);
    await give(ua, id, 'neck', 'bell');
    await give(ua, id, 'neck', 'scarf');
    await give(ua, id, 'neck', 'bowtie');
    expect(await errorOf(() => give(ua, id, 'neck', 'pearl'))).toMatch(/gift_limit/);
    await own(ua, 'effect', 'notes');
    await sell(ua, 'effect', 'notes', 20);
    await admin(db, "update public.cosmetic_gifts set created_at = created_at - interval '1 day' where from_user = $1", [ua]);
    expect(await errorOf(() => give(ua, id, 'effect', 'notes'))).toMatch(/already_listed/);
  });

  it('친구끼리 꾸미기를 거래하면 친밀도 +10', async () => {
    const { ua, ub, id } = await friends('cg-e', 'cg-f');
    await own(ua, 'effect', 'snow');
    await setCoins(ub, 200);
    const listing = await sell(ua, 'effect', 'snow', 50);
    await buy(ub, listing);
    const xp = (await db.query<{ xp: number }>('select xp from public.friendships where id = $1', [id])).rows[0]!.xp;
    expect(xp).toBe(10);
  });
});

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

/** 재화를 원장과 함께 정확히 맞춰 준다(테스트 준비용). */
async function setCoins(user: string, coins: number): Promise<void> {
  const cur = await coinsOf(db, user);
  await admin(db, 'update public.profiles set coins = $2 where user_id = $1', [user, coins]);
  await admin(db, "insert into public.ledger (user_id, delta, reason) values ($1, $2, 'welcome')", [user, coins - cur]);
}

const sell = (user: string, pet: string, price: number) =>
  as(db, user, async () => (await db.query<{ id: string }>('select public.create_listing($1, $2) as id', [pet, price])).rows[0]!.id);
const buy = (user: string, listing: string) =>
  as(db, user, async () => (await db.query<{ r: { fee: number; price: number; coins: number } }>(
    'select public.buy_listing($1) as r', [listing])).rows[0]!.r);
const cancel = (user: string, listing: string) => as(db, user, () => db.query('select public.cancel_listing($1)', [listing]));
const equip = (user: string, pet: string) => as(db, user, () => db.query('select public.equip_pet($1)', [pet]));

const ownerOf = async (pet: string): Promise<string> =>
  (await db.query<{ owner_id: string }>('select owner_id from public.pets where id = $1', [pet])).rows[0]!.owner_id;
const listingStatus = async (id: string): Promise<string> =>
  (await db.query<{ status: string }>('select status from public.listings where id = $1', [id])).rows[0]!.status;

async function trio(name: string) {
  const seller = await signUp(db, `${name}-seller`);
  const buyer = await signUp(db, `${name}-buyer`);
  const pet = await givePet(db, seller, 'cat', 40);
  await givePet(db, seller, 'duck', 0); // 판매자에게 항상 한 마리는 남는다(마지막 한 마리는 팔 수 없다)
  return { seller, buyer, pet };
}

describe('판매 등록 (create_listing)', () => {
  it('내 펫을 올리면 판매글이 생기고, 장착 중이었다면 장착이 풀린다', async () => {
    const { seller, pet } = await trio('list1');
    await admin(db, 'update public.profiles set equipped_pet_id = $2 where user_id = $1', [seller, pet]);
    const id = await sell(seller, pet, 80);
    expect(await listingStatus(id)).toBe('active');
    expect((await db.query<{ e: string | null }>('select equipped_pet_id as e from public.profiles where user_id = $1', [seller])).rows[0]!.e).toBeNull();
  });

  it('남의 펫은 올릴 수 없다', async () => {
    const { buyer, pet } = await trio('list2');
    expect(await errorOf(() => sell(buyer, pet, 10))).toMatch(/not_your_pet/);
  });

  it('이미 판매 중인 펫은 다시 올릴 수 없다', async () => {
    const { seller, pet } = await trio('list3');
    await sell(seller, pet, 10);
    expect(await errorOf(() => sell(seller, pet, 20))).toMatch(/already_listed/);
  });

  it.each([0, -5, 1_000_001])('가격 %i 은 거부한다', async (price) => {
    const { seller, pet } = await trio(`price${price}`);
    expect(await errorOf(() => sell(seller, pet, price))).toMatch(/invalid_price/);
  });

  it('판매 중인 펫은 장착할 수 없다', async () => {
    const { seller, pet } = await trio('list4');
    await sell(seller, pet, 10);
    expect(await errorOf(() => equip(seller, pet))).toMatch(/pet_is_listed/);
  });
});

describe('판매 취소 (cancel_listing)', () => {
  it('내 판매글을 취소하면 다시 올리거나 장착할 수 있다', async () => {
    const { seller, pet } = await trio('cancel1');
    const id = await sell(seller, pet, 10);
    await cancel(seller, id);
    expect(await listingStatus(id)).toBe('cancelled');
    await equip(seller, pet);
    expect(await errorOf(() => sell(seller, pet, 30))).toBeNull();
  });

  it('남의 판매글은 취소할 수 없고, 이미 끝난 글도 취소할 수 없다', async () => {
    const { seller, buyer, pet } = await trio('cancel2');
    const id = await sell(seller, pet, 10);
    expect(await errorOf(() => cancel(buyer, id))).toMatch(/listing_unavailable/);
    await cancel(seller, id);
    expect(await errorOf(() => cancel(seller, id))).toMatch(/listing_unavailable/);
  });
});

describe('구매 (buy_listing)', () => {
  it('게임머니가 수수료 없이 가격 그대로 옮겨가고, 펫 주인이 바뀌고, 원장에 남는다', async () => {
    const { seller, buyer, pet } = await trio('buy1');
    await setCoins(seller, 0);
    await setCoins(buyer, 500);
    const id = await sell(seller, pet, 200);
    const res = await buy(buyer, id);

    expect(res).toMatchObject({ price: 200, coins: 300 });
    expect(await coinsOf(db, buyer)).toBe(300);
    expect(await coinsOf(db, seller)).toBe(200); // 수수료 없이 가격 그대로
    expect(await ownerOf(pet)).toBe(buyer);
    expect(await listingStatus(id)).toBe('sold');
    const ledger = (await db.query('select user_id, delta, reason from public.ledger where ref_id = $1 order by delta', [id])).rows;
    expect(ledger).toEqual([
      { user_id: buyer, delta: -200, reason: 'trade_buy' },
      { user_id: seller, delta: 200, reason: 'trade_sell' },
    ]);
  });

  it('아무리 작은 가격이어도 판 사람이 전액 받는다(가격 19 → 19)', async () => {
    const { seller, buyer, pet } = await trio('buy2');
    await setCoins(seller, 0);
    await setCoins(buyer, 50);
    const id = await sell(seller, pet, 19);
    expect(await buy(buyer, id)).not.toHaveProperty('fee');
    expect(await coinsOf(db, seller)).toBe(19);
  });

  it('산 펫은 새 주인이 장착·재판매할 수 있고 이전 주인은 더 이상 못 만진다', async () => {
    const { seller, buyer, pet } = await trio('buy3');
    await setCoins(buyer, 100);
    await buy(buyer, await sell(seller, pet, 10));
    await equip(buyer, pet);
    expect(await errorOf(() => equip(seller, pet))).toMatch(/not_your_pet/);
    expect(await errorOf(() => sell(seller, pet, 5))).toMatch(/not_your_pet/);
    expect(await errorOf(() => sell(buyer, pet, 50))).toMatch(/last_pet/); // 산 펫이 유일한 펫이면 못 판다
    await givePet(db, buyer, 'owl', 0);
    expect(await errorOf(() => sell(buyer, pet, 50))).toBeNull();
  });

  it('재화가 부족하면 거절하고 모든 것이 그대로다(롤백)', async () => {
    const { seller, buyer, pet } = await trio('buy4');
    await setCoins(seller, 10);
    await setCoins(buyer, 99);
    const id = await sell(seller, pet, 100);
    expect(await errorOf(() => buy(buyer, id))).toMatch(/insufficient_coins/);
    expect(await coinsOf(db, buyer)).toBe(99);
    expect(await coinsOf(db, seller)).toBe(10);
    expect(await ownerOf(pet)).toBe(seller);
    expect(await listingStatus(id)).toBe('active');
  });

  it('내 판매글은 내가 살 수 없다', async () => {
    const { seller, pet } = await trio('buy5');
    await setCoins(seller, 1000);
    const id = await sell(seller, pet, 10);
    expect(await errorOf(() => buy(seller, id))).toMatch(/own_listing/);
  });

  it('같은 판매글을 두 번 살 수 없다(두 번째 구매자는 실패)', async () => {
    const { seller, buyer, pet } = await trio('buy6');
    const other = await signUp(db, 'buy6-other');
    await setCoins(buyer, 100);
    await setCoins(other, 100);
    const id = await sell(seller, pet, 30);
    await buy(buyer, id);
    expect(await errorOf(() => buy(other, id))).toMatch(/listing_unavailable/);
    expect(await ownerOf(pet)).toBe(buyer);
    expect(await coinsOf(db, other)).toBe(100);
  });

  it('취소된 판매글은 살 수 없다', async () => {
    const { seller, buyer, pet } = await trio('buy7');
    await setCoins(buyer, 100);
    const id = await sell(seller, pet, 10);
    await cancel(seller, id);
    expect(await errorOf(() => buy(buyer, id))).toMatch(/listing_unavailable/);
  });

  it('없는 판매글은 살 수 없다', async () => {
    const { buyer } = await trio('buy8');
    expect(await errorOf(() => buy(buyer, '00000000-0000-4000-8000-0000000000ff'))).toMatch(/listing_unavailable/);
  });

  it('재화를 정확히 가격만큼 가지고 있으면 살 수 있고 0 이 된다', async () => {
    const { seller, buyer, pet } = await trio('buy9');
    await setCoins(buyer, 60);
    await buy(buyer, await sell(seller, pet, 60));
    expect(await coinsOf(db, buyer)).toBe(0);
  });

  it('판매자가 판 펫이 장착 중이던 펫이어도 구매자 쪽 장착은 건드리지 않는다', async () => {
    const { seller, buyer, pet } = await trio('buy10');
    const mine = await givePet(db, buyer, 'dog');
    await admin(db, 'update public.profiles set equipped_pet_id = $2 where user_id = $1', [buyer, mine]);
    await setCoins(buyer, 100);
    await buy(buyer, await sell(seller, pet, 10));
    expect((await db.query<{ e: string }>('select equipped_pet_id as e from public.profiles where user_id = $1', [buyer])).rows[0]!.e).toBe(mine);
  });
});

describe('진화 (evolve_pet)', () => {
  const evolve = (user: string, pet: string) =>
    as(db, user, async () => (await db.query<{ r: { species_id: string; coins: number } }>(
      'select public.evolve_pet($1) as r', [pet])).rows[0]!.r);

  async function withEvolution<T>(fn: () => Promise<T>): Promise<T> {
    // 진화 도트가 아직 없으므로, 규칙만 시험하려고 임시 종을 만든다.
    await admin(db, "insert into public.species (id, name, rarity, gacha_weight) values ('cat_x', '진화 고양이', 'common', 0)");
    await admin(db, "update public.species set evolves_to = 'cat_x', evolve_level = 3, evolve_cost = 70 where id = 'cat'");
    try {
      return await fn();
    } finally {
      // 진화한 펫을 원래 종으로 되돌린 뒤에 임시 종을 지운다(외래 키 때문에 순서가 중요하다).
      await admin(db, "update public.pets set species_id = 'cat' where species_id = 'cat_x'");
      await admin(db, "update public.species set evolves_to = null, evolve_level = null, evolve_cost = null where id = 'cat'");
      await admin(db, "delete from public.species where id = 'cat_x'");
    }
  }

  it('레벨과 재화 조건을 채우면 종이 바뀌고 재화가 빠지며 원장에 남는다', async () => {
    await withEvolution(async () => {
      const u = await signUp(db, 'evo1');
      const pet = await givePet(db, u, 'cat', 40); // 레벨 3
      await setCoins(u, 100);
      const r = await evolve(u, pet);
      expect(r).toEqual({ pet_id: pet, species_id: 'cat_x', coins: 30 });
      expect((await db.query<{ species_id: string; xp: number }>('select species_id, xp from public.pets where id = $1', [pet])).rows[0]).toEqual({ species_id: 'cat_x', xp: 40 });
      expect((await db.query('select delta, reason from public.ledger where ref_id = $1', [pet])).rows).toEqual([{ delta: -70, reason: 'evolve' }]);
    });
  });

  it('레벨이 모자라거나 재화가 모자라면 거절한다', async () => {
    await withEvolution(async () => {
      const u = await signUp(db, 'evo2');
      const low = await givePet(db, u, 'cat', 20); // 레벨 2
      const ok = await givePet(db, u, 'cat', 40);
      await setCoins(u, 100);
      expect(await errorOf(() => evolve(u, low))).toMatch(/level_too_low/);
      await setCoins(u, 69);
      expect(await errorOf(() => evolve(u, ok))).toMatch(/insufficient_coins/);
      expect(await coinsOf(db, u)).toBe(69);
    });
  });

  it('진화 규칙이 없는 종, 남의 펫, 판매 중인 펫은 진화시킬 수 없다', async () => {
    await withEvolution(async () => {
      const u = await signUp(db, 'evo3');
      const other = await signUp(db, 'evo3-other');
      await setCoins(u, 500);
      const dog = await givePet(db, u, 'dog', 400);
      const cat = await givePet(db, u, 'cat', 400);
      expect(await errorOf(() => evolve(u, dog))).toMatch(/cannot_evolve/);
      expect(await errorOf(() => evolve(other, cat))).toMatch(/not_your_pet/);
      await sell(u, cat, 10);
      expect(await errorOf(() => evolve(u, cat))).toMatch(/pet_is_listed/);
    });
  });
});

describe('정합성: 어떤 순서로 섞어서 써도 재화와 원장이 맞는다', () => {
  it('여러 사용자가 사고팔고 취소하고 실패를 반복해도 사용자별 재화 = 원장 합계', async () => {
    const users = await Promise.all(['m1', 'm2', 'm3', 'm4'].map((n) => signUp(db, n)));
    const pets: string[] = [];
    for (const u of users) pets.push(await givePet(db, u, 'rabbit'), await givePet(db, u, 'duck'));
    for (const u of users) await setCoins(u, 300);

    let seed = 12345;
    const rnd = (n: number): number => {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return seed % n;
    };
    for (let i = 0; i < 80; i++) {
      const actor = users[rnd(users.length)]!;
      const pet = pets[rnd(pets.length)]!;
      const action = rnd(3);
      if (action === 0) await errorOf(() => sell(actor, pet, 1 + rnd(200)));
      else if (action === 1) {
        // 이 테스트의 사용자들이 올린 글만 대상으로 한다(앞선 테스트가 남긴 판매글은 제외).
        const open = (await db.query<{ id: string }>("select id from public.listings where status = 'active' and seller_id = any($1)", [users])).rows;
        if (open.length > 0) await errorOf(() => buy(actor, open[rnd(open.length)]!.id));
      } else {
        const open = (await db.query<{ id: string }>("select id from public.listings where status = 'active' and seller_id = $1", [actor])).rows;
        if (open.length > 0) await errorOf(() => cancel(actor, open[0]!.id));
      }
    }
    expect(await ledgerMismatches(db)).toEqual([]);
    // 펫은 늘지도 줄지도 않았다(복제·소실 없음)
    const total = (await db.query<{ n: number }>('select count(*)::int as n from public.pets where owner_id = any($1)', [users])).rows[0]!.n;
    expect(total).toBe(pets.length);
    // 판매 중인 글이 있는 펫은 펫당 최대 1개
    const dup = (await db.query("select pet_id from public.listings where status = 'active' group by pet_id having count(*) > 1")).rows;
    expect(dup).toEqual([]);
  });
});

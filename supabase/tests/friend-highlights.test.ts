import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { admin, as, createDb, errorOf, givePet, ledgerMismatches, signUp, ticketMismatches, type Db } from './helpers.js';

let db: Db;
beforeAll(async () => {
  db = await createDb();
}, 60_000);
afterAll(async () => {
  expect(await ledgerMismatches(db)).toEqual([]);
  expect(await ticketMismatches(db)).toEqual([]);
  await db.close();
});

async function friends(a: string, b: string) {
  const ua = await signUp(db, a);
  const ub = await signUp(db, b);
  const fr = await as(db, ua, async () => (await db.query<{ r: { friendship_id: string } }>('select public.friend_request($1) as r', [b])).rows[0]!.r);
  await as(db, ub, () => db.query('select public.friend_respond($1, true)', [fr.friendship_id]));
  return { ua, ub };
}
const since = '2000-01-01T00:00:00Z';
const highlights = (u: string, from = since) =>
  as(db, u, async () => (await db.query<{ login: string; kind: string; item_id: string; rarity: string }>('select * from public.friend_highlights($1)', [from])).rows);

describe('친구 소식', () => {
  it('친구가 얻은 전설·히든 동물과 꾸미기만 나오고, 동물 종 이름은 나오지 않는다', async () => {
    const { ua, ub } = await friends('fh-a', 'fh-b');
    await givePet(db, ub, 'cat'); // 일반: 안 나온다
    await givePet(db, ub, 'griffin'); // 전설
    await admin(db, "insert into public.cosmetics (user_id, kind, item_id) values ($1, 'neck', 'goldchain'), ($1, 'neck', 'bell')", [ub]);
    const rows = await highlights(ua);
    expect(rows.map((r) => [r.login, r.kind, r.item_id, r.rarity]).sort()).toEqual([
      ['fh-b', 'neck', 'goldchain', 'legend'],
      ['fh-b', 'pet', '', 'legend'],
    ]);
  });

  it('p_since 이후만 나오고, 친구가 아닌 사람의 것은 나오지 않는다', async () => {
    const { ua, ub } = await friends('fh-c', 'fh-d');
    const stranger = await signUp(db, 'fh-stranger');
    await givePet(db, ub, 'griffin');
    await givePet(db, stranger, 'griffin');
    expect((await highlights(ua)).map((r) => r.login)).toEqual(['fh-d']);
    expect(await highlights(ua, '2100-01-01T00:00:00Z')).toEqual([]);
  });

  it('로그인하지 않으면 부를 수 없다', async () => {
    expect(await errorOf(() => as(db, null, () => db.query('select * from public.friend_highlights(now())')))).toMatch(/permission denied/);
  });
});

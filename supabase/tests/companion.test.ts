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
  return { ua, ub, id: fr.friendship_id };
}
const set = (u: string, id: string | null) => as(db, u, () => db.query('select public.set_companion($1)', [id]));
const tick = (u: string) => as(db, u, async () => (await db.query<{ r: { granted: boolean; pet_xp: number; friendship_xp?: number; reason?: string } }>('select public.companion_tick() as r')).rows[0]!.r);
const claim = (u: string) => as(db, u, async () => (await db.query<{ r: number }>('select public.companion_claim() as r')).rows[0]!.r);
const current = (u: string) => as(db, u, async () => (await db.query<{ login: string; species_id: string }>('select * from public.companion_current()')).rows);
const xpOf = async (id: string) => (await db.query<{ xp: number }>('select xp from public.friendships where id = $1', [id])).rows[0]!.xp;
/** 오늘 이미 받은 틱을 시간대만 바꿔 한 시간 뒤로 옮긴다(시험에서 시간을 건너뛰는 방법) */
const nextHour = (u: string) => admin(db, 'update public.companion_ticks set bucket = bucket - 1 where viewer_id = $1', [u]);

describe('친구 펫 동행', () => {
  it('수락된 친구만 고를 수 있고, 친구의 대표 펫이 보인다', async () => {
    const { ua, ub, id } = await friends('co-a', 'co-b');
    await givePet(db, ub, 'cat');
    await set(ua, id);
    expect(await current(ua)).toMatchObject([{ login: 'co-b', species_id: 'cat' }]);
    const stranger = await signUp(db, 'co-stranger');
    expect(await errorOf(() => set(stranger, id))).toMatch(/not_found/);
    await set(ua, null);
    expect(await current(ua)).toEqual([]);
  });

  it('한 시간에 한 번 보너스: 내 펫 +6, 친밀도 +3, 친구 몫 +6 은 친구가 가져간다', async () => {
    const { ua, ub, id } = await friends('co-c', 'co-d');
    await givePet(db, ub, 'dog');
    await set(ua, id);
    const t = await tick(ua);
    expect(t).toMatchObject({ granted: true, pet_xp: 6, friendship_xp: 3 });
    expect(await xpOf(id)).toBe(3);
    expect(await tick(ua)).toMatchObject({ granted: false, reason: 'already' });
    expect(await claim(ub)).toBe(6);
    expect(await claim(ub)).toBe(0);
  });

  it('하루 6번까지만 받는다', async () => {
    const { ua, ub, id } = await friends('co-e', 'co-f');
    await givePet(db, ub, 'fox');
    await set(ua, id);
    for (let i = 0; i < 6; i++) {
      expect((await tick(ua)).granted).toBe(true);
      await nextHour(ua);
    }
    expect(await tick(ua)).toMatchObject({ granted: false, reason: 'daily_limit' });
    expect(await claim(ub)).toBe(36);
  });

  it('동행을 안 하거나 친구가 끊겼거나 친구에게 펫이 없으면 보너스가 없다', async () => {
    const { ua, ub, id } = await friends('co-g', 'co-h');
    expect((await tick(ua)).granted).toBe(false); // 아무도 안 골랐다
    await set(ua, id);
    await admin(db, 'delete from public.pets where owner_id = $1', [ub]);
    expect((await tick(ua)).granted).toBe(false); // 펫이 없다
    await givePet(db, ub, 'cat');
    await as(db, ua, () => db.query('select public.friend_remove($1)', [id]));
    expect((await tick(ua)).granted).toBe(false); // 친구가 아니다
  });

  it('로그인하지 않으면 못 부르고, 표를 직접 읽을 수 없다', async () => {
    expect(await errorOf(() => as(db, null, () => db.query('select public.companion_tick()')))).toMatch(/permission denied/);
    const u = await signUp(db, 'co-sec');
    expect(await errorOf(() => as(db, u, () => db.query('select * from public.companion_pending')))).toMatch(/permission denied/);
    expect(await errorOf(() => as(db, u, () => db.query('select * from public.companion_ticks')))).toMatch(/permission denied/);
  });
});

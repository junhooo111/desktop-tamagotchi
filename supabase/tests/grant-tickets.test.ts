import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { GIFTS_PER_DAY } from '../../src/shared/gift.js';
import { CARE_PER_TICKET, UPDATE_GIFT_TICKETS, UPTIME_TICKETS_PER_DAY, WELCOME_TICKETS, ticketsForLevel } from '../../src/shared/collection.js';
import { admin, as, createDb, errorOf, signUp, ticketMismatches, ticketsOf, type Db } from './helpers.js';

let db: Db;
beforeAll(async () => {
  db = await createDb();
}, 60_000);
afterAll(async () => {
  expect(await ticketMismatches(db)).toEqual([]);
  await db.close();
});

const grant = (uid: string, kind: string, amount: number, key: string) =>
  as(db, uid, async () => (await db.query<{ r: { granted: number; tickets: number } }>('select public.grant_tickets($1, $2, $3) as r', [kind, amount, key])).rows[0]!.r);

describe('뽑기권 획득 (grant_tickets) — 앱 규칙의 상한과 같은 값', () => {
  it('앱의 상수와 서버의 상한이 같다(출석·켜 둔 시간·선물·업데이트·돌봄 간격)', async () => {
    const u = await signUp(db, 'consts');
    // 켜 둔 시간: 하루 UPTIME_TICKETS_PER_DAY 장
    let got = 0;
    for (let i = 0; i < UPTIME_TICKETS_PER_DAY + 3; i++) got += (await grant(u, 'uptime', 1, `u${i}`)).granted;
    expect(got).toBe(UPTIME_TICKETS_PER_DAY);
    // 선물: 하루 GIFTS_PER_DAY 장
    got = 0;
    for (let i = 0; i < GIFTS_PER_DAY + 3; i++) got += (await grant(u, 'gift', 1, `g${i}`)).granted;
    expect(got).toBe(GIFTS_PER_DAY);
    // 업데이트 선물: 열쇠(버전)마다 한 번, 한 번에 UPDATE_GIFT_TICKETS 장
    expect((await grant(u, 'update', UPDATE_GIFT_TICKETS, '0.10.0')).granted).toBe(UPDATE_GIFT_TICKETS);
    expect((await grant(u, 'update', UPDATE_GIFT_TICKETS, '0.10.0')).granted).toBe(0);
    expect(CARE_PER_TICKET).toBe(25); // 돌봄 간격은 앱이 센다. 서버는 하루 8장까지만 인정한다.
    expect(ticketsForLevel(5)).toBe(2); // 레벨 보상은 한 번에 최대 2장
  });

  it('같은 (종류, 열쇠)를 다시 보내면 무시한다(멱등)', async () => {
    const u = await signUp(db, 'idem');
    expect(await grant(u, 'level', 2, 'cat:5')).toEqual({ granted: 2, tickets: WELCOME_TICKETS + 2 });
    expect(await grant(u, 'level', 2, 'cat:5')).toEqual({ granted: 0, tickets: WELCOME_TICKETS + 2 });
    expect(await grant(u, 'level', 2, 'cat:10')).toEqual({ granted: 2, tickets: WELCOME_TICKETS + 4 });
  });

  it('돌봄은 하루 8장까지, 다음 날에는 다시 받는다', async () => {
    const u = await signUp(db, 'care');
    let got = 0;
    for (let i = 0; i < 12; i++) got += (await grant(u, 'care', 1, `n${i}`)).granted;
    expect(got).toBe(8);
    await admin(db, "update public.ticket_grants set created_at = created_at - interval '1 day' where user_id = $1", [u]);
    expect((await grant(u, 'care', 1, 'n99')).granted).toBe(1);
  });

  it('상한이 남아 있어도 한 번에 허용하는 양보다 크게 보내면 거절한다', async () => {
    const u = await signUp(db, 'big');
    expect(await errorOf(() => grant(u, 'uptime', 2, 'x'))).toMatch(/invalid_grant/);
    expect(await errorOf(() => grant(u, 'level', 3, 'x'))).toMatch(/invalid_grant/);
    expect(await errorOf(() => grant(u, 'update', 3, 'x'))).toMatch(/invalid_grant/);
    expect(await ticketsOf(db, u)).toBe(WELCOME_TICKETS);
  });

  it('모르는 종류·잘못된 열쇠·0 이하 양은 거절한다', async () => {
    const u = await signUp(db, 'bad');
    expect(await errorOf(() => grant(u, 'hack', 1, 'x'))).toMatch(/invalid_grant/);
    expect(await errorOf(() => grant(u, 'care', 0, 'x'))).toMatch(/invalid_grant/);
    expect(await errorOf(() => grant(u, 'care', -5, 'x'))).toMatch(/invalid_grant/);
    expect(await errorOf(() => grant(u, 'care', 1, ''))).toMatch(/invalid_grant/);
    expect(await errorOf(() => grant(u, 'care', 1, 'k'.repeat(65)))).toMatch(/invalid_grant/);
    expect(await ticketsOf(db, u)).toBe(WELCOME_TICKETS);
  });

  it('원장에 종류별로 남고, 사용자끼리 상한이 섞이지 않는다', async () => {
    const a = await signUp(db, 'ledgerA');
    const b = await signUp(db, 'ledgerB');
    await grant(a, 'gift', 1, 'g1');
    await grant(b, 'gift', 1, 'g1');
    expect((await db.query("select delta, currency from public.ledger where user_id = $1 and reason = 'gift'", [a])).rows).toEqual([{ delta: 1, currency: 'ticket' }]);
    expect((await grant(b, 'gift', 1, 'g2')).granted).toBe(1);
  });

  it('로그인하지 않으면 못 부르고, 표를 직접 고칠 수도 없다', async () => {
    expect(await errorOf(() => as(db, null, () => db.query("select public.grant_tickets('care', 1, 'x')")))).toMatch(/permission denied/);
    const u = await signUp(db, 'direct');
    expect(await errorOf(() => as(db, u, () => db.query("insert into public.ticket_grants (user_id, kind, key, amount) values ($1, 'care', 'x', 100)", [u])))).toMatch(/permission denied/);
    expect(await errorOf(() => as(db, u, () => db.query("update public.profiles set tickets = 9999 where user_id = $1", [u])))).toMatch(/permission denied/);
  });
});

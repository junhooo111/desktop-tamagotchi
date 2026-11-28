import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { admin, as, createDb, errorOf, ledgerMismatches, signUp, ticketMismatches, ticketsOf, type Db } from './helpers.js';

let db: Db;
beforeAll(async () => {
  db = await createDb();
}, 60_000);
afterAll(async () => {
  expect(await ledgerMismatches(db)).toEqual([]);
  expect(await ticketMismatches(db)).toEqual([]);
  await db.close();
});

type State = { pet: number; care: number; learn: number; social: number; completed: boolean; streak: number; reward: number };
const report = (u: string, kind: string) => as(db, u, async () => (await db.query<{ r: State }>('select public.mission_report($1) as r', [kind])).rows[0]!.r);
const state = (u: string) => as(db, u, async () => (await db.query<{ r: State }>('select public.mission_state() as r')).rows[0]!.r);
async function doAll(u: string): Promise<State> {
  let last!: State;
  for (const [kind, n] of [['pet', 3], ['care', 5], ['learn', 1], ['social', 1]] as const) for (let i = 0; i < n; i++) last = await report(u, kind);
  return last;
}
/** 시험에서 하루를 건너뛴다: 기록과 마지막 날짜를 n 일 앞당긴다 */
async function skipDays(u: string, n: number): Promise<void> {
  await admin(db, 'update public.daily_missions set day = day - $2::int where user_id = $1', [u, n]);
  await admin(db, 'update public.profiles set mission_last = mission_last - $2::int where user_id = $1', [u, n]);
}

describe('일일 미션', () => {
  it('진행이 쌓이고 목표를 넘기지 않는다', async () => {
    const u = await signUp(db, 'ms-a');
    for (let i = 0; i < 6; i++) await report(u, 'pet');
    expect(await state(u)).toMatchObject({ pet: 3, care: 0, completed: false, reward: 0 });
  });

  it('네 가지를 모두 채우면 뽑기권 1장을 한 번만 받는다', async () => {
    const u = await signUp(db, 'ms-b');
    const before = await ticketsOf(db, u);
    const r = await doAll(u);
    expect(r).toMatchObject({ completed: true, reward: 1, streak: 1 });
    expect(await ticketsOf(db, u)).toBe(before + 1);
    expect((await report(u, 'pet')).reward).toBe(0); // 더 눌러도 다시 받지 않는다
    expect(await ticketsOf(db, u)).toBe(before + 1);
  });

  it('연속으로 채우면 3일째 +1, 이틀 건너뛰면 처음부터', async () => {
    const u = await signUp(db, 'ms-c');
    const rewards: number[] = [];
    for (let d = 0; d < 3; d++) {
      rewards.push((await doAll(u)).reward);
      await skipDays(u, 1);
    }
    expect(rewards).toEqual([1, 1, 2]);
    await skipDays(u, 2);
    expect((await state(u)).streak).toBe(0);
    expect(await doAll(u)).toMatchObject({ reward: 1, streak: 1 });
  });

  it('잘못된 종류·로그인 안 함·표 직접 접근은 거절된다', async () => {
    const u = await signUp(db, 'ms-d');
    expect(await errorOf(() => report(u, 'cheat'))).toMatch(/invalid_kind/);
    expect(await errorOf(() => as(db, null, () => db.query('select public.mission_state()')))).toMatch(/permission denied/);
    expect(await errorOf(() => as(db, u, () => db.query('select * from public.daily_missions')))).toMatch(/permission denied/);
  });
});

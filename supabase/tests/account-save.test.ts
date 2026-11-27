import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { as, createDb, errorOf, signUp, type Db } from './helpers.js';

let db: Db;
let alice: string;
let bob: string;

beforeAll(async () => {
  db = await createDb();
  alice = await signUp(db, 'alice');
  bob = await signUp(db, 'bob');
}, 60_000);
afterAll(async () => {
  await db.close();
});

const put = (uid: string, data: unknown, expected: number, device = 'pc-a') =>
  as(db, uid, async () => (await db.query<{ r: { version: number } }>('select public.save_put($1::jsonb, 1, $2, $3) as r', [JSON.stringify(data), expected, device])).rows[0]!.r);
const get = (uid: string) =>
  as(db, uid, async () => (await db.query<{ r: { version: number; data: unknown; device: string } | null }>('select public.save_get() as r')).rows[0]!.r);

describe('계정 저장분', () => {
  it('저장분이 없으면 null', async () => {
    expect(await get(alice)).toBeNull();
  });

  it('처음 올리면 버전 1, 읽으면 같은 내용', async () => {
    expect(await put(alice, { collection: { tickets: 5 } }, 0)).toEqual({ version: 1 });
    const r = await get(alice);
    expect(r?.version).toBe(1);
    expect(r?.data).toEqual({ collection: { tickets: 5 } });
    expect(r?.device).toBe('pc-a');
  });

  it('이미 있는데 처음 올리듯(expected 0) 올리면 거절해서 덮어쓰지 않는다', async () => {
    expect(await errorOf(() => put(alice, { collection: { tickets: 99 } }, 0))).toMatch(/version_conflict/);
    expect((await get(alice))?.data).toEqual({ collection: { tickets: 5 } });
  });

  it('최신 버전을 보고 저장하면 버전이 오른다', async () => {
    expect(await put(alice, { collection: { tickets: 6 } }, 1, 'pc-b')).toEqual({ version: 2 });
    expect((await get(alice))?.device).toBe('pc-b');
  });

  it('낡은 버전으로 저장하면 거절한다(다른 PC가 먼저 저장한 경우)', async () => {
    expect(await errorOf(() => put(alice, { collection: { tickets: 1 } }, 1))).toMatch(/version_conflict/);
    expect((await get(alice))?.data).toEqual({ collection: { tickets: 6 } });
  });

  it('덮어쓸 때마다 이전 내용을 백업하고 최근 10개만 둔다', async () => {
    for (let v = 2; v <= 14; v++) await put(alice, { n: v }, v);
    const b = (await db.query<{ version: number }>('select version from public.account_save_backups where user_id = $1 order by version', [alice])).rows.map((r) => r.version);
    expect(b).toHaveLength(10);
    expect(Math.max(...b)).toBe(14);
    expect(Math.min(...b)).toBe(5);
  });

  it('남의 저장분은 읽지도 쓰지도 못한다', async () => {
    expect(await get(bob)).toBeNull();
    const direct = await as(db, bob, async () => (await db.query('select * from public.account_saves')).rows);
    expect(direct).toEqual([]);
    expect(await errorOf(() => as(db, bob, () => db.query("update public.account_saves set data = '{}'")))).toMatch(/permission denied/);
    expect(await errorOf(() => as(db, bob, () => db.query('select * from public.account_save_backups')))).toMatch(/permission denied/);
  });

  it('로그인하지 않으면 함수를 부를 수 없다', async () => {
    expect(await errorOf(() => as(db, null, () => db.query('select public.save_get()')))).toMatch(/permission denied/);
    expect(await errorOf(() => as(db, null, () => db.query("select public.save_put('{}'::jsonb, 1, 0)")))).toMatch(/permission denied/);
  });

  it('형태·크기를 검사한다', async () => {
    expect(await errorOf(() => put(bob, [1, 2], 0))).toMatch(/invalid_data/);
    expect(await errorOf(() => put(bob, { big: 'x'.repeat(310_000) }, 0))).toMatch(/too_large/);
    expect(await errorOf(() => put(bob, { a: 1 }, -1))).toMatch(/invalid_expected_version/);
    expect(await errorOf(() => put(bob, { a: 1 }, 0, 'd'.repeat(81)))).toMatch(/invalid_device/);
  });

  it('직접 insert/delete 도 막혀 있다', async () => {
    expect(await errorOf(() => as(db, bob, () => db.query("insert into public.account_saves (user_id, data) values ($1, '{}')", [bob])))).toMatch(/permission denied/);
    expect(await errorOf(() => as(db, alice, () => db.query('delete from public.account_saves')))).toMatch(/permission denied/);
  });
});

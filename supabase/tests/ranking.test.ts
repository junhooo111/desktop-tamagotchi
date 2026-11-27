import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { admin, as, createDb, errorOf, givePet, signUp, type Db } from './helpers.js';

let db: Db;
let a: string; // 종 3(히든 1), 펫 4, 레벨 높음
let b: string; // 종 2, 펫 2
let c: string; // 펫 없음
let d: string; // 종 5 지만 랭킹에서 빠짐

beforeAll(async () => {
  db = await createDb();
  a = await signUp(db, 'alice');
  b = await signUp(db, 'bob');
  c = await signUp(db, 'carol');
  d = await signUp(db, 'dave');
  await givePet(db, a, 'cat', 1000); // 레벨 11
  await givePet(db, a, 'cat', 0);
  await givePet(db, a, 'dog', 0);
  await givePet(db, a, 'azure', 0);
  await givePet(db, b, 'duck', 40); // 레벨 3
  await givePet(db, b, 'chick', 0);
  for (const sp of ['rabbit', 'fox', 'owl', 'panda', 'pig']) await givePet(db, d, sp, 0);
  await admin(db, "insert into public.ledger (user_id, delta, reason, currency) values ($1, -3, 'gacha', 'ticket'), ($1, -3, 'gacha', 'ticket')", [a]);
  await admin(db, "insert into public.cosmetics (user_id, kind, item_id) values ($1, 'accessory', 'crown')", [b]);
  await admin(db, 'update public.profiles set show_in_ranking = false where user_id = $1', [d]);
}, 60_000);
afterAll(async () => {
  await db.close();
});

type Row = { rank: number; github_login: string; avatar_url: string | null; value: number; is_me: boolean };
const board = (uid: string | null, metric: string, limit = 20) =>
  as(db, uid, async () => (await db.query<Row>('select * from public.leaderboard($1, $2)', [metric, limit])).rows);
const summary = (uid: string) => as(db, uid, async () => (await db.query<{ r: Record<string, unknown> }>('select public.my_summary() as r')).rows[0]!.r);

describe('랭킹 (leaderboard)', () => {
  it('종 수: 내림차순이고, 점수가 0 인 사람과 랭킹에서 빠진 사람은 나오지 않는다', async () => {
    const rows = await board(b, 'species');
    expect(rows.map((r) => [r.rank, r.github_login, r.value])).toEqual([[1, 'alice', 3], [2, 'bob', 2]]);
  });

  it('내 줄에는 is_me 가 표시된다', async () => {
    const rows = await board(b, 'species');
    expect(rows.map((r) => r.is_me)).toEqual([false, true]);
  });

  it('히든 수·펫 수·최고 레벨·뽑기 횟수·꾸미기 수를 각각 서버가 계산한다', async () => {
    expect((await board(a, 'hidden')).map((r) => [r.github_login, r.value])).toEqual([['alice', 1]]);
    expect((await board(a, 'pets')).map((r) => [r.github_login, r.value])).toEqual([['alice', 4], ['bob', 2]]);
    expect((await board(a, 'level')).map((r) => [r.github_login, r.value])).toEqual([['alice', 11], ['bob', 3]]);
    expect((await board(a, 'pulls')).map((r) => [r.github_login, r.value])).toEqual([['alice', 2]]);
    expect((await board(a, 'cosmetics')).map((r) => [r.github_login, r.value])).toEqual([['bob', 1]]);
  });

  it('동점이면 같은 순위로 표시하고 이름순으로 정렬한다', async () => {
    await givePet(db, c, 'cat', 0);
    await givePet(db, c, 'dog', 0);
    const rows = await board(a, 'species');
    expect(rows.map((r) => [r.rank, r.github_login, r.value])).toEqual([[1, 'alice', 3], [2, 'bob', 2], [2, 'carol', 2]]);
  });

  it('개수 제한이 동작하고 잘못된 값은 거절한다', async () => {
    expect(await board(a, 'species', 1)).toHaveLength(1);
    expect(await errorOf(() => board(a, 'coins'))).toMatch(/invalid_metric/);
    expect(await errorOf(() => board(a, 'species', 0))).toMatch(/invalid_limit/);
    expect(await errorOf(() => board(a, 'species', 51))).toMatch(/invalid_limit/);
  });

  it('로그인하지 않으면 볼 수 없고, 이메일·재화 같은 열은 아예 없다', async () => {
    expect(await errorOf(() => board(null, 'species'))).toMatch(/permission denied/);
    const rows = await board(a, 'species');
    expect(Object.keys(rows[0]!).sort()).toEqual(['avatar_url', 'github_login', 'is_me', 'rank', 'value']);
  });
});

describe('내 요약 (my_summary)', () => {
  it('내 점수·순위·뽑기권·게임머니를 돌려준다', async () => {
    const s = await summary(a);
    expect(s).toMatchObject({ github_login: 'alice', show_in_ranking: true, tickets: 3, coins: 100 });
    expect(s['scores']).toEqual({ species: 3, hidden: 1, pets: 4, level: 11, pulls: 2, cosmetics: 0 });
    expect((s['ranks'] as Record<string, number>)['species']).toBe(1);
  });

  it('랭킹에서 빠져 있어도 내 점수는 보이지만 순위는 없다', async () => {
    const s = await summary(d);
    expect(s).toMatchObject({ show_in_ranking: false });
    expect((s['scores'] as Record<string, number>)['species']).toBe(5);
    expect(s['ranks']).toEqual({});
  });

  it('공개 여부를 바꾸면 랭킹에 나오고 사라진다', async () => {
    await as(db, d, () => db.query('select public.set_ranking_visibility(true)'));
    expect((await board(a, 'species')).map((r) => r.github_login)[0]).toBe('dave');
    await as(db, d, () => db.query('select public.set_ranking_visibility(false)'));
    expect((await board(a, 'species')).map((r) => r.github_login)).not.toContain('dave');
  });

  it('남의 공개 여부는 못 바꾸고, 로그인하지 않으면 못 부른다', async () => {
    await as(db, b, () => db.query('select public.set_ranking_visibility(false)'));
    expect((await db.query<{ show_in_ranking: boolean }>('select show_in_ranking from public.profiles where user_id = $1', [a])).rows[0]!.show_in_ranking).toBe(true);
    await as(db, b, () => db.query('select public.set_ranking_visibility(true)'));
    expect(await errorOf(() => as(db, null, () => db.query('select public.my_summary()')))).toMatch(/permission denied/);
    expect(await errorOf(() => as(db, null, () => db.query('select public.set_ranking_visibility(true)')))).toMatch(/permission denied/);
    expect(await errorOf(() => as(db, a, () => db.query('select * from public.ranking_scores()')))).toMatch(/permission denied/);
  });
});

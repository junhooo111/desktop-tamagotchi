import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { levelOf } from '../../src/shared/pet.js';
import { as, createDb, errorOf, givePet, signUp, type Db } from './helpers.js';

let db: Db;
let alice: string;
let bob: string;
let alicePet: string;

beforeAll(async () => {
  db = await createDb();
  alice = await signUp(db, 'alice');
  bob = await signUp(db, 'bob');
  alicePet = await givePet(db, alice, 'cat', 40);
  await db.query("insert into public.learning_events (id, user_id, kind) values (gen_random_uuid(), $1, 'tip')", [alice]);
}, 60_000);

afterAll(async () => {
  await db.close();
});

const rows = async (sql: string): Promise<unknown[]> => (await db.query(sql)).rows;

describe('가입', () => {
  it('GitHub 로그인으로 가입하면 프로필과 환영 게임머니 100·뽑기권 3장이 생기고 원장에도 남는다', async () => {
    const p = (await db.query<{ github_login: string; avatar_url: string; coins: number; tickets: number }>(
      'select github_login, avatar_url, coins, tickets from public.profiles where user_id = $1',
      [alice],
    )).rows[0];
    expect(p).toEqual({ github_login: 'alice', avatar_url: 'https://avatars.example/alice.png', coins: 100, tickets: 3 });
    const ledger = (await db.query('select delta, reason, currency from public.ledger where user_id = $1 order by currency', [alice])).rows;
    expect(ledger).toEqual([{ delta: 100, reason: 'welcome', currency: 'coin' }, { delta: 3, reason: 'welcome', currency: 'ticket' }]);
  });

  it('user_name 이 없으면 preferred_username, 그것도 없으면 임시 이름을 쓴다', async () => {
    const id = (await db.query<{ id: string }>(
      `insert into auth.users (raw_user_meta_data) values ('{"preferred_username":"pref"}') returning id`,
    )).rows[0]!.id;
    const id2 = (await db.query<{ id: string }>('insert into auth.users default values returning id')).rows[0]!.id;
    const names = (await db.query<{ github_login: string }>(
      'select github_login from public.profiles where user_id in ($1, $2) order by github_login',
      [id, id2],
    )).rows.map((r) => r.github_login);
    expect(names).toContain('pref');
    expect(names.some((n) => n.startsWith('user-'))).toBe(true);
  });

  it('같은 GitHub 이름이 둘이어도 가입이 막히지 않는다(이름 변경 후 다른 사람이 쓸 수 있다)', async () => {
    await signUp(db, 'dup');
    expect(await errorOf(() => signUp(db, 'dup'))).toBeNull();
  });
});

describe('읽기 권한(RLS)', () => {
  it('방문자(anon)는 펫 종류만 볼 수 있고 프로필·원장·학습 기록은 못 본다', async () => {
    await as(db, null, async () => {
      expect((await rows('select id from public.species')).length).toBe(28);
      for (const table of ['profiles', 'ledger', 'learning_events']) {
        expect(await errorOf(() => db.query(`select * from public.${table}`)), table).toMatch(/permission denied/);
      }
    });
  });

  it('로그인한 사용자는 자기 프로필·원장·학습 기록만 본다', async () => {
    await as(db, alice, async () => {
      expect(await rows('select user_id from public.profiles')).toEqual([{ user_id: alice }]);
      expect((await rows('select user_id from public.ledger')).every((r) => (r as { user_id: string }).user_id === alice)).toBe(true);
      expect(await rows('select id from public.learning_events')).toHaveLength(1);
    });
    await as(db, bob, async () => {
      expect(await rows('select id from public.learning_events')).toHaveLength(0);
    });
  });

  it('남의 펫은 안 보이고, 마켓에 올라온 펫만 누구에게나 보인다', async () => {
    await as(db, bob, async () => {
      expect(await rows('select id from public.pets')).toHaveLength(0);
    });
    await givePet(db, alice, 'dog', 0); // 팔고도 한 마리는 남아야 한다(마지막 한 마리는 팔 수 없다)
    await as(db, alice, async () => {
      await db.query('select public.create_listing($1, 50)', [alicePet]);
    });
    await as(db, bob, async () => {
      expect(await rows('select id from public.pets')).toEqual([{ id: alicePet }]);
    });
    await as(db, null, async () => {
      expect(await rows('select id from public.pets')).toEqual([{ id: alicePet }]);
      expect(await rows('select price from public.listings')).toEqual([{ price: 50 }]);
    });
  });

  it('공개 프로필 뷰에는 이름과 아바타만 있고 재화·장착 펫은 없다', async () => {
    await as(db, null, async () => {
      const res = await db.query('select * from public.public_profiles where github_login = $1', ['alice']);
      expect(Object.keys(res.rows[0] as object).sort()).toEqual(['avatar_url', 'github_login', 'user_id']);
    });
  });
});

describe('쓰기 권한: 클라이언트는 어떤 테이블도 직접 고칠 수 없다', () => {
  const attempts: [string, string][] = [
    ['재화 직접 수정', "update public.profiles set coins = 999999 where user_id = '%U'"],
    ['펫 경험치 직접 수정', "update public.pets set xp = 99999 where owner_id = '%U'"],
    ['펫 직접 생성', "insert into public.pets (owner_id, species_id) values ('%U', 'turtle')"],
    ['원장 위조', "insert into public.ledger (user_id, delta, reason) values ('%U', 1000, 'learn')"],
    ['원장 삭제', 'delete from public.ledger'],
    ['판매글 가격 수정', 'update public.listings set price = 1'],
    ['판매글 직접 생성', "insert into public.listings (pet_id, seller_id, price) values (gen_random_uuid(), '%U', 1)"],
    ['학습 이벤트 직접 기록', "insert into public.learning_events (id, user_id, kind) values (gen_random_uuid(), '%U', 'fixed')"],
    ['종 카탈로그 수정', "update public.species set gacha_weight = 1000 where id = 'turtle'"],
  ];

  it.each(attempts)('%s 는 거부된다', async (_name, sql) => {
    await as(db, alice, async () => {
      expect(await errorOf(() => db.query(sql.replaceAll('%U', alice)))).toMatch(/permission denied/);
    });
    await as(db, null, async () => {
      expect(await errorOf(() => db.query(sql.replaceAll('%U', alice)))).toMatch(/permission denied/);
    });
  });

  it('권한 시험이 끝난 뒤에도 값은 그대로다', async () => {
    expect((await db.query<{ coins: number }>('select coins from public.profiles where user_id = $1', [alice])).rows[0]!.coins).toBe(100);
  });
});

describe('서버 함수 실행 권한', () => {
  const calls = [
    'select public.report_learning(\'[]\'::jsonb)',
    'select public.gacha_pull()',
    'select public.create_listing(gen_random_uuid(), 10)',
    'select public.cancel_listing(gen_random_uuid())',
    'select public.buy_listing(gen_random_uuid())',
    'select public.equip_pet(gen_random_uuid())',
    'select public.evolve_pet(gen_random_uuid())',
  ];

  it.each(calls)('방문자는 %s 를 부를 수 없다', async (sql) => {
    await as(db, null, async () => {
      expect(await errorOf(() => db.query(sql))).toMatch(/permission denied/);
    });
  });

  it('가입 트리거용 함수는 로그인한 사용자도 직접 부를 수 없다', async () => {
    await as(db, alice, async () => {
      expect(await errorOf(() => db.query('select public.handle_new_user()'))).toMatch(/permission denied/);
    });
  });
});

describe('레벨 공식: SQL 과 앱(levelOf)이 같다', () => {
  it.each([0, 1, 9, 10, 19, 20, 39, 40, 159, 160, 999, 1000, 12345])('xp %i', async (xp) => {
    const id = (await db.query<{ id: string }>(
      "insert into public.pets (owner_id, species_id, xp) values ($1, 'chick', $2) returning id",
      [alice, xp],
    )).rows[0]!.id;
    const level = (await db.query<{ level: number }>('select level from public.pets where id = $1', [id])).rows[0]!.level;
    expect(level).toBe(levelOf(xp));
  });
});

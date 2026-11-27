import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { admin, as, createDb, givePet, signUp, type Db } from './helpers.js';

let db: Db;
let alice: string;

beforeAll(async () => {
  db = await createDb();
  alice = await signUp(db, 'Alice');
  const a1 = await givePet(db, alice, 'cat', 50);
  await givePet(db, alice, 'dragon', 900);
  await givePet(db, alice, 'cat', 10);
  await admin(db, 'update public.profiles set equipped_pet_id = $2 where user_id = $1', [alice, a1]);
  const bob = await signUp(db, 'bob');
  await givePet(db, bob, 'duck', 300);
  await signUp(db, 'carol'); // 펫 없음
  const dave = await signUp(db, 'dave');
  await givePet(db, dave, 'owl', 100);
  await admin(db, 'update public.profiles set show_in_ranking = false where user_id = $1', [dave]);
}, 60_000);
afterAll(async () => {
  await db.close();
});

const card = (login: unknown, uid: string | null = null) =>
  as(db, uid, async () => (await db.query<{ r: Record<string, unknown> }>('select public.public_card_data($1) as r', [login])).rows[0]!.r);

describe('프로필 카드 공개 데이터 (public_card_data)', () => {
  it('로그인하지 않은 방문자도 부를 수 있고, 장착한 펫의 종·경험치와 도감 수를 돌려준다', async () => {
    expect(await card('alice')).toEqual({ found: true, github_login: 'Alice', species_id: 'cat', xp: 50, species_count: 2 });
  });

  it('GitHub 이름은 대소문자를 구분하지 않는다', async () => {
    expect((await card('ALICE'))['github_login']).toBe('Alice');
  });

  it('장착한 펫이 없으면 경험치가 가장 높은 펫을 쓴다', async () => {
    await admin(db, 'update public.profiles set equipped_pet_id = null where user_id = $1', [alice]);
    expect(await card('alice')).toMatchObject({ species_id: 'dragon', xp: 900 });
  });

  it('펫이 없는 사용자는 찾았지만 펫 정보는 비어 있다', async () => {
    expect(await card('carol')).toEqual({ found: true, github_login: 'carol', species_id: null, xp: null, species_count: 0 });
  });

  it('없는 사용자·랭킹에서 숨긴 사용자는 찾지 못한 것으로 돌려준다(숨김 여부도 드러내지 않는다)', async () => {
    expect(await card('nobody')).toEqual({ found: false });
    expect(await card('dave')).toEqual({ found: false });
  });

  it('이름 형식이 잘못되면 찾지 않는다(주입·너무 긴 값)', async () => {
    for (const bad of ["a'; drop table x;--", 'a b', '', 'x'.repeat(40), null, 'ünï']) expect(await card(bad), String(bad)).toEqual({ found: false });
  });

  it('같은 이름이 여럿이면 가장 최근에 가입한 사람의 것을 쓴다', async () => {
    const other = await signUp(db, 'ALICE');
    await givePet(db, other, 'fox', 20);
    await admin(db, "update public.profiles set created_at = now() + interval '1 hour' where user_id = $1", [other]);
    expect(await card('alice')).toMatchObject({ github_login: 'ALICE', species_id: 'fox' });
  });

  it('이메일·재화·뽑기권·사용자 번호는 돌려주지 않는다', async () => {
    const keys = Object.keys(await card('bob')).sort();
    expect(keys).toEqual(['found', 'github_login', 'species_count', 'species_id', 'xp']);
  });
});

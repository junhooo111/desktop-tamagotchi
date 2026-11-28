import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { as, createDb, errorOf, givePet, signUp, type Db } from './helpers.js';

let db: Db;
beforeAll(async () => {
  db = await createDb();
}, 60_000);
afterAll(async () => {
  await db.close();
});

const set = (uid: string, extras: unknown) =>
  as(db, uid, () => db.query('select public.set_card_extras($1::jsonb)', [JSON.stringify(extras)]));
const card = async (login: string) => (await db.query<{ r: Record<string, unknown> }>('select public.public_card_data($1) as r', [login])).rows[0]!.r;
const today = async () => (await db.query<{ d: string }>("select (now() at time zone 'utc')::date::text as d")).rows[0]!.d;

describe('카드 꾸미기 값 (set_card_extras)', () => {
  it('값을 저장하면 공개 카드 데이터에 extras 로 나오고, 저장하지 않은 사용자는 extras 가 없다', async () => {
    const u = await signUp(db, 'ann');
    await givePet(db, u, 'cat', 50);
    expect((await card('ann'))['extras']).toBeUndefined();
    const day = await today();
    await set(u, { variant: 'pastel', accessory: 'crown', name: '콩이', stage: 'adult', species: 'cat', streak: 5, fixes: 12, quiz: 7, rules: 9, tips: 30, badges: 11, day });
    expect((await card('ann'))['extras']).toEqual({ variant: 'pastel', accessory: 'crown', neck: 'none', effect: 'none', name: '콩이', stage: 'adult', species: 'cat', streak: 5, fixes: 12, quiz: 7, rules: 9, tips: 30, badges: 11, day });
  });

  it('허용하지 않는 값은 기본값으로, 숫자는 범위 안으로, 이름은 다듬는다', async () => {
    const u = await signUp(db, 'bea');
    await givePet(db, u, 'dog', 1);
    await set(u, { variant: 'neon', accessory: 'laser', name: '  <b>아주긴이름을가진펫이에요요요</b>\n', stage: 'egg', species: 'chimera', streak: -4, fixes: 'x', quiz: 99999999, rules: 500, tips: 1.9, badges: 3.7, day: '2001-01-01' });
    const e = (await card('bea'))['extras'] as Record<string, unknown>;
    expect(e).toMatchObject({ variant: 'default', accessory: 'none', streak: 0, fixes: 0, quiz: 100000, rules: 50, tips: 1, badges: 3, day: await today() });
    expect(e['stage']).toBeUndefined();
    expect(e['species']).toBeUndefined();
    expect(e['name']).toBe('b아주긴이름을가진펫이에'); // 꺾쇠·줄바꿈 제거 뒤 12자
  });

  it('카드에 보여 줄 동물로 고른 종은 실제로 가지고 있을 때만 쓰고, 없으면 원래 규칙(장착·가장 센 펫)을 따른다', async () => {
    const u = await signUp(db, 'cy');
    await givePet(db, u, 'cat', 500);
    await givePet(db, u, 'owl', 20);
    await set(u, { species: 'owl' });
    expect(await card('cy')).toMatchObject({ species_id: 'owl', xp: 20 });
    await set(u, { species: 'dragon' }); // 안 가진 동물
    expect(await card('cy')).toMatchObject({ species_id: 'cat', xp: 500 });
  });

  it('랭킹에서 숨긴 사용자는 extras 도 공개되지 않고, 로그인하지 않으면 저장할 수 없다', async () => {
    const u = await signUp(db, 'dee');
    await givePet(db, u, 'owl', 5);
    await set(u, { accessory: 'halo' });
    await db.query('update public.profiles set show_in_ranking = false where user_id = $1', [u]);
    expect(await card('dee')).toEqual({ found: false });
    expect(await errorOf(() => as(db, null, () => db.query("select public.set_card_extras('{}'::jsonb)")))).toMatch(/permission denied/);
  });

  it('객체가 아니면 거절한다', async () => {
    const u = await signUp(db, 'eve');
    expect(await errorOf(() => as(db, u, () => db.query("select public.set_card_extras('[1,2]'::jsonb)")))).toMatch(/invalid_extras/);
  });
});

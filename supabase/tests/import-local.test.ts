import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { admin, as, createDb, errorOf, givePet, ledgerMismatches, signUp, ticketMismatches, ticketsOf, type Db } from './helpers.js';

let db: Db;

beforeAll(async () => {
  db = await createDb();
}, 60_000);
afterAll(async () => {
  expect(await ledgerMismatches(db)).toEqual([]);
  expect(await ticketMismatches(db)).toEqual([]);
  await db.close();
});

/** 앱이 올린 계정 저장분을 흉내 낸다(collection.json 한 파일). */
const saveCollection = (uid: string, collection: unknown, files: Record<string, unknown> = {}) =>
  admin(db, "insert into public.account_saves (user_id, data) values ($1, $2::jsonb)", [uid, JSON.stringify({ schema: 1, appVersion: '0.9.0', files: { 'collection.json': collection, ...files } })]);

const run = (uid: string) =>
  as(db, uid, async () => (await db.query<{ r: Record<string, unknown> }>('select public.import_local_collection() as r')).rows[0]!.r);

const played = {
  owned: {
    cat: { pet: { speciesId: 'cat', xp: 250 }, name: '나비', count: 3, rewardedLevel: 5 },
    dragon: { pet: { speciesId: 'dragon', xp: 40 }, name: '', count: 1, rewardedLevel: 2 },
    rabbit: { pet: { speciesId: 'rabbit', xp: 0 }, name: '', count: 1, rewardedLevel: 1 },
  },
  active: 'dragon',
  tickets: 12,
  pulls: 9,
  sinceHidden: 7,
  accessories: ['crown', 'ribbon'],
  variants: ['pastel'],
};

describe('기존 로컬 진행 가져오기 (import_local_collection)', () => {
  it('저장분의 컬렉션을 서버 펫·뽑기권·꾸미기·장착·천장으로 바꾼다', async () => {
    const u = await signUp(db, 'veteran');
    await saveCollection(u, played);
    const r = await run(u);
    expect(r).toEqual({ imported: true, pets: 3, tickets: 12, cosmetics: 3 });

    const pets = (await db.query<{ species_id: string; xp: number; level: number }>('select species_id, xp, level from public.pets where owner_id = $1 order by species_id', [u])).rows;
    expect(pets).toEqual([
      { species_id: 'cat', xp: 250, level: 6 },
      { species_id: 'dragon', xp: 40, level: 3 },
      { species_id: 'rabbit', xp: 0, level: 1 },
    ]);
    expect(await ticketsOf(db, u)).toBe(3 + 12); // 환영 3 + 가져온 12
    const p = (await db.query<{ pity: number; sp: string }>('select p.pity, e.species_id as sp from public.profiles p join public.pets e on e.id = p.equipped_pet_id where p.user_id = $1', [u])).rows[0];
    expect(p).toEqual({ pity: 7, sp: 'dragon' });
    expect((await db.query<{ kind: string; item_id: string }>('select kind, item_id from public.cosmetics where user_id = $1 order by kind, item_id', [u])).rows).toEqual([
      { kind: 'accessory', item_id: 'crown' },
      { kind: 'accessory', item_id: 'ribbon' },
      { kind: 'variant', item_id: 'pastel' },
    ]);
    expect((await db.query("select delta, currency from public.ledger where user_id = $1 and reason = 'import'", [u])).rows).toEqual([{ delta: 12, currency: 'ticket' }]);
  });

  it('게임머니는 가져오지 않는다(새 재화)', async () => {
    const u = await signUp(db, 'veteran2');
    await saveCollection(u, played);
    await run(u);
    expect((await db.query<{ coins: number }>('select coins from public.profiles where user_id = $1', [u])).rows[0]!.coins).toBe(100);
  });

  it('두 번 불러도 한 번만 가져온다(복제 방지)', async () => {
    const u = await signUp(db, 'twice');
    await saveCollection(u, played);
    await run(u);
    expect(await run(u)).toEqual({ imported: false, reason: 'already_imported' });
    expect((await db.query('select id from public.pets where owner_id = $1', [u])).rows).toHaveLength(3);
    expect(await ticketsOf(db, u)).toBe(15);
  });

  it('상한을 넘는 값은 줄이고, 모르는 종·이상한 값은 건너뛴다', async () => {
    const u = await signUp(db, 'cheater');
    await saveCollection(u, {
      owned: { cat: { pet: { xp: 999999999 } }, alien: { pet: { xp: 5 } }, dog: 'oops', fox: { pet: { xp: 'many' } } },
      active: 'nothing',
      tickets: 99999,
      sinceHidden: 500,
      accessories: ['crown', 'laser-eyes', 7, null],
      variants: 'pastel',
    });
    const r = await run(u);
    expect(r).toEqual({ imported: true, pets: 2, tickets: 1000, cosmetics: 1 });
    const pets = (await db.query<{ species_id: string; xp: number }>('select species_id, xp from public.pets where owner_id = $1 order by species_id', [u])).rows;
    expect(pets).toEqual([{ species_id: 'cat', xp: 2_000_000 }, { species_id: 'fox', xp: 0 }]);
    expect((await db.query<{ pity: number }>('select pity from public.profiles where user_id = $1', [u])).rows[0]!.pity).toBe(40);
  });

  it('저장분이 없으면 아무것도 하지 않고, 나중에 올린 뒤 다시 시도할 수 있다', async () => {
    const u = await signUp(db, 'nosave');
    expect(await run(u)).toEqual({ imported: false, reason: 'no_save' });
    await saveCollection(u, played);
    expect((await run(u)).imported).toBe(true);
  });

  it('컬렉션이 없거나 형식이 틀린 저장분은 건드리지 않는다', async () => {
    const u = await signUp(db, 'broken');
    await admin(db, "insert into public.account_saves (user_id, data) values ($1, '{\"files\":{}}'::jsonb)", [u]);
    expect(await run(u)).toEqual({ imported: false, reason: 'no_collection' });
    const w = await signUp(db, 'broken2');
    await saveCollection(w, [1, 2, 3]);
    expect(await run(w)).toEqual({ imported: false, reason: 'no_collection' });
  });

  it('서버에 이미 펫이 있으면 가져오지 않는다(중복 방지)', async () => {
    const u = await signUp(db, 'hasPets');
    await givePet(db, u, 'duck', 0);
    await saveCollection(u, played);
    expect(await run(u)).toEqual({ imported: false, reason: 'has_pets' });
    expect(await ticketsOf(db, u)).toBe(3);
  });

  it('로그인하지 않으면 못 부르고, 남의 저장분은 가져올 수 없다', async () => {
    expect(await errorOf(() => as(db, null, () => db.query('select public.import_local_collection()')))).toMatch(/permission denied/);
    const a = await signUp(db, 'victimA');
    const b = await signUp(db, 'attackerB');
    await saveCollection(a, played);
    expect(await run(b)).toEqual({ imported: false, reason: 'no_save' }); // b 는 자기 저장분만 본다
    expect((await db.query('select id from public.pets where owner_id = $1', [a])).rows).toHaveLength(0);
  });

  it('가져오기 기록은 본인만 읽을 수 있고 직접 고칠 수 없다', async () => {
    const u = await signUp(db, 'audit');
    await saveCollection(u, played);
    await run(u);
    const own = await as(db, u, async () => (await db.query('select pets, tickets, cosmetics from public.account_imports')).rows);
    expect(own).toEqual([{ pets: 3, tickets: 12, cosmetics: 3 }]);
    expect(await errorOf(() => as(db, u, () => db.query('delete from public.account_imports')))).toMatch(/permission denied/);
    expect(await errorOf(() => as(db, null, () => db.query('select * from public.account_imports')))).toMatch(/permission denied/);
  });
});

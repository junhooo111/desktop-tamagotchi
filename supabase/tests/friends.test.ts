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

type Row = { friendship_id: string; friend_id: string; login: string; status: string; xp: number; level: number; next_xp: number | null; waved_today: boolean; they_waved_today: boolean; species_id: string | null };
const list = (uid: string) => as(db, uid, async () => (await db.query<Row>('select * from public.friends_list()')).rows);
const request = (uid: string, login: string) => as(db, uid, async () => (await db.query<{ r: { friendship_id: string; status: string } }>('select public.friend_request($1) as r', [login])).rows[0]!.r);
const respond = (uid: string, id: string, accept: boolean) => as(db, uid, () => db.query('select public.friend_respond($1, $2)', [id, accept]));
const wave = (uid: string, id: string) => as(db, uid, async () => (await db.query<{ r: Record<string, unknown> }>('select public.friend_wave($1) as r', [id])).rows[0]!.r);
const gift = (uid: string, id: string) => as(db, uid, async () => (await db.query<{ r: Record<string, unknown> }>('select public.friend_gift_ticket($1) as r', [id])).rows[0]!.r);

/** 친구가 된 두 사람을 만든다 */
async function makeFriends(a: string, b: string) {
  const ua = await signUp(db, a);
  const ub = await signUp(db, b);
  const { friendship_id } = await request(ua, b);
  await respond(ub, friendship_id, true);
  return { ua, ub, id: friendship_id };
}
const newDay = async (id: string) => {
  // 어제 일로 만든다(열쇠에 날짜가 들어 있어 실제로는 다음 날 열쇠가 다르다. 시험에서는 열쇠도 바꿔서 같은 효과를 낸다)
  await admin(db, "update public.friend_events set created_at = created_at - interval '1 day', key = key || ':old' || id::text where friendship_id = $1", [id]);
  await admin(db, 'update public.friendships set last_wave_lo = null, last_wave_hi = null where id = $1', [id]);
};

describe('친구 요청·수락', () => {
  it('아이디로 요청 → 상대가 수락해야 친구가 되고, 목록에서 상태가 다르게 보인다', async () => {
    const a = await signUp(db, 'amy');
    const b = await signUp(db, 'ben');
    const r = await request(a, 'BEN'); // 대소문자 무시
    expect(r.status).toBe('outgoing');
    expect((await list(a)).map((x) => [x.login, x.status])).toEqual([['ben', 'outgoing']]);
    expect((await list(b)).map((x) => [x.login, x.status])).toEqual([['amy', 'incoming']]);
    await respond(b, r.friendship_id, true);
    expect((await list(a))[0]).toMatchObject({ login: 'ben', status: 'friend', xp: 0, level: 1, next_xp: 20 });
    expect((await list(b))[0]).toMatchObject({ login: 'amy', status: 'friend' });
  });

  it('요청을 보낸 사람은 수락할 수 없고, 거절하면 기록이 사라진다', async () => {
    const a = await signUp(db, 'cat1');
    const b = await signUp(db, 'dan1');
    const { friendship_id } = await request(a, 'dan1');
    expect(await errorOf(() => respond(a, friendship_id, true))).toMatch(/not_found/);
    await respond(b, friendship_id, false);
    expect(await list(a)).toEqual([]);
    expect(await request(a, 'dan1')).toMatchObject({ status: 'outgoing' }); // 다시 요청할 수 있다
  });

  it('자기 자신·없는 사람·이상한 아이디·중복 요청·이미 친구는 거절한다', async () => {
    const a = await signUp(db, 'eve1');
    await signUp(db, 'fay1');
    expect(await errorOf(() => request(a, 'eve1'))).toMatch(/self/);
    expect(await errorOf(() => request(a, 'nobody'))).toMatch(/not_found/);
    expect(await errorOf(() => request(a, 'a b; drop'))).toMatch(/not_found/);
    await request(a, 'fay1');
    expect(await errorOf(() => request(a, 'fay1'))).toMatch(/already_requested/);
  });

  it('서로 요청하면 바로 친구가 되고, 이미 친구면 다시 요청할 수 없다', async () => {
    const a = await signUp(db, 'gus1');
    const b = await signUp(db, 'hal1');
    await request(a, 'hal1');
    expect(await request(b, 'gus1')).toMatchObject({ status: 'friend' });
    expect(await errorOf(() => request(a, 'hal1'))).toMatch(/already_friends/);
  });

  it('요청 취소·친구 끊기는 둘 중 누구나 할 수 있고, 남은 사람은 못 한다', async () => {
    const { ua, ub, id } = await makeFriends('ira1', 'jon1');
    const out = await signUp(db, 'kim1');
    expect(await errorOf(() => as(db, out, () => db.query('select public.friend_remove($1)', [id])))).toMatch(/not_found/);
    await as(db, ub, () => db.query('select public.friend_remove($1)', [id]));
    expect(await list(ua)).toEqual([]);
  });

  it('보내는 요청은 20개까지', async () => {
    const a = await signUp(db, 'spam');
    for (let i = 0; i < 20; i++) {
      await signUp(db, `target${i}`);
      await request(a, `target${i}`);
    }
    await signUp(db, 'target-extra');
    expect(await errorOf(() => request(a, 'target-extra'))).toMatch(/too_many/);
  });

  it('로그인하지 않으면 못 쓰고, 표를 직접 읽을 수도 없다', async () => {
    expect(await errorOf(() => as(db, null, () => db.query('select * from public.friends_list()')))).toMatch(/permission denied/);
    const u = await signUp(db, 'lee1');
    expect(await errorOf(() => as(db, u, () => db.query('select * from public.friendships')))).toMatch(/permission denied/);
    expect(await errorOf(() => as(db, u, () => db.query("select public._friend_add_xp(gen_random_uuid(), 'wave', 'x', 5)")))).toMatch(/permission denied/);
  });
});

describe('인사하기와 친밀도 레벨', () => {
  it('인사는 하루 한 번씩 각자이고, 기본 3, 같은 날 둘 다 하면 서로 +2 보너스', async () => {
    const { ua, ub, id } = await makeFriends('wavea', 'waveb');
    expect(await wave(ua, id)).toMatchObject({ granted: 3, mutual: false, xp_total: 3 });
    expect(await errorOf(() => wave(ua, id))).toMatch(/already_waved/);
    expect(await wave(ub, id)).toMatchObject({ granted: 5, mutual: true, xp_total: 8 }); // 3 + 보너스 2
    expect((await list(ua))[0]).toMatchObject({ waved_today: true, they_waved_today: true, xp: 8, level: 1 });
  });

  it('친구가 된 지 오래될수록 인사 친밀도가 조금씩 오른다(30일마다 +1, 최대 +3)', async () => {
    const { ua, id } = await makeFriends('oldx', 'oldy');
    await admin(db, "update public.friendships set accepted_at = now() - interval '65 days', created_at = now() - interval '65 days' where id = $1", [id]);
    expect(await wave(ua, id)).toMatchObject({ granted: 5 }); // 3 + 2(65일 → 2)
    await newDay(id);
    await admin(db, "update public.friendships set accepted_at = now() - interval '400 days' where id = $1", [id]);
    expect(await wave(ua, id)).toMatchObject({ granted: 6 }); // 3 + 3(상한)
  });

  it('레벨이 오르면 두 사람 모두 뽑기권을 한 번씩 받고, 같은 레벨 보상은 다시 주지 않는다', async () => {
    const { ua, ub, id } = await makeFriends('lvla', 'lvlb');
    const base = [await ticketsOf(db, ua), await ticketsOf(db, ub)];
    await admin(db, 'update public.friendships set xp = 17 where id = $1', [id]);
    const r = await wave(ua, id); // 17 + 3 = 20 → 레벨 2
    expect(r).toMatchObject({ level: 2, leveled_up: true });
    expect([await ticketsOf(db, ua), await ticketsOf(db, ub)]).toEqual([base[0]! + 1, base[1]! + 1]);
    // 다른 날 인사해도 같은 레벨 보상은 또 나오지 않는다
    await newDay(id);
    await wave(ub, id);
    expect([await ticketsOf(db, ua), await ticketsOf(db, ub)]).toEqual([base[0]! + 1, base[1]! + 1]);
    expect((await list(ub))[0]).toMatchObject({ level: 2, next_xp: 60 });
  });

  it('레벨 3 이 되면 뽑기권 1장씩, 레벨 4 는 2장씩(레벨별 보상표)', async () => {
    const { ua, ub, id } = await makeFriends('jmpa', 'jmpb');
    const before = [await ticketsOf(db, ua), await ticketsOf(db, ub)];
    await admin(db, 'update public.friendships set xp = 58 where id = $1', [id]); // +3 → 61, 레벨 3
    expect(await wave(ua, id)).toMatchObject({ level: 3, leveled_up: true, tickets_each: 1 });
    expect([await ticketsOf(db, ua), await ticketsOf(db, ub)]).toEqual([before[0]! + 1, before[1]! + 1]);
    await newDay(id);
    await admin(db, 'update public.friendships set xp = 118 where id = $1', [id]); // +3 → 121, 레벨 4
    expect(await wave(ub, id)).toMatchObject({ level: 4, tickets_each: 2 });
    expect([await ticketsOf(db, ua), await ticketsOf(db, ub)]).toEqual([before[0]! + 3, before[1]! + 3]);
  });

  it('한 쌍이 하루에 올릴 수 있는 친밀도는 40까지', async () => {
    const { ua, ub, id } = await makeFriends('capa', 'capb');
    await admin(db, "insert into public.friend_events (friendship_id, kind, key, xp) values ($1, 'trade', 'fake', 38)", [id]);
    const r = await wave(ua, id); // 오늘 이미 38 → 2 만 인정
    expect(r).toMatchObject({ granted: 2 });
    expect(await wave(ub, id)).toMatchObject({ granted: 0 });
  });

  it('친구가 아니거나 요청만 보낸 사이는 인사할 수 없다', async () => {
    const a = await signUp(db, 'stra');
    await signUp(db, 'strb');
    const { friendship_id } = await request(a, 'strb');
    expect(await errorOf(() => wave(a, friendship_id))).toMatch(/not_found/);
    const { ua } = await makeFriends('inna', 'innb');
    const otherId = (await list(ua))[0]!.friendship_id;
    expect(await errorOf(() => wave(a, otherId))).toMatch(/not_found/); // 남의 관계
  });

  it('친구가 보는 펫(종)이 목록에 나온다', async () => {
    const { ua, ub } = await makeFriends('peta', 'petb');
    await givePet(db, ub, 'owl', 120);
    expect((await list(ua))[0]).toMatchObject({ species_id: 'owl' });
  });
});

describe('경매장 거래와 선물로 쌓이는 친밀도', () => {
  it('친구끼리 거래가 이뤄지면 친밀도 +10, 친구가 아닌 사람과는 없다', async () => {
    const { ua: seller, ub: buyer, id } = await makeFriends('sella', 'buyb');
    await givePet(db, seller, 'duck', 0);
    const pet = await givePet(db, seller, 'cat', 0);
    const listing = (await as(db, seller, () => db.query<{ r: string }>('select public.create_listing($1, 10) as r', [pet]))).rows[0]!.r;
    await as(db, buyer, () => db.query('select public.buy_listing($1)', [listing]));
    expect((await list(seller))[0]).toMatchObject({ xp: 10 });
    // 친구가 아닌 사람과의 거래: 친밀도 변화 없음(오류도 없음)
    const stranger = await signUp(db, 'strange');
    await givePet(db, seller, 'owl', 0);
    const p2 = await givePet(db, seller, 'fox', 0);
    const l2 = (await as(db, seller, () => db.query<{ r: string }>('select public.create_listing($1, 10) as r', [p2]))).rows[0]!.r;
    await as(db, stranger, () => db.query('select public.buy_listing($1)', [l2]));
    expect((await list(seller)).find((x) => x.status === 'friend')?.xp).toBe(10);
    expect(id).toBeTruthy();
  });

  it('뽑기권 선물: 한 장이 보낸 사람에게서 친구에게 옮겨가고 친밀도 +5, 하루 한 친구에게 한 번', async () => {
    const { ua, ub, id } = await makeFriends('gifta', 'giftb');
    const a0 = await ticketsOf(db, ua);
    const b0 = await ticketsOf(db, ub);
    expect(await gift(ua, id)).toMatchObject({ granted: 5, tickets: a0 - 1 });
    expect([await ticketsOf(db, ua), await ticketsOf(db, ub)]).toEqual([a0 - 1, b0 + 1]);
    expect(await errorOf(() => gift(ua, id))).toMatch(/already_gifted/);
    expect(await gift(ub, id)).toMatchObject({ granted: 5 }); // 받은 사람도 자기 선물은 보낼 수 있다
  });

  it('뽑기권이 없으면 선물할 수 없고, 하루 전체 3번까지', async () => {
    const { ua: poor, id: poorId } = await makeFriends('pooa', 'poob');
    await admin(db, 'update public.profiles set tickets = 0 where user_id = $1', [poor]);
    await admin(db, "delete from public.ledger where user_id = $1 and currency = 'ticket'", [poor]);
    expect(await errorOf(() => gift(poor, poorId))).toMatch(/insufficient_tickets/);

    const rich = await signUp(db, 'richa');
    await admin(db, "update public.profiles set tickets = tickets + 10 where user_id = $1", [rich]);
    await admin(db, "insert into public.ledger (user_id, delta, reason, currency) values ($1, 10, 'gift', 'ticket')", [rich]);
    for (let i = 0; i < 4; i++) {
      const friend = await signUp(db, `rf${i}`);
      const { friendship_id } = await request(rich, `rf${i}`);
      await respond(friend, friendship_id, true);
      if (i < 3) await gift(rich, friendship_id);
      else expect(await errorOf(() => gift(rich, friendship_id))).toMatch(/gift_limit/);
    }
  });

  it('친구 보상으로 받는 뽑기권은 평생 100장까지', async () => {
    const { ua, ub, id } = await makeFriends('limita', 'limitb');
    await admin(db, "insert into public.ledger (user_id, delta, reason, currency) values ($1, 98, 'friend_reward', 'ticket')", [ua]);
    await admin(db, 'update public.profiles set tickets = tickets + 98 where user_id = $1', [ua]);
    const a0 = await ticketsOf(db, ua);
    const b0 = await ticketsOf(db, ub);
    await admin(db, 'update public.friendships set xp = 17 where id = $1', [id]);
    await wave(ua, id); // 레벨 2 보상 1장씩: ua 는 98+1 = 99 까지 가능
    expect([await ticketsOf(db, ua), await ticketsOf(db, ub)]).toEqual([a0 + 1, b0 + 1]);
    await newDay(id);
    await admin(db, 'update public.friendships set xp = 58 where id = $1', [id]);
    await wave(ub, id); // +3 → 61 = 레벨 3 보상 1장: ua 는 100 에 도달
    await admin(db, 'update public.friendships set xp = 118 where id = $1', [id]);
    await newDay(id);
    await wave(ua, id); // +3 → 121 = 레벨 4 보상 2장: ua 는 상한(100)이라 못 받고, ub 는 받는다
    expect(await ticketsOf(db, ua)).toBe(a0 + 2);
    expect(await ticketsOf(db, ub)).toBe(b0 + 1 + 1 + 2);
  });
});

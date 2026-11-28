import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { startCollection } from '../shared/collection.js';
import { createPet } from '../shared/pet.js';
import type { RpcResult } from './account-sync.js';
import { ServerGame, applyServerPull, friendlyError, mirrorCollection, type ServerRpc, type ServerState } from './server-game.js';

const tmpDir = () => fs.mkdtempSync(path.join(os.tmpdir(), 'pet-server-'));
const ok = <T,>(data: T): RpcResult<T> => ({ data, error: null });
const fail = <T,>(message: string): RpcResult<T> => ({ data: null, error: { message } });

/** 서버를 흉내 낸다: 함수 이름별로 응답을 정하고, 부른 기록을 남긴다. */
function fakeRpc(handlers: Record<string, (args?: Record<string, unknown>) => RpcResult<unknown>>, tables: Record<string, unknown[]> = {}) {
  const calls: Array<{ fn: string; args?: Record<string, unknown> }> = [];
  const rpc: ServerRpc = {
    call: async <T,>(fn: string, args?: Record<string, unknown>) => {
      calls.push({ fn, args });
      const h = handlers[fn];
      return (h ? h(args) : fail('unknown_function')) as RpcResult<T>;
    },
    select: async <T,>(table: string) => ok((tables[table] ?? []) as T[]),
  };
  return { rpc, calls };
}

const profileTables = {
  profiles: [{ tickets: 15, coins: 230, pity: 7, equipped_pet_id: 'p2' }],
  pets: [
    { id: 'p1', species_id: 'cat', xp: 250 },
    { id: 'p2', species_id: 'dragon', xp: 40 },
    { id: 'p3', species_id: 'cat', xp: 30 },
  ],
  cosmetics: [{ kind: 'accessory', item_id: 'crown' }, { kind: 'variant', item_id: 'pastel' }],
  account_imports: [{ user_id: 'u1' }],
};

describe('ServerGame.refresh / activate', () => {
  it('서버의 뽑기권·천장·가진 동물(종마다 가장 높은 경험치)·꾸미기·장착을 읽는다', async () => {
    const { rpc } = fakeRpc({}, profileTables);
    const g = new ServerGame(rpc, tmpDir());
    expect((await g.refresh()).ok).toBe(true);
    expect(g.state).toEqual({ tickets: 15, coins: 230, imported: true, pity: 7, equippedSpecies: 'dragon', species: { cat: 250, dragon: 40 }, accessories: ['crown'], variants: ['pastel'], necks: [], effects: [], props: [] });
  });

  it('activate 는 기존 진행 가져오기를 부른 뒤 서버 상태를 읽는다', async () => {
    const { rpc, calls } = fakeRpc({ import_local_collection: () => ok({ imported: true }) }, profileTables);
    const g = new ServerGame(rpc, tmpDir());
    expect((await g.activate()).ok).toBe(true);
    expect(calls[0]?.fn).toBe('import_local_collection');
    expect(g.ready).toBe(true);
  });

  it('연결이 안 되면 준비되지 않은 채로 안내 문구를 돌려준다', async () => {
    const { rpc } = fakeRpc({ import_local_collection: () => fail('TypeError: fetch failed') });
    const g = new ServerGame(rpc, tmpDir());
    const r = await g.activate();
    expect(r.ok).toBe(false);
    expect(r.message).toContain('서버에 연결하지 못했어요');
    expect(g.ready).toBe(false);
  });

  it('프로필이 없으면 준비되지 않는다', async () => {
    const { rpc } = fakeRpc({}, { profiles: [], pets: [], cosmetics: [] });
    expect((await new ServerGame(rpc, tmpDir()).refresh()).ok).toBe(false);
  });
});

describe('뽑기', () => {
  it('동물 뽑기: 서버 결과를 돌려주고 상태(뽑기권·천장)를 갱신한다', async () => {
    const { rpc } = fakeRpc({ gacha_pull: () => ok({ species_id: 'fox', rarity: 'common', tickets: 9, pet_id: 'x' }) }, profileTables);
    const g = new ServerGame(rpc, tmpDir());
    await g.refresh();
    expect(await g.pullSpecies()).toEqual({ ok: true, result: { speciesId: 'fox', rarity: 'common', tickets: 9 } });
    expect(g.state?.tickets).toBe(9);
    expect(g.state?.pity).toBe(8);
  });

  it('히든이 나오면 천장이 0 으로 돌아간다', async () => {
    const { rpc } = fakeRpc({ gacha_pull: () => ok({ species_id: 'dragon', rarity: 'hidden', tickets: 3 }) }, profileTables);
    const g = new ServerGame(rpc, tmpDir());
    await g.refresh();
    await g.pullSpecies();
    expect(g.state?.pity).toBe(0);
  });

  it('뽑기권이 모자라면 읽기 쉬운 문구로 거절된다', async () => {
    const { rpc } = fakeRpc({ gacha_pull: () => fail('insufficient_tickets') }, profileTables);
    const g = new ServerGame(rpc, tmpDir());
    expect(await g.pullSpecies()).toEqual({ ok: false, message: '뽑기권이 모자라요' });
  });

  it('연결이 안 되면 뽑지 않고 안내한다(로컬로 대신 뽑지 않는다)', async () => {
    const { rpc } = fakeRpc({ gacha_pull: () => fail('fetch failed') });
    const r = await new ServerGame(rpc, tmpDir()).pullSpecies();
    expect(r.ok).toBe(false);
    expect(!r.ok && r.message).toContain('인터넷');
  });

  it('꾸미기 뽑기 결과를 상태에 더한다', async () => {
    const { rpc } = fakeRpc({ gacha_cosmetic: () => ok({ kind: 'accessory', item_id: 'halo', tickets: 13 }) }, profileTables);
    const g = new ServerGame(rpc, tmpDir());
    await g.refresh();
    expect(await g.pullCosmetic()).toEqual({ ok: true, result: { kind: 'accessory', itemId: 'halo', tickets: 13 } });
    expect(g.state?.accessories).toEqual(['crown', 'halo']);
  });
});

describe('뽑기권 획득 대기열', () => {
  const grant = { kind: 'care', amount: 1, key: 'care:3' } as const;

  it('서버가 받아 주면 뽑기권을 갱신하고 대기열에 남기지 않는다', async () => {
    const { rpc } = fakeRpc({ grant_tickets: () => ok({ granted: 1, tickets: 16 }) }, profileTables);
    const dir = tmpDir();
    const g = new ServerGame(rpc, dir);
    await g.refresh();
    expect(await g.grant(grant)).toEqual({ granted: 1, tickets: 16 });
    expect(g.state?.tickets).toBe(16);
    expect(g.pendingCount).toBe(0);
  });

  it('연결이 안 되면 대기열에 두고(파일에도 저장), 같은 열쇠는 한 번만 둔다', async () => {
    const { rpc } = fakeRpc({ grant_tickets: () => fail('fetch failed') });
    const dir = tmpDir();
    const g = new ServerGame(rpc, dir);
    expect(await g.grant(grant)).toBeNull();
    expect(await g.grant(grant)).toBeNull();
    expect(g.pendingCount).toBe(1);
    expect(new ServerGame(rpc, dir).pendingCount).toBe(1); // 앱을 다시 켜도 남아 있다
  });

  it('서버가 거절(상한·잘못된 요청)하면 대기열에 두지 않는다', async () => {
    const { rpc } = fakeRpc({ grant_tickets: () => fail('invalid_grant') });
    const g = new ServerGame(rpc, tmpDir());
    expect(await g.grant(grant)).toBeNull();
    expect(g.pendingCount).toBe(0);
  });

  it('연결이 돌아오면 대기열을 보내고 합계를 알려 준다', async () => {
    let online = false;
    const { rpc } = fakeRpc({ grant_tickets: () => (online ? ok({ granted: 1, tickets: 20 }) : fail('fetch failed')) }, profileTables);
    const g = new ServerGame(rpc, tmpDir());
    await g.grant({ kind: 'care', amount: 1, key: 'care:1' });
    await g.grant({ kind: 'care', amount: 1, key: 'care:2' });
    expect(g.pendingCount).toBe(2);
    expect(await g.flushPending()).toEqual({ granted: 0, tickets: null }); // 아직 오프라인: 그대로 남김
    expect(g.pendingCount).toBe(2);
    online = true;
    expect(await g.flushPending()).toEqual({ granted: 2, tickets: 20 });
    expect(g.pendingCount).toBe(0);
  });

  it('출석은 서버가 정한 양을 돌려준다', async () => {
    const { rpc } = fakeRpc({ claim_daily_ticket: () => ok({ granted: 1, tickets: 4 }) });
    expect(await new ServerGame(rpc, tmpDir()).claimDaily()).toEqual({ granted: 1, tickets: 4 });
  });
});

describe('프로필 카드 값 올리기', () => {
  it('값을 set_card_extras 로 보내고 성공 여부를 돌려준다', async () => {
    const { rpc, calls } = fakeRpc({ set_card_extras: () => ok(null) });
    const extras = { variant: 'pastel', accessory: 'crown', streak: 3 };
    expect(await new ServerGame(rpc, tmpDir()).pushCardExtras(extras)).toBe(true);
    expect(calls).toEqual([{ fn: 'set_card_extras', args: { p_extras: extras } }]);
    expect(await new ServerGame(fakeRpc({ set_card_extras: () => fail('boom') }).rpc, tmpDir()).pushCardExtras(extras)).toBe(false);
  });
});

describe('내 판매 조회', () => {
  const sale = { listing_id: 'l1', price: 40, species_id: 'cat', species_name: '고양이', level: 3, buyer_login: 'kim', sold_at: '2026-11-27T10:00:00Z' };

  it('since 이후 팔린 건을 서버에 묻고 그대로 돌려준다', async () => {
    const { rpc, calls } = fakeRpc({ my_sales: () => ok([sale]) });
    expect(await new ServerGame(rpc, tmpDir()).mySales('2026-11-27T09:00:00Z')).toEqual([sale]);
    expect(calls).toEqual([{ fn: 'my_sales', args: { p_since: '2026-11-27T09:00:00Z' } }]);
  });

  it('서버 오류이거나 모양이 이상하면 null', async () => {
    expect(await new ServerGame(fakeRpc({ my_sales: () => fail('boom') }).rpc, tmpDir()).mySales('x')).toBeNull();
    expect(await new ServerGame(fakeRpc({ my_sales: () => ok({ not: 'array' }) }).rpc, tmpDir()).mySales('x')).toBeNull();
  });
});

describe('배움 보고(게임머니)', () => {
  it('이벤트를 서버에 보내고 서버가 인정한 만큼만 반영한다', async () => {
    const calls: unknown[] = [];
    const { rpc } = fakeRpc({ report_learning: (args) => { calls.push(args); return ok({ granted: 15, coins: 245 }); } }, profileTables);
    const g = new ServerGame(rpc, tmpDir());
    await g.refresh();
    const events = [{ id: 'a', kind: 'confirm' as const }, { id: 'b', kind: 'quiz_bonus' as const }];
    expect(await g.reportLearning(events)).toEqual({ granted: 15, coins: 245 });
    expect(calls).toEqual([{ p_events: events }]);
    expect(g.state?.coins).toBe(245);
  });

  it('보낼 것이 없거나 서버 오류면 아무것도 바꾸지 않고 null', async () => {
    const { rpc, calls } = fakeRpc({ report_learning: () => fail('invalid_events') }, profileTables);
    const g = new ServerGame(rpc, tmpDir());
    await g.refresh();
    expect(await g.reportLearning([])).toBeNull();
    expect(calls.some((c) => c.fn === 'report_learning')).toBe(false);
    expect(await g.reportLearning([{ id: 'a', kind: 'tip' }])).toBeNull();
    expect(g.state?.coins).toBe(230);
  });
});

describe('GitHub 기여 동기화', () => {
  it('서버가 알려 준 만큼만 반영하고, 준비되지 않았거나 닿지 않으면 null', async () => {
    const calls: string[] = [];
    const base = fakeRpc({}, profileTables).rpc;
    const g = new ServerGame({ ...base, invoke: async <T,>(n: string) => { calls.push(n); return ok({ granted: 12, coins: 342 }) as RpcResult<T>; } }, tmpDir());
    await g.refresh();
    expect(await g.syncCommits()).toEqual({ granted: 12, coins: 342 });
    expect(calls).toEqual(['commits']);
    expect(g.state?.coins).toBe(342);
    expect(await new ServerGame({ ...base, invoke: async <T,>() => fail('not_configured') as RpcResult<T> }, tmpDir()).syncCommits()).toBeNull();
    expect(await new ServerGame(base, tmpDir()).syncCommits()).toBeNull();
  });

  it('준비 안 된 서버 오류는 알아듣게 바꾼다', () => {
    expect(friendlyError('not_configured')).toMatch(/준비되지/);
  });
});

describe('컬렉션에 반영', () => {
  const now = 1_700_000_000_000;
  const local = () => startCollection(createPet('rabbit', now), now);
  const state: ServerState = { tickets: 15, coins: 0, imported: false, pity: 7, equippedSpecies: 'dragon', species: { cat: 250, dragon: 40 }, accessories: ['crown', 'laser'], variants: ['pastel'] };

  it('서버의 뽑기권·천장·동물·꾸미기를 덮어쓰되 로컬 동물과 지금 키우는 동물은 지우지 않는다', () => {
    const c = mirrorCollection(local(), state, now);
    expect(c.tickets).toBe(15);
    expect(c.sinceHidden).toBe(7);
    expect(Object.keys(c.owned).sort()).toEqual(['cat', 'dragon', 'rabbit']);
    expect(c.owned.cat?.pet.xp).toBe(250);
    expect(c.active).toBe('rabbit');
    expect(c.accessories).toEqual(['crown']); // 모르는 꾸미기(laser)는 버린다
    expect(c.variants).toEqual(['pastel']);
  });

  it('이미 가져온 계정은 서버가 기준이다: 경매장에서 판 동물은 사라지고 키우던 동물이 없어지면 서버의 장착 동물로 바뀐다', () => {
    const c = mirrorCollection(local(), { ...state, imported: true }, now);
    expect(Object.keys(c.owned).sort()).toEqual(['cat', 'dragon']);
    expect(c.active).toBe('dragon');
  });

  it('서버에 동물이 하나도 없으면 아무것도 지우지 않는다', () => {
    const c = mirrorCollection(local(), { ...state, imported: true, species: {} }, now);
    expect(Object.keys(c.owned)).toEqual(['rabbit']);
  });

  it('이미 가진 동물은 서버 경험치가 더 높을 때만 올린다', () => {
    const base = mirrorCollection(local(), { ...state, species: { rabbit: 500 } }, now);
    expect(base.owned.rabbit?.pet.xp).toBe(500);
    const again = mirrorCollection(base, { ...state, species: { rabbit: 100 } }, now);
    expect(again.owned.rabbit?.pet.xp).toBe(500);
  });

  it('서버 뽑기: 처음 나온 동물은 새로, 같은 동물은 횟수와 경험치(+30)로 반영한다', () => {
    const first = applyServerPull(local(), { speciesId: 'cat', rarity: 'common', tickets: 9 }, now)!;
    expect(first).toMatchObject({ isNew: true, count: 1, hidden: false });
    expect(first.collection.tickets).toBe(9);
    expect(first.collection.pulls).toBe(1);
    expect(first.collection.sinceHidden).toBe(1);
    const dupe = applyServerPull(first.collection, { speciesId: 'cat', rarity: 'common', tickets: 6 }, now)!;
    expect(dupe).toMatchObject({ isNew: false, count: 2 });
    expect(dupe.collection.owned.cat?.pet.xp).toBe((first.collection.owned.cat?.pet.xp ?? 0) + 30);
  });

  it('히든이 나오면 천장이 0, 모르는 종은 무시한다', () => {
    const c = { ...local(), sinceHidden: 20 };
    expect(applyServerPull(c, { speciesId: 'dragon', rarity: 'hidden', tickets: 3 }, now)?.collection.sinceHidden).toBe(0);
    expect(applyServerPull(c, { speciesId: 'alien', rarity: 'common', tickets: 3 }, now)).toBeNull();
  });
});

describe('friendlyError', () => {
  it('서버 코드를 사용자 문구로 바꾼다', () => {
    expect(friendlyError('insufficient_tickets')).toBe('뽑기권이 모자라요');
    expect(friendlyError('all_collected')).toContain('모두 모았어요');
    expect(friendlyError('TypeError: fetch failed')).toContain('인터넷');
    expect(friendlyError('weird')).toContain('weird');
  });
});

describe('ServerGame 일일 미션·동행', () => {
  const state = { pet: 1, care: 0, learn: 0, social: 0, goals: { pet: 3, care: 5, learn: 1, social: 1 }, completed: false, streak: 0, reward: 0 };

  it('미션 현황과 진행 보고를 서버 함수로 부르고, 오류면 null 을 돌려준다', async () => {
    const { rpc, calls } = fakeRpc({ mission_state: () => ok(state), mission_report: () => ok({ ...state, pet: 2 }) });
    const g = new ServerGame(rpc, tmpDir());
    expect(await g.missionState()).toMatchObject({ pet: 1 });
    expect(await g.missionReport('pet')).toMatchObject({ pet: 2 });
    expect(calls.find((c) => c.fn === 'mission_report')?.args).toEqual({ p_kind: 'pet' });
    const bad = new ServerGame(fakeRpc({ mission_state: () => fail('x'), mission_report: () => fail('x') }).rpc, tmpDir());
    expect(await bad.missionState()).toBeNull();
    expect(await bad.missionReport('care')).toBeNull();
  });

  it('친구 소식: since 를 넘겨 부르고 오류면 null', async () => {
    const { rpc, calls } = fakeRpc({ friend_highlights: () => ok([{ login: 'kim', kind: 'pet', item_id: '', rarity: 'legend', at: '2026-01-01T00:00:00Z' }]) });
    expect(await new ServerGame(rpc, tmpDir()).friendHighlights('2025-01-01T00:00:00Z')).toHaveLength(1);
    expect(calls[0]?.args).toEqual({ p_since: '2025-01-01T00:00:00Z' });
    expect(await new ServerGame(fakeRpc({ friend_highlights: () => fail('x') }).rpc, tmpDir()).friendHighlights('x')).toBeNull();
  });

  it('동행: 고르기·현황·틱·몫 가져오기', async () => {
    const { rpc } = fakeRpc({
      set_companion: () => ok(null),
      companion_current: () => ok([{ friendship_id: 'f', friend_id: 'u', login: 'kim', species_id: 'cat', pet_xp: 10, friend_level: 2 }]),
      companion_tick: () => ok({ granted: true, pet_xp: 6 }),
      companion_claim: () => ok(12),
    });
    const g = new ServerGame(rpc, tmpDir());
    expect((await g.setCompanion('f')).ok).toBe(true);
    expect(await g.companionCurrent()).toMatchObject({ login: 'kim' });
    expect(await g.companionTick()).toMatchObject({ granted: true });
    expect(await g.companionClaim()).toBe(12);
    const bad = new ServerGame(fakeRpc({ set_companion: () => fail('not_found'), companion_claim: () => fail('x') }).rpc, tmpDir());
    expect((await bad.setCompanion('f')).ok).toBe(false);
    expect(await bad.companionClaim()).toBe(0);
  });
});

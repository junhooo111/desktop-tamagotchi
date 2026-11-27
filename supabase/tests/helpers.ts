/**
 * SQL 테스트 도구. 실제 Postgres(PGlite, WASM)에 마이그레이션을 그대로 적용해서 시험한다(Docker 불필요).
 *
 * Supabase 가 제공하는 것 중 마이그레이션이 기대는 것만 흉내 낸다:
 *   auth.users, auth.uid(), anon/authenticated 역할, 그리고 새 테이블에 두 역할의 모든 권한을 주는 기본 권한.
 * 기본 권한까지 흉내 내는 이유는 "마이그레이션이 그 기본값을 제대로 회수하는지"를 시험하기 위해서다.
 */
import fs from 'node:fs';
import path from 'node:path';
import { PGlite } from '@electric-sql/pglite';

const MIGRATIONS = path.join(process.cwd(), 'supabase', 'migrations');

const SUPABASE_SHIM = `
  create schema auth;
  create table auth.users (
    id uuid primary key default gen_random_uuid(),
    raw_user_meta_data jsonb not null default '{}'::jsonb
  );
  create function auth.uid() returns uuid language sql stable as $$
    select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
  $$;

  create role anon nologin;
  create role authenticated nologin;
  create role service_role nologin;

  grant usage on schema public to anon, authenticated, service_role;
  grant usage on schema auth to anon, authenticated, service_role;
  grant execute on function auth.uid() to anon, authenticated, service_role;

  -- Supabase 의 기본값: public 의 새 테이블·함수·시퀀스에 이 역할들의 모든 권한을 준다.
  alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
  alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
  alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
`;

export type Db = PGlite;

/** 빈 데이터베이스에 Supabase 흉내 + 모든 마이그레이션(파일 이름 순)을 적용한다. */
export async function createDb(): Promise<Db> {
  const db = new PGlite();
  await db.exec(SUPABASE_SHIM);
  const files = fs.readdirSync(MIGRATIONS).filter((f) => f.endsWith('.sql')).sort();
  for (const file of files) await db.exec(fs.readFileSync(path.join(MIGRATIONS, file), 'utf8'));
  return db;
}

/** GitHub 로그인으로 가입한 사용자를 만든다(가입 트리거가 프로필과 환영 재화를 만든다). */
export async function signUp(db: Db, login: string, extra: Record<string, unknown> = {}): Promise<string> {
  const meta = { user_name: login, avatar_url: `https://avatars.example/${login}.png`, ...extra };
  const res = await db.query<{ id: string }>('insert into auth.users (raw_user_meta_data) values ($1) returning id', [
    JSON.stringify(meta),
  ]);
  return res.rows[0]!.id;
}

/** 슈퍼유저(마이그레이션 소유자)로 값을 직접 세팅한다. 테스트 준비용이다. */
export async function admin(db: Db, sql: string, params: unknown[] = []): Promise<void> {
  await db.query(sql, params);
}

/**
 * 로그인한 사용자(authenticated) 또는 로그인하지 않은 방문자(anon, userId = null)로 fn 을 실행한다.
 * 끝나면 반드시 원래 권한(슈퍼유저)으로 돌아온다.
 */
export async function as<T>(db: Db, userId: string | null, fn: () => Promise<T>): Promise<T> {
  await db.exec(`set role ${userId ? 'authenticated' : 'anon'}`);
  await db.query("select set_config('request.jwt.claim.sub', $1, false)", [userId ?? '']);
  try {
    return await fn();
  } finally {
    await db.exec('reset role');
    await db.query("select set_config('request.jwt.claim.sub', '', false)");
  }
}

/** 오류 메시지를 돌려준다. 오류가 나지 않으면 null. */
export async function errorOf(fn: () => Promise<unknown>): Promise<string | null> {
  try {
    await fn();
    return null;
  } catch (e) {
    return e instanceof Error ? e.message : String(e);
  }
}

/** 사용자별 profiles.coins 와 ledger.delta 의 합이 모두 같은지(재화 정합성)를 검사해서 어긋난 사용자 목록을 돌려준다. */
export async function ledgerMismatches(db: Db): Promise<{ user_id: string; coins: number; ledger: number }[]> {
  const res = await db.query<{ user_id: string; coins: number; ledger: number }>(`
    select p.user_id, p.coins, coalesce(sum(l.delta), 0)::int as ledger
      from public.profiles p left join public.ledger l on l.user_id = p.user_id and l.currency = 'coin'
     group by p.user_id, p.coins
    having p.coins <> coalesce(sum(l.delta), 0)
  `);
  return res.rows;
}

/** 뽑기권(tickets)과 원장의 뽑기권 합계가 어긋난 사용자 목록 */
export async function ticketMismatches(db: Db): Promise<{ user_id: string; tickets: number; ledger: number }[]> {
  const res = await db.query<{ user_id: string; tickets: number; ledger: number }>(`
    select p.user_id, p.tickets, coalesce(sum(l.delta), 0)::int as ledger
      from public.profiles p left join public.ledger l on l.user_id = p.user_id and l.currency = 'ticket'
     group by p.user_id, p.tickets
    having p.tickets <> coalesce(sum(l.delta), 0)
  `);
  return res.rows;
}

export async function ticketsOf(db: Db, userId: string): Promise<number> {
  const res = await db.query<{ tickets: number }>('select tickets from public.profiles where user_id = $1', [userId]);
  return res.rows[0]!.tickets;
}

/** 뽑기권을 정확히 n 장으로 맞춘다(원장도 같이 맞춘다. 테스트 준비용). */
export async function setTickets(db: Db, userId: string, n: number): Promise<void> {
  const cur = await ticketsOf(db, userId);
  await db.query('update public.profiles set tickets = $2 where user_id = $1', [userId, n]);
  if (n !== cur) await db.query("insert into public.ledger (user_id, delta, reason, currency) values ($1, $2, 'welcome', 'ticket')", [userId, n - cur]);
}

export async function coinsOf(db: Db, userId: string): Promise<number> {
  const res = await db.query<{ coins: number }>('select coins from public.profiles where user_id = $1', [userId]);
  return res.rows[0]!.coins;
}

/** 사용자에게 펫을 직접 만들어 준다(뽑기를 거치지 않는 테스트 준비용). */
export async function givePet(db: Db, ownerId: string, speciesId = 'chick', xp = 0): Promise<string> {
  const res = await db.query<{ id: string }>(
    'insert into public.pets (owner_id, species_id, xp) values ($1, $2, $3) returning id',
    [ownerId, speciesId, xp],
  );
  return res.rows[0]!.id;
}

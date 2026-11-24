-- 0001: 테이블, 제약, 가입 시 프로필 자동 생성, 권한(RLS)
-- 원칙: 클라이언트는 테이블을 직접 고치지 못한다. 쓰기는 0003 의 서버 함수(RPC)로만 한다.

-- ---------------------------------------------------------------
-- 펫 종류 카탈로그 (뽑기 확률과 진화 규칙)
-- ---------------------------------------------------------------
create table public.species (
  id            text primary key,
  name          text not null,
  rarity        text not null check (rarity in ('common', 'rare', 'epic', 'legendary')),
  gacha_weight  int  not null default 0 check (gacha_weight >= 0),
  evolves_to    text references public.species (id),
  evolve_level  int  check (evolve_level > 0),
  evolve_cost   int  check (evolve_cost >= 0),
  -- 진화 규칙은 셋이 함께 있거나 함께 없어야 한다
  check ((evolves_to is null) = (evolve_level is null) and (evolves_to is null) = (evolve_cost is null))
);

-- ---------------------------------------------------------------
-- 사용자 프로필 (auth.users 와 1:1)
-- github_login 은 표시용이라 유일하지 않다(GitHub 이름을 바꾸면 다른 사람이 같은 이름을 쓸 수 있다).
-- 사용자를 가리킬 때는 항상 user_id 를 쓴다.
-- ---------------------------------------------------------------
create table public.profiles (
  user_id          uuid primary key references auth.users (id) on delete cascade,
  github_login     text not null,
  avatar_url       text,
  coins            int  not null default 0 check (coins >= 0),
  pity             int  not null default 0 check (pity >= 0),
  equipped_pet_id  uuid,
  created_at       timestamptz not null default now()
);
create index profiles_github_login_idx on public.profiles (github_login);

-- ---------------------------------------------------------------
-- 펫. 레벨은 경험치에서 계산한다(앱의 levelOf 와 같은 공식: 1 + floor(sqrt(xp / 10))).
-- ---------------------------------------------------------------
create table public.pets (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references public.profiles (user_id) on delete cascade,
  species_id  text not null references public.species (id),
  xp          int  not null default 0 check (xp >= 0),
  level       int  generated always as (1 + floor(sqrt(xp / 10.0))::int) stored,
  created_at  timestamptz not null default now()
);
create index pets_owner_idx on public.pets (owner_id);

alter table public.profiles
  add constraint profiles_equipped_pet_fk
  foreign key (equipped_pet_id) references public.pets (id) on delete set null;

-- ---------------------------------------------------------------
-- 마켓 판매글
-- ---------------------------------------------------------------
create table public.listings (
  id          uuid primary key default gen_random_uuid(),
  pet_id      uuid not null references public.pets (id) on delete cascade,
  seller_id   uuid not null references public.profiles (user_id) on delete cascade,
  price       int  not null check (price between 1 and 1000000),
  status      text not null default 'active' check (status in ('active', 'sold', 'cancelled')),
  buyer_id    uuid references public.profiles (user_id),
  created_at  timestamptz not null default now(),
  sold_at     timestamptz,
  check ((status = 'sold') = (buyer_id is not null))
);
-- 한 펫에 판매 중인 글은 하나뿐
create unique index listings_one_active_per_pet on public.listings (pet_id) where status = 'active';
create index listings_active_idx on public.listings (created_at desc) where status = 'active';

-- ---------------------------------------------------------------
-- 재화 원장: 재화가 변하는 모든 순간을 한 줄씩 남긴다(추가 전용).
-- profiles.coins 는 사용자별 ledger.delta 의 합과 항상 같아야 한다.
-- ---------------------------------------------------------------
create table public.ledger (
  id          bigint generated always as identity primary key,
  user_id     uuid not null references public.profiles (user_id) on delete cascade,
  delta       int  not null,
  reason      text not null check (reason in ('welcome', 'learn', 'gacha', 'trade_buy', 'trade_sell', 'evolve')),
  ref_id      uuid,
  created_at  timestamptz not null default now()
);
create index ledger_user_idx on public.ledger (user_id, created_at desc);

-- ---------------------------------------------------------------
-- 학습 이벤트: 데스크톱 앱이 보낸 이벤트. id 는 클라이언트가 만든 멱등키다.
-- ---------------------------------------------------------------
create table public.learning_events (
  id          uuid primary key,
  user_id     uuid not null references public.profiles (user_id) on delete cascade,
  kind        text not null check (kind in ('confirm', 'quiz_bonus', 'fixed', 'tip')),
  created_at  timestamptz not null default now()
);
create index learning_events_user_idx on public.learning_events (user_id, created_at desc);

-- ---------------------------------------------------------------
-- 가입하면 프로필을 만들고 환영 재화 100 을 준다(뽑기 1회).
-- GitHub 로그인의 메타데이터: user_name(또는 preferred_username), avatar_url
-- ---------------------------------------------------------------
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_login text;
begin
  v_login := coalesce(
    nullif(new.raw_user_meta_data ->> 'user_name', ''),
    nullif(new.raw_user_meta_data ->> 'preferred_username', ''),
    'user-' || substr(new.id::text, 1, 8)
  );
  insert into public.profiles (user_id, github_login, avatar_url, coins)
  values (new.id, v_login, new.raw_user_meta_data ->> 'avatar_url', 100);
  insert into public.ledger (user_id, delta, reason) values (new.id, 100, 'welcome');
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 트리거 전용 함수라 클라이언트가 직접 부를 수 없게 한다.
revoke all on function public.handle_new_user() from public, anon, authenticated;

-- ---------------------------------------------------------------
-- 권한: 먼저 모두 회수하고, 필요한 읽기만 다시 열어 준다.
-- (Supabase 는 새 테이블에 anon/authenticated 의 모든 권한을 기본으로 주므로 명시적으로 회수한다.)
-- ---------------------------------------------------------------
alter default privileges in schema public revoke all on tables from anon, authenticated;
alter default privileges in schema public revoke all on sequences from anon, authenticated;
alter default privileges in schema public revoke execute on functions from public, anon, authenticated;

revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;

alter table public.species         enable row level security;
alter table public.profiles        enable row level security;
alter table public.pets            enable row level security;
alter table public.listings        enable row level security;
alter table public.ledger          enable row level security;
alter table public.learning_events enable row level security;

grant select on public.species to anon, authenticated;
grant select on public.profiles, public.ledger, public.learning_events to authenticated;
grant select on public.pets, public.listings to anon, authenticated;

-- 정책: select 만 만든다. insert/update/delete 정책은 일부러 만들지 않는다.
create policy species_read on public.species
  for select to anon, authenticated using (true);

create policy profiles_read_own on public.profiles
  for select to authenticated using (user_id = (select auth.uid()));

-- 내 펫, 그리고 마켓에 올라온(판매 중인) 펫
create policy pets_read on public.pets
  for select to anon, authenticated
  using (
    owner_id = (select auth.uid())
    or exists (select 1 from public.listings l where l.pet_id = pets.id and l.status = 'active')
  );

-- 판매 중인 글은 누구나, 내가 팔았거나 산 글은 본인이
create policy listings_read on public.listings
  for select to anon, authenticated
  using (
    status = 'active'
    or seller_id = (select auth.uid())
    or buyer_id = (select auth.uid())
  );

create policy ledger_read_own on public.ledger
  for select to authenticated using (user_id = (select auth.uid()));

create policy learning_events_read_own on public.learning_events
  for select to authenticated using (user_id = (select auth.uid()));

-- 다른 사용자에게 보여도 되는 프로필 정보(재화·장착 펫 등은 제외).
-- 뷰는 소유자 권한으로 실행되어 profiles 의 RLS 를 거치지 않는다. 노출 열을 아래로 한정하는 것이 목적이다.
create view public.public_profiles as
  select user_id, github_login, avatar_url from public.profiles;
revoke all on public.public_profiles from anon, authenticated;
grant select on public.public_profiles to anon, authenticated;

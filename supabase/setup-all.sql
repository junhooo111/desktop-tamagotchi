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
-- 0002: 처음 만나는 펫 6종과 뽑기 확률
-- 가중치는 상대값이다(합이 100 일 필요는 없다). 전설 등급은 도트가 생기면 추가한다.
-- 진화 규칙(evolves_to, evolve_level, evolve_cost)은 진화 도트가 생기면 채운다.

insert into public.species (id, name, rarity, gacha_weight) values
  ('chick',  '병아리', 'common', 25),
  ('duck',   '오리',   'common', 25),
  ('rabbit', '토끼',   'common', 20),
  ('cat',    '고양이', 'rare',   11),
  ('dog',    '강아지', 'rare',   11),
  ('turtle', '거북이', 'epic',    8);
-- 0003: 서버 함수(RPC). 재화·펫·거래는 전부 여기서만 바꾼다.
--
-- 모든 함수의 공통 규칙
--  * security definer: 테이블 직접 쓰기 권한이 없는 클라이언트를 대신해 함수 소유자 권한으로 실행한다.
--  * set search_path = '': 이름 가로채기를 막기 위해 모든 객체를 스키마까지 적는다.
--  * 첫 줄에서 auth.uid() 가 있는지 확인한다.
--  * 실행 권한은 anon 에서 회수하고 authenticated 에만 준다(맨 아래).
--  * 재화가 변하면 반드시 ledger 에 한 줄을 남긴다.

-- ---------------------------------------------------------------
-- 학습 이벤트 보고: 종류만 받고 양은 서버가 정한다.
--   입력: [{ "id": "<uuid, 멱등키>", "kind": "confirm|quiz_bonus|fixed|tip" }, ...]  (최대 50개)
--   지급: 같은 양의 재화와 (장착한 펫이 있으면) 경험치. 하루(UTC) 상한 150.
-- ---------------------------------------------------------------
create function public.report_learning(p_events jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_uid       uuid := auth.uid();
  v_daily_cap constant int := 150;
  v_day_start timestamptz := date_trunc('day', now() at time zone 'utc') at time zone 'utc';
  v_used      int;
  v_total     int := 0;
  v_ignored   int := 0;
  v_ev        jsonb;
  v_id        uuid;
  v_kind      text;
  v_amount    int;
  v_grant     int;
  v_rows      int;
  v_coins     int;
begin
  if v_uid is null then raise exception 'not_authenticated'; end if;
  if jsonb_typeof(p_events) is distinct from 'array' or jsonb_array_length(p_events) > 50 then
    raise exception 'invalid_events';
  end if;

  -- 같은 사람의 동시 호출을 한 줄로 세워서 하루 상한 계산이 어긋나지 않게 한다.
  perform 1 from public.profiles where user_id = v_uid for update;
  if not found then raise exception 'no_profile'; end if;

  select coalesce(sum(delta), 0) into v_used
    from public.ledger
   where user_id = v_uid and reason = 'learn' and created_at >= v_day_start;

  for v_ev in select value from jsonb_array_elements(p_events) loop
    begin
      v_id := (v_ev ->> 'id')::uuid;
    exception when others then
      raise exception 'invalid_events';
    end;
    v_kind := v_ev ->> 'kind';
    v_amount := case v_kind when 'confirm' then 10 when 'quiz_bonus' then 5 when 'fixed' then 20 when 'tip' then 2 end;
    if v_amount is null then raise exception 'invalid_events'; end if;

    -- 이미 처리한 이벤트는 건너뛴다(같은 이벤트를 두 번 보내도 한 번만 인정).
    insert into public.learning_events (id, user_id, kind) values (v_id, v_uid, v_kind)
      on conflict (id) do nothing;
    get diagnostics v_rows = row_count;
    if v_rows = 0 then
      v_ignored := v_ignored + 1;
      continue;
    end if;

    v_grant := greatest(0, least(v_amount, v_daily_cap - v_used));
    if v_grant > 0 then
      update public.profiles set coins = coins + v_grant where user_id = v_uid;
      insert into public.ledger (user_id, delta, reason, ref_id) values (v_uid, v_grant, 'learn', v_id);
      v_used := v_used + v_grant;
      v_total := v_total + v_grant;
    end if;
  end loop;

  -- 장착한 펫이 있으면 같은 양의 경험치를 준다.
  if v_total > 0 then
    update public.pets set xp = xp + v_total
     where id = (select equipped_pet_id from public.profiles where user_id = v_uid)
       and owner_id = v_uid;
  end if;

  select coins into v_coins from public.profiles where user_id = v_uid;
  return jsonb_build_object('granted', v_total, 'ignored', v_ignored, 'coins', v_coins);
end $$;

-- ---------------------------------------------------------------
-- 뽑기: 100 재화. 연속으로 일반 등급이 9번 나오면 10번째는 희귀 이상이 확정(천장).
--   확률은 서버에서 계산한다: 가중치 w 에 대해 min(-ln(U)/w) 를 고르면 w 에 비례한 확률이 된다.
-- ---------------------------------------------------------------
create function public.gacha_pull() returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_uid         uuid := auth.uid();
  v_cost        constant int := 100;
  v_pity_limit  constant int := 9;
  p             public.profiles;
  v_sp          public.species;
  v_pet         uuid;
begin
  if v_uid is null then raise exception 'not_authenticated'; end if;

  select * into p from public.profiles where user_id = v_uid for update;
  if not found then raise exception 'no_profile'; end if;
  if p.coins < v_cost then raise exception 'insufficient_coins'; end if;

  select * into v_sp
    from public.species
   where gacha_weight > 0
     and (p.pity < v_pity_limit or rarity <> 'common')
   order by (-ln(1.0 - random())) / gacha_weight
   limit 1;
  if not found then raise exception 'no_species_available'; end if;

  insert into public.pets (owner_id, species_id) values (v_uid, v_sp.id) returning id into v_pet;

  update public.profiles
     set coins = coins - v_cost,
         pity = case when v_sp.rarity = 'common' then pity + 1 else 0 end,
         equipped_pet_id = coalesce(equipped_pet_id, v_pet)
   where user_id = v_uid;

  insert into public.ledger (user_id, delta, reason, ref_id) values (v_uid, -v_cost, 'gacha', v_pet);

  return jsonb_build_object(
    'pet_id', v_pet, 'species_id', v_sp.id, 'rarity', v_sp.rarity, 'coins', p.coins - v_cost
  );
end $$;

-- ---------------------------------------------------------------
-- 마켓: 올리기 / 취소 / 구매
-- ---------------------------------------------------------------
create function public.create_listing(p_pet_id uuid, p_price int) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
  v_id  uuid;
begin
  if v_uid is null then raise exception 'not_authenticated'; end if;
  if p_price is null or p_price < 1 or p_price > 1000000 then raise exception 'invalid_price'; end if;

  perform 1 from public.pets where id = p_pet_id and owner_id = v_uid for update;
  if not found then raise exception 'not_your_pet'; end if;
  if exists (select 1 from public.listings where pet_id = p_pet_id and status = 'active') then
    raise exception 'already_listed';
  end if;

  -- 판매하는 펫은 장착을 푼다.
  update public.profiles set equipped_pet_id = null
   where user_id = v_uid and equipped_pet_id = p_pet_id;

  insert into public.listings (pet_id, seller_id, price) values (p_pet_id, v_uid, p_price)
    returning id into v_id;
  return v_id;
end $$;

create function public.cancel_listing(p_listing_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'not_authenticated'; end if;
  update public.listings set status = 'cancelled'
   where id = p_listing_id and seller_id = v_uid and status = 'active';
  if not found then raise exception 'listing_unavailable'; end if;
end $$;

-- 구매: 한 트랜잭션에서 전부 처리하거나 아무것도 하지 않는다.
--   수수료 5%(내림)는 판매자가 받는 몫에서 빠지고 어디에도 가지 않는다(소각).
create function public.buy_listing(p_listing_id uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_uid         uuid := auth.uid();
  l             public.listings;
  v_fee         int;
  v_buyer_coins int;
begin
  if v_uid is null then raise exception 'not_authenticated'; end if;

  -- 같은 판매글을 두 사람이 동시에 살 수 없도록 잠근다.
  select * into l from public.listings where id = p_listing_id and status = 'active' for update;
  if not found then raise exception 'listing_unavailable'; end if;
  if l.seller_id = v_uid then raise exception 'own_listing'; end if;

  -- 두 지갑을 항상 같은 순서(user_id 순)로 잠가서 서로 기다리는 교착을 피한다.
  perform 1 from public.profiles
   where user_id in (v_uid, l.seller_id)
   order by user_id
   for update;

  select coins into v_buyer_coins from public.profiles where user_id = v_uid;
  if v_buyer_coins is null then raise exception 'no_profile'; end if;
  if v_buyer_coins < l.price then raise exception 'insufficient_coins'; end if;

  v_fee := floor(l.price * 0.05);

  update public.profiles set coins = coins - l.price where user_id = v_uid;
  update public.profiles set coins = coins + (l.price - v_fee) where user_id = l.seller_id;
  update public.pets set owner_id = v_uid where id = l.pet_id;
  update public.listings set status = 'sold', buyer_id = v_uid, sold_at = now() where id = l.id;

  insert into public.ledger (user_id, delta, reason, ref_id) values
    (v_uid,        -l.price,         'trade_buy',  l.id),
    (l.seller_id,  l.price - v_fee,  'trade_sell', l.id);

  return jsonb_build_object('pet_id', l.pet_id, 'price', l.price, 'fee', v_fee, 'coins', v_buyer_coins - l.price);
end $$;

-- ---------------------------------------------------------------
-- 장착: 데스크톱·웹에 보일 펫을 고른다(판매 중인 펫은 불가).
-- ---------------------------------------------------------------
create function public.equip_pet(p_pet_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'not_authenticated'; end if;
  perform 1 from public.pets where id = p_pet_id and owner_id = v_uid;
  if not found then raise exception 'not_your_pet'; end if;
  if exists (select 1 from public.listings where pet_id = p_pet_id and status = 'active') then
    raise exception 'pet_is_listed';
  end if;
  update public.profiles set equipped_pet_id = p_pet_id where user_id = v_uid;
end $$;

-- ---------------------------------------------------------------
-- 진화: 종 카탈로그에 진화 규칙이 있는 종만, 레벨과 재화 조건을 채웠을 때.
-- ---------------------------------------------------------------
create function public.evolve_pet(p_pet_id uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_uid   uuid := auth.uid();
  v_pet   public.pets;
  v_sp    public.species;
  v_coins int;
begin
  if v_uid is null then raise exception 'not_authenticated'; end if;

  select * into v_pet from public.pets where id = p_pet_id and owner_id = v_uid for update;
  if not found then raise exception 'not_your_pet'; end if;
  if exists (select 1 from public.listings where pet_id = p_pet_id and status = 'active') then
    raise exception 'pet_is_listed';
  end if;

  select * into v_sp from public.species where id = v_pet.species_id;
  if v_sp.evolves_to is null then raise exception 'cannot_evolve'; end if;
  if v_pet.level < v_sp.evolve_level then raise exception 'level_too_low'; end if;

  select coins into v_coins from public.profiles where user_id = v_uid for update;
  if v_coins < v_sp.evolve_cost then raise exception 'insufficient_coins'; end if;

  update public.profiles set coins = coins - v_sp.evolve_cost where user_id = v_uid;
  update public.pets set species_id = v_sp.evolves_to where id = p_pet_id;
  insert into public.ledger (user_id, delta, reason, ref_id) values (v_uid, -v_sp.evolve_cost, 'evolve', p_pet_id);

  return jsonb_build_object('pet_id', p_pet_id, 'species_id', v_sp.evolves_to, 'coins', v_coins - v_sp.evolve_cost);
end $$;

-- ---------------------------------------------------------------
-- 실행 권한: 로그인한 사용자만 부를 수 있다.
-- ---------------------------------------------------------------
revoke all on function public.report_learning(jsonb)        from public, anon, authenticated;
revoke all on function public.gacha_pull()                  from public, anon, authenticated;
revoke all on function public.create_listing(uuid, int)     from public, anon, authenticated;
revoke all on function public.cancel_listing(uuid)          from public, anon, authenticated;
revoke all on function public.buy_listing(uuid)             from public, anon, authenticated;
revoke all on function public.equip_pet(uuid)               from public, anon, authenticated;
revoke all on function public.evolve_pet(uuid)              from public, anon, authenticated;

grant execute on function public.report_learning(jsonb)     to authenticated;
grant execute on function public.gacha_pull()               to authenticated;
grant execute on function public.create_listing(uuid, int)  to authenticated;
grant execute on function public.cancel_listing(uuid)       to authenticated;
grant execute on function public.buy_listing(uuid)          to authenticated;
grant execute on function public.equip_pet(uuid)            to authenticated;
grant execute on function public.evolve_pet(uuid)           to authenticated;

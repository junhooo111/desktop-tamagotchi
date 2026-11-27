-- 0005: 서버 규칙을 앱 규칙에 맞춘다. (docs/server-roadmap.md 의 A 단계)
--
-- 재화가 둘이다.
--   tickets(뽑기권): 동물 뽑기 3장, 꾸미기 뽑기 2장. 앱의 뽑기권과 같다. 거래하지 않는다.
--   coins(게임머니): 돌봄·학습으로 얻고, 거래(경매장)에서만 쓴다. 수수료 없이 판 사람이 가격 그대로 받는다.
-- 원장(ledger)에 currency 를 두어 재화별로 "잔액 = 원장 합계"가 성립한다.
--
-- 동물은 앱과 같은 20종(일반 14 + 히든 6). 확률은 앱과 같게 히든 1%씩, 나머지는 균등.
-- 뽑을 때마다 새 펫(개체)이 생긴다 — 같은 동물이 또 나와도 별개의 펫이라 경매장에 올릴 수 있다.
-- (앱은 중복이 나오면 경험치 +30 으로 바꾸지만, 서버는 거래를 위해 개체로 남긴다.)

-- ---------------------------------------------------------------
-- 재화: 원장에 종류, 프로필에 뽑기권
-- ---------------------------------------------------------------
alter table public.ledger add column currency text not null default 'coin' check (currency in ('coin', 'ticket'));
alter table public.ledger drop constraint ledger_reason_check;
alter table public.ledger add constraint ledger_reason_check
  check (reason in ('welcome', 'learn', 'gacha', 'gacha_cosmetic', 'trade_buy', 'trade_sell', 'evolve', 'daily'));
alter table public.profiles add column tickets int not null default 0 check (tickets >= 0);

-- ---------------------------------------------------------------
-- 동물 20종. 가중치는 상대값: 히든 7, 일반 47 → 히든 1%씩(6%), 일반 약 6.7%씩(94%).
-- 앱의 확률(HIDDEN_PERCENT_EACH = 1)과 같은지는 SQL 시험이 비교한다.
-- ---------------------------------------------------------------
alter table public.species drop constraint species_rarity_check;
delete from public.species;
insert into public.species (id, name, rarity, gacha_weight) values
  ('rabbit',     '토끼',   'common', 47),
  ('cat',        '고양이', 'common', 47),
  ('dog',        '강아지', 'common', 47),
  ('turtle',     '거북이', 'common', 47),
  ('chick',      '병아리', 'common', 47),
  ('duck',       '오리',   'common', 47),
  ('fox',        '여우',   'common', 47),
  ('hamster',    '햄스터', 'common', 47),
  ('penguin',    '펭귄',   'common', 47),
  ('panda',      '판다',   'common', 47),
  ('bear',       '곰',     'common', 47),
  ('pig',        '돼지',   'common', 47),
  ('sheep',      '양',     'common', 47),
  ('owl',        '부엉이', 'common', 47),
  ('dragon',     '용',     'hidden',  7),
  ('azure',      '청룡',   'hidden',  7),
  ('whitetiger', '백호',   'hidden',  7),
  ('tortoise',   '현무',   'hidden',  7),
  ('phoenix',    '주작',   'hidden',  7),
  ('qilin',      '기린',   'hidden',  7);
alter table public.species add constraint species_rarity_check check (rarity in ('common', 'hidden'));

-- ---------------------------------------------------------------
-- 꾸미기(장식·색) 소유
-- ---------------------------------------------------------------
create table public.cosmetics (
  user_id     uuid not null references public.profiles (user_id) on delete cascade,
  kind        text not null check (kind in ('accessory', 'variant')),
  item_id     text not null,
  created_at  timestamptz not null default now(),
  primary key (user_id, kind, item_id)
);
alter table public.cosmetics enable row level security;
revoke all on public.cosmetics from public, anon, authenticated;
grant select on public.cosmetics to authenticated;
create policy cosmetics_read_own on public.cosmetics
  for select to authenticated using (user_id = (select auth.uid()));

-- 꾸미기 전체 목록(앱의 ACCESSORIES·VARIANTS 에서 'none'·'default' 를 뺀 것)
create function public.cosmetic_catalog() returns table (kind text, item_id text)
language sql immutable set search_path = '' as $$
  select 'accessory', x from unnest(array['ribbon','glasses','crown','wings','sprout','flower','partyhat','halo','cap','witch','chef','santa','headband','antenna','bunnyears','eyepatch','monocle','star']) as x
  union all
  select 'variant', x from unnest(array['pastel','deep','mono']) as x
$$;

-- ---------------------------------------------------------------
-- 가입: 환영 뽑기권 3장(앱의 WELCOME_TICKETS)과 환영 게임머니 100
-- ---------------------------------------------------------------
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_login text;
begin
  v_login := coalesce(
    nullif(new.raw_user_meta_data ->> 'user_name', ''),
    nullif(new.raw_user_meta_data ->> 'preferred_username', ''),
    'user-' || substr(new.id::text, 1, 8)
  );
  insert into public.profiles (user_id, github_login, avatar_url, coins, tickets)
  values (new.id, v_login, new.raw_user_meta_data ->> 'avatar_url', 100, 3);
  insert into public.ledger (user_id, delta, reason, currency) values (new.id, 100, 'welcome', 'coin'), (new.id, 3, 'welcome', 'ticket');
  return new;
end $$;

-- ---------------------------------------------------------------
-- 동물 뽑기: 뽑기권 3장. 히든이 안 나온 채 40번 뽑으면(pity = 40) 다음은 히든 확정(앱의 HIDDEN_PITY).
--   pity 는 "마지막 히든 이후 뽑은 횟수"다(앱의 sinceHidden).
-- ---------------------------------------------------------------
create or replace function public.gacha_pull() returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_uid         uuid := auth.uid();
  v_cost        constant int := 3;
  v_pity_limit  constant int := 40;
  p             public.profiles;
  v_sp          public.species;
  v_pet         uuid;
begin
  if v_uid is null then raise exception 'not_authenticated'; end if;

  select * into p from public.profiles where user_id = v_uid for update;
  if not found then raise exception 'no_profile'; end if;
  if p.tickets < v_cost then raise exception 'insufficient_tickets'; end if;

  select * into v_sp
    from public.species
   where gacha_weight > 0
     and (p.pity < v_pity_limit or rarity = 'hidden')
   order by (-ln(1.0 - random())) / gacha_weight
   limit 1;
  if not found then raise exception 'no_species_available'; end if;

  insert into public.pets (owner_id, species_id) values (v_uid, v_sp.id) returning id into v_pet;

  update public.profiles
     set tickets = tickets - v_cost,
         pity = case when v_sp.rarity = 'hidden' then 0 else pity + 1 end,
         equipped_pet_id = coalesce(equipped_pet_id, v_pet)
   where user_id = v_uid;

  insert into public.ledger (user_id, delta, reason, ref_id, currency) values (v_uid, -v_cost, 'gacha', v_pet, 'ticket');

  return jsonb_build_object('pet_id', v_pet, 'species_id', v_sp.id, 'rarity', v_sp.rarity, 'tickets', p.tickets - v_cost);
end $$;

-- ---------------------------------------------------------------
-- 꾸미기 뽑기: 뽑기권 2장. 아직 없는 꾸미기 중 균등하게 하나(앱의 pullCosmetic).
-- ---------------------------------------------------------------
create function public.gacha_cosmetic() returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_uid   uuid := auth.uid();
  v_cost  constant int := 2;
  p       public.profiles;
  v_kind  text;
  v_item  text;
begin
  if v_uid is null then raise exception 'not_authenticated'; end if;
  select * into p from public.profiles where user_id = v_uid for update;
  if not found then raise exception 'no_profile'; end if;
  if p.tickets < v_cost then raise exception 'insufficient_tickets'; end if;

  select c.kind, c.item_id into v_kind, v_item
    from public.cosmetic_catalog() c
   where not exists (select 1 from public.cosmetics o where o.user_id = v_uid and o.kind = c.kind and o.item_id = c.item_id)
   order by random()
   limit 1;
  if not found then raise exception 'all_collected'; end if;

  insert into public.cosmetics (user_id, kind, item_id) values (v_uid, v_kind, v_item);
  update public.profiles set tickets = tickets - v_cost where user_id = v_uid;
  insert into public.ledger (user_id, delta, reason, currency) values (v_uid, -v_cost, 'gacha_cosmetic', 'ticket');
  return jsonb_build_object('kind', v_kind, 'item_id', v_item, 'tickets', p.tickets - v_cost);
end $$;

-- ---------------------------------------------------------------
-- 출석 뽑기권: 하루(UTC) 1장(앱의 DAILY_TICKETS). 이미 받았으면 0장.
-- ---------------------------------------------------------------
create function public.claim_daily_ticket() returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_uid       uuid := auth.uid();
  v_day_start timestamptz := date_trunc('day', now() at time zone 'utc') at time zone 'utc';
  v_got       int := 0;
  v_tickets   int;
begin
  if v_uid is null then raise exception 'not_authenticated'; end if;
  perform 1 from public.profiles where user_id = v_uid for update;
  if not found then raise exception 'no_profile'; end if;
  if not exists (select 1 from public.ledger where user_id = v_uid and reason = 'daily' and currency = 'ticket' and created_at >= v_day_start) then
    update public.profiles set tickets = tickets + 1 where user_id = v_uid;
    insert into public.ledger (user_id, delta, reason, currency) values (v_uid, 1, 'daily', 'ticket');
    v_got := 1;
  end if;
  select tickets into v_tickets from public.profiles where user_id = v_uid;
  return jsonb_build_object('granted', v_got, 'tickets', v_tickets);
end $$;

-- ---------------------------------------------------------------
-- 경매장 구매: 수수료 없이 판 사람이 가격 그대로 받는다.
-- ---------------------------------------------------------------
create or replace function public.buy_listing(p_listing_id uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_uid         uuid := auth.uid();
  l             public.listings;
  v_buyer_coins int;
begin
  if v_uid is null then raise exception 'not_authenticated'; end if;

  select * into l from public.listings where id = p_listing_id and status = 'active' for update;
  if not found then raise exception 'listing_unavailable'; end if;
  if l.seller_id = v_uid then raise exception 'own_listing'; end if;

  perform 1 from public.profiles
   where user_id in (v_uid, l.seller_id)
   order by user_id
   for update;

  select coins into v_buyer_coins from public.profiles where user_id = v_uid;
  if v_buyer_coins is null then raise exception 'no_profile'; end if;
  if v_buyer_coins < l.price then raise exception 'insufficient_coins'; end if;

  update public.profiles set coins = coins - l.price where user_id = v_uid;
  update public.profiles set coins = coins + l.price where user_id = l.seller_id;
  update public.pets set owner_id = v_uid where id = l.pet_id;
  update public.listings set status = 'sold', buyer_id = v_uid, sold_at = now() where id = l.id;

  insert into public.ledger (user_id, delta, reason, ref_id, currency) values
    (v_uid,        -l.price, 'trade_buy',  l.id, 'coin'),
    (l.seller_id,   l.price, 'trade_sell', l.id, 'coin');

  return jsonb_build_object('pet_id', l.pet_id, 'price', l.price, 'coins', v_buyer_coins - l.price);
end $$;

-- ---------------------------------------------------------------
-- 권한: 새 함수는 로그인한 사용자만. (create or replace 한 함수의 권한은 유지된다)
-- ---------------------------------------------------------------
revoke all on function public.cosmetic_catalog()      from public, anon, authenticated;
revoke all on function public.gacha_cosmetic()        from public, anon, authenticated;
revoke all on function public.claim_daily_ticket()    from public, anon, authenticated;
grant execute on function public.gacha_cosmetic()     to authenticated;
grant execute on function public.claim_daily_ticket() to authenticated;

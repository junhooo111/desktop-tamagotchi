-- 0010: 경매장(F 단계)에 필요한 서버 규칙. (docs/server-roadmap.md)
--
-- 1) 게임머니 획득: 돌봄·업적. 앱은 종류(kind)와 열쇠(key)만 보내고 양과 하루 상한은 서버가 정한다.
--      care        : 돌봄 10회마다 5 게임머니(앱이 10회마다 한 번 보낸다). 하루 100.
--      achievement : 업적 하나당 30 게임머니(업적 id 가 열쇠라 한 번만). 하루 300.
--    (학습 이벤트의 게임머니는 0003 의 report_learning 이 이미 맡는다.)
--    같은 (kind, key) 는 한 번만 인정한다(멱등). 위조는 못 막고, 상한으로 피해를 제한한다(현금화 수단 없음).
-- 2) 경매장 조회: 지금 팔리는 펫 목록(market_listings), 내 펫 목록(my_pets).
-- 3) 마지막 한 마리는 팔 수 없다(앱은 항상 키울 펫이 한 마리는 있어야 한다).

alter table public.ledger drop constraint ledger_reason_check;
alter table public.ledger add constraint ledger_reason_check
  check (reason in ('welcome', 'learn', 'gacha', 'gacha_cosmetic', 'trade_buy', 'trade_sell', 'evolve', 'daily', 'import',
                    'uptime', 'care', 'level', 'gift', 'update', 'care_coin', 'achievement'));

create table public.coin_grants (
  user_id     uuid not null references public.profiles (user_id) on delete cascade,
  kind        text not null check (kind in ('care', 'achievement')),
  key         text not null check (char_length(key) between 1 and 64),
  amount      int  not null check (amount > 0),
  created_at  timestamptz not null default now(),
  primary key (user_id, kind, key)
);
alter table public.coin_grants enable row level security;
revoke all on public.coin_grants from public, anon, authenticated;
create index coin_grants_day_idx on public.coin_grants (user_id, kind, created_at);

create function public.grant_coins(p_kind text, p_key text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_uid       uuid := auth.uid();
  v_day_start timestamptz := date_trunc('day', now() at time zone 'utc') at time zone 'utc';
  v_amount    int;
  v_day_cap   int;
  v_used      int;
  v_grant     int;
  v_rows      int;
  v_coins     int;
begin
  if v_uid is null then raise exception 'not_authenticated'; end if;
  if p_kind is null or p_key is null or char_length(p_key) not between 1 and 64 then raise exception 'invalid_grant'; end if;

  select amount, cap into v_amount, v_day_cap
    from (values ('care', 5, 100), ('achievement', 30, 300)) as t(kind, amount, cap)
   where t.kind = p_kind;
  if not found then raise exception 'invalid_grant'; end if;

  perform 1 from public.profiles where user_id = v_uid for update;
  if not found then raise exception 'no_profile'; end if;

  select coalesce(sum(amount), 0) into v_used
    from public.coin_grants where user_id = v_uid and kind = p_kind and created_at >= v_day_start;
  v_grant := greatest(0, least(v_amount, v_day_cap - v_used));

  if v_grant > 0 then
    insert into public.coin_grants (user_id, kind, key, amount) values (v_uid, p_kind, p_key, v_grant)
      on conflict do nothing;
    get diagnostics v_rows = row_count;
    if v_rows = 0 then
      v_grant := 0;
    else
      update public.profiles set coins = coins + v_grant where user_id = v_uid;
      insert into public.ledger (user_id, delta, reason, currency) values (v_uid, v_grant, case p_kind when 'care' then 'care_coin' else 'achievement' end, 'coin');
    end if;
  end if;

  select coins into v_coins from public.profiles where user_id = v_uid;
  return jsonb_build_object('granted', v_grant, 'coins', v_coins);
end $$;

-- ---------------------------------------------------------------
-- 경매장: 지금 팔리는 펫(싼 순). 판매자 이름·펫의 종·레벨·가격만 보인다.
-- ---------------------------------------------------------------
create function public.market_listings(p_limit int default 30) returns table (
  listing_id uuid, price int, species_id text, species_name text, rarity text, level int, seller_login text, is_mine boolean, created_at timestamptz
)
language plpgsql stable security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  if p_limit is null or p_limit < 1 or p_limit > 100 then raise exception 'invalid_limit'; end if;
  return query
    select l.id, l.price, p.species_id, s.name, s.rarity, p.level, pr.github_login, l.seller_id = auth.uid(), l.created_at
      from public.listings l
      join public.pets p on p.id = l.pet_id
      join public.species s on s.id = p.species_id
      join public.profiles pr on pr.user_id = l.seller_id
     where l.status = 'active'
     order by l.price, l.created_at
     limit p_limit;
end $$;

-- 내 펫(판매 중이면 가격과 판매 번호). 마지막 한 마리인지도 알려 준다.
create function public.my_pets() returns table (
  pet_id uuid, species_id text, species_name text, rarity text, level int, xp int, equipped boolean, listing_id uuid, price int
)
language plpgsql stable security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  return query
    select p.id, p.species_id, s.name, s.rarity, p.level, p.xp, p.id = pr.equipped_pet_id, l.id, l.price
      from public.pets p
      join public.species s on s.id = p.species_id
      join public.profiles pr on pr.user_id = p.owner_id
      left join public.listings l on l.pet_id = p.id and l.status = 'active'
     where p.owner_id = auth.uid()
     order by p.xp desc, p.created_at;
end $$;

-- 마지막 한 마리는 팔 수 없다(0003 의 create_listing 에 검사를 더한다).
create or replace function public.create_listing(p_pet_id uuid, p_price int) returns uuid
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
  -- 팔지 않고 남는 펫이 한 마리는 있어야 한다(판매 중인 펫은 세지 않는다).
  if (select count(*) from public.pets p
       where p.owner_id = v_uid and p.id <> p_pet_id
         and not exists (select 1 from public.listings l where l.pet_id = p.id and l.status = 'active')) < 1 then
    raise exception 'last_pet';
  end if;

  update public.profiles set equipped_pet_id = null
   where user_id = v_uid and equipped_pet_id = p_pet_id;

  insert into public.listings (pet_id, seller_id, price) values (p_pet_id, v_uid, p_price)
    returning id into v_id;
  return v_id;
end $$;

revoke all on function public.grant_coins(text, text)  from public, anon, authenticated;
revoke all on function public.market_listings(int)     from public, anon, authenticated;
revoke all on function public.my_pets()                from public, anon, authenticated;
grant execute on function public.grant_coins(text, text) to authenticated;
grant execute on function public.market_listings(int)    to authenticated;
grant execute on function public.my_pets()               to authenticated;

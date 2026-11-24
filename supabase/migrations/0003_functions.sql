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

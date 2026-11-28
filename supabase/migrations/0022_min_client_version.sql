-- 0022: 앱 최소 버전 검사
--
-- 서버 규칙을 바꾸면(새 동물·새 꾸미기 종류 등) 오래된 앱이 결과를 제대로 보여 주지 못한다(뽑기권은 나가는데 결과가 이상하게 보임).
-- 그래서 뽑기 함수가 앱 버전(p_client_version)을 받고, app_config 의 min_client_version 보다 낮으면 'client_outdated' 로 거절한다.
--   - 값이 '0.0.0' 이면 검사하지 않는다(기본). 버전을 보내지 않는 예전 앱은 '0.0.0' 으로 본다 → 최소 버전을 올리면 예전 앱은 뽑기 전에 거절된다.
--   - 거절은 뽑기권을 쓰기 전에 일어난다(재화가 빠지지 않는다).
-- 최소 버전은 새 앱이 나가서 대부분 업데이트한 뒤에 올린다:  update public.app_config set value = '0.14.0' where key = 'min_client_version';

create table public.app_config (
  key    text primary key,
  value  text not null
);
alter table public.app_config enable row level security;
revoke all on public.app_config from public, anon, authenticated;
insert into public.app_config (key, value) values ('min_client_version', '0.0.0');

-- "1.2.3" 을 (1,2,3) 숫자 묶음으로 바꾼다. 이상한 값은 0.0.0.
create function public._version_parts(p_text text) returns int[]
language sql immutable set search_path = '' as $$
  select case when p_text ~ '^[0-9]+\.[0-9]+\.[0-9]+' then array[
    split_part(p_text, '.', 1)::int,
    split_part(p_text, '.', 2)::int,
    (regexp_match(split_part(p_text, '.', 3), '^[0-9]+'))[1]::int
  ] else array[0, 0, 0] end
$$;

create function public._require_client(p_version text) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_min text;
begin
  select value into v_min from public.app_config where key = 'min_client_version';
  if v_min is null or public._version_parts(v_min) = array[0, 0, 0] then return; end if; -- 검사 끔
  if public._version_parts(p_version) < public._version_parts(v_min) then raise exception 'client_outdated'; end if;
end $$;
revoke all on function public._version_parts(text) from public, anon, authenticated;
revoke all on function public._require_client(text) from public, anon, authenticated;

drop function public.gacha_pull();
drop function public.gacha_cosmetic();

create function public.gacha_pull(p_client_version text default null) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_uid         uuid := auth.uid();
  v_cost        constant int := 3;
  v_pity_limit  constant int := 50;
  p             public.profiles;
  v_sp          public.species;
  v_pet         uuid;
begin
  if v_uid is null then raise exception 'not_authenticated'; end if;
  perform public._require_client(p_client_version);

  select * into p from public.profiles where user_id = v_uid for update;
  if not found then raise exception 'no_profile'; end if;
  if p.tickets < v_cost then raise exception 'insufficient_tickets'; end if;

  -- 천장에 닿았으면 전설 중에서만 고른다. 아니면 전체에서 가중치대로(히든도 천장 없이 여기서만 나온다).
  select * into v_sp
    from public.species
   where gacha_weight > 0
     and (p.pity < v_pity_limit or rarity = 'legend')
   order by (-ln(1.0 - random())) / gacha_weight
   limit 1;
  if not found then raise exception 'no_species_available'; end if;

  insert into public.pets (owner_id, species_id) values (v_uid, v_sp.id) returning id into v_pet;

  update public.profiles
     set tickets = tickets - v_cost,
         pity = case when v_sp.rarity in ('legend', 'hidden') then 0 else pity + 1 end,
         equipped_pet_id = coalesce(equipped_pet_id, v_pet)
   where user_id = v_uid;

  insert into public.ledger (user_id, delta, reason, ref_id, currency) values (v_uid, -v_cost, 'gacha', v_pet, 'ticket');

  return jsonb_build_object('pet_id', v_pet, 'species_id', v_sp.id, 'rarity', v_sp.rarity, 'tickets', p.tickets - v_cost);
end $$;

create function public.gacha_cosmetic(p_client_version text default null) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_uid         uuid := auth.uid();
  v_cost        constant int := 2;
  v_pity_limit  constant int := 25;
  p             public.profiles;
  v_total       numeric;
  v_roll        numeric;
  v_acc         numeric := 0;
  v_rarity      text;
  v_kind        text;
  v_item        text;
  v_left        text[];
  g             text;
begin
  if v_uid is null then raise exception 'not_authenticated'; end if;
  perform public._require_client(p_client_version);
  select * into p from public.profiles where user_id = v_uid for update;
  if not found then raise exception 'no_profile'; end if;
  if p.tickets < v_cost then raise exception 'insufficient_tickets'; end if;

  -- 안 가진 것이 남은 등급과 그 확률의 합(낮은 등급부터)
  select coalesce(array_agg(w.rarity order by w.ord), '{}'::text[]), coalesce(sum(w.pct), 0)
    into v_left, v_total
    from (values ('common', 50, 1), ('uncommon', 24, 2), ('rare', 15, 3), ('special', 7, 4), ('legend', 3, 5), ('hidden', 1, 6)) as w(rarity, pct, ord)
   where exists (
     select 1 from public.cosmetic_items i
      where i.gacha and i.rarity = w.rarity
        and not exists (select 1 from public.cosmetics o where o.user_id = v_uid and o.kind = i.kind and o.item_id = i.item_id));
  if v_total = 0 then raise exception 'all_collected'; end if;

  if p.cosmetic_pity + 1 >= v_pity_limit and 'legend' = any (v_left) then
    v_rarity := 'legend';
  else
    v_roll := random() * v_total;
    foreach g in array v_left loop
      v_acc := v_acc + case g when 'common' then 50 when 'uncommon' then 24 when 'rare' then 15 when 'special' then 7 when 'legend' then 3 else 1 end;
      if v_roll < v_acc then
        v_rarity := g;
        exit;
      end if;
    end loop;
    if v_rarity is null then v_rarity := v_left[array_length(v_left, 1)]; end if;
  end if;

  select i.kind, i.item_id into v_kind, v_item
    from public.cosmetic_items i
   where i.gacha and i.rarity = v_rarity
     and not exists (select 1 from public.cosmetics o where o.user_id = v_uid and o.kind = i.kind and o.item_id = i.item_id)
   order by random()
   limit 1;
  if not found then raise exception 'all_collected'; end if;

  insert into public.cosmetics (user_id, kind, item_id) values (v_uid, v_kind, v_item);
  update public.profiles
     set tickets = tickets - v_cost,
         cosmetic_pity = case when v_rarity in ('legend', 'hidden') then 0 else cosmetic_pity + 1 end
   where user_id = v_uid;
  insert into public.ledger (user_id, delta, reason, currency) values (v_uid, -v_cost, 'gacha_cosmetic', 'ticket');
  return jsonb_build_object('kind', v_kind, 'item_id', v_item, 'rarity', v_rarity, 'tickets', p.tickets - v_cost);
end $$;

revoke all on function public.gacha_pull(text) from public, anon, authenticated;
revoke all on function public.gacha_cosmetic(text) from public, anon, authenticated;
grant execute on function public.gacha_pull(text) to authenticated;
grant execute on function public.gacha_cosmetic(text) to authenticated;

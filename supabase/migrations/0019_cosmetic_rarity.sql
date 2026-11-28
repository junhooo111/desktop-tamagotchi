-- 0019: 꾸미기 등급 (일반 < 고급 < 희귀 < 특별 < 전설 < 히든)
--
-- 꾸미기 뽑기는 "안 가진 것만" 나오는 방식 그대로이고, 뽑는 순서만 바뀐다:
--   1) 안 가진 것이 남은 등급 중에서 등급을 고른다(확률은 동물과 같은 일반 50·고급 24·희귀 15·특별 7·전설 3·히든 1 의 비율,
--      남은 등급끼리 다시 나눈다).
--   2) 그 등급의 안 가진 것 중 하나를 같은 확률로 고른다.
-- 천장: 전설이 안 나온 채 25번 뽑으면(profiles.cosmetic_pity) 다음은 안 가진 전설이 확정이다(남아 있을 때). 전설·히든이 나오면 0.
-- 업적으로만 얻는 장식 6종은 뽑기에서 뺀다(이전에는 서버가 이 6종도 뽑기에 넣고 있어서 앱의 설명과 달랐다).
-- 앱의 src/shared/cosmetics.ts 의 COSMETIC_ITEMS 와 이 표가 같아야 하고, SQL 시험이 비교한다.

create table public.cosmetic_items (
  kind     text    not null check (kind in ('accessory', 'variant')),
  item_id  text    not null,
  rarity   text    not null check (rarity in ('common', 'uncommon', 'rare', 'special', 'legend', 'hidden')),
  gacha    boolean not null default true,
  primary key (kind, item_id)
);
alter table public.cosmetic_items enable row level security;
revoke all on public.cosmetic_items from public, anon, authenticated;

insert into public.cosmetic_items (kind, item_id, rarity, gacha) values
  ('accessory', 'ribbon',    'common',   true),
  ('accessory', 'sprout',    'common',   true),
  ('accessory', 'flower',    'common',   true),
  ('accessory', 'cap',       'common',   true),
  ('accessory', 'partyhat',  'uncommon', true),
  ('accessory', 'glasses',   'uncommon', true),
  ('accessory', 'chef',      'uncommon', true),
  ('accessory', 'santa',     'uncommon', true),
  ('variant',   'pastel',    'uncommon', true),
  ('accessory', 'witch',     'rare',     true),
  ('accessory', 'halo',      'rare',     true),
  ('variant',   'deep',      'rare',     true),
  ('accessory', 'crown',     'special',  true),
  ('variant',   'mono',      'special',  true),
  ('accessory', 'wings',     'legend',   true),
  ('accessory', 'headband',  'rare',     false),
  ('accessory', 'antenna',   'rare',     false),
  ('accessory', 'bunnyears', 'rare',     false),
  ('accessory', 'eyepatch',  'rare',     false),
  ('accessory', 'monocle',   'rare',     false),
  ('accessory', 'star',      'special',  false);

alter table public.profiles add column cosmetic_pity int not null default 0 check (cosmetic_pity >= 0);

create or replace function public.gacha_cosmetic() returns jsonb
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

revoke all on function public.gacha_cosmetic() from public, anon, authenticated;
grant execute on function public.gacha_cosmetic() to authenticated;

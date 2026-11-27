-- 0006: 기존 사용자의 로컬 진행을 서버 소유 데이터로 한 번만 가져온다. (docs/server-roadmap.md 의 B 단계)
--
-- 원천은 0004 의 계정 저장분(account_saves)에 올려 둔 collection.json 이다. 앱은 따로 값을 보내지 않고
-- "가져오기"만 요청하며, 서버가 저장분을 읽어서 변환한다.
--
-- 변환 규칙
--   동물   : 가진 종마다 펫 1마리(경험치는 상한 안에서 그대로). 앱의 중복 횟수는 늘려 주지 않는다(복제 방지).
--   뽑기권 : 가진 장수(상한 1000)를 그대로.
--   꾸미기 : 뽑기로 얻은 장식·색 중 서버 목록에 있는 것만.
--   장착   : 앱에서 꺼내 키우던 동물(없으면 첫 펫). 천장 카운트(sinceHidden)도 이어받는다(상한 40).
--   게임머니: 가져오지 않는다(새 재화).
-- 안전 장치: 한 계정에 한 번만(account_imports), 이미 서버에 펫이 있으면 하지 않는다, 형식이 이상한 값은 건너뛴다.
-- 가져온 뒤에는 서버가 기준이다. 로컬 저장 파일은 건드리지 않는다.

alter table public.ledger drop constraint ledger_reason_check;
alter table public.ledger add constraint ledger_reason_check
  check (reason in ('welcome', 'learn', 'gacha', 'gacha_cosmetic', 'trade_buy', 'trade_sell', 'evolve', 'daily', 'import'));

create table public.account_imports (
  user_id      uuid primary key references public.profiles (user_id) on delete cascade,
  imported_at  timestamptz not null default now(),
  pets         int not null,
  tickets      int not null,
  cosmetics    int not null
);
alter table public.account_imports enable row level security;
revoke all on public.account_imports from public, anon, authenticated;
grant select on public.account_imports to authenticated;
create policy account_imports_read_own on public.account_imports
  for select to authenticated using (user_id = (select auth.uid()));

create function public.import_local_collection() returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_uid       uuid := auth.uid();
  v_save      public.account_saves;
  v_col       jsonb;
  v_key       text;
  v_val       jsonb;
  v_xp        int;
  v_pet       uuid;
  v_first     uuid;
  v_equipped  uuid;
  v_pets      int := 0;
  v_tickets   int := 0;
  v_cos       int := 0;
  v_since     int := 0;
  v_rows      int;
  v_item      text;
begin
  if v_uid is null then raise exception 'not_authenticated'; end if;

  perform 1 from public.profiles where user_id = v_uid for update;
  if not found then raise exception 'no_profile'; end if;

  if exists (select 1 from public.account_imports where user_id = v_uid) then
    return jsonb_build_object('imported', false, 'reason', 'already_imported');
  end if;
  if exists (select 1 from public.pets where owner_id = v_uid) then
    return jsonb_build_object('imported', false, 'reason', 'has_pets');
  end if;

  select * into v_save from public.account_saves where user_id = v_uid;
  if not found then return jsonb_build_object('imported', false, 'reason', 'no_save'); end if;

  v_col := v_save.data -> 'files' -> 'collection.json';
  if jsonb_typeof(v_col) is distinct from 'object' then
    return jsonb_build_object('imported', false, 'reason', 'no_collection');
  end if;

  -- 동물: 가진 종마다 1마리
  if jsonb_typeof(v_col -> 'owned') = 'object' then
    for v_key, v_val in select key, value from jsonb_each(v_col -> 'owned') limit 40 loop
      if jsonb_typeof(v_val) is distinct from 'object' then continue; end if;
      if not exists (select 1 from public.species where id = v_key) then continue; end if;
      v_xp := case when jsonb_typeof(v_val -> 'pet' -> 'xp') = 'number'
                   then least(greatest(floor((v_val -> 'pet' ->> 'xp')::numeric), 0), 2000000)::int
                   else 0 end;
      insert into public.pets (owner_id, species_id, xp) values (v_uid, v_key, v_xp) returning id into v_pet;
      v_pets := v_pets + 1;
      v_first := coalesce(v_first, v_pet);
      if v_key = v_col ->> 'active' then v_equipped := v_pet; end if;
    end loop;
  end if;

  -- 뽑기권, 천장 카운트
  if jsonb_typeof(v_col -> 'tickets') = 'number' then
    v_tickets := least(greatest(floor((v_col ->> 'tickets')::numeric), 0), 1000)::int;
  end if;
  if jsonb_typeof(v_col -> 'sinceHidden') = 'number' then
    v_since := least(greatest(floor((v_col ->> 'sinceHidden')::numeric), 0), 40)::int;
  end if;

  update public.profiles
     set tickets = tickets + v_tickets,
         pity = case when v_pets > 0 then v_since else pity end,
         equipped_pet_id = coalesce(equipped_pet_id, v_equipped, v_first)
   where user_id = v_uid;
  if v_tickets > 0 then
    insert into public.ledger (user_id, delta, reason, currency) values (v_uid, v_tickets, 'import', 'ticket');
  end if;

  -- 꾸미기: 서버 목록에 있는 것만
  for v_item in select jsonb_array_elements_text(case when jsonb_typeof(v_col -> 'accessories') = 'array' then v_col -> 'accessories' else '[]'::jsonb end) limit 50 loop
    insert into public.cosmetics (user_id, kind, item_id)
    select v_uid, 'accessory', c.item_id from public.cosmetic_catalog() c where c.kind = 'accessory' and c.item_id = v_item
    on conflict do nothing;
    get diagnostics v_rows = row_count;
    v_cos := v_cos + v_rows;
  end loop;
  for v_item in select jsonb_array_elements_text(case when jsonb_typeof(v_col -> 'variants') = 'array' then v_col -> 'variants' else '[]'::jsonb end) limit 50 loop
    insert into public.cosmetics (user_id, kind, item_id)
    select v_uid, 'variant', c.item_id from public.cosmetic_catalog() c where c.kind = 'variant' and c.item_id = v_item
    on conflict do nothing;
    get diagnostics v_rows = row_count;
    v_cos := v_cos + v_rows;
  end loop;

  insert into public.account_imports (user_id, pets, tickets, cosmetics) values (v_uid, v_pets, v_tickets, v_cos);
  return jsonb_build_object('imported', true, 'pets', v_pets, 'tickets', v_tickets, 'cosmetics', v_cos);
end $$;

revoke all on function public.import_local_collection() from public, anon, authenticated;
grant execute on function public.import_local_collection() to authenticated;

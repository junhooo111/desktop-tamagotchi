-- 0013: 프로필 카드를 풍성하게 — 꾸미기(색·장식)·이름·모습·연속일·도감·업적 수를 서버가 카드에 그릴 수 있게 한다.
--
-- 앱이 set_card_extras 로 "보여 주기용" 값을 올린다. 재화·뽑기와 무관한 표시 데이터라 서버가 계산하지 못해도 되지만,
-- 아무 값이나 받지 않도록 모두 허용 목록·범위로 걸러서 저장한다(이상한 값은 기본값으로 바꾼다).
-- 공개 조회(public_card_data)는 저장된 extras 와 (카드에 보여 줄 동물로 고른) 종을 돌려준다. 그 종을 실제로 가지고 있을 때만 쓴다.

alter table public.profiles add column card_extras jsonb;

create function public.set_card_extras(p_extras jsonb) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_uid     uuid := auth.uid();
  v         jsonb := coalesce(p_extras, '{}'::jsonb);
  v_today   date := (now() at time zone 'utc')::date;
  v_variant text;
  v_acc     text;
  v_name    text;
  v_stage   text;
  v_species text;
  v_day     date;
  v_out     jsonb;
  num       text;
begin
  if v_uid is null then raise exception 'not_authenticated'; end if;
  if jsonb_typeof(v) <> 'object' then raise exception 'invalid_extras'; end if;

  v_variant := case when v ->> 'variant' in ('default', 'pastel', 'deep', 'mono') then v ->> 'variant' else 'default' end;
  v_acc := case when v ->> 'accessory' in ('none', 'ribbon', 'glasses', 'crown', 'wings', 'sprout', 'flower', 'partyhat', 'halo', 'cap', 'witch',
                                           'chef', 'santa', 'headband', 'antenna', 'bunnyears', 'eyepatch', 'monocle', 'star')
                    then v ->> 'accessory' else 'none' end;
  v_name := left(btrim(regexp_replace(coalesce(v ->> 'name', ''), '[[:cntrl:]<>&"]', '', 'g')), 12);
  v_stage := case when v ->> 'stage' in ('baby', 'adult', 'legend') then v ->> 'stage' else null end;
  v_species := case when v ->> 'species' in ('rabbit', 'cat', 'dog', 'turtle', 'chick', 'duck', 'fox', 'hamster', 'penguin', 'panda', 'bear',
                                              'pig', 'sheep', 'owl', 'dragon', 'azure', 'whitetiger', 'tortoise', 'phoenix', 'qilin')
                    then v ->> 'species' else null end;

  -- 보낸 날(UTC). 어제~내일 안이 아니면 오늘로 본다(연속일이 얼마나 최신인지 카드가 판단하는 데 쓴다).
  begin
    v_day := (v ->> 'day')::date;
  exception when others then
    v_day := v_today;
  end;
  if v_day is null or v_day < v_today - 1 or v_day > v_today + 1 then v_day := v_today; end if;

  v_out := jsonb_build_object(
    'variant', v_variant,
    'accessory', v_acc,
    'day', v_day::text,
    'streak', 0, 'fixes', 0, 'quiz', 0, 'rules', 0, 'tips', 0, 'badges', 0
  );
  if v_name <> '' then v_out := v_out || jsonb_build_object('name', v_name); end if;
  if v_stage is not null then v_out := v_out || jsonb_build_object('stage', v_stage); end if;
  if v_species is not null then v_out := v_out || jsonb_build_object('species', v_species); end if;

  -- 숫자: 숫자가 아니면 0, 범위를 넘으면 한계값
  for num in select unnest(array['streak', 'fixes', 'quiz', 'rules', 'tips', 'badges']) loop
    if jsonb_typeof(v -> num) = 'number' then
      v_out := jsonb_set(v_out, array[num], to_jsonb(least(case num when 'rules' then 50 when 'tips' then 200 when 'badges' then 50 else 100000 end,
                                                             greatest(0, floor((v ->> num)::numeric)::int))));
    end if;
  end loop;

  update public.profiles set card_extras = v_out where user_id = v_uid;
  if not found then raise exception 'no_profile'; end if;
end $$;

revoke all on function public.set_card_extras(jsonb) from public, anon, authenticated;
grant execute on function public.set_card_extras(jsonb) to authenticated;

-- 공개 카드 데이터에 extras 를 더한다(0009 의 함수를 바꾼다).
create or replace function public.public_card_data(p_login text) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  p       public.profiles;
  v_sp    text;
  v_xp    int;
  v_count int;
  v_pick  text;
  v_out   jsonb;
begin
  if p_login is null or p_login !~ '^[A-Za-z0-9-]{1,39}$' then
    return jsonb_build_object('found', false);
  end if;

  select * into p
    from public.profiles
   where lower(github_login) = lower(p_login) and show_in_ranking
   order by created_at desc
   limit 1;
  if not found then return jsonb_build_object('found', false); end if;

  -- 카드에 보여 줄 동물로 고른 종을 실제로 가지고 있으면 그 동물(경험치가 가장 높은 개체), 아니면 장착한(없으면 가장 센) 펫
  v_pick := p.card_extras ->> 'species';
  if v_pick is not null then
    select t.species_id, t.xp into v_sp, v_xp
      from public.pets t
     where t.owner_id = p.user_id and t.species_id = v_pick
     order by t.xp desc, t.created_at
     limit 1;
  end if;
  if v_sp is null then
    select t.species_id, t.xp into v_sp, v_xp
      from public.pets t
     where t.owner_id = p.user_id
     order by (t.id = p.equipped_pet_id) desc, t.xp desc, t.created_at
     limit 1;
  end if;

  select count(distinct t.species_id)::int into v_count from public.pets t where t.owner_id = p.user_id;

  v_out := jsonb_build_object(
    'found', true,
    'github_login', p.github_login,
    'species_id', v_sp,
    'xp', v_xp,
    'species_count', v_count
  );
  if p.card_extras is not null then v_out := v_out || jsonb_build_object('extras', p.card_extras); end if;
  return v_out;
end $$;

revoke all on function public.public_card_data(text) from public, anon, authenticated;
grant execute on function public.public_card_data(text) to anon, authenticated;

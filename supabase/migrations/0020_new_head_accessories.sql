-- 0020: 새 머리 장식 10종 (꾸미기 뽑기 전용)
--   일반: 베레모·비니·두건 / 고급: 카우보이 모자·헤드폰 / 희귀: 해적 모자·기사 투구 / 특별: 악마 뿔·유니콘 뿔 / 전설: 불꽃 왕관
-- 뽑기 대상이 15종에서 25종이 된다. 프로필 카드용 허용 목록(set_card_extras)에도 넣는다(나머지는 0018 과 같다).

insert into public.cosmetic_items (kind, item_id, rarity, gacha) values
  ('accessory', 'beret',       'common',   true),
  ('accessory', 'beanie',      'common',   true),
  ('accessory', 'bandana',     'common',   true),
  ('accessory', 'cowboy',      'uncommon', true),
  ('accessory', 'headphones',  'uncommon', true),
  ('accessory', 'pirate',      'rare',     true),
  ('accessory', 'knight',      'rare',     true),
  ('accessory', 'devil',       'special',  true),
  ('accessory', 'unicornhorn', 'special',  true),
  ('accessory', 'flamecrown',  'legend',   true);

create or replace function public.set_card_extras(p_extras jsonb) returns void
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
                                           'chef', 'santa', 'headband', 'antenna', 'bunnyears', 'eyepatch', 'monocle', 'star',
                                           'beret', 'beanie', 'bandana', 'cowboy', 'headphones', 'pirate', 'knight', 'devil', 'unicornhorn', 'flamecrown')
                    then v ->> 'accessory' else 'none' end;
  v_name := left(btrim(regexp_replace(coalesce(v ->> 'name', ''), '[[:cntrl:]<>&"]', '', 'g')), 12);
  v_stage := case when v ->> 'stage' in ('baby', 'adult', 'legend') then v ->> 'stage' else null end;
  v_species := case when v ->> 'species' in ('rabbit', 'cat', 'dog', 'turtle', 'chick', 'duck', 'fox', 'hamster', 'penguin', 'panda', 'bear',
                                              'pig', 'sheep', 'owl', 'dragon', 'azure', 'whitetiger', 'tortoise', 'phoenix', 'qilin',
                                              'otter', 'alpaca', 'parrot', 'raccoon',
                                              'redpanda', 'arcticfox', 'peacock', 'lion',
                                              'unicorn', 'kumiho', 'griffin')
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

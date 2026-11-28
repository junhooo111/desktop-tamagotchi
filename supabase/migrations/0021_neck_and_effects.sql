-- 0021: 꾸미기의 새 종류 둘 — 목 장식(neck)과 효과(effect)
--   목 장식: 방울 목줄·스카프(일반) / 나비넥타이(고급) / 진주 목걸이(희귀) / 별 목걸이(특별) / 황금 목걸이(전설)
--   효과: 반짝이·하트(고급) / 음표·눈송이(희귀) / 불꽃 오라(전설)
-- 모두 꾸미기 뽑기 전용이다(뽑기 대상은 25종 → 36종). 프로필 카드에도 입은 목 장식·효과가 나오게 set_card_extras 가 두 값도 받는다.

alter table public.cosmetics drop constraint cosmetics_kind_check;
alter table public.cosmetics add constraint cosmetics_kind_check check (kind in ('accessory', 'variant', 'neck', 'effect'));
alter table public.cosmetic_items drop constraint cosmetic_items_kind_check;
alter table public.cosmetic_items add constraint cosmetic_items_kind_check check (kind in ('accessory', 'variant', 'neck', 'effect'));

insert into public.cosmetic_items (kind, item_id, rarity, gacha) values
  ('neck',   'bell',        'common',   true),
  ('neck',   'scarf',       'common',   true),
  ('neck',   'bowtie',      'uncommon', true),
  ('effect', 'sparkles',    'uncommon', true),
  ('effect', 'hearts',      'uncommon', true),
  ('neck',   'pearl',       'rare',     true),
  ('effect', 'notes',       'rare',     true),
  ('effect', 'snow',        'rare',     true),
  ('neck',   'starpendant', 'special',  true),
  ('neck',   'goldchain',   'legend',   true),
  ('effect', 'flameaura',   'legend',   true);

create or replace function public.set_card_extras(p_extras jsonb) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_uid     uuid := auth.uid();
  v         jsonb := coalesce(p_extras, '{}'::jsonb);
  v_today   date := (now() at time zone 'utc')::date;
  v_variant text;
  v_acc     text;
  v_neck    text;
  v_effect  text;
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
  v_neck := case when v ->> 'neck' in ('none', 'bell', 'scarf', 'bowtie', 'pearl', 'starpendant', 'goldchain') then v ->> 'neck' else 'none' end;
  v_effect := case when v ->> 'effect' in ('none', 'sparkles', 'hearts', 'notes', 'snow', 'flameaura') then v ->> 'effect' else 'none' end;
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
    'neck', v_neck,
    'effect', v_effect,
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

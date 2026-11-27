-- 0018: 전설 동물 3종 추가 (유니콘·구미호·그리핀)
--
-- 전설은 용까지 4종이 되어 종당 0.75%(등급 합계 3%는 그대로)다. 종 수가 7·3·6·6·4·5 라서 가중치를 정수로 맞추려면
-- 최소공배수가 420 이 되어, 모든 가중치를 0016·0017 의 두 배로 올린다(비율은 그대로).
--   일반 7 × 3000 · 고급 3 × 3360 · 희귀 6 × 1050 · 특별 6 × 490 · 전설 4 × 315 · 히든 5 × 84 = 42000 (등급 합계 비율은 0015 와 같다).
-- 천장(전설 확정)은 전설 4종 중에서 고른다. 프로필 카드용 허용 목록에도 3종을 넣는다(나머지는 0017 과 같다).

insert into public.species (id, name, rarity, gacha_weight) values
  ('unicorn', '유니콘', 'legend', 315),
  ('kumiho',  '구미호', 'legend', 315),
  ('griffin', '그리핀', 'legend', 315);
update public.species set gacha_weight = case rarity
    when 'common' then 3000 when 'uncommon' then 3360 when 'rare' then 1050
    when 'special' then 490 when 'legend' then 315 else 84 end;

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
                                           'chef', 'santa', 'headband', 'antenna', 'bunnyears', 'eyepatch', 'monocle', 'star')
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

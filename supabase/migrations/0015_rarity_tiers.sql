-- 0015: 동물 등급 6단계 (일반 < 고급 < 희귀 < 특별 < 전설 < 히든) 와 새 뽑기 규칙
--
-- 확률은 "등급 합계"를 정하고 같은 등급 안에서 종이 똑같이 나눈다(앱 src/shared/rarity.ts 의 GRADE_PERCENT).
--   일반 50% · 고급 24% · 희귀 15% · 특별 7% · 전설 3% · 히든 1%
-- gacha_weight 는 상대값이라, 종 수로 나눠 떨어지게(7·3·2·5 의 최소공배수 210 의 배수) 아래처럼 잡았다.
--   일반 7종 × 1500 = 10500 (50%) · 고급 3종 × 1680 = 5040 (24%) · 희귀 2종 × 1575 = 3150 (15%)
--   특별 2종 × 735 = 1470 (7%) · 전설 1종 × 630 (3%) · 히든 5종 × 42 = 210 (1%)   (합 21000)
-- 동물을 더 넣을 때는 이 값을 다시 계산해서 새 마이그레이션으로 고친다(시험이 앱 표와 비교한다).
--
-- 천장(pity): 전설이 안 나온 채 50번 뽑으면 다음 뽑기는 전설이 확정이다. 전설이나 히든이 나오면 0 으로 돌아간다.
-- 히든은 천장 없이 위의 낮은 확률로만 나온다. 용은 전설로 내려가고 나머지 사신수와 기린은 히든으로 남는다.

alter table public.species drop constraint species_rarity_check;
alter table public.species add constraint species_rarity_check
  check (rarity in ('common', 'uncommon', 'rare', 'special', 'legend', 'hidden'));

update public.species set rarity = 'common',   gacha_weight = 1500 where id in ('rabbit', 'cat', 'dog', 'turtle', 'chick', 'duck', 'fox');
update public.species set rarity = 'uncommon', gacha_weight = 1680 where id in ('hamster', 'bear', 'pig');
update public.species set rarity = 'rare',     gacha_weight = 1575 where id in ('owl', 'sheep');
update public.species set rarity = 'special',  gacha_weight = 735  where id in ('panda', 'penguin');
update public.species set rarity = 'legend',   gacha_weight = 630  where id = 'dragon';
update public.species set rarity = 'hidden',   gacha_weight = 42   where id in ('azure', 'whitetiger', 'tortoise', 'phoenix', 'qilin');

create or replace function public.gacha_pull() returns jsonb
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

revoke all on function public.gacha_pull() from public, anon, authenticated;
grant execute on function public.gacha_pull() to authenticated;

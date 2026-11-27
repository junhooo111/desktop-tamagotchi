-- 0009: 프로필 README 카드용 공개 데이터. (docs/server-roadmap.md 의 E 단계)
--
-- 카드(움직이는 SVG)는 Edge Function(card)이 그린다. 함수는 비밀키 없이 공개 키로 이 함수만 부른다.
-- 돌려주는 것: GitHub 이름, 장착한(없으면 경험치가 가장 높은) 펫의 종과 경험치, 도감 종 수. 그 밖의 것(이메일·재화·뽑기권)은 없다.
-- 랭킹에서 숨긴 사용자(show_in_ranking = false)는 카드도 만들지 않는다(같은 "공개 여부" 설정을 쓴다).
-- GitHub 이름은 유일하지 않을 수 있어서(이름을 바꾸면 다른 사람이 쓸 수 있다), 같은 이름이 여럿이면 가장 최근에 가입한 사람의 것을 쓴다.

create function public.public_card_data(p_login text) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  p       public.profiles;
  v_pet   record;
  v_count int;
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

  select t.species_id, t.xp into v_pet
    from public.pets t
   where t.owner_id = p.user_id
   order by (t.id = p.equipped_pet_id) desc, t.xp desc, t.created_at
   limit 1;

  select count(distinct t.species_id)::int into v_count from public.pets t where t.owner_id = p.user_id;

  return jsonb_build_object(
    'found', true,
    'github_login', p.github_login,
    'species_id', v_pet.species_id,
    'xp', v_pet.xp,
    'species_count', v_count
  );
end $$;

revoke all on function public.public_card_data(text) from public, anon, authenticated;
grant execute on function public.public_card_data(text) to anon, authenticated;

-- 0029: 동행하는 친구 펫이 친구가 꾸민 모습(색·장식·목 장식·효과)으로 보이게 companion_current 가 card_extras 를 함께 돌려준다.
-- card_extras 는 set_card_extras 가 걸러 저장한 값이라 안전하다(허용 목록에 있는 값만 있다).
drop function public.companion_current();
create function public.companion_current() returns table (
  friendship_id uuid, friend_id uuid, login text, species_id text, pet_xp int, friend_level int, extras jsonb
)
language plpgsql stable security definer set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'not_authenticated'; end if;
  return query
    select f.id, o.user_id, o.github_login, pet.species_id, pet.xp, public.friend_level(f.xp), o.card_extras
      from public.profiles me
      join public.profiles o on o.user_id = me.companion_friend
      join public.friendships f on f.status = 'accepted'
                               and f.user_lo = least(me.user_id, o.user_id) and f.user_hi = greatest(me.user_id, o.user_id)
      join lateral (
        select t.species_id, t.xp from public.pets t where t.owner_id = o.user_id
         order by (t.id = o.equipped_pet_id) desc, t.xp desc, t.created_at limit 1
      ) pet on true
     where me.user_id = v_uid;
end $$;
revoke all on function public.companion_current() from public, anon, authenticated;
grant execute on function public.companion_current() to authenticated;

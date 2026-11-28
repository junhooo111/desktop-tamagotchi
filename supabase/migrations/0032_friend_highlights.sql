-- 0032: 친구 소식. 친구가 전설·히든 동물이나 전설·히든 꾸미기를 새로 얻으면 내 펫이 알려 주도록,
-- p_since 이후에 친구(수락된 친구만)가 얻은 것을 최근 순으로 돌려준다(최대 10개).
-- 동물은 종 이름을 알려 주지 않는다(히든 이름은 비밀이라, 등급만 알린다). 꾸미기는 종류·이름이 공개 정보라 같이 돌려준다.
create function public.friend_highlights(p_since timestamptz) returns table (
  login text, kind text, item_id text, rarity text, at timestamptz
)
language plpgsql stable security definer set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'not_authenticated'; end if;
  return query
    select x.login, x.kind, x.item_id, x.rarity, x.at from (
      select o.github_login as login, 'pet'::text as kind, ''::text as item_id, s.rarity as rarity, p.created_at as at
        from public.friendships f
        join public.profiles o on o.user_id = case when f.user_lo = v_uid then f.user_hi else f.user_lo end
        join public.pets p on p.owner_id = o.user_id
        join public.species s on s.id = p.species_id
       where f.status = 'accepted' and v_uid in (f.user_lo, f.user_hi)
         and s.rarity in ('legend', 'hidden') and p.created_at > p_since
      union all
      select o.github_login, c.kind, c.item_id, i.rarity, c.created_at
        from public.friendships f
        join public.profiles o on o.user_id = case when f.user_lo = v_uid then f.user_hi else f.user_lo end
        join public.cosmetics c on c.user_id = o.user_id
        join public.cosmetic_items i on i.kind = c.kind and i.item_id = c.item_id
       where f.status = 'accepted' and v_uid in (f.user_lo, f.user_hi)
         and i.rarity in ('legend', 'hidden') and c.created_at > p_since
    ) x
    order by x.at desc
    limit 10;
end $$;

revoke all on function public.friend_highlights(timestamptz) from public, anon, authenticated;
grant execute on function public.friend_highlights(timestamptz) to authenticated;

-- 0012: 내 펫이 팔렸는지 알려 주기용 조회(앱이 주기적으로 물어서 펫이 말해 준다).
--
-- my_sales(p_since): 내가 올렸다가 p_since 이후에 팔린 글(싼 순이 아니라 팔린 순). 산 사람의 GitHub 이름·펫 종·레벨·가격만 돌려준다.
-- 본인 글만 보인다(판매자 = 나). 로그인한 사용자만 부를 수 있다.

create function public.my_sales(p_since timestamptz default now() - interval '30 days') returns table (
  listing_id uuid, price int, species_id text, species_name text, level int, buyer_login text, sold_at timestamptz
)
language plpgsql stable security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  return query
    select l.id, l.price, p.species_id, s.name, p.level, b.github_login, l.sold_at
      from public.listings l
      join public.pets p on p.id = l.pet_id
      join public.species s on s.id = p.species_id
      join public.profiles b on b.user_id = l.buyer_id
     where l.seller_id = auth.uid() and l.status = 'sold' and l.sold_at > coalesce(p_since, now() - interval '30 days')
     order by l.sold_at
     limit 50;
end $$;

revoke all on function public.my_sales(timestamptz) from public, anon, authenticated;
grant execute on function public.my_sales(timestamptz) to authenticated;

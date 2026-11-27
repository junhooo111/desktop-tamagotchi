-- 0008: 도감·랭킹. (docs/server-roadmap.md 의 D 단계)
--
-- 랭킹 점수는 **서버가 가진 데이터에서 서버가 계산한 값만** 쓴다(클라이언트가 보낸 숫자를 쓰지 않는다).
--   species  : 가진 동물 종 수(도감 달성 수, 최대 20)
--   hidden   : 가진 히든 동물 종 수(최대 6)
--   pets     : 가진 펫 수(개체)
--   level    : 가장 높은 펫 레벨
--   pulls    : 동물 뽑기 횟수(원장의 gacha)
--   cosmetics: 뽑기로 얻은 꾸미기 수
-- 업적·연속 출석은 앱이 올리는 값이라 서버가 검증하지 못해서 랭킹에 쓰지 않는다.
--
-- 공개 범위: GitHub 이름·아바타·점수만. 이메일·재화·뽑기권은 노출하지 않는다.
-- 사용자는 언제든 랭킹에서 빠질 수 있다(show_in_ranking). 빠져도 자기 점수는 my_summary 로 볼 수 있다.

alter table public.profiles add column show_in_ranking boolean not null default true;

-- 내부용: 모든 사용자의 점수. 클라이언트가 직접 부를 수 없다(아래 함수들이 걸러서 쓴다).
create function public.ranking_scores() returns table (
  user_id uuid, github_login text, avatar_url text, visible boolean,
  species int, hidden int, pets int, level int, pulls int, cosmetics int
)
language sql stable security definer set search_path = '' as $$
  select p.user_id, p.github_login, p.avatar_url, p.show_in_ranking,
         (select count(distinct t.species_id) from public.pets t where t.owner_id = p.user_id)::int,
         (select count(distinct t.species_id) from public.pets t join public.species s on s.id = t.species_id
           where t.owner_id = p.user_id and s.rarity = 'hidden')::int,
         (select count(*) from public.pets t where t.owner_id = p.user_id)::int,
         (select coalesce(max(t.level), 0) from public.pets t where t.owner_id = p.user_id)::int,
         (select count(*) from public.ledger l where l.user_id = p.user_id and l.reason = 'gacha')::int,
         (select count(*) from public.cosmetics c where c.user_id = p.user_id)::int
    from public.profiles p
$$;
revoke all on function public.ranking_scores() from public, anon, authenticated;

create function public.leaderboard(p_metric text, p_limit int default 20) returns table (rank int, github_login text, avatar_url text, value int, is_me boolean)
language plpgsql stable security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  if p_metric is null or p_metric not in ('species', 'hidden', 'pets', 'level', 'pulls', 'cosmetics') then raise exception 'invalid_metric'; end if;
  if p_limit is null or p_limit < 1 or p_limit > 50 then raise exception 'invalid_limit'; end if;
  return query
    with s as (
      select r.user_id, r.github_login, r.avatar_url,
             case p_metric when 'species' then r.species when 'hidden' then r.hidden when 'pets' then r.pets
                           when 'level' then r.level when 'pulls' then r.pulls else r.cosmetics end as v
        from public.ranking_scores() r
       where r.visible
    )
    select (rank() over (order by s.v desc))::int, s.github_login, s.avatar_url, s.v, s.user_id = auth.uid()
      from s
     where s.v > 0
     order by s.v desc, s.github_login
     limit p_limit;
end $$;

-- 내 점수와 순위(랭킹에서 빠져 있어도 점수는 보인다). 서버에 실제로 무엇이 저장돼 있는지 확인하는 용도로도 쓴다.
create function public.my_summary() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  v_uid  uuid := auth.uid();
  me     record;
  v_ranks jsonb := '{}'::jsonb;
  m      text;
  v_rank int;
  p      public.profiles;
begin
  if v_uid is null then raise exception 'not_authenticated'; end if;
  select * into p from public.profiles where user_id = v_uid;
  if not found then raise exception 'no_profile'; end if;
  select * into me from public.ranking_scores() where user_id = v_uid;

  foreach m in array array['species', 'hidden', 'pets', 'level', 'pulls', 'cosmetics'] loop
    if p.show_in_ranking then
      select count(*) + 1 into v_rank
        from public.ranking_scores() o
       where o.visible and o.user_id <> v_uid
         and (case m when 'species' then o.species when 'hidden' then o.hidden when 'pets' then o.pets
                     when 'level' then o.level when 'pulls' then o.pulls else o.cosmetics end)
           > (case m when 'species' then me.species when 'hidden' then me.hidden when 'pets' then me.pets
                     when 'level' then me.level when 'pulls' then me.pulls else me.cosmetics end);
      v_ranks := v_ranks || jsonb_build_object(m, v_rank);
    end if;
  end loop;

  return jsonb_build_object(
    'github_login', p.github_login,
    'show_in_ranking', p.show_in_ranking,
    'scores', jsonb_build_object('species', me.species, 'hidden', me.hidden, 'pets', me.pets, 'level', me.level, 'pulls', me.pulls, 'cosmetics', me.cosmetics),
    'ranks', v_ranks,
    'tickets', p.tickets,
    'coins', p.coins
  );
end $$;

create function public.set_ranking_visibility(p_visible boolean) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  if p_visible is null then raise exception 'invalid_visibility'; end if;
  update public.profiles set show_in_ranking = p_visible where user_id = auth.uid();
end $$;

revoke all on function public.leaderboard(text, int)         from public, anon, authenticated;
revoke all on function public.my_summary()                   from public, anon, authenticated;
revoke all on function public.set_ranking_visibility(boolean) from public, anon, authenticated;
grant execute on function public.leaderboard(text, int)          to authenticated;
grant execute on function public.my_summary()                    to authenticated;
grant execute on function public.set_ranking_visibility(boolean) to authenticated;

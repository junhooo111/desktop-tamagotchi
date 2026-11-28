-- 0030: 함께 다닌 시간. 동행 보너스를 받을 때마다(1시간에 1번) friendships.companion_ticks 가 오르고,
-- friends_list 가 companion_hours 로 돌려준다(친구 카드의 "함께 다닌 시간"과 업적에 쓴다).
alter table public.friendships add column companion_ticks int not null default 0 check (companion_ticks >= 0);

drop function public.friends_list();
create function public.friends_list() returns table (
  friendship_id uuid, friend_id uuid, login text, avatar_url text, status text, xp int, level int, next_xp int,
  since timestamptz, waved_today boolean, they_waved_today boolean, species_id text, pet_xp int, companion_hours int
)
language plpgsql stable security definer set search_path = '' as $$
declare
  v_uid   uuid := auth.uid();
  v_today date := (now() at time zone 'utc')::date;
begin
  if v_uid is null then raise exception 'not_authenticated'; end if;
  return query
    select f.id,
           o.user_id,
           o.github_login,
           o.avatar_url,
           case when f.status = 'accepted' then 'friend' when f.requested_by = v_uid then 'outgoing' else 'incoming' end,
           f.xp,
           public.friend_level(f.xp),
           public.friend_next_xp(f.xp),
           coalesce(f.accepted_at, f.created_at),
           coalesce((case when v_uid = f.user_lo then f.last_wave_lo else f.last_wave_hi end) = v_today, false),
           coalesce((case when v_uid = f.user_lo then f.last_wave_hi else f.last_wave_lo end) = v_today, false),
           pet.species_id,
           pet.xp,
           f.companion_ticks
      from public.friendships f
      join public.profiles o on o.user_id = case when f.user_lo = v_uid then f.user_hi else f.user_lo end
      left join lateral (
        select t.species_id, t.xp from public.pets t where t.owner_id = o.user_id
         order by (t.id = o.equipped_pet_id) desc, t.xp desc, t.created_at limit 1
      ) pet on f.status = 'accepted'
     where v_uid in (f.user_lo, f.user_hi)
     order by (f.status = 'accepted') desc, f.xp desc, o.github_login;
end $$;


create or replace function public.companion_tick() returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_uid    uuid := auth.uid();
  v_friend uuid;
  v_fs     uuid;
  v_bucket bigint := floor(extract(epoch from now()) / 3600)::bigint;
  v_day    timestamptz := date_trunc('day', now() at time zone 'utc') at time zone 'utc';
  v_today  int;
  v_rows   int;
  v_has    boolean;
  r        jsonb;
begin
  if v_uid is null then raise exception 'not_authenticated'; end if;
  select companion_friend into v_friend from public.profiles where user_id = v_uid;
  if v_friend is null then return jsonb_build_object('granted', false, 'pet_xp', 0); end if;

  select f.id into v_fs from public.friendships f
   where f.status = 'accepted' and f.user_lo = least(v_uid, v_friend) and f.user_hi = greatest(v_uid, v_friend);
  select exists (select 1 from public.pets where owner_id = v_friend) into v_has;
  if v_fs is null or not v_has then return jsonb_build_object('granted', false, 'pet_xp', 0); end if;

  select count(*) into v_today from public.companion_ticks where viewer_id = v_uid and created_at >= v_day;
  if v_today >= 6 then return jsonb_build_object('granted', false, 'pet_xp', 0, 'reason', 'daily_limit'); end if;

  insert into public.companion_ticks (viewer_id, bucket) values (v_uid, v_bucket) on conflict do nothing;
  get diagnostics v_rows = row_count;
  if v_rows = 0 then return jsonb_build_object('granted', false, 'pet_xp', 0, 'reason', 'already'); end if;

  r := public._friend_add_xp(v_fs, 'companion', v_uid::text || ':' || v_bucket::text, 3);
  update public.friendships set companion_ticks = companion_ticks + 1 where id = v_fs;
  insert into public.companion_pending (user_id, xp) values (v_friend, 6)
    on conflict (user_id) do update set xp = public.companion_pending.xp + 6;
  return jsonb_build_object('granted', true, 'pet_xp', 6, 'friendship_xp', coalesce((r ->> 'granted')::int, 0), 'level', r -> 'level', 'leveled_up', coalesce((r ->> 'leveled_up')::boolean, false));
end $$;


revoke all on function public.friends_list() from public, anon, authenticated;
grant execute on function public.friends_list() to authenticated;
revoke all on function public.companion_tick() from public, anon, authenticated;
grant execute on function public.companion_tick() to authenticated;

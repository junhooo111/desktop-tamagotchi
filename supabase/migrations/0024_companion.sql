-- 0024: 친구 펫 데리고 다니기(동행).
--
-- 친구 한 명을 골라 그 친구의 대표 펫을 내 펫 옆에 작게(절반 크기) 데리고 다닌다. 상대 동의는 필요 없다(내 화면에 보이는 것뿐이라서).
-- 같이 다니는 동안 한 시간마다 한 번 앱이 companion_tick 을 부르고, 서버가 보너스를 정한다(앱이 양을 보내지 못한다).
--   - 친밀도 +3 (한 쌍의 하루 상한 40 안에서만, 기존 _friend_add_xp 가 처리)
--   - 내 펫 경험치 +6, 친구 펫 경험치 +6 (친구 몫은 받을 때까지 쌓아 두었다가 친구 앱이 companion_claim 으로 가져간다)
--   - 하루(UTC) 최대 6번 → 한 사람이 하루에 얻는 펫 경험치는 36까지, 친밀도는 18까지다.
-- 친구 몫을 쌓는 양에도 같은 하루 상한이 걸리므로(내가 6번까지만 틱을 낼 수 있다), 계정 여러 개로 한 펫에 경험치를 몰아 줘도 한 계정당 하루 36이다.

alter table public.friend_events drop constraint friend_events_kind_check;
alter table public.friend_events add constraint friend_events_kind_check check (kind in ('wave', 'trade', 'gift', 'gift_cosmetic', 'companion'));

alter table public.profiles add column companion_friend uuid references public.profiles (user_id) on delete set null;

create table public.companion_ticks (
  viewer_id  uuid   not null references public.profiles (user_id) on delete cascade,
  bucket     bigint not null,
  created_at timestamptz not null default now(),
  primary key (viewer_id, bucket)
);
alter table public.companion_ticks enable row level security;
revoke all on public.companion_ticks from public, anon, authenticated;

create table public.companion_pending (
  user_id uuid primary key references public.profiles (user_id) on delete cascade,
  xp      int  not null default 0 check (xp >= 0)
);
alter table public.companion_pending enable row level security;
revoke all on public.companion_pending from public, anon, authenticated;

-- 동행할 친구를 고른다(p_friendship 이 null 이면 그만둔다). 수락된 친구만 고를 수 있다.
create function public.set_companion(p_friendship uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
  f     public.friendships;
begin
  if v_uid is null then raise exception 'not_authenticated'; end if;
  if p_friendship is null then
    update public.profiles set companion_friend = null where user_id = v_uid;
    return;
  end if;
  select * into f from public.friendships where id = p_friendship and v_uid in (user_lo, user_hi) and status = 'accepted';
  if not found then raise exception 'not_found'; end if;
  update public.profiles set companion_friend = case when f.user_lo = v_uid then f.user_hi else f.user_lo end where user_id = v_uid;
end $$;

-- 지금 데리고 다니는 친구와 그 친구의 대표 펫(없으면 0행). 친구 관계가 끊겼으면 0행.
create function public.companion_current() returns table (
  friendship_id uuid, friend_id uuid, login text, species_id text, pet_xp int, friend_level int
)
language plpgsql stable security definer set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'not_authenticated'; end if;
  return query
    select f.id, o.user_id, o.github_login, pet.species_id, pet.xp, public.friend_level(f.xp)
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

-- 한 시간에 한 번: 동행 보너스. 이미 받은 시간대이거나 오늘 6번을 넘겼으면 granted 0.
create function public.companion_tick() returns jsonb
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
  insert into public.companion_pending (user_id, xp) values (v_friend, 6)
    on conflict (user_id) do update set xp = public.companion_pending.xp + 6;
  return jsonb_build_object('granted', true, 'pet_xp', 6, 'friendship_xp', coalesce((r ->> 'granted')::int, 0), 'level', r -> 'level', 'leveled_up', coalesce((r ->> 'leveled_up')::boolean, false));
end $$;

-- 친구가 나를 데리고 다닌 덕에 쌓인 내 펫 경험치를 가져간다(가져가면 비운다).
create function public.companion_claim() returns int
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
  v_xp  int;
begin
  if v_uid is null then raise exception 'not_authenticated'; end if;
  delete from public.companion_pending where user_id = v_uid returning xp into v_xp;
  return coalesce(v_xp, 0);
end $$;

revoke all on function public.set_companion(uuid)    from public, anon, authenticated;
revoke all on function public.companion_current()    from public, anon, authenticated;
revoke all on function public.companion_tick()       from public, anon, authenticated;
revoke all on function public.companion_claim()      from public, anon, authenticated;
grant execute on function public.set_companion(uuid) to authenticated;
grant execute on function public.companion_current() to authenticated;
grant execute on function public.companion_tick()    to authenticated;
grant execute on function public.companion_claim()   to authenticated;

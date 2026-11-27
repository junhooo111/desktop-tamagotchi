-- 0014: 친구 + 친밀도(친구 레벨). (docs/server-roadmap.md 의 친구 기능)
--
-- 친구 추가: GitHub 아이디로 요청 → 상대가 수락해야 친구가 된다(모르는 사람이 마음대로 친구가 될 수 없다).
-- 친밀도(xp)는 세 가지로 쌓인다(모두 서버가 정한다, 앱이 양을 보내지 못한다):
--   인사하기(friend_wave)  하루 한 번씩 각자. 기본 3, 친구가 된 지 30일마다 +1(최대 +3), 같은 날 둘 다 하면 서로 +2 보너스
--   경매장 거래            친구끼리 사고팔면 거래당 10 (판매가 이뤄지는 순간 트리거가 처리)
--   선물(friend_gift_ticket) 뽑기권 1장을 친구에게(하루 한 친구에게 한 번, 하루 세 번까지) 5
-- 레벨(1~10)이 오르면 두 사람 모두 뽑기권을 받는다(레벨마다 한 번). 한 사람이 친구 보상으로 받을 수 있는 뽑기권은 평생 100장까지다
-- (계정을 여러 개 만들어 서로 친구를 맺어 뽑기권을 불리는 것을 막는다). 한 쌍이 하루에 올릴 수 있는 친밀도는 40까지다.

alter table public.ledger drop constraint ledger_reason_check;
alter table public.ledger add constraint ledger_reason_check
  check (reason in ('welcome', 'learn', 'gacha', 'gacha_cosmetic', 'trade_buy', 'trade_sell', 'evolve', 'daily', 'import',
                    'uptime', 'care', 'level', 'gift', 'update', 'care_coin', 'achievement', 'github', 'friend_reward', 'friend_gift'));

create table public.friendships (
  id           uuid primary key default gen_random_uuid(),
  user_lo      uuid not null references public.profiles (user_id) on delete cascade,
  user_hi      uuid not null references public.profiles (user_id) on delete cascade,
  requested_by uuid not null references public.profiles (user_id) on delete cascade,
  status       text not null default 'pending' check (status in ('pending', 'accepted')),
  xp           int  not null default 0 check (xp >= 0),
  created_at   timestamptz not null default now(),
  accepted_at  timestamptz,
  last_wave_lo date,
  last_wave_hi date,
  check (user_lo < user_hi),
  check (requested_by in (user_lo, user_hi)),
  check ((status = 'accepted') = (accepted_at is not null)),
  unique (user_lo, user_hi)
);
create index friendships_hi_idx on public.friendships (user_hi);
alter table public.friendships enable row level security;
revoke all on public.friendships from public, anon, authenticated;

-- 친밀도 이벤트(멱등키): 같은 (친구 관계, 종류, 열쇠)는 한 번만 인정한다.
create table public.friend_events (
  id            bigint generated always as identity primary key,
  friendship_id uuid not null references public.friendships (id) on delete cascade,
  kind          text not null check (kind in ('wave', 'trade', 'gift')),
  key           text not null check (char_length(key) between 1 and 80),
  xp            int  not null check (xp > 0),
  created_at    timestamptz not null default now(),
  unique (friendship_id, kind, key)
);
create index friend_events_day_idx on public.friend_events (friendship_id, created_at);
alter table public.friend_events enable row level security;
revoke all on public.friend_events from public, anon, authenticated;

-- 레벨 보상을 이미 준 기록(레벨마다 한 번)
create table public.friend_rewards (
  friendship_id uuid not null references public.friendships (id) on delete cascade,
  level         int  not null check (level between 2 and 10),
  primary key (friendship_id, level)
);
alter table public.friend_rewards enable row level security;
revoke all on public.friend_rewards from public, anon, authenticated;

-- ---------------------------------------------------------------
-- 레벨 규칙(10단계): 필요한 친밀도 0·20·60·120·200·320·480·700·1000·1400, 레벨마다 받는 뽑기권 0·1·1·2·2·2·3·3·4·5
-- ---------------------------------------------------------------
create function public.friend_level(p_xp int) returns int
language sql immutable set search_path = '' as $$
  select count(*)::int from unnest(array[0, 20, 60, 120, 200, 320, 480, 700, 1000, 1400]) t where t <= coalesce(p_xp, 0)
$$;

create function public.friend_next_xp(p_xp int) returns int
language sql immutable set search_path = '' as $$
  select min(t)::int from unnest(array[0, 20, 60, 120, 200, 320, 480, 700, 1000, 1400]) t where t > coalesce(p_xp, 0)
$$;

create function public.friend_reward_tickets(p_level int) returns int
language sql immutable set search_path = '' as $$
  select (array[0, 0, 1, 1, 2, 2, 2, 3, 3, 4, 5])[p_level + 1]
$$;

-- ---------------------------------------------------------------
-- (내부) 친밀도를 더한다. 멱등·하루 상한·레벨 보상까지 한 곳에서 처리한다. 다른 함수만 부른다(아무도 직접 못 부른다).
-- ---------------------------------------------------------------
create function public._friend_add_xp(p_friendship uuid, p_kind text, p_key text, p_xp int) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  f         public.friendships;
  v_day     timestamptz := date_trunc('day', now() at time zone 'utc') at time zone 'utc';
  v_used    int;
  v_grant   int;
  v_rows    int;
  v_old     int;
  v_new     int;
  v_lvl     int;
  v_tickets int;
  v_given   int;
  v_uid     uuid;
  v_total   int := 0;
  v_xp_now  int;
begin
  select * into f from public.friendships where id = p_friendship for update;
  if not found or f.status <> 'accepted' then return jsonb_build_object('granted', 0, 'level', 1); end if;

  select coalesce(sum(xp), 0) into v_used from public.friend_events where friendship_id = f.id and created_at >= v_day;
  v_grant := greatest(0, least(p_xp, 40 - v_used));
  if v_grant > 0 then
    insert into public.friend_events (friendship_id, kind, key, xp) values (f.id, p_kind, p_key, v_grant) on conflict do nothing;
    get diagnostics v_rows = row_count;
    if v_rows = 0 then v_grant := 0; end if;
  end if;

  v_old := public.friend_level(f.xp);
  if v_grant > 0 then
    update public.friendships set xp = xp + v_grant where id = f.id returning xp into v_xp_now;
  else
    v_xp_now := f.xp;
  end if;
  v_new := public.friend_level(v_xp_now);

  -- 레벨이 오른 만큼(여러 단계도 가능) 보상을 한 번씩 준다
  for v_lvl in v_old + 1 .. v_new loop
    insert into public.friend_rewards (friendship_id, level) values (f.id, v_lvl) on conflict do nothing;
    get diagnostics v_rows = row_count;
    continue when v_rows = 0;
    v_tickets := public.friend_reward_tickets(v_lvl);
    for v_uid in select unnest(array[f.user_lo, f.user_hi]) loop
      select coalesce(sum(delta), 0) into v_given from public.ledger where user_id = v_uid and reason = 'friend_reward';
      if v_tickets > 0 and v_given < 100 then
        update public.profiles set tickets = tickets + least(v_tickets, 100 - v_given) where user_id = v_uid;
        insert into public.ledger (user_id, delta, reason, currency) values (v_uid, least(v_tickets, 100 - v_given), 'friend_reward', 'ticket');
        v_total := v_total + least(v_tickets, 100 - v_given);
      end if;
    end loop;
  end loop;

  return jsonb_build_object('granted', v_grant, 'level', v_new, 'leveled_up', v_new > v_old, 'tickets_each', public.friend_reward_tickets(v_new));
end $$;

-- ---------------------------------------------------------------
-- 친구 요청·수락·삭제
-- ---------------------------------------------------------------
create function public.friend_request(p_login text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_uid    uuid := auth.uid();
  v_target uuid;
  v_lo     uuid;
  v_hi     uuid;
  f        public.friendships;
  v_total  int;
  v_out    int;
begin
  if v_uid is null then raise exception 'not_authenticated'; end if;
  if p_login is null or p_login !~ '^[A-Za-z0-9-]{1,39}$' then raise exception 'not_found'; end if;

  select user_id into v_target from public.profiles where lower(github_login) = lower(p_login) order by created_at desc limit 1;
  if v_target is null then raise exception 'not_found'; end if;
  if v_target = v_uid then raise exception 'self'; end if;

  v_lo := least(v_uid, v_target);
  v_hi := greatest(v_uid, v_target);
  select * into f from public.friendships where user_lo = v_lo and user_hi = v_hi for update;
  if found then
    if f.status = 'accepted' then raise exception 'already_friends'; end if;
    if f.requested_by = v_uid then raise exception 'already_requested'; end if;
    -- 상대가 이미 나에게 요청해 둔 상태면 서로 원한 것이니 바로 친구가 된다
    update public.friendships set status = 'accepted', accepted_at = now() where id = f.id;
    return jsonb_build_object('friendship_id', f.id, 'status', 'friend');
  end if;

  select count(*), count(*) filter (where status = 'pending' and requested_by = v_uid) into v_total, v_out
    from public.friendships where v_uid in (user_lo, user_hi);
  if v_total >= 100 or v_out >= 20 then raise exception 'too_many'; end if;

  insert into public.friendships (user_lo, user_hi, requested_by) values (v_lo, v_hi, v_uid) returning * into f;
  return jsonb_build_object('friendship_id', f.id, 'status', 'outgoing');
end $$;

create function public.friend_respond(p_friendship uuid, p_accept boolean) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
  f     public.friendships;
begin
  if v_uid is null then raise exception 'not_authenticated'; end if;
  select * into f from public.friendships where id = p_friendship and v_uid in (user_lo, user_hi) for update;
  if not found or f.status <> 'pending' or f.requested_by = v_uid then raise exception 'not_found'; end if;
  if p_accept then
    update public.friendships set status = 'accepted', accepted_at = now() where id = f.id;
  else
    delete from public.friendships where id = f.id;
  end if;
end $$;

-- 요청 취소·거절·친구 끊기(둘 중 누구나)
create function public.friend_remove(p_friendship uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'not_authenticated'; end if;
  delete from public.friendships where id = p_friendship and v_uid in (user_lo, user_hi);
  if not found then raise exception 'not_found'; end if;
end $$;

-- ---------------------------------------------------------------
-- 목록: 친구(레벨·오늘 인사 여부·펫), 받은 요청, 보낸 요청
-- ---------------------------------------------------------------
create function public.friends_list() returns table (
  friendship_id uuid, friend_id uuid, login text, avatar_url text, status text, xp int, level int, next_xp int,
  since timestamptz, waved_today boolean, they_waved_today boolean, species_id text, pet_xp int
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
           pet.xp
      from public.friendships f
      join public.profiles o on o.user_id = case when f.user_lo = v_uid then f.user_hi else f.user_lo end
      left join lateral (
        select t.species_id, t.xp from public.pets t where t.owner_id = o.user_id
         order by (t.id = o.equipped_pet_id) desc, t.xp desc, t.created_at limit 1
      ) pet on f.status = 'accepted'
     where v_uid in (f.user_lo, f.user_hi)
     order by (f.status = 'accepted') desc, f.xp desc, o.github_login;
end $$;

-- ---------------------------------------------------------------
-- 인사하기: 하루(UTC) 한 번씩 각자. 기본 3 + 오래된 친구 보너스(30일마다 +1, 최대 +3) + 같은 날 둘 다 하면 서로 +2
-- ---------------------------------------------------------------
create function public.friend_wave(p_friendship uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_uid   uuid := auth.uid();
  v_today date := (now() at time zone 'utc')::date;
  f       public.friendships;
  v_mine  date;
  v_theirs date;
  v_xp    int;
  v_mutual boolean;
  r       jsonb;
begin
  if v_uid is null then raise exception 'not_authenticated'; end if;
  select * into f from public.friendships where id = p_friendship and v_uid in (user_lo, user_hi) for update;
  if not found or f.status <> 'accepted' then raise exception 'not_found'; end if;

  v_mine := case when v_uid = f.user_lo then f.last_wave_lo else f.last_wave_hi end;
  v_theirs := case when v_uid = f.user_lo then f.last_wave_hi else f.last_wave_lo end;
  if v_mine = v_today then raise exception 'already_waved'; end if;

  if v_uid = f.user_lo then
    update public.friendships set last_wave_lo = v_today where id = f.id;
  else
    update public.friendships set last_wave_hi = v_today where id = f.id;
  end if;

  v_mutual := coalesce(v_theirs = v_today, false);
  v_xp := 3 + least(3, floor((v_today - f.accepted_at::date) / 30.0)::int) + case when v_mutual then 2 else 0 end;
  r := public._friend_add_xp(f.id, 'wave', v_today::text || ':' || v_uid::text, v_xp);
  return r || jsonb_build_object('mutual', v_mutual, 'xp_total', (select xp from public.friendships where id = f.id));
end $$;

-- ---------------------------------------------------------------
-- 뽑기권 선물: 친구에게 1장. 하루 한 친구에게 한 번, 하루 전체 세 번까지. 친밀도 +5
-- ---------------------------------------------------------------
create function public.friend_gift_ticket(p_friendship uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_uid     uuid := auth.uid();
  v_day     timestamptz := date_trunc('day', now() at time zone 'utc') at time zone 'utc';
  v_today   text := (now() at time zone 'utc')::date::text;
  f         public.friendships;
  v_other   uuid;
  v_sent    int;
  v_tickets int;
  r         jsonb;
begin
  if v_uid is null then raise exception 'not_authenticated'; end if;
  select * into f from public.friendships where id = p_friendship and v_uid in (user_lo, user_hi) for update;
  if not found or f.status <> 'accepted' then raise exception 'not_found'; end if;
  v_other := case when f.user_lo = v_uid then f.user_hi else f.user_lo end;

  if exists (select 1 from public.friend_events where friendship_id = f.id and kind = 'gift' and key = v_today || ':' || v_uid::text) then
    raise exception 'already_gifted';
  end if;
  select count(*) into v_sent from public.ledger where user_id = v_uid and reason = 'friend_gift' and delta < 0 and created_at >= v_day;
  if v_sent >= 3 then raise exception 'gift_limit'; end if;

  -- 두 지갑을 번호 순서로 잠가서 서로 동시에 선물해도 교착하지 않게 한다
  perform 1 from public.profiles where user_id in (v_uid, v_other) order by user_id for update;
  select tickets into v_tickets from public.profiles where user_id = v_uid;
  if v_tickets < 1 then raise exception 'insufficient_tickets'; end if;

  update public.profiles set tickets = tickets - 1 where user_id = v_uid;
  update public.profiles set tickets = tickets + 1 where user_id = v_other;
  insert into public.ledger (user_id, delta, reason, currency) values (v_uid, -1, 'friend_gift', 'ticket'), (v_other, 1, 'friend_gift', 'ticket');

  r := public._friend_add_xp(f.id, 'gift', v_today || ':' || v_uid::text, 5);
  return r || jsonb_build_object('tickets', v_tickets - 1);
end $$;

-- ---------------------------------------------------------------
-- 경매장 거래: 친구끼리 거래가 이뤄지면 친밀도 +10 (판매가 'sold' 가 되는 순간)
-- ---------------------------------------------------------------
create function public._friend_trade_xp() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_id uuid;
begin
  if new.status = 'sold' and old.status = 'active' and new.buyer_id is not null then
    select id into v_id from public.friendships
     where user_lo = least(new.seller_id, new.buyer_id) and user_hi = greatest(new.seller_id, new.buyer_id) and status = 'accepted';
    if v_id is not null then perform public._friend_add_xp(v_id, 'trade', new.id::text, 10); end if;
  end if;
  return new;
end $$;
create trigger listings_friend_xp after update of status on public.listings
  for each row execute function public._friend_trade_xp();

-- ---------------------------------------------------------------
-- 실행 권한: 앱이 부르는 함수만 로그인한 사용자에게. 내부 함수는 아무도 못 부른다.
-- ---------------------------------------------------------------
revoke all on function public.friend_level(int)                      from public, anon, authenticated;
revoke all on function public.friend_next_xp(int)                    from public, anon, authenticated;
revoke all on function public.friend_reward_tickets(int)             from public, anon, authenticated;
revoke all on function public._friend_add_xp(uuid, text, text, int)  from public, anon, authenticated;
revoke all on function public._friend_trade_xp()                     from public, anon, authenticated;
revoke all on function public.friend_request(text)                   from public, anon, authenticated;
revoke all on function public.friend_respond(uuid, boolean)          from public, anon, authenticated;
revoke all on function public.friend_remove(uuid)                    from public, anon, authenticated;
revoke all on function public.friends_list()                         from public, anon, authenticated;
revoke all on function public.friend_wave(uuid)                      from public, anon, authenticated;
revoke all on function public.friend_gift_ticket(uuid)               from public, anon, authenticated;
grant execute on function public.friend_request(text)         to authenticated;
grant execute on function public.friend_respond(uuid, boolean) to authenticated;
grant execute on function public.friend_remove(uuid)          to authenticated;
grant execute on function public.friends_list()               to authenticated;
grant execute on function public.friend_wave(uuid)            to authenticated;
grant execute on function public.friend_gift_ticket(uuid)     to authenticated;

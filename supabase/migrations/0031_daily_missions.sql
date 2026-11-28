-- 0031: 일일 미션. 하루(UTC) 네 가지를 모두 채우면 뽑기권을 받고, 연속으로 채울수록 보너스가 붙는다.
--   쓰다듬기 3번 · 돌봄(먹이·놀기·씻기·산책) 5번 · FE 지식 1개 읽기 · 친구와 함께(인사·선물·동행) 1번
--   보상: 뽑기권 1장, 연속 3일째 +1, 7일째 +2, 14일부터 7일마다 +3. 하루에 한 번만 받는다.
-- 진행 횟수는 앱이 보고한다(위조는 못 막지만 하루 보상이 한 번이라 피해가 작다). 상한과 보상 양은 서버가 정한다.

alter table public.ledger drop constraint ledger_reason_check;
alter table public.ledger add constraint ledger_reason_check
  check (reason in ('welcome', 'learn', 'gacha', 'gacha_cosmetic', 'trade_buy', 'trade_sell', 'evolve', 'daily', 'import',
                    'uptime', 'care', 'level', 'gift', 'update', 'care_coin', 'achievement', 'github', 'friend_reward', 'friend_gift', 'mission'));

alter table public.profiles add column mission_streak int not null default 0 check (mission_streak >= 0);
alter table public.profiles add column mission_last date;

create table public.daily_missions (
  user_id   uuid not null references public.profiles (user_id) on delete cascade,
  day       date not null,
  pet       int  not null default 0,
  care      int  not null default 0,
  learn     int  not null default 0,
  social    int  not null default 0,
  completed boolean not null default false,
  primary key (user_id, day)
);
alter table public.daily_missions enable row level security;
revoke all on public.daily_missions from public, anon, authenticated;

create function public._mission_json(m public.daily_missions, p_streak int, p_reward int) returns jsonb
language sql immutable set search_path = '' as $$
  select jsonb_build_object(
    'pet', m.pet, 'care', m.care, 'learn', m.learn, 'social', m.social,
    'goals', jsonb_build_object('pet', 3, 'care', 5, 'learn', 1, 'social', 1),
    'completed', m.completed, 'streak', p_streak, 'reward', p_reward)
$$;

-- 오늘의 미션 현황(없으면 0 으로)
create function public.mission_state() returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_uid    uuid := auth.uid();
  v_today  date := (now() at time zone 'utc')::date;
  m        public.daily_missions;
  v_streak int;
  v_last   date;
begin
  if v_uid is null then raise exception 'not_authenticated'; end if;
  select * into m from public.daily_missions where user_id = v_uid and day = v_today;
  if not found then m := (v_uid, v_today, 0, 0, 0, 0, false); end if;
  select mission_streak, mission_last into v_streak, v_last from public.profiles where user_id = v_uid;
  -- 어제도 못 채웠으면 연속이 끊긴 것으로 보여 준다
  if v_last is null or v_last < v_today - 1 then v_streak := 0; end if;
  return public._mission_json(m, v_streak, 0);
end $$;

-- 진행을 한 번 올린다(kind: pet | care | learn | social). 모두 채우면 그 자리에서 보상을 준다.
create function public.mission_report(p_kind text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_uid    uuid := auth.uid();
  v_today  date := (now() at time zone 'utc')::date;
  m        public.daily_missions;
  v_streak int;
  v_last   date;
  v_reward int := 0;
begin
  if v_uid is null then raise exception 'not_authenticated'; end if;
  if p_kind not in ('pet', 'care', 'learn', 'social') then raise exception 'invalid_kind'; end if;

  insert into public.daily_missions (user_id, day) values (v_uid, v_today) on conflict do nothing;
  select * into m from public.daily_missions where user_id = v_uid and day = v_today for update;

  update public.daily_missions set
    pet    = case when p_kind = 'pet'    then least(3, pet + 1)    else pet end,
    care   = case when p_kind = 'care'   then least(5, care + 1)   else care end,
    learn  = case when p_kind = 'learn'  then least(1, learn + 1)  else learn end,
    social = case when p_kind = 'social' then least(1, social + 1) else social end
   where user_id = v_uid and day = v_today
   returning * into m;

  select mission_streak, mission_last into v_streak, v_last from public.profiles where user_id = v_uid for update;
  if v_last is null or v_last < v_today - 1 then v_streak := 0; end if;

  if not m.completed and m.pet >= 3 and m.care >= 5 and m.learn >= 1 and m.social >= 1 then
    v_streak := v_streak + 1;
    v_reward := 1 + case when v_streak = 3 then 1 when v_streak = 7 then 2 when v_streak >= 14 and v_streak % 7 = 0 then 3 else 0 end;
    update public.daily_missions set completed = true where user_id = v_uid and day = v_today returning * into m;
    update public.profiles set tickets = tickets + v_reward, mission_streak = v_streak, mission_last = v_today where user_id = v_uid;
    insert into public.ledger (user_id, delta, reason, currency) values (v_uid, v_reward, 'mission', 'ticket');
  end if;
  return public._mission_json(m, v_streak, v_reward);
end $$;

revoke all on function public._mission_json(public.daily_missions, int, int) from public, anon, authenticated;
revoke all on function public.mission_state()          from public, anon, authenticated;
revoke all on function public.mission_report(text)     from public, anon, authenticated;
grant execute on function public.mission_state()       to authenticated;
grant execute on function public.mission_report(text)  to authenticated;

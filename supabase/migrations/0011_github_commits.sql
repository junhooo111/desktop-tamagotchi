-- 0011: GitHub 기여(커밋 등) → 게임머니 (로드맵 G 단계).
--
-- 기여 수는 서버의 Edge Function(commits)이 GitHub API 로 읽어서 이 함수에 넘긴다. 앱은 수를 보내지 못한다
-- (이 함수는 service_role 만 부를 수 있다). 규칙: 기여 1건 = 2 게임머니, 하루 최대 40.
-- 같은 날을 다시 읽어도 이미 준 만큼은 빼고 모자란 만큼만 더 준다(멱등). 최근 3일(UTC)만 인정한다.

alter table public.ledger drop constraint ledger_reason_check;
alter table public.ledger add constraint ledger_reason_check
  check (reason in ('welcome', 'learn', 'gacha', 'gacha_cosmetic', 'trade_buy', 'trade_sell', 'evolve', 'daily', 'import',
                    'uptime', 'care', 'level', 'gift', 'update', 'care_coin', 'achievement', 'github'));

create table public.commit_days (
  user_id    uuid not null references public.profiles (user_id) on delete cascade,
  day        date not null,
  counted    int  not null check (counted >= 0),
  granted    int  not null check (granted >= 0),
  updated_at timestamptz not null default now(),
  primary key (user_id, day)
);
alter table public.commit_days enable row level security;
revoke all on public.commit_days from public, anon, authenticated;

-- 내가 오늘까지 받은 기여 보상(앱이 보여 주는 용도)
create function public.my_commit_days() returns table (day date, counted int, granted int)
language plpgsql stable security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  return query select c.day, c.counted, c.granted from public.commit_days c
    where c.user_id = auth.uid() order by c.day desc limit 7;
end $$;

-- p_days: [{"day":"2026-11-27","count":12}, ...]
create function public.grant_commit_coins(p_user uuid, p_days jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_today date := (now() at time zone 'utc')::date;
  v_item  jsonb;
  v_day   date;
  v_count int;
  v_want  int;
  v_have  int;
  v_add   int;
  v_total int := 0;
  v_coins int;
begin
  if p_user is null or p_days is null or jsonb_typeof(p_days) <> 'array' or jsonb_array_length(p_days) > 7 then
    raise exception 'invalid_days';
  end if;
  perform 1 from public.profiles where user_id = p_user for update;
  if not found then raise exception 'no_profile'; end if;

  for v_item in select * from jsonb_array_elements(p_days) loop
    begin
      v_day := (v_item ->> 'day')::date;
      v_count := (v_item ->> 'count')::int;
    exception when others then
      raise exception 'invalid_days';
    end;
    if v_day is null or v_count is null or v_count < 0 or v_count > 100000 then raise exception 'invalid_days'; end if;
    continue when v_day > v_today or v_day < v_today - 2;

    v_want := least(v_count * 2, 40);
    select granted into v_have from public.commit_days where user_id = p_user and day = v_day;
    v_have := coalesce(v_have, 0);
    v_add := greatest(0, v_want - v_have);

    insert into public.commit_days (user_id, day, counted, granted) values (p_user, v_day, v_count, v_have + v_add)
      on conflict (user_id, day) do update
        set counted = greatest(public.commit_days.counted, excluded.counted), granted = excluded.granted, updated_at = now();
    if v_add > 0 then
      update public.profiles set coins = coins + v_add where user_id = p_user;
      insert into public.ledger (user_id, delta, reason, currency) values (p_user, v_add, 'github', 'coin');
      v_total := v_total + v_add;
    end if;
  end loop;

  select coins into v_coins from public.profiles where user_id = p_user;
  return jsonb_build_object('granted', v_total, 'coins', v_coins);
end $$;

revoke all on function public.my_commit_days()                 from public, anon, authenticated;
revoke all on function public.grant_commit_coins(uuid, jsonb)  from public, anon, authenticated;
grant execute on function public.my_commit_days() to authenticated;
grant execute on function public.grant_commit_coins(uuid, jsonb) to service_role;

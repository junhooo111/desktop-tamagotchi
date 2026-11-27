-- 0007: 뽑기권 획득을 서버가 받는다. (docs/server-roadmap.md 의 C 단계 — 로그인하면 서버가 기준)
--
-- 앱은 "무슨 일이 있었는지"(kind)와 한 번만 쓰는 열쇠(key)를 보내고, 양과 하루 상한은 서버가 정한다.
--   uptime : 앱을 켜 둔 시간 보상.   하루 1장.            (앱: UPTIME_TICKETS_PER_DAY = 1)
--   care   : 돌봄 25회마다 1장.      하루 8장.            (앱: CARE_PER_TICKET = 25, 하루 200회까지 인정)
--   level  : 레벨 보상(3·5·8·10…).   하루 6장, 한 번에 1~2장. (앱: ticketsForLevel)
--   gift   : 선물 상자의 뽑기권.     하루 3장.            (앱: GIFTS_PER_DAY = 3)
--   update : 업데이트 선물 2장.      key(버전)마다 한 번. (앱: UPDATE_GIFT_TICKETS = 2)
-- 같은 (kind, key) 는 한 번만 인정한다(멱등). 출석은 claim_daily_ticket 이 따로 맡는다.
-- 한계: "돌봄을 한 척" 같은 위조는 못 막는다. 상한으로 하루 피해를 제한할 뿐이다(현금성이 없다).

alter table public.ledger drop constraint ledger_reason_check;
alter table public.ledger add constraint ledger_reason_check
  check (reason in ('welcome', 'learn', 'gacha', 'gacha_cosmetic', 'trade_buy', 'trade_sell', 'evolve', 'daily', 'import',
                    'uptime', 'care', 'level', 'gift', 'update'));

create table public.ticket_grants (
  user_id     uuid not null references public.profiles (user_id) on delete cascade,
  kind        text not null check (kind in ('uptime', 'care', 'level', 'gift', 'update')),
  key         text not null check (char_length(key) between 1 and 64),
  amount      int  not null check (amount > 0),
  created_at  timestamptz not null default now(),
  primary key (user_id, kind, key)
);
alter table public.ticket_grants enable row level security;
revoke all on public.ticket_grants from public, anon, authenticated;
create index ticket_grants_day_idx on public.ticket_grants (user_id, kind, created_at);

create function public.grant_tickets(p_kind text, p_amount int, p_key text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_uid       uuid := auth.uid();
  v_day_start timestamptz := date_trunc('day', now() at time zone 'utc') at time zone 'utc';
  v_day_cap   int;
  v_max_each  int;
  v_used      int;
  v_grant     int;
  v_rows      int;
  v_tickets   int;
begin
  if v_uid is null then raise exception 'not_authenticated'; end if;
  if p_kind is null or p_key is null or char_length(p_key) not between 1 and 64 then raise exception 'invalid_grant'; end if;
  if p_amount is null or p_amount < 1 then raise exception 'invalid_grant'; end if;

  select cap, each into v_day_cap, v_max_each
    from (values ('uptime', 1, 1), ('care', 8, 1), ('level', 6, 2), ('gift', 3, 1), ('update', null, 2)) as t(kind, cap, each)
   where t.kind = p_kind;
  if not found then raise exception 'invalid_grant'; end if;
  if p_amount > v_max_each then raise exception 'invalid_grant'; end if;

  -- 같은 사람의 동시 호출을 한 줄로 세워서 하루 상한 계산이 어긋나지 않게 한다.
  perform 1 from public.profiles where user_id = v_uid for update;
  if not found then raise exception 'no_profile'; end if;

  select coalesce(sum(amount), 0) into v_used
    from public.ticket_grants where user_id = v_uid and kind = p_kind and created_at >= v_day_start;

  v_grant := case when v_day_cap is null then p_amount else greatest(0, least(p_amount, v_day_cap - v_used)) end;

  if v_grant > 0 then
    insert into public.ticket_grants (user_id, kind, key, amount) values (v_uid, p_kind, p_key, v_grant)
      on conflict do nothing;
    get diagnostics v_rows = row_count;
    if v_rows = 0 then
      v_grant := 0; -- 이미 받은 열쇠
    else
      update public.profiles set tickets = tickets + v_grant where user_id = v_uid;
      insert into public.ledger (user_id, delta, reason, currency) values (v_uid, v_grant, p_kind, 'ticket');
    end if;
  end if;

  select tickets into v_tickets from public.profiles where user_id = v_uid;
  return jsonb_build_object('granted', v_grant, 'tickets', v_tickets);
end $$;

revoke all on function public.grant_tickets(text, int, text) from public, anon, authenticated;
grant execute on function public.grant_tickets(text, int, text) to authenticated;

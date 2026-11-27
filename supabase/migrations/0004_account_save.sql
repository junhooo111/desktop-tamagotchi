-- 계정 저장분: 앱의 저장 데이터(펫·컬렉션·뽑기권·도감 등)를 계정에 통째로 맡긴다.
-- 어느 PC에서든 같은 계정이면 같은 진행을 받아 오고, 기존 사용자의 로컬 진행을 첫 로그인 때 올려서 잃지 않게 한다.
-- 서버가 재화·뽑기를 판정하는 구조(0001~0003)로 가기 전의 징검다리라서, 내용 검증은 크기·형태까지만 한다.
--
-- 안전 장치
--   * 낙관적 잠금: 저장할 때 "내가 마지막으로 본 버전"을 같이 보낸다. 다른 PC가 먼저 저장했으면 거절하고(version_conflict) 덮어쓰지 않는다.
--   * 덮어쓸 때마다 이전 내용을 백업 테이블에 남기고 사용자별로 최근 10개를 보관한다(앱이 잘못 저장해도 되돌릴 수 있다).
--   * 클라이언트는 테이블을 직접 고치지 못하고 함수(save_get / save_put)만 부른다.

create table public.account_saves (
  user_id        uuid primary key references auth.users (id) on delete cascade,
  version        int  not null default 1 check (version >= 1),
  schema_version int  not null default 1 check (schema_version >= 1),
  data           jsonb not null check (jsonb_typeof(data) = 'object'),
  device         text check (device is null or char_length(device) <= 80),
  updated_at     timestamptz not null default now()
);

create table public.account_save_backups (
  id             bigint generated always as identity primary key,
  user_id        uuid not null references auth.users (id) on delete cascade,
  version        int  not null,
  schema_version int  not null,
  data           jsonb not null,
  device         text,
  saved_at       timestamptz not null,
  backed_up_at   timestamptz not null default now()
);
create index account_save_backups_user_idx on public.account_save_backups (user_id, version desc);

alter table public.account_saves        enable row level security;
alter table public.account_save_backups enable row level security;

revoke all on public.account_saves        from public, anon, authenticated;
revoke all on public.account_save_backups from public, anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;

-- 내 저장분은 직접 읽을 수 있다(쓰기는 함수만). 백업은 클라이언트에 열지 않는다(관리자만).
grant select on public.account_saves to authenticated;
create policy account_saves_read_own on public.account_saves
  for select to authenticated using (user_id = (select auth.uid()));

-- ---------------------------------------------------------------
-- save_get(): 내 저장분(없으면 null)
-- ---------------------------------------------------------------
create function public.save_get() returns jsonb
language plpgsql stable security definer set search_path = public
as $$
declare v_row public.account_saves;
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  select * into v_row from public.account_saves where user_id = auth.uid();
  if not found then return null; end if;
  return jsonb_build_object(
    'version', v_row.version,
    'schema_version', v_row.schema_version,
    'data', v_row.data,
    'device', v_row.device,
    'updated_at', v_row.updated_at
  );
end $$;

-- ---------------------------------------------------------------
-- save_put(data, schema_version, expected_version, device)
--   expected_version = 0 : 처음 올린다(이미 있으면 version_conflict)
--   expected_version = N : 내가 마지막으로 본 버전이 N 일 때만 덮어쓴다
-- ---------------------------------------------------------------
create function public.save_put(p_data jsonb, p_schema_version int, p_expected_version int, p_device text default null)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_row public.account_saves;
  v_new int;
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  if p_data is null or jsonb_typeof(p_data) <> 'object' then raise exception 'invalid_data'; end if;
  if octet_length(p_data::text) > 300000 then raise exception 'too_large'; end if;
  if p_schema_version is null or p_schema_version < 1 then raise exception 'invalid_schema_version'; end if;
  if p_expected_version is null or p_expected_version < 0 then raise exception 'invalid_expected_version'; end if;
  if p_device is not null and char_length(p_device) > 80 then raise exception 'invalid_device'; end if;

  select * into v_row from public.account_saves where user_id = auth.uid() for update;

  if not found then
    if p_expected_version <> 0 then raise exception 'version_conflict'; end if;
    insert into public.account_saves (user_id, version, schema_version, data, device)
    values (auth.uid(), 1, p_schema_version, p_data, p_device);
    return jsonb_build_object('version', 1);
  end if;

  if p_expected_version <> v_row.version then
    raise exception 'version_conflict' using hint = 'current_version=' || v_row.version;
  end if;

  insert into public.account_save_backups (user_id, version, schema_version, data, device, saved_at)
  values (v_row.user_id, v_row.version, v_row.schema_version, v_row.data, v_row.device, v_row.updated_at);
  delete from public.account_save_backups
   where user_id = v_row.user_id
     and id not in (select id from public.account_save_backups where user_id = v_row.user_id order by version desc, id desc limit 10);

  v_new := v_row.version + 1;
  update public.account_saves
     set version = v_new, schema_version = p_schema_version, data = p_data, device = p_device, updated_at = now()
   where user_id = v_row.user_id;
  return jsonb_build_object('version', v_new);
end $$;

revoke all on function public.save_get() from public, anon, authenticated;
revoke all on function public.save_put(jsonb, int, int, text) from public, anon, authenticated;
grant execute on function public.save_get() to authenticated;
grant execute on function public.save_put(jsonb, int, int, text) to authenticated;

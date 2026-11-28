-- 0023: 꾸미기 거래(경매장)와 꾸미기 선물
--
-- 꾸미기는 중복이 없어서 거래하면 판 사람은 그 꾸미기를 잃고 산 사람에게 간다(cosmetics 표의 주인이 바뀐다).
-- 다만 "업적으로도 열 수 있는" 꾸미기(장식 8종 + 색 3종)는 팔 수 없다: 판 사람이 업적으로 이미 열어 둔 것이면 팔고도 계속 쓸 수 있어서
-- 같은 것을 여러 번 팔 수 있기 때문이다. 팔 수 있는 것은 뽑기로만 얻는 꾸미기 25종(cosmetic_items.tradable).
-- 선물은 친구에게 공짜로 넘기는 것이고(하루 3번까지), 받는 친구가 이미 가진 꾸미기는 줄 수 없다. 친밀도 +5.

alter table public.friend_events drop constraint friend_events_kind_check;
alter table public.friend_events add constraint friend_events_kind_check check (kind in ('wave', 'trade', 'gift', 'gift_cosmetic'));

alter table public.cosmetic_items add column tradable boolean not null default false;
update public.cosmetic_items set tradable = true
 where gacha
   and item_id not in ('ribbon', 'glasses', 'crown', 'wings', 'sprout', 'flower', 'partyhat', 'halo', 'pastel', 'deep', 'mono');

create table public.cosmetic_listings (
  id          uuid primary key default gen_random_uuid(),
  seller_id   uuid not null references public.profiles (user_id) on delete cascade,
  kind        text not null,
  item_id     text not null,
  price       int  not null check (price between 1 and 1000000),
  status      text not null default 'active' check (status in ('active', 'sold', 'cancelled')),
  buyer_id    uuid references public.profiles (user_id),
  created_at  timestamptz not null default now(),
  sold_at     timestamptz,
  foreign key (kind, item_id) references public.cosmetic_items (kind, item_id),
  check ((status = 'sold') = (buyer_id is not null))
);
create unique index cosmetic_listings_one_active on public.cosmetic_listings (seller_id, kind, item_id) where status = 'active';
create index cosmetic_listings_active_idx on public.cosmetic_listings (created_at desc) where status = 'active';
alter table public.cosmetic_listings enable row level security;
revoke all on public.cosmetic_listings from public, anon, authenticated;

create table public.cosmetic_gifts (
  id          uuid primary key default gen_random_uuid(),
  from_user   uuid not null references public.profiles (user_id) on delete cascade,
  to_user     uuid not null references public.profiles (user_id) on delete cascade,
  kind        text not null,
  item_id     text not null,
  created_at  timestamptz not null default now(),
  foreign key (kind, item_id) references public.cosmetic_items (kind, item_id)
);
create index cosmetic_gifts_from_idx on public.cosmetic_gifts (from_user, created_at);
create index cosmetic_gifts_to_idx on public.cosmetic_gifts (to_user, created_at);
alter table public.cosmetic_gifts enable row level security;
revoke all on public.cosmetic_gifts from public, anon, authenticated;

-- 내 꾸미기(뽑아서 가진 것): 팔 수 있는지, 판매 중이면 가격과 판매 번호
create function public.my_cosmetics() returns table (kind text, item_id text, rarity text, tradable boolean, listing_id uuid, price int)
language plpgsql stable security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  return query
    select c.kind, c.item_id, i.rarity, i.tradable, l.id, l.price
      from public.cosmetics c
      join public.cosmetic_items i on i.kind = c.kind and i.item_id = c.item_id
      left join public.cosmetic_listings l on l.seller_id = c.user_id and l.kind = c.kind and l.item_id = c.item_id and l.status = 'active'
     where c.user_id = auth.uid()
     order by c.created_at;
end $$;

-- 지금 팔리는 꾸미기(싼 순)
create function public.cosmetic_listings_active(p_limit int default 60) returns table (
  listing_id uuid, kind text, item_id text, rarity text, price int, seller_login text, is_mine boolean, created_at timestamptz
)
language plpgsql stable security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  if p_limit is null or p_limit < 1 or p_limit > 100 then raise exception 'invalid_limit'; end if;
  return query
    select l.id, l.kind, l.item_id, i.rarity, l.price, pr.github_login, l.seller_id = auth.uid(), l.created_at
      from public.cosmetic_listings l
      join public.cosmetic_items i on i.kind = l.kind and i.item_id = l.item_id
      join public.profiles pr on pr.user_id = l.seller_id
     where l.status = 'active'
     order by l.price, l.created_at
     limit p_limit;
end $$;

create function public.create_cosmetic_listing(p_kind text, p_item text, p_price int) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
  v_id  uuid;
begin
  if v_uid is null then raise exception 'not_authenticated'; end if;
  if p_price is null or p_price < 1 or p_price > 1000000 then raise exception 'invalid_price'; end if;
  perform 1 from public.profiles where user_id = v_uid for update;
  if not found then raise exception 'no_profile'; end if;
  perform 1 from public.cosmetics where user_id = v_uid and kind = p_kind and item_id = p_item;
  if not found then raise exception 'not_yours'; end if;
  perform 1 from public.cosmetic_items where kind = p_kind and item_id = p_item and tradable;
  if not found then raise exception 'not_tradable'; end if;
  if exists (select 1 from public.cosmetic_listings where seller_id = v_uid and kind = p_kind and item_id = p_item and status = 'active') then
    raise exception 'already_listed';
  end if;
  insert into public.cosmetic_listings (seller_id, kind, item_id, price) values (v_uid, p_kind, p_item, p_price) returning id into v_id;
  return v_id;
end $$;

create function public.cancel_cosmetic_listing(p_listing_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'not_authenticated'; end if;
  update public.cosmetic_listings set status = 'cancelled' where id = p_listing_id and seller_id = v_uid and status = 'active';
  if not found then raise exception 'listing_unavailable'; end if;
end $$;

-- 구매: 한 트랜잭션에서 게임머니와 주인을 함께 옮긴다(수수료 없음). 이미 가진 꾸미기는 살 수 없다.
create function public.buy_cosmetic_listing(p_listing_id uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_uid         uuid := auth.uid();
  l             public.cosmetic_listings;
  v_buyer_coins int;
begin
  if v_uid is null then raise exception 'not_authenticated'; end if;
  select * into l from public.cosmetic_listings where id = p_listing_id and status = 'active' for update;
  if not found then raise exception 'listing_unavailable'; end if;
  if l.seller_id = v_uid then raise exception 'own_listing'; end if;
  perform 1 from public.profiles where user_id in (v_uid, l.seller_id) order by user_id for update;
  select coins into v_buyer_coins from public.profiles where user_id = v_uid;
  if v_buyer_coins is null then raise exception 'no_profile'; end if;
  if v_buyer_coins < l.price then raise exception 'insufficient_coins'; end if;
  if exists (select 1 from public.cosmetics where user_id = v_uid and kind = l.kind and item_id = l.item_id) then raise exception 'already_owned'; end if;
  -- 판 사람이 아직 그 꾸미기를 가지고 있어야 한다(그렇지 않은 글은 거래할 수 없다)
  delete from public.cosmetics where user_id = l.seller_id and kind = l.kind and item_id = l.item_id;
  if not found then
    update public.cosmetic_listings set status = 'cancelled' where id = l.id;
    raise exception 'listing_unavailable';
  end if;
  insert into public.cosmetics (user_id, kind, item_id) values (v_uid, l.kind, l.item_id);

  update public.profiles set coins = coins - l.price where user_id = v_uid;
  update public.profiles set coins = coins + l.price where user_id = l.seller_id;
  update public.cosmetic_listings set status = 'sold', buyer_id = v_uid, sold_at = now() where id = l.id;
  insert into public.ledger (user_id, delta, reason, ref_id) values
    (v_uid,       -l.price, 'trade_buy',  l.id),
    (l.seller_id,  l.price, 'trade_sell', l.id);
  return jsonb_build_object('kind', l.kind, 'item_id', l.item_id, 'price', l.price, 'coins', v_buyer_coins - l.price);
end $$;

-- 내가 올렸다가 팔린 꾸미기(판매 알림용)
create function public.my_cosmetic_sales(p_since timestamptz default now() - interval '30 days') returns table (
  listing_id uuid, price int, kind text, item_id text, buyer_login text, sold_at timestamptz
)
language plpgsql stable security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  return query
    select l.id, l.price, l.kind, l.item_id, b.github_login, l.sold_at
      from public.cosmetic_listings l
      join public.profiles b on b.user_id = l.buyer_id
     where l.seller_id = auth.uid() and l.status = 'sold' and l.sold_at > coalesce(p_since, now() - interval '30 days')
     order by l.sold_at
     limit 50;
end $$;

-- 친구에게 꾸미기 선물: 팔 수 있는 꾸미기(판매 중이 아닌 것)를 무료로 넘긴다. 하루 3번, 친밀도 +5.
create function public.friend_gift_cosmetic(p_friendship uuid, p_kind text, p_item text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_uid   uuid := auth.uid();
  f       public.friendships;
  v_other uuid;
  v_today date := (now() at time zone 'utc')::date;
  v_sent  int;
  r       jsonb;
begin
  if v_uid is null then raise exception 'not_authenticated'; end if;
  select * into f from public.friendships where id = p_friendship and v_uid in (user_lo, user_hi);
  if not found or f.status <> 'accepted' then raise exception 'not_found'; end if;
  v_other := case when f.user_lo = v_uid then f.user_hi else f.user_lo end;

  perform 1 from public.profiles where user_id in (v_uid, v_other) order by user_id for update;
  perform 1 from public.cosmetic_items where kind = p_kind and item_id = p_item and tradable;
  if not found then raise exception 'not_tradable'; end if;
  if exists (select 1 from public.cosmetic_listings where seller_id = v_uid and kind = p_kind and item_id = p_item and status = 'active') then
    raise exception 'already_listed';
  end if;
  select count(*) into v_sent from public.cosmetic_gifts where from_user = v_uid and (created_at at time zone 'utc')::date = v_today;
  if v_sent >= 3 then raise exception 'gift_limit'; end if;
  if exists (select 1 from public.cosmetics where user_id = v_other and kind = p_kind and item_id = p_item) then raise exception 'already_owned'; end if;

  delete from public.cosmetics where user_id = v_uid and kind = p_kind and item_id = p_item;
  if not found then raise exception 'not_yours'; end if;
  insert into public.cosmetics (user_id, kind, item_id) values (v_other, p_kind, p_item);
  insert into public.cosmetic_gifts (from_user, to_user, kind, item_id) values (v_uid, v_other, p_kind, p_item);

  r := public._friend_add_xp(f.id, 'gift_cosmetic', v_today::text || ':' || v_uid::text || ':' || p_kind || ':' || p_item, 5);
  return r;
end $$;

-- 받은 꾸미기 선물(알림용)
create function public.cosmetic_gifts_received(p_since timestamptz default now() - interval '30 days') returns table (
  kind text, item_id text, from_login text, created_at timestamptz
)
language plpgsql stable security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  return query
    select g.kind, g.item_id, p.github_login, g.created_at
      from public.cosmetic_gifts g
      join public.profiles p on p.user_id = g.from_user
     where g.to_user = auth.uid() and g.created_at > coalesce(p_since, now() - interval '30 days')
     order by g.created_at
     limit 50;
end $$;

-- 친구끼리 꾸미기 거래도 친밀도 +10(펫 거래와 같다)
create function public._friend_cosmetic_trade_xp() returns trigger
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
create trigger cosmetic_listings_friend_xp after update of status on public.cosmetic_listings
  for each row execute function public._friend_cosmetic_trade_xp();

revoke all on function public.my_cosmetics()                                    from public, anon, authenticated;
revoke all on function public.cosmetic_listings_active(int)                     from public, anon, authenticated;
revoke all on function public.create_cosmetic_listing(text, text, int)          from public, anon, authenticated;
revoke all on function public.cancel_cosmetic_listing(uuid)                     from public, anon, authenticated;
revoke all on function public.buy_cosmetic_listing(uuid)                        from public, anon, authenticated;
revoke all on function public.my_cosmetic_sales(timestamptz)                    from public, anon, authenticated;
revoke all on function public.friend_gift_cosmetic(uuid, text, text)            from public, anon, authenticated;
revoke all on function public.cosmetic_gifts_received(timestamptz)              from public, anon, authenticated;
revoke all on function public._friend_cosmetic_trade_xp()                       from public, anon, authenticated;
grant execute on function public.my_cosmetics()                                 to authenticated;
grant execute on function public.cosmetic_listings_active(int)                  to authenticated;
grant execute on function public.create_cosmetic_listing(text, text, int)       to authenticated;
grant execute on function public.cancel_cosmetic_listing(uuid)                  to authenticated;
grant execute on function public.buy_cosmetic_listing(uuid)                     to authenticated;
grant execute on function public.my_cosmetic_sales(timestamptz)                 to authenticated;
grant execute on function public.friend_gift_cosmetic(uuid, text, text)        to authenticated;
grant execute on function public.cosmetic_gifts_received(timestamptz)           to authenticated;

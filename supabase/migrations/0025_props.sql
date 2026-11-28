-- 0025: 꾸미기의 새 종류 — 소품(prop): 펫 곁을 따라다니는 작은 물건.
--   공·뼈다귀(일반) / 생선·풍선(고급) / 꽃 화분·나비(희귀) / 등불(특별) / 용의 알(전설)
-- 모두 꾸미기 뽑기 전용이고 팔고 선물할 수 있다(뽑기 대상 36종 → 44종, 거래 가능 25종 → 33종).

alter table public.cosmetics drop constraint cosmetics_kind_check;
alter table public.cosmetics add constraint cosmetics_kind_check check (kind in ('accessory', 'variant', 'neck', 'effect', 'prop'));
alter table public.cosmetic_items drop constraint cosmetic_items_kind_check;
alter table public.cosmetic_items add constraint cosmetic_items_kind_check check (kind in ('accessory', 'variant', 'neck', 'effect', 'prop'));
-- 거래 목록·선물 표도 같은 종류 제약이 있으면 넓힌다(없으면 건너뛴다)
do $$
declare c record;
begin
  for c in select conrelid::regclass as tbl, conname from pg_constraint
            where contype = 'c' and conrelid in ('public.cosmetic_listings'::regclass, 'public.cosmetic_gifts'::regclass)
              and pg_get_constraintdef(oid) like '%''neck''%' loop
    execute format('alter table %s drop constraint %I', c.tbl, c.conname);
  end loop;
end $$;

insert into public.cosmetic_items (kind, item_id, rarity, gacha, tradable) values
  ('prop', 'ball',      'common',   true, true),
  ('prop', 'bone',      'common',   true, true),
  ('prop', 'fish',      'uncommon', true, true),
  ('prop', 'balloon',   'uncommon', true, true),
  ('prop', 'pot',       'rare',     true, true),
  ('prop', 'butterfly', 'rare',     true, true),
  ('prop', 'lantern',   'special',  true, true),
  ('prop', 'dragonegg', 'legend',   true, true);

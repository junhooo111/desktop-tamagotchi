-- 0027: 소품 4종 추가 — 털실뭉치(고급) / 연(희귀) / 눈사람(특별) / 비구름(전설). 모두 뽑기 전용·거래 가능.
insert into public.cosmetic_items (kind, item_id, rarity, gacha, tradable) values
  ('prop', 'yarn',    'uncommon', true, true),
  ('prop', 'kite',    'rare',     true, true),
  ('prop', 'snowman', 'special',  true, true),
  ('prop', 'cloud',   'legend',   true, true);

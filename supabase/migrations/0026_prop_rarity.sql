-- 0026: 소품 등급을 한 단계씩 올린다(움직이는 물건이라 장식보다 귀하게).
--   공·뼈다귀 고급 / 생선·풍선 희귀 / 꽃 화분·나비 특별 / 등불·용의 알 전설
update public.cosmetic_items set rarity = case item_id
  when 'ball' then 'uncommon' when 'bone' then 'uncommon'
  when 'fish' then 'rare' when 'balloon' then 'rare'
  when 'pot' then 'special' when 'butterfly' then 'special'
  when 'lantern' then 'legend' when 'dragonegg' then 'legend' end
 where kind = 'prop';

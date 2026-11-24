-- 0002: 처음 만나는 펫 6종과 뽑기 확률
-- 가중치는 상대값이다(합이 100 일 필요는 없다). 전설 등급은 도트가 생기면 추가한다.
-- 진화 규칙(evolves_to, evolve_level, evolve_cost)은 진화 도트가 생기면 채운다.

insert into public.species (id, name, rarity, gacha_weight) values
  ('chick',  '병아리', 'common', 25),
  ('duck',   '오리',   'common', 25),
  ('rabbit', '토끼',   'common', 20),
  ('cat',    '고양이', 'rare',   11),
  ('dog',    '강아지', 'rare',   11),
  ('turtle', '거북이', 'epic',    8);

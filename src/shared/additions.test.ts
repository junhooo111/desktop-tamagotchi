import { describe, expect, it } from 'vitest';
import { pullCosmetic, startCollection } from './collection.js';
import { ACHIEVEMENTS, applyEvent, emptyGrowth, type Growth } from './growth.js';
import { createPet } from './pet.js';
import { ACCESSORIES, COMMON_SPECIES, HIDDEN_SPECIES, SPECIES, VARIANTS, spriteSet } from './species.js';
import { ACCESSORY_NAMES, ACCESSORY_UNLOCK, ACHIEVEMENT_ONLY, GACHA_ACCESSORIES, GACHA_ONLY, accessoryUnlocked, allowedPatch, buildWardrobe } from './wardrobe.js';

const NOW = new Date(2026, 10, 27, 12).getTime();
const NEW_ANIMALS = ['panda', 'bear', 'pig', 'sheep', 'owl'] as const;
const NEW_ACCESSORIES = ['cap', 'witch', 'chef', 'santa', 'headband', 'antenna', 'bunnyears', 'eyepatch', 'monocle', 'star'] as const;

describe('동물 5종 추가', () => {
  it('판다·곰·돼지·양·부엉이는 일반보다 높은 등급으로 들어와 있고, 전체는 31종이다', () => {
    expect(SPECIES).toHaveLength(31);
    expect(COMMON_SPECIES).toHaveLength(7);
    expect(HIDDEN_SPECIES).toHaveLength(5);
    for (const id of ['panda', 'bear', 'pig', 'sheep', 'owl']) expect(SPECIES.some((s) => s.id === id && s.rarity !== 'common' && s.rarity !== 'hidden'), id).toBe(true);
  });

  it('새 동물은 서로·기존 동물과 모습이 다르다(새끼·성체)', () => {
    for (const stage of ['baby', 'adult'] as const) {
      const looks = SPECIES.map((s) => spriteSet(s.id, stage).frames.idleA.join('\n') + JSON.stringify(spriteSet(s.id, stage).palette));
      expect(new Set(looks).size, stage).toBe(SPECIES.length);
    }
  });

  it('판다는 까만 눈 무늬·귀·다리(a), 양은 까만 얼굴·다리와 하얀 털, 부엉이는 귀깃이 있는 새다', () => {
    const count = (id: (typeof NEW_ANIMALS)[number], ch: string) => spriteSet(id, 'adult').frames.idleA.join('').split(ch).length - 1;
    expect(count('panda', 'a')).toBeGreaterThan(30);
    expect(count('sheep', 'a')).toBeGreaterThan(40);
    expect(count('sheep', 'h')).toBeGreaterThan(5); // 갈기처럼 풍성한 털
    expect(count('pig', 'a')).toBeLessThan(count('panda', 'a')); // 돼지는 무늬 없이 분홍 한 색
    expect(spriteSet('owl', 'adult').palette['p']).toBeDefined(); // 부리
  });
});

describe('희귀 동물 4종(수달·알파카·앵무새·너구리)', () => {
  const rows = (id: 'otter' | 'alpaca' | 'parrot' | 'raccoon', stage: 'baby' | 'adult' = 'adult') => spriteSet(id, stage).frames.idleA.join('');
  const count = (text: string, ch: string): number => text.split(ch).length - 1;

  it('모두 희귀 등급이고 이름이 있다', () => {
    for (const [id, name] of [['otter', '수달'], ['alpaca', '알파카'], ['parrot', '앵무새'], ['raccoon', '너구리']] as const) {
      expect(SPECIES.find((s) => s.id === id)).toMatchObject({ name, rarity: 'rare' });
    }
  });

  it('너구리는 가면 무늬와 고리 꼬리(무늬색 a)가 있고, 앵무새는 머리색(g)이 몸(f)과 다르다', () => {
    expect(count(rows('raccoon'), 'a')).toBeGreaterThan(20);
    const parrot = spriteSet('parrot', 'adult');
    expect(count(rows('parrot'), 'g')).toBeGreaterThan(10);
    expect(parrot.palette['g']).not.toBe(parrot.palette['f']);
  });
});

describe('장식 10종 추가', () => {
  it('뽑기 전용 4종, 업적 전용 6종이고 서로 겹치지 않는다', () => {
    expect([...GACHA_ONLY, ...ACHIEVEMENT_ONLY].sort()).toEqual([...NEW_ACCESSORIES].sort());
    for (const a of NEW_ACCESSORIES) expect(ACCESSORIES.includes(a), a).toBe(true);
    expect(ACCESSORIES).toHaveLength(19);
    expect(Object.keys(ACCESSORY_NAMES)).toHaveLength(19);
  });

  it('업적 전용 장식은 꾸미기 뽑기에 나오지 않고, 뽑기 전용 장식은 업적 없이 뽑아야만 열린다', () => {
    for (const a of ACHIEVEMENT_ONLY) expect(GACHA_ACCESSORIES.includes(a), a).toBe(false);
    for (const a of GACHA_ONLY) {
      expect(GACHA_ACCESSORIES.includes(a), a).toBe(true);
      expect(ACCESSORY_UNLOCK[a], a).toBeUndefined();
      expect(accessoryUnlocked(emptyGrowth(), a), a).toBe(false);
      expect(accessoryUnlocked(emptyGrowth(), a, { accessories: [a], variants: [], species: [] }), a).toBe(true);
    }
  });

  it('업적 전용 장식은 해당 업적을 달성해야 열리고, 안내문에 뽑기에는 없다고 알려 준다', () => {
    const wardrobe = buildWardrobe(emptyGrowth(), { speciesId: 'cat', variant: 'default', accessory: 'none' });
    const star = wardrobe.accessories.find((a) => a.id === 'star')!;
    expect(star.unlocked).toBe(false);
    expect(star.hint).toContain('전설의 만남');
    expect(star.hint).toContain('뽑기에는 없어요');
    const cap = wardrobe.accessories.find((a) => a.id === 'cap')!;
    expect(cap.hint).toContain('뽑기로만');
    const done: Growth = { ...emptyGrowth(), achievements: { 'hidden-1': 1 } };
    expect(accessoryUnlocked(done, 'star')).toBe(true);
    expect(allowedPatch(emptyGrowth(), { accessory: 'star' })).toEqual({});
    expect(allowedPatch(done, { accessory: 'star' })).toEqual({ accessory: 'star' });
    expect(allowedPatch(emptyGrowth(), { accessory: 'cap' })).toEqual({});
  });

  it('꾸미기 뽑기는 업적 전용을 뺀 장식과 색에서만 뽑고, 뽑기 전용 장식도 나온다', () => {
    const c = { ...startCollection({ ...createPet('cat', NOW), xp: 300 }, NOW), tickets: 1_000 };
    const none = { accessories: new Set<never>(), variants: new Set<never>() };
    const seen = new Set<string>();
    for (let i = 0; i < 400; i++) {
      // 등급과 고르기가 같은 난수에 묶이지 않게, 시드마다 다른 수열을 쓴다
      let seed = Math.imul(i + 1, 2654435761) >>> 0;
      const rng = (): number => {
        seed = (seed + 0x6d2b79f5) >>> 0; // mulberry32
        let t = seed;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
      const r = pullCosmetic(c, { accessories: GACHA_ACCESSORIES, variants: VARIANTS }, none, rng).result;
      if (r.ok) seen.add(r.item.id);
    }
    for (const a of ACHIEVEMENT_ONLY) expect(seen.has(a), a).toBe(false);
    for (const a of GACHA_ONLY) expect(seen.has(a), a).toBe(true);
  });

  it('새 장식 10종 모두 모든 동물(새끼·성체)에서 그려지고 그림 밖으로 잘리지 않는다', () => {
    for (const acc of NEW_ACCESSORIES) {
      for (const s of SPECIES) {
        for (const stage of ['baby', 'adult'] as const) {
          const set = spriteSet(s.id, stage, { variant: 'default', accessory: acc });
          const plain = spriteSet(s.id, stage);
          expect(set.frames.idleA.join(''), `${acc} ${s.id} ${stage}`).not.toEqual(plain.frames.idleA.join(''));
          expect(set.palette['X'], acc).toBeDefined();
        }
      }
    }
  });
});

describe('새 업적 6개', () => {
  const find = (id: string) => ACHIEVEMENTS.find((a) => a.id === id)!;
  const ids = ['care-200', 'wash-20', 'stroll-10', 'collect-5', 'pull-10', 'hidden-1'];

  it('업적 전용 장식이 걸린 업적이 모두 실제로 있다', () => {
    for (const id of ids) expect(find(id), id).toBeDefined();
    for (const a of ACHIEVEMENT_ONLY) expect(ACHIEVEMENTS.some((x) => x.id === ACCESSORY_UNLOCK[a]), a).toBe(true);
    expect(ACHIEVEMENTS).toHaveLength(28);
  });

  it('씻기면 씻은 횟수가, 산책하면 산책 횟수(와 돌봄)가 오른다', () => {
    let g = emptyGrowth();
    g = applyEvent(g, { kind: 'care', care: 'wash' }, NOW, { tipsSeen: 0 }).growth;
    g = applyEvent(g, { kind: 'care', care: 'play' }, NOW, { tipsSeen: 0 }).growth;
    g = applyEvent(g, { kind: 'stroll' }, NOW, { tipsSeen: 0 }).growth;
    expect(g.counters).toMatchObject({ washes: 1, strolls: 1, care: 3 });
  });

  it('씻기 20번·산책 10번·돌봄 200번을 채우면 달성한다', () => {
    let g = emptyGrowth();
    let unlocked: string[] = [];
    for (let i = 0; i < 20; i++) {
      const r = applyEvent(g, { kind: 'care', care: 'wash' }, NOW, { tipsSeen: 0 });
      g = r.growth;
      unlocked = [...unlocked, ...r.unlocked.map((a) => a.id)];
    }
    expect(unlocked).toContain('wash-20');
    for (let i = 0; i < 10; i++) unlocked.push(...applyEvent((g = applyEvent(g, { kind: 'stroll' }, NOW, { tipsSeen: 0 }).growth), { kind: 'sync' }, NOW, { tipsSeen: 0 }).unlocked.map((a) => a.id));
    expect(g.achievements['stroll-10']).toBeDefined();
    for (let i = 0; i < 200; i++) g = applyEvent(g, { kind: 'care', care: 'touch' }, NOW, { tipsSeen: 0 }).growth;
    expect(g.achievements['care-200']).toBeDefined();
  });

  it('컬렉션 현황(모은 동물·뽑기 횟수·히든)은 sync 로 다시 볼 때 달성한다', () => {
    const g = emptyGrowth();
    expect(applyEvent(g, { kind: 'sync' }, NOW, { tipsSeen: 0, collected: 4 }).unlocked).toEqual([]);
    expect(applyEvent(g, { kind: 'sync' }, NOW, { tipsSeen: 0, collected: 5 }).unlocked.map((a) => a.id)).toEqual(['collect-5']);
    expect(applyEvent(g, { kind: 'sync' }, NOW, { tipsSeen: 0, pulls: 10 }).unlocked.map((a) => a.id)).toEqual(['pull-10']);
    expect(applyEvent(g, { kind: 'sync' }, NOW, { tipsSeen: 0, hiddenOwned: 1 }).unlocked.map((a) => a.id)).toEqual(['hidden-1']);
    // sync 는 숫자를 올리지 않는다
    expect(applyEvent(g, { kind: 'sync' }, NOW, { tipsSeen: 0 }).growth.counters).toEqual(g.counters);
  });
});

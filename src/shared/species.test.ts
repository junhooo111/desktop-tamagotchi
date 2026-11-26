import { describe, expect, it } from 'vitest';
import { boundsOf, SIZE } from './pixel.js';
import {
  FRAME_NAMES,
  SPECIES,
  frameToRgba,
  getSpecies,
  isSpeciesId,
  spriteSet,
  type SpeciesId,
  type SpriteStage,
} from './species.js';

const IDS = SPECIES.map((s) => s.id);
const STAGES: SpriteStage[] = ['egg', 'baby', 'adult'];
const cases: [string, SpeciesId, SpriteStage][] = IDS.flatMap((id) =>
  (['baby', 'adult'] as const).map((stage): [string, SpeciesId, SpriteStage] => [`${id}/${stage}`, id, stage]),
);
const all: [string, SpeciesId, SpriteStage][] = [...cases, ['egg', 'cat', 'egg']];

describe('종 목록', () => {
  it('처음 6종과 업적으로 여는 3종이 모두 있다', () => {
    expect(SPECIES.map((s) => s.name)).toEqual(['토끼', '고양이', '강아지', '거북이', '병아리', '오리', '여우', '햄스터', '펭귄']);
  });

  it('동작별 프레임이 34개 있다', () => {
    expect(FRAME_NAMES).toHaveLength(34);
    expect(new Set(FRAME_NAMES).size).toBe(34);
  });
});

describe('스프라이트 데이터', () => {
  it.each(all)('%s: 모든 프레임이 32x32이고 팔레트에 없는 문자를 쓰지 않으며 윤곽선이 있다', (_n, id, stage) => {
    const set = spriteSet(id, stage);
    for (const name of FRAME_NAMES) {
      const rows = set.frames[name];
      expect(rows, name).toHaveLength(SIZE);
      for (const row of rows) {
        expect(row, name).toHaveLength(SIZE);
        for (const ch of row) expect(ch === '.' || ch in set.palette, `${name}: '${ch}'`).toBe(true);
      }
      expect(rows.join(''), name).toContain('k');
    }
  });

  it.each(all)('%s: 팔레트 색은 #rrggbb 형식이다', (_n, id, stage) => {
    for (const hex of Object.values(spriteSet(id, stage).palette)) expect(hex).toMatch(/^#[0-9a-f]{6}$/i);
  });

  it.each(all)('%s: 서 있는 그림은 맨 아래 줄까지 닿는다(바닥에 붙는다)', (_n, id, stage) => {
    // 걷기 중 공중에 뜨는 프레임(토끼의 깡충 등)은 제외하고, 발이 바닥에 있어야 하는 자세만 본다.
    for (const name of ['idleA', 'idleB', 'walk1', 'sitA', 'sleepA', 'sleepB'] as const) {
      expect(boundsOf(spriteSet(id, stage).frames[name])?.y1, name).toBe(SIZE - 1);
    }
  });

  it.each(cases)('%s: 그림이 격자 밖으로 잘리지 않는다(매달리기·점프로 뜨는 프레임 제외)', (_n, id, stage) => {
    const set = spriteSet(id, stage);
    for (const name of FRAME_NAMES) {
      if (name === 'hangA' || name === 'hangB') continue; // 마우스를 잡은 팔이 맨 윗줄까지 닿는 것이 맞다
      const b = boundsOf(set.frames[name]);
      expect(b, name).not.toBeNull();
      expect(b!.x0, `${name} 왼쪽`).toBeGreaterThanOrEqual(0);
      expect(b!.x1, `${name} 오른쪽`).toBeLessThanOrEqual(SIZE - 1);
      expect(b!.y0, `${name} 위쪽`).toBeGreaterThanOrEqual(0);
    }
  });

  it.each(cases)('%s: 걷기·뛰기 사이클이 서로 다른 4장이고 동작별 그림이 서 있는 그림과 다르다', (_n, id, stage) => {
    const f = spriteSet(id, stage).frames;
    expect(new Set([f.walk1, f.walk2, f.walk3, f.walk4].map((r) => r.join('\n'))).size).toBe(4);
    expect(new Set([f.run1, f.run2, f.run3, f.run4].map((r) => r.join('\n'))).size).toBe(4);
    // 거북이·햄스터 새끼의 앉아서 숨쉬기(거북이는 서서 숨쉬기도)는 1칸 차이라 16칸 굵기로 뭉치면 사라진다(그 한 경우만 예외)
    if (!(id === 'turtle' && stage === 'baby')) expect(f.idleA).not.toEqual(f.idleB);
    if (!(stage === 'baby' && (id === 'turtle' || id === 'hamster'))) expect(f.sitA).not.toEqual(f.sitB);
    expect(f.sleepA).not.toEqual(f.sleepB);
    expect(f.hangA).not.toEqual(f.hangB);
    for (const other of ['walk1', 'run2', 'sitA', 'sleepA', 'dozeA', 'jumpPeak', 'curl', 'climbA', 'slipA', 'hangA', 'fall', 'alertA', 'happyA', 'eatA'] as const) {
      expect(f[other], other).not.toEqual(f.idleA);
    }
  });

  const count = (rows: readonly string[], ch: string): number => rows.join('').split(ch).length - 1;

  it.each(cases)('%s: 뜬 눈은 까만 콩(3칸 이상, 거북이 새끼는 코가 일부를 덮는다)이고, 눈을 감은 그림에도 눈 선이 남는다', (_n, id, stage) => {
    const f = spriteSet(id, stage).frames;
    expect(count(f.idleA, 'e')).toBeGreaterThanOrEqual(3);
    expect(count(f.sleepA, 'e')).toBeGreaterThan(0);
  });

  it.each(cases)('%s: 세세한 장식(눈 반짝임·볼터치)을 쓰지 않는 단순한 그림이다', (_n, id, stage) => {
    // "대충 생겨야 귀엽다"는 의견에 따라 단색 덩어리 + 윤곽선 + 점 눈으로 그린다.
    const f = spriteSet(id, stage).frames;
    for (const name of ['idleA', 'walk1', 'sitA', 'happyA'] as const) {
      const all = f[name].join('');
      expect(all, `${name} 눈 반짝임`).not.toContain('w');
      expect(all, `${name} 볼터치`).not.toContain('r');
    }
  });

  it.each(cases)('%s: 눈 깜빡임에 쓸 몸 색 문자가 팔레트에 있다', (_n, id, stage) => {
    const set = spriteSet(id, stage);
    expect(set.skin).not.toBe('');
    expect(set.palette[set.skin]).toBeDefined();
  });

  it.each(IDS)('%s: 새끼는 성체보다 작다(머리가 큰 아기 비율로 따로 그린다)', (id) => {
    const baby = boundsOf(spriteSet(id, 'baby').frames.idleA)!;
    const adult = boundsOf(spriteSet(id, 'adult').frames.idleA)!;
    expect(baby.y1 - baby.y0).toBeLessThan(adult.y1 - adult.y0);
    expect(baby.x1 - baby.x0).toBeLessThan(adult.x1 - adult.x0);
    expect(spriteSet(id, 'baby').frames.idleA).not.toEqual(spriteSet(id, 'adult').frames.idleA);
  });

  it.each(IDS)('%s: 종마다 색이 다르다', (id) => {
    const colors = new Set(IDS.map((i) => spriteSet(i, 'adult').palette['f']));
    expect(colors.size).toBeGreaterThanOrEqual(5);
    expect(spriteSet(id, 'adult').palette['f']).toBeDefined();
  });
});

describe('알', () => {
  it('종과 상관없이 같은 알이고 얼굴이 없다', () => {
    const egg = spriteSet('cat', 'egg');
    expect(spriteSet('duck', 'egg')).toBe(egg);
    expect(egg.skin).toBe('');
    expect(egg.frames.idleA.join('')).not.toContain('e');
  });

  it('걸을 땐 좌우로 기울고, 점프할 땐 찌그러졌다가 늘어난다', () => {
    const f = spriteSet('cat', 'egg').frames;
    expect(f.walk1).not.toEqual(f.walk3);
    expect(f.walk1).not.toEqual(f.idleA);
    expect(f.jumpCrouch).not.toEqual(f.jumpUp);
  });

  it('알은 새끼·성체보다 작다', () => {
    const egg = boundsOf(spriteSet('cat', 'egg').frames.idleA)!;
    const baby = boundsOf(spriteSet('cat', 'baby').frames.idleA)!;
    expect(egg.y1 - egg.y0).toBeLessThanOrEqual(baby.y1 - baby.y0 + 2);
  });
});

describe('스프라이트 캐시', () => {
  it('같은 종·단계는 한 번만 그려서 같은 객체를 돌려준다', () => {
    expect(spriteSet('rabbit', 'adult')).toBe(spriteSet('rabbit', 'adult'));
    expect(spriteSet('rabbit', 'adult')).not.toBe(spriteSet('rabbit', 'baby'));
    expect(STAGES).toHaveLength(3);
  });
});

describe('frameToRgba', () => {
  it('배율만큼 커진 RGBA 비트맵을 만들고 투명 픽셀은 알파 0이다', () => {
    const set = spriteSet('cat', 'adult');
    const bmp = frameToRgba(set.frames.idleA, set.palette, 2);
    expect(bmp.width).toBe(SIZE * 2);
    expect(bmp.data).toHaveLength(SIZE * 2 * SIZE * 2 * 4);
    expect(bmp.data[3]).toBe(0);
    const opaque = Array.from({ length: SIZE * 2 * SIZE * 2 }, (_, i) => bmp.data[i * 4 + 3]).filter((a) => a === 255);
    expect(opaque.length).toBeGreaterThan(200);
  });
});

describe('getSpecies / isSpeciesId', () => {
  it('id로 종을 찾고, 모르는 id는 거부한다', () => {
    expect(getSpecies('cat').name).toBe('고양이');
    expect(() => getSpecies('dragon' as never)).toThrow();
    expect(isSpeciesId('cat')).toBe(true);
    expect(isSpeciesId('dragon')).toBe(false);
    expect(isSpeciesId(3)).toBe(false);
  });
});

describe('꾸미기 스타일(색 변형·장식)', () => {
  const frame = (rows: readonly string[]): string => rows.join('');

  it('스타일을 안 주면 기본(변형 없음, 장식 없음)과 같다', () => {
    expect(spriteSet('cat', 'adult')).toBe(spriteSet('cat', 'adult', { variant: 'default', accessory: 'none' }));
  });

  it('같은 종·단계·스타일은 같은 그림을 기억해서 다시 쓴다', () => {
    const style = { variant: 'pastel', accessory: 'crown' } as const;
    expect(spriteSet('fox', 'baby', style)).toBe(spriteSet('fox', 'baby', style));
  });

  it('색 변형은 몸 색만 바꾸고 윤곽선·눈은 그대로다(그림 모양은 같다)', () => {
    const base = spriteSet('cat', 'adult');
    for (const variant of ['pastel', 'deep', 'mono'] as const) {
      const v = spriteSet('cat', 'adult', { variant, accessory: 'none' });
      expect(v.palette['f'], variant).not.toBe(base.palette['f']);
      expect(v.palette['k'], variant).toBe(base.palette['k']);
      expect(v.palette['e'], variant).toBe(base.palette['e']);
      expect(frame(v.frames.idleA), variant).toBe(frame(base.frames.idleA));
    }
  });

  it('흑백은 거의 회색이고, 파스텔은 더 밝고, 진하게는 더 어둡다', () => {
    const lum = (hex: string): number => {
      const n = parseInt(hex.slice(1), 16);
      return 0.3 * ((n >> 16) & 255) + 0.59 * ((n >> 8) & 255) + 0.11 * (n & 255);
    };
    const f = (v: 'default' | 'pastel' | 'deep' | 'mono'): string => spriteSet('cat', 'adult', { variant: v, accessory: 'none' }).palette['f']!;
    expect(lum(f('pastel'))).toBeGreaterThan(lum(f('default')));
    expect(lum(f('deep'))).toBeLessThan(lum(f('default')));
    const n = parseInt(f('mono').slice(1), 16);
    expect(Math.max((n >> 16) & 255, (n >> 8) & 255, n & 255) - Math.min((n >> 16) & 255, (n >> 8) & 255, n & 255)).toBeLessThan(40);
  });

  const stylable: [string, SpeciesId][] = IDS.map((id) => [id, id]);

  it.each(stylable)('%s: 장식마다 그림이 달라지고(장식 색이 팔레트에 있다) 칸 밖으로 나가지 않는다', (_n, id) => {
    const base = spriteSet(id, 'adult');
    for (const accessory of ['ribbon', 'glasses', 'crown', 'wings', 'sprout', 'flower', 'partyhat', 'halo'] as const) {
      const set = spriteSet(id, 'adult', { variant: 'default', accessory });
      expect(frame(set.frames.idleA), accessory).not.toBe(frame(base.frames.idleA));
      expect(set.palette['X'], accessory).toBeDefined();
      expect(set.palette['Y'], accessory).toBeDefined();
      for (const name of ['idleA', 'walk1', 'sitA', 'sleepA'] as const) {
        const b = boundsOf(set.frames[name]);
        expect(b, name).not.toBeNull();
        expect(b!.x0).toBeGreaterThanOrEqual(0);
        expect(b!.y0).toBeGreaterThanOrEqual(0);
        expect(b!.x1).toBeLessThanOrEqual(SIZE - 1);
        expect(b!.y1).toBeLessThanOrEqual(SIZE - 1);
      }
    }
  });

  it('왕관·리본·선글라스는 눈을 감은 자는 그림에도 따라간다(머리를 따라다닌다)', () => {
    for (const accessory of ['crown', 'ribbon', 'glasses'] as const) {
      const set = spriteSet('cat', 'adult', { variant: 'default', accessory });
      expect(frame(set.frames.sleepA), accessory).toContain(accessory === 'glasses' ? 'Y' : 'X');
    }
  });

  it.each(stylable)('%s: 머리 장식은 새끼·성체의 모든 자세(걷기·앉기·자기·매달리기 등)에 따라다닌다', (_n, id) => {
    for (const stage of ['baby', 'adult'] as const) {
      for (const accessory of ['ribbon', 'crown', 'sprout', 'flower', 'partyhat', 'halo'] as const) {
        const set = spriteSet(id, stage, { variant: 'default', accessory });
        for (const [name, rows] of Object.entries(set.frames)) {
          expect(frame(rows), `${stage} ${accessory} ${name}`).toMatch(/[XY]/);
        }
      }
    }
  });

  it('리본은 크게(가로 10칸 이상) 그려 작은 화면에서도 잘 보인다', () => {
    for (const id of IDS) {
      const rows = spriteSet(id, 'adult', { variant: 'default', accessory: 'ribbon' }).frames.idleA;
      const xs = rows.flatMap((r) => [...r].map((c, x) => (c === 'X' || c === 'Y' ? x : -1))).filter((x) => x >= 0);
      expect(Math.max(...xs) - Math.min(...xs) + 1, id).toBeGreaterThanOrEqual(10);
    }
  });

  it('알은 스타일과 상관없이 같은 알이다', () => {
    expect(spriteSet('cat', 'egg', { variant: 'mono', accessory: 'crown' })).toBe(spriteSet('dog', 'egg'));
  });
});

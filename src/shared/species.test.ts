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
  it('사용자가 고른 6종이 모두 있다', () => {
    expect(SPECIES.map((s) => s.name)).toEqual(['토끼', '고양이', '강아지', '거북이', '병아리', '오리']);
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
    // 거북이 새끼의 숨쉬기·앉아서 숨쉬기는 1칸 차이라 16칸 굵기로 뭉치면 사라진다(그 한 경우만 예외)
    if (!(id === 'turtle' && stage === 'baby')) {
      expect(f.idleA).not.toEqual(f.idleB);
      expect(f.sitA).not.toEqual(f.sitB);
    }
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

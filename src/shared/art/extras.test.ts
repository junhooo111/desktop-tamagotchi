import { describe, expect, it } from 'vitest';
import { EFFECTS, NECKS, applyEffect, isEffect, isNeck } from './extras.js';
import { allowedPatch, buildWardrobe, effectUnlocked, neckUnlocked } from '../wardrobe.js';
import { emptyGrowth } from '../growth.js';
import { sanitizeSettings } from '../settings.js';
import { SPECIES, spriteSet } from '../species.js';

const NEW_NECKS = NECKS.filter((n) => n !== 'none');
const NEW_EFFECTS = EFFECTS.filter((e) => e !== 'none');

describe('목 장식', () => {
  it('모든 동물(새끼·성체)에 그려져서 그림이 달라지고, 팔레트에 N·M 이 있다', () => {
    for (const neck of NEW_NECKS) {
      for (const s of SPECIES.filter((_, i) => i % 5 === 0)) {
        for (const stage of ['baby', 'adult'] as const) {
          const worn = spriteSet(s.id, stage, { variant: 'default', accessory: 'none', neck });
          const plain = spriteSet(s.id, stage);
          expect(worn.frames.idleA.join(''), `${neck} ${s.id} ${stage}`).not.toEqual(plain.frames.idleA.join(''));
          expect(worn.palette['N'], neck).toBeDefined();
        }
      }
    }
  }, 60_000);

  it('이름 검사: 아는 값만 받는다', () => {
    expect(isNeck('bell')).toBe(true);
    expect(isNeck('laser')).toBe(false);
    expect(isEffect('flameaura')).toBe(true);
    expect(isEffect(3)).toBe(false);
  });
});

describe('효과', () => {
  const sprite = spriteSet('cat', 'adult').frames.idleA;

  it('이미 그려진 칸은 건드리지 않고 빈 칸만 채운다', () => {
    for (const effect of NEW_EFFECTS) {
      const out = applyEffect(sprite, effect);
      expect(out).toHaveLength(sprite.length);
      let changed = 0;
      sprite.forEach((row, y) => {
        [...row].forEach((ch, x) => {
          if (ch !== '.') expect(out[y]![x], `${effect} ${x},${y}`).toBe(ch);
          else if (out[y]![x] !== '.') changed++;
        });
      });
      expect(changed, effect).toBeGreaterThan(8);
    }
  });

  it('없음이면 그대로이고, 불꽃 오라는 그림 모양을 따라 둘레에만 칠한다', () => {
    expect(applyEffect(sprite, 'none')).toEqual([...sprite]);
    const aura = applyEffect(sprite, 'flameaura');
    // 그림에서 멀리 떨어진 빈 칸(맨 위 왼쪽 모서리 근처)은 비어 있어야 한다
    expect(aura[0]!.slice(0, 2)).toBe('..');
    const colored = spriteSet('cat', 'adult', { variant: 'default', accessory: 'none', effect: 'flameaura' });
    expect(colored.palette['U']).toBeDefined();
    expect(colored.frames.idleA.join('')).toContain('U');
  });
});

describe('꾸미기 창과 설정', () => {
  const g = emptyGrowth();

  it('목 장식·효과는 뽑아서 얻어야만 열린다("없음"은 늘 쓴다)', () => {
    expect(neckUnlocked('none')).toBe(true);
    expect(neckUnlocked('bell')).toBe(false);
    expect(neckUnlocked('bell', { accessories: [], variants: [], species: [], necks: ['bell'] })).toBe(true);
    expect(effectUnlocked('hearts')).toBe(false);
    const v = buildWardrobe(g, { speciesId: 'cat', variant: 'default', accessory: 'none' });
    expect(v.necks.filter((e) => e.unlocked).map((e) => e.id)).toEqual(['none']);
    expect(v.effects.filter((e) => e.unlocked).map((e) => e.id)).toEqual(['none']);
    expect(v.necks).toHaveLength(NECKS.length);
    expect(v.effects).toHaveLength(EFFECTS.length);
  });

  it('allowedPatch 는 안 가진 목 장식·효과를 버린다', () => {
    const extra = { accessories: [], variants: [], species: [], necks: ['scarf'] as const, effects: [] as const };
    expect(allowedPatch(g, { neck: 'scarf', effect: 'hearts' }, { ...extra, necks: ['scarf'], effects: [] })).toEqual({ neck: 'scarf' });
  });

  it('설정은 모르는 값을 없음으로 돌린다', () => {
    expect(sanitizeSettings({ neck: 'bell', effect: 'snow' })).toMatchObject({ neck: 'bell', effect: 'snow' });
    expect(sanitizeSettings({ neck: 'x', effect: 7 })).toMatchObject({ neck: 'none', effect: 'none' });
  });
});

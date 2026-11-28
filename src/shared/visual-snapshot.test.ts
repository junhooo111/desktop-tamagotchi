/**
 * 그림이 의도 없이 바뀌지 않게 지키는 "그림 지문" 시험.
 * 모든 동물·꾸미기·소품·카드의 완성된 그림을 해시로 저장해 두고, 바뀌면 시험이 실패한다.
 * 그림을 일부러 바꿨다면 `npx vitest run src/shared/visual-snapshot.test.ts -u` 로 지문을 새로 저장하고,
 * 바뀐 그림을 눈으로 확인한 뒤 커밋한다(눈으로 보지 않고 -u 만 하지 않는다).
 */
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { renderProfileCard } from './card.js';
import { createPet } from './pet.js';
import { PROPS, propFrames } from './art/props.js';
import { ACCESSORIES, EFFECTS, NECKS, SPECIES, VARIANTS, hasLegendForm, spriteSet, type SpeciesId } from './species.js';

const hash = (v: unknown): string => createHash('sha1').update(JSON.stringify(v)).digest('hex').slice(0, 12);
const base = { variant: 'default', accessory: 'none', neck: 'none', effect: 'none' } as const;

describe('그림 지문', () => {
  it('모든 동물의 새끼·성체·전설 모습(걷기 4장+앉기+졸기)', () => {
    const out: Record<string, string> = {};
    for (const s of SPECIES) {
      for (const stage of ['baby', 'adult', ...(hasLegendForm(s.id as SpeciesId) ? (['legend'] as const) : [])] as const) {
        const set = spriteSet(s.id as SpeciesId, stage, base);
        out[`${s.id}/${stage}`] = hash([set.frames.idleA, set.frames.walk1, set.frames.walk3, set.frames.sitA, set.frames.sleepA, set.palette]);
      }
    }
    expect(out).toMatchSnapshot();
  });

  it('색·장식·목 장식·효과를 입힌 고양이 성체', () => {
    const out: Record<string, string> = {};
    for (const v of VARIANTS) out[`variant/${v}`] = hash(spriteSet('cat', 'adult', { ...base, variant: v }).frames.idleA);
    for (const a of ACCESSORIES) out[`accessory/${a}`] = hash(spriteSet('cat', 'adult', { ...base, accessory: a }).frames.idleA);
    for (const n of NECKS) out[`neck/${n}`] = hash(spriteSet('cat', 'adult', { ...base, neck: n }).frames.idleA);
    for (const e of EFFECTS) out[`effect/${e}`] = hash(spriteSet('cat', 'adult', { ...base, effect: e }).frames.idleA);
    expect(out).toMatchSnapshot();
  });

  it('소품 두 장씩', () => {
    const out: Record<string, string> = {};
    for (const p of PROPS) if (p !== 'none') out[p] = hash(propFrames(p));
    expect(out).toMatchSnapshot();
  });

  it('프로필 카드(소품 없음·소품 있음)', () => {
    const pet = { ...createPet('cat', 0), xp: 900 };
    expect(hash(renderProfileCard({ pet, style: base }))).toMatchSnapshot();
    expect(hash(renderProfileCard({ pet, style: base, prop: 'fish' }))).toMatchSnapshot();
  });
});

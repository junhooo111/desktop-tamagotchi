/** 개발용: 그림을 눈으로 확인하기 위한 미리보기 데이터(앱에서는 쓰지 않는다). */
import { FRAME_NAMES } from './frames.js';
import { spriteSet, type SpeciesId, type SpriteStage } from '../species.js';

/** 한 종·단계의 프레임들(only 는 쉼표로 구분한 이름들, 비우면 전부) */
export function sheet(id: string, stage: string, only?: string) {
  const set = spriteSet(id as SpeciesId, stage as SpriteStage);
  const picked = only ? only.split(',') : [];
  const names = (picked.length > 0 ? picked : [...FRAME_NAMES]) as (typeof FRAME_NAMES)[number][];
  return names.map((name) => ({ label: `${id} ${stage} ${name}`, rows: set.frames[name], palette: set.palette }));
}

/** 한 종의 성체와 새끼 프레임을 이어서(성체 먼저) 본다. */
export function both(id: string, only?: string) {
  return [...sheet(id, 'adult', only), ...sheet(id, 'baby', only)];
}

/** 모든 종의 한 프레임을 한 장에 모아 본다. */
export function overview(frame: string) {
  const out: { label: string; rows: string[]; palette: Record<string, string> }[] = [];
  const ids = ['rabbit', 'cat', 'dog', 'turtle', 'chick', 'duck'];
  for (const stage of ['adult', 'baby'] as const) {
    for (const id of ids) {
      const set = spriteSet(id as SpeciesId, stage);
      out.push({ label: `${id} ${stage}`, rows: set.frames[frame as (typeof FRAME_NAMES)[number]], palette: { ...set.palette } });
    }
  }
  const egg = spriteSet('cat', 'egg');
  out.push({ label: 'egg', rows: egg.frames[frame as (typeof FRAME_NAMES)[number]], palette: { ...egg.palette } });
  return out;
}

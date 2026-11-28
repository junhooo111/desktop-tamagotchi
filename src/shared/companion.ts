/**
 * 친구 펫 동행: 친구 펫의 종류와 경험치로 보여 줄 모습(단계)을 정한다.
 * 알 단계(경험치 부족)인 펫은 새끼 모습으로 보여 준다(알은 따라다니는 동무로 어울리지 않는다).
 */
import { ADULT_LEVEL, LEGEND_LEVEL, levelOf } from './pet.js';
import { hasLegendForm, type SpeciesId } from './species.js';

export type CompanionStage = 'baby' | 'adult' | 'legend';

export function companionStage(speciesId: SpeciesId, xp: number): CompanionStage {
  const level = levelOf(xp);
  if (level >= LEGEND_LEVEL && hasLegendForm(speciesId)) return 'legend';
  return level >= ADULT_LEVEL ? 'adult' : 'baby';
}

/** 동행 보너스(서버 companion_tick 과 같은 값. 안내 글에만 쓴다): 한 시간에 한 번, 하루 6번까지 */
export const COMPANION_TICK = { petXp: 6, friendshipXp: 3, perDay: 6 } as const;

/**
 * 상태 보기 말풍선에 보여 줄 값: 이름·단계·레벨(등급 색)·경험치, 그리고 배고픔·기분·청결을 한 줄에 하나씩 막대와 숫자로.
 * 순수 함수라서 화면 없이 테스트한다. 그리는 일은 renderer/renderer.ts 가 한다.
 */
import { xpProgress } from './card.js';
import { effectiveStage, levelOf, levelTier, stageOf, type DisplayStage, type LevelTier, type PetState } from './pet.js';
import { getSpecies } from './species.js';

export type BarKind = 'xp' | 'hunger' | 'happiness' | 'clean';
/** 막대 색: 낮으면 빨강, 중간은 노랑, 높으면 초록 */
export type BarLevel = 'low' | 'mid' | 'high';

export interface StatusBar {
  kind: BarKind;
  label: string;
  /** 막대가 찬 정도 0~100 정수 */
  value: number;
  level: BarLevel;
  /** 막대 옆에 적을 숫자(예: 67/100, 경험치는 52/110) */
  text: string;
  /** 막대 색을 직접 정할 때(경험치는 레벨 등급 색). 없으면 level 색 */
  color?: string;
}

export interface StatusBubble {
  /** 예) 콩이(병아리) · 새끼 */
  title: string;
  level: number;
  tier: LevelTier;
  /** 총 경험치 */
  xp: number;
  /** 첫 줄은 경험치(지금 레벨 안에서 쌓은 양 / 다음 레벨까지 필요한 양), 다음은 배부름·기분·청결 */
  bars: StatusBar[];
}

export const barLevelOf = (value: number): BarLevel => (value < 30 ? 'low' : value < 60 ? 'mid' : 'high');

const STAGE_NAME = { egg: '알', baby: '새끼', adult: '성체', legend: '전설' } as const;

export function buildStatus(pet: PetState, petName = '', display: DisplayStage = 'auto'): StatusBubble {
  const actual = stageOf(pet);
  const shown = effectiveStage(actual, display);
  const species = actual === 'egg' ? '알' : getSpecies(pet.speciesId).name;
  const name = petName && actual !== 'egg' ? `${petName}(${species})` : species;
  const level = levelOf(pet.xp);
  const prog = xpProgress(pet.xp);
  const bar = (kind: BarKind, label: string, raw: number): StatusBar => {
    const value = Math.min(100, Math.max(0, Math.floor(raw)));
    return { kind, label, value, level: barLevelOf(value), text: `${value}/100` };
  };
  const tier = levelTier(level);
  const into = Math.floor(prog.into);
  const xpBar: StatusBar = { kind: 'xp', label: '경험치', value: Math.min(100, Math.round((prog.into / prog.need) * 100)), level: 'high', text: `${into}/${prog.need}`, color: tier.color };
  return {
    title: `${name} · ${STAGE_NAME[shown]}`,
    level,
    tier,
    xp: Math.floor(pet.xp),
    bars: [xpBar, bar('hunger', '배부름', pet.hunger), bar('happiness', '기분', pet.happiness), bar('clean', '청결', pet.clean)],
  };
}

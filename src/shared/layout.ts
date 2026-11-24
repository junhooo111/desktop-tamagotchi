/** 창과 펫의 크기. 펫은 마우스 커서 정도(32~48px)로 작게 보인다. */
import type { Stage } from './pet.js';
import { SIZE } from './pixel.js';

/**
 * 투명 창 크기. 펫은 아래쪽 가운데에 서고, 그 위쪽이 말풍선·점프 자리다.
 * 펫이 없는 투명한 부분은 클릭이 아래 창으로 통과하므로 커도 방해되지 않는다.
 * 폭은 말풍선(240)에 더해, 펫이 화면 끝에 있을 때 말풍선을 안쪽으로 밀 거리(약 104)를 양쪽에 담는다.
 */
export const WINDOW = { width: 460, height: 410 } as const;

/** 그림 한 칸이 화면 몇 픽셀인지 */
export const STAGE_SCALE: Record<Stage, number> = { egg: 2, baby: 2, adult: 3 };

/**
 * FE 지식 말풍선의 폭과 최대 높이.
 * 기본은 150~210px 이고 `코드 보기`를 펼치면 가장 긴 지식이 약 325px 까지 커진다(실제 렌더링으로 잰 값).
 */
export const TIP_BUBBLE = { width: 240, maxHeight: 330 } as const;
/** 펫 머리 위(느낌표 자리)와 말풍선 사이 간격 */
export const BUBBLE_GAP = 28;

export function petPixelSize(stage: Stage): number {
  return SIZE * STAGE_SCALE[stage];
}

/**
 * 가운데가 centerX 인 폭 width 의 말풍선이 모니터(areaLeft~areaRight) 밖으로 잘리지 않도록
 * 옆으로 밀어야 하는 거리(px). 양수면 오른쪽, 음수면 왼쪽이다.
 */
export function bubbleShift(centerX: number, width: number, areaLeft: number, areaRight: number): number {
  const left = centerX - width / 2;
  const right = centerX + width / 2;
  if (right - left > areaRight - areaLeft) return 0;
  if (left < areaLeft) return areaLeft - left;
  if (right > areaRight) return areaRight - right;
  return 0;
}

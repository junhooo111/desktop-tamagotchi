/** 창과 펫의 크기. 펫은 마우스 커서 정도(32~48px)로 작게 보인다. */
import type { Stage } from './pet.js';
import { SIZE } from './pixel.js';

/** 투명 창 크기. 펫은 아래쪽 가운데에 서고, 위쪽은 말풍선과 뛰어오를 자리다. */
export const WINDOW = { width: 160, height: 120 } as const;

/** 그림 한 칸이 화면 몇 픽셀인지 */
export const STAGE_SCALE: Record<Stage, number> = { egg: 2, baby: 2, adult: 3 };

export function petPixelSize(stage: Stage): number {
  return SIZE * STAGE_SCALE[stage];
}

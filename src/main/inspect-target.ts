/** 문제가 있는 요소 옆에 펫이 설 자리를 정한다(순수 로직). */
import type { Finding } from '../inspect/scan.js';
import { clampToAreas, type Rect } from './behavior.js';

const GAP = 6;
/** 페이지 전체 문제는 브라우저 내용 영역 위쪽 가까이에 선다 */
const PAGE_LEVEL_TOP_RATIO = 0.15;

/**
 * 요소의 왼쪽 옆에 서서 요소를 가리킨다. 왼쪽에 자리가 없으면 오른쪽에 선다.
 * 위치가 없는 문제(문서 설정 등)는 브라우저 내용 영역의 위쪽 가운데에 선다.
 * 결과는 항상 모니터 안으로 들어오도록 맞춘다.
 */
export function petTargetFor(f: Finding, size: number, areas: readonly Rect[]): { x: number; y: number } {
  if (!f.rect) {
    return clampToAreas(
      f.page.x + f.page.width / 2 - size / 2,
      f.page.y + f.page.height * PAGE_LEVEL_TOP_RATIO,
      size,
      areas,
    );
  }
  let x = f.rect.x - size - GAP;
  if (x < f.page.x) x = f.rect.x + f.rect.width + GAP;
  const y = f.rect.y + f.rect.height - size;
  return clampToAreas(x, y, size, areas);
}

/**
 * 높은 등급 꾸미기의 1칸 도트 디테일.
 *
 * 그림은 마지막에 2x2 칸으로 뭉치지만(chunky.ts), 이 글자들(H·S·Q·R)만은 뭉치지 않고 1칸 그대로 위에 얹는다.
 * 덩어리의 윗면에는 밝은 줄(H/Q), 아랫면에는 어두운 줄(S/R), 보석(Y)에는 반짝이는 점을 찍어서
 * 특별 이상의 꾸미기가 몸보다 세밀한 "보석" 같은 느낌이 나게 한다. 낮은 등급은 쓰지 않는다.
 */
import { px, rect, type Grid } from '../pixel.js';

/** 뭉치지 않고 그대로 남기는 글자(장식: H·S, 목 장식: Q·R) */
export const FINE_CHARS = 'HSQR';

/** 그림 문자 그리드(한 글자 = 2x2)가 놓인 자리(x, y)에 밝은 면·어두운 면·반짝이는 점을 찍는다. main 은 주색 글자, gem 은 보조색 글자. */
export function fineDetail(g: Grid, x: number, y: number, rows: readonly string[], chars: { hi: string; sh: string }, main: string, gem: string): void {
  const filled = (rx: number, ry: number): boolean => {
    const ch = rows[ry]?.[rx];
    return ch !== undefined && ch !== '.' && ch !== ' ';
  };
  rows.forEach((row, ry) => {
    [...row].forEach((ch, rx) => {
      const bx = x + rx * 2;
      const by = y + ry * 2;
      if (ch === main) {
        if (!filled(rx, ry - 1)) rect(g, bx, by, 2, 1, chars.hi); // 윗면
        if (!filled(rx, ry + 1)) rect(g, bx, by + 1, 2, 1, chars.sh); // 아랫면
      } else if (ch === gem) {
        px(g, bx, by, chars.hi); // 보석의 반짝이는 점
      }
    });
  });
}

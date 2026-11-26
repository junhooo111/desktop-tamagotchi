/**
 * 꾸미기 장식(리본·안경·왕관·날개)을 그리는 도구.
 *
 * 장식은 뼈대(quadruped.ts·bird.ts)가 머리·몸을 그린 자리에서 바로 이어서 그린다.
 * 그래서 걷기·앉기·자기·매달리기 같은 모든 자세에서 머리·몸을 따라다닌다.
 * 마지막에 16칸 굵기로 뭉치므로(chunky.ts) 장식도 2칸 단위(짝수 좌표)에 맞춰 그린다.
 *
 * 팔레트 글자: X = 장식의 주색, Y = 보조색(보석·매듭·테두리). 색은 ACCESSORY_COLORS.
 */
import { blank, line, part, px, rect, triangle, type Grid } from '../pixel.js';

export type Accessory = 'none' | 'ribbon' | 'glasses' | 'crown' | 'wings' | 'sprout' | 'flower' | 'partyhat' | 'halo';

export const ACCESSORIES: readonly Accessory[] = ['none', 'ribbon', 'glasses', 'crown', 'wings', 'sprout', 'flower', 'partyhat', 'halo'];

/** 장식별 색: X 주색, Y 보조색(안경의 Y 는 짙은 렌즈 색이라 선글라스로 보인다) */
export const ACCESSORY_COLORS: Record<Accessory, { X: string; Y: string }> = {
  none: { X: '#ffffff', Y: '#ffffff' },
  ribbon: { X: '#ff6b8b', Y: '#c2385a' },
  glasses: { X: '#ffffff', Y: '#2b3a55' },
  crown: { X: '#ffd84a', Y: '#e5484d' },
  wings: { X: '#fff1b8', Y: '#ffd04a' },
  sprout: { X: '#6fcf6f', Y: '#2f9a45' },
  flower: { X: '#ff9ecb', Y: '#ffd04a' },
  partyhat: { X: '#5ab8ff', Y: '#ff6b8b' },
  halo: { X: '#fff3a0', Y: '#ffd04a' },
};

export interface HeadGeom {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
}

const even = (n: number): number => Math.round(n / 2) * 2;

/** 머리에 쓰는 장식: 리본·왕관은 머리 위에, 안경은 눈 둘레에 그린다. eyes 는 눈(2x2)의 왼쪽 위 칸이다. */
export function drawHeadAccessory(g: Grid, acc: Accessory | undefined, head: HeadGeom, eyes: readonly { x: number; y: number }[]): void {
  switch (acc) {
    case 'crown': {
      // 3칸 x 2칸: 뾰족한 끝 둘과 가운데 보석
      const x = even(head.cx) - 3;
      const y = Math.max(0, even(head.cy - head.ry) - 3);
      part(
        g,
        (t) => {
          rect(t, x, y, 2, 2, 'X');
          rect(t, x + 4, y, 2, 2, 'X');
          rect(t, x, y + 2, 2, 2, 'X');
          rect(t, x + 2, y + 2, 2, 2, 'Y');
          rect(t, x + 4, y + 2, 2, 2, 'X');
        },
        { outline: 'k' },
      );
      break;
    }
    case 'ribbon': {
      // 머리 위쪽 뒤편에 단 큰 리본: 좌우 고리(4x6)와 가운데 매듭(4x2), 매듭 위아래는 비어 나비 모양이 된다 (12x6)
      const x = even(head.cx - head.rx * 0.35) - 6;
      const y = Math.max(0, even(head.cy - head.ry) - 4);
      part(
        g,
        (t) => {
          rect(t, x, y, 4, 6, 'X');
          rect(t, x + 8, y, 4, 6, 'X');
          rect(t, x + 4, y + 2, 4, 2, 'Y');
        },
        { outline: 'k' },
      );
      break;
    }
    case 'sprout': {
      // 머리 위에 돋은 새싹: 줄기 하나와 양쪽 잎 (6x6)
      const x = even(head.cx) - 3;
      const y = Math.max(0, even(head.cy - head.ry) - 5);
      part(
        g,
        (t) => {
          rect(t, x, y, 2, 2, 'X');
          rect(t, x + 4, y, 2, 2, 'X');
          rect(t, x + 2, y + 2, 2, 2, 'Y');
          rect(t, x, y + 2, 2, 2, 'X');
          rect(t, x + 4, y + 2, 2, 2, 'X');
          rect(t, x + 2, y + 4, 2, 2, 'Y');
        },
        { outline: 'k' },
      );
      break;
    }
    case 'flower': {
      // 머리 위쪽 뒤편의 꽃: 꽃잎 넷과 노란 가운데 (6x6)
      const x = even(head.cx - head.rx * 0.35) - 3;
      const y = Math.max(0, even(head.cy - head.ry) - 4);
      part(
        g,
        (t) => {
          rect(t, x + 2, y, 2, 2, 'X');
          rect(t, x, y + 2, 2, 2, 'X');
          rect(t, x + 2, y + 2, 2, 2, 'Y');
          rect(t, x + 4, y + 2, 2, 2, 'X');
          rect(t, x + 2, y + 4, 2, 2, 'X');
        },
        { outline: 'k' },
      );
      break;
    }
    case 'partyhat': {
      // 뾰족한 파티 모자: 끝에 방울, 아래로 갈수록 넓어진다 (8x8)
      const x = even(head.cx) - 4;
      const y = Math.max(0, even(head.cy - head.ry) - 6);
      part(
        g,
        (t) => {
          rect(t, x + 3, y, 2, 2, 'Y');
          rect(t, x + 2, y + 2, 4, 2, 'X');
          rect(t, x + 2, y + 4, 4, 2, 'Y');
          rect(t, x, y + 6, 8, 2, 'X');
        },
        { outline: 'k' },
      );
      break;
    }
    case 'halo': {
      // 머리 위에 떠 있는 고리 (8x4)
      const x = even(head.cx) - 4;
      const y = Math.max(0, even(head.cy - head.ry) - 6);
      part(
        g,
        (t) => {
          rect(t, x + 2, y, 4, 2, 'X');
          rect(t, x, y + 2, 2, 2, 'Y');
          rect(t, x + 6, y + 2, 2, 2, 'Y');
        },
        { outline: 'k' },
      );
      break;
    }
    case 'glasses': {
      const rings = eyes.map((e) => ({ x: e.x - (e.x & 1), y: e.y - (e.y & 1) }));
      for (const r of rings) {
        // 눈(2x2)을 둘러싼 6x6 테
        rect(g, r.x - 2, r.y - 2, 6, 2, 'Y');
        rect(g, r.x - 2, r.y + 2, 6, 2, 'Y');
        rect(g, r.x - 2, r.y, 2, 2, 'Y');
        rect(g, r.x + 2, r.y, 2, 2, 'Y');
      }
      // 눈이 둘이면(정면) 가운데를 코걸이로 잇는다
      const [a, b] = rings;
      if (a && b) {
        const left = Math.min(a.x, b.x) + 4;
        const right = Math.max(a.x, b.x) - 2;
        if (right > left) rect(g, left, a.y, right - left, 2, 'Y');
      }
      break;
    }
    default:
      break;
  }
}

/** 등에 다는 날개: (x, y)는 날개가 붙는 등 위쪽 자리. size 는 새끼 비율(0.6~1). */
export function drawBackWings(g: Grid, acc: Accessory | undefined, x: number, y: number, size: number): void {
  if (acc !== 'wings') return;
  const s = Math.max(0.7, size) * 0.72; // 날개는 작게(등을 다 덮지 않게)
  const bx = even(x);
  const by = even(y);
  part(
    g,
    (t) => {
      // 깃털 세 갈래가 위·뒤로 부채처럼 펼쳐진다
      line(t, bx, by, bx - 9 * s, by - 3 * s, 'X', 3 * s);
      line(t, bx, by, bx - 7 * s, by - 8 * s, 'X', 3 * s);
      line(t, bx, by, bx - 2 * s, by - 11 * s, 'X', 3 * s);
      // 깃털 끝
      px(t, Math.round(bx - 9 * s), Math.round(by - 3 * s), 'Y');
      px(t, Math.round(bx - 7 * s), Math.round(by - 8 * s), 'Y');
      px(t, Math.round(bx - 2 * s), Math.round(by - 11 * s), 'Y');
      triangle(t, bx + 1, by + 1, bx - 4 * s, by + 1, bx - 1, by - 3 * s, 'X');
    },
    { outline: 'k' },
  );
}

/** 테스트·미리보기용: 빈 격자에 장식만 그려 본다 */
export function accessoryOnly(acc: Accessory, head: HeadGeom, eyes: readonly { x: number; y: number }[]): Grid {
  const g = blank();
  drawHeadAccessory(g, acc, head, eyes);
  drawBackWings(g, acc, 12, 14, 1);
  return g;
}

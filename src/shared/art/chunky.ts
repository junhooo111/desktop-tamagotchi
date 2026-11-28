/**
 * 그림을 "16칸 굵기"로 뭉친다.
 *
 * 처음 만든 동물은 16x16 칸의 큼직한 덩어리 그림이라 대충 생겨서 귀여웠다.
 * 32x32 로 세세하게 그렸더니 오히려 덜 귀엽다는 의견이 있었다.
 * 그래서 움직임은 32x32 칸에서 촘촘하게(프레임이 많게) 그리되, 마지막에 2x2 칸을 한 칸으로 뭉쳐서
 * 눈·귀·무늬가 큼직한 덩어리로 보이게 한다. 결과 그림은 32x32 이지만 점 하나가 2x2 칸이다.
 */
import { SIZE } from '../pixel.js';
import { FINE_CHARS } from './detail.js';

/** 한 블록 안에서 같은 개수일 때 먼저 이기는 글자(얼굴 점이 몸 색에 먹히지 않게) */
const PRIORITY = ['e', 'n', 'm', 't', 'k'];

function pickOf(cells: readonly string[]): string {
  const counts = new Map<string, number>();
  for (const c of cells) if (c !== '.') counts.set(c, (counts.get(c) ?? 0) + 1);
  const filled = [...counts.values()].reduce((x, y) => x + y, 0);
  const k = counts.get('k') ?? 0;
  if (filled < 2 && k === 0) return '.'; // 모서리에 걸친 몸 색 한두 칸은 버린다
  // 눈·코는 2칸 이상이면 무조건 남긴다
  for (const key of ['e', 'n']) if ((counts.get(key) ?? 0) >= 2) return key;
  const edge = filled < 4; // 빈 칸이 섞인 블록 = 그림의 가장자리
  // 윤곽선은 그림 바깥 가장자리에만 남긴다. 부품 사이의 안쪽 윤곽은 단색 덩어리로 뭉갠다(처음 그림이 그랬다).
  if (edge && k >= 1) return 'k';
  let best = '';
  let bestCount = 0;
  const rank = (c: string): number => {
    const i = PRIORITY.indexOf(c);
    return i < 0 ? 99 : i;
  };
  for (const [ch, n] of counts) {
    if (ch === 'k') continue;
    if (n > bestCount || (n === bestCount && rank(ch) < rank(best))) {
      best = ch;
      bestCount = n;
    }
  }
  return best === '' ? 'k' : best;
}

export function chunky(rows: readonly string[]): string[] {
  const out: string[] = [];
  // 높은 등급 꾸미기의 1칸 디테일(FINE_CHARS)은 블록 색을 정할 때 빈 칸으로 보고, 뭉친 뒤 제자리에 다시 얹는다.
  const fine = (c: string | undefined): c is string => c !== undefined && FINE_CHARS.includes(c);
  for (let by = 0; by < SIZE; by += 2) {
    let a = '';
    let b = '';
    for (let bx = 0; bx < SIZE; bx += 2) {
      const raw = [rows[by]?.[bx], rows[by]?.[bx + 1], rows[by + 1]?.[bx], rows[by + 1]?.[bx + 1]];
      const cells = raw.map((c) => (fine(c) || c === undefined ? '.' : c));
      const ch = pickOf(cells);
      a += (fine(raw[0]) ? raw[0] : ch) + (fine(raw[1]) ? raw[1] : ch);
      b += (fine(raw[2]) ? raw[2] : ch) + (fine(raw[3]) ? raw[3] : ch);
    }
    out.push(a, b);
  }
  return out;
}

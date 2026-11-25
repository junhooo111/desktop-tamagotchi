/** 알: 얼굴이 없어서 기울어짐·찌그러짐·늘어남 몇 가지 모양만 있다. 걸을 때는 좌우로 뒤뚱거린다. */
import { blank, ellipse, markEllipse, part, px, toRows } from '../pixel.js';
import { tone } from './color.js';
import { FRAME_NAMES, type FrameName, type Frames } from './frames.js';
import { SHADE, makeLook } from './types.js';

export const EGG_LOOK = makeLook({
  fur: '#fff3d4',
  outline: '#a37c4a',
  belly: tone('#ffe7b0'),
  accent: tone('#f1bd60'),
});

type EggShape = 'rest' | 'squash' | 'tall';

function egg(shape: EggShape): string[] {
  const g = blank();
  const [cy, rx, ry] = shape === 'squash' ? [23.2, 7.9, 7.4] : shape === 'tall' ? [21.4, 6.5, 9.3] : [22, 7, 8.6];
  part(
    g,
    (t) => {
      ellipse(t, 16, cy, rx, ry, 'f');
      markEllipse(t, 16 - rx * 0.25, cy - ry * 0.5, rx * 0.35, ry * 0.22, 'h'); // 왼쪽 위 반짝임
      for (const [x, y] of [[13, 19], [19, 24], [12, 26], [20, 19], [16, 28]] as const) {
        const dy = shape === 'squash' ? 1 : shape === 'tall' ? -0.6 : 0;
        px(t, x, y + dy, 'a');
        px(t, x + 1, y + dy, 'a');
      }
    },
    { outline: 'k', shade: SHADE },
  );
  return toRows(g);
}

/** 위쪽일수록 많이 밀어서 밑동을 축으로 기울인 것처럼 보이게 한다. */
function tilt(rows: string[], dir: -1 | 1): string[] {
  return rows.map((row, y) => {
    const off = Math.round((dir * Math.max(0, 29 - y) * 1.6) / 9);
    if (off === 0) return row;
    return off > 0 ? '.'.repeat(off) + row.slice(0, row.length - off) : row.slice(-off) + '.'.repeat(-off);
  });
}

export function eggFrames(): Frames {
  const rest = egg('rest');
  const left = tilt(rest, -1);
  const right = tilt(rest, 1);
  const squash = egg('squash');
  const tall = egg('tall');
  const map: Partial<Record<FrameName, string[]>> = {
    walk1: left,
    walk3: right,
    run1: left,
    run3: right,
    jumpCrouch: squash,
    jumpUp: tall,
    jumpPeak: tall,
    alertA: tall,
    happyA: tall,
    climbA: left,
    climbB: right,
    slipA: left,
    slipB: right,
    hangA: left,
    hangB: right,
    fall: tall,
  };
  return Object.fromEntries(FRAME_NAMES.map((n) => [n, map[n] ?? rest])) as Frames;
}

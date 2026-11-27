/**
 * 히든 동물(용·청룡·백호·기린 …)을 알아볼 수 있게 하는 그림 부품: 등 지느러미·가시, 갈기, 얼굴 줄무늬, 긴 수염.
 *
 * 기존 네발 뼈대 위에 얹는 장식이다. 장식 문자: p 뿔·날개(종마다 다른 금빛), a 무늬, i 갈기·지느러미 색, h 밝은 털.
 * 작은 그림에서 읽히도록 덩어리를 크게(2칸 단위) 그린다.
 */
import { ellipse, line, part, triangle, SIZE, type Grid } from '../pixel.js';

/** 등을 따라 난 장식: spikes 는 뾰족한 가시(용), fin 은 물결 지느러미(청룡) */
export type Crest = 'spikes' | 'fin';
/** 얼굴 뒤·아래로 뻗는 갈기: ruff 는 풍성한 볼 털(호랑이), flame 은 불꽃(기린·전설 용) */
export type Mane = 'ruff' | 'flame' | 'lion';
/** 머리 장식 무늬: tiger 는 이마의 임금 왕(王)자 줄무늬와 볼 줄무늬 */
export type Markings = 'tiger' | 'panda' | 'mask' | 'cheeks';

interface Head {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
}

/** 털(f·F·h·b·B)이 칠해진 칸에만 무늬를 칠한다(윤곽선·빈 칸은 건드리지 않는다). */
export function paintFur(g: Grid, x: number, y: number, w: number, h: number, c: string): void {
  for (let yy = Math.round(y); yy < Math.round(y + h); yy++) {
    for (let xx = Math.round(x); xx < Math.round(x + w); xx++) {
      if (xx < 0 || xx >= SIZE) continue;
      const row = g[yy];
      if (row && 'fFhbB'.includes(row[xx] ?? '.')) row[xx] = c;
    }
  }
}

/** 등 위의 가시·지느러미. (x, y)는 날개가 붙는 등 위쪽 자리이고, 꼬리 쪽(왼쪽)으로 이어 그린다. */
export function drawBackCrest(g: Grid, crest: Crest | undefined, x: number, y: number, size: number): void {
  if (!crest) return;
  const count = size < 0.8 ? 3 : 4;
  const step = Math.max(2.4, 3.2 * size);
  part(
    g,
    (t) => {
      for (let i = 0; i < count; i++) {
        const bx = x + 3 * size - i * step;
        const by = y + 1 + i * 0.6 * size; // 꼬리 쪽으로 갈수록 등이 낮아진다
        const h = (crest === 'spikes' ? 4.4 : 3.6) * size;
        const w = (crest === 'spikes' ? 1.9 : 2.4) * size;
        if (crest === 'spikes') triangle(t, bx - w, by, bx + w, by, bx - 0.4, by - h, 'a');
        else triangle(t, bx - w, by, bx + w, by, bx + 1.4 * size, by - h, 'i'); // 지느러미는 뒤로 휘어 눕는다
      }
    },
    { outline: 'k' },
  );
}

/** 머리 뒤·아래로 뻗은 갈기. 머리보다 먼저 그려서 머리가 밑동을 덮게 한다. */
export function drawMane(g: Grid, mane: Mane | undefined, head: Head): void {
  if (!mane) return;
  if (mane === 'lion') {
    // 사자: 얼굴을 빙 둘러싸는 큼직한 갈기(머리 뒤쪽이 더 두툼하다)와, 아래로 처지는 갈기 끝
    part(
      g,
      (t) => {
        ellipse(t, head.cx - head.rx * 0.18, head.cy + head.ry * 0.08, head.rx * 1.42, head.ry * 1.36, 'i');
        triangle(t, head.cx - head.rx * 1.1, head.cy + head.ry * 0.5, head.cx - head.rx * 0.2, head.cy + head.ry * 1.2, head.cx - head.rx * 0.7, head.cy + head.ry * 1.75, 'i');
      },
      { outline: 'k' },
    );
    return;
  }
  const color = mane === 'ruff' ? 'h' : 'i';
  const tips: [number, number, number][] =
    mane === 'ruff'
      ? [
          [-1.15, 0.35, 3.2], // 뒤쪽 볼 털
          [-0.8, 0.95, 3.4],
          [-0.2, 1.25, 3.2],
          [0.45, 1.2, 2.6],
        ]
      : [
          [-0.55, -1.25, 5.4], // 불꽃 갈기: 뒤통수에서 위·뒤로 솟는 큰 불꽃 넷
          [-1.0, -0.95, 5.6],
          [-1.3, -0.35, 5],
          [-1.25, 0.35, 4.2],
        ];
  part(
    g,
    (t) => {
      for (const [ux, uy, len] of tips) {
        const bx = head.cx + ux * head.rx * 0.55;
        const by = head.cy + uy * head.ry * 0.55;
        const tx = head.cx + ux * (head.rx + len);
        const ty = head.cy + uy * (head.ry + len * 0.7) - (mane === 'flame' ? 1 : 0);
        triangle(t, bx - 2.8, by - 2.4, bx + 2.8, by + 2.4, tx, ty, color);
      }
    },
    { outline: 'k' },
  );
}

/** 얼굴 무늬(머리를 그린 다음에 털 위에만 칠한다). */
export function drawMarkings(g: Grid, markings: Markings | undefined, head: Head, eyeX: number, eyeY: number): void {
  if (markings === 'panda') {
    // 판다: 눈 둘레의 까만 눈 무늬(눈동자는 그대로 남는다)
    paintFur(g, eyeX - 2, eyeY - 1, 6, 5, 'a');
    return;
  }
  if (markings === 'cheeks') {
    // 레서판다: 눈 위의 하얀 눈썹 점과, 주둥이에서 볼로 퍼지는 하얀 무늬, 눈 아래로 흐르는 눈물 자국
    paintFur(g, eyeX - 1, eyeY - 3, 3, 1, 'i');
    paintFur(g, head.cx - head.rx * 0.1, head.cy + head.ry * 0.2, head.rx * 1.1, head.ry * 0.8, 'i');
    paintFur(g, eyeX - 1, eyeY + 2, 1, 3, 'a');
    return;
  }
  if (markings === 'mask') {
    // 너구리: 눈을 가로질러 뒤로 뻗는 도둑 가면 무늬
    paintFur(g, eyeX - 4, eyeY - 1, 8, 3, 'a');
    paintFur(g, eyeX - 3, eyeY + 2, 5, 1, 'a');
    return;
  }
  if (markings !== 'tiger') return;
  // 이마: 눈 위에 굵은 세로 줄 셋(왕(王)자처럼 가운데가 길다)
  const top = head.cy - head.ry + 1;
  paintFur(g, eyeX - 4, top, 2, 3, 'a');
  paintFur(g, eyeX - 1, top, 2, 4, 'a');
  paintFur(g, eyeX + 2, top, 2, 3, 'a');
  // 볼: 눈 아래에서 뒤로 뻗는 가로 줄 둘
  paintFur(g, head.cx - head.rx * 0.9, head.cy + head.ry * 0.05, 4, 1, 'a');
  paintFur(g, head.cx - head.rx * 0.75, head.cy + head.ry * 0.45, 4, 1, 'a');
}

/** 청룡의 긴 수염: 코 옆에서 뒤로 물결치며 흐른다(윤곽선 없이 금빛 선). */
export function drawStreamers(g: Grid, noseX: number, noseY: number): void {
  line(g, noseX - 2, noseY + 2, noseX - 7, noseY + 5, 'p', 2);
  line(g, noseX - 7, noseY + 5, noseX - 11, noseY + 3, 'p', 2);
  line(g, noseX - 2, noseY, noseX - 8, noseY - 1, 'p', 2);
}

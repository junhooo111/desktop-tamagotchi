/**
 * 산책 중에 펫이 남기는 응가 그림. 작은 창에 띄우는 HTML 한 장(도트 SVG + 사라지는 애니메이션)을 만든다.
 * 순수 함수라서 창 없이 테스트한다. 창 만들기·없애기는 main 이 맡는다.
 */

/** 응가가 화면에 남아 있는 시간(ms). 끝나기 전 마지막 3초는 흐려지며 사라진다. */
export const POOP_LIFE_MS = 25_000;
export const POOP_FADE_MS = 3_000;
/** 그림 한 칸의 픽셀 */
export const POOP_UNIT = 3;

const ROWS = [
  '....kk..',
  '...kffk.',
  '..kffffk',
  '.kfhffek',
  '.kffffek',
  'kfffeffk',
  'kffffffk',
  '.kkkkkk.',
];

const COLORS: Record<string, string> = { k: '#4a2e1a', f: '#9b6a3a', h: '#c99a63', e: '#2a1a10' };

export const POOP_SIZE = { width: ROWS[0]!.length * POOP_UNIT, height: ROWS.length * POOP_UNIT } as const;

export function poopSvg(): string {
  const rects: string[] = [];
  ROWS.forEach((row, y) => {
    [...row].forEach((ch, x) => {
      const fill = COLORS[ch];
      if (fill) rects.push(`<rect x="${x * POOP_UNIT}" y="${y * POOP_UNIT}" width="${POOP_UNIT}" height="${POOP_UNIT}" fill="${fill}"/>`);
    });
  });
  const { width, height } = POOP_SIZE;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" shape-rendering="crispEdges">${rects.join('')}</svg>`;
}

/** 응가 창에 띄울 HTML(스크립트 없음). 생긴 뒤 POOP_LIFE_MS 가 지나면 창을 닫으므로, 마지막 구간에 흐려지게만 해 둔다. */
export function poopHtml(): string {
  const fadeDelay = POOP_LIFE_MS - POOP_FADE_MS;
  return [
    '<!doctype html><meta charset="utf-8">',
    `<style>html,body{margin:0;background:transparent;overflow:hidden}svg{display:block;animation:fade ${POOP_FADE_MS}ms linear ${fadeDelay}ms forwards}@keyframes fade{to{opacity:0}}</style>`,
    poopSvg(),
  ].join('');
}

/**
 * 산책 중에 펫이 남기는 응가 그림. 작은 창에 띄우는 HTML 한 장(도트 SVG + 나타나고 사라지는 애니메이션)을 만든다.
 * 크기는 마우스 커서의 절반쯤(약 18px)이고, 눈과 웃는 입이 있는 귀여운 모양이다. 누르면 바로 사라진다.
 * 순수 함수라서 창 없이 테스트한다. 창 만들기·없애기는 main 이 맡는다.
 */

/** 응가가 화면에 남아 있는 시간(ms). 끝나기 전 마지막 3초는 흐려지며 사라진다. */
export const POOP_LIFE_MS = 25_000;
export const POOP_FADE_MS = 3_000;
/** 눌렀을 때 사라지는 연출 시간(ms) */
export const POOP_POP_MS = 160;
/** 그림 한 칸의 픽셀(9x8 칸이라 18x16px) */
export const POOP_UNIT = 2;

// k 윤곽선 · f 몸 · h 하이라이트 · e 눈 · m 입 · r 볼터치
const ROWS = [
  '....k....',
  '...kfk...',
  '..kfhfk..',
  '.kfffffk.',
  '.kfefefk.',
  'kfrfmfrfk',
  'kfffffffk',
  '.kkkkkkk.',
];

const COLORS: Record<string, string> = { k: '#5a3a22', f: '#a8743f', h: '#d9a468', e: '#2a1a10', m: '#2a1a10', r: '#f0a090' };

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

/**
 * 응가 창에 띄울 HTML. 통통 튀며 나타나고, 마지막 POOP_FADE_MS 동안 흐려진다.
 * 누르면 줄어들며 창을 닫는다(이 한 줄짜리 스크립트가 유일한 스크립트이고, 밖으로 나가는 요청은 없다).
 */
export function poopHtml(): string {
  const fadeDelay = POOP_LIFE_MS - POOP_FADE_MS;
  return [
    '<!doctype html><meta charset="utf-8">',
    '<style>',
    'html,body{margin:0;background:transparent;overflow:hidden;cursor:pointer;user-select:none}',
    `svg{display:block;transform-origin:50% 100%;animation:pop 320ms ease-out,fade ${POOP_FADE_MS}ms linear ${fadeDelay}ms forwards}`,
    `svg.bye{animation:bye ${POOP_POP_MS}ms ease-in forwards}`,
    '@keyframes pop{0%{transform:scale(0)}60%{transform:scale(1.25,.85)}80%{transform:scale(.92,1.1)}100%{transform:scale(1)}}',
    '@keyframes fade{to{opacity:0}}',
    '@keyframes bye{to{transform:scale(0);opacity:0}}',
    '</style>',
    poopSvg(),
    `<script>document.addEventListener('mousedown',function(){document.querySelector('svg').className.baseVal='bye';setTimeout(function(){window.close()},${POOP_POP_MS})})</script>`,
  ].join('');
}

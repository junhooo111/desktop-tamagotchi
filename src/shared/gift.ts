/**
 * 선물 상자: 하루에 두세 번 펫이 "선물을 가져왔어요!" 하고 선물 상자를 들고 온다. 누르면 뽑기권·경험치·응가(꽝) 중 하나가 나온다.
 * 순수 함수라서 창·시계·난수 없이 테스트한다. 창 만들기와 보상 지급은 main 이 맡는다.
 */
import type { Collection } from './collection.js';

/** 하루에 가져오는 선물 수의 상한 */
export const GIFTS_PER_DAY = 3;
/** 선물을 가져오는 간격(ms)의 범위: 켜 두고 2~4시간마다(하루 두세 번) */
export const GIFT_GAP_MS = { min: 2 * 3_600_000, max: 4 * 3_600_000 } as const;
/** 켠 뒤 첫 선물까지(ms) */
export const FIRST_GIFT_MS = { min: 20 * 60_000, max: 60 * 60_000 } as const;
/** 선물 상자를 누르지 않으면 사라지는 시간 */
export const GIFT_LIFE_MS = 3 * 60_000;
/** 경험치 선물의 양 */
export const GIFT_XP = { min: 5, max: 15 } as const;

export type GiftResult = { kind: 'ticket'; tickets: number } | { kind: 'xp'; xp: number } | { kind: 'dud' };

/** 뽑기권 15%, 경험치 50%, 응가(꽝) 35% */
export const GIFT_CHANCE = { ticket: 0.15, xp: 0.5 } as const;

export function rollGift(rng: () => number): GiftResult {
  const r = rng();
  if (r < GIFT_CHANCE.ticket) return { kind: 'ticket', tickets: 1 };
  if (r < GIFT_CHANCE.ticket + GIFT_CHANCE.xp) return { kind: 'xp', xp: GIFT_XP.min + Math.floor(rng() * (GIFT_XP.max - GIFT_XP.min + 1)) };
  return { kind: 'dud' };
}

/** 다음 선물까지 기다리는 시간(ms). first 면 켠 직후의 첫 선물이다. */
export function nextGiftDelayMs(rng: () => number, first = false): number {
  const { min, max } = first ? FIRST_GIFT_MS : GIFT_GAP_MS;
  return Math.round(min + rng() * (max - min));
}

/** 오늘 선물을 더 가져올 수 있으면 오늘 횟수를 올려 돌려주고, 한도를 채웠으면 ok=false. today 는 'YYYY-MM-DD'. */
export function offerGift(c: Collection, today: string): { collection: Collection; ok: boolean } {
  const day = c.giftDay === today ? c : { ...c, giftDay: today, giftsToday: 0 };
  if (day.giftsToday >= GIFTS_PER_DAY) return { collection: day, ok: false };
  return { collection: { ...day, giftsToday: day.giftsToday + 1 }, ok: true };
}

/** 선물 결과를 펫이 하는 말로 만든다. */
export function giftText(result: GiftResult): string {
  switch (result.kind) {
    case 'ticket':
      return `🎁 뽑기권 ${result.tickets}장이 들어 있었어요!`;
    case 'xp':
      return `🎁 경험치 +${result.xp}!`;
    case 'dud':
      return '🎁 …앗, 응가였어요! 꽝이에요 😢';
  }
}

// ---- 선물 상자 그림(작은 창에 띄운다) ----

/** 그림 한 칸의 픽셀(11x12 칸이라 22x24px) */
export const GIFT_UNIT = 2;
/** 창 크기: 위아래로 통통 튈 여유를 둔다 */
export const GIFT_WINDOW = { width: 30, height: 34 } as const;

// k 윤곽선 · y 리본 매듭 · r 리본 · P 뚜껑 · p 상자
const ROWS = [
  '..kkk.kkk..',
  '.kyyykyyyk.',
  '.kyykrkyyk.',
  '..kkkrkkk..',
  'kkkkkrkkkkk',
  'kPPPPrPPPPk',
  'kPPPPrPPPPk',
  'kkkkkrkkkkk',
  'kpppprppppk',
  'krrrrrrrrrk',
  'kpppprppppk',
  'kkkkkkkkkkk',
];
const COLORS: Record<string, string> = { k: '#5a2a3a', y: '#ffd84a', r: '#ff4f6e', P: '#ff9ec0', p: '#ff7aa8' };

export function giftSvg(): string {
  const rects: string[] = [];
  ROWS.forEach((row, y) => {
    [...row].forEach((ch, x) => {
      const fill = COLORS[ch];
      if (fill) rects.push(`<rect x="${x * GIFT_UNIT}" y="${y * GIFT_UNIT}" width="${GIFT_UNIT}" height="${GIFT_UNIT}" fill="${fill}"/>`);
    });
  });
  const w = ROWS[0]!.length * GIFT_UNIT;
  const h = ROWS.length * GIFT_UNIT;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" shape-rendering="crispEdges">${rects.join('')}</svg>`;
}

/**
 * 선물 창에 띄울 HTML: 통통 튀는 선물 상자. 누르면 메인에 알리고(giftApi.open) 상자는 줄어들며 사라진다.
 * 스크립트는 클릭 한 줄뿐이고, giftApi 는 preload(static/gift-preload.cjs)가 열어 주는 '열었어요' 신호 하나뿐이다.
 */
export function giftHtml(): string {
  return [
    '<!doctype html><meta charset="utf-8">',
    '<style>',
    'html,body{margin:0;background:transparent;overflow:hidden;cursor:pointer;user-select:none}',
    'body{display:flex;align-items:flex-end;justify-content:center;height:100vh}',
    'svg{display:block;margin-bottom:2px;animation:bob 900ms ease-in-out infinite}',
    'svg.bye{animation:bye 160ms ease-in forwards}',
    '@keyframes bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}',
    '@keyframes bye{to{transform:scale(0);opacity:0}}',
    '</style>',
    giftSvg(),
    "<script>document.addEventListener('mousedown',function(){document.querySelector('svg').className.baseVal='bye';window.giftApi.open()})</script>",
  ].join('');
}

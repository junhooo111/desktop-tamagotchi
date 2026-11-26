import { describe, expect, it } from 'vitest';
import { startCollection } from './collection.js';
import {
  FIRST_GIFT_MS,
  GIFTS_PER_DAY,
  GIFT_CHANCE,
  GIFT_GAP_MS,
  GIFT_UNIT,
  GIFT_XP,
  giftHtml,
  giftSvg,
  giftText,
  nextGiftDelayMs,
  offerGift,
  rollGift,
} from './gift.js';
import { createPet } from './pet.js';
import { ACCESSORIES, VARIANTS } from './species.js';
import { sanitizeCollection } from './collection.js';

const NOW = 1_000_000;
const start = () => startCollection({ ...createPet('cat', NOW), xp: 300 }, NOW);
const seq = (...values: number[]) => {
  let i = 0;
  return () => values[Math.min(i++, values.length - 1)] ?? 0;
};

describe('선물 결과 뽑기', () => {
  it('뽑기권 15% · 경험치 50% · 응가(꽝) 35% 구간으로 나뉜다', () => {
    expect(rollGift(() => 0)).toEqual({ kind: 'ticket', tickets: 1 });
    expect(rollGift(() => GIFT_CHANCE.ticket - 0.001)).toMatchObject({ kind: 'ticket' });
    expect(rollGift(seq(GIFT_CHANCE.ticket, 0)).kind).toBe('xp');
    expect(rollGift(seq(GIFT_CHANCE.ticket + GIFT_CHANCE.xp - 0.001, 0)).kind).toBe('xp');
    expect(rollGift(() => GIFT_CHANCE.ticket + GIFT_CHANCE.xp)).toEqual({ kind: 'dud' });
    expect(rollGift(() => 0.999)).toEqual({ kind: 'dud' });
  });

  it('경험치는 5~15 사이다', () => {
    expect(rollGift(seq(0.2, 0))).toEqual({ kind: 'xp', xp: GIFT_XP.min });
    expect(rollGift(seq(0.2, 0.9999))).toEqual({ kind: 'xp', xp: GIFT_XP.max });
    for (let i = 0; i < 200; i++) {
      const r = rollGift(seq(0.3, i / 200));
      expect(r.kind === 'xp' && r.xp >= GIFT_XP.min && r.xp <= GIFT_XP.max).toBe(true);
    }
  });

  it('난수를 고르게 뿌리면 비율이 맞는다(꽝이 가장 흔한 결과 중 하나지만 뽑기권은 드물다)', () => {
    const counts = { ticket: 0, xp: 0, dud: 0 };
    const N = 10_000;
    for (let i = 0; i < N; i++) counts[rollGift(seq((i + 0.5) / N, 0.5)).kind]++;
    expect(counts.ticket / N).toBeCloseTo(0.15, 2);
    expect(counts.xp / N).toBeCloseTo(0.5, 2);
    expect(counts.dud / N).toBeCloseTo(0.35, 2);
  });

  it('결과 문구: 뽑기권·경험치·꽝', () => {
    expect(giftText({ kind: 'ticket', tickets: 1 })).toContain('뽑기권 1장');
    expect(giftText({ kind: 'xp', xp: 9 })).toContain('경험치 +9');
    expect(giftText({ kind: 'dud' })).toContain('응가');
    expect(giftText({ kind: 'dud' })).toContain('꽝');
  });
});

describe('선물을 가져오는 때', () => {
  it('하루에 2~3번 오도록 간격은 2~4시간, 켠 직후 첫 선물은 20~60분 뒤', () => {
    expect(nextGiftDelayMs(() => 0)).toBe(GIFT_GAP_MS.min);
    expect(nextGiftDelayMs(() => 1)).toBe(GIFT_GAP_MS.max);
    expect(nextGiftDelayMs(() => 0, true)).toBe(FIRST_GIFT_MS.min);
    expect(nextGiftDelayMs(() => 1, true)).toBe(FIRST_GIFT_MS.max);
    expect(GIFT_GAP_MS.min).toBeGreaterThanOrEqual(2 * 3_600_000);
  });

  it(`하루에 ${GIFTS_PER_DAY}번까지만 가져오고, 날짜가 바뀌면 다시 센다`, () => {
    let c = start();
    for (let i = 0; i < GIFTS_PER_DAY; i++) {
      const r = offerGift(c, '2026-11-27');
      expect(r.ok, `${i + 1}번째`).toBe(true);
      c = r.collection;
    }
    expect(c.giftsToday).toBe(GIFTS_PER_DAY);
    const over = offerGift(c, '2026-11-27');
    expect(over.ok).toBe(false);
    expect(over.collection.giftsToday).toBe(GIFTS_PER_DAY);
    const next = offerGift(c, '2026-11-28');
    expect(next.ok).toBe(true);
    expect(next.collection).toMatchObject({ giftDay: '2026-11-28', giftsToday: 1 });
  });

  it('저장 파일에 없던 값은 0 으로 읽고, 이상한 값은 걸러 낸다', () => {
    const raw = JSON.parse(JSON.stringify(start()));
    delete raw.giftsToday;
    delete raw.giftDay;
    expect(sanitizeCollection(raw, ACCESSORIES, VARIANTS)).toMatchObject({ giftsToday: 0, giftDay: '' });
    expect(sanitizeCollection({ ...raw, giftsToday: -2, giftDay: 'x' }, ACCESSORIES, VARIANTS)).toMatchObject({ giftsToday: 0, giftDay: '' });
    expect(sanitizeCollection({ ...raw, giftsToday: 2, giftDay: '2026-11-27' }, ACCESSORIES, VARIANTS)).toMatchObject({ giftsToday: 2, giftDay: '2026-11-27' });
  });
});

describe('선물 상자 그림', () => {
  it('도트 SVG(22x24px)이고 리본·뚜껑 색이 있다', () => {
    const svg = giftSvg();
    expect(svg).toContain(`width="${11 * GIFT_UNIT}" height="${12 * GIFT_UNIT}"`);
    expect(svg).toContain('#ff4f6e'); // 리본
    expect(svg).toContain('#ff9ec0'); // 뚜껑
    expect(svg).not.toMatch(/<script|https?:\/\/(?!www\.w3\.org)/);
  });

  it('HTML: 통통 튀고, 누르면 줄어들며 메인에 열었다고만 알린다(스크립트 한 줄, 외부 요청 없음)', () => {
    const html = giftHtml();
    expect(html).toContain('@keyframes bob');
    expect(html.match(/<script>/g)).toHaveLength(1);
    expect(html).toContain("addEventListener('mousedown'");
    expect(html).toContain('window.giftApi.open()');
    expect(html).not.toMatch(/fetch\(|XMLHttpRequest|https?:\/\/(?!www\.w3\.org)|eval\(/);
  });
});

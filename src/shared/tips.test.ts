import { describe, expect, it } from 'vitest';
import { TIPS, TIP_EVERY_MS, pickTip, shouldOfferTip, tipText, type TipGate } from './tips.js';

describe('지식 목록', () => {
  it('id 가 겹치지 않고 모든 항목이 채워져 있다', () => {
    expect(new Set(TIPS.map((t) => t.id)).size).toBe(TIPS.length);
    for (const t of TIPS) {
      expect(t.title.trim().length, t.id).toBeGreaterThan(0);
      expect(t.body.trim().length, t.id).toBeGreaterThan(0);
      expect(t.code.trim().length, t.id).toBeGreaterThan(0);
    }
    expect(TIPS.length).toBeGreaterThanOrEqual(15);
  });
});

describe('pickTip', () => {
  it('아직 안 본 지식만 고른다', () => {
    const seen = TIPS.slice(1).map((t) => t.id);
    for (const r of [0, 0.5, 0.999, 1]) expect(pickTip(seen, () => r).id).toBe(TIPS[0]?.id);
  });

  it('난수에 따라 목록 안에서 고르고, 범위를 넘지 않는다', () => {
    expect(pickTip([], () => 0).id).toBe(TIPS[0]?.id);
    expect(pickTip([], () => 1).id).toBe(TIPS[TIPS.length - 1]?.id);
  });

  it('다 봤으면 처음부터 다시 돈다', () => {
    const all = TIPS.map((t) => t.id);
    expect(pickTip(all, () => 0).id).toBe(TIPS[0]?.id);
  });
});

describe('shouldOfferTip', () => {
  const gate = (over: Partial<TipGate> = {}): TipGate => ({
    now: 100 * 60_000,
    lastTipAt: 0,
    mode: 'idle',
    stage: 'adult',
    busy: false,
    roomAbove: true,
    ...over,
  });

  it('간격이 지났고 가만히 있고 바쁘지 않으면 알려 준다', () => {
    expect(shouldOfferTip(gate())).toBe(true);
    expect(shouldOfferTip(gate({ now: TIP_EVERY_MS, lastTipAt: 0 }))).toBe(true);
    expect(shouldOfferTip(gate({ now: TIP_EVERY_MS - 1, lastTipAt: 0 }))).toBe(false);
  });

  it('알이거나, 다른 일을 하거나, 바쁘면 알리지 않는다', () => {
    expect(shouldOfferTip(gate({ stage: 'egg' }))).toBe(false);
    expect(shouldOfferTip(gate({ mode: 'sleep' }))).toBe(false);
    expect(shouldOfferTip(gate({ mode: 'walk' }))).toBe(false);
    expect(shouldOfferTip(gate({ busy: true }))).toBe(false);
  });

  it('위쪽에 말풍선이 들어갈 자리가 없으면 알리지 않는다', () => {
    expect(shouldOfferTip(gate({ roomAbove: false }))).toBe(false);
  });
});

describe('shouldOfferTip 의 알림 주기 설정', () => {
  const base = { now: 100 * 60_000, lastTipAt: 0, mode: 'idle' as const, stage: 'adult' as const, busy: false, roomAbove: true };

  it('주기를 안 주면 기본(20분)을 쓴다', () => {
    expect(shouldOfferTip({ ...base, now: 19 * 60_000 })).toBe(false);
    expect(shouldOfferTip({ ...base, now: 20 * 60_000 })).toBe(true);
  });

  it('주기를 주면 그 간격이 지나야 알린다', () => {
    expect(shouldOfferTip({ ...base, now: 9 * 60_000, everyMs: 10 * 60_000 })).toBe(false);
    expect(shouldOfferTip({ ...base, now: 10 * 60_000, everyMs: 10 * 60_000 })).toBe(true);
  });

  it('Infinity 면(알림 끔) 아무리 지나도 알리지 않는다', () => {
    expect(shouldOfferTip({ ...base, now: 10_000 * 60_000, everyMs: Infinity })).toBe(false);
  });
});

describe('FE 지식 한/영', () => {
  it('지식이 60개 이상이고, 모두 한국어·영어 제목과 본문이 채워져 있다', () => {
    expect(TIPS.length).toBeGreaterThanOrEqual(60);
    for (const t of TIPS) {
      expect(t.en?.title.trim(), t.id).toBeTruthy();
      expect(t.en?.body.trim(), t.id).toBeTruthy();
      expect(/[가-힣]/.test(t.en?.title ?? ''), t.id + ' 영어 제목에 한글').toBe(false);
      expect(/[가-힣]/.test(t.en?.body ?? ''), t.id + ' 영어 본문에 한글').toBe(false);
    }
  });

  it('언어에 맞는 제목·본문을 고르고, 참고 링크는 본문 끝에 붙인다', () => {
    const plain = TIPS.find((t) => !t.source)!;
    expect(tipText(plain, 'ko')).toEqual({ title: plain.title, body: plain.body });
    expect(tipText(plain, 'en')).toEqual(plain.en);
    const sourced = TIPS.find((t) => t.source)!;
    expect(tipText(sourced, 'ko').body).toContain('참고: ' + sourced.source!.label);
    expect(tipText(sourced, 'en').body).toContain('Reference: ' + sourced.source!.label);
    expect(tipText(sourced, 'en').body).toContain(sourced.source!.url);
  });

  it('참고 링크는 https 주소만 쓴다', () => {
    for (const t of TIPS) if (t.source) expect(t.source.url, t.id).toMatch(/^https:\/\//);
  });
});

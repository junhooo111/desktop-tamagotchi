import { describe, expect, it } from 'vitest';
import { UPDATE_GIFT_TICKETS, claimUpdateGift, sanitizeCollection, startCollection } from './collection.js';
import { createPet } from './pet.js';
import { ACCESSORIES, VARIANTS } from './species.js';
import { isNewerVersion } from './version.js';

const start = () => startCollection({ ...createPet('cat', 1), xp: 300 }, 1);
const withVersion = (v: string) => ({ ...start(), appVersion: v });

describe('업데이트 선물(뽑기권 2장)', () => {
  it('새 버전으로 올라와 처음 켜면 2장을 주고 그 버전을 기억한다', () => {
    const r = claimUpdateGift(withVersion('0.8.1'), '0.9.0');
    expect(UPDATE_GIFT_TICKETS).toBe(2);
    expect(r.tickets).toBe(2);
    expect(r.collection.tickets).toBe(start().tickets + 2);
    expect(r.collection.appVersion).toBe('0.9.0');
  });

  it('같은 버전을 다시 켜면 주지 않는다(버전마다 한 번)', () => {
    const first = claimUpdateGift(withVersion('0.8.1'), '0.9.0').collection;
    const again = claimUpdateGift(first, '0.9.0');
    expect(again.tickets).toBe(0);
    expect(again.collection).toBe(first);
  });

  it('버전이 또 오르면 그때마다 2장씩 준다', () => {
    let c = withVersion('0.8.1');
    for (const v of ['0.9.0', '0.9.1', '0.10.0']) {
      const r = claimUpdateGift(c, v);
      expect(r.tickets, v).toBe(2);
      c = r.collection;
    }
    expect(c.tickets).toBe(start().tickets + 6);
  });

  it('더 낮은 버전(옛 설치 파일을 다시 깔았을 때)이면 주지도 기억을 바꾸지도 않는다', () => {
    const r = claimUpdateGift(withVersion('0.9.0'), '0.8.1');
    expect(r.tickets).toBe(0);
    expect(r.collection.appVersion).toBe('0.9.0');
  });

  it('기록이 없던 옛 저장(버전 없음)에서 올라오면 업데이트로 보고 준다', () => {
    const r = claimUpdateGift(start(), '0.9.0');
    expect(start().appVersion).toBe('');
    expect(r.tickets).toBe(2);
  });

  it('이상한 버전 문자열은 무시한다', () => {
    for (const v of ['', 'dev', '1.0', '1.0.0-beta', 'x.y.z']) expect(claimUpdateGift(withVersion('0.8.1'), v).tickets, v).toBe(0);
  });

  it('저장 파일의 버전은 x.y.z 만 받고 없으면 빈 문자열로 읽는다', () => {
    const raw = JSON.parse(JSON.stringify(start()));
    delete raw.appVersion;
    expect(sanitizeCollection(raw, ACCESSORIES, VARIANTS)!.appVersion).toBe('');
    expect(sanitizeCollection({ ...raw, appVersion: '0.8.1' }, ACCESSORIES, VARIANTS)!.appVersion).toBe('0.8.1');
    expect(sanitizeCollection({ ...raw, appVersion: 'abc' }, ACCESSORIES, VARIANTS)!.appVersion).toBe('');
  });
});

describe('버전 비교', () => {
  it('숫자로 비교한다(0.10.0 > 0.9.0)', () => {
    expect(isNewerVersion('0.10.0', '0.9.0')).toBe(true);
    expect(isNewerVersion('1.0.0', '0.99.99')).toBe(true);
    expect(isNewerVersion('0.8.1', '0.8.1')).toBe(false);
    expect(isNewerVersion('0.8.0', '0.8.1')).toBe(false);
  });
});

import { describe, expect, it } from 'vitest';
import { UPTIME_HOURS_PER_TICKET, UPTIME_MS_PER_TICKET, UPTIME_TICKETS_PER_DAY, addUptime, sanitizeCollection, startCollection } from './collection.js';
import { createPet } from './pet.js';
import { ACCESSORIES, VARIANTS } from './species.js';

const NOW = 1_000_000;
const start = () => startCollection({ ...createPet('cat', NOW), xp: 300 }, NOW);
const HOUR = 3_600_000;
const DAY1 = '2026-11-27';
const DAY2 = '2026-11-28';

describe('켜 두기만 해도 받는 뽑기권', () => {
  it('규칙 값: 6시간마다 1장, 하루 1장까지', () => {
    expect(UPTIME_HOURS_PER_TICKET).toBe(6);
    expect(UPTIME_MS_PER_TICKET).toBe(6 * HOUR);
    expect(UPTIME_TICKETS_PER_DAY).toBe(1);
  });

  it('시간이 모자라면 쌓기만 하고 뽑기권은 주지 않는다', () => {
    const a = addUptime(start(), 2 * HOUR, DAY1);
    expect(a.tickets).toBe(0);
    expect(a.collection.uptimeMs).toBe(2 * HOUR);
    const b = addUptime(a.collection, 3 * HOUR, DAY1);
    expect(b.tickets).toBe(0);
    expect(b.collection.uptimeMs).toBe(5 * HOUR);
  });

  it('6시간이 쌓이면 1장을 주고, 오늘 한도(1장)를 채우면 더 쌓지 않는다', () => {
    const c = start();
    const r = addUptime(addUptime(c, 5 * HOUR, DAY1).collection, 1 * HOUR, DAY1);
    expect(r.tickets).toBe(1);
    expect(r.collection.tickets).toBe(c.tickets + 1);
    expect(r.collection.uptimeToday).toBe(1);
    expect(r.collection.uptimeMs).toBe(0);
    // 한도를 채운 뒤에는 아무리 켜 둬도 받지 않고 시간도 쌓이지 않는다
    const more = addUptime(r.collection, 20 * HOUR, DAY1);
    expect(more.tickets).toBe(0);
    expect(more.collection.tickets).toBe(r.collection.tickets);
    expect(more.collection.uptimeMs).toBe(0);
  });

  it('하루에 한꺼번에 많은 시간을 넣어도 한도만큼만 준다', () => {
    const r = addUptime(start(), 48 * HOUR, DAY1);
    expect(r.tickets).toBe(1);
  });

  it('날짜가 바뀌면 오늘 받은 수가 0 으로 돌아와 다시 받을 수 있다', () => {
    const day1 = addUptime(start(), 6 * HOUR, DAY1).collection;
    expect(day1.uptimeToday).toBe(1);
    const day2 = addUptime(day1, 6 * HOUR, DAY2);
    expect(day2.tickets).toBe(1);
    expect(day2.collection.uptimeDay).toBe(DAY2);
    expect(day2.collection.uptimeToday).toBe(1);
  });

  it('0 이하·NaN 시간은 무시한다', () => {
    const c = start();
    for (const ms of [0, -5, Number.NaN]) expect(addUptime(c, ms, DAY1).tickets).toBe(0);
    expect(addUptime(c, 0, DAY1).collection.uptimeMs).toBe(0);
  });

  it('저장 파일에 없던 값은 기본값으로 읽고, 이상한 값은 범위로 맞춘다', () => {
    const raw = JSON.parse(JSON.stringify(start()));
    delete raw.uptimeMs;
    delete raw.uptimeToday;
    delete raw.uptimeDay;
    expect(sanitizeCollection(raw, ACCESSORIES, VARIANTS)).toMatchObject({ uptimeMs: 0, uptimeToday: 0, uptimeDay: '' });
    const odd = sanitizeCollection({ ...raw, uptimeMs: 10 ** 12, uptimeToday: -3, uptimeDay: 'today' }, ACCESSORIES, VARIANTS)!;
    expect(odd.uptimeMs).toBe(UPTIME_MS_PER_TICKET);
    expect(odd.uptimeToday).toBe(0);
    expect(odd.uptimeDay).toBe('');
  });
});

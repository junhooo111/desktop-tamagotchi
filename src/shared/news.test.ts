import { describe, expect, it } from 'vitest';
import { MAX_NEWS_ITEMS, MAX_SHOWN_AT_ONCE, newsText, pickNews, sanitizeNews, sanitizeSeen } from './news.js';

const item = (over: Record<string, unknown> = {}) => ({ id: 'a1', date: '2026-11-26', title: '제목', body: '본문', url: '', ...over });

describe('sanitizeNews', () => {
  it('올바른 항목은 그대로 받고 최신 날짜 순으로 정렬한다', () => {
    const out = sanitizeNews({ items: [item({ id: 'old', date: '2026-01-01' }), item({ id: 'new', date: '2026-11-26' })] });
    expect(out.map((i) => i.id)).toEqual(['new', 'old']);
    expect(out[0]).toEqual({ id: 'new', date: '2026-11-26', title: '제목', body: '본문', url: '' });
  });

  it('같은 날짜는 id 가 큰 것이 먼저다(결정적 순서)', () => {
    expect(sanitizeNews({ items: [item({ id: 'a' }), item({ id: 'b' })] }).map((i) => i.id)).toEqual(['b', 'a']);
  });

  it('어떤 값이 와도 죽지 않고 빈 목록을 돌려준다', () => {
    for (const bad of [null, undefined, 42, 'x', [], {}, { items: 'x' }, { items: null }]) expect(sanitizeNews(bad)).toEqual([]);
  });

  it('이상한 항목은 그 항목만 버린다(id·날짜·제목 검사, 중복 id)', () => {
    const out = sanitizeNews({
      items: [
        item({ id: 'ok' }),
        item({ id: '' }),
        item({ id: 'has space' }),
        item({ id: 'x'.repeat(61) }),
        item({ id: 'baddate', date: '26-11-26' }),
        item({ id: 'notitle', title: '   ' }),
        item({ id: 'ok' }),
        null,
        42,
        'str',
      ],
    });
    expect(out.map((i) => i.id)).toEqual(['ok']);
  });

  it('제목 40자·본문 200자까지, 제어문자와 줄바꿈은 공백으로 정리한다', () => {
    const out = sanitizeNews({ items: [item({ title: '가'.repeat(50), body: 'a\u0000b\n\n  c' + 'd'.repeat(300) })] });
    expect(Array.from(out[0]!.title)).toHaveLength(40);
    expect(Array.from(out[0]!.body).length).toBeLessThanOrEqual(200);
    expect(out[0]!.body.startsWith('a b c')).toBe(true);
  });

  it('링크는 이 저장소 주소만 허용한다(다른 주소·javascript:·공백 포함은 비운다)', () => {
    const url = (u: unknown) => sanitizeNews({ items: [item({ url: u })] })[0]!.url;
    expect(url('https://github.com/junhooo111/desktop-tamagotchi/releases')).toBe('https://github.com/junhooo111/desktop-tamagotchi/releases');
    expect(url('https://evil.example.com/')).toBe('');
    expect(url('https://github.com/other/repo')).toBe('');
    expect(url('javascript:alert(1)')).toBe('');
    expect(url('https://github.com/junhooo111/x y')).toBe('');
    expect(url(42)).toBe('');
  });

  it(`항목은 ${MAX_NEWS_ITEMS}개까지만 받는다`, () => {
    const many = Array.from({ length: 100 }, (_, i) => item({ id: `n${i}` }));
    expect(sanitizeNews({ items: many })).toHaveLength(MAX_NEWS_ITEMS);
  });
});

describe('pickNews', () => {
  const items = sanitizeNews({ items: ['a', 'b', 'c', 'd', 'e'].map((id, i) => item({ id, date: `2026-11-0${i + 1}` })) }); // e 가 가장 최신

  it('이미 본 공지는 다시 알리지 않는다', () => {
    const r = pickNews(items, ['e', 'd', 'c', 'b', 'a'], false);
    expect(r.show).toEqual([]);
    expect(r.seen).toHaveLength(5);
  });

  it(`새 공지는 최신 것부터 ${MAX_SHOWN_AT_ONCE}개까지 알리고, 넘친 것도 본 것으로 저장한다`, () => {
    const r = pickNews(items, [], false);
    expect(r.show.map((i) => i.id)).toEqual(['e', 'd', 'c']);
    expect(r.seen.sort()).toEqual(['a', 'b', 'c', 'd', 'e']);
    expect(pickNews(items, r.seen, false).show).toEqual([]); // 다음 확인 때 다시 쏟아지지 않는다
  });

  it('처음 실행이면 지난 공지를 쏟아 내지 않고 가장 최신 하나만 알린다', () => {
    const r = pickNews(items, [], true);
    expect(r.show.map((i) => i.id)).toEqual(['e']);
    expect(r.seen).toHaveLength(5);
  });

  it('새로 올라온 공지만 알린다', () => {
    const r = pickNews(items, ['a', 'b', 'c', 'd'], false);
    expect(r.show.map((i) => i.id)).toEqual(['e']);
  });

  it('본 공지 목록은 무한히 늘지 않는다', () => {
    const seen = Array.from({ length: 500 }, (_, i) => `old${i}`);
    expect(pickNews(items, seen, false).seen.length).toBeLessThanOrEqual(200);
  });
});

describe('sanitizeSeen / newsText', () => {
  it('저장 파일이 깨졌어도 빈 목록으로 복구한다', () => {
    for (const bad of [null, 1, 'x', {}, { seen: 'x' }]) expect(sanitizeSeen(bad)).toEqual([]);
    expect(sanitizeSeen({ seen: ['a', 1, '', 'a', 'b'] })).toEqual(['a', 'b']);
  });

  it('말풍선 문구: 본문이 있으면 두 줄, 없으면 제목만', () => {
    expect(newsText({ id: 'a', date: '2026-11-26', title: 'T', body: 'B', url: '' })).toBe('📢 T\nB');
    expect(newsText({ id: 'a', date: '2026-11-26', title: 'T', body: '', url: '' })).toBe('📢 T');
  });
});

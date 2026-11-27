import { describe, expect, it } from 'vitest';
import { LESSONS, RULE_IDS, type RuleId } from './lessons.js';
import { MAX_IGNORED, addIgnored, buildResults, isMuted, parseKey, visibleFindings, type ResultFinding } from './results.js';

const none = { disabledRules: [] as RuleId[], ignored: [] as string[] };
const f = (ruleId: RuleId, selector = 'button#a', url = 'http://localhost:3000/'): ResultFinding => ({
  key: `${url}|${ruleId}|${selector}`,
  ruleId,
  url,
  selector,
  detail: '',
});

describe('필터', () => {
  it('꺼 둔 규칙과 무시한 문제는 알리지 않고, 나머지는 그대로 둔다', () => {
    const a = f('img-alt');
    const b = f('contrast');
    const c = f('touch-target', 'button#c');
    const out = visibleFindings([a, b, c], { disabledRules: ['contrast'], ignored: [c.key] });
    expect(out).toEqual([a]);
    expect(isMuted(b, { disabledRules: ['contrast'], ignored: [] })).toBe(true);
    expect(isMuted(a, none)).toBe(false);
  });

  it('같은 규칙의 다른 요소는 무시하지 않는다(키가 요소까지 구분한다)', () => {
    const one = f('img-alt', 'img#one');
    const two = f('img-alt', 'img#two');
    expect(visibleFindings([one, two], { disabledRules: [], ignored: [one.key] })).toEqual([two]);
  });

  it('addIgnored: 중복 없이 더하고, 상한을 넘으면 오래된 것부터 버린다', () => {
    expect(addIgnored(['a'], 'a')).toEqual(['a']);
    expect(addIgnored(['a'], 'b')).toEqual(['a', 'b']);
    const many = Array.from({ length: MAX_IGNORED }, (_, i) => 'k' + i);
    const next = addIgnored(many, 'new');
    expect(next).toHaveLength(MAX_IGNORED);
    expect(next[0]).toBe('k1');
    expect(next.at(-1)).toBe('new');
  });

  it('parseKey: 주소·규칙·요소 경로를 나누고, 모르는 규칙은 null, 경로에 | 가 있어도 안전하다', () => {
    expect(parseKey('http://localhost:3000/a|img-alt|body > img')).toEqual({ url: 'http://localhost:3000/a', ruleId: 'img-alt', selector: 'body > img' });
    expect(parseKey('u|nope|x').ruleId).toBeNull();
    expect(parseKey('u|contrast|a|b|c').selector).toBe('a|b|c');
  });
});

describe('buildResults', () => {
  const ctx = (over = {}) => ({
    connected: true,
    confirmed: new Set<string>(),
    snoozedUntil: {},
    settings: none,
    now: 1000,
    ...over,
  });

  it('문제를 페이지별로 묶고 규칙 이름·분류·고치는 법·위치를 붙인다', () => {
    const view = buildResults([f('img-alt', 'img#hero', 'http://localhost:5173/b'), f('contrast', 'p', 'http://localhost:3000/a')], ctx());
    expect(view.pages.map((p) => p.url)).toEqual(['http://localhost:3000/a', 'http://localhost:5173/b']);
    const item = view.pages[1]?.items[0];
    expect(item).toMatchObject({ ruleId: 'img-alt', category: 'screenreader', categoryLabel: '접근성 · 스크린 리더(화면을 소리로 듣는 사람)', title: LESSONS['img-alt'].title, where: 'img#hero', state: 'new' });
    expect(item?.fix).toBe(LESSONS['img-alt'].fix);
  });

  it('페이지 전체 문제는 "페이지 전체"로, 값이 있으면 괄호로 덧붙인다', () => {
    const doc: ResultFinding = { ...f('html-lang', 'document'), detail: '<html lang> 없음' };
    const view = buildResults([doc], ctx());
    expect(view.pages[0]?.items[0]?.where).toBe('페이지 전체 (<html lang> 없음)');
  });

  it('상태를 구분한다: 새 문제·확인함·미룸·무시·규칙 꺼짐(우선순위: 꺼짐 > 무시 > 확인 > 미룸)', () => {
    const items = [f('img-alt', 'a'), f('contrast', 'b'), f('touch-target', 'c'), f('dup-id', 'd'), f('page-title', 'e')];
    const view = buildResults(items, ctx({
      confirmed: new Set([items[1]!.key]),
      snoozedUntil: { [items[2]!.key]: 5000 },
      settings: { disabledRules: ['page-title'], ignored: [items[3]!.key] },
    }));
    const states = Object.fromEntries(view.pages[0]!.items.map((i) => [i.ruleId, i.state]));
    expect(states).toEqual({ 'img-alt': 'new', contrast: 'confirmed', 'touch-target': 'snoozed', 'dup-id': 'ignored', 'page-title': 'disabled' });
    expect(view.counts).toEqual({ new: 1, confirmed: 1, snoozed: 1, ignored: 1, disabled: 1 });
  });

  it('미룸 시각이 지났으면 다시 새 문제다', () => {
    const x = f('img-alt');
    const view = buildResults([x], ctx({ snoozedUntil: { [x.key]: 999 }, now: 1000 }));
    expect(view.pages[0]?.items[0]?.state).toBe('new');
  });

  it('한 페이지 안에서는 새 문제가 위로 온다', () => {
    const a = f('img-alt', 'a');
    const b = f('contrast', 'b');
    const view = buildResults([a, b], ctx({ confirmed: new Set([a.key]) }));
    expect(view.pages[0]?.items.map((i) => i.ruleId)).toEqual(['contrast', 'img-alt']);
  });

  it('무시 목록: 지금 페이지에 없는 항목도 보여 줘서 해제할 수 있다', () => {
    const present = f('img-alt', 'img#a');
    const gone = 'http://localhost:3000/old|contrast|p.faint';
    const view = buildResults([present], ctx({ settings: { disabledRules: [], ignored: [present.key, gone, 'weird'] } }));
    expect(view.ignored.map((e) => [e.key, e.present])).toEqual([[present.key, true], [gone, false], ['weird', false]]);
    expect(view.ignored[1]).toMatchObject({ url: 'http://localhost:3000/old', title: LESSONS.contrast.title, where: 'p.faint' });
    expect(view.ignored[2]?.title).toBe('알 수 없는 규칙');
  });

  it('연결 여부를 그대로 전한다(빈 결과의 이유를 구분하려고)', () => {
    expect(buildResults([], ctx({ connected: false })).connected).toBe(false);
    expect(buildResults([], ctx()).pages).toEqual([]);
  });

  it('모든 규칙에 분류와 고치는 법이 있어 결과 항목이 비지 않는다', () => {
    for (const id of RULE_IDS) {
      const item = buildResults([f(id)], ctx()).pages[0]?.items[0];
      expect(item?.categoryLabel, id).not.toBe('');
      expect(item?.fix, id).not.toBe('');
    }
  });
});

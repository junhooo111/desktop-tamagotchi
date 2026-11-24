import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { Finding } from '../inspect/scan.js';
import {
  SNOOZE_MS,
  confirm,
  detectFixes,
  emptyProgress,
  loadProgress,
  markFixed,
  markTipSeen,
  pendingFindings,
  prune,
  saveProgress,
  snooze,
} from './progress.js';

const finding = (selector: string, url = 'http://localhost:5173/a'): Finding => ({
  key: `${url}|img-alt|${selector}`,
  ruleId: 'img-alt',
  url,
  selector,
  detail: '',
  rect: null,
  page: { x: 0, y: 0, width: 1, height: 1 },
});

const A = finding('img#a');
const B = finding('img#b');
const NOW = 1_000_000;

describe('pendingFindings', () => {
  it('확인했거나 미루는 중인 문제는 빼고 알린다', () => {
    let p = emptyProgress();
    expect(pendingFindings([A, B], p, NOW)).toEqual([A, B]);
    p = confirm(p, A.key, NOW);
    expect(pendingFindings([A, B], p, NOW)).toEqual([B]);
    p = snooze(p, B.key, NOW);
    expect(pendingFindings([A, B], p, NOW)).toEqual([]);
    expect(pendingFindings([A, B], p, NOW + SNOOZE_MS)).toEqual([B]); // 미루기가 끝나면 다시 알린다
  });
});

describe('confirm / snooze / prune', () => {
  it('확인하면 미루기 기록이 지워지고, 원본은 바뀌지 않는다', () => {
    const p0 = snooze(emptyProgress(), A.key, NOW);
    const p1 = confirm(p0, A.key, NOW + 5);
    expect(p1.confirmed[A.key]).toEqual({ at: NOW + 5, fixed: false });
    expect(p1.snoozed[A.key]).toBeUndefined();
    expect(p0.confirmed).toEqual({});
  });

  it('prune 은 끝난 미루기만 정리한다', () => {
    const p = snooze(snooze(emptyProgress(), A.key, NOW, 100), B.key, NOW, 10_000);
    expect(Object.keys(prune(p, NOW + 500).snoozed)).toEqual([B.key]);
  });
});

describe('detectFixes', () => {
  const confirmed = confirm(confirm(emptyProgress(), A.key, 1), B.key, 1);

  it('확인했던 문제가 이번 검사에서 사라졌으면 고친 것으로 본다', () => {
    const fixed = detectFixes(confirmed, [A.url], new Set([B.key]));
    expect(fixed).toEqual([A.key]);
  });

  it('이번에 검사하지 않은 페이지의 문제는 고친 것으로 치지 않는다', () => {
    expect(detectFixes(confirmed, ['http://localhost:9999/other'], new Set())).toEqual([]);
  });

  it('이미 보상받은 것은 다시 세지 않는다', () => {
    const done = markFixed(confirmed, [A.key]);
    expect(detectFixes(done, [A.url], new Set())).toEqual([B.key]);
    expect(done.confirmed[A.key]?.fixed).toBe(true);
    expect(confirmed.confirmed[A.key]?.fixed).toBe(false);
  });

  it('markFixed 는 모르는 키를 무시한다', () => {
    expect(markFixed(emptyProgress(), ['nope']).confirmed).toEqual({});
  });
});

describe('markTipSeen', () => {
  it('처음 읽은 지식만 기록하고, 원본은 바꾸지 않는다', () => {
    const p0 = emptyProgress();
    const p1 = markTipSeen(p0, 'a');
    expect(p1.tipsSeen).toEqual(['a']);
    expect(p0.tipsSeen).toEqual([]);
    expect(markTipSeen(p1, 'a')).toBe(p1);
    expect(markTipSeen(p1, 'b').tipsSeen).toEqual(['a', 'b']);
  });

  it('confirm·snooze 가 읽은 지식 기록을 지우지 않는다', () => {
    const p = confirm(snooze(markTipSeen(emptyProgress(), 'a'), A.key, NOW), B.key, NOW);
    expect(p.tipsSeen).toEqual(['a']);
  });
});

describe('저장·복원', () => {
  let dir: string;
  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pet-progress-'));
  });
  afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('저장한 진행도를 그대로 불러온다', () => {
    const file = path.join(dir, 'nested', 'progress.json');
    const p = markTipSeen(snooze(confirm(emptyProgress(), A.key, 5), B.key, 7), 'tip-1');
    saveProgress(file, p);
    expect(loadProgress(file)).toEqual(p);
    expect(fs.existsSync(`${file}.tmp`)).toBe(false);
  });

  it('없거나 깨졌거나 모양이 틀린 파일은 빈 진행도로 시작한다', () => {
    expect(loadProgress(path.join(dir, 'none.json'))).toEqual(emptyProgress());
    const file = path.join(dir, 'bad.json');
    fs.writeFileSync(file, '{ nope');
    expect(loadProgress(file)).toEqual(emptyProgress());
    fs.writeFileSync(file, JSON.stringify({ confirmed: { k: { at: 'x', fixed: 1 }, ok: { at: 1, fixed: false } }, snoozed: { a: 'b', c: 3 } }));
    expect(loadProgress(file)).toEqual({ confirmed: { ok: { at: 1, fixed: false } }, snoozed: { c: 3 }, tipsSeen: [] });
    fs.writeFileSync(file, 'null');
    expect(loadProgress(file)).toEqual(emptyProgress());
  });
});

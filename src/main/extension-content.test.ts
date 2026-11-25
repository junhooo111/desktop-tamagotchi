// @vitest-environment jsdom
import fs from 'node:fs';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const source = fs.readFileSync(path.join(process.cwd(), 'extension', 'content.js'), 'utf8');

interface Sent {
  type: string;
  snapshot: { url: string; visible: boolean; findings: { ruleId: string }[] };
}

describe('확장 content.js 를 페이지에서 실행', () => {
  const sent: Sent[] = [];
  const g = globalThis as unknown as { chrome?: unknown };

  beforeEach(() => {
    vi.useFakeTimers();
    sent.length = 0;
    g.chrome = { runtime: { sendMessage: (m: Sent) => (sent.push(m), Promise.resolve()) } };
    document.documentElement.removeAttribute('lang');
    document.title = '';
    document.body.innerHTML = '<main><h1>제목</h1></main>';
  });

  afterEach(() => {
    vi.useRealTimers();
    delete g.chrome;
  });

  it('실행하자마자 검사 결과를 보내고, 이후 몇 초마다 다시 보낸다', () => {
    new Function(source)();
    expect(sent).toHaveLength(1);
    expect(sent[0]?.type).toBe('snapshot');
    const rules = sent[0]?.snapshot.findings.map((f) => f.ruleId) ?? [];
    expect(rules).toContain('html-lang');
    expect(rules).toContain('page-title');
    vi.advanceTimersByTime(4000);
    expect(sent).toHaveLength(2);
  });

  it('고친 뒤에는 그 문제가 빠진 결과를 보낸다', () => {
    new Function(source)();
    document.documentElement.setAttribute('lang', 'ko');
    document.title = '화면';
    vi.advanceTimersByTime(4000);
    const rules = sent[1]?.snapshot.findings.map((f) => f.ruleId) ?? [];
    expect(rules).not.toContain('html-lang');
    expect(rules).not.toContain('page-title');
  });

  it('보이지 않는 탭에서는 보내지 않는다', () => {
    const spy = vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden');
    new Function(source)();
    vi.advanceTimersByTime(8000);
    expect(sent).toHaveLength(0);
    spy.mockRestore();
  });

  it('확장 연결이 끊겨 에러가 나도 페이지를 깨뜨리지 않는다', () => {
    g.chrome = {
      runtime: {
        sendMessage: () => {
          throw new Error('Extension context invalidated.');
        },
      },
    };
    expect(() => {
      new Function(source)();
      vi.advanceTimersByTime(4000);
    }).not.toThrow();
  });
});

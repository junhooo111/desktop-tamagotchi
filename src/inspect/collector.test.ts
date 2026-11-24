// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { collectPage, collectorExpression, type RawFinding } from './collector.js';

const run = (html: string, head = '<title>테스트</title><meta name="viewport" content="width=device-width">'): RawFinding[] => {
  document.documentElement.lang = 'ko';
  document.head.innerHTML = head;
  document.body.innerHTML = html;
  return collectPage({ requireLayout: false }).findings;
};
const rules = (found: RawFinding[]): string[] => found.map((f) => f.ruleId);

beforeEach(() => {
  document.documentElement.removeAttribute('lang');
  document.head.innerHTML = '';
  document.body.innerHTML = '';
  document.title = '';
});

describe('collectPage 규칙', () => {
  it('깨끗한 페이지에서는 아무것도 찾지 않는다', () => {
    const found = run(
      `<h1>제목</h1><h2>소제목</h2>
       <img src="/a.png" alt="설명"><img src="/b.png" alt="">
       <button>저장</button><a href="/x">이동</a>
       <label for="n">이름</label><input id="n"><label>메모 <textarea></textarea></label>
       <p style="color:#000;background:#fff">본문</p>`,
    );
    expect(found).toEqual([]);
  });

  it('img-alt: alt 속성이 없는 이미지만 찾는다(빈 alt 는 장식용이라 통과)', () => {
    const found = run('<img id="hero" src="/hero.png"><img src="/ok.png" alt="">');
    expect(found).toHaveLength(1);
    expect(found[0]).toMatchObject({ ruleId: 'img-alt', selector: 'img#hero', detail: '/hero.png' });
  });

  it('button-name: 이름이 없는 버튼·링크를 찾고, aria-label·title·글자·이미지 alt 가 있으면 통과한다', () => {
    const found = run(
      `<button id="bad"><svg></svg></button>
       <a href="/x"></a>
       <button aria-label="닫기"></button>
       <button title="검색"></button>
       <button>확인</button>
       <a href="/y"><img src="/i.png" alt="홈"></a>
       <input type="submit" value="보내기">
       <input type="submit">
       <input type="button">`,
    );
    // 값 없는 submit 은 브라우저 기본 이름이 있어 통과, 값 없는 type=button 은 이름이 없다
    expect(rules(found)).toEqual(['button-name', 'button-name', 'button-name']);
    expect(found[0]?.selector).toBe('button#bad');
  });

  it('form-label: 라벨이 없는 입력칸을 찾는다(placeholder 만으로는 부족)', () => {
    const found = run(
      `<input id="a" placeholder="검색어">
       <label for="b">연결됨</label><input id="b">
       <label>감싸기 <input></label>
       <input aria-label="이름">
       <input type="hidden"><input type="submit">
       <select id="c"></select>`,
    );
    expect(found.map((f) => [f.ruleId, f.selector])).toEqual([
      ['form-label', 'input#a'],
      ['form-label', 'select#c'],
    ]);
  });

  it('html-lang · page-title · viewport-meta: 문서 설정이 빠졌으면 페이지 전체 문제로 알린다', () => {
    document.documentElement.removeAttribute('lang');
    document.head.innerHTML = '';
    document.body.innerHTML = '<p>내용</p>';
    const found = collectPage({ requireLayout: false }).findings;
    expect(rules(found).sort()).toEqual(['html-lang', 'page-title', 'viewport-meta']);
    expect(found.every((f) => f.rect === null && f.selector === 'document')).toBe(true);
  });

  it('heading-order: 단계를 건너뛴 제목을 찾는다(내려오는 건 괜찮다)', () => {
    const found = run('<h1>a</h1><h3 id="x">b</h3><h2>c</h2><h4>d</h4><h1>e</h1>');
    expect(found.map((f) => [f.ruleId, f.detail])).toEqual([
      ['heading-order', 'h1 다음에 h3'],
      ['heading-order', 'h2 다음에 h4'],
    ]);
  });

  it('contrast: 대비가 낮은 글자를 찾고 대비 비율을 알려 준다', () => {
    const found = run(
      `<p id="faint" style="color:#aaa;background:#fff">연한 글씨</p>
       <p style="color:#595959;background:#fff">괜찮은 글씨</p>
       <div style="background:#000"><span style="color:#222">검은 배경에 어두운 글씨</span></div>
       <p style="color:#888;background:#fff;font-size:30px">큰 글씨는 3:1 기준(3.5:1 이라 통과)</p>`,
    );
    const contrast = found.filter((f) => f.ruleId === 'contrast');
    expect(contrast.map((f) => f.selector)).toEqual(['p#faint', 'body > div > span']);
    expect(contrast[0]?.detail).toMatch(/^대비 2\.\d:1 \(기준 4\.5:1\)$/);
  });

  it('contrast: 배경 이미지가 있으면 알 수 없으므로 건너뛴다', () => {
    const found = run('<p style="color:#aaa;background-image:url(/x.png)">글씨</p>');
    expect(rules(found)).not.toContain('contrast');
  });

  it('규칙마다 최대 3개까지만 알린다', () => {
    const found = run('<img src="1"><img src="2"><img src="3"><img src="4"><img src="5">');
    expect(found.filter((f) => f.ruleId === 'img-alt')).toHaveLength(3);
  });

  it('같은 모양의 요소는 nth-of-type 으로 구분되는 경로를 만든다', () => {
    const found = run('<section><img src="1" alt="a"><img src="2"></section>');
    expect(found[0]?.selector).toBe('body > section > img:nth-of-type(2)');
  });
});

describe('페이지 정보', () => {
  it('주소·제목·창 위치를 함께 돌려준다', () => {
    run('<p>hi</p>');
    const snap = collectPage({ requireLayout: false });
    expect(snap).toMatchObject({ title: '테스트', screenX: 0, screenY: 0 });
    expect(snap.url).toContain('http');
  });
});

describe('collectorExpression', () => {
  it('문자열로 만들어 페이지에서 그대로 실행해도 동작한다(밖의 변수를 쓰지 않는다)', () => {
    run('<img src="/z.png">');
    const result = (0, eval)(collectorExpression()) as { findings: unknown[]; visible: boolean };
    expect(Array.isArray(result.findings)).toBe(true);
    expect(typeof result.visible).toBe('boolean');
  });
});

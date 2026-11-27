// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { collectPage, collectorExpression, type RawFinding } from './collector.js';

const run = (html: string, head = '<title>테스트</title><meta name="viewport" content="width=device-width"><meta name="description" content="설명">'): RawFinding[] => {
  document.documentElement.lang = 'ko';
  document.head.innerHTML = head;
  document.body.innerHTML = html + '<main hidden></main>'; // main 이 없다는 규칙에 걸리지 않게 한다
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

  it('html-lang · page-title · viewport-meta · meta-description: 문서 설정이 빠졌으면 페이지 전체 문제로 알린다', () => {
    document.documentElement.removeAttribute('lang');
    document.head.innerHTML = '';
    document.body.innerHTML = '<main><p>내용</p></main>';
    const found = collectPage({ requireLayout: false }).findings;
    expect(rules(found).sort()).toEqual(['html-lang', 'meta-description', 'page-title', 'viewport-meta']);
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

describe('collectPage 규칙: 추가 6종', () => {
  it('dup-id: 같은 id 가 반복되면 두 번째부터 찾는다(처음 하나는 정상)', () => {
    const found = run('<div id="a"></div><div id="a"></div><div id="a"></div><div id="b"></div>');
    expect(found.map((f) => [f.ruleId, f.detail])).toEqual([
      ['dup-id', 'id="a" 가 3번 쓰임'],
      ['dup-id', 'id="a" 가 3번 쓰임'],
    ]);
  });

  it('dup-id: 서로 다른 id 와 빈 id 는 통과한다', () => {
    expect(run('<div id="a"></div><div id="b"></div><div id=""></div><div id=""></div>')).toEqual([]);
  });

  it('zoom-disabled: user-scalable=no·maximum-scale 1 이하를 찾는다', () => {
    const noScale = run('<p>글</p>', '<title>t</title><meta name="description" content="d"><meta name="viewport" content="width=device-width, user-scalable=no">');
    expect(rules(noScale)).toEqual(['zoom-disabled']);
    const max1 = run('<p>글</p>', '<title>t</title><meta name="description" content="d"><meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1.0">');
    expect(rules(max1)).toEqual(['zoom-disabled']);
    const zero = run('<p>글</p>', '<title>t</title><meta name="description" content="d"><meta name="viewport" content="width=device-width,user-scalable=0">');
    expect(rules(zero)).toEqual(['zoom-disabled']);
  });

  it('zoom-disabled: 확대를 허용하는 viewport 는 통과한다(maximum-scale 5 포함)', () => {
    expect(run('<p>글</p>', '<title>t</title><meta name="description" content="d"><meta name="viewport" content="width=device-width, initial-scale=1">')).toEqual([]);
    expect(run('<p>글</p>', '<title>t</title><meta name="description" content="d"><meta name="viewport" content="width=device-width, maximum-scale=5, user-scalable=yes">')).toEqual([]);
  });

  it('tabindex-positive: 1 이상만 찾고 0·-1 은 통과한다', () => {
    const found = run('<div tabindex="3">a</div><div tabindex="0">b</div><div tabindex="-1">c</div><button tabindex="1">d</button>');
    expect(found.map((f) => [f.ruleId, f.detail])).toEqual([
      ['tabindex-positive', 'tabindex="3"'],
      ['tabindex-positive', 'tabindex="1"'],
    ]);
  });

  it('alt-quality: 파일 이름·"image"·"사진" 같은 alt 를 찾는다', () => {
    const found = run(
      `<img src="/1.png" alt="hero.png"><img src="/2.png" alt="image">
       <img src="/3.png" alt="사진 3"><img src="/4.png" alt="IMG_2034">
       <img src="/5.png" alt="Photo">`,
    );
    expect(rules(found)).toEqual(['alt-quality', 'alt-quality', 'alt-quality']); // 규칙당 최대 3개
    expect(found[0]?.detail).toBe('alt="hero.png"');
  });

  it('alt-quality: 설명이 있는 alt 와 빈 alt 는 통과한다("이미지 편집기" 같은 문장 포함)', () => {
    const found = run(
      `<img src="/a.png" alt="노트북으로 일하는 개발자"><img src="/b.png" alt="">
       <img src="/c.png" alt="이미지 편집기 화면"><img src="/d.png" alt="PNG 와 JPG 비교 표">`,
    );
    expect(found).toEqual([]);
  });

  it('clickable-div: 손가락 모양(cursor: pointer)·onclick 인 div·span 을 찾는다', () => {
    const found = run(
      `<div id="save" style="cursor:pointer">저장</div>
       <span onclick="go()">이동</span>`,
    );
    expect(found.map((f) => [f.ruleId, f.selector, f.detail])).toEqual([
      ['clickable-div', 'div#save', '<div> "저장"'],
      ['clickable-div', 'body > span', '<span> "이동"'],
    ]);
  });

  it('clickable-div: 진짜 버튼·링크, role·tabindex 가 있는 것, 그 안의 자식은 통과한다', () => {
    const found = run(
      `<button style="cursor:pointer"><span style="cursor:pointer">안쪽</span></button>
       <a href="/x" style="cursor:pointer"><div style="cursor:pointer">링크 안</div></a>
       <div role="button" tabindex="0" style="cursor:pointer">접근 가능</div>
       <div tabindex="0" style="cursor:pointer">포커스 가능</div>
       <label style="cursor:pointer">라벨</label>
       <div style="cursor:default">그냥 글</div>`,
    );
    expect(found).toEqual([]);
  });

  it('clickable-div: 상속된 손가락 모양은 가장 바깥 요소만 알리고, 안에 링크·버튼이 있는 카드는 통과한다', () => {
    const outer = run('<div id="card" style="cursor:pointer"><span>제목</span><span>내용</span></div>');
    expect(outer.map((f) => f.selector)).toEqual(['div#card']);
    const cardWithLink = run('<div style="cursor:pointer"><a href="/detail">자세히</a></div>');
    expect(cardWithLink).toEqual([]);
  });

  it('table-header: th 없이 td 만 있는 표를 찾는다(th 가 있거나 role=presentation 은 통과)', () => {
    const found = run(
      `<table id="bad"><tr><td>상품</td><td>가격</td></tr></table>
       <table><tr><th>상품</th></tr><tr><td>사과</td></tr></table>
       <table role="presentation"><tr><td>배치용</td></tr></table>
       <table></table>`,
    );
    expect(found.map((f) => [f.ruleId, f.selector])).toEqual([['table-header', 'table#bad']]);
  });

  it('깨끗한 페이지: 위 6종 어느 것도 오탐하지 않는다', () => {
    const found = run(
      `<h1>제목</h1>
       <button type="button" style="cursor:pointer">저장</button>
       <img src="/a.png" alt="분기별 매출 막대 그래프">
       <table><thead><tr><th scope="col">월</th><th scope="col">매출</th></tr></thead><tbody><tr><td>1월</td><td>10</td></tr></tbody></table>
       <div id="one" tabindex="0">포커스</div><div id="two"></div>`,
    );
    expect(found).toEqual([]);
  });
});

describe('collectPage 규칙: 검색·성능·링크 3종', () => {
  it('meta-description: 없거나 비어 있으면 페이지 전체 문제로 찾고, 있으면 통과한다', () => {
    const missing = run('<p>글</p>', '<title>t</title><meta name="viewport" content="width=device-width">');
    expect(missing.map((f) => [f.ruleId, f.selector])).toEqual([['meta-description', 'document']]);
    const empty = run('<p>글</p>', '<title>t</title><meta name="viewport" content="width=device-width"><meta name="description" content="  ">');
    expect(rules(empty)).toEqual(['meta-description']);
    expect(run('<p>글</p>')).toEqual([]);
  });

  it('vague-link: "여기"·"click here" 같은 링크 글자를 찾는다(공백·구두점·대소문자 무시)', () => {
    const found = run(
      `<a href="/a">여기</a><a href="/b">Click Here!</a><a href="/c"> 여기를 클릭 </a><a href="/d">link</a>`,
    );
    expect(rules(found)).toEqual(['vague-link', 'vague-link', 'vague-link']); // 규칙당 최대 3개
    expect(found[0]?.detail).toBe('"여기"');
  });

  it('vague-link: 구체적인 링크 글자, aria-label 이 구체적인 것, href 없는 a 는 통과한다', () => {
    const found = run(
      `<a href="/docs">사용 설명서</a>
       <a href="/x" aria-label="주문 내역 보기">여기</a>
       <a>여기</a>
       <p>자세한 내용은 <a href="/y">배송 정책 문서</a>를 보세요.</p>`,
    );
    expect(found).toEqual([]);
  });

  it('frame-title: 이름 없는 iframe 만 찾는다(title·aria-label 이 있거나 숨긴 것은 통과)', () => {
    const found = run('<iframe id="f" src="/map"></iframe><iframe title="지도" src="/a"></iframe><iframe aria-label="결제" src="/b"></iframe><iframe aria-hidden="true" tabindex="-1" src="/c"></iframe>');
    expect(found.map((f) => [f.ruleId, f.selector])).toEqual([['frame-title', 'iframe#f']]);
  });

  it('aria-hidden-focus: 숨긴 요소 안에 포커스가 갈 수 있으면 찾고, tabindex=-1 이나 inert 면 통과한다', () => {
    const found = run('<div id="a" aria-hidden="true"><button>닫기</button></div><div aria-hidden="true"><button tabindex="-1">x</button></div><div inert aria-hidden="true"><a href="/">y</a></div><div aria-hidden="true"><svg></svg></div>');
    expect(found.map((f) => [f.ruleId, f.selector])).toEqual([['aria-hidden-focus', 'div#a']]);
  });

  it('empty-heading: 글자도 이미지 alt 도 없는 제목만 찾는다', () => {
    const found = run('<h1>제목</h1><h2 id="e"></h2><h3>  </h3><h4><img src="/a.png" alt="로고"></h4>');
    expect(found.map((f) => f.ruleId)).toEqual(['empty-heading', 'empty-heading']);
    expect(found[0]?.selector).toBe('h2#e');
  });

  it('landmark-main: 내용이 있는데 main 이 없으면 페이지 전체 문제로 찾고, main·role=main 이 있으면 통과한다', () => {
    document.documentElement.lang = 'ko';
    document.head.innerHTML = '<title>t</title><meta name="viewport" content="width=device-width"><meta name="description" content="d">';
    document.body.innerHTML = '<p>내용</p>';
    expect(collectPage({ requireLayout: false }).findings.map((f) => [f.ruleId, f.selector])).toEqual([['landmark-main', 'document']]);
    document.body.innerHTML = '<div role="main">내용</div>';
    expect(collectPage({ requireLayout: false }).findings).toEqual([]);
    document.body.innerHTML = '';
    expect(collectPage({ requireLayout: false }).findings).toEqual([]);
  });

  it('autoplay-media: muted 없이 autoplay 인 영상·오디오만 찾는다', () => {
    const found = run('<video autoplay src="/a.mp4"></video><video autoplay muted src="/b.mp4"></video><audio autoplay src="/c.mp3"></audio><video src="/d.mp4"></video>');
    expect(found.map((f) => f.ruleId)).toEqual(['autoplay-media', 'autoplay-media']);
  });

  it('aria-broken-ref: 없는 id 를 가리키는 aria-labelledby·describedby·label for 를 찾는다', () => {
    const found = run('<span id="ok">이름</span><input aria-labelledby="ok"><input id="a" aria-labelledby="nope" aria-label="가"><input id="b" aria-describedby="ok gone" aria-label="나"><label for="missing">라벨</label><label for="a">좋은 라벨</label>');
    expect(found.map((f) => f.ruleId)).toEqual(['aria-broken-ref', 'aria-broken-ref', 'aria-broken-ref']);
    expect(found[2]?.detail).toContain('missing');
  });

  it('nested-interactive: 링크·버튼 안에 또 링크·버튼·입력칸이 있으면 바깥 요소를 찾는다', () => {
    const found = run('<a id="a" href="/p"><button>담기</button></a><button id="b"><a href="/x">x</a></button><a href="/y"><img src="/i.png" alt="회사 로고"> 글</a><button>그냥</button>');
    expect(found.map((f) => f.selector)).toEqual(['a#a', 'button#b']);
  });

  it('autocomplete-missing: 이메일·전화·이름 같은 입력칸에 autocomplete 가 없으면 찾고, 있거나 다른 입력칸은 통과한다', () => {
    const found = run('<input aria-label="a" type="email" id="e"><input aria-label="b" type="tel" autocomplete="tel"><input aria-label="c" type="text" name="first-name"><input aria-label="d" type="text" name="title"><input aria-label="e" type="password"><input aria-label="f" type="search" name="name"><input aria-label="g" type="text" name="name" autocomplete="off">');
    expect(found.map((f) => f.ruleId)).toEqual(['autocomplete-missing', 'autocomplete-missing']);
    expect(found[0]?.detail).toContain('email');
    expect(found[1]?.detail).toContain('first-name');
  });

  it('meta-refresh: 몇 초 뒤 새로고침·이동하는 meta 를 찾고, 0초(즉시 이동)는 통과한다', () => {
    const head = '<title>t</title><meta name="viewport" content="width=device-width"><meta name="description" content="d">';
    expect(run('<p>글</p>', head + '<meta http-equiv="refresh" content="5; url=/home">').map((f) => [f.ruleId, f.detail])).toEqual([['meta-refresh', '5초 뒤 이동']]);
    expect(run('<p>글</p>', head + '<meta http-equiv="refresh" content="0; url=/home">')).toEqual([]);
  });

  it('img-oversized: 레이아웃이 없는 환경에서는 건너뛰고 오류도 내지 않는다', () => {
    expect(run('<img src="/big.png" alt="큰 그림" width="100">')).toEqual([]);
  });
});

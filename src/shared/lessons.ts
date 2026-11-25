/**
 * 검사 규칙과 학습 카드 문구.
 * 규칙마다 "무엇이 문제인지 · 왜 문제인지 · 어떻게 고치는지"를 한국어로 설명한다.
 */

export const RULE_IDS = [
  'img-alt',
  'button-name',
  'form-label',
  'html-lang',
  'page-title',
  'viewport-meta',
  'heading-order',
  'touch-target',
  'h-overflow',
  'contrast',
  'dup-id',
  'zoom-disabled',
  'tabindex-positive',
  'alt-quality',
  'clickable-div',
  'table-header',
  'meta-description',
  'img-oversized',
  'vague-link',
] as const;

export type RuleId = (typeof RULE_IDS)[number];

/** 규칙 분류: 설정 창과 검사 결과 목록에서 묶어 보여 주는 기준 */
export type RuleCategory = 'a11y' | 'seo' | 'responsive' | 'perf';

export const CATEGORY_LABELS: Record<RuleCategory, string> = {
  a11y: '접근성',
  seo: '검색·공유(SEO)',
  responsive: '반응형·모바일',
  perf: '성능',
};

export interface Lesson {
  category: RuleCategory;
  title: string;
  /** 펫이 문제 자리에서 띄우는 한 줄 */
  bubble: string;
  problem: string;
  why: string;
  fix: string;
  code: string;
}

export const LESSONS: Record<RuleId, Lesson> = {
  'img-alt': {
    category: 'a11y',
    title: '이미지에 대체 텍스트(alt)가 없어요',
    bubble: '여기 이미지에 alt가 없어요!',
    problem: '<img> 태그에 alt 속성이 아예 없습니다.',
    why: '스크린 리더는 alt가 없으면 파일 이름을 읽어 줍니다. 이미지가 깨졌을 때도 아무 설명이 남지 않고, 검색엔진도 이미지를 이해하지 못합니다.',
    fix: '이미지가 의미를 전달하면 내용을 한 문장으로 쓰고, 장식용이면 alt="" 로 비워 두세요(속성 자체는 있어야 합니다).',
    code: '<img src="/team.jpg" alt="회의실에서 웃고 있는 팀원 다섯 명" />\n<img src="/divider.svg" alt="" />',
  },
  'button-name': {
    category: 'a11y',
    title: '버튼·링크에 이름이 없어요',
    bubble: '이 버튼이 뭘 하는지 알 수가 없어요!',
    problem: '아이콘만 있는 버튼이나 링크에 글자도 aria-label 도 없습니다.',
    why: '스크린 리더 사용자는 "버튼"이라고만 듣고 무슨 기능인지 알 수 없습니다. 음성 제어로도 이름을 불러서 누를 수 없습니다.',
    fix: '보이는 글자를 넣거나, 아이콘 버튼에는 aria-label 로 기능을 적어 주세요.',
    code: '<button aria-label="메뉴 열기">\n  <svg aria-hidden="true">…</svg>\n</button>',
  },
  'form-label': {
    category: 'a11y',
    title: '입력칸에 라벨이 없어요',
    bubble: '이 입력칸이 무엇인지 몰라요!',
    problem: '<input>·<select>·<textarea> 에 연결된 <label> 이나 aria-label 이 없습니다. placeholder 만 있는 경우도 해당합니다.',
    why: 'placeholder 는 입력을 시작하면 사라지고 스크린 리더가 라벨로 인정하지 않는 경우가 많습니다. 라벨을 누르면 입력칸에 포커스가 가는 편의도 사라집니다.',
    fix: '<label for> 로 입력칸과 연결하거나, 라벨을 숨기고 싶다면 aria-label 을 쓰세요.',
    code: '<label for="email">이메일</label>\n<input id="email" type="email" />',
  },
  'html-lang': {
    category: 'a11y',
    title: '<html> 에 lang 이 없어요',
    bubble: '이 페이지가 무슨 언어인지 몰라요!',
    problem: '<html> 요소에 lang 속성이 없습니다.',
    why: '스크린 리더가 발음 규칙을 고르는 기준이고, 브라우저의 번역·맞춤법 검사·하이픈 처리도 lang 을 봅니다.',
    fix: '<html> 에 페이지 주 언어를 적어 주세요.',
    code: '<html lang="ko">',
  },
  'page-title': {
    category: 'seo',
    title: '페이지 제목(<title>)이 비어 있어요',
    bubble: '탭 제목이 비어 있어요!',
    problem: 'document.title 이 비어 있거나 없습니다.',
    why: '브라우저 탭, 즐겨찾기, 검색 결과, 스크린 리더의 페이지 안내가 모두 제목에서 시작합니다. 탭이 여러 개일 때 구분할 수 없습니다.',
    fix: '페이지마다 내용을 알려 주는 고유한 제목을 넣으세요. SPA 라면 라우트가 바뀔 때 제목도 바꿔야 합니다.',
    code: '<title>주문 내역 - 마이 서비스</title>',
  },
  'viewport-meta': {
    category: 'responsive',
    title: 'viewport 메타 태그가 없어요',
    bubble: '모바일에서 깨질 수 있어요!',
    problem: '<meta name="viewport"> 가 없습니다.',
    why: '모바일 브라우저는 이 태그가 없으면 데스크톱 폭(약 980px)으로 그린 뒤 축소해서 보여 줍니다. 반응형 CSS 가 의도대로 동작하지 않습니다.',
    fix: '<head> 에 viewport 를 추가하세요.',
    code: '<meta name="viewport" content="width=device-width, initial-scale=1" />',
  },
  'heading-order': {
    category: 'a11y',
    title: '제목 단계를 건너뛰었어요',
    bubble: '제목 단계가 건너뛰어졌어요!',
    problem: 'h1 다음에 바로 h3 처럼 제목 단계를 건너뛴 곳이 있습니다.',
    why: '스크린 리더 사용자는 제목 목록으로 페이지 구조를 파악합니다. 단계가 건너뛰어지면 내용이 빠졌다고 오해하게 됩니다.',
    fix: '크기가 아니라 구조에 맞춰 h1→h2→h3 순서를 지키고, 크기는 CSS 로 조절하세요.',
    code: '<h1>대시보드</h1>\n<h2>최근 주문</h2>\n<h3>배송 중</h3>',
  },
  'touch-target': {
    category: 'responsive',
    title: '누를 영역이 너무 작아요',
    bubble: '손가락으로 누르기엔 너무 작아요!',
    problem: '버튼·입력칸 같은 조작 요소의 가로나 세로가 24px 보다 작습니다.',
    why: '모바일에서 잘못 누르기 쉽고, 손이 떨리는 사용자는 누르기 어렵습니다. 접근성 기준(WCAG 2.2)은 최소 24px, 권장은 44px 입니다.',
    fix: '보이는 크기가 작더라도 padding 이나 min-width/min-height 로 누르는 영역을 키우세요.',
    code: '.icon-button {\n  min-width: 44px;\n  min-height: 44px;\n}',
  },
  'h-overflow': {
    category: 'responsive',
    title: '화면 폭을 넘어서 가로로 스크롤돼요',
    bubble: '화면 밖으로 삐져나갔어요!',
    problem: '페이지가 브라우저 폭보다 넓어서 가로 스크롤이 생깁니다. 아래 요소가 오른쪽 끝을 넘습니다.',
    why: '모바일에서 화면이 좌우로 흔들리고 내용이 잘립니다. 고정 px 폭이나 긴 단어·표·이미지가 흔한 원인입니다.',
    fix: '폭을 %·max-width: 100% 로 바꾸고, 긴 텍스트에는 overflow-wrap, 표에는 가로 스크롤 영역을 따로 두세요.',
    code: 'img { max-width: 100%; height: auto; }\n.card { width: min(100%, 480px); }',
  },
  contrast: {
    category: 'a11y',
    title: '글자와 배경의 명암 대비가 부족해요',
    bubble: '글자가 잘 안 보여요!',
    problem: '글자색과 배경색의 명암 대비가 기준(일반 글자 4.5:1, 큰 글자 3:1)보다 낮습니다.',
    why: '저시력 사용자뿐 아니라 밝은 야외나 낮은 화면 밝기에서도 읽기 어렵습니다. 연한 회색 글씨가 가장 흔한 원인입니다.',
    fix: '글자색을 더 진하게 하거나 배경을 바꿔 대비를 높이세요. 브라우저 개발자 도구의 색상 선택기에서 대비 비율을 볼 수 있습니다.',
    code: '/* 대비 2.3:1 → 4.6:1 */\ncolor: #aaa;  →  color: #595959;',
  },
  'dup-id': {
    category: 'a11y',
    title: '같은 id 가 한 페이지에 여러 번 쓰였어요',
    bubble: '같은 id 가 두 번 쓰였어요!',
    problem: '같은 id 값을 가진 요소가 한 페이지에 둘 이상 있습니다.',
    why: 'id 는 페이지에서 하나뿐이어야 합니다. 중복되면 label for, aria-labelledby, 앵커 링크, getElementById 가 첫 번째 요소만 가리켜서 엉뚱한 곳이 동작합니다. 컴포넌트를 반복해서 그릴 때 id 를 고정 문자열로 넣어 두면 흔히 생깁니다.',
    fix: '반복되는 요소에는 id 를 빼고 class 를 쓰거나, 항목마다 다른 id 를 만드세요(React 라면 useId).',
    code: '// 같은 컴포넌트를 여러 번 그릴 때\nconst id = useId();\n<label htmlFor={id}>이름</label>\n<input id={id} />',
  },
  'zoom-disabled': {
    category: 'a11y',
    title: '화면 확대를 막아 놓았어요',
    bubble: '확대를 막아 놓았어요!',
    problem: 'viewport 메타 태그에 user-scalable=no 이거나 maximum-scale 이 1 이하입니다.',
    why: '저시력 사용자는 손가락으로 확대해서 글자를 읽습니다. 확대를 막으면 읽을 방법이 사라지고, 접근성 기준(WCAG 1.4.4)도 어깁니다. 최근 브라우저는 일부 무시하지만 막으려는 코드 자체가 문제입니다.',
    fix: 'user-scalable 과 maximum-scale 을 지우세요. 입력칸 확대가 거슬린다면 입력칸 글자를 16px 이상으로 하면 됩니다.',
    code: '<meta name="viewport" content="width=device-width, initial-scale=1" />\ninput { font-size: 16px; }',
  },
  'tabindex-positive': {
    category: 'a11y',
    title: 'tabindex 에 양수를 썼어요',
    bubble: 'tabindex 가 양수예요!',
    problem: 'tabindex 가 1 이상인 요소가 있습니다.',
    why: '양수 tabindex 는 화면 순서와 상관없이 그 요소를 먼저 포커스합니다. 키보드·스크린 리더 사용자의 이동 순서가 뒤죽박죽이 되고, 요소가 늘어날수록 관리할 수 없습니다.',
    fix: 'tabindex 는 0(순서대로 포커스 가능) 이나 -1(코드로만 포커스) 만 쓰고, 순서는 HTML 에 적는 순서로 맞추세요.',
    code: '<!-- ✗ --> <div tabindex="5">…</div>\n<!-- ✓ --> <div tabindex="0">…</div>',
  },
  'alt-quality': {
    category: 'a11y',
    title: 'alt 가 파일 이름이나 뜻 없는 말이에요',
    bubble: 'alt 가 파일 이름 같아요!',
    problem: 'alt 가 "hero.png", "image", "사진" 처럼 파일 이름이거나 이미지가 무엇인지 알려 주지 못하는 말입니다.',
    why: '스크린 리더는 alt 를 그대로 읽습니다. "이미지 이미지"나 "hero 점 png"를 들으면 이미지가 무슨 내용인지 알 수 없습니다. alt 를 기계적으로 채워 넣는 습관에서 흔히 생깁니다.',
    fix: '이미지가 전달하는 내용을 한 문장으로 쓰세요. "이미지" 같은 말은 빼도 됩니다. 장식용이면 alt="" 로 비우세요.',
    code: '<!-- ✗ --> <img src="hero.png" alt="hero.png">\n<!-- ✓ --> <img src="hero.png" alt="노트북으로 작업하는 개발자">',
  },
  'clickable-div': {
    category: 'a11y',
    title: 'div 나 span 을 버튼처럼 썼어요',
    bubble: 'div 를 버튼처럼 썼어요!',
    problem: '클릭할 수 있는 모양(마우스 포인터가 손가락 모양)인데 버튼이나 링크가 아닌 div·span 등이고, role 이나 tabindex 도 없습니다.',
    why: '이런 요소는 Tab 키로 이동할 수 없고, Enter·Space 로 누를 수 없고, 스크린 리더가 "버튼"이라고 알려 주지 않습니다. 마우스를 못 쓰는 사용자는 이 기능을 쓸 수 없습니다. AI가 만든 화면에서 가장 흔한 접근성 실수입니다.',
    fix: '진짜 <button>(이동은 <a href>)으로 바꾸세요. 스타일은 CSS 로 다시 입히면 됩니다. 정말 div 여야 한다면 role="button", tabindex="0", 키보드 이벤트를 모두 직접 달아야 합니다.',
    code: '<!-- ✗ --> <div class="btn" onClick={save}>저장</div>\n<!-- ✓ --> <button type="button" class="btn" onClick={save}>저장</button>',
  },
  'table-header': {
    category: 'a11y',
    title: '표에 제목 칸(th)이 없어요',
    bubble: '표에 제목 칸이 없어요!',
    problem: '<table> 안에 <th> 가 하나도 없습니다.',
    why: '스크린 리더는 th 로 "이 칸은 어떤 열의 값인지"를 안내합니다. td 만 쓰면 숫자들이 무엇인지 알려 줄 수 없습니다. 보이는 모양만 굵게 해서는 구조가 전달되지 않습니다.',
    fix: '제목 칸은 <th scope="col"> (행 제목이면 scope="row") 으로 쓰세요. 표가 레이아웃용일 뿐이라면 table 대신 CSS grid·flex 를 쓰는 것이 좋습니다.',
    code: '<table>\n  <tr><th scope="col">상품</th><th scope="col">가격</th></tr>\n  <tr><td>사과</td><td>1,000원</td></tr>\n</table>',
  },
  'meta-description': {
    category: 'seo',
    title: '검색 결과에 보일 설명(meta description)이 없어요',
    bubble: '검색 결과에 보일 설명이 없어요!',
    problem: '<meta name="description"> 이 없거나 내용이 비어 있습니다.',
    why: '검색 결과와 링크 미리보기에 나오는 두 줄 설명이 바로 이 값입니다. 없으면 검색엔진이 본문에서 아무 문장이나 가져와 보여 줘서 클릭하고 싶은 설명이 되기 어렵습니다.',
    fix: '페이지마다 내용을 한두 문장(120~160자 안팎)으로 요약해서 넣으세요. 페이지마다 달라야 하고, 제목을 그대로 반복하지 마세요.',
    code: '<meta name="description" content="이번 달 주문 현황과 배송 상태를 한눈에 확인하는 대시보드입니다." />',
  },
  'img-oversized': {
    category: 'perf',
    title: '이미지가 화면에 보이는 크기보다 훨씬 커요',
    bubble: '이미지가 너무 커요!',
    problem: '이미지 원본 가로 폭이 화면에 그려지는 폭의 2배(고해상도 화면 배율 포함)보다 훨씬 큽니다.',
    why: '보이지도 않는 픽셀까지 내려받아서 로딩이 느려지고 데이터를 낭비합니다. 모바일에서는 특히 눈에 띕니다. 원본 사진을 그대로 올리고 CSS 로만 줄이는 습관에서 흔히 생깁니다.',
    fix: '보이는 크기의 2배 정도(고해상도 화면용)로 리사이즈하고, WebP·AVIF 같은 가벼운 형식을 쓰세요. 화면 크기별로는 srcset 과 sizes 로 알맞은 파일을 고르게 합니다.',
    code: '<img\n  src="/hero-800.webp"\n  srcset="/hero-800.webp 800w, /hero-1600.webp 1600w"\n  sizes="(max-width: 800px) 100vw, 800px"\n  alt="…" />',
  },
  'vague-link': {
    category: 'a11y',
    title: '링크 글자가 "여기"처럼 뜻이 없어요',
    bubble: '링크 이름이 "여기"예요!',
    problem: '링크 글자가 "여기", "click here", "link" 처럼 어디로 가는지 알 수 없는 말입니다.',
    why: '스크린 리더 사용자는 링크 목록만 따로 훑어 듣습니다. "여기, 여기, 여기"만 들리면 어느 링크가 무엇인지 알 수 없습니다. 검색엔진도 링크 글자로 대상 페이지를 이해합니다.',
    fix: '링크 글자만 읽어도 목적지를 알 수 있게 쓰세요. 문장 속에서도 "사용 설명서 보기"처럼 구체적인 말을 링크로 만듭니다.',
    code: '<!-- ✗ --> 설명서는 <a href="/docs">여기</a>를 눌러 보세요.\n<!-- ✓ --> <a href="/docs">사용 설명서</a>를 확인해 보세요.',
  },
};

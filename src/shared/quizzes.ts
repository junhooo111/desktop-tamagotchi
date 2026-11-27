/**
 * 배움 카드 끝에 붙는 확인 퀴즈. 규칙마다 한 문제, 보기는 셋이다.
 * 정답 위치가 한쪽으로 쏠리지 않게 섞어 두었다.
 */
import type { RuleId } from './lessons.js';

export interface Quiz {
  question: string;
  options: readonly [string, string, string];
  /** 정답 보기의 번호(0~2) */
  answer: 0 | 1 | 2;
  /** 고른 뒤에 보여 주는 해설 */
  explain: string;
}

export const QUIZZES: Record<RuleId, Quiz> = {
  'img-alt': {
    question: '장식용 구분선 이미지의 alt 는 어떻게 하는 게 좋을까요?',
    options: ['alt="구분선 이미지" 라고 쓴다', 'alt 속성을 아예 뺀다', 'alt="" 로 비워 둔다'],
    answer: 2,
    explain: '속성은 두되 비워 두면 스크린 리더가 건너뜁니다. 속성을 빼면 파일 이름을 읽어 버릴 수 있어요.',
  },
  'button-name': {
    question: '글자 없이 X 아이콘만 있는 닫기 버튼에 가장 알맞은 것은?',
    options: ['aria-label="닫기"', 'alt="X"', '아무것도 하지 않는다'],
    answer: 0,
    explain: '아이콘 버튼에는 aria-label 로 기능을 적어 주세요. 보이는 글자가 있으면 그 글자가 이름이 됩니다.',
  },
  'form-label': {
    question: 'placeholder 만 있고 label 이 없는 입력칸의 가장 큰 문제는?',
    options: ['스타일이 깨진다', '입력을 시작하면 사라져서 무슨 칸인지 알 수 없다', '제출이 되지 않는다'],
    answer: 1,
    explain: 'placeholder 는 라벨을 대신하지 못합니다. label 을 연결하면 라벨을 눌러도 입력칸에 포커스가 가요.',
  },
  'html-lang': {
    question: '<html lang="ko"> 가 직접 도움이 되는 것은?',
    options: ['페이지 로딩 속도', '스크린 리더의 발음 선택과 브라우저 번역', '서버 응답 시간'],
    answer: 1,
    explain: 'lang 은 이 문서의 언어를 알려 주는 정보입니다. 읽기·번역·맞춤법 검사가 이 값을 봅니다.',
  },
  'page-title': {
    question: 'SPA 에서 다른 화면으로 이동했는데 title 이 그대로면 생기는 일은?',
    options: ['문제없다', '라우팅이 실패한다', '탭·스크린 리더에서 어느 화면인지 알 수 없다'],
    answer: 2,
    explain: '라우트가 바뀌면 document.title 도 같이 바꿔야 합니다. 탭 구분과 스크린 리더 안내가 제목에서 시작해요.',
  },
  'viewport-meta': {
    question: 'viewport 메타 태그가 없으면 모바일 브라우저는 어떻게 그릴까요?',
    options: ['데스크톱 폭(약 980px)으로 그린 뒤 축소한다', '화면 폭에 딱 맞춘다', '그리기를 거부한다'],
    answer: 0,
    explain: '그래서 반응형 CSS 가 의도대로 동작하지 않습니다. width=device-width 를 꼭 넣어 주세요.',
  },
  'heading-order': {
    question: '제목을 작게 보이게 하려고 h3 를 쓰는 대신 해야 할 일은?',
    options: ['div 로 바꾼다', 'h1 다음에 h2 를 쓰고 크기는 CSS 로 줄인다', 'h6 를 쓴다'],
    answer: 1,
    explain: '제목 태그는 크기가 아니라 구조를 나타냅니다. 크기는 CSS 로 조절하세요.',
  },
  'touch-target': {
    question: '아이콘이 16px 이어도 누르는 영역을 키우는 가장 알맞은 방법은?',
    options: ['font-size 를 키운다', '아이콘 이미지를 교체한다', 'padding 이나 min-width/min-height 를 준다'],
    answer: 2,
    explain: '보이는 크기와 누르는 영역은 따로 정할 수 있어요. 권장 크기는 44px 입니다.',
  },
  'h-overflow': {
    question: '이미지가 컨테이너보다 커서 가로 스크롤이 생길 때 먼저 쓸 CSS 는?',
    options: ['overflow: scroll', 'max-width: 100%; height: auto', 'position: fixed'],
    answer: 1,
    explain: 'max-width: 100% 는 컨테이너를 넘지 않게 하고, height: auto 는 비율을 지켜 줍니다.',
  },
  contrast: {
    question: '일반 크기 글자의 명암 대비 최소 기준(WCAG AA)은?',
    options: ['2:1', '3:1', '4.5:1'],
    answer: 2,
    explain: '큰 글자(24px 이상 등)는 3:1 이지만 일반 글자는 4.5:1 입니다. 연한 회색 글씨가 가장 흔한 실수예요.',
  },
  'dup-id': {
    question: '같은 컴포넌트를 목록으로 여러 번 그릴 때 안의 input 에 id 를 주는 올바른 방법은?',
    options: ['항목마다 다른 id 를 만든다(예: useId)', '모두 같은 id 를 쓴다', 'id 대신 name 만 쓴다'],
    answer: 0,
    explain: 'id 는 페이지에서 하나뿐이어야 합니다. 중복되면 label 연결이 첫 번째 요소로만 가요.',
  },
  'zoom-disabled': {
    question: 'viewport 에 user-scalable=no 를 넣으면 누가 가장 불편할까요?',
    options: ['데스크톱 사용자', '검색 엔진', '손가락으로 확대해서 읽는 저시력 사용자'],
    answer: 2,
    explain: '확대는 저시력 사용자의 기본 도구입니다. 입력칸 확대가 싫다면 입력칸 글자를 16px 이상으로 하세요.',
  },
  'tabindex-positive': {
    question: '키보드 이동 순서를 안전하게 맞추는 가장 좋은 방법은?',
    options: ['HTML 에 적는 순서를 화면 순서와 맞춘다', 'tabindex 를 1, 2, 3 … 으로 매긴다', 'tabindex 를 99 로 한다'],
    answer: 0,
    explain: '기본 순서는 HTML 순서입니다. 양수 tabindex 는 순서를 뒤섞어서 유지하기 어려워져요.',
  },
  'alt-quality': {
    question: '회의실에서 웃는 팀 사진의 alt 로 가장 알맞은 것은?',
    options: ['alt="team.jpg"', 'alt="이미지"', 'alt="회의실에서 웃고 있는 팀원들"'],
    answer: 2,
    explain: 'alt 는 이미지가 전달하는 내용을 말로 적는 것입니다. 파일 이름이나 "이미지"는 정보가 없어요.',
  },
  'clickable-div': {
    question: '클릭하면 저장하는 요소를 가장 알맞게 만든 것은?',
    options: ['<div onClick> 에 cursor: pointer', '<span role="link">', '<button type="button">'],
    answer: 2,
    explain: 'button 은 키보드 포커스, Enter·Space, 스크린 리더 안내가 공짜로 따라옵니다. div 로는 이걸 전부 직접 만들어야 해요.',
  },
  'table-header': {
    question: '표의 첫 줄에 있는 "상품, 가격" 칸은 어떤 태그가 알맞을까요?',
    options: ['<th scope="col">', '<td> 에 굵은 글씨', '<div class="head">'],
    answer: 0,
    explain: 'th 는 이 칸이 열의 제목이라는 의미를 전달합니다. 굵게만 하면 모양뿐이라 스크린 리더가 알 수 없어요.',
  },
  'meta-description': {
    question: '검색 결과에 나오는 두 줄 설명을 직접 정하려면?',
    options: ['<title> 을 길게 쓴다', '<meta name="description"> 을 쓴다', '<h1> 을 두 개 쓴다'],
    answer: 1,
    explain: 'meta description 이 설명 문구의 첫 후보입니다. 페이지마다 다른 한두 문장으로 요약해 주세요.',
  },
  'img-oversized': {
    question: '화면에 400px 로 보이는 이미지에 가장 알맞은 원본 폭은(고해상도 화면까지 생각하면)?',
    options: ['4000px (원본 그대로)', '약 800px', '40px'],
    answer: 1,
    explain: '고해상도 화면은 한 칸에 픽셀 2개를 쓰므로 보이는 크기의 2배면 충분합니다. 그보다 크면 낭비예요.',
  },
  'vague-link': {
    question: '"자세한 내용은 여기를 눌러 주세요"에서 링크로 만들기에 가장 알맞은 부분은?',
    options: ['"여기"', '"자세한 내용"', '"눌러 주세요"'],
    answer: 1,
    explain: '링크 글자만 읽어도 어디로 가는지 알 수 있어야 해요. "여기"는 스크린 리더 링크 목록에서 아무 정보가 없습니다.',
  },
  'frame-title': {
    question: '지도를 보여 주는 <iframe> 을 스크린 리더 사용자가 이해하게 하려면?',
    options: ['width 와 height 를 정확히 쓴다', 'border 를 없앤다', 'title="매장 위치 지도" 를 붙인다'],
    answer: 2,
    explain: '스크린 리더는 iframe 의 title 을 이름으로 읽어요. 없으면 "프레임"이라고만 들려서 안에 무엇이 있는지 알 수 없습니다.',
  },
  'aria-hidden-focus': {
    question: '화면 밖으로 숨긴 메뉴를 보조 기술과 키보드 모두에게서 완전히 숨기려면?',
    options: ['aria-hidden="true" 만 붙인다', 'inert 나 hidden 으로 숨긴다', 'opacity: 0 으로 투명하게 한다'],
    answer: 1,
    explain: 'aria-hidden 은 읽기만 숨길 뿐 Tab 포커스는 그대로 가요. inert·hidden(display:none)은 포커스까지 막아 줍니다.',
  },
  'empty-heading': {
    question: '글자 크기만 키우고 싶어서 빈 <h2></h2> 를 쓰면 어떻게 될까요?',
    options: ['제목 목록에 빈 제목이 끼어 구조를 헷갈리게 한다', '아무 문제 없다', '검색엔진 순위가 올라간다'],
    answer: 0,
    explain: '스크린 리더 사용자는 제목 목록으로 페이지를 훑어요. 빈 제목은 이름 없는 칸이 되어 방해만 됩니다. 모양은 CSS 로 만드세요.',
  },
  'landmark-main': {
    question: '키보드·스크린 리더 사용자가 메뉴를 건너뛰고 본문으로 바로 가게 하는 태그는?',
    options: ['<div class="content">', '<section>', '<main>'],
    answer: 2,
    explain: '<main> 은 페이지의 핵심 내용을 뜻하는 영역이라 "본문으로 이동" 기능이 곧바로 찾아가요. 페이지에 하나만 두세요.',
  },
  'autoplay-media': {
    question: '페이지가 열리자마자 재생되는 배경 영상이 지켜야 할 것은?',
    options: ['소리 없이(muted) 재생하고 멈출 수 있게 한다', '볼륨을 아주 작게 맞춘다', '재생 시간을 10초 이상으로 늘린다'],
    answer: 0,
    explain: '자동 재생 소리는 스크린 리더 안내를 덮어 버려요. 소리 없이 재생하고 controls 로 멈출 수 있게 해야 합니다.',
  },
  'aria-broken-ref': {
    question: '<label for="mail"> 인데 입력칸 id 가 "email" 이라면?',
    options: ['브라우저가 알아서 연결해 준다', '연결이 끊겨 입력칸이 이름 없이 읽힌다', '입력칸에 자동으로 포커스가 간다'],
    answer: 1,
    explain: 'for·aria-labelledby 는 id 가 정확히 같아야 이어져요. 눈으로는 같아 보여도 연결이 없어서 스크린 리더는 이름을 모릅니다.',
  },
  'nested-interactive': {
    question: '카드 전체가 링크인데 안에 "담기" 버튼도 넣고 싶을 때 바른 방법은?',
    options: ['<a> 안에 <button> 을 넣는다', '버튼에 role="link" 를 준다', '링크와 버튼을 나란히 두고 CSS 로 겹쳐 보이게 한다'],
    answer: 2,
    explain: '링크·버튼 안에 또 링크·버튼을 넣으면 보조 기술이 안쪽을 놓치고 브라우저마다 다르게 동작해요. 나란히 두는 것이 안전합니다.',
  },
  'autocomplete-missing': {
    question: '이메일 입력칸에 브라우저가 저장된 주소를 채워 주게 하려면?',
    options: ['autocomplete="email" 을 쓴다', 'placeholder="이메일" 을 쓴다', 'maxlength 를 늘린다'],
    answer: 0,
    explain: 'autocomplete 값은 입력 목적을 알려 줘요. 입력이 어려운 사람이 한 번에 채울 수 있게 하는 접근성 기준(WCAG 1.3.5)입니다.',
  },
  'meta-refresh': {
    question: '5초 뒤 저절로 다른 페이지로 보내는 meta refresh 가 문제인 이유는?',
    options: ['서버가 느려져서', '천천히 읽는 사람이 끝내기 전에 쫓겨나서', '글자가 흐려져서'],
    answer: 1,
    explain: '시간 제한은 읽는 속도가 느리거나 보조 기술을 쓰는 사람에게 큰 장벽이에요. 링크로 직접 이동하게 하세요.',
  },
};

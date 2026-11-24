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
};

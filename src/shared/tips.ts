/**
 * FE 기본 지식 모음과, 언제 어떤 지식을 알려 줄지 정하는 규칙.
 * 외부 서비스에 의존하지 않도록 앱 안에 내장해 둔다(오프라인·사내망에서도 동작).
 * AI 가 만든 코드에서 자주 놓치는 기본기 위주로 골랐다.
 */
import type { Mode } from './motion.js';
import type { Stage } from './pet.js';

export interface Tip {
  id: string;
  title: string;
  body: string;
  code: string;
}

export const TIPS: readonly Tip[] = [
  {
    id: 'semantic-html',
    title: 'div 대신 알맞은 태그를 쓰세요',
    body: '버튼은 button, 링크는 a, 목록은 ul/li 로 쓰면 키보드 조작·스크린 리더·검색엔진 지원이 공짜로 따라옵니다. div 에 onClick 을 달면 이걸 전부 직접 만들어야 해요.',
    code: '<!-- 나쁨 -->\n<div onclick="save()">저장</div>\n<!-- 좋음 -->\n<button type="button" onclick="save()">저장</button>',
  },
  {
    id: 'focus-visible',
    title: 'outline: none 은 대체 스타일과 함께',
    body: '포커스 테두리를 지우면 키보드 사용자는 지금 어디에 있는지 알 수 없습니다. 지우려면 :focus-visible 로 다른 표시를 꼭 넣어 주세요.',
    code: 'button:focus-visible {\n  outline: 2px solid #2563eb;\n  outline-offset: 2px;\n}',
  },
  {
    id: 'box-sizing',
    title: 'box-sizing: border-box 를 기본으로',
    body: '기본값(content-box)에서는 padding 과 border 가 width 에 더해져서 100% 폭 요소가 부모를 넘칩니다. border-box 는 width 안에 padding 과 border 를 포함해요.',
    code: '*, *::before, *::after {\n  box-sizing: border-box;\n}',
  },
  {
    id: 'flex-min-width',
    title: 'flex 자식이 안 줄어들면 min-width: 0',
    body: 'flex 항목의 min-width 기본값은 auto 라서 긴 텍스트가 있으면 줄어들지 않고 부모를 넘칩니다. min-width: 0 을 주면 줄어들 수 있고, 말줄임도 그제야 동작해요.',
    code: '.item {\n  min-width: 0;\n  overflow: hidden;\n  text-overflow: ellipsis;\n}',
  },
  {
    id: 'rem-vs-px',
    title: '글자 크기는 px 보다 rem',
    body: 'px 로 고정하면 사용자가 브라우저 글자 크기를 키워도 반영되지 않습니다. rem 은 사용자 설정을 따라가서 시력이 약한 사용자에게 도움이 돼요.',
    code: 'body { font-size: 1rem; }\nh1 { font-size: 2rem; }',
  },
  {
    id: 'list-key',
    title: 'React 목록의 key 는 안정적인 id 로',
    body: '배열 인덱스를 key 로 쓰면 항목이 추가·삭제·정렬될 때 상태가 엉뚱한 항목에 붙을 수 있습니다. 데이터가 가진 고유 id 를 쓰세요.',
    code: '{todos.map((t) => (\n  <TodoItem key={t.id} todo={t} />\n))}',
  },
  {
    id: 'effect-cleanup',
    title: 'useEffect 는 정리(cleanup)까지 한 세트',
    body: '구독·타이머·이벤트 리스너는 정리 함수에서 해제해야 합니다. 안 그러면 화면을 오갈 때마다 쌓여서 메모리 누수와 중복 실행이 생겨요.',
    code: 'useEffect(() => {\n  const id = setInterval(tick, 1000);\n  return () => clearInterval(id);\n}, []);',
  },
  {
    id: 'fetch-race',
    title: '요청 순서가 뒤집히는 경쟁 상태',
    body: '검색어를 빠르게 바꾸면 먼저 보낸 요청이 나중에 도착해 화면을 덮어쓸 수 있습니다. AbortController 로 이전 요청을 취소하세요.',
    code: 'const ctrl = new AbortController();\nfetch(url, { signal: ctrl.signal });\n// 정리 함수에서 ctrl.abort()',
  },
  {
    id: 'loading-error-empty',
    title: '화면에는 4가지 상태가 있어요',
    body: '데이터가 있는 화면만 만들면 로딩 중, 오류, 빈 목록에서 화면이 깨지거나 하얗게 비어요. AI 가 만든 화면에서 가장 자주 빠지는 부분입니다.',
    code: 'if (isLoading) return <Spinner />;\nif (error) return <ErrorMessage error={error} />;\nif (items.length === 0) return <Empty />;\nreturn <List items={items} />;',
  },
  {
    id: 'json-parse-try',
    title: 'JSON.parse 와 localStorage 는 try/catch',
    body: '저장된 값이 깨졌거나 비어 있으면 JSON.parse 가 예외를 던져 앱 전체가 멈춥니다. 외부에서 온 값은 항상 실패할 수 있다고 생각하세요.',
    code: 'function load() {\n  try {\n    return JSON.parse(localStorage.getItem("cart") ?? "[]");\n  } catch {\n    return [];\n  }\n}',
  },
  {
    id: 'debounce',
    title: '입력마다 요청하지 말고 debounce',
    body: '검색창에서 글자마다 API 를 부르면 서버 부하와 깜빡임이 생깁니다. 입력이 잠시 멈췄을 때 한 번만 요청하세요.',
    code: 'useEffect(() => {\n  const t = setTimeout(() => search(q), 300);\n  return () => clearTimeout(t);\n}, [q]);',
  },
  {
    id: 'promise-all',
    title: '서로 무관한 요청은 Promise.all',
    body: '독립적인 요청을 await 로 차례로 기다리면 시간이 더해집니다. Promise.all 로 동시에 보내면 가장 느린 것만큼만 걸려요.',
    code: 'const [user, orders] = await Promise.all([\n  getUser(id),\n  getOrders(id),\n]);',
  },
  {
    id: 'layout-shift',
    title: '이미지 크기를 미리 알려 주세요',
    body: '이미지가 늦게 로드되며 크기가 생기면 아래 내용이 밀려납니다(CLS). width/height 속성이나 aspect-ratio 로 자리를 미리 잡아 두세요.',
    code: '<img src="/a.jpg" width="640" height="360" alt="..." />\n\nimg { aspect-ratio: 16 / 9; }',
  },
  {
    id: 'lazy-image',
    title: '화면 아래 이미지는 loading="lazy"',
    body: '처음 보이지 않는 이미지까지 한꺼번에 받으면 초기 로딩이 느려집니다. 단, 첫 화면에 보이는 큰 이미지는 lazy 를 쓰지 마세요.',
    code: '<img src="/gallery-1.jpg" loading="lazy" alt="..." />',
  },
  {
    id: 'reduced-motion',
    title: '애니메이션 줄이기 설정을 존중하세요',
    body: '어지러움을 느끼는 사용자는 OS 에서 "동작 줄이기"를 켭니다. prefers-reduced-motion 으로 큰 움직임을 끄거나 줄이세요.',
    code: '@media (prefers-reduced-motion: reduce) {\n  * { animation: none !important; transition: none !important; }\n}',
  },
  {
    id: 'aria-live',
    title: '바뀌는 알림은 aria-live 로',
    body: '저장됨·오류 같은 토스트 메시지는 눈으로 보는 사용자에게만 전달됩니다. aria-live 영역에 넣으면 스크린 리더도 읽어 줍니다.',
    code: '<div role="status" aria-live="polite">저장했어요</div>',
  },
  {
    id: 'z-index-context',
    title: 'z-index 는 쌓임 맥락 안에서만 비교돼요',
    body: 'z-index: 9999 를 줘도 부모가 새 쌓임 맥락(position+z-index, transform, opacity 등)을 만들면 그 바깥 요소를 이기지 못합니다. 모달은 body 바로 아래에 두세요.',
    code: '/* 모달은 포털로 body 바로 아래에 렌더링 */\ncreatePortal(<Modal />, document.body);',
  },
  {
    id: 'controlled-input',
    title: 'value 만 주고 onChange 가 없으면 입력이 안 돼요',
    body: 'React 에서 value 를 넘기면 그 값이 항상 화면을 결정합니다. onChange 로 상태를 바꿔 주지 않으면 입력해도 아무 변화가 없어요. 초기값만 필요하면 defaultValue 를 쓰세요.',
    code: '<input value={name} onChange={(e) => setName(e.target.value)} />\n<input defaultValue="홍길동" />',
  },
  {
    id: 'cors-basics',
    title: 'CORS 오류는 브라우저가 막는 거예요',
    body: '서버끼리는 CORS 가 없습니다. 브라우저가 다른 출처의 응답을 JS 에 넘겨주지 않는 보안 규칙이라서, 해결은 서버가 허용 헤더를 보내거나 개발 중에는 프록시를 쓰는 것입니다.',
    code: '// vite.config.ts\nserver: { proxy: { "/api": "http://localhost:8080" } }',
  },
  {
    id: 'defer-script',
    title: '스크립트는 defer 로 불러오세요',
    body: '<head> 의 일반 script 는 내려받고 실행하는 동안 HTML 파싱을 멈춥니다. defer 는 파싱을 막지 않고, 문서가 다 만들어진 뒤 순서대로 실행해요.',
    code: '<script src="/app.js" defer></script>',
  },
];

/** 한 번에 한 번만 알려 주는 간격 */
export const TIP_EVERY_MS = 20 * 60_000;
/** 말풍선으로 알려 준 지식을 확인하지 않으면 이 시간 뒤에 거둔다 */
export const TIP_PENDING_MS = 10 * 60_000;

/** 아직 안 본 지식을 먼저 고르고, 다 봤으면 처음부터 다시 돈다. */
export function pickTip(seen: readonly string[], rng: () => number): Tip {
  const unseen = TIPS.filter((t) => !seen.includes(t.id));
  const pool = unseen.length > 0 ? unseen : TIPS;
  return pool[Math.min(pool.length - 1, Math.floor(rng() * pool.length))] as Tip;
}

export interface TipGate {
  now: number;
  lastTipAt: number;
  mode: Mode;
  stage: Stage;
  /** 문제 알림·카드·이전 지식 대기 중이라 방해하면 안 되는 상태 */
  busy: boolean;
  /** 펫 위쪽에 말풍선이 잘리지 않고 들어갈 공간이 있는지 */
  roomAbove: boolean;
  /** 알리는 간격(ms). 없으면 기본(20분), Infinity 면 알리지 않는다. */
  everyMs?: number;
}

/**
 * 지금 지식을 말풍선으로 알려 줘도 되는 때인지:
 * 알이 아니고, 가만히 있고, 바쁘지 않고, 위쪽에 자리가 있고, 간격이 지났을 때
 */
export function shouldOfferTip(g: TipGate): boolean {
  return (
    g.stage !== 'egg' && !g.busy && g.roomAbove && g.mode === 'idle' && g.now - g.lastTipAt >= (g.everyMs ?? TIP_EVERY_MS)
  );
}

/**
 * 추가 FE 지식 49개(한국어·영어). 성능·CSS·JS/TS·React·보안·접근성·네트워크·SEO.
 * 내용은 웹 표준·MDN·web.dev 에서 널리 확인되는 원칙을 우리 말로 풀어 쓴 것이다.
 * source 는 실제로 그 주제를 다룬 글을 확인한 경우에만 붙인다(참고용 링크이며 글을 옮긴 것이 아니다).
 */
export interface ExtraTip {
  id: string;
  ko: { title: string; body: string };
  en: { title: string; body: string };
  code: string;
  source?: { label: string; url: string };
}

const WEBDEV_CWV = { label: "web.dev · The most effective ways to improve Core Web Vitals", url: "https://web.dev/articles/top-cwv" };
const WOOWA_IMG = { label: "우아한형제들 기술블로그 · 배민우리동네 이미지 최적화 사례", url: "https://techblog.woowahan.com/20228/" };
const KAKAO_WASM = { label: "카카오 기술블로그 · FE개발자의 성장 스토리 08 (WebAssembly)", url: "https://tech.kakao.com/2021/05/17/frontend-growth-08/" };
const KAKAO_FLOW = { label: "if(kakao)dev2022 · Lighthouse Userflow 웹 반응성 개선", url: "https://if.kakao.com/2022/session/126" };
const MDN_CSP = { label: "MDN · Content Security Policy", url: "https://developer.mozilla.org/docs/Web/Security/Practical_implementation_guides/CSP" };

export const EXTRA_TIPS: readonly ExtraTip[] = [
  // ---- 성능 ----
  {
    id: "lcp-discoverable",
    ko: { title: "가장 큰 이미지는 HTML 에서 바로 찾게", body: "LCP(가장 큰 콘텐츠) 이미지가 CSS 배경이나 JS 로 늦게 만들어지면 브라우저가 발견하는 시점이 늦어집니다. HTML 의 img 로 두고 fetchpriority=\"high\" 로 우선순위를 높이세요." },
    en: { title: "Make the biggest image discoverable in HTML", body: "If the LCP (largest content) image is a CSS background or created late by JS, the browser finds it late. Keep it as an img in the HTML and raise its priority with fetchpriority=\"high\"." },
    code: "<img src=\"/hero.webp\" width=\"1200\" height=\"600\"\n     fetchpriority=\"high\" alt=\"...\" />",
    source: WEBDEV_CWV,
  },
  {
    id: "no-lazy-lcp",
    ko: { title: "첫 화면의 큰 이미지에 lazy 를 쓰지 마세요", body: "loading=\"lazy\" 는 일부러 늦게 받는 기능입니다. 첫 화면 맨 위의 큰 이미지에 쓰면 LCP 가 오히려 느려져요. 화면 아래 이미지에만 쓰세요." },
    en: { title: "Do not lazy-load the big image on the first screen", body: "loading=\"lazy\" deliberately delays the download. On the large image at the top of the first screen it makes LCP worse. Use it only for images below the fold." },
    code: "<img src=\"/hero.webp\" fetchpriority=\"high\" alt=\"...\" />  <!-- lazy 없음 -->\n<img src=\"/card.webp\" loading=\"lazy\" alt=\"...\" />",
    source: WEBDEV_CWV,
  },
  {
    id: "inp-long-tasks",
    ko: { title: "50ms 넘는 긴 작업은 쪼개세요", body: "메인 스레드가 한 작업에 오래 붙잡혀 있으면 그동안 누른 버튼이 반응하지 않습니다(INP). 큰 반복문은 나눠서 사이사이 브라우저에게 숨 쉴 틈을 주세요." },
    en: { title: "Break up tasks longer than 50ms", body: "If the main thread is stuck on one task, buttons pressed meanwhile do not respond (INP). Split big loops and give the browser room to breathe between chunks." },
    code: "for (const chunk of chunks) {\n  process(chunk);\n  await new Promise((r) => setTimeout(r)); // 한 틱 양보\n}",
    source: WEBDEV_CWV,
  },
  {
    id: "font-display",
    ko: { title: "웹폰트는 font-display 를 정하세요", body: "폰트가 오기 전까지 글자가 안 보이면(FOIT) 첫인상이 나쁩니다. font-display: swap 은 기본 글꼴로 먼저 보여 주고 폰트가 오면 바꿉니다. 글자 크기 차이로 밀리지 않게 size-adjust 도 도움이 돼요." },
    en: { title: "Set font-display for web fonts", body: "If text is invisible until the font arrives (FOIT), the first impression suffers. font-display: swap shows a fallback first and swaps when the font loads. size-adjust helps avoid layout jumps from size differences." },
    code: "@font-face {\n  font-family: \"Pretendard\";\n  src: url(/pretendard.woff2) format(\"woff2\");\n  font-display: swap;\n}",
  },
  {
    id: "image-modern-format",
    ko: { title: "이미지는 WebP·AVIF 와 알맞은 크기로", body: "같은 화질이면 JPEG·PNG 보다 WebP·AVIF 가 훨씬 가볍습니다. 화면에 보이는 크기보다 훨씬 큰 원본을 그대로 쓰지 말고 썸네일을 따로 만들어 쓰세요." },
    en: { title: "Use WebP/AVIF and the right size for images", body: "At the same quality, WebP and AVIF are much lighter than JPEG or PNG. Do not ship an original far larger than what is shown; make proper thumbnails." },
    code: "<picture>\n  <source srcset=\"/a.avif\" type=\"image/avif\" />\n  <source srcset=\"/a.webp\" type=\"image/webp\" />\n  <img src=\"/a.jpg\" alt=\"...\" />\n</picture>",
    source: WOOWA_IMG,
  },
  {
    id: "image-on-demand",
    ko: { title: "큰 이미지는 필요할 때만 불러오세요", body: "피드에서는 작은 썸네일만, 큰 원본은 상세 화면을 열 때 받으면 전송량이 크게 줄어듭니다. 보이지 않는 이미지를 미리 받지 않는 것이 가장 쉬운 최적화예요." },
    en: { title: "Load big images only when needed", body: "Show small thumbnails in the feed and fetch the large original only when the detail view opens, and the transfer shrinks a lot. Not downloading what nobody sees is the easiest optimization." },
    code: "const [open, setOpen] = useState(false);\n<img src={open ? item.full : item.thumb} onClick={() => setOpen(true)} />",
    source: WOOWA_IMG,
  },
  {
    id: "code-splitting",
    ko: { title: "화면별로 코드를 나눠서 받으세요", body: "처음 화면에 필요 없는 페이지·무거운 차트·에디터까지 한 번들에 넣으면 첫 로딩이 느립니다. 라우트 단위로 dynamic import 하면 필요한 순간에만 내려받아요." },
    en: { title: "Split code per screen", body: "If pages, charts, and editors the first screen does not need all live in one bundle, the first load is slow. Dynamic-import per route so they download only when needed." },
    code: "const Settings = lazy(() => import(\"./Settings\"));\n<Suspense fallback={<Spinner />}><Settings /></Suspense>",
  },
  {
    id: "bundle-weight",
    ko: { title: "라이브러리를 넣기 전에 무게를 보세요", body: "날짜 하나 고치려고 큰 라이브러리를 통째로 넣으면 번들이 몇 배로 커질 수 있습니다. 번들 분석 도구로 큰 덩어리를 찾고, 가벼운 대안이나 필요한 함수만 가져오는 방법을 고려하세요." },
    en: { title: "Check a library's weight before adding it", body: "Pulling in a big library just to format a date can multiply your bundle. Use a bundle analyzer to find the big chunks, and consider lighter alternatives or importing only the functions you need." },
    code: "// vite: rollup-plugin-visualizer 로 번들 구성을 눈으로 확인\nimport { format } from \"date-fns\"; // 필요한 함수만",
  },
  {
    id: "cache-hashed-assets",
    ko: { title: "해시가 붙은 파일은 오래 캐시하세요", body: "app.3f9a1c.js 처럼 내용이 바뀌면 이름이 바뀌는 파일은 1년 캐시해도 안전합니다. 반대로 index.html 은 캐시하지 않거나 짧게 두어야 새 배포가 바로 보여요." },
    en: { title: "Cache hashed files for a long time", body: "Files whose names change when the content changes, like app.3f9a1c.js, are safe to cache for a year. index.html, on the other hand, should not be cached (or only briefly) so a new deploy shows up right away." },
    code: "Cache-Control: public, max-age=31536000, immutable   # /assets/*.js\nCache-Control: no-cache                              # index.html",
  },
  {
    id: "preconnect",
    ko: { title: "곧 쓸 외부 서버에는 preconnect", body: "폰트·API·CDN 처럼 곧 요청할 다른 출처가 있다면 연결(DNS·TLS)을 미리 열어 두면 첫 요청이 빨라집니다. 너무 많이 걸면 오히려 방해되니 정말 중요한 한두 곳만요." },
    en: { title: "Preconnect to servers you will use soon", body: "If you will soon call another origin (font, API, CDN), opening the connection early speeds up the first request. Do not overdo it; just the one or two that really matter." },
    code: "<link rel=\"preconnect\" href=\"https://api.example.com\" crossorigin />",
  },
  {
    id: "virtual-list",
    ko: { title: "아주 긴 목록은 가상화하세요", body: "수천 개 항목을 모두 DOM 에 만들면 스크롤과 입력이 버벅입니다. 화면에 보이는 것만 그리는 가상 스크롤(react-window 등)을 쓰면 개수와 상관없이 가벼워요." },
    en: { title: "Virtualize very long lists", body: "Rendering thousands of items into the DOM makes scrolling and typing janky. Virtual scrolling (react-window and the like) draws only what is visible and stays light no matter the count." },
    code: "<FixedSizeList height={400} itemCount={10000} itemSize={36} width=\"100%\">\n  {Row}\n</FixedSizeList>",
  },
  {
    id: "offload-wasm",
    ko: { title: "무거운 계산은 메인 스레드 밖으로", body: "이미지 필터·큰 데이터 가공처럼 오래 걸리는 계산은 Web Worker 로 옮기면 화면이 멈추지 않습니다. 계산이 정말 병목이면 WebAssembly 로 더 빠르게 만들 수도 있어요." },
    en: { title: "Move heavy computation off the main thread", body: "Long computations like image filters or processing big data keep the UI from freezing when moved to a Web Worker. If the computation is a real bottleneck, WebAssembly can make it faster still." },
    code: "const worker = new Worker(new URL(\"./filter.worker.ts\", import.meta.url));\nworker.postMessage(pixels);\nworker.onmessage = (e) => draw(e.data);",
    source: KAKAO_WASM,
  },
  {
    id: "measure-interactions",
    ko: { title: "로딩만 말고 '조작'도 측정하세요", body: "페이지가 열리는 속도만 재면 버튼을 눌렀을 때의 반응은 놓칩니다. Lighthouse 사용자 흐름(User Flow)처럼 클릭·입력 같은 상호작용 구간도 측정해 보세요." },
    en: { title: "Measure interactions, not just loading", body: "Measuring only how fast a page opens misses how it responds when a button is pressed. Measure interaction phases (clicks, input) too, for example with Lighthouse User Flows." },
    code: "// Lighthouse User Flow: startFlow → navigate → startTimespan → 클릭 → endTimespan",
    source: KAKAO_FLOW,
  },
  {
    id: "field-data",
    ko: { title: "내 컴퓨터가 빠르다고 빠른 게 아니에요", body: "개발 PC 와 와이파이에서 빠른 페이지가 실제 사용자의 저사양 폰에서는 느릴 수 있습니다. web-vitals 라이브러리로 실제 사용자 데이터를 모아서 75% 사용자가 기준을 넘는지 보세요." },
    en: { title: "Fast on your machine does not mean fast", body: "A page that is quick on your dev PC and Wi-Fi can be slow on a real user's low-end phone. Collect real-user data with the web-vitals library and check that 75% of users meet the thresholds." },
    code: "import { onLCP, onINP, onCLS } from \"web-vitals\";\nonLCP(send); onINP(send); onCLS(send);",
    source: WEBDEV_CWV,
  },
  // ---- CSS ----
  {
    id: "container-queries",
    ko: { title: "카드는 화면이 아니라 '자리' 크기를 따르게", body: "미디어 쿼리는 화면 전체 폭만 봅니다. 컨테이너 쿼리를 쓰면 카드가 놓인 자리 폭에 맞춰 모양이 바뀌어서 사이드바에 있든 본문에 있든 알맞게 보여요." },
    en: { title: "Let a card follow its slot, not the screen", body: "Media queries only see the whole viewport width. Container queries let a card adapt to the width of where it sits, so it looks right in a sidebar or in the main column." },
    code: ".card-wrap { container-type: inline-size; }\n@container (min-width: 400px) { .card { display: flex; } }",
  },
  {
    id: "flex-gap",
    ko: { title: "간격은 margin 대신 gap", body: "항목 사이 간격을 margin 으로 주면 첫·마지막 항목 처리가 번거롭습니다. flex·grid 의 gap 은 항목 사이에만 간격을 넣어 줘서 훨씬 단순해요." },
    en: { title: "Use gap instead of margin for spacing", body: "Spacing items with margin makes the first and last item awkward. gap in flex and grid adds space only between items, which is much simpler." },
    code: ".row { display: flex; gap: 12px; }",
  },
  {
    id: "dvh-units",
    ko: { title: "모바일에서 100vh 는 주소창에 가려져요", body: "모바일 브라우저는 주소창이 나타났다 사라져서 100vh 가 실제 보이는 높이보다 큽니다. 100dvh(동적 뷰포트 높이)를 쓰면 지금 보이는 높이에 맞아요." },
    en: { title: "100vh on mobile gets hidden by the address bar", body: "Mobile browsers show and hide the address bar, so 100vh is taller than what is actually visible. 100dvh (dynamic viewport height) matches the height visible right now." },
    code: ".full { min-height: 100vh; min-height: 100dvh; }",
  },
  {
    id: "color-scheme",
    ko: { title: "다크 모드는 color-scheme 부터", body: "color-scheme: light dark 를 선언하면 입력칸·스크롤바 같은 기본 요소도 다크 모드에 맞게 바뀝니다. 그다음 prefers-color-scheme 으로 내 색만 조정하면 돼요." },
    en: { title: "Start dark mode with color-scheme", body: "Declaring color-scheme: light dark makes default elements such as inputs and scrollbars follow dark mode too. Then adjust only your own colors with prefers-color-scheme." },
    code: ":root { color-scheme: light dark; }\n@media (prefers-color-scheme: dark) { :root { --bg: #111; } }",
  },
  {
    id: "text-clamp",
    ko: { title: "긴 글은 줄 수로 말줄임", body: "한 줄 말줄임은 text-overflow: ellipsis, 여러 줄은 line-clamp 를 씁니다. 잘린 글의 전체 내용을 볼 수 있는 방법(펼치기·툴팁)도 함께 제공하세요." },
    en: { title: "Truncate long text by line count", body: "Use text-overflow: ellipsis for one line and line-clamp for several. Also give a way to see the full text (expand, tooltip)." },
    code: ".title {\n  display: -webkit-box;\n  -webkit-line-clamp: 2;\n  -webkit-box-orient: vertical;\n  overflow: hidden;\n}",
  },
  {
    id: "sticky-overflow",
    ko: { title: "sticky 가 안 먹으면 부모의 overflow 를 보세요", body: "position: sticky 는 조상 중에 overflow: hidden/auto 가 있으면 그 안에서만 붙습니다. 안 붙는다면 부모 체인에 overflow 가 있는지, top 값이 있는지 확인하세요." },
    en: { title: "If sticky does nothing, check the parent's overflow", body: "position: sticky only sticks within an ancestor that has overflow hidden/auto. If it does not stick, check the parent chain for overflow and make sure a top value is set." },
    code: ".header { position: sticky; top: 0; }\n/* 조상에 overflow: hidden 이 있으면 안 붙어요 */",
  },
  // ---- JS / TS ----
  {
    id: "nullish-vs-or",
    ko: { title: "기본값은 || 보다 ??", body: "count || 10 은 0 이나 빈 문자열도 '없음'으로 보고 10 이 됩니다. ?? 는 null·undefined 일 때만 기본값을 써서 0 이 살아남아요." },
    en: { title: "Prefer ?? over || for defaults", body: "count || 10 treats 0 and the empty string as missing and gives 10. ?? uses the default only for null and undefined, so 0 survives." },
    code: "const page = query.page ?? 1;  // 0 은 0\nconst name = input || \"익명\";   // 빈 문자열이면 \"익명\"",
  },
  {
    id: "immutable-update",
    ko: { title: "상태는 직접 바꾸지 말고 새로 만들기", body: "배열에 push 하거나 객체 속성을 바로 바꾸면 React 가 변화를 못 알아채 화면이 안 바뀝니다. 전개 연산자나 map·filter 로 새 값을 만들어 넘기세요." },
    en: { title: "Create new state instead of mutating it", body: "Pushing onto an array or assigning an object property directly means React does not notice the change and the screen does not update. Build a new value with spread, map, or filter." },
    code: "setItems((prev) => [...prev, newItem]);\nsetUser((u) => ({ ...u, name: \"새 이름\" }));",
  },
  {
    id: "structured-clone",
    ko: { title: "깊은 복사는 structuredClone", body: "JSON.parse(JSON.stringify(x)) 는 Date·Map·undefined 를 망가뜨립니다. structuredClone 은 이런 값들을 올바르게 복사하는 표준 함수예요(함수는 복사할 수 없어요)." },
    en: { title: "Use structuredClone for deep copies", body: "JSON.parse(JSON.stringify(x)) mangles Date, Map, and undefined. structuredClone is the standard function that copies them correctly (functions cannot be cloned)." },
    code: "const copy = structuredClone(state);",
  },
  {
    id: "ts-unknown",
    ko: { title: "any 대신 unknown 으로 받고 좁히세요", body: "any 는 타입 검사를 꺼 버립니다. 외부에서 온 값은 unknown 으로 받고 typeof·검사 함수로 좁혀서 쓰면 안전하게 쓰면서도 실수를 컴파일 때 잡아요." },
    en: { title: "Take unknown instead of any, then narrow", body: "any turns type checking off. Take outside values as unknown and narrow them with typeof or a guard function, and you stay safe and catch mistakes at compile time." },
    code: "function parse(v: unknown) {\n  if (typeof v === \"string\") return v.trim();\n  throw new Error(\"문자열이 아니에요\");\n}",
  },
  {
    id: "functional-setstate",
    ko: { title: "이전 값에 기대는 업데이트는 함수형으로", body: "setCount(count + 1) 을 연달아 부르면 같은 count 를 읽어서 한 번만 늘어납니다. 이전 값이 필요하면 setCount(c => c + 1) 처럼 함수를 넘기세요." },
    en: { title: "Use the functional form when updating from the previous value", body: "Calling setCount(count + 1) several times reads the same count and only increases once. When you need the previous value, pass a function like setCount(c => c + 1)." },
    code: "setCount((c) => c + 1);\nsetCount((c) => c + 1); // +2",
  },
  {
    id: "passive-listeners",
    ko: { title: "스크롤·터치 리스너는 passive 로", body: "스크롤을 막을 일이 없는 touchstart·wheel 리스너에 { passive: true } 를 주면 브라우저가 기다리지 않고 바로 스크롤해서 부드러워져요." },
    en: { title: "Make scroll and touch listeners passive", body: "For touchstart and wheel listeners that never block scrolling, { passive: true } lets the browser scroll right away without waiting, so it feels smoother." },
    code: "window.addEventListener(\"touchstart\", onTouch, { passive: true });",
  },
  {
    id: "intl-format",
    ko: { title: "숫자·날짜는 Intl 로 현지화", body: "직접 문자열을 이어 붙이지 말고 Intl.NumberFormat·DateTimeFormat 을 쓰면 천 단위 구분, 통화, 날짜 형식이 사용자 언어에 맞게 자동으로 나옵니다." },
    en: { title: "Localize numbers and dates with Intl", body: "Instead of stitching strings by hand, Intl.NumberFormat and DateTimeFormat produce digit grouping, currency, and date formats that fit the user's language automatically." },
    code: "new Intl.NumberFormat(\"ko-KR\", { style: \"currency\", currency: \"KRW\" }).format(12000);\nnew Intl.DateTimeFormat(navigator.language).format(new Date());",
  },
  {
    id: "utc-dates",
    ko: { title: "시간은 UTC 로 저장하고 화면에서만 현지 시간으로", body: "서버와 브라우저의 시간대가 다르면 날짜가 하루씩 어긋납니다. ISO 8601(UTC)로 주고받고, 사용자에게 보여 줄 때만 현지 시간대로 바꾸세요." },
    en: { title: "Store time in UTC, show local time only on screen", body: "If the server and browser time zones differ, dates drift by a day. Exchange ISO 8601 (UTC) and convert to the local time zone only when showing it to the user." },
    code: "const iso = new Date().toISOString();           // 저장·전송\nnew Date(iso).toLocaleString(\"ko-KR\");            // 표시",
  },
  {
    id: "money-integers",
    ko: { title: "돈은 소수점 말고 정수로", body: "0.1 + 0.2 는 0.30000000000000004 입니다. 금액은 원·센트 같은 최소 단위 정수로 계산하고, 화면에 보일 때만 형식을 맞추세요." },
    en: { title: "Handle money as integers, not decimals", body: "0.1 + 0.2 is 0.30000000000000004. Calculate amounts in the smallest unit as integers (won, cents) and format only when showing them." },
    code: "const cents = 1999;               // $19.99\nconst total = cents * qty;",
  },
  {
    id: "url-builder",
    ko: { title: "URL 은 문자열 이어 붙이지 말고 URL 로", body: "검색어에 &, 공백, 한글이 있으면 직접 이어 붙인 주소가 깨집니다. URL·URLSearchParams 가 알아서 인코딩해 줘요." },
    en: { title: "Build URLs with URL, not string concatenation", body: "If a search term has &, spaces, or non-ASCII characters, a hand-built address breaks. URL and URLSearchParams encode them for you." },
    code: "const url = new URL(\"/search\", location.origin);\nurl.searchParams.set(\"q\", \"카페 & 베이커리\");",
  },
  // ---- React ----
  {
    id: "derived-state",
    ko: { title: "props 를 state 에 복사하지 마세요", body: "props 로 계산할 수 있는 값을 state 에 또 저장하면 둘이 어긋납니다. 렌더링 중에 계산하거나 key 로 컴포넌트를 새로 만들어 초기화하세요." },
    en: { title: "Do not copy props into state", body: "If you store in state a value you can compute from props, the two drift apart. Compute it while rendering, or reset the component with a key." },
    code: "const fullName = `${first} ${last}`; // state 가 아니라 계산",
  },
  {
    id: "context-value",
    ko: { title: "Context 값을 매번 새로 만들지 마세요", body: "Provider 의 value 에 { a, b } 를 직접 쓰면 렌더링마다 새 객체라서 구독한 모든 컴포넌트가 다시 그려집니다. useMemo 로 고정하거나 Context 를 잘게 나누세요." },
    en: { title: "Do not recreate the Context value every render", body: "Writing value={{ a, b }} on a Provider makes a new object on each render, re-rendering every subscriber. Stabilize it with useMemo or split the Context." },
    code: "const value = useMemo(() => ({ user, logout }), [user]);\n<AuthContext.Provider value={value}>",
  },
  {
    id: "error-boundary",
    ko: { title: "에러 경계로 화면 전체가 하얘지는 걸 막으세요", body: "렌더링 중 예외가 나면 앱 전체가 하얗게 비어요. Error Boundary 로 영역별로 감싸 두면 그 부분만 안내를 보여 주고 나머지는 살아 있습니다." },
    en: { title: "Use error boundaries to avoid a whole-screen blank", body: "An exception during rendering blanks the whole app. Wrapping areas in an Error Boundary shows a message just for that part and keeps the rest alive." },
    code: "<ErrorBoundary fallback={<p>문제가 생겼어요</p>}>\n  <Chart />\n</ErrorBoundary>",
  },
  {
    id: "strict-effects",
    ko: { title: "개발 모드에서 effect 가 두 번 도는 건 정상", body: "StrictMode 는 정리(cleanup)를 잘 했는지 확인하려고 개발 중에만 effect 를 두 번 실행합니다. 두 번 돌았을 때 문제가 생긴다면 정리 함수가 빠졌다는 신호예요." },
    en: { title: "Effects running twice in dev is normal", body: "StrictMode runs effects twice in development only, to check that your cleanup works. If a double run causes problems, the cleanup function is missing." },
    code: "useEffect(() => {\n  const id = setInterval(tick, 1000);\n  return () => clearInterval(id);\n}, []);",
  },
  // ---- 보안 ----
  {
    id: "xss-innerhtml",
    ko: { title: "사용자 입력을 innerHTML 에 넣지 마세요", body: "innerHTML·dangerouslySetInnerHTML 에 사용자가 쓴 글을 그대로 넣으면 스크립트가 실행되는 XSS 가 됩니다. 글자만 보일 때는 textContent 를 쓰고, HTML 이 꼭 필요하면 검증된 sanitizer 를 거치세요." },
    en: { title: "Never put user input into innerHTML", body: "Putting user-written text into innerHTML or dangerouslySetInnerHTML lets scripts run (XSS). Use textContent when you only show text, and run it through a vetted sanitizer if you truly need HTML." },
    code: "el.textContent = userText;           // 안전\n// el.innerHTML = userText;         // 위험",
  },
  {
    id: "csp-basics",
    ko: { title: "CSP 는 XSS 의 두 번째 방어선", body: "Content-Security-Policy 로 실행을 허용할 스크립트 출처를 제한하면 XSS 가 뚫려도 피해를 줄일 수 있습니다. 인라인 스크립트는 막고 nonce·hash 를 쓰는 엄격한 정책이 가장 강력해요. 입력 검증·출력 인코딩과 함께 쓰는 보조 수단입니다." },
    en: { title: "CSP is a second line of defense against XSS", body: "Limiting which script origins may run with Content-Security-Policy reduces damage even if XSS slips through. A strict policy that blocks inline scripts and uses nonces or hashes is strongest. It complements, not replaces, input validation and output encoding." },
    code: "Content-Security-Policy: default-src 'self'; script-src 'self' 'nonce-abc123'",
    source: MDN_CSP,
  },
  {
    id: "noopener",
    ko: { title: "새 탭으로 여는 외부 링크에는 rel", body: "target=\"_blank\" 링크는 열린 페이지가 window.opener 로 원래 페이지에 접근할 수 있었습니다. 요즘 브라우저는 기본으로 막지만 rel=\"noopener noreferrer\" 를 붙이면 오래된 환경과 리퍼러 노출까지 대비돼요." },
    en: { title: "Add rel to external links that open in a new tab", body: "A target=\"_blank\" page could reach the original page through window.opener. Modern browsers block this by default, but rel=\"noopener noreferrer\" also covers older environments and referrer leakage." },
    code: "<a href=\"https://example.com\" target=\"_blank\" rel=\"noopener noreferrer\">...</a>",
  },
  {
    id: "samesite-cookies",
    ko: { title: "쿠키에는 HttpOnly·Secure·SameSite", body: "HttpOnly 는 JS 가 쿠키를 읽지 못하게, Secure 는 HTTPS 에서만 보내게, SameSite 는 다른 사이트에서 온 요청에 쿠키를 붙이지 않게 합니다(CSRF 완화). 로그인 쿠키는 세 가지를 모두 의식하세요." },
    en: { title: "Cookies: HttpOnly, Secure, SameSite", body: "HttpOnly keeps JS from reading the cookie, Secure sends it only over HTTPS, and SameSite keeps it off cross-site requests (CSRF mitigation). Think about all three for login cookies." },
    code: "Set-Cookie: sid=abc; HttpOnly; Secure; SameSite=Lax; Path=/",
  },
  {
    id: "no-secrets-in-bundle",
    ko: { title: "프론트엔드 코드에 비밀키를 넣지 마세요", body: "번들에 들어간 값은 누구나 개발자 도구로 볼 수 있습니다. VITE_·NEXT_PUBLIC_ 접두사가 붙은 환경변수는 공개되는 값이에요. 비밀키는 서버에서만 쓰고, 프론트엔드는 공개 가능한 키만 가지세요." },
    en: { title: "Never put secret keys in frontend code", body: "Anything in the bundle can be read by anyone with dev tools. Env vars prefixed VITE_ or NEXT_PUBLIC_ are public. Keep secret keys on the server only; the frontend should hold only keys that are safe to expose." },
    code: "// ✗ const key = import.meta.env.VITE_SECRET_KEY\n// ✓ 서버(API)에서 키를 쓰고, 프론트는 결과만 받는다",
  },
  {
    id: "sri",
    ko: { title: "외부 스크립트에는 SRI 로 무결성 확인", body: "CDN 에서 불러오는 스크립트가 바뀌어도 알아채지 못하면 위험합니다. integrity 속성에 해시를 적으면 내용이 다를 때 브라우저가 실행하지 않아요." },
    en: { title: "Verify external scripts with SRI", body: "A script loaded from a CDN that changes unnoticed is dangerous. With a hash in the integrity attribute, the browser refuses to run it if the content differs." },
    code: "<script src=\"https://cdn.example.com/lib.js\"\n  integrity=\"sha384-...\" crossorigin=\"anonymous\"></script>",
  },
  // ---- 접근성 ----
  {
    id: "skip-link",
    ko: { title: "'본문으로 건너뛰기' 링크를 넣으세요", body: "키보드 사용자는 매 페이지마다 메뉴를 수십 번 Tab 으로 지나야 본문에 닿습니다. 맨 앞에 본문으로 가는 링크를 두고, 포커스를 받으면 보이게 하세요." },
    en: { title: "Add a \"skip to content\" link", body: "Keyboard users must Tab through the menu dozens of times on every page to reach the content. Put a link to the main content first and make it visible when focused." },
    code: "<a class=\"skip\" href=\"#main\">본문으로 건너뛰기</a>\n<main id=\"main\">...</main>",
  },
  {
    id: "dialog-focus",
    ko: { title: "모달은 <dialog> 와 포커스 관리", body: "모달이 열리면 포커스를 안으로 옮기고, 닫히면 열었던 버튼으로 돌려주세요. Esc 로 닫혀야 하고요. 네이티브 <dialog> 의 showModal() 은 이걸 대부분 해 줍니다." },
    en: { title: "Modals: use <dialog> and manage focus", body: "When a modal opens, move focus inside; when it closes, return focus to the button that opened it. Esc should close it. The native <dialog> showModal() does most of this for you." },
    code: "<dialog id=\"d\"><form method=\"dialog\"><button>닫기</button></form></dialog>\n<script>d.showModal()</script>",
  },
  {
    id: "form-errors",
    ko: { title: "오류는 색깔만이 아니라 글로", body: "입력칸이 빨개지기만 하면 색을 못 보거나 스크린 리더를 쓰는 사람은 오류를 모릅니다. 오류 메시지를 글로 쓰고 aria-invalid·aria-describedby 로 입력칸에 연결하세요." },
    en: { title: "Show errors in words, not just color", body: "If the field only turns red, people who cannot see color or use a screen reader miss the error. Write the message and connect it to the field with aria-invalid and aria-describedby." },
    code: "<input aria-invalid=\"true\" aria-describedby=\"e1\" />\n<p id=\"e1\">이메일 형식이 올바르지 않아요</p>",
  },
  {
    id: "touch-target",
    ko: { title: "누르는 영역은 넉넉하게", body: "WCAG 2.2 는 최소 24×24 CSS px 를 요구하고, 손가락으로 누르기 편한 크기는 44px 안팎입니다. 아이콘이 작아도 padding 으로 누르는 영역을 키우세요." },
    en: { title: "Make tap targets generous", body: "WCAG 2.2 requires at least 24×24 CSS px, and a comfortable size for a finger is around 44px. Even with a small icon, grow the tappable area with padding." },
    code: ".icon-btn { min-width: 44px; min-height: 44px; padding: 10px; }",
  },
  {
    id: "lang-switch",
    ko: { title: "다른 언어가 섞이면 lang 으로 알려 주세요", body: "한국어 문서에 영어 문장이 있으면 그 부분에 lang=\"en\" 을 주세요. 스크린 리더가 그 구간만 영어 발음으로 읽어 줍니다." },
    en: { title: "Mark other-language passages with lang", body: "If a Korean page has an English sentence, give that part lang=\"en\" so the screen reader reads just that stretch with English pronunciation." },
    code: "<p>이 기능은 <span lang=\"en\">progressive enhancement</span> 방식이에요.</p>",
  },
  {
    id: "heading-outline",
    ko: { title: "제목은 글자 크기가 아니라 구조로", body: "h1 → h2 → h3 처럼 내용의 계층대로 제목 태그를 쓰세요. 스크린 리더 사용자는 제목 목록으로 페이지를 훑습니다. 크기는 CSS 로 따로 정하세요." },
    en: { title: "Headings are structure, not font size", body: "Use heading tags in the content's hierarchy: h1 → h2 → h3. Screen reader users skim a page through its list of headings. Set the size separately with CSS." },
    code: "<h1>주문</h1>\n  <h2>배송지</h2>\n  <h2>결제 수단</h2>",
  },
  // ---- 네트워크 ----
  {
    id: "fetch-ok",
    ko: { title: "fetch 는 404·500 에도 성공으로 끝나요", body: "fetch 는 네트워크가 끊겼을 때만 실패하고, 서버가 404·500 을 돌려줘도 Promise 는 이행됩니다. response.ok 를 꼭 확인하세요." },
    en: { title: "fetch succeeds even on 404 and 500", body: "fetch rejects only when the network fails; if the server returns 404 or 500 the Promise still resolves. Always check response.ok." },
    code: "const res = await fetch(url);\nif (!res.ok) throw new Error(`HTTP ${res.status}`);",
  },
  {
    id: "optimistic-update",
    ko: { title: "좋아요 같은 가벼운 동작은 낙관적 업데이트", body: "서버 응답을 기다렸다가 화면을 바꾸면 느리게 느껴집니다. 먼저 화면을 바꾸고 실패하면 되돌리는 낙관적 업데이트로 즉각적인 반응을 주세요." },
    en: { title: "Optimistic updates for light actions like \"like\"", body: "Waiting for the server response before updating the screen feels slow. Update the screen first and roll back on failure for an instant response." },
    code: "setLiked(true);\ntry { await api.like(id); } catch { setLiked(false); }",
  },
  // ---- SEO ----
  {
    id: "og-meta",
    ko: { title: "링크 미리보기는 og 메타 태그로", body: "카카오톡·슬랙에 주소를 붙였을 때 나오는 제목·설명·이미지는 og:title, og:description, og:image 가 정합니다. 없으면 엉뚱한 글이나 빈 카드가 나와요." },
    en: { title: "Control link previews with og meta tags", body: "The title, description, and image shown when you paste a URL into a chat app come from og:title, og:description, and og:image. Without them you get random text or an empty card." },
    code: "<meta property=\"og:title\" content=\"제목\" />\n<meta property=\"og:image\" content=\"https://.../thumb.png\" />",
  },
];

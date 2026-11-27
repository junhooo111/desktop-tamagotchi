# desktop-tamagotchi — 작업 지침(하네스)

개발은 Claude Code 에게 지시하는 방식으로 진행한다. 새 세션은 이 문서부터 읽는다.
**개발하다가 이슈·개선점·배운 점이 생기면 이 문서에 계속 추가한다**(같은 변경에서 함께 커밋). 지침이 낡았으면 고친다.

## 구성
- 데스크톱 앱: Electron + TypeScript, 테스트 Vitest. 구조·명령은 [docs/development.md](docs/development.md).
- 서버: Supabase(Postgres + Auth + RLS + RPC). 설계 [docs/platform-design.md](docs/platform-design.md), 순서 [docs/server-roadmap.md](docs/server-roadmap.md), 설정 [docs/backend-setup.md](docs/backend-setup.md), 작업 기록 [docs/worklog.md](docs/worklog.md).
- 규칙 코드(`src/shared`, `src/main/*-sync·store·auth` 의 순수 함수)는 화면과 분리해서 테스트로 고정한다.

## 매번 하는 일
1. 코드를 바꾸면 `npm run typecheck` → `npm test` → (앱 실행에 닿으면) `npm run smoke`.
2. DB 를 바꾸면 `supabase/migrations/000N_*.sql` 을 **새 파일로** 추가하고(이미 적용한 파일은 고치지 않는다), SQL 시험(`npx vitest run supabase`)을 먼저 통과시킨 뒤 `npx supabase db push --linked --yes` 로 운영 DB 에 적용한다. 앱을 바꿔서 DB 가 필요하면 사용자에게 묻지 않고 같이 한다(사용자 지시, 2026-11-27).
3. `docs/worklog.md` 에 무엇을 했는지·한계를 적고, 새로 배운 점은 아래 "배운 점"에 추가한다.
4. 커밋은 한국어 한 줄 제목 + 본문, 마지막에 `Co-Authored-By` 줄. **작성자 이메일은 가림 주소**(`26132746+junhooo111@users.noreply.github.com`, name `junhooo111`)만 쓴다. 푸시는 main 에 바로 한다(사용자 허락됨).
5. 사용자에게 알릴 때는 확인한 것과 **확인하지 못한 것**을 나눠서 쓴다.

## 지켜야 할 것
- **기존 사용자의 진행을 잃지 않는다.** 로컬 저장 파일을 덮어쓰기 전에 항상 백업(`account-sync.ts` 의 `backupLocal`), 서로 다른 진행이 있으면 자동 덮어쓰기 대신 묻는다.
- 비밀키(Supabase service/secret 키, GitHub 클라이언트 시크릿, DB 비밀번호)는 레포·대화·로그에 두지 않는다. 앱에 들어가는 값은 주소와 publishable 키뿐이다(`src/shared/backend.ts`).
- 클라이언트는 테이블을 직접 고치지 못하고 서버 함수(RPC)만 부른다. 새 테이블은 RLS 를 켜고 권한을 회수한 뒤 필요한 것만 연다(0001·0004 참고).
- (2026-11-27) 경매장은 수수료가 없다. 중복 동물은 경험치가 아니라 **별개의 펫(개체)** 으로 남긴다 — 앱(로컬)은 중복이면 경험치 +30 이지만 서버는 거래를 위해 개체로 둔다. 서버 연결(C 단계) 때 화면 문구를 맞춘다.
- 재화는 둘이다: **뽑기권(tickets)** 은 뽑기용, **게임머니(coins)** 는 돌봄·업적·GitHub 커밋으로 얻어 경매장에서만 쓴다(수수료 없음). 원장(ledger)은 재화별로 "잔액 = 원장 합계".
- 현금화 수단을 만들지 않는다.

## 배운 점
- **Node**: jsdom 31 은 Node ≥ 22.22 / 24.15 / 26 이 필요하다. 22.13 에서는 화면(jsdom) 시험 파일이 "Failed to start forks worker" 로 시작도 못 한다. 이 PC 는 Node 26 으로 올렸다.
- **Windows 셸 따옴표**: `bash -c` 안에서 백슬래시·`\n`·템플릿 문자열을 한 번에 다루면 깨진다(`join('\n')` 이 실제 줄바꿈으로 들어간 적이 있다). 여러 줄 코드는 파일로 쓰고(Write/Edit), 치환 스크립트는 작은 단위로 한다.
- **`git add -A` 주의**: Supabase CLI 가 `supabase/.temp/` 를 만든다. `.gitignore` 에 있다. 새 도구가 임시 폴더를 만들면 커밋 전에 `git status` 로 확인한다.
- **딥링크 로그인은 브라우저가 조용히 막는다**(`desktop-tamagotchi://` 를 사용자 동작 없이 열면 흰 화면). 로그인 복귀는 `127.0.0.1:47832/auth/callback` 임시 서버로 받고, Supabase Redirect URLs 에 등록해 둔다.
- **저장 후 재시작**: 받아 온 저장분을 쓴 뒤 `app.exit(0)` 로 바로 끝낸다. `app.quit()` 는 `before-quit` 에서 메모리의 낡은 상태를 다시 파일에 써서 받아 온 진행을 덮어쓴다.
- **개발 실행과 설치본은 한 번에 하나만 뜬다**(단일 실행 잠금). 개발 실행 전에 설치본을 종료해야 한다.
- **마이그레이션은 순서가 중요하다**: 제약(check)을 바꿀 때는 기존 행을 먼저 지우거나 바꾼 뒤에 새 제약을 건다(0005 에서 겪음).
- **SQL 시험을 먼저 돌리는 이유**: `insert … select` 에서 열 수가 안 맞는 것 같은 오류는 PGlite 시험에서만 잡힌다(운영에 올린 뒤에는 늦다). 마이그레이션은 시험 통과 전에 `db push` 하지 않는다.
- **가져오기(0006)**: 서버는 앱이 보낸 값이 아니라 **0004 에 올라간 계정 저장분**을 읽어 변환한다. 한 계정에 한 번(`account_imports`), 서버에 펫이 이미 있으면 안 한다. 앱(C 단계)은 로그인 후 저장분 동기화가 끝난 다음에 부른다.
- **Supabase 무료 플랜은 한 주 동안 DB 활동이 거의 없으면 일시정지**된다. `.github/workflows/supabase-keepalive.yml` 이 이틀에 한 번 공개 테이블을 읽는다.
- **CLI 로 올리는 DB**: 0001~0003 은 SQL Editor 로 올렸고 `supabase migration repair --status applied 0001 0002 0003` 으로 기록했다. 새 PC 는 `npx supabase login` → `link --project-ref bqsidhjdxoxtrmmymwej`.
- 개발 실행 중 `safeStorage.isEncryptionAvailable` 등이 deprecated 경고를 낸다. 동작에는 문제없고, 나중에 비동기 API 로 바꾼다.
- **서버 기준 모드(C2)**: 로그인하면(`serverOn()`) 뽑기·꾸미기 뽑기·뽑기권 획득은 서버가 한다. 로컬 상수를 바꾸면 서버 함수(0005·0007)도 같이 바꾸고, SQL 시험이 앱 상수와 같은 값인지 비교한다. 뽑기권을 로컬에서 올리는 곳을 새로 만들면 `serverAward` 를 거치게 한다(안 그러면 로그인 사용자의 뽑기권이 서버와 어긋난다). 서버에 닿지 않을 때 로컬로 대신 뽑지 않는다(서버 기준이 갈라진다).
- **서버에 정말 저장됐는지 확인하기**: Docker 가 없어도 `npx supabase inspect db table-stats --remote` 로 표별 행 수(추정)를 읽을 수 있다. 사용자 데이터의 내용을 읽는 도구는 쓰지 않는다. 내용 확인이 필요하면 앱의 `my_summary()` 결과(랭킹 창)를 사용자에게 보여 달라고 한다.
- **다른 사람이 쓴 문자열(GitHub 이름 등)은 `textContent` 로만 그리고, 이미지 주소는 허용 목록(avatars.githubusercontent.com)만 쓴다.** 랭킹 창 CSP 도 같은 주소만 연다.
- **Edge Function 배포**: `npm run build:function`(tsc + esbuild 번들) 후 `npx supabase functions deploy card --no-verify-jwt --use-api --remote=bqsidhjdxoxtrmmymwej --yes`. `--yes` 없이는 에이전트 실행이 막힌다. 함수는 비밀키 없이 공개 키로 `public_card_data` 만 부른다(공개 함수는 권한이 좁은 SQL 함수로 설계한다). 카드 코드(`card.ts`·`card-endpoint.ts`)를 바꾸면 번들을 다시 만들어 다시 배포해야 반영된다.
- **서버 카드가 안 보이면**: 먼저 `curl <주소>/functions/v1/card?user=<이름>` 로 200·`image/svg+xml` 인지 본다. GitHub 이 그림을 잠시 기억하므로 몇 분 늦을 수 있다.
- **릴리스 = 공지도 함께**: 버전을 올릴 때마다 `news.json` 맨 앞에 새 소식을 한 개 추가한다(id 는 `v<버전>-<주제>`, 제목 40자·본문 200자 이내, 링크는 이 저장소 주소만, 쉬운 말로 사용자가 얻는 것 위주). 앱이 1시간마다 main 의 `news.json` 을 읽어 보여 주므로 **푸시하면 바로 기존 사용자에게 공지된다**. `src/shared/news-release.test.ts` 가 현재 버전의 공지가 없으면 시험을 실패시킨다.
- **릴리스 절차**: 버전 올리기(`npm version X --no-git-tag-version`, README 배지) → 전체 시험·스모크 → `npm run dist` → 패키지 앱 스모크(`release/win-unpacked/Desktop Tamagotchi.exe --smoke`, 개발 앱을 먼저 종료) → 푸시 → `gh release create vX --target main --notes-file …` 에 `.exe`·`.exe.blockmap`·`latest.yml` 첨부(`release/notes-<버전>.md`). 맥(`npm run pack:mac`)은 **진짜 Python 3 가 필요**하다. 이 PC 의 `python` 은 Microsoft Store 안내용 껍데기라, 실제 Python(`%LOCALAPPDATA%/Programs/Python/Python312/python.exe`, 2026-11-27 설치)을 환경 변수 `PYTHON` 으로 넘겨야 한다: `PYTHON=<경로> npm run pack:mac`. 만든 zip·latest-mac.json 은 `release-mac/` 에 생기고 `gh release upload` 로 올린다(v0.10.0~v0.12.0 은 맥 파일이 없고 v0.12.1 부터 있다). 맥 사용자는 `latest-mac.json` 이 없으면 업데이트를 못 찾는다.
- **창을 닫는 저장 버튼은 결과를 말해 준다**: 꾸미기 창은 이름 저장 뒤 창을 닫고 펫이 '이제 내 이름은 …' 말풍선으로 알린다(저장이 됐는지 안 보인다는 사용자 피드백). 새 설정 창에도 같은 원칙을 쓴다.
- **서버가 기준인 계정은 컬렉션 반영이 '합집합'이 아니다**: 경매장에서 팔면 서버 쪽 펫이 사라지므로, 이미 가져온 계정(`imported`)은 서버가 가진 종만 남긴다. 서버에 동물이 하나도 없으면 지우지 않는 안전장치를 둔다.
- **Bash 에서 큰 heredoc 은 따옴표 때문에 깨진다**: 여러 파일은 Write 도구로 만든다.
- **정규식이 들어간 파일 수정**: `node -e`·패치 스크립트의 문자열 안에서 `\s`·`\b`·`\.` 같은 역슬래시 이스케이프가 사라지거나 `\b` 가 실제 백스페이스 문자(0x08)로 바뀐 적이 있다(업데이트 오류 메시지의 `s` 가 지워지던 것을 시험이 잡았다). 정규식이 든 수정은 Edit 도구로 하고, 끝나면 `grep -rlP "\x08" src` 와 시험으로 확인한다.
- **새 동물(특별·전설 등급)은 기존 동물과 같은 해상도로 그린다**: 뭉치지 않은 고해상도 + 음영은 어색하다는 의견으로 되돌렸다(2026-11-28). 히든은 지금 그대로 둔다. 신경 쓸 것은 해상도가 아니라 실루엣과 색의 구분이다(chunky 에서는 얇은 꼬리·작은 무늬가 뭉개지고 같은 계열 색이 합쳐진다). 그림은 PNG 로 렌더링해 눈으로 확인한다.
- **heredoc 은 끝맺음 줄(`EOF`)을 꼭 쓰고, 한 번에 너무 길게 쓰지 않는다**: 긴 패치 스크립트가 중간에 잘려 `Unexpected end of input` 이 난 적이 있다. 100줄이 넘으면 Edit/Write 도구로 나눠서 한다. 또 `ui-en.ts` 같은 사전에는 같은 한국어 키가 이미 있을 수 있어서(예: 랭킹의 `뽑기`) 새 글자를 넣고 `npm run typecheck` 로 중복 키를 확인한다.
- **검사 규칙을 늘리면 실제 사이트로 오탐을 점검한다**: 접근성이 좋은 사이트(gov.uk·W3C WAI·MDN 등)에 수집기를 넣어 돌렸을 때 지적이 거의 없어야 한다. 방법과 발견은 docs/worklog.md 의 "검사 오탐 점검" 항목.

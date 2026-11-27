# 개발자를 위한 정보

> [README](../README.md)는 사용 설명서입니다. 직접 빌드하거나 코드를 고치려는 분을 위한 내용은 여기 있습니다.

### 직접 만들어서 설치하기 (Windows)

[Node.js](https://nodejs.org/) (LTS)가 필요합니다.

```powershell
git clone https://github.com/junhooo111/desktop-tamagotchi.git
cd desktop-tamagotchi
npm install
npm run dist
```

끝나면 `release\Desktop-Tamagotchi-Setup-<버전>.exe` 가 생깁니다.

### macOS 배포 파일 만들기

`electron-builder` 는 macOS 에서만 mac 빌드를 지원하고 Windows 는 심볼릭 링크를 만들 수 없어서, 공식 Electron macOS zip 에 앱을 넣어 묶는 스크립트를 따로 둡니다(`scripts/pack-mac.mjs` + `scripts/mac-zip.py`, Python 3 필요).

```powershell
npm run pack:mac
```

`release-mac/` 에 `Desktop-Tamagotchi-<버전>-mac-arm64.zip`, `-mac-x64.zip`, `latest-mac.json`(버전·sha512, 맥 자동 업데이트가 읽는 파일)이 생깁니다. 코드 서명·공증이 없고 맥에서 실행해 보지 못한 시험판입니다.
맥 자동 업데이트는 electron-updater 를 쓸 수 없어서 직접 만들었습니다(`src/main/mac-updater.ts`): `latest-mac.json` 확인 → 이 저장소 릴리스에서 내 아키텍처 zip 받기 → 해시 검증 → `ditto` 로 풀기 → 앱이 끝나는 순간 셸 스크립트가 앱을 바꿔치기(실패하면 백업으로 되돌림).

### README 그림 만들기

```powershell
npm run readme-images
```

`docs/images/` 아래에 동물·히든 실루엣·성장 단계·꾸미기·선물/응가·프로필 카드 SVG 를 앱의 실제 도트 그림에서 뽑아 만듭니다. 히든 동물은 파일 이름에도 이름을 쓰지 않습니다(`hidden-1.svg` …).

### 공지 올리기

앱이 1시간마다 저장소의 `news.json` 을 읽습니다. `items` 에 `{id, date, title, body, url}` 를 추가해 push 하면 됩니다(제목 40자·본문 200자, `url` 은 이 저장소 주소만).

### 개발 환경에서 실행

[Node.js](https://nodejs.org/) 가 필요합니다.

```powershell
npm install
npm start
```

종료는 펫이나 트레이 아이콘을 우클릭해서 `종료` 를 고릅니다.
설치본과 개발 실행은 같은 저장 폴더를 쓰고 **한 번에 하나만** 실행됩니다. 설치본이 떠 있으면 `npm start` 는 바로 종료됩니다.

### 명령어

```powershell
npm test               # 단위 테스트(Vitest)
npm run typecheck      # 타입 검사
npm run smoke          # 창을 잠깐 띄워 렌더러 오류가 없는지 확인
npm run demo           # 시험 페이지 서버 (http://localhost:5199)
npm run chrome         # 검사용 브라우저 열기 (주소를 붙이면 그 주소로: npm run chrome http://localhost:5173)
npm run icon           # 앱 아이콘(build/icon.*)을 펫 도트에서 다시 만들기
npm run build:extension # 확장의 content.js 를 앱의 검사 규칙으로 다시 만들기(npm run build 가 함께 실행)
npm run pack           # 설치 없이 실행해 볼 수 있는 폴더 빌드(release/win-unpacked)
npm run dist           # 설치 파일(release/Desktop-Tamagotchi-Setup-<버전>.exe) 만들기
```

환경 변수: `PET_CDP_PORT`(크롬 디버그 포트, 기본 9222), `PET_FEED_PORT`(확장 수신 포트, 기본 47831), `PET_DEMO_PORT`(시험 페이지 포트, 기본 5199).
수신 포트를 바꾸면 `extension/manifest.json`·`background.js`·`popup.js` 의 포트도 같이 바꿔야 합니다.

### 릴리스 올리기 (메인테이너용)

1. `package.json`(과 `package-lock.json`)의 `version` 을 올립니다.
2. `npm run dist` 로 Windows 설치 파일을, `npm run pack:mac` 으로 맥 파일을 만듭니다.
3. GitHub 의 Releases 에서 새 릴리스(태그 `v<버전>`)를 만들고 **Windows: `.exe`, `.exe.blockmap`, `latest.yml`** 과 **맥: `-mac-arm64.zip`, `-mac-x64.zip`, `latest-mac.json`** 을 Assets 로 올립니다. 자동 업데이트는 `latest.yml`(Windows)·`latest-mac.json`(맥)을 보고 새 버전을 찾기 때문에 이 파일이 빠지면 업데이트가 동작하지 않습니다.
4. 새 버전으로 업데이트한 사용자는 처음 켤 때 뽑기권 2장을 받습니다(`UPDATE_GIFT_TICKETS`).

### 구조

| 경로 | 내용 |
|---|---|
| `src/shared/pixel.ts` | 도트 그리기 도구(32x32 격자, 타원·삼각형·선, 부품별 윤곽선, 뒤집기·회전) |
| `src/shared/art/` | 그림 그리기: 네발 동물·새·알의 뼈대와 동작별 자세 표, 색 계산. `chunky.ts` 가 마지막에 16칸 굵기로 뭉친다 |
| `src/shared/species.ts` | 펫 종류와 스프라이트(종 9 × 알·새끼·성체 × 색 변형 × 장식, 동작별 34프레임, 처음 쓸 때 그려서 기억) |
| `src/shared/art/accessory.ts` · `style.ts` | 꾸미기 장식(리본·선글라스·왕관·날개·새싹·꽃·파티 모자·천사 고리) 그리기와 색 변형 계산 |
| `src/shared/card.ts` · `scripts/export-card.mjs` | 프로필 카드(움직이는 SVG, CSS 애니메이션) 만들기. 메뉴와 `npm run card` 가 같은 함수를 쓴다 |
| `src/shared/wardrobe.ts` | 어떤 동물·색·장식이 어떤 업적으로 열리는지, 잠금 판정, 보상 문구. 화면은 `src/renderer/wardrobe.ts` |
| `src/shared/motion.ts` · `animation.ts` | 동작 종류, 벽에서 그림을 돌리는 규칙, 시각에 맞는 프레임 결정 |
| `src/shared/pet.ts` | 성장·배고픔·기분 규칙 |
| `src/shared/layout.ts` | 창과 펫의 크기 |
| `src/shared/lessons.ts` · `quizzes.ts` | 검사 규칙 50종, 배움 카드 문구, 확인 퀴즈 |
| `src/shared/notice.ts` | 찾은 문제를 말풍선 내용(문제·위치·고치는 법)으로 바꿈 |
| `src/shared/tips.ts` | FE 지식 모음과 알림 시점 규칙 |
| `src/inspect/collector.ts` | 페이지 안에서 실행되는 검사 수집기(앱과 확장이 같은 코드를 씀) |
| `src/inspect/cdp.ts` · `targets.ts` · `scan.ts` | 크롬 디버그 포트 검사: 연결, 검사해도 되는 탭(로컬 주소) 고르기, 화면 좌표 변환 |
| `src/inspect/feed.ts` | 확장이 보낸 검사 결과의 검증·보관·병합 |
| `src/main/main.ts` | 창·메뉴·트레이·IPC·마우스 위치 (Electron 메인) |
| `src/main/behavior.ts` | 행동 상태 머신(걷기·뛰기·졸기·벽 타기·놀기·매달리기·문제 알리기) |
| `src/shared/growth.ts` · `src/main/growth-store.ts` | 연속 사용·업적·도감 계산(순수 함수)과 저장. 화면은 `src/renderer/codex.ts` |
| `src/shared/settings.ts` · `src/main/settings-store.ts` | 사용자 설정(허용값 검증·저장). 설정 창은 `src/renderer/settings.ts` |
| `src/main/updater.ts` | 자동 업데이트 제어(electron-updater 를 감싸서 테스트 가능) |
| `src/main/feed-server.ts` | 확장이 결과를 보내는 127.0.0.1 전용 수신 서버(Origin·Host 검사) |
| `src/main/progress.ts` · `store.ts` | 확인·고침·미루기 진행도, 펫 상태 저장·복원 |
| `src/main/browser.ts` · `demo-server.ts` · `inspect-target.ts` | 검사용 브라우저 찾기·실행, 시험 페이지 서버, 문제 요소 옆 펫이 설 자리 계산 |
| `src/renderer/` | 캔버스 그리기와 마우스 입력, 말풍선, 배움 카드 화면 |
| `extension/` | 크롬 확장(MV3). `content.js` 는 `scripts/build-extension.mjs` 가 만든다 |
| `static/` · `scripts/` · `test-pages/` | HTML·CSS·preload / 실행·빌드 스크립트 / 일부러 문제를 넣어 둔 시험 페이지 |
| `supabase/` | 계정·뽑기·거래용 DB(스키마·권한·서버 함수)와 SQL 테스트 |

규칙 코드(`shared`, `behavior`, `store`, `feed`)는 화면과 분리한 순수 로직이라 테스트로 고정되어 있습니다.

### 기술 스택

Electron + TypeScript. 테스트는 Vitest(jsdom, PGlite 로 SQL 검증). 도트 그림은 이미지 파일 없이 전부 코드로 그립니다.


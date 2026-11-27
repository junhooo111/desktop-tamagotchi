# 백엔드(Supabase) 준비

계정을 만들거나 비밀키를 다루는 일이라 **사용자가 직접** 합니다. 설계는 [platform-design.md](platform-design.md) 를 보세요.

## 1. Supabase 프로젝트 만들기
1. https://supabase.com 에서 **GitHub 로 가입**합니다.
2. New project → 이름 `desktop-tamagotchi`, 지역은 **Northeast Asia (Seoul)**, DB 비밀번호는 비밀번호 관리자에 저장(레포·대화에 쓰지 않기).
3. 만들어지면 Project Settings → **API** 에서 두 값을 확인합니다(둘 다 공개해도 되는 값).
   - Project URL (`https://<ref>.supabase.co`)
   - `anon` `public` 키
   - ⚠️ `service_role` 키는 어디에도 붙여 넣지 않습니다.

## 2. GitHub OAuth App 만들기
1. GitHub → Settings → Developer settings → OAuth Apps → **New OAuth App**.
2. Application name: `Desktop Tamagotchi`, Homepage URL: `https://github.com/junhooo111/desktop-tamagotchi`.
3. **Authorization callback URL**: Supabase 대시보드 → Authentication → Providers → GitHub 에 나오는 `Callback URL (for OAuth)` 를 그대로 붙입니다(`https://<ref>.supabase.co/auth/v1/callback`).
4. 만든 뒤 **Client ID** 를 확인하고 **Generate a new client secret** 으로 시크릿을 만듭니다.
5. Client ID·Secret 을 **Supabase 대시보드의 GitHub 제공자 칸에만** 입력하고 Enable 합니다.

## 3. Supabase 설정
- Authentication → URL Configuration → **Redirect URLs** 에 `desktop-tamagotchi://auth` 를 추가합니다(데스크톱 앱이 로그인 후 돌아오는 주소).

## 4. DB 올리기 (Claude 가 도와줍니다)
`supabase/migrations/0001~0003` 을 SQL Editor 에 순서대로 실행하거나, Supabase CLI 로 올립니다.

## 5. 앱과 연결
- 공개 값(주소·anon 키)을 `src/shared/backend.ts` 에 넣습니다. 개발 중에는 환경 변수 `PET_SUPABASE_URL`, `PET_SUPABASE_ANON_KEY` 로 덮어쓸 수 있습니다.
- 앱 메뉴에 `☁ GitHub로 로그인…` 이 나오면 연결된 것입니다(비어 있으면 `☁ 계정 (서버 준비 중)` 으로 보입니다).

## 6. 서버를 계속 살려 두기 (자동)
Supabase 무료 프로젝트는 **한 주 동안 DB 활동이 거의 없으면 일시정지**됩니다. 이틀에 한 번 공개 테이블을 읽는 GitHub Actions(`.github/workflows/supabase-keepalive.yml`)가 이를 막습니다.
- 레포 Settings → Secrets and variables → Actions → **Variables** 에 `SUPABASE_URL`, `SUPABASE_ANON_KEY` 를 추가합니다(공개 값이라 Variables 로 충분).
- 실패하면 워크플로가 실패로 표시되고 GitHub 가 알려 줍니다. 공식 보장은 아니고 "활동이 있으면 정지되지 않는다"는 규칙에 기대는 방법이라, 사용자가 늘면 유료 플랜(일시정지 없음)으로 올립니다.

## 7. DB 변경 적용 (Claude Code 가 한다)
`npx supabase login` 을 이 PC에서 한 번 해 두었고 프로젝트가 연결돼 있다(`supabase link --project-ref bqsidhjdxoxtrmmymwej`). 이후 DB 변경은 마이그레이션 파일을 추가하고 SQL 시험을 통과시킨 뒤 `npx supabase db push --linked --yes` 로 올린다.
- 0001~0003 은 처음에 SQL Editor 로 직접 올려서 `supabase migration repair --status applied 0001 0002 0003` 으로 기록해 두었다.
- 새 PC 에서는 `npx supabase login` → `npx supabase link --project-ref bqsidhjdxoxtrmmymwej` 를 먼저 한다.

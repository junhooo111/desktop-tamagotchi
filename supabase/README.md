# supabase/

플랫폼의 서버 쪽: DB 스키마, 권한(RLS), 서버 함수, 그리고 그것들을 검증하는 SQL 테스트입니다.
설계는 [docs/platform-design.md](../docs/platform-design.md)를 보세요.

## 구성

| 파일 | 내용 |
|---|---|
| `migrations/0001_schema.sql` | 테이블·제약, 가입 시 프로필 자동 생성, **권한(모든 쓰기 차단, 필요한 읽기만 허용)** |
| `migrations/0002_seed_species.sql` | 처음 만나는 펫 6종과 뽑기 확률 |
| `migrations/0003_functions.sql` | 서버 함수: 학습 보고·뽑기·판매 등록/취소·구매·장착·진화 |
| `tests/` | 위 마이그레이션을 실제 Postgres(PGlite)에 적용해서 시험하는 테스트 |

핵심 원칙: **클라이언트는 테이블을 직접 고치지 못하고, 서버 함수(RPC)만 부릅니다.**
재화·펫·거래는 전부 함수 안에서 검증하고, 재화가 변할 때마다 `ledger` 에 한 줄을 남깁니다.

## 테스트

Docker 도, Supabase 계정도 필요 없습니다. 루트에서:

```powershell
npx vitest run supabase
```

- 테스트는 Supabase 가 기본으로 주는 권한(새 테이블에 `anon`/`authenticated` 모든 권한)까지 흉내 내서,
  마이그레이션이 그 기본값을 제대로 회수하는지를 시험합니다.
- 일부러 구멍을 낸 마이그레이션을 끼워 보면 권한 테스트가 실패합니다(확인함).
- PGlite 는 연결이 하나라서 **진짜 동시 접속 경쟁은 시험하지 못합니다.** 실제 프로젝트가 생기면 동시 호출 테스트를 추가해야 합니다.

## 실제 Supabase 프로젝트에 올리려면 (사용자가 직접)

계정 생성과 비밀키 입력은 대신할 수 없습니다.

1. Supabase 에서 프로젝트를 만듭니다.
2. GitHub 에서 OAuth App 을 만들고(콜백 주소는 Supabase 의 Auth → Providers → GitHub 화면에 나옵니다),
   클라이언트 ID·시크릿을 **Supabase 대시보드에만** 입력합니다(대화나 레포에 붙여 넣지 않습니다).
3. [Supabase CLI](https://supabase.com/docs/guides/cli)로 `supabase init`(이 폴더에 `config.toml` 생성) → `supabase link` → `supabase db push`.
4. 올린 뒤 **RLS 확인**: 대시보드 Table Editor 에서 모든 테이블에 RLS 가 켜져 있는지, 익명 키로 `profiles`·`ledger` 를 읽으면 막히는지 봅니다.

> 웹·앱에는 공개용(anon) 키만 씁니다. **서비스 키는 어디에도 넣지 않습니다.**

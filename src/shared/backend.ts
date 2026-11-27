/**
 * 클라우드 서버(Supabase) 연결 정보. 둘 다 **공개해도 되는 값**이다(주소와 publishable 키).
 * 서비스 키(secret)·GitHub 클라이언트 시크릿은 절대 여기나 레포에 넣지 않는다(Supabase 대시보드에만 둔다).
 * 환경 변수 PET_SUPABASE_URL / PET_SUPABASE_ANON_KEY 로 덮어쓸 수 있다. 설정 방법은 docs/backend-setup.md.
 */
export const BACKEND = {
  url: 'https://bqsidhjdxoxtrmmymwej.supabase.co',
  anonKey: 'sb_publishable_LD-V4dcDAyGyJZoUq6-t8g_aDHJg4ch',
};

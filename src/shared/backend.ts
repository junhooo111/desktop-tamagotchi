/**
 * 클라우드 서버(Supabase) 연결 정보. 둘 다 **공개해도 되는 값**이다(주소와 publishable 키).
 * 서비스 키(secret)·GitHub 클라이언트 시크릿은 절대 여기나 레포에 넣지 않는다(Supabase 대시보드에만 둔다).
 * 환경 변수 PET_SUPABASE_URL / PET_SUPABASE_ANON_KEY 로 덮어쓸 수 있다. 설정 방법은 docs/backend-setup.md.
 */
export const BACKEND = {
  url: 'https://bqsidhjdxoxtrmmymwej.supabase.co',
  anonKey: 'sb_publishable_LD-V4dcDAyGyJZoUq6-t8g_aDHJg4ch',
};

/** GitHub 프로필 README 에 붙이는 펫 카드(움직이는 SVG) 주소. 이름은 GitHub 이름 형식만 허용한다. */
export function cardUrl(login: string, base: string = BACKEND.url): string | null {
  if (!/^[A-Za-z0-9-]{1,39}$/.test(login) || !base) return null;
  return `${base}/functions/v1/card?user=${login}`;
}

/** README 에 그대로 붙여 넣는 마크다운. */
export function cardMarkdown(login: string, base: string = BACKEND.url): string | null {
  const url = cardUrl(login, base);
  return url ? `![Desktop Tamagotchi](${url})` : null;
}

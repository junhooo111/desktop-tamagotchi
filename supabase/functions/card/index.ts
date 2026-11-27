// 프로필 README 카드: GET /functions/v1/card?user=<GitHub 이름>  →  움직이는 SVG
// 비밀키를 쓰지 않는다. 공개 키로 public_card_data()(0009)만 부른다. 규칙은 src/shared/card-endpoint.ts 를 번들한 card.bundle.js 에 있다.
// @ts-nocheck — Deno 런타임에서 실행된다(앱의 tsc 대상이 아니다).
import { renderCardFromRow } from './card.bundle.js';

const SB_URL = 'https://bqsidhjdxoxtrmmymwej.supabase.co';
const SB_KEY = 'sb_publishable_LD-V4dcDAyGyJZoUq6-t8g_aDHJg4ch'; // 공개 키(앱에도 들어 있다)

Deno.serve(async (req) => {
  const login = new URL(req.url).searchParams.get('user') ?? '';
  let row = null;
  try {
    const r = await fetch(`${SB_URL}/rest/v1/rpc/public_card_data`, {
      method: 'POST',
      headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ p_login: login }),
    });
    if (r.ok) row = await r.json();
  } catch {
    row = null;
  }
  const { svg, status } = renderCardFromRow(row);
  return new Response(svg, {
    status: 200,
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      // GitHub 의 이미지 중계가 한 번 받아 가므로 너무 길게 두지 않는다.
      'Cache-Control': status === 'ok' ? 'public, max-age=300, s-maxage=300' : 'public, max-age=60, s-maxage=60',
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'",
    },
  });
});

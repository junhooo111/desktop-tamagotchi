// GitHub 기여 → 게임머니: POST /functions/v1/commits  (로그인한 사용자의 JWT 필요)
// 서버가 GitHub API 로 사용자의 최근 기여 수를 읽고(GITHUB_READ_TOKEN 시크릿, 클라이언트로 나가지 않는다),
// grant_commit_coins(0011)에 넘긴다. 양·상한·중복 방지는 모두 SQL 이 정한다.
// @ts-nocheck — Deno 런타임에서 실행된다(앱의 tsc 대상이 아니다).

const SB_URL = Deno.env.get('SUPABASE_URL');
const SERVICE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const GH_TOKEN = Deno.env.get('GITHUB_READ_TOKEN');
const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, apikey, content-type' };

const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS });
  if (req.method !== 'POST') return json({ error: 'method' }, 405);
  if (!GH_TOKEN) return json({ error: 'not_configured' }, 503);

  // 누구인지는 사용자의 JWT 로만 정한다(요청 본문의 이름은 믿지 않는다).
  const auth = req.headers.get('Authorization') ?? '';
  const who = await fetch(`${SB_URL}/auth/v1/user`, { headers: { Authorization: auth, apikey: SERVICE } });
  if (!who.ok) return json({ error: 'unauthorized' }, 401);
  const uid = (await who.json()).id;

  const prof = await fetch(`${SB_URL}/rest/v1/profiles?user_id=eq.${encodeURIComponent(uid)}&select=github_login`, {
    headers: { Authorization: `Bearer ${SERVICE}`, apikey: SERVICE },
  });
  const login = (await prof.json())?.[0]?.github_login;
  if (!login || !/^[A-Za-z0-9-]{1,39}$/.test(login)) return json({ error: 'no_profile' }, 400);

  const to = new Date();
  const from = new Date(to.getTime() - 3 * 86_400_000);
  const query = `query($login:String!,$from:DateTime!,$to:DateTime!){user(login:$login){contributionsCollection(from:$from,to:$to){contributionCalendar{weeks{contributionDays{date contributionCount}}}}}}`;
  const gh = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: { Authorization: `Bearer ${GH_TOKEN}`, 'Content-Type': 'application/json', 'User-Agent': 'desktop-tamagotchi' },
    body: JSON.stringify({ query, variables: { login, from: from.toISOString(), to: to.toISOString() } }),
  });
  if (!gh.ok) return json({ error: 'github_unavailable' }, 502);
  const weeks = (await gh.json())?.data?.user?.contributionsCollection?.contributionCalendar?.weeks;
  if (!Array.isArray(weeks)) return json({ error: 'github_unavailable' }, 502);
  const days = weeks.flatMap((w) => w.contributionDays).map((d) => ({ day: d.date, count: d.contributionCount })).slice(-7);

  const r = await fetch(`${SB_URL}/rest/v1/rpc/grant_commit_coins`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${SERVICE}`, apikey: SERVICE, 'Content-Type': 'application/json' },
    body: JSON.stringify({ p_user: uid, p_days: days }),
  });
  if (!r.ok) return json({ error: 'grant_failed' }, 500);
  return json(await r.json());
});

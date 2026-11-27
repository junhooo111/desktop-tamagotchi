// 프로필 카드 Edge Function 에 들어갈 코드를 만든다: dist(tsc 결과)의 카드 규칙을 한 파일로 묶는다.
// 사용: npm run build:function   → supabase/functions/card/card.bundle.js
// 배포: npx supabase functions deploy card --no-verify-jwt --use-api --project-ref bqsidhjdxoxtrmmymwej
import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
await build({
  entryPoints: [path.join(root, 'dist', 'shared', 'card-endpoint.js')],
  outfile: path.join(root, 'supabase', 'functions', 'card', 'card.bundle.js'),
  bundle: true,
  format: 'esm',
  platform: 'neutral',
  target: 'es2022',
  legalComments: 'none',
});
console.log('card.bundle.js 를 만들었습니다.');

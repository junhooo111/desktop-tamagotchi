/**
 * 프로필 카드 서버(Edge Function) 쪽 규칙: 서버가 돌려준 공개 데이터 한 줄을 카드 SVG 로 바꾼다.
 * Edge Function(supabase/functions/card)은 이 파일을 번들해서(scripts/build-card-function.mjs) 쓴다.
 * 순수 함수라서 서버 없이 테스트한다. 비밀키가 필요 없다(공개 데이터만 다룬다).
 */
import { renderProfileCard } from './card.js';
import { createPet } from './pet.js';
import { DEFAULT_STYLE, isSpeciesId } from './species.js';

/** public_card_data() 가 돌려주는 모양. */
export interface CardRow {
  found?: boolean;
  github_login?: string;
  species_id?: string | null;
  xp?: number | null;
  species_count?: number;
}

export type CardStatus = 'ok' | 'empty' | 'notfound';

const W = 420;
const H = 190;

/** 사용자를 찾지 못했거나 숨긴 경우에 보여 주는 조용한 카드(깨진 이미지가 보이지 않게). */
function notFoundSvg(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><rect width="${W}" height="${H}" rx="6" fill="#232640"/><rect x="1.5" y="1.5" width="${W - 3}" height="${H - 3}" rx="5" fill="none" stroke="#6d28d9" stroke-width="3"/><text x="${W / 2}" y="${H / 2 - 4}" text-anchor="middle" font-family="monospace" font-size="16" fill="#ffd166">NO PET CARD</text><text x="${W / 2}" y="${H / 2 + 18}" text-anchor="middle" font-family="monospace" font-size="11" fill="#9aa0c8">LOG IN WITH GITHUB IN THE APP</text></svg>`;
}

export function renderCardFromRow(row: CardRow | null | undefined, now = Date.now()): { svg: string; status: CardStatus } {
  if (!row || row.found !== true) return { svg: notFoundSvg(), status: 'notfound' };
  const species = typeof row.species_id === 'string' && isSpeciesId(row.species_id) ? row.species_id : null;
  const xp = typeof row.xp === 'number' && Number.isFinite(row.xp) ? Math.max(0, Math.min(2_000_000, Math.floor(row.xp))) : 0;
  const pet = { ...createPet(species ?? 'rabbit', now), xp: species ? xp : 0 };
  const svg = renderProfileCard({ pet, style: DEFAULT_STYLE });
  return { svg, status: species ? 'ok' : 'empty' };
}

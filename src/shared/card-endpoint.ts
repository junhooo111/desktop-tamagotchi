/**
 * 프로필 카드 서버(Edge Function) 쪽 규칙: 서버가 돌려준 공개 데이터 한 줄을 카드 SVG 로 바꾼다.
 * Edge Function(supabase/functions/card)은 이 파일을 번들해서(scripts/build-card-function.mjs) 쓴다.
 * 순수 함수라서 서버 없이 테스트한다. 비밀키가 필요 없다(공개 데이터만 다룬다).
 *
 * 서버가 주는 extras(0013)는 앱이 "보여 주기용"으로 올린 값(색·장식·이름·모습·연속일·도감·업적 수)이다.
 * 서버가 한 번 걸러서 저장하지만, 여기서도 다시 허용 목록·범위로 걸러서 쓴다(두 겹).
 */
import { renderProfileCard } from './card.js';
import { ACHIEVEMENTS, buildCodex, emptyGrowth, localDay, type CodexView } from './growth.js';
import { RULE_IDS } from './lessons.js';
import { createPet, type Stage } from './pet.js';
import { sanitizePetName } from './settings.js';
import { DEFAULT_STYLE, isHiddenSpecies, isSpeciesId, type PetStyle } from './species.js';
import { isAccessory, isVariant } from './art/style.js';

/** public_card_data() 가 돌려주는 모양. */
export interface CardRow {
  found?: boolean;
  github_login?: string;
  species_id?: string | null;
  xp?: number | null;
  species_count?: number;
  extras?: unknown;
}

export type CardStatus = 'ok' | 'empty' | 'notfound';

const W = 420;
const H = 190;
const DAY_MS = 86_400_000;

/** 사용자를 찾지 못했거나 숨긴 경우에 보여 주는 조용한 카드(깨진 이미지가 보이지 않게). */
function notFoundSvg(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><rect width="${W}" height="${H}" rx="6" fill="#232640"/><rect x="1.5" y="1.5" width="${W - 3}" height="${H - 3}" rx="5" fill="none" stroke="#6d28d9" stroke-width="3"/><text x="${W / 2}" y="${H / 2 - 4}" text-anchor="middle" font-family="monospace" font-size="16" fill="#ffd166">NO PET CARD</text><text x="${W / 2}" y="${H / 2 + 18}" text-anchor="middle" font-family="monospace" font-size="11" fill="#9aa0c8">LOG IN WITH GITHUB IN THE APP</text></svg>`;
}

/** 서버에서 온 숫자를 0..max 정수로 */
const num = (v: unknown, max: number): number => (typeof v === 'number' && Number.isFinite(v) ? Math.max(0, Math.min(max, Math.floor(v))) : 0);

export interface CardExtras {
  style: PetStyle;
  name: string;
  stage?: Stage;
  codex: CodexView;
}

/** extras 를 안전하게 읽는다. 없거나 이상하면 null(그러면 예전처럼 기본 카드). */
export function readExtras(raw: unknown, speciesId: string | null, now: number): CardExtras | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const e = raw as Record<string, unknown>;
  const style: PetStyle = {
    variant: isVariant(e['variant']) ? e['variant'] : DEFAULT_STYLE.variant,
    accessory: isAccessory(e['accessory']) ? e['accessory'] : DEFAULT_STYLE.accessory,
  };
  const name = sanitizePetName(e['name']);
  const stage = e['stage'] === 'baby' || e['stage'] === 'adult' || (e['stage'] === 'legend' && speciesId !== null && isSpeciesId(speciesId) && isHiddenSpecies(speciesId)) ? (e['stage'] as Stage) : undefined;

  // 연속일: 보낸 날이 오늘·어제가 아니면 이어지지 않는 것으로 본다(앱을 오래 안 켰으면 0)
  const day = typeof e['day'] === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(e['day']) ? Date.parse(e['day'] + 'T00:00:00Z') : NaN;
  const fresh = Number.isFinite(day) && now - day <= 2 * DAY_MS;
  const streak = fresh ? num(e['streak'], 3650) : 0;

  // 도감 요약을 만들 수 있게 가짜 진행 기록을 짠다(숫자만 있으면 되는 칸들)
  const g = emptyGrowth();
  g.counters.fixes = num(e['fixes'], 100000);
  g.counters.quizCorrect = num(e['quiz'], 100000);
  g.days = Array.from({ length: Math.min(streak, 400) }, (_, i) => localDay(now - (Math.min(streak, 400) - 1 - i) * DAY_MS));
  RULE_IDS.slice(0, Math.min(num(e['rules'], 100), RULE_IDS.length)).forEach((id) => {
    g.rules[id] = { confirms: 1, fixes: 0 };
  });
  ACHIEVEMENTS.slice(0, Math.min(num(e['badges'], 100), ACHIEVEMENTS.length)).forEach((a) => {
    g.achievements[a.id] = now;
  });
  const codex = buildCodex(g, { tipsSeen: num(e['tips'], 1000) }, now);
  return { style, name, ...(stage ? { stage } : {}), codex };
}

export function renderCardFromRow(row: CardRow | null | undefined, now = Date.now()): { svg: string; status: CardStatus } {
  if (!row || row.found !== true) return { svg: notFoundSvg(), status: 'notfound' };
  const species = typeof row.species_id === 'string' && isSpeciesId(row.species_id) ? row.species_id : null;
  const xp = typeof row.xp === 'number' && Number.isFinite(row.xp) ? Math.max(0, Math.min(2_000_000, Math.floor(row.xp))) : 0;
  const pet = { ...createPet(species ?? 'rabbit', now), xp: species ? xp : 0 };
  const extras = species ? readExtras(row.extras, species, now) : null;
  const svg = renderProfileCard({
    pet,
    style: extras?.style ?? DEFAULT_STYLE,
    ...(extras ? { codex: extras.codex, ...(extras.name ? { name: extras.name } : {}), ...(extras.stage ? { stage: extras.stage } : {}) } : {}),
  });
  return { svg, status: species ? 'ok' : 'empty' };
}

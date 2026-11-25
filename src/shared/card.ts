/**
 * 프로필 카드: 내가 키운 펫의 지금 모습과 기록을 한 장의 SVG 로 만든다.
 * GitHub 프로필 README 에 <img> 로 걸 수 있다(서버가 없어서 카드는 내보낸 시점의 모습이다).
 *
 * 순수 함수라서 시계·파일·화면 없이 테스트한다. 파일 저장은 main(메뉴)과 scripts/export-card.mjs 가 맡는다.
 * 글자는 영문 대문자만 쓴다(<img> 로 불러온 SVG 는 웹폰트를 못 쓰고, 한글 글꼴은 보는 사람 PC 에 달려 있다).
 */
import { ACHIEVEMENTS, buildCodex, type Growth } from './growth.js';
import { levelOf, stageOf, type PetState } from './pet.js';
import { spriteSet, type PetStyle, type SpeciesId } from './species.js';

export interface CardInput {
  pet: PetState;
  growth: Growth;
  style: PetStyle;
  /** 읽은 FE 지식 수(progress 에 있다) */
  tipsSeen: number;
  now: number;
}

/** 지금 레벨 안에서의 경험치 진행: into/need. 레벨 n 은 경험치 10*(n-1)^2 부터다. */
export function xpProgress(xp: number): { level: number; into: number; need: number } {
  const level = levelOf(xp);
  const base = 10 * (level - 1) ** 2;
  const next = 10 * level ** 2;
  return { level, into: Math.max(0, xp - base), need: next - base };
}

const COLORS = { bg: '#232640', panel: '#2e3256', line: '#6d28d9', accent: '#ffd166', violet: '#a78bfa', text: '#ffffff', mute: '#9aa0c8' };

const esc = (s: string): string => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** 도트 그림을 같은 색 가로 줄 단위의 rect 로 바꾼다(SVG 크기를 줄인다). */
function spriteRects(rows: readonly string[], palette: Readonly<Record<string, string>>, scale: number, ox: number, oy: number): string {
  const out: string[] = [];
  rows.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const ch = row[x] as string;
      let end = x + 1;
      while (end < row.length && row[end] === ch) end++;
      const color = ch === '.' ? undefined : palette[ch];
      if (color) out.push(`<rect x="${ox + x * scale}" y="${oy + y * scale}" width="${(end - x) * scale}" height="${scale}" fill="${color}"/>`);
      x = end;
    }
  });
  return out.join('');
}

function stat(x: number, y: number, label: string, value: string): string {
  return `<text x="${x}" y="${y}" font-size="11" fill="${COLORS.mute}">${esc(label)}</text><text x="${x}" y="${y + 21}" font-size="18" font-weight="700" fill="${COLORS.text}">${esc(value)}</text>`;
}

export function renderProfileCard(input: CardInput): string {
  const { pet, growth, style, tipsSeen, now } = input;
  const stage = stageOf(pet);
  const set = spriteSet(pet.speciesId as SpeciesId, stage, style);
  const codex = buildCodex(growth, { tipsSeen }, now);
  const { level, into, need } = xpProgress(pet.xp);
  const ratio = Math.max(0, Math.min(1, into / need));
  const unlocked = ACHIEVEMENTS.filter((a) => growth.achievements[a.id] !== undefined).length;
  const accessory = style.accessory === 'none' ? '' : ` · ${style.accessory.toUpperCase()}`;
  const title = `${pet.speciesId.toUpperCase()}${accessory}`;
  const label = `${pet.speciesId} ${stage}, level ${level}, ${codex.rulesLearned} of ${codex.rulesTotal} lessons learned`;

  const barX = 196;
  const barW = 240;
  const sprite = spriteRects(set.frames.idleA, set.palette, 4, 16, 26);

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="560" height="180" viewBox="0 0 560 180" shape-rendering="crispEdges" role="img" aria-label="${esc(label)}" font-family="'Courier New', Consolas, monospace">`,
    `<title>${esc(label)}</title>`,
    `<rect width="560" height="180" fill="${COLORS.bg}"/>`,
    `<rect x="2" y="2" width="556" height="176" fill="none" stroke="${COLORS.line}" stroke-width="4"/>`,
    // 펫 칸
    `<rect x="12" y="22" width="136" height="136" fill="${COLORS.panel}"/>`,
    sprite,
    // 제목과 레벨
    `<rect x="${barX}" y="22" width="12" height="12" fill="${COLORS.accent}"/>`,
    `<text x="${barX + 22}" y="33" font-size="16" font-weight="700" fill="${COLORS.accent}">${esc(title)}</text>`,
    `<text x="540" y="33" text-anchor="end" font-size="12" fill="${COLORS.violet}">${esc(stage.toUpperCase())}</text>`,
    `<text x="${barX}" y="64" font-size="26" font-weight="700" fill="${COLORS.text}">LV ${level}</text>`,
    // 경험치 막대
    `<rect x="${barX + 90}" y="46" width="${barW}" height="14" fill="${COLORS.panel}"/>`,
    `<rect x="${barX + 90}" y="46" width="${Math.round(barW * ratio)}" height="14" fill="${COLORS.accent}"/>`,
    `<text x="${barX + 90}" y="74" font-size="10" fill="${COLORS.mute}">XP ${pet.xp} · NEXT LV ${need - into}</text>`,
    // 기록
    stat(barX, 100, 'STREAK', `${codex.streak.current}D`),
    stat(barX + 90, 100, 'LESSONS', `${codex.rulesLearned}/${codex.rulesTotal}`),
    stat(barX + 190, 100, 'BADGES', `${unlocked}/${ACHIEVEMENTS.length}`),
    stat(barX + 280, 100, 'FIXED', String(growth.counters.fixes)),
    `<text x="${barX}" y="160" font-size="10" fill="${COLORS.mute}">DESKTOP TAMAGOTCHI</text>`,
    `</svg>`,
  ].join('\n');
}

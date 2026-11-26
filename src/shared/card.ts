/**
 * 프로필 카드: 내가 키운 펫이 카드 안에서 뛰어다니는 움직이는 SVG.
 * GitHub 프로필 README 에 <img> 로 걸면 CSS 애니메이션이 그대로 재생된다(자바스크립트는 쓰지 않는다).
 *
 * 펫은 왼쪽에서 오른쪽으로 걷다가 앉아서 쉬고, 되돌아 걸어와 왼쪽 끝에서 졸고, 다시 일어나 걷는다.
 * 그림은 앱과 같은 프레임(걷기 4장·앉기 2장·자기 2장)이고, 내 색 변형과 장식(리본·왕관 등)이 그대로 들어간다.
 * 카드는 내보낸 순간의 모습이다(서버가 없어서 레벨·장식은 다시 내보내야 바뀐다).
 *
 * 순수 함수라서 시계·파일·화면 없이 테스트한다. 파일 저장은 main(메뉴)과 scripts/export-card.mjs 가 맡는다.
 * 글자는 영문 대문자만 쓴다(<img> 로 불러온 SVG 는 웹폰트를 못 쓰고, 한글 글꼴은 보는 사람 PC 에 달려 있다).
 */
import { levelOf, stageOf, type PetState } from './pet.js';
import { spriteSet, type PetStyle, type SpeciesId } from './species.js';

export interface CardInput {
  pet: PetState;
  style: PetStyle;
}

/** 지금 레벨 안에서의 경험치 진행: into/need. 레벨 n 은 경험치 10*(n-1)^2 부터다. */
export function xpProgress(xp: number): { level: number; into: number; need: number } {
  const level = levelOf(xp);
  const base = 10 * (level - 1) ** 2;
  const next = 10 * level ** 2;
  return { level, into: Math.max(0, xp - base), need: next - base };
}

const W = 560;
const H = 140;
const SCALE = 3; // 그림 한 칸의 크기(32칸 그림이 96px)
const CELL = 32 * SCALE;
const GROUND = 112; // 발이 닿는 줄(그림 맨 아래 칸이 이 줄에 오게 한다)
const TOP = GROUND - 31 * SCALE; // 그림 칸의 위쪽
const MARGIN = 14;
/** 펫이 움직이는 거리(오른쪽 끝에서 멈추는 자리) */
const TRAVEL = W - 2 * MARGIN - CELL;
/** 한 바퀴 걸리는 시간(초) */
const LOOP = 16;

const COLORS = { bg: '#232640', line: '#6d28d9', accent: '#ffd166', violet: '#a78bfa', ground: '#2e3256', mute: '#9aa0c8' };

const esc = (s: string): string => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** 도트 그림을 같은 색 가로 줄 단위의 rect 로 바꾼다(SVG 크기를 줄인다). */
function spriteRects(rows: readonly string[], palette: Readonly<Record<string, string>>): string {
  const out: string[] = [];
  rows.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const ch = row[x] as string;
      let end = x + 1;
      while (end < row.length && row[end] === ch) end++;
      const color = ch === '.' ? undefined : palette[ch];
      if (color) out.push(`<rect x="${x * SCALE}" y="${y * SCALE}" width="${(end - x) * SCALE}" height="${SCALE}" fill="${color}"/>`);
      x = end;
    }
  });
  return out.join('');
}

const pct = (n: number): string => `${Math.round(n * 100) / 100}%`;

/** 구간 [from, to](한 바퀴의 %)에서만 보이게 하는 keyframes */
function visibleBetween(name: string, from: number, to: number): string {
  const frames = [`0%{opacity:${from === 0 ? 1 : 0}}`];
  if (from > 0) frames.push(`${pct(from - 0.01)}{opacity:0}`, `${pct(from)}{opacity:1}`);
  if (to < 100) frames.push(`${pct(to)}{opacity:1}`, `${pct(to + 0.01)}{opacity:0}`, '100%{opacity:0}');
  else frames.push('100%{opacity:1}');
  return `@keyframes ${name}{${frames.join('')}}`;
}

export function renderProfileCard(input: CardInput): string {
  const { pet, style } = input;
  const stage = stageOf(pet);
  const set = spriteSet(pet.speciesId as SpeciesId, stage, style);
  const level = levelOf(pet.xp);
  const label = `${pet.speciesId} ${stage}, level ${level}, running around`;

  const walk = (['walk1', 'walk2', 'walk3', 'walk4'] as const).map((n) => set.frames[n]);
  const sit = (['sitA', 'sitB'] as const).map((n) => set.frames[n]);
  const sleep = (['sleepA', 'sleepB'] as const).map((n) => set.frames[n]);

  const defs = [
    ...walk.map((rows, i) => `<g id="w${i + 1}">${spriteRects(rows, set.palette)}</g>`),
    ...sit.map((rows, i) => `<g id="s${i + 1}">${spriteRects(rows, set.palette)}</g>`),
    ...sleep.map((rows, i) => `<g id="z${i + 1}">${spriteRects(rows, set.palette)}</g>`),
  ].join('');

  /** 한 자세의 프레임들을 같은 자리에 겹쳐 놓고 차례로 보이게 한다 */
  const frames = (prefix: string, n: number, cls: string): string =>
    Array.from({ length: n }, (_, i) => `<use class="${cls}${i}" href="#${prefix}${i + 1}" opacity="0"/>`).join('');
  const flipAttr = (flipped: boolean): string => (flipped ? ` transform="translate(${CELL},0) scale(-1,1)"` : '');
  const walkFrames = (flipped: boolean): string => `<g${flipAttr(flipped)}>${frames('w', 4, 'wk')}</g>`;
  const sitFrames = (flipped: boolean): string => `<g${flipAttr(flipped)}>${frames('s', 2, 'st')}</g>`;
  const sleepFrames = (flipped: boolean): string => `<g${flipAttr(flipped)}>${frames('z', 2, 'sl')}</g>`;

  // 한 바퀴(LOOP 초): 오른쪽으로 걷기 0~38% · 오른쪽 끝에서 앉기 38~50% · 왼쪽으로 걷기 50~88% · 왼쪽 끝에서 졸기 88~100%
  const css = [
    `.walkR{opacity:1;animation:runR ${LOOP}s linear infinite}`,
    `.walkL{opacity:0;animation:runL ${LOOP}s linear infinite}`,
    `.sitR{opacity:0;animation:showSit ${LOOP}s linear infinite}`,
    `.sleepL{opacity:0;animation:showSleep ${LOOP}s linear infinite}`,
    // 걷기 프레임: 0.6초에 4장
    ...[0, 1, 2, 3].map((i) => `.wk${i}{animation:on4 0.6s step-end infinite;animation-delay:${(i * 0.15).toFixed(2)}s}`),
    '@keyframes on4{0%{opacity:1}25%{opacity:0}100%{opacity:0}}',
    // 앉기·졸기 프레임: 숨 쉬듯 두 장을 번갈아
    ...[0, 1].map((i) => `.st${i}{animation:on2 1.2s step-end infinite;animation-delay:${(i * 0.6).toFixed(1)}s}`),
    ...[0, 1].map((i) => `.sl${i}{animation:on2 2.4s step-end infinite;animation-delay:${(i * 1.2).toFixed(1)}s}`),
    '@keyframes on2{0%{opacity:1}50%{opacity:0}100%{opacity:0}}',
    // 이동
    `@keyframes runR{0%{opacity:1;transform:translateX(0)}38%{opacity:1;transform:translateX(${TRAVEL}px)}38.01%{opacity:0;transform:translateX(${TRAVEL}px)}100%{opacity:0;transform:translateX(${TRAVEL}px)}}`,
    `@keyframes runL{0%{opacity:0;transform:translateX(${TRAVEL}px)}49.99%{opacity:0;transform:translateX(${TRAVEL}px)}50%{opacity:1;transform:translateX(${TRAVEL}px)}88%{opacity:1;transform:translateX(0)}88.01%{opacity:0;transform:translateX(0)}100%{opacity:0;transform:translateX(0)}}`,
    visibleBetween('showSit', 38, 50),
    visibleBetween('showSleep', 88, 100),
    // 졸 때 떠오르는 z
    '.zz{opacity:0;animation:zfloat 2.4s ease-in-out infinite}',
    '.zz2{animation-delay:1.2s}',
    '@keyframes zfloat{0%{opacity:0;transform:translate(0,0)}30%{opacity:1}100%{opacity:0;transform:translate(8px,-18px)}}',
    // 움직임을 줄이는 설정이면 멈춘 채 왼쪽 끝에 서 있는다
    '@media (prefers-reduced-motion:reduce){*{animation:none!important}.wk0{opacity:1!important}}',
  ].join('');

  const groundDots = Array.from({ length: 28 }, (_, i) => `<rect x="${MARGIN + i * 19}" y="${GROUND + 6}" width="9" height="3" fill="${COLORS.ground}"/>`).join('');

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" shape-rendering="crispEdges" role="img" aria-label="${esc(label)}" font-family="'Courier New', Consolas, monospace">`,
    `<title>${esc(label)}</title>`,
    `<style>${css}</style>`,
    `<defs>${defs}</defs>`,
    `<rect width="${W}" height="${H}" fill="${COLORS.bg}"/>`,
    `<rect x="2" y="2" width="${W - 4}" height="${H - 4}" fill="none" stroke="${COLORS.line}" stroke-width="4"/>`,
    // 이름표(정보는 이것뿐): 펫이 뛸 때 머리 위가 비도록 땅 아래에 둔다
    `<rect x="${MARGIN + 4}" y="${H - 22}" width="9" height="9" fill="${COLORS.accent}"/>`,
    `<text x="${MARGIN + 20}" y="${H - 13}" font-size="12" font-weight="700" fill="${COLORS.accent}">${esc(pet.speciesId.toUpperCase())}</text>`,
    `<text x="${MARGIN + 20 + pet.speciesId.length * 8 + 14}" y="${H - 13}" font-size="12" font-weight="700" fill="${COLORS.violet}">LV ${level}</text>`,
    // 땅
    `<rect x="${MARGIN}" y="${GROUND + 1}" width="${W - 2 * MARGIN}" height="3" fill="${COLORS.violet}"/>`,
    groundDots,
    // 펫: 오른쪽으로 걷기 / 오른쪽 끝에서 앉기 / 왼쪽으로 걷기 / 왼쪽 끝에서 졸기
    `<g transform="translate(${MARGIN},${TOP})">`,
    `<g class="walkR">${walkFrames(false)}</g>`,
    `<g class="walkL">${walkFrames(true)}</g>`,
    `<g transform="translate(${TRAVEL},0)"><g class="sitR">${sitFrames(false)}</g></g>`,
    `<g class="sleepL">${sleepFrames(true)}<text class="zz" x="${CELL - 12}" y="26" font-size="14" font-weight="700" fill="${COLORS.violet}">Z</text><text class="zz zz2" x="${CELL - 4}" y="14" font-size="11" font-weight="700" fill="${COLORS.violet}">z</text></g>`,
    `</g>`,
    `<text x="${W - MARGIN - 6}" y="${H - 13}" text-anchor="end" font-size="9" fill="${COLORS.mute}">DESKTOP TAMAGOTCHI</text>`,
    `</svg>`,
  ].join('\n');
}

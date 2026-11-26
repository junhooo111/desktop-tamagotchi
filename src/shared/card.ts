/**
 * 프로필 카드: 내가 키운 펫이 작은 마을(계단·집)을 돌아다니는 움직이는 SVG.
 * GitHub 프로필 README 에 <img> 로 걸면 CSS 애니메이션이 그대로 재생된다(자바스크립트는 쓰지 않는다).
 *
 * 펫은 앱에서와 같은 크기(32px)다. 길은 이렇다:
 *   왼쪽 땅에서 출발 → 계단을 올라 위쪽 단 위에서 앉아 쉬기 → 반대쪽 계단으로 내려와 집으로 들어감(창문에 불이 켜지고 잠)
 *   → 집에서 나와 왔던 길로 돌아가 왼쪽 끝에서 졸기 → 다시 출발.
 * 카드 아래에는 레벨·경험치와 도감·업적 같은 기록이 한 줄로 붙는다.
 * 그림은 앱과 같은 프레임(걷기 4장·앉기 2장·자기 2장)이고, 내 색 변형과 장식(리본·왕관 등)이 그대로 들어간다.
 * 카드는 내보낸 순간의 모습이다(서버가 없어서 기록은 다시 내보내야 바뀐다).
 *
 * 순수 함수라서 시계·파일·화면 없이 테스트한다. 파일 저장은 main(메뉴)과 scripts/export-card.mjs 가 맡는다.
 * 글자는 영문 대문자·숫자만 쓴다(<img> 로 불러온 SVG 는 웹폰트를 못 쓰고, 한글 글꼴은 보는 사람 PC 에 달려 있다).
 */
import { buildCodex, emptyGrowth, type CodexView } from './growth.js';
import { levelOf, stageOf, type PetState, type Stage } from './pet.js';
import { spriteSet, type PetStyle, type SpeciesId } from './species.js';

export interface CardInput {
  pet: PetState;
  style: PetStyle;
  /** 도감·업적 같은 기록. 없으면 기록 없는 상태로 그린다. */
  codex?: CodexView;
  /** 펫 이름. 있으면 종 이름 대신 크게 보여 준다. */
  name?: string;
  /** 보여 줄 단계(꾸미기에서 지나온 단계로 되돌렸을 때). 없으면 지금 단계. */
  stage?: Stage;
}

/** 지금 레벨 안에서의 경험치 진행: into/need. 레벨 n 은 경험치 10*(n-1)^2 부터다. */
export function xpProgress(xp: number): {
  level: number;
  into: number;
  need: number;
} {
  const level = levelOf(xp);
  const base = 10 * (level - 1) ** 2;
  const next = 10 * level ** 2;
  return { level, into: Math.max(0, xp - base), need: next - base };
}

const W = 420;
const H = 190;
const CELL = 32; // 그림 한 칸이 1px: 앱의 펫 크기(32px)와 같다
const GROUND = 100; // 발이 닿는 줄(그림 맨 아래 칸이 이 줄에 오게 한다)
const TOP = GROUND - 31; // 그림 칸의 위쪽
const MARGIN = 14;
const STRIP_Y = 120; // 아래 정보줄이 시작하는 곳
const SPEED = 45; // 걷는 속도(px/초)

const COLORS = {
  bg: '#232640',
  line: '#6d28d9',
  accent: '#ffd166',
  violet: '#a78bfa',
  ground: '#2a2e52',
  grass: '#3b4a7a',
  mute: '#9aa0c8',
  stone: '#3a3f6e',
  stoneTop: '#5a66b0',
  wall: '#4a4f86',
  roof: '#8b3a4a',
  roofTop: '#b0505f',
  door: '#2a1f3d',
  windowOff: '#2e3256',
  windowOn: '#ffd166',
  chip: '#2b2f55',
  white: '#e8eaff',
};

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
      if (color) out.push(`<rect x="${x}" y="${y}" width="${end - x}" height="1" fill="${color}"/>`);
      x = end;
    }
  });
  return out.join('');
}

/** 글자 폭 어림값(px): 영문·숫자는 폭 0.62em, 한글 등 넓은 글자는 1em */
const textWidth = (s: string, size: number): number => Array.from(s).reduce((sum, ch) => sum + ((ch.codePointAt(0) ?? 0) > 0x2e80 ? size : size * 0.62), 0);

const pct = (n: number): string => `${Math.round(n * 100) / 100}%`;
const rect = (x: number, y: number, w: number, h: number, fill: string): string => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}"/>`;

/** 구간 [from, to](한 바퀴의 %)에서만 보이게 하는 keyframes */
function visibleBetween(name: string, from: number, to: number): string {
  const frames = [`0%{opacity:${from === 0 ? 1 : 0}}`];
  if (from > 0) frames.push(`${pct(from - 0.01)}{opacity:0}`, `${pct(from)}{opacity:1}`);
  if (to < 100) frames.push(`${pct(to)}{opacity:1}`, `${pct(to + 0.01)}{opacity:0}`, '100%{opacity:0}');
  else frames.push('100%{opacity:1}');
  return `@keyframes ${name}{${frames.join('')}}`;
}

// ---- 길(펫이 지나가는 곳): 점은 [그림 왼쪽 x, 땅에서 올라간 높이] ----

type Pt = readonly [number, number];
const START_X = MARGIN;
/** 계단 3칸(높이 8·16·24)을 올라 위쪽 단(높이 32)에 선다. 계단 꼭대기 모서리를 따라 비스듬히 걷는다. */
const WALK_UP: readonly Pt[] = [
  [START_X, 0],
  [106, 0],
  [170, 32],
  [194, 32],
];
const SIT_AT: Pt = [194, 32];
const WALK_DOWN: readonly Pt[] = [
  [194, 32],
  [218, 32],
  [282, 0],
  [339, 0],
];
const HOUSE_DOOR_X = 339;
const WALK_BACK: readonly Pt[] = [
  [339, 0],
  [282, 0],
  [218, 32],
  [194, 32],
  [170, 32],
  [106, 0],
  [START_X, 0],
];

const SIT_SEC = 3;
const HOUSE_SEC = 4;
const SLEEP_SEC = 3;

const length = (pts: readonly Pt[]): number => pts.slice(1).reduce((sum, p, i) => sum + Math.hypot(p[0] - (pts[i] as Pt)[0], p[1] - (pts[i] as Pt)[1]), 0);

/** 걷는 구간 하나의 keyframes: 점마다 그 시각의 위치(시작 자리 기준 이동량)로 이어 준다. */
function moveKeyframes(name: string, pts: readonly Pt[], startSec: number, loopSec: number): string {
  let t = startSec;
  const frames = pts.map((p, i) => {
    if (i > 0) t += Math.hypot(p[0] - (pts[i - 1] as Pt)[0], p[1] - (pts[i - 1] as Pt)[1]) / SPEED;
    return { at: (t / loopSec) * 100, x: p[0] - START_X, y: -p[1] };
  });
  const first = frames[0] as { at: number };
  const last = frames[frames.length - 1] as { at: number };
  const out: string[] = [];
  if (first.at > 0) out.push('0%{opacity:0}', `${pct(first.at - 0.01)}{opacity:0}`);
  for (const f of frames) out.push(`${pct(f.at)}{opacity:1;transform:translate(${f.x}px,${f.y}px)}`);
  if (last.at < 100) out.push(`${pct(last.at + 0.01)}{opacity:0}`, '100%{opacity:0}');
  return `@keyframes ${name}{${out.join('')}}`;
}

function sceneArt(): string {
  const stars = [
    [40, 18],
    [88, 34],
    [150, 14],
    [212, 26],
    [268, 12],
    [310, 30],
    [366, 16],
    [400, 40],
  ]
    .map(([x, y]) => rect(x as number, y as number, 2, 2, COLORS.violet))
    .join('');
  const moon = `<circle cx="${W - 44}" cy="26" r="9" fill="${COLORS.accent}"/><circle cx="${W - 40}" cy="23" r="8" fill="${COLORS.bg}"/>`;
  const ground = rect(0, GROUND + 1, W, STRIP_Y - GROUND - 1, COLORS.ground);
  const grass = Array.from({ length: 22 }, (_, i) => rect(MARGIN + i * 19, GROUND + 6, 9, 3, COLORS.grass)).join('');
  // 계단·위쪽 단: 아래에서부터 쌓은 덩어리, 윗면에 밝은 줄
  const blocks = [
    [130, 8],
    [146, 16],
    [162, 24],
    [178, 32],
    [242, 24],
    [258, 16],
    [274, 8],
  ] as const;
  const stairs = blocks.map(([x, h]) => rect(x, GROUND - h + 1, x === 178 ? 64 : 16, h, COLORS.stone) + rect(x, GROUND - h + 1, x === 178 ? 64 : 16, 2, COLORS.stoneTop)).join('');
  // 집: 벽 + 계단식 지붕 + 굴뚝 + 문 + 창문
  const hx = 326;
  const hw = 72;
  const roofRows = Array.from({ length: 8 }, (_, i) => rect(hx - 6 + i * 5, GROUND - 40 - (i + 1) * 4 + 1, hw + 12 - i * 10, 4, i === 7 ? COLORS.roofTop : COLORS.roof)).join('');
  const house = [
    rect(hx + 46, GROUND - 66, 8, 20, COLORS.wall), // 굴뚝
    rect(hx, GROUND - 40 + 1, hw, 40, COLORS.wall),
    roofRows,
    rect(HOUSE_DOOR_X + 8, GROUND - 26 + 1, 16, 26, COLORS.door),
    rect(HOUSE_DOOR_X + 20, GROUND - 14, 2, 2, COLORS.accent), // 손잡이
    rect(hx + 48, GROUND - 32, 14, 14, COLORS.windowOff),
    `<rect class="lit" x="${hx + 48}" y="${GROUND - 32}" width="14" height="14" fill="${COLORS.windowOn}"/>`,
    rect(hx + 54, GROUND - 32, 2, 14, COLORS.wall),
    rect(hx + 48, GROUND - 26, 14, 2, COLORS.wall),
  ].join('');
  return [stars, moon, ground, grass, stairs, house].join('');
}

export function renderProfileCard(input: CardInput): string {
  const { pet, style } = input;
  const codex = input.codex ?? buildCodex(emptyGrowth(), { tipsSeen: 0 }, 0);
  const stage = input.stage ?? stageOf(pet);
  const set = spriteSet(pet.speciesId as SpeciesId, stage, style);
  const level = levelOf(pet.xp);
  const prog = xpProgress(pet.xp);
  const name = input.name?.trim() ?? '';
  const label = `${name ? `${name}, ` : ''}${pet.speciesId} ${stage}, level ${level}, walking around its house`;

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

  // ---- 한 바퀴의 시간표(초) ----
  const tUp = length(WALK_UP) / SPEED;
  const tDown = length(WALK_DOWN) / SPEED;
  const tBack = length(WALK_BACK) / SPEED;
  const sitStart = tUp;
  const downStart = sitStart + SIT_SEC;
  const houseStart = downStart + tDown;
  const backStart = houseStart + HOUSE_SEC;
  const sleepStart = backStart + tBack;
  const loop = Math.round((sleepStart + SLEEP_SEC) * 10) / 10;
  const p = (sec: number): number => (sec / loop) * 100;

  const css = [
    // 걷기 프레임: 0.6초에 4장
    ...[0, 1, 2, 3].map((i) => `.wk${i}{animation:on4 0.6s step-end infinite;animation-delay:${(i * 0.15).toFixed(2)}s}`),
    '@keyframes on4{0%{opacity:1}25%{opacity:0}100%{opacity:0}}',
    // 앉기·졸기 프레임: 숨 쉬듯 두 장을 번갈아
    ...[0, 1].map((i) => `.st${i}{animation:on2 1.2s step-end infinite;animation-delay:${(i * 0.6).toFixed(1)}s}`),
    ...[0, 1].map((i) => `.sl${i}{animation:on2 2.4s step-end infinite;animation-delay:${(i * 1.2).toFixed(1)}s}`),
    '@keyframes on2{0%{opacity:1}50%{opacity:0}100%{opacity:0}}',
    // 걷는 구간 셋(올라가기·내려가기·돌아오기)과 쉬는 구간 둘(앉기·졸기)
    `.mUp,.mDown,.mBack{opacity:0}.mUp{animation:mvUp ${loop}s linear infinite}.mDown{animation:mvDown ${loop}s linear infinite}.mBack{animation:mvBack ${loop}s linear infinite}`,
    moveKeyframes('mvUp', WALK_UP, 0, loop),
    moveKeyframes('mvDown', WALK_DOWN, downStart, loop),
    moveKeyframes('mvBack', WALK_BACK, backStart, loop),
    `.sitG{opacity:0;animation:showSit ${loop}s linear infinite}.sleepG{opacity:0;animation:showSleep ${loop}s linear infinite}`,
    visibleBetween('showSit', p(sitStart), p(downStart)),
    visibleBetween('showSleep', p(sleepStart), 100),
    // 집에 들어가 있는 동안 창문에 불이 켜지고 z 가 떠오른다
    `.lit{opacity:0;animation:showLit ${loop}s linear infinite}`,
    visibleBetween('showLit', p(houseStart), p(backStart)),
    `.houseZ{opacity:0;animation:showLit ${loop}s linear infinite}`,
    '.zz{animation:zfloat 2.4s ease-in-out infinite}',
    '.zz2{animation-delay:1.2s}',
    '@keyframes zfloat{0%{opacity:0;transform:translate(0,0)}30%{opacity:1}100%{opacity:0;transform:translate(7px,-14px)}}',
    // 움직임을 줄이는 설정이면 멈춘 채 출발 자리에 서 있는다
    '@media (prefers-reduced-motion:reduce){*{animation:none!important}.wk0{opacity:1!important}.mUp{opacity:1!important}}',
  ].join('');

  const standAt = (pt: Pt): string => `translate(${pt[0]},${GROUND - 31 - pt[1] + 0})`;

  // ---- 아래 정보줄 ----
  const chips: [string, string][] = [
    ['STREAK', `${codex.streak.current}D`],
    ['CODEX', `${codex.rulesLearned}/${codex.rulesTotal}`],
    ['BADGES', `${codex.achievements.filter((a) => a.unlocked).length}/${codex.achievements.length}`],
    ['FIXED', String(codex.counters.fixes)],
    ['QUIZ', String(codex.counters.quizCorrect)],
    ['TIPS', `${codex.tipsSeen}/${codex.tipsTotal}`],
  ];
  const chipW = 58;
  const chipGap = (W - 2 * MARGIN - chips.length * chipW) / (chips.length - 1);
  const chipY = STRIP_Y + 34;
  const chipsSvg = chips
    .map(([k, v], i) => {
      const x = MARGIN + i * (chipW + chipGap);
      return [
        rect(Math.round(x), chipY, chipW, 30, COLORS.chip),
        `<text x="${Math.round(x + chipW / 2)}" y="${chipY + 11}" text-anchor="middle" font-size="8" fill="${COLORS.mute}">${k}</text>`,
        `<text x="${Math.round(x + chipW / 2)}" y="${chipY + 25}" text-anchor="middle" font-size="13" font-weight="700" fill="${COLORS.white}">${esc(v)}</text>`,
      ].join('');
    })
    .join('');
  const barX = 236;
  const barW = W - MARGIN - barX - 52;
  const fill = Math.round((barW * Math.min(1, prog.into / prog.need)) / 2) * 2;

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" shape-rendering="crispEdges" role="img" aria-label="${esc(label)}" font-family="'Courier New', Consolas, 'Malgun Gothic', 'Apple SD Gothic Neo', 'Noto Sans KR', monospace">`,
    `<title>${esc(label)}</title>`,
    `<style>${css}</style>`,
    `<defs>${defs}</defs>`,
    rect(0, 0, W, H, COLORS.bg),
    sceneArt(),
    // 집 안에서 자는 z (창문 옆)
    `<g class="houseZ"><text class="zz" x="${326 + 52}" y="${GROUND - 36}" font-size="11" font-weight="700" fill="${COLORS.violet}">Z</text><text class="zz zz2" x="${326 + 60}" y="${GROUND - 44}" font-size="9" font-weight="700" fill="${COLORS.violet}">z</text></g>`,
    // 펫: 올라가기 / 위에서 앉기 / 내려가서 집으로 / 돌아오기 / 왼쪽 끝에서 졸기
    `<g transform="translate(${START_X},${TOP})">`,
    `<g class="mUp">${walkFrames(false)}</g>`,
    `<g class="mDown">${walkFrames(false)}</g>`,
    `<g class="mBack">${walkFrames(true)}</g>`,
    `</g>`,
    `<g transform="${standAt(SIT_AT)}"><g class="sitG">${sitFrames(false)}</g></g>`,
    `<g transform="${standAt([START_X, 0])}"><g class="sleepG">${sleepFrames(true)}<text class="zz" x="${CELL - 6}" y="12" font-size="9" font-weight="700" fill="${COLORS.violet}">Z</text><text class="zz zz2" x="${CELL}" y="4" font-size="7" font-weight="700" fill="${COLORS.violet}">z</text></g></g>`,
    // 정보줄
    rect(0, STRIP_Y, W, 2, COLORS.line),
    rect(MARGIN, STRIP_Y + 12, 8, 8, COLORS.accent),
    `<text x="${MARGIN + 14}" y="${STRIP_Y + 20}" font-size="13" font-weight="700" fill="${COLORS.accent}">${esc(name || pet.speciesId.toUpperCase())}</text>`,
    `<text x="${MARGIN + 14 + textWidth(name || pet.speciesId.toUpperCase(), 13) + 8}" y="${STRIP_Y + 20}" font-size="11" fill="${COLORS.mute}">${esc((name ? `${pet.speciesId} ${stage}` : stage).toUpperCase())}</text>`,
    `<text x="${barX - 8}" y="${STRIP_Y + 20}" text-anchor="end" font-size="13" font-weight="700" fill="${COLORS.violet}">LV ${level}</text>`,
    rect(barX, STRIP_Y + 12, barW, 8, COLORS.chip),
    rect(barX, STRIP_Y + 12, Math.max(2, fill), 8, COLORS.violet),
    `<text x="${barX + barW + 6}" y="${STRIP_Y + 20}" font-size="9" fill="${COLORS.mute}">${prog.into}/${prog.need}</text>`,
    chipsSvg,
    `<rect x="2" y="2" width="${W - 4}" height="${H - 4}" fill="none" stroke="${COLORS.line}" stroke-width="4"/>`,
    `</svg>`,
  ].join('\n');
}

// README 에 쓰는 그림(SVG)을 만든다. 펫 그림은 앱의 실제 도트 그림에서 그대로 뽑는다.
// 사용: npm run readme-images   →   docs/images/ 아래에 생성(동물·히든 실루엣·진화·꾸미기·선물/응가·프로필 카드·소개 그림)
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const root = process.cwd();
const load = (p) => import(pathToFileURL(path.join(root, 'dist', p)).href);
const { SPECIES, HIDDEN_SPECIES, spriteSet, ACCESSORIES } = await load('shared/species.js');
// 이름과 모습을 드러내는 동물(히든 빼고 전부: 일반·고급·희귀·특별·전설)
const COMMON_SPECIES = SPECIES.filter((s) => s.rarity !== 'hidden');
const { giftSvg } = await load('shared/gift.js');
const { poopSvg } = await load('shared/poop.js');
const { renderProfileCard } = await load('shared/card.js');
const { buildCodex, emptyGrowth } = await load('shared/growth.js');
const { createPet } = await load('shared/pet.js');
const { ACCESSORY_NAMES } = await load('shared/wardrobe.js');

const out = path.join(root, 'docs', 'images');
fs.rmSync(out, { recursive: true, force: true });
for (const d of ['animals', 'accessories']) fs.mkdirSync(path.join(out, d), { recursive: true });
const write = (name, svg) => fs.writeFileSync(path.join(out, name), svg + '\n', 'utf8');

/** 도트 그림(문자 격자)을 같은 색 가로 줄 단위의 rect 로 바꾼다. */
function rects(rows, colorOf, unit, dx = 0, dy = 0) {
  const parts = [];
  rows.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const ch = row[x];
      let end = x + 1;
      while (end < row.length && row[end] === ch) end++;
      const fill = ch === '.' ? undefined : colorOf(ch);
      if (fill) parts.push(`<rect x="${dx + x * unit}" y="${dy + y * unit}" width="${(end - x) * unit}" height="${unit}" fill="${fill}"/>`);
      x = end;
    }
  });
  return parts.join('');
}

const svgWrap = (w, h, body, extra = '') => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" shape-rendering="crispEdges"${extra}>${body}</svg>`;

/** 펫 한 마리의 SVG 조각(32x32 칸). */
function petParts(id, stage, style, unit, dx = 0, dy = 0) {
  const set = spriteSet(id, stage, style);
  return rects(set.frames.idleA, (c) => set.palette[c], unit, dx, dy);
}

/** 실루엣: 모양만 한 색으로 칠하고 가운데에 하얀 '?' 를 얹는다(정체를 알 수 없게). */
const QUESTION = ['.###.', '#...#', '....#', '...#.', '..#..', '.....', '..#..'];
function silhouetteParts(id, unit, dx = 0, dy = 0) {
  const set = spriteSet(id, 'adult');
  const shape = rects(set.frames.idleA, () => '#6f6498', unit, dx, dy);
  const q = rects(QUESTION, () => '#ffffff', unit * 2, dx + 11 * unit, dy + 9 * unit);
  return shape + q;
}

// ---- 동물별 그림 ----
for (const s of COMMON_SPECIES) write(`animals/${s.id}.svg`, svgWrap(128, 128, petParts(s.id, 'adult', { variant: 'default', accessory: 'none' }, 4)));
// 파일 이름에도 히든 동물의 이름을 쓰지 않는다(스포일러 방지): hidden-1.svg …
HIDDEN_SPECIES.forEach((s, i) => write(`animals/hidden-${i + 1}.svg`, svgWrap(128, 128, silhouetteParts(s.id, 4))));

// ---- 소개 그림: 히든이 아닌 동물 26종(4줄) + 히든 5종 실루엣 ----
{
  const U = 3;
  const cell = 32 * U + 8;
  const perRow = 7;
  const pad = 24;
  const W = pad * 2 + perRow * cell;
  const rowsOfCommon = Math.ceil(COMMON_SPECIES.length / perRow);
  const H = pad * 2 + rowsOfCommon * cell + cell;
  let body = `<rect width="${W}" height="${H}" rx="16" fill="#fff8e8" stroke="#e8d9b5" stroke-width="3"/>`;
  COMMON_SPECIES.forEach((s, i) => {
    const x = pad + (i % perRow) * cell + 4;
    const y = pad + Math.floor(i / perRow) * cell;
    body += petParts(s.id, 'adult', { variant: 'default', accessory: 'none' }, U, x, y);
  });
  const hy = pad + rowsOfCommon * cell + 8;
  const hiddenStart = pad + Math.round((perRow - HIDDEN_SPECIES.length) / 2 * cell) + 4;
  HIDDEN_SPECIES.forEach((s, i) => (body += silhouetteParts(s.id, U, hiddenStart + i * cell, hy)));
  body += `<rect x="${pad}" y="${pad + rowsOfCommon * cell + 2}" width="${W - pad * 2}" height="2" fill="#e8d9b5"/>`;
  write('hero.svg', svgWrap(W, H, body));
}

// ---- 성장 단계: 일반 동물(병아리). 히든 동물은 이름·모습을 미리 보여 주지 않는다(스포일러). ----
function evolution(id, stages) {
  const U = 4;
  const cell = 32 * U + 40;
  const W = stages.length * cell;
  let body = `<rect width="${W}" height="${32 * U + 16}" rx="14" fill="#fff8e8" stroke="#e8d9b5" stroke-width="3"/>`;
  stages.forEach((st, i) => {
    body += petParts(id, st, { variant: 'default', accessory: 'none' }, U, i * cell + 20, 8);
    if (i < stages.length - 1) {
      const ax = i * cell + 20 + 32 * U + 2;
      body += `<polygon points="${ax},${8 + 16 * U - 8} ${ax + 16},${8 + 16 * U} ${ax},${8 + 16 * U + 8}" fill="#b8a77a"/>`;
    }
  });
  return svgWrap(W, 32 * U + 16, body);
}
write('evolution-common.svg', evolution('chick', ['egg', 'baby', 'adult']));

// ---- 꾸미기: 고양이가 하나씩 착용 ----
for (const a of ACCESSORIES) {
  if (a === 'none') continue;
  write(`accessories/${a}.svg`, svgWrap(128, 128, petParts('cat', 'adult', { variant: 'default', accessory: a }, 4)));
}

// ---- 선물 상자·응가(크게) ----
const scaleSvg = (svg, k) => svg.replace(/width="(\d+)" height="(\d+)"/, (_m, w, h) => `width="${w * k}" height="${h * k}" viewBox="0 0 ${w} ${h}"`);
write('gift.svg', scaleSvg(giftSvg(), 5));
write('poop.svg', scaleSvg(poopSvg(), 5));

// ---- 프로필 카드 예시(움직이는 SVG) ----
{
  const pet = { ...createPet('cat', Date.now()), xp: 1210 };
  const growth = emptyGrowth();
  growth.counters = { confirms: 24, fixes: 9, quizCorrect: 11, tips: 14, care: 138, washes: 12, strolls: 7 };
  growth.days = ['2026-11-25', '2026-11-26', '2026-11-27'];
  const codex = buildCodex(growth, { tipsSeen: 14, collected: 6, pulls: 8, hiddenOwned: 0 }, new Date(2026, 10, 27, 12).getTime());
  write('profile-card.svg', renderProfileCard({ pet, name: '콩이', style: { variant: 'default', accessory: 'ribbon' }, codex }));
}

console.log(`그림을 만들었습니다: ${out} (동물 ${COMMON_SPECIES.length}+${HIDDEN_SPECIES.length}, 꾸미기 ${ACCESSORIES.length - 1}종, 전체 종 ${SPECIES.length}, ${ACCESSORY_NAMES.none})`);

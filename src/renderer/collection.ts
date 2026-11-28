/**
 * 뽑기 창(collection.html): 뽑기권으로 동물·꾸미기를 뽑는다.
 * 내 펫 창(pets.html): 가진 동물 목록을 보고 한 마리를 꺼내 키운다. 두 창이 같은 스크립트를 쓰고, 없는 요소는 건너뛴다.
 * 규칙(확률·비용·보상)은 메인(shared/collection.ts)이 정하고 여기서는 보여 주기만 한다.
 */
import type { Lang } from '../shared/i18n.js';
import { currentUiLang, startUiLocalization } from './dom-i18n.js';
import { nameEn } from '../shared/en-text.js';
import { COSMETIC_ITEMS, cosmeticRarity, type CosmeticKind } from '../shared/cosmetics.js';
import { cosmeticName } from '../shared/cosmetic-names.js';
import type { Effect, Neck } from '../shared/art/extras.js';
import type { Prop } from '../shared/art/props.js';
import { paintProp } from './prop-draw.js';
import { PROP_COLORS, propRows } from '../shared/art/props.js';

/** 소품 그림을 32x32 칸 가운데(바닥 쪽)에 놓는다(룰렛 칸은 펫과 같은 크기의 그림을 쓴다). */
function centeredProp(prop: Prop): string[] {
  const rows = propRows(prop);
  const w = rows[0]?.length ?? 0;
  const x0 = Math.floor((32 - w) / 2);
  const y0 = Math.floor((32 - rows.length) / 2);
  return Array.from({ length: 32 }, (_, y) => {
    const r = rows[y - y0];
    return r ? '.'.repeat(x0) + r + '.'.repeat(32 - x0 - w) : '.'.repeat(32);
  });
}
import { RARITY_NAME, RARITY_NAME_EN, isRarity, type Rarity } from '../shared/rarity.js';
import { DUPLICATE_XP, type CollectionEntry, type CollectionView } from '../shared/collection.js';
import { levelTier } from '../shared/pet.js';
import { ACCESSORIES, VARIANTS, spriteSet, type Accessory, type SpeciesId, type Variant } from '../shared/species.js';

type SpeciesPullResult = { ok: true; message: string; view: CollectionView; id: SpeciesId; rarity?: Rarity; isNew: boolean; hidden: boolean; count: number };
type PullResult =
  | { ok: false; message: string; view: CollectionView }
  | SpeciesPullResult
  | { ok: true; message: string; view: CollectionView; kind: CosmeticKind; itemId: string; rarity?: Rarity };

interface CollectionApi {
  get(): Promise<CollectionView>;
  lang?(): Promise<Lang>;
  pullSpecies(): Promise<PullResult>;
  pullCosmetic(): Promise<PullResult>;
  switchTo(id: SpeciesId): Promise<{ ok: boolean; message: string; view: CollectionView }>;
  onRefresh(callback: () => void): void;
  close(): void;
}

declare global {
  interface Window {
    collectionApi: CollectionApi;
  }
}

const $ = <T extends HTMLElement>(id: string): T => document.getElementById(id) as T;
const has = (id: string): boolean => document.getElementById(id) !== null;
const setText = (id: string, value: string): void => {
  const e = document.getElementById(id);
  if (e) e.textContent = value;
};

const STAGE_NAME = { egg: '알', baby: '새끼', adult: '성체', legend: '전설' } as const;
/** 룰렛이 도는 시간과, 멈춘 뒤 결과를 보여 주는 시간(ms). "동작 줄이기" 설정이면 거의 바로 보여 준다. */
/** 룰렛: 약 3.8초 돌며 점점 느려지다가, 두 칸 사이에서 잠깐 멈칫한 뒤(약 0.45초) 한쪽으로 고른다(약 0.75초). 합쳐서 약 5초. */
const SPIN_MS = 3800;
const HOVER_MS = 450;
const SETTLE_MS = 750;
const REVEAL_MS = 700;
/** 멈칫할 때 결과 칸의 중심에서 이웃 칸 쪽으로 얼마나 비껴 서는지(칸 폭 비율). 0.5 면 두 칸의 딱 경계다. */
const TEASE = 0.46;
const CELL = 76;
const CELLS = 56;
const motionScale = (): number => (typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0.1 : 1);

let data: CollectionView;
let busy = false;
/** 뽑는 중에 온 새로고침 신호(레벨 보상 등으로 값이 바뀐 경우): 연출이 끝난 뒤에 다시 가져온다 */
let refreshAfterPull = false;

/** 도트 그림(문자 격자)을 canvas 에 그린다. silhouette 면 한 색으로 칠해 실루엣만 보인다. */
function drawSprite(canvas: HTMLCanvasElement, rows: readonly string[], palette: Readonly<Record<string, string>>, scale: number, silhouette?: string): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  rows.forEach((row, y) => {
    [...row].forEach((ch, x) => {
      const color = ch === '.' ? undefined : (silhouette ?? palette[ch]);
      if (!color) return;
      ctx.fillStyle = color;
      ctx.fillRect(x * scale, y * scale, scale, scale);
    });
  });
}

/** 룰렛 칸의 빛깔: 동물은 등급, 꾸미기는 plain */
type ReelRarity = Rarity | 'plain';
interface ReelItem {
  rows: readonly string[];
  palette: Readonly<Record<string, string>>;
  rarity: ReelRarity;
}

/** 룰렛에 지나가는 칸의 등급 비중(실제 확률이 아니라 "높은 등급도 어렴풋이 보이게" 부풀린 값) */
const REEL_MIX: Array<[Rarity, number]> = [['common', 30], ['uncommon', 22], ['rare', 18], ['special', 14], ['legend', 9], ['hidden', 7]];

const pick = <T,>(list: readonly T[]): T => list[Math.floor(Math.random() * list.length)]!;

function speciesItem(e: { id: SpeciesId; rarity: Rarity }): ReelItem {
  const set = spriteSet(e.id, 'adult');
  return { rows: set.frames.idleA, palette: set.palette, rarity: e.rarity };
}

/** 등급 비중대로 등급을 하나 고르고, 그 등급의 동물 중 하나를 고른다(그 등급에 동물이 없으면 건너뛴다). */
function randomFiller(entries: readonly CollectionEntry[]): { id: SpeciesId; rarity: Rarity } {
  const usable = REEL_MIX.filter(([r]) => entries.some((e) => e.rarity === r));
  let roll = Math.random() * usable.reduce((n, [, w]) => n + w, 0);
  for (const [r, w] of usable) {
    roll -= w;
    if (roll < 0) return pick(entries.filter((e) => e.rarity === r));
  }
  return pick(entries);
}

/**
 * 룰렛에 지나갈 칸들. 결과는 이미 서버(메인)가 확률대로 정했고, 여기서는 그 결과가 가운데에 멈추도록 꾸밀 뿐이다.
 * 각 칸은 등급 색으로 빛나서(일반 흰색 … 전설 주황, 히든 무지개) 높은 등급이 지나가는 것을 알아볼 수 있다.
 * 지나가는 칸은 "???" 가 아니라 살짝 어두운 동물 모습이다.
 * 가끔 결과 바로 옆에 전설·히든을 놓아 "아깝다" 느낌을 준다(결과에는 영향 없음).
 */
export function buildReel(result: PullResult & { ok: true }, entries: readonly CollectionEntry[], activeStyle?: { id: SpeciesId; stage: 'baby' | 'adult' | 'legend' }): { items: ReelItem[]; final: number; side: 1 | -1 } {
  const final = CELLS - 8;
  /** 멈칫할 때 결과와 함께 걸쳐 보이는 이웃 칸이 있는 쪽 */
  const side: 1 | -1 = Math.random() < 0.5 ? -1 : 1;
  const items: ReelItem[] = [];
  if ('id' in result) {
    const rarityOfResult: Rarity = result.rarity ?? (result.hidden ? 'hidden' : 'common');
    const tops = entries.filter((e) => e.rarity === 'legend' || e.rarity === 'hidden');
    for (let i = 0; i < CELLS; i++) items.push(speciesItem(randomFiller(entries)));
    items[final] = speciesItem({ id: result.id, rarity: rarityOfResult });
    // 결과가 전설·히든이 아니면 가끔 바로 옆에 전설·히든을 놓아 "아깝다" 느낌을 준다(결과에는 영향 없음)
    if (rarityOfResult !== 'legend' && rarityOfResult !== 'hidden' && tops.length > 0 && Math.random() < 0.4) items[final + side] = speciesItem(pick(tops));
  } else {
    const id = activeStyle?.id ?? 'cat';
    const stage = activeStyle?.stage ?? 'adult';
    /** 꾸미기 하나를 입힌 모습(종류에 따라 그 칸만 바꾼다) */
    const wear = (kind: CosmeticKind, item: string): ReelItem => {
      const style = { variant: 'default' as Variant, accessory: 'none' as Accessory, neck: 'none' as Neck, effect: 'none' as Effect };
      if (kind === 'accessory') style.accessory = item as Accessory;
      else if (kind === 'variant') style.variant = item as Variant;
      else if (kind === 'neck') style.neck = item as Neck;
      else if (kind === 'effect') style.effect = item as Effect;
      if (kind === 'prop') return { rows: centeredProp(item as Prop), palette: PROP_COLORS[item as Exclude<Prop, 'none'>], rarity: 'plain' };
      const set = spriteSet(id, stage, style);
      return { rows: set.frames.idleA, palette: set.palette, rarity: 'plain' };
    };
    // 지나가는 칸도 꾸미기마다 등급 색으로 빛난다(뽑기에 나오는 것만, 등급 비중은 동물 룰렛과 같다)
    const pool = COSMETIC_ITEMS.filter((i) => i.gacha);
    const present = REEL_MIX.filter(([r]) => pool.some((i) => i.rarity === r));
    const fill = (): ReelItem => {
      let roll = Math.random() * present.reduce((n, [, w]) => n + w, 0);
      let grade: Rarity = present[present.length - 1]![0];
      for (const [r, w] of present) {
        roll -= w;
        if (roll < 0) {
          grade = r;
          break;
        }
      }
      const it = pick(pool.filter((i) => i.rarity === grade));
      return { ...wear(it.kind, it.id), rarity: it.rarity };
    };
    for (let i = 0; i < CELLS; i++) items.push(fill());
    items[final] = { ...wear(result.kind, result.itemId), rarity: result.rarity ?? cosmeticRarity(result.kind, result.itemId) };
  }
  return { items, final, side };
}

/** 룰렛을 돌린다. 끝나면(가운데 칸을 밝히고 잠깐 보여 준 뒤) 풀린다. */
async function spinReel(result: PullResult & { ok: true }): Promise<void> {
  const reel = $('reel');
  const strip = $('strip');
  const k = motionScale();
  const active = data.entries.find((e) => e.active);
  const { items, final, side } = buildReel(result, data.entries, active ? { id: active.id, stage: active.stage === 'egg' ? 'baby' : active.stage } : undefined);
  strip.textContent = '';
  items.forEach((it, i) => {
    const cell = document.createElement('div');
    cell.className = `cell ${it.rarity}` + (i === final ? ' final' : '');
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    drawSprite(canvas, it.rows, it.palette, 2);
    cell.append(canvas);
    if (it.rarity === 'hidden') {
      // 히든은 어두운 실루엣에 "???" 를 덮어서 지나간다(멈춘 결과 칸에서만 걷힌다)
      const mystery = document.createElement('span');
      mystery.className = 'mystery';
      mystery.textContent = '???';
      mystery.setAttribute('data-no-translate', '');
      cell.append(mystery);
    }
    strip.append(cell);
  });
  $('result-canvas').hidden = true;
  reel.hidden = false;
  reel.classList.remove('stopped');
  const half = Math.max(reel.clientWidth, 300) / 2;
  strip.style.transition = 'none';
  strip.style.transform = 'translateX(0)';
  void strip.offsetWidth; // 처음 자리를 먼저 적용한 다음에 움직이게 한다
  const centerX = (cellOffset: number): number => Math.round(half - (final * CELL + CELL / 2 + cellOffset * CELL));
  const wait = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, Math.round(ms * k)));
  // 1) 빠르게 돌다가 점점 느려져서, 결과 칸과 이웃 칸의 경계 근처에서 멈춘다(어느 쪽이 될지 모르게)
  const lean = side * TEASE;
  strip.style.transition = `transform ${Math.round(SPIN_MS * k)}ms cubic-bezier(0.12, 0.6, 0.18, 1)`;
  strip.style.transform = `translateX(${centerX(lean)}px)`;
  await wait(SPIN_MS);
  // 2) 잠시 멈칫
  await wait(HOVER_MS);
  // 3) 결과 칸 쪽으로 슬그머니 넘어가 고른다
  strip.style.transition = `transform ${Math.round(SETTLE_MS * k)}ms ease-in-out`;
  strip.style.transform = `translateX(${centerX(0)}px)`;
  await wait(SETTLE_MS);
  strip.children[final]?.classList.add('reveal');
  reel.classList.add('stopped');
  await wait(REVEAL_MS);
  reel.hidden = true;
  $('result-canvas').hidden = false;
}

/** 등급 이름(색이 입혀진다). 히든은 무지개로 흐른다. */
function gradeName(r: Rarity): string {
  return currentUiLang() === 'en' ? RARITY_NAME_EN[r] : RARITY_NAME[r];
}
function gradeSpan(r: Rarity, className = 'grade'): HTMLSpanElement {
  const span = document.createElement('span');
  span.className = `${className} grade-${r}`;
  span.textContent = gradeName(r);
  span.setAttribute('data-no-translate', '');
  return span;
}
const gradeTag = (r: Rarity): HTMLSpanElement => gradeSpan(r, 'grade grade-tag');

/** 받침이 있으면 "이", 없으면 "가" */
const iga = (word: string): string => {
  const code = word.charCodeAt(word.length - 1) - 0xac00;
  return code >= 0 && code <= 11171 && code % 28 !== 0 ? '이' : '가';
};

function petCard(e: CollectionEntry): HTMLElement {
  const box = document.createElement('div');
  box.className = 'pet' + (e.hidden ? ' hidden-pet' : '') + (e.owned ? '' : ' empty') + (e.active ? ' active' : '') + ` rarity-${e.rarity}`;
  box.dataset['id'] = e.id;

  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const stage = e.owned ? (e.stage === 'egg' ? 'baby' : e.stage) : 'adult';
  const set = spriteSet(e.id, stage);
  drawSprite(canvas, set.frames.idleA, set.palette, 2, e.owned ? undefined : e.hidden ? '#cbbce6' : '#d9cfc0');

  const name = document.createElement('div');
  name.className = 'name';
  name.textContent = e.owned || !e.hidden ? e.speciesName : '???';

  const meta = document.createElement('div');
  meta.className = 'meta';
  if (e.owned) {
    // 사용자가 지어 준 이름은 번역하지 않는다(data-no-translate)
    const nick = document.createElement('span');
    nick.setAttribute('data-no-translate', '');
    nick.textContent = e.name ? `${e.name} · ` : '';
    const tier = levelTier(e.level);
    const lv = document.createElement('b');
    lv.className = 'lvc';
    lv.textContent = `Lv.${e.level}`;
    lv.style.setProperty('color', tier.color);
    meta.append(nick, lv, ` ${tier.name} · ${STAGE_NAME[e.stage]}${e.count > 1 ? ` ×${e.count}` : ''} `, gradeTag(e.rarity));
  } else {
    meta.textContent = e.hidden ? '히든 동물' : '아직 없어요';
  }

  box.append(canvas, name, meta);
  if (e.owned) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = e.active ? '키우는 중' : '꺼내기';
    button.disabled = e.active;
    button.addEventListener('click', () => void switchTo(e.id));
    box.append(button);
  }
  return box;
}

function render(): void {
  setText('tickets', `🎟 뽑기권 ${data.tickets}장`);
  setText('owned-count', `가진 동물 ${data.ownedCount}/${data.total}`);
  renderGacha();
  renderPets();
}

function renderPets(): void {
  if (!has('grid')) return;
  const grid = $('grid');
  grid.textContent = '';
  // 키우는 동물을 맨 앞에, 나머지는 레벨 높은 순으로 보여 준다(가진 동물만).
  const mine = data.entries.filter((e) => e.owned).sort((a, b) => Number(b.active) - Number(a.active) || b.level - a.level);
  for (const e of mine) grid.append(petCard(e));
}

function renderGacha(): void {
  if (!has('pull-species')) return;
  const species = $<HTMLButtonElement>('pull-species');
  species.textContent = `동물 뽑기 (${data.cost.species}장)`;
  species.disabled = busy || data.tickets < data.cost.species;
  const cosmetic = $<HTMLButtonElement>('pull-cosmetic');
  cosmetic.textContent = data.cosmeticLeft > 0 ? `꾸미기 뽑기 (${data.cost.cosmetic}장 · 남은 ${data.cosmeticLeft}종)` : '꾸미기를 모두 모았어요';
  cosmetic.disabled = busy || data.tickets < data.cost.cosmetic || data.cosmeticLeft === 0;
  const en = currentUiLang() === 'en';
  const pct = (n: number): string => (Number.isInteger(n) ? String(n) : n.toFixed(n < 1 ? 2 : 1));
  const chances = $('chances');
  chances.textContent = '';
  chances.append(en ? 'Odds: ' : '확률: ');
  data.chances.forEach((c, i) => {
    if (i > 0) chances.append(' · ');
    chances.append(gradeSpan(c.rarity, 'grade grade-dark'), en ? ` ${c.count} each ${pct(c.each)}%` : ` ${c.count}종 각 ${pct(c.each)}%`);
  });
  chances.append(en ? '. A duplicate animal gains XP.' : '. 이미 가진 동물이 나오면 그 동물이 경험치를 받아요.');
  $('pity').textContent = en
    ? `Legendary is guaranteed within ${data.untilPity} pulls (${data.pulls} pulled so far). Hidden animals have no guarantee and only come out at a very low rate.`
    : `전설이 안 나오면 ${data.untilPity}번 안에 반드시 나와요 (지금까지 ${data.pulls}번 뽑음). 히든은 천장 없이 아주 낮은 확률로만 나와요.`;
}

/** "여우가 나왔어요! (일반)" — 등급에 색이 입혀진다. 이미 가진 동물이면 횟수와 경험치도 알려 준다. */
function describePull(text: HTMLElement, r: SpeciesPullResult, rarity: Rarity): void {
  const ko = data.entries.find((e) => e.id === r.id)?.speciesName ?? r.id;
  const en = currentUiLang() === 'en';
  text.textContent = '';
  text.append(en ? `${nameEn(ko)} appeared! (` : `${ko}${iga(ko)} 나왔어요! (`, gradeSpan(rarity), ')');
  if (r.isNew) text.append(en ? ' ✨ New!' : ' ✨ 새로 왔어요!');
  else text.append(en ? ` · #${r.count} · XP +${DUPLICATE_XP}` : ` · ${r.count}번째 · 경험치 +${DUPLICATE_XP}`);
}

/** "마법사 모자를 얻었어요! (희귀)" — 등급에 색이 입혀진다. */
function describeCosmetic(text: HTMLElement, kind: CosmeticKind, itemId: string, rarity: Rarity): void {
  const en = currentUiLang() === 'en';
  const ko = cosmeticName(kind, itemId);
  const eul = (w: string): string => {
    const code = w.charCodeAt(w.length - 1) - 0xac00;
    return code >= 0 && code <= 11171 && code % 28 !== 0 ? '을' : '를';
  };
  text.textContent = '';
  text.append(en ? `Got ${nameEn(ko)}! (` : `${ko}${eul(ko)} 얻었어요! (`, gradeSpan(rarity), ')');
}

function showResult(result: PullResult): void {
  const box = $('result');
  box.classList.remove('shaking', 'win-hidden', 'win-legend', 'win-special');
  const canvas = $<HTMLCanvasElement>('result-canvas');
  const text = $('result-text');
  text.textContent = result.message;
  if (!result.ok) {
    canvas.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height);
    return;
  }
  if ('id' in result) {
    const rarity: Rarity = result.rarity && isRarity(result.rarity) ? result.rarity : result.hidden ? 'hidden' : 'common';
    if (rarity === 'hidden') box.classList.add('win-hidden');
    else if (rarity === 'legend') box.classList.add('win-legend');
    else if (rarity === 'special') box.classList.add('win-special');
    describePull(text, result, rarity);
    const set = spriteSet(result.id, 'baby');
    drawSprite(canvas, set.frames.idleA, set.palette, 4);
  } else {
    // 꾸미기: 지금 키우는 동물에게 입혀 보여 준다.
    const rarity = result.rarity ?? cosmeticRarity(result.kind, result.itemId);
    if (rarity === 'legend') box.classList.add('win-legend');
    else if (rarity === 'special') box.classList.add('win-special');
    else if (rarity === 'hidden') box.classList.add('win-hidden');
    describeCosmetic(text, result.kind, result.itemId, rarity);
    const active = data.entries.find((e) => e.active);
    if (active) {
      const stage = active.stage === 'egg' ? 'baby' : active.stage;
      const style: { variant: Variant; accessory: Accessory; neck: Neck; effect: Effect } = { variant: 'default', accessory: 'none', neck: 'none', effect: 'none' };
      if (result.kind === 'accessory') style.accessory = result.itemId as Accessory;
      else if (result.kind === 'variant') style.variant = result.itemId as Variant;
      else if (result.kind === 'neck') style.neck = result.itemId as Neck;
      else if (result.kind === 'effect') style.effect = result.itemId as Effect;
      if (result.kind === 'prop') paintProp(canvas, result.itemId as Prop);
      else {
        const set = spriteSet(active.id, stage, style);
        drawSprite(canvas, set.frames.idleA, set.palette, 4);
      }
    }
  }
}

async function pull(kind: 'species' | 'cosmetic'): Promise<void> {
  if (busy) return;
  busy = true;
  render();
  const box = $('result');
  box.hidden = false;
  box.classList.remove('win-hidden', 'win-legend', 'win-special');
  box.classList.add('shaking');
  $('result-text').textContent = '뽑는 중…';
  const egg = spriteSet('rabbit', 'egg');
  drawSprite($<HTMLCanvasElement>('result-canvas'), egg.frames.idleA, egg.palette, 4);
  const result = await (kind === 'species' ? window.collectionApi.pullSpecies() : window.collectionApi.pullCosmetic());
  if (result.ok) {
    box.classList.remove('shaking');
    $('result-text').textContent = '';
    await spinReel(result);
  }
  data = result.view;
  busy = false;
  render();
  showResult(result);
  // 뽑기권·뽑은 횟수·천장·확률 문구는 늘 가장 최신 값으로 다시 맞춘다.
  if (refreshAfterPull) {
    refreshAfterPull = false;
    await refresh();
  }
}

async function switchTo(id: SpeciesId): Promise<void> {
  const r = await window.collectionApi.switchTo(id);
  data = r.view;
  render();
  setText('switch-note', r.message);
  if (!has('result')) return;
  const box = $('result');
  box.hidden = false;
  box.classList.remove('shaking', 'win-hidden');
  $('result-text').textContent = r.message;
}

async function refresh(): Promise<void> {
  if (busy) {
    refreshAfterPull = true;
    return;
  }
  data = await window.collectionApi.get();
  render();
}

if (has('pull-species')) {
  $('pull-species').addEventListener('click', () => void pull('species'));
  $('pull-cosmetic').addEventListener('click', () => void pull('cosmetic'));
}
for (const id of ['close', 'close-pets']) if (has(id)) $(id).addEventListener('click', () => window.collectionApi.close());
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') window.collectionApi.close();
});
window.collectionApi.onRefresh(() => void refresh());
void startUiLocalization(window.collectionApi.lang?.bind(window.collectionApi));
void refresh();

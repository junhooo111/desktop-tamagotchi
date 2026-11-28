/**
 * 경매장 창 화면: 동물과 꾸미기를 사고판다. 서버가 가진 판매 목록과 내 것을 보여 준다.
 * 값은 메인이 서버에서 읽어서 넘겨 주고, 여기서는 textContent 로만 그린다(남이 쓴 이름이 들어오므로 HTML 로 해석하지 않는다).
 * 줄마다 작은 미리보기 그림이 있다: 동물은 그 레벨의 모습으로, 꾸미기는 지금 키우는 펫에게 입힌 모습으로.
 */
import type { Lang } from '../shared/i18n.js';
import { initUiLang, localize, currentUiLang } from './dom-i18n.js';
import { RARITY_NAME, RARITY_NAME_EN, RARITIES, isRarity, type Rarity } from '../shared/rarity.js';
import { ADULT_LEVEL, LEGEND_LEVEL } from '../shared/pet.js';
import { hasLegendForm, spriteSet, type Accessory, type Effect, type Neck, type SpeciesId, type Variant } from '../shared/species.js';
import { cosmeticName } from '../shared/cosmetic-names.js';
import type { CosmeticKind } from '../shared/cosmetics.js';
import { nameEn } from '../shared/en-text.js';
import type { Prop } from '../shared/art/props.js';
import { paintProp } from './prop-draw.js';

export interface Listing {
  listing_id: string;
  price: number;
  species_id: string;
  species_name: string;
  rarity: string;
  level: number;
  seller_login: string;
  is_mine: boolean;
}
export interface MyPet {
  pet_id: string;
  species_id: string;
  species_name: string;
  rarity: string;
  level: number;
  equipped: boolean;
  listing_id: string | null;
  price: number | null;
}
export interface CosmeticListing {
  listing_id: string;
  kind: CosmeticKind;
  item_id: string;
  rarity: string;
  price: number;
  seller_login: string;
  is_mine: boolean;
}
export interface MyCosmetic {
  kind: CosmeticKind;
  item_id: string;
  rarity: string;
  tradable: boolean;
  listing_id: string | null;
  price: number | null;
}
export interface MarketView {
  ok: boolean;
  message?: string;
  coins: number;
  listings: Listing[];
  pets: MyPet[];
  cosmeticListings?: CosmeticListing[];
  myCosmetics?: MyCosmetic[];
  /** 꾸미기 미리보기에 쓸 지금 키우는 펫 */
  me?: { speciesId: SpeciesId; stage: 'baby' | 'adult' | 'legend' } | null;
}
export interface ActionResult {
  ok: boolean;
  message: string;
  view: MarketView;
}

interface MarketApi {
  get(): Promise<MarketView>;
  buy(listingId: string): Promise<ActionResult>;
  sell(petId: string, price: number): Promise<ActionResult>;
  cancel(listingId: string): Promise<ActionResult>;
  buyCosmetic?(listingId: string): Promise<ActionResult>;
  sellCosmetic?(kind: string, item: string, price: number): Promise<ActionResult>;
  cancelCosmetic?(listingId: string): Promise<ActionResult>;
  close(): void;
  lang?(): Promise<Lang>;
}
declare global {
  interface Window {
    marketApi: MarketApi;
  }
}

const $ = <T extends HTMLElement>(id: string): T => document.getElementById(id) as T;
let cat: 'pets' | 'cosmetics' = 'pets';
let mode: 'buy' | 'sell' = 'buy';
let view: MarketView | null = null;

const money = (n: number): string => `${n.toLocaleString('ko-KR')} 게임머니`;
const rarityOf = (v: string): Rarity => (isRarity(v) ? v : 'common');
const gradeName = (r: Rarity): string => (currentUiLang() === 'en' ? RARITY_NAME_EN[r] : RARITY_NAME[r]);

/** 등급 이름표(어두운 알약 위에 등급 색) */
function gradeTag(r: Rarity): HTMLSpanElement {
  const s = document.createElement('span');
  s.className = `grade-tag grade-${r}`;
  s.textContent = gradeName(r);
  s.setAttribute('data-no-translate', '');
  return s;
}

/** 레벨에 맞는 모습(알은 새끼로 본다). 전설·히든은 레벨 10부터 전설 모습. */
function stageForLevel(id: string, level: number): 'baby' | 'adult' | 'legend' {
  if (level >= LEGEND_LEVEL && hasLegendForm(id as SpeciesId)) return 'legend';
  return level >= ADULT_LEVEL ? 'adult' : 'baby';
}

/** 미리보기 그림(64x64 캔버스에 2배로 그려서 또렷하게) */
function preview(id: string, stage: 'baby' | 'adult' | 'legend', style: { variant?: Variant; accessory?: Accessory; neck?: Neck; effect?: Effect } = {}): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = 64;
  c.height = 64;
  c.className = 'preview';
  c.setAttribute('aria-hidden', 'true');
  const ctx = c.getContext('2d');
  if (!ctx) return c;
  const set = spriteSet(id as SpeciesId, stage, { variant: style.variant ?? 'default', accessory: style.accessory ?? 'none', neck: style.neck ?? 'none', effect: style.effect ?? 'none' });
  set.frames.idleA.forEach((row, y) => {
    [...row].forEach((ch, x) => {
      const color = ch === '.' ? undefined : set.palette[ch];
      if (!color) return;
      ctx.fillStyle = color;
      ctx.fillRect(x * 2, y * 2, 2, 2);
    });
  });
  return c;
}

/** 꾸미기 하나를 지금 키우는 펫에게 입힌 미리보기 */
function cosmeticPreview(kind: CosmeticKind, item: string): HTMLCanvasElement {
  if (kind === 'prop') {
    const c = document.createElement('canvas');
    c.width = 64;
    c.height = 64;
    c.className = 'preview';
    c.setAttribute('aria-hidden', 'true');
    paintProp(c, item as Prop);
    return c;
  }
  const me = view?.me ?? { speciesId: 'cat' as SpeciesId, stage: 'adult' as const };
  const style: { variant?: Variant; accessory?: Accessory; neck?: Neck; effect?: Effect } = {};
  if (kind === 'accessory') style.accessory = item as Accessory;
  else if (kind === 'variant') style.variant = item as Variant;
  else if (kind === 'neck') style.neck = item as Neck;
  else if (kind === 'effect') style.effect = item as Effect;
  return preview(me.speciesId, me.stage, style);
}

function row(thumb: HTMLElement, main: string, tags: Node[], sub: string, right: HTMLElement[]): HTMLLIElement {
  const li = document.createElement('li');
  const info = document.createElement('div');
  info.className = 'info';
  const a = document.createElement('div');
  a.className = 'main';
  a.append(main, ' ', ...tags);
  const b = document.createElement('div');
  b.className = 'sub';
  b.textContent = sub;
  info.append(a, b);
  li.append(thumb, info, ...right);
  return li;
}

function button(label: string, onClick: () => void, disabled = false): HTMLButtonElement {
  const b = document.createElement('button');
  b.type = 'button';
  b.textContent = label;
  b.disabled = disabled;
  b.addEventListener('click', onClick);
  return b;
}

function priceTag(n: number): HTMLSpanElement {
  const s = document.createElement('span');
  s.className = 'price';
  s.textContent = money(n);
  return s;
}

function priceInput(): HTMLInputElement {
  const input = document.createElement('input');
  input.type = 'number';
  input.min = '1';
  input.max = '1000000';
  input.placeholder = '가격';
  input.setAttribute('aria-label', '가격');
  return input;
}

async function act(p: Promise<ActionResult>): Promise<void> {
  const r = await p;
  render(r.view);
  $('note').textContent = r.message;
  localize($('note'));
}

const nameOfCosmetic = (kind: CosmeticKind, item: string): string => {
  const ko = cosmeticName(kind, item);
  return currentUiLang() === 'en' ? nameEn(ko) : ko;
};

function renderPetsBuy(v: MarketView, list: HTMLElement, filter: Rarity | 'all'): string {
  const shown = v.listings.filter((l) => filter === 'all' || rarityOf(l.rarity) === filter);
  for (const l of shown) {
    const action = l.is_mine ? button('내가 올림', () => undefined, true) : button('사기', () => void act(window.marketApi.buy(l.listing_id)), v.coins < l.price);
    list.append(row(preview(l.species_id, stageForLevel(l.species_id, l.level)), `${l.species_name} Lv.${l.level}`, [gradeTag(rarityOf(l.rarity))], `판매자 ${l.seller_login}`, [priceTag(l.price), action]));
  }
  return shown.length === 0 ? '지금 팔고 있는 펫이 없어요' : '사면 바로 내 펫이 돼요. 파는 사람은 수수료 없이 가격만큼 받아요.';
}

function renderPetsSell(v: MarketView, list: HTMLElement): string {
  const unlisted = v.pets.filter((p) => !p.listing_id).length;
  for (const p of v.pets) {
    const thumb = preview(p.species_id, stageForLevel(p.species_id, p.level));
    const tags = [gradeTag(rarityOf(p.rarity))];
    const sub = p.equipped ? '지금 키우는 펫' : '';
    if (p.listing_id) {
      const lid = p.listing_id;
      list.append(row(thumb, `${p.species_name} Lv.${p.level}`, tags, `${sub ? sub + ' · ' : ''}판매 중`, [priceTag(p.price ?? 0), button('내리기', () => void act(window.marketApi.cancel(lid)))]));
      continue;
    }
    const input = priceInput();
    const last = unlisted <= 1;
    input.disabled = last;
    const sell = button(last ? '마지막 한 마리' : '팔기', () => void act(window.marketApi.sell(p.pet_id, Math.floor(Number(input.value)))), last);
    list.append(row(thumb, `${p.species_name} Lv.${p.level}`, tags, sub, [input, sell]));
  }
  return v.pets.length === 0 ? '펫이 없어요' : '마지막 한 마리는 팔 수 없어요. 팔 때 가격은 1~1,000,000 게임머니예요.';
}

function renderCosmeticsBuy(v: MarketView, list: HTMLElement, filter: Rarity | 'all'): string {
  const ownedIds = new Set((v.myCosmetics ?? []).map((c) => `${c.kind}:${c.item_id}`));
  const shown = (v.cosmeticListings ?? []).filter((l) => filter === 'all' || rarityOf(l.rarity) === filter);
  for (const l of shown) {
    const owned = ownedIds.has(`${l.kind}:${l.item_id}`);
    const action = l.is_mine
      ? button('내가 올림', () => undefined, true)
      : button(owned ? '이미 있어요' : '사기', () => void act((window.marketApi.buyCosmetic ?? window.marketApi.buy)(l.listing_id)), owned || v.coins < l.price);
    list.append(row(cosmeticPreview(l.kind, l.item_id), nameOfCosmetic(l.kind, l.item_id), [gradeTag(rarityOf(l.rarity))], `판매자 ${l.seller_login}`, [priceTag(l.price), action]));
  }
  return shown.length === 0 ? '지금 팔고 있는 꾸미기가 없어요' : '사면 바로 내 꾸미기가 돼요. 이미 가진 꾸미기는 살 수 없어요.';
}

function renderCosmeticsSell(v: MarketView, list: HTMLElement): string {
  const mine = (v.myCosmetics ?? []).filter((c) => c.tradable);
  for (const c of mine) {
    const thumb = cosmeticPreview(c.kind, c.item_id);
    const tags = [gradeTag(rarityOf(c.rarity))];
    const name = nameOfCosmetic(c.kind, c.item_id);
    if (c.listing_id) {
      const lid = c.listing_id;
      list.append(row(thumb, name, tags, '판매 중', [priceTag(c.price ?? 0), button('내리기', () => void act((window.marketApi.cancelCosmetic ?? window.marketApi.cancel)(lid)))]));
      continue;
    }
    const input = priceInput();
    const sell = button('팔기', () => void act((window.marketApi.sellCosmetic ?? (() => Promise.reject(new Error('no sell'))))(c.kind, c.item_id, Math.floor(Number(input.value)))));
    list.append(row(thumb, name, tags, '', [input, sell]));
  }
  return mine.length === 0 ? '팔 수 있는 꾸미기가 없어요(뽑기로 얻은 꾸미기만 팔 수 있어요)' : '업적으로도 열 수 있는 꾸미기는 팔 수 없어요. 팔 때 가격은 1~1,000,000 게임머니예요.';
}

export function render(v: MarketView): void {
  view = v;
  const list = $('list');
  list.textContent = '';
  const note = $('note');
  if (!v.ok) {
    $('wallet').textContent = '';
    note.textContent = v.message ?? '경매장을 불러오지 못했어요';
    localize();
    return;
  }
  $('wallet').textContent = `내 게임머니: ${money(v.coins)}`;
  for (const t of $('cats').querySelectorAll('button')) t.setAttribute('aria-selected', String(t.dataset['cat'] === cat));
  for (const t of $('modes').querySelectorAll('button')) t.setAttribute('aria-selected', String(t.dataset['mode'] === mode));
  const filterBox = $('filter-box');
  filterBox.hidden = mode !== 'buy';
  const select = $<HTMLSelectElement>('grade-filter');
  const filter = select.value && isRarity(select.value) ? select.value : 'all';

  if (cat === 'pets') note.textContent = mode === 'buy' ? renderPetsBuy(v, list, filter) : renderPetsSell(v, list);
  else note.textContent = mode === 'buy' ? renderCosmeticsBuy(v, list, filter) : renderCosmeticsSell(v, list);
  localize();
}

async function load(): Promise<void> {
  render(await window.marketApi.get());
}

function init(): void {
  const select = $<HTMLSelectElement>('grade-filter');
  for (const r of RARITIES) {
    const o = document.createElement('option');
    o.value = r;
    o.textContent = RARITY_NAME[r];
    select.append(o);
  }
  select.addEventListener('change', () => view && render(view));
  for (const b of $('cats').querySelectorAll('button')) {
    b.addEventListener('click', () => {
      cat = b.dataset['cat'] === 'cosmetics' ? 'cosmetics' : 'pets';
      $('note').textContent = '';
      if (view) render(view);
    });
  }
  for (const b of $('modes').querySelectorAll('button')) {
    b.addEventListener('click', () => {
      mode = b.dataset['mode'] === 'sell' ? 'sell' : 'buy';
      $('note').textContent = '';
      if (view) render(view);
    });
  }
  $('close').addEventListener('click', () => window.marketApi.close());
  void initUiLang(window.marketApi.lang?.bind(window.marketApi)).then(load);
}

if (typeof window !== 'undefined' && 'marketApi' in window) init();

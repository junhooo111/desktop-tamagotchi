/**
 * 뽑기·컬렉션 창: 뽑기권으로 동물·꾸미기를 뽑고, 가진 동물 중 한 마리를 꺼낸다.
 * 규칙(확률·비용·보상)은 메인(shared/collection.ts)이 정하고 여기서는 보여 주기만 한다.
 */
import type { CollectionEntry, CollectionView } from '../shared/collection.js';
import { levelTier } from '../shared/pet.js';
import { spriteSet, type SpeciesId } from '../shared/species.js';

type PullResult =
  | { ok: false; message: string; view: CollectionView }
  | { ok: true; message: string; view: CollectionView; id: SpeciesId; isNew: boolean; hidden: boolean; count: number }
  | { ok: true; message: string; view: CollectionView; kind: 'accessory' | 'variant'; itemId: string };

interface CollectionApi {
  get(): Promise<CollectionView>;
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

const STAGE_NAME = { egg: '알', baby: '새끼', adult: '성체', legend: '전설' } as const;
/** 뽑는 연출에 걸리는 시간(ms) */
const SUSPENSE_MS = 900;

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

function petCard(e: CollectionEntry): HTMLElement {
  const box = document.createElement('div');
  box.className = 'pet' + (e.hidden ? ' hidden-pet' : '') + (e.owned ? '' : ' empty') + (e.active ? ' active' : '');
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
    const nick = e.name ? `${e.name} · ` : '';
    const tier = levelTier(e.level);
    const lv = document.createElement('b');
    lv.className = 'lvc';
    lv.textContent = `Lv.${e.level}`;
    lv.style.setProperty('color', tier.color);
    meta.append(nick, lv, ` ${tier.name} · ${STAGE_NAME[e.stage]}${e.count > 1 ? ` ×${e.count}` : ''}`);
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
  $('tickets').textContent = `🎟 뽑기권 ${data.tickets}장`;
  $('owned-count').textContent = `가진 동물 ${data.ownedCount}/${data.total}`;
  const species = $<HTMLButtonElement>('pull-species');
  species.textContent = `동물 뽑기 (${data.cost.species}장)`;
  species.disabled = busy || data.tickets < data.cost.species;
  const cosmetic = $<HTMLButtonElement>('pull-cosmetic');
  cosmetic.textContent = data.cosmeticLeft > 0 ? `꾸미기 뽑기 (${data.cost.cosmetic}장 · 남은 ${data.cosmeticLeft}종)` : '꾸미기를 모두 모았어요';
  cosmetic.disabled = busy || data.tickets < data.cost.cosmetic || data.cosmeticLeft === 0;
  const c = data.chances;
  $('chances').textContent = `확률: 일반 동물 ${data.entries.filter((e) => !e.hidden).length}종 각 ${c.commonEach.toFixed(1)}% · 히든 동물 ${data.entries.filter((e) => e.hidden).length}종 각 ${c.hiddenEach}% (합쳐서 ${c.hiddenTotal}%). 이미 가진 동물이 나오면 그 동물이 경험치를 받아요.`;
  $('pity').textContent = `히든이 안 나오면 ${data.untilPity}번 안에 반드시 나와요 (지금까지 ${data.pulls}번 뽑음)`;
  const grid = $('grid');
  grid.textContent = '';
  for (const e of data.entries) grid.append(petCard(e));
}

function showResult(result: PullResult): void {
  const box = $('result');
  box.classList.remove('shaking', 'win-hidden');
  const canvas = $<HTMLCanvasElement>('result-canvas');
  const text = $('result-text');
  text.textContent = result.message;
  if (!result.ok) {
    canvas.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height);
    return;
  }
  if ('id' in result) {
    if (result.hidden) box.classList.add('win-hidden');
    const set = spriteSet(result.id, 'baby');
    drawSprite(canvas, set.frames.idleA, set.palette, 4);
  } else {
    // 꾸미기: 지금 키우는 동물에게 입혀 보여 준다.
    const active = data.entries.find((e) => e.active);
    if (active) {
      const stage = active.stage === 'egg' ? 'baby' : active.stage;
      const style = result.kind === 'accessory' ? { variant: 'default' as const, accessory: result.itemId as never } : { variant: result.itemId as never, accessory: 'none' as const };
      const set = spriteSet(active.id, stage, style);
      drawSprite(canvas, set.frames.idleA, set.palette, 4);
    }
  }
}

async function pull(kind: 'species' | 'cosmetic'): Promise<void> {
  if (busy) return;
  busy = true;
  render();
  const box = $('result');
  box.hidden = false;
  box.classList.remove('win-hidden');
  box.classList.add('shaking');
  $('result-text').textContent = '뽑는 중…';
  const egg = spriteSet('rabbit', 'egg');
  drawSprite($<HTMLCanvasElement>('result-canvas'), egg.frames.idleA, egg.palette, 4);
  const result = await (kind === 'species' ? window.collectionApi.pullSpecies() : window.collectionApi.pullCosmetic());
  await new Promise((r) => setTimeout(r, SUSPENSE_MS));
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

$('pull-species').addEventListener('click', () => void pull('species'));
$('pull-cosmetic').addEventListener('click', () => void pull('cosmetic'));
$('close').addEventListener('click', () => window.collectionApi.close());
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') window.collectionApi.close();
});
window.collectionApi.onRefresh(() => void refresh());
void refresh();

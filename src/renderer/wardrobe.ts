/**
 * 꾸미기 창: 친구(동물)·색·장식을 고르고 미리 본다.
 * 업적으로 아직 안 열린 것은 점선으로 보이고, 눌러도 바뀌지 않고 여는 방법을 알려 준다.
 * 실제로 적용할 수 있는지는 메인이 다시 검증한다.
 */
import type { Lang } from '../shared/i18n.js';
import { startUiLocalization } from './dom-i18n.js';
import type { DisplayStage } from '../shared/pet.js';
import { spriteSet, type Accessory, type SpeciesId, type Variant } from '../shared/species.js';
import type { WardrobeEntry, WardrobePatch, WardrobeView } from '../shared/wardrobe.js';
import { cosmeticItem } from '../shared/cosmetics.js';

/** 메인이 stage(미리보기에 쓸 단계)를 덧붙여 준다. 알이면 새끼 모습으로 보여 준다. */
export interface WardrobeData extends WardrobeView {
  stage: 'baby' | 'adult' | 'legend';
}

interface WardrobeApi {
  get(): Promise<WardrobeData>;
  lang?(): Promise<Lang>;
  set(patch: WardrobePatch): Promise<WardrobeData>;
  onRefresh(callback: () => void): void;
  close(): void;
}

declare global {
  interface Window {
    wardrobeApi: WardrobeApi;
  }
}

const $ = <T extends HTMLElement>(id: string): T => document.getElementById(id) as T;

let data: WardrobeData;

/** 캔버스에 펫을 그린다. 칸 크기에 맞게 배율을 정한다. */
function paint(canvas: HTMLCanvasElement, variant: Variant, accessory: Accessory): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const scale = canvas.width / 32;
  const set = spriteSet(data.current.speciesId, data.stage, { variant, accessory });
  set.frames.idleA.forEach((row, y) => {
    [...row].forEach((ch, x) => {
      const color = ch === '.' ? undefined : set.palette[ch];
      if (!color) return;
      ctx.fillStyle = color;
      ctx.fillRect(x * scale, y * scale, scale, scale);
    });
  });
}

function drawPreview(): void {
  paint($<HTMLCanvasElement>('preview'), data.current.variant, data.current.accessory);
}

/** thumb 이 있으면 그 칸을 입었을 때의 모습을 작은 그림으로 함께 보여 준다(옷장처럼). */
function group<T extends string>(boxId: string, entries: readonly WardrobeEntry<T>[], selected: T, patchOf: (id: T) => WardrobePatch, thumb?: (id: T) => { variant: Variant; accessory: Accessory }, kind?: 'accessory' | 'variant'): void {
  const box = $(boxId);
  box.textContent = '';
  for (const e of entries) {
    const b = document.createElement('button');
    b.type = 'button';
    const label = e.unlocked ? e.name : `🔒 ${e.name}`;
    if (thumb) {
      const c = document.createElement('canvas');
      c.width = 64;
      c.height = 64;
      c.setAttribute('aria-hidden', 'true');
      const t = thumb(e.id);
      paint(c, t.variant, t.accessory);
      const span = document.createElement('span');
      span.className = 'label';
      span.textContent = label;
      b.append(c, span);
    } else {
      b.textContent = label;
    }
    b.dataset['id'] = e.id;
    // 꾸미기 칸 아래쪽에 등급 색 줄(일반 흰색 … 전설 주황)을 그어 한눈에 구분되게 한다
    const grade = kind ? cosmeticItem(kind, e.id)?.rarity : undefined;
    if (grade) b.classList.add(`r-${grade}`);
    b.setAttribute('aria-pressed', String(e.unlocked && e.id === selected));
    if (e.unlocked) {
      b.addEventListener('click', () => void change(patchOf(e.id)));
    } else {
      // disabled 대신 aria-disabled 로 두어야 눌렀을 때 여는 방법을 보여 줄 수 있다.
      b.setAttribute('aria-disabled', 'true');
      b.title = e.hint;
      b.addEventListener('click', () => ($('lock-hint').textContent = `${e.name}: ${e.hint}`));
    }
    box.append(b);
  }
}

function render(): void {
  group<DisplayStage>('stages', data.stages, data.current.displayStage, (id) => ({ displayStage: id }));
  group<Variant>('variants', data.variants, data.current.variant, (id) => ({ variant: id }), (id) => ({ variant: id, accessory: data.current.accessory }), 'variant');
  group<Accessory>('accessories', data.accessories, data.current.accessory, (id) => ({ accessory: id }), (id) => ({ variant: data.current.variant, accessory: id }), 'accessory');
  const cardEntries: WardrobeEntry<SpeciesId | 'current'>[] = [{ id: 'current', name: '지금 키우는 펫', unlocked: true, hint: '' }, ...data.species];
  group<SpeciesId | 'current'>('card-species', cardEntries, data.current.cardSpecies, (id) => ({ cardSpecies: id }));
  // 입력 중인 글자를 새로고침이 덮어쓰지 않게, 입력칸에 포커스가 없을 때만 값을 맞춘다.
  const input = $<HTMLInputElement>('pet-name');
  if (document.activeElement !== input) input.value = data.current.name;
  drawPreview();
}

async function change(patch: WardrobePatch): Promise<void> {
  $('lock-hint').textContent = '';
  data = await window.wardrobeApi.set(patch);
  render();
}

async function refresh(): Promise<void> {
  data = await window.wardrobeApi.get();
  render();
}

async function saveName(): Promise<void> {
  $('lock-hint').textContent = '';
  data = await window.wardrobeApi.set({ name: $<HTMLInputElement>('pet-name').value });
  render();
  // 저장했다는 걸 알 수 있게 창을 닫는다(펫이 바뀐 이름을 말풍선으로 알려 준다).
  window.wardrobeApi.close();
}

$('name-save').addEventListener('click', () => void saveName());
$('pet-name').addEventListener('keydown', (e) => {
  if ((e as KeyboardEvent).key === 'Enter') void saveName();
});
$('close').addEventListener('click', () => window.wardrobeApi.close());
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') window.wardrobeApi.close();
});
window.wardrobeApi.onRefresh(() => void refresh());
void startUiLocalization(window.wardrobeApi.lang?.bind(window.wardrobeApi));
void refresh();

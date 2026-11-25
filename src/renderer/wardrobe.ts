/**
 * 꾸미기 창: 친구(동물)·색·장식을 고르고 미리 본다.
 * 업적으로 아직 안 열린 것은 점선으로 보이고, 눌러도 바뀌지 않고 여는 방법을 알려 준다.
 * 실제로 적용할 수 있는지는 메인이 다시 검증한다.
 */
import { spriteSet, type Accessory, type SpeciesId, type Variant } from '../shared/species.js';
import type { WardrobeEntry, WardrobePatch, WardrobeView } from '../shared/wardrobe.js';

/** 메인이 stage(미리보기에 쓸 단계)를 덧붙여 준다. 알이면 새끼 모습으로 보여 준다. */
export interface WardrobeData extends WardrobeView {
  stage: 'baby' | 'adult';
}

interface WardrobeApi {
  get(): Promise<WardrobeData>;
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

const SCALE = 6;
let data: WardrobeData;

function drawPreview(): void {
  const canvas = $<HTMLCanvasElement>('preview');
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const { speciesId, variant, accessory } = data.current;
  const set = spriteSet(speciesId, data.stage, { variant, accessory });
  set.frames.idleA.forEach((row, y) => {
    [...row].forEach((ch, x) => {
      const color = ch === '.' ? undefined : set.palette[ch];
      if (!color) return;
      ctx.fillStyle = color;
      ctx.fillRect(x * SCALE, y * SCALE, SCALE, SCALE);
    });
  });
}

function group<T extends string>(boxId: string, entries: readonly WardrobeEntry<T>[], selected: T, patchOf: (id: T) => WardrobePatch): void {
  const box = $(boxId);
  box.textContent = '';
  for (const e of entries) {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = e.unlocked ? e.name : `🔒 ${e.name}`;
    b.dataset['id'] = e.id;
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
  group<SpeciesId>('species', data.species, data.current.speciesId, (id) => ({ speciesId: id }));
  group<Variant>('variants', data.variants, data.current.variant, (id) => ({ variant: id }));
  group<Accessory>('accessories', data.accessories, data.current.accessory, (id) => ({ accessory: id }));
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

$('close').addEventListener('click', () => window.wardrobeApi.close());
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') window.wardrobeApi.close();
});
window.wardrobeApi.onRefresh(() => void refresh());
void refresh();

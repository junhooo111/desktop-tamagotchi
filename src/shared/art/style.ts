/**
 * 꾸미기 스타일: 색 변형(variant)과 장식(accessory).
 * 색 변형은 몸 색(털·배·귀 안쪽·무늬·부리·머리)만 바꾸고, 윤곽선·눈·코는 그대로 둬서 얼굴이 알아보게 한다.
 */
import { mix, type Tone } from './color.js';
import { ACCESSORIES, ACCESSORY_COLORS, type Accessory } from './accessory.js';
import type { Look } from './types.js';

export type Variant = 'default' | 'pastel' | 'deep' | 'mono';

export const VARIANTS: readonly Variant[] = ['default', 'pastel', 'deep', 'mono'];

export interface PetStyle {
  variant: Variant;
  accessory: Accessory;
}

export const DEFAULT_STYLE: PetStyle = { variant: 'default', accessory: 'none' };

export const isVariant = (v: unknown): v is Variant => typeof v === 'string' && (VARIANTS as readonly string[]).includes(v);
export const isAccessory = (v: unknown): v is Accessory => typeof v === 'string' && (ACCESSORIES as readonly string[]).includes(v);

function gray(hex: string): string {
  const n = parseInt(hex.slice(1), 16);
  const v = Math.round(0.3 * ((n >> 16) & 255) + 0.59 * ((n >> 8) & 255) + 0.11 * (n & 255));
  const h = v.toString(16).padStart(2, '0');
  return `#${h}${h}${h}`;
}

/** 색 하나를 변형에 맞게 바꾼다. */
export function tintHex(hex: string, variant: Variant): string {
  switch (variant) {
    case 'pastel':
      return mix(hex, '#ffffff', 0.4);
    case 'deep':
      return mix(hex, '#2a1f33', 0.3);
    case 'mono':
      return mix(gray(hex), hex, 0.12); // 거의 회색, 원래 색기만 살짝 남긴다
    default:
      return hex;
  }
}

const tintTone = (t: Tone, v: Variant): Tone => ({ base: tintHex(t.base, v), dark: tintHex(t.dark, v), light: tintHex(t.light, v) });

/** 몸 색만 바꾼 새 Look. 'default' 면 그대로. */
export function tintLook(look: Look, variant: Variant): Look {
  if (variant === 'default') return look;
  return {
    ...look,
    fur: tintTone(look.fur, variant),
    belly: tintTone(look.belly, variant),
    inner: tintTone(look.inner, variant),
    accent: tintTone(look.accent, variant),
    beak: tintTone(look.beak, variant),
    head: tintTone(look.head, variant),
  };
}

/** 팔레트에 더할 장식 색(X, Y) */
export function accessoryPalette(acc: Accessory): Record<string, string> {
  return ACCESSORY_COLORS[acc];
}

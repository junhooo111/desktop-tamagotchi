/** 꾸미기 이름(한국어). 색은 "~ 색" 으로 부른다. */
import type { CosmeticKind } from './cosmetics.js';
import { ACCESSORY_NAMES, EFFECT_NAMES, NECK_NAMES, VARIANT_NAMES } from './wardrobe.js';

export function cosmeticName(kind: CosmeticKind, id: string): string {
  switch (kind) {
    case 'accessory':
      return (ACCESSORY_NAMES as Record<string, string>)[id] ?? id;
    case 'variant':
      return `${(VARIANT_NAMES as Record<string, string>)[id] ?? id} 색`;
    case 'neck':
      return (NECK_NAMES as Record<string, string>)[id] ?? id;
    case 'effect':
      return (EFFECT_NAMES as Record<string, string>)[id] ?? id;
  }
}

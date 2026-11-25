/** 색 계산: 기본색 하나에서 어두운 색(그림자)과 밝은 색(하이라이트)을 만든다. */

export interface Tone {
  base: string;
  dark: string;
  light: string;
}

function parse(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function toHex(rgb: [number, number, number]): string {
  return `#${rgb.map((v) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, '0')).join('')}`;
}

/** a 와 b 를 t(0~1) 비율로 섞는다. */
export function mix(a: string, b: string, t: number): string {
  const [ar, ag, ab] = parse(a);
  const [br, bg, bb] = parse(b);
  return toHex([ar + (br - ar) * t, ag + (bg - ag) * t, ab + (bb - ab) * t]);
}

/**
 * 기본색 하나로 3단 음영을 만든다.
 * 그림자는 검정이 아니라 보라빛 어두운 색과 섞어서 칙칙하지 않고 포근하게 보이게 한다.
 */
export function tone(base: string, opts: { shadow?: string; dark?: number; light?: number } = {}): Tone {
  const { shadow = '#5a3d7a', dark = 0.3, light = 0.4 } = opts;
  return { base, dark: mix(base, shadow, dark), light: mix(base, '#ffffff', light) };
}

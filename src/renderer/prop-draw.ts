/** 소품 그리기: 펫 창·옷장·뽑기 결과·경매장이 같은 그림을 쓴다. */
import { PROP_COLORS, propFrames, propRows, type Prop } from '../shared/art/props.js';

/** 소품 그림의 크기(칸 수) */
export function propSize(prop: Prop): { w: number; h: number } {
  const rows = propRows(prop);
  return { w: rows[0]?.length ?? 0, h: rows.length };
}

/** (x, y)에 소품을 unit 픽셀 크기의 칸으로 그린다. phase 는 움직임 두 장 중 어느 쪽인지(0 | 1). */
export function drawProp(ctx: CanvasRenderingContext2D, prop: Prop, x: number, y: number, unit: number, phase: 0 | 1 = 0): void {
  if (prop === 'none') return;
  const colors = PROP_COLORS[prop];
  (propFrames(prop)[phase] ?? propRows(prop)).forEach((row, ry) => {
    [...row].forEach((ch, rx) => {
      const color = ch === '.' ? undefined : colors[ch];
      if (!color) return;
      ctx.fillStyle = color;
      ctx.fillRect(Math.round(x + rx * unit), Math.round(y + ry * unit), unit, unit);
    });
  });
}

/** 캔버스 가운데에 소품만 크게 그린다(옷장 칸·경매장·뽑기 결과 미리보기). */
export function paintProp(canvas: HTMLCanvasElement, prop: Prop): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const { w, h } = propSize(prop);
  if (w === 0) return;
  const unit = Math.max(1, Math.floor(Math.min(canvas.width / (w + 2), canvas.height / (h + 2))));
  drawProp(ctx, prop, (canvas.width - w * unit) / 2, (canvas.height - h * unit) / 2, unit);
}

/** 절반 크기로 그린다(친구 펫 곁의 소품). 2x2 칸마다 먼저 보이는 색 하나를 쓴다. */
export function drawPropHalf(ctx: CanvasRenderingContext2D, prop: Prop, x: number, y: number, unit: number, phase: 0 | 1 = 0): void {
  if (prop === 'none') return;
  const colors = PROP_COLORS[prop];
  const rows = propFrames(prop)[phase] ?? propRows(prop);
  for (let ry = 0; ry < rows.length; ry += 2) {
    for (let rx = 0; rx < (rows[0]?.length ?? 0); rx += 2) {
      let ch = '.';
      for (const [dx, dy] of [[0, 0], [1, 0], [0, 1], [1, 1]] as const) {
        const got = rows[ry + dy]?.[rx + dx];
        if (got && got !== '.') {
          ch = got;
          break;
        }
      }
      const color = ch === '.' ? undefined : colors[ch];
      if (!color) continue;
      ctx.fillStyle = color;
      ctx.fillRect(Math.round(x + (rx / 2) * unit), Math.round(y + (ry / 2) * unit), unit, unit);
    }
  }
}

/** 소품 그리기: 펫 창·옷장·뽑기 결과·경매장이 같은 그림을 쓴다. */
import { PROP_COLORS, propRows, type Prop } from '../shared/art/props.js';

/** 소품 그림의 크기(칸 수) */
export function propSize(prop: Prop): { w: number; h: number } {
  const rows = propRows(prop);
  return { w: rows[0]?.length ?? 0, h: rows.length };
}

/** (x, y)에 소품을 unit 픽셀 크기의 칸으로 그린다. */
export function drawProp(ctx: CanvasRenderingContext2D, prop: Prop, x: number, y: number, unit: number): void {
  if (prop === 'none') return;
  const colors = PROP_COLORS[prop];
  propRows(prop).forEach((row, ry) => {
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

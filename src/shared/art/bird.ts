/**
 * 새(병아리·오리)를 그리는 뼈대. 둥글고 통통한 몸, 날개, 부리, 가는 다리.
 * 좌표는 네발 동물과 같은 "성체 설계 공간"(32x32, 오른쪽을 봄, 발바닥 줄 = 30)이고 새끼는 줄여서 그린다.
 */
import { blank, ellipse, line, markEllipse, part, px, rect, shift, toRows, triangle, type Grid } from '../pixel.js';
import { drawHangArms } from './hang-arms.js';
import { SHADE, type ArtStage, type EyePose, type Look, type Pose } from './types.js';

export interface BirdSpec {
  look: Look;
  kind: 'chick' | 'duck';
}

export type BirdShape = 'stand' | 'sit' | 'lie' | 'curl' | 'hang';

const GROUND = 30;
const CX = 16;

interface Rig {
  spec: BirdSpec;
  baby: boolean;
  size: number;
  headMod: number;
  X(x: number): number;
  Y(y: number): number;
}

function makeRig(spec: BirdSpec, stage: ArtStage): Rig {
  const baby = stage === 'baby';
  const size = baby ? 0.66 : 1;
  return {
    spec,
    baby,
    size,
    headMod: baby ? 1.18 : 1,
    X: (x) => CX + (x - CX) * size,
    Y: (y) => GROUND - (GROUND - y) * size,
  };
}

const lowered = (r: Rig, oy: number, ox = 0): Rig => ({ ...r, X: (x) => r.X(x) + ox, Y: (y) => r.Y(y) + oy });

/** 머리 색 문자: 오리는 초록 머리('g'), 병아리는 털색('f') */
const headChar = (r: Rig): string => (r.spec.kind === 'duck' ? 'g' : 'f');

function drawEye(g: Grid, ex0: number, ey0: number, kind: EyePose): void {
  // 눈은 2칸 격자에 맞춘다(그림을 16칸 굵기로 뭉칠 때 눈이 한 덩어리로 남도록)
  const ex = ex0 - (ex0 & 1);
  const ey = ey0 - (ey0 & 1);
  switch (kind) {
    // 반짝임 없는 까만 콩 눈(세세하게 그리면 오히려 덜 귀여웠다)
    case 'open':
      rect(g, ex, ey + 1, 2, 2, 'e');
      break;
    case 'wide':
      rect(g, ex - 1, ey, 3, 4, 'e');
      break;
    case 'closed':
      rect(g, ex, ey + 2, 3, 1, 'e');
      px(g, ex, ey + 1, 'e');
      px(g, ex + 2, ey + 1, 'e');
      break;
    case 'happy':
      px(g, ex, ey + 3, 'e');
      px(g, ex + 1, ey + 2, 'e');
      px(g, ex + 2, ey + 3, 'e');
      break;
    case 'sleepy':
      rect(g, ex, ey + 1, 3, 1, 'e');
      rect(g, ex, ey + 2, 3, 2, 'e');
      break;
    case 'dizzy':
      px(g, ex, ey + 1, 'e');
      px(g, ex + 1, ey + 2, 'e');
      px(g, ex + 2, ey + 3, 'e');
      px(g, ex + 2, ey + 1, 'e');
      px(g, ex, ey + 3, 'e');
      break;
  }
}

/** 부리: 닫힌 부리 하나 또는, 벌린 부리 둘(사이에 혀). 오리는 넓적하다. */
function drawBeak(g: Grid, r: Rig, bx: number, by: number, open: boolean): void {
  const wide = r.spec.kind === 'duck';
  const len = (wide ? 5 : 4) * Math.max(r.size, 0.85);
  const hgt = (wide ? 4 : 3.6) * Math.max(r.size, 0.85);
  if (!open) {
    part(g, (t) => triangle(t, bx, by - hgt / 2, bx, by + hgt / 2, bx + len, by + hgt * 0.15, 'p'), { outline: 'k', shade: SHADE });
    return;
  }
  part(g, (t) => triangle(t, bx, by - hgt / 2 - 0.4, bx, by + 0.4, bx + len, by - hgt * 0.1, 'p'), { outline: 'k', shade: SHADE });
  part(g, (t) => triangle(t, bx, by + 1.6, bx, by + hgt / 2 + 1.8, bx + len * 0.8, by + 2.4, 'P'), { outline: 'k' });
  px(g, bx + 1, by + 1, 't');
}

function drawLegs(g: Grid, r: Rig, pose: Pose, hidden: boolean): void {
  if (hidden) return;
  const pairs = [
    [pose.legs.bn, 12.2],
    [pose.legs.fn, 17.4],
  ] as const;
  for (const [l, x] of pairs) {
    const lx = Math.round(r.X(x) + l.dx * r.size);
    const top = Math.round(r.Y(26.5) + pose.crouch * r.size);
    const bottom = GROUND - Math.round(l.lift * r.size);
    part(
      g,
      (t) => {
        rect(t, lx, top, 2, Math.max(1, bottom - top + 1), 'p');
        rect(t, lx - 1, bottom, 5, 1, 'p'); // 발가락
      },
      { outline: 'k' },
    );
  }
}

function drawWing(g: Grid, r: Rig, pose: Pose, cx: number, cy: number): void {
  const w = pose.wing;
  part(
    g,
    (t) => {
      if (w <= 0) {
        ellipse(t, cx, cy, (r.spec.kind === 'duck' ? 5.4 : 4.6) * r.size, 3.5 * r.size, 'a');
      } else {
        // 날개를 위로 들어 올린다: 어깨에서 위·뒤쪽으로 뻗는 굵은 선
        const reach = w >= 2 ? 11 : 6;
        line(t, cx + 2 * r.size, cy - 1 * r.size, cx - 4 * r.size, cy - reach * r.size, 'a', 4.6 * r.size);
        ellipse(t, cx - 4 * r.size, cy - reach * r.size, 2.4 * r.size, 2.8 * r.size, 'a');
      }
    },
    { outline: 'k', shade: SHADE },
  );
}

function drawFace(g: Grid, r: Rig, pose: Pose, head: { cx: number; cy: number; rx: number; ry: number }): void {
  const ex = Math.round(head.cx + head.rx * 0.22);
  const ey = Math.round(head.cy - head.ry * 0.25);
  drawEye(g, ex, ey, pose.eyes);
  drawBeak(g, r, Math.round(head.cx + head.rx * 0.96), Math.round(head.cy + head.ry * 0.12), pose.mouth === 'open' || pose.mouth === 'chew');
}

function drawHead(g: Grid, r: Rig, pose: Pose): { cx: number; cy: number; rx: number; ry: number } {
  const k = r.size * r.headMod;
  const head = { cx: r.X(20.6) + pose.headDx * r.size, cy: r.Y(14.2) + pose.headDy * r.size, rx: 6.9 * k, ry: 6.3 * k };
  // 오리: 머리와 몸을 잇는 목
  if (r.spec.kind === 'duck') {
    part(g, (t) => ellipse(t, head.cx - 1.5 * k, head.cy + 4.4 * k, 4.4 * k, 4.6 * k, 'g'), { outline: 'k', shade: SHADE });
  }
  const hc = headChar(r);
  part(
    g,
    (t) => {
      ellipse(t, head.cx, head.cy, head.rx, head.ry, hc);
      if (r.spec.kind === 'chick') {
        markEllipse(t, head.cx + head.rx * 0.2, head.cy + head.ry * 0.55, head.rx * 0.7, head.ry * 0.4, 'b');
      }
    },
    { outline: 'k', shade: SHADE },
  );
  // 병아리: 머리 위 솜털
  if (r.spec.kind === 'chick') {
    for (const [dx, h] of [[0.4, 4]] as const) {
      part(g, (t) => triangle(t, head.cx + dx * k - 1.4, head.cy - head.ry + 1.4, head.cx + dx * k + 1.4, head.cy - head.ry + 1.4, head.cx + dx * k, head.cy - head.ry - h * k + 1, 'f'), { outline: 'k', shade: SHADE });
    }
    // 솜털이 머리와 이어지도록 머리 윗선을 다시 채운다
    part(g, (t) => ellipse(t, head.cx, head.cy, head.rx, head.ry, 'f'), { outline: null, shade: SHADE });
  }
  drawFace(g, r, pose, head);
  return head;
}

function drawBody(g: Grid, r: Rig, cx: number, cy: number, rx: number, ry: number): void {
  part(
    g,
    (t) => {
      ellipse(t, cx, cy, rx, ry, 'f');
      markEllipse(t, cx + rx * 0.25, cy + ry * 0.6, rx * 0.75, ry * 0.5, 'b');
    },
    { outline: 'k', shade: SHADE },
  );
  void r;
}

function drawTail(g: Grid, r: Rig, cx: number, cy: number, up: number): void {
  const k = r.size;
  const duck = r.spec.kind === 'duck';
  part(
    g,
    (t) => {
      if (duck) triangle(t, cx + 2 * k, cy - 1.8 * k, cx + 2 * k, cy + 4.6 * k, cx - 3.6 * k, cy - (2.6 + up) * k, 'f');
      else triangle(t, cx + 2 * k, cy - 1.2 * k, cx + 2 * k, cy + 4.4 * k, cx - 3.4 * k, cy - (1.2 + up) * k, 'f');
    },
    { outline: 'k', shade: SHADE },
  );
}

// ---- 자세 ----

function standing(r: Rig, pose: Pose): Grid {
  const g = blank();
  const rb = lowered(r, pose.crouch * r.size, pose.sway * r.size);
  const duck = r.spec.kind === 'duck';
  drawLegs(g, r, pose, false);
  drawTail(g, rb, rb.X(5.4), rb.Y(duck ? 19.8 : 18.6), pose.tailAngle > 60 ? 2 : 0);
  drawBody(g, rb, rb.X(14.2), rb.Y(21.4), (duck ? 9.8 : 9.2) * r.size * (r.baby ? 0.95 : 1), (duck ? 6.9 : 7.4) * r.size * (r.baby ? 0.95 : 1));
  drawWing(g, rb, pose, rb.X(12.2), rb.Y(21.4));
  drawHead(g, rb, pose);
  return pose.dy === 0 ? g : shift(g, 0, pose.dy);
}

/** 앉아서 품는 자세: 다리가 몸에 가려지고 몸이 낮다. */
function sitting(r: Rig, pose: Pose): Grid {
  const g = blank();
  const rb = lowered(r, 0, 0);
  const duck = r.spec.kind === 'duck';
  drawTail(g, rb, rb.X(5.2), rb.Y(24), pose.tailAngle > 60 ? 2 : 0);
  drawBody(g, rb, rb.X(14.4), rb.Y(24.6), (duck ? 10.2 : 9.8) * r.size, (duck ? 5.6 : 6) * r.size);
  drawWing(g, rb, { ...pose, wing: 0 }, rb.X(12.4), rb.Y(24.6));
  // 앉은 자세의 머리는 조금 낮다
  const lowerPose = { ...pose, headDy: pose.headDy + 3 };
  drawHead(g, rb, lowerPose);
  return g;
}

/** 엎드려 자는 자세: 공처럼 둥글게 웅크리고 머리를 몸에 묻는다. */
function lying(r: Rig, pose: Pose): Grid {
  const g = blank();
  const duck = r.spec.kind === 'duck';
  const breath = pose.stretch;
  drawTail(g, r, r.X(5), r.Y(26), 0);
  drawBody(g, r, r.X(14.8), r.Y(25.4 - breath * 0.4), (10.2 + breath * 0.4) * r.size, (5.8 + breath * 0.5) * r.size);
  drawWing(g, r, { ...pose, wing: 0 }, r.X(12.6), r.Y(25.2));
  const head = { cx: r.X(22), cy: r.Y(24), rx: 5.4 * r.size * r.headMod, ry: 4.8 * r.size * r.headMod };
  part(g, (t) => ellipse(t, head.cx, head.cy, head.rx, head.ry, duck ? 'g' : 'f'), { outline: 'k', shade: SHADE });
  const ex = Math.round(head.cx + head.rx * 0.2);
  drawEye(g, ex, Math.round(head.cy - 1.4), pose.eyes);
  drawBeak(g, r, Math.round(head.cx + head.rx * 0.95), Math.round(head.cy + 0.6), false);
  return g;
}

function curled(r: Rig, pose: Pose): Grid {
  const g = blank();
  const duck = r.spec.kind === 'duck';
  drawTail(g, r, r.X(6), r.Y(24), 1);
  part(
    g,
    (t) => {
      ellipse(t, r.X(15.4), r.Y(21.6), 9.6 * r.size, 8.6 * r.size, 'f');
      markEllipse(t, r.X(15), r.Y(26), 6 * r.size, 3.4 * r.size, 'b');
    },
    { outline: 'k', shade: SHADE },
  );
  drawWing(g, r, { ...pose, wing: 0 }, r.X(11.8), r.Y(22));
  const head = { cx: r.X(19.8), cy: r.Y(16.4), rx: 6.3 * r.size * r.headMod, ry: 5.7 * r.size * r.headMod };
  part(g, (t) => ellipse(t, head.cx, head.cy, head.rx, head.ry, duck ? 'g' : 'f'), { outline: 'k', shade: SHADE });
  drawFace(g, r, { ...pose, mouth: 'none' }, head);
  return g;
}

/** 정면으로 한쪽 날개로 매달린 자세 */
function hanging(r: Rig, pose: Pose): Grid {
  const g = blank();
  const sz = r.size;
  const k = sz * r.headMod;
  const drop = r.baby ? 3 : 0; // 새끼는 몸이 작아서 팔이 보일 만큼 전체를 조금 내린다
  const Yh = (y: number): number => y * sz + drop;
  const hx = CX;
  const hy = Yh(13);
  const hrx = 7.4 * k;
  const hry = 6.6 * k;
  const swing = pose.legs.bf.dx;
  const duck = r.spec.kind === 'duck';

  // 발(대롱대롱)
  for (const sx of [-1, 1]) {
    const dx = sx * 2.6 * sz + (sx < 0 ? swing : -swing) * 0.6;
    part(g, (t) => rect(t, Math.round(hx + dx - 1), Math.round(Yh(27)), 3, 2, 'p'), { outline: 'k' });
  }
  // 몸통
  part(
    g,
    (t) => {
      ellipse(t, hx, Yh(21.6), 6.4 * sz, 6.4 * sz, 'f');
      markEllipse(t, hx, Yh(23), 3.6 * sz, 4.2 * sz, 'b');
    },
    { outline: 'k', shade: SHADE },
  );
  // 두 날개(팔): 만세 하듯 머리 바깥으로 들어 올려 마우스 포인터 양옆을 붙잡는다
  drawHangArms(g, { cx: hx, reach: Math.max(hrx, 6.4 * sz) + 1.8, shoulderY: Yh(18.5), arm: 'a', hand: 'b', scale: sz, sway: swing });
  // 머리
  part(g, (t) => ellipse(t, hx, hy, hrx, hry, duck ? 'g' : 'f'), { outline: 'k', shade: SHADE });
  if (!duck) {
    for (const dx of [0]) {
      part(g, (t) => triangle(t, hx + dx - 1.2, hy - hry + 1.2, hx + dx + 1.2, hy - hry + 1.2, hx + dx, hy - hry - 2.6, 'f'), { outline: null });
    }
  }
  const ey = Math.round(hy - hry * 0.25);
  drawEye(g, Math.round(hx - 4.6 * k * 0.9), ey, pose.eyes);
  drawEye(g, Math.round(hx + 1.8 * k * 0.9), ey, pose.eyes);
  // 정면 부리
  part(g, (t) => ellipse(t, hx, Math.round(hy + hry * 0.3), 2.4 * Math.max(sz, 0.85), 1.6 * Math.max(sz, 0.85), 'p'), { outline: 'k', shade: SHADE });
  return g;
}

export function renderBirdShape(spec: BirdSpec, stage: ArtStage, shape: BirdShape, pose: Pose): string[] {
  const rig = makeRig(spec, stage);
  const grid =
    shape === 'stand'
      ? standing(rig, pose)
      : shape === 'sit'
        ? sitting(rig, pose)
        : shape === 'lie'
          ? lying(rig, pose)
          : shape === 'curl'
            ? curled(rig, pose)
            : hanging(rig, pose);
  return toRows(grid);
}

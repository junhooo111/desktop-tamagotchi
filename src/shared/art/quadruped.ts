/**
 * 네발 동물(고양이·강아지·토끼·거북이)을 그리는 뼈대.
 *
 * 좌표는 "성체 설계 공간"(32x32, 오른쪽을 봄, 발바닥 줄 = 30)으로 적고,
 * 새끼는 같은 설계를 줄이고(size) 머리를 키우고(headMod) 다리를 짧게(legMod) 변형해서 그린다.
 * 그래서 새끼는 성체를 그냥 줄인 것이 아니라 머리가 크고 다리가 짧은 아기 비율이 된다.
 *
 * 자세(shape): stand 서기 · sit 앉기 · lie 엎드리기 · curl 공처럼 말기 · hang 정면으로 매달리기
 */
import { blank, ellipse, line, markEllipse, part, px, rect, shift, toRows, triangle, type Grid } from '../pixel.js';
import { drawBackWings, drawHeadAccessory, type Accessory } from './accessory.js';
import { drawHangArms } from './hang-arms.js';
import { SHADE, type ArtStage, type EyePose, type Look, type MouthPose, type Pose } from './types.js';

export interface HeadDims {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
}

export interface QuadSpec {
  look: Look;
  ears: 'cat' | 'dog' | 'rabbit' | 'round' | 'none';
  tail: 'cat' | 'dog' | 'rabbit' | 'turtle' | 'none';
  /** 강아지의 긴 주둥이 */
  snout: boolean;
  whiskers: boolean;
  stripes: boolean;
  /** 강아지의 등 무늬 */
  patch: boolean;
  /** 거북이의 등딱지 */
  shell: boolean;
  /** 토끼의 통통한 뒷다리 */
  haunch: boolean;
  /** 발끝이 밝은 양말 무늬 */
  socks: boolean;
  /** 설계 공간의 머리 위치·크기(기본: 고양이형) */
  head?: HeadDims;
  /** 옆모습에서 눈이 머리 중심에서 앞쪽으로 떨어진 정도(머리 반폭 대비, 기본 0.28). 작을수록 눈이 뒤로 가서 얼굴이 여유로워진다. */
  eyeAt?: number;
  /** 몸 크기 보정(거북이는 넓고 납작하다) */
  bodyScale?: { rx: number; ry: number };
  /** 꾸미기 장식(리본·안경·왕관·날개) */
  accessory?: Accessory;
  /** 볼이 빵빵한 얼굴(햄스터) */
  cheeks?: boolean;
  /** 다리 길이 배율(기본 1, 거북이 0.62). 작을수록 짧은 다리 */
  legScale?: number;
}

const GROUND = 30;
const CX = 16;
const DEFAULT_HEAD: HeadDims = { cx: 21.2, cy: 13.6, rx: 6.6, ry: 6.1 };
const BODY = { cx: 12.5, cy: 20.5, rx: 8.4, ry: 5.2 };

interface Rig {
  spec: QuadSpec;
  baby: boolean;
  size: number;
  headMod: number;
  legMod: number;
  X(x: number): number;
  Y(y: number): number;
}

function makeRig(spec: QuadSpec, stage: ArtStage): Rig {
  const baby = stage === 'baby';
  const size = baby ? 0.64 : 1;
  return {
    spec,
    baby,
    size,
    headMod: baby ? 1.22 : 1,
    legMod: baby ? 0.8 : 1,
    X: (x) => CX + (x - CX) * size,
    Y: (y) => GROUND - (GROUND - y) * size,
  };
}

/** 몸통·머리·꼬리만 oy 칸 아래로 내린 틀(웅크리기). 다리는 원래 틀을 쓴다. */
const lowered = (r: Rig, oy: number): Rig => ({ ...r, Y: (y) => r.Y(y) + oy });

const rad = (deg: number): number => (deg * Math.PI) / 180;
const headOf = (spec: QuadSpec): HeadDims => spec.head ?? DEFAULT_HEAD;

// ---- 부품 ----

/** 다리 하나. x 는 설계 공간의 왼쪽 칸. far 면 그림자 색으로 칠한다. crouch 는 웅크린 만큼 다리가 짧아지는 칸 수. */
function drawLeg(
  g: Grid,
  r: Rig,
  x: number,
  topY: number,
  w: number,
  l: { dx: number; lift: number },
  far: boolean,
  crouch: number,
): void {
  const stub = r.spec.legScale ?? (r.spec.shell ? 0.62 : 1);
  const left = Math.round(r.X(x) + l.dx * r.size);
  const top = Math.round(GROUND - (GROUND - r.Y(topY) - crouch * r.size) * r.legMod * stub);
  const bottom = GROUND - Math.round(l.lift * r.size);
  const width = Math.max(2, Math.round(w * r.size * (r.spec.shell ? 1.25 : 1)));
  const h = Math.max(1, bottom - top + 1);
  part(
    g,
    (t) => {
      const shade = far && r.spec.legScale === undefined;
      rect(t, left, top, width, h, shade ? 'F' : 'f');
      rect(t, left + width, bottom, 1, 1, shade ? 'F' : 'f'); // 발끝이 앞으로 살짝 나온다
      if (r.spec.socks && h > 3) rect(t, left, bottom - 1, width + 1, 2, far ? 'B' : 'b'); // 양말
    },
    { outline: 'k', shade: far ? undefined : SHADE },
  );
}

/** 꼬리: 뿌리에서 시작해 세 마디로 휜다. */
function drawTail(g: Grid, r: Rig, pose: Pose, root: { x: number; y: number }): void {
  const { tail } = r.spec;
  if (tail === 'none') return;
  const rx = r.X(root.x);
  const ry = r.Y(root.y);
  if (tail === 'rabbit') {
    part(g, (t) => ellipse(t, rx - 1, ry + 1, 3 * r.size + 0.5, 3 * r.size, 'h'), { outline: 'k' });
    return;
  }
  if (tail === 'turtle') {
    part(g, (t) => triangle(t, rx, ry - 1, rx, ry + 2.5, rx - 4.5 * r.size - 1, ry + 2.5, 'f'), { outline: 'k', shade: SHADE });
    return;
  }
  const len = (tail === 'cat' ? 4 : 3.2) * r.size;
  const thick = (tail === 'cat' ? 4.3 : 3.4) * Math.max(r.size, 0.85); // 고양이 꼬리는 철사처럼 보이지 않게 통통하게
  const pts: [number, number][] = [[rx, ry]];
  let ang = 180 - pose.tailAngle; // 0도 = 오른쪽, 180도 = 왼쪽(뒤)
  for (let i = 0; i < 3; i++) {
    const [x0, y0] = pts[pts.length - 1] as [number, number];
    pts.push([x0 + Math.cos(rad(ang)) * len, y0 - Math.sin(rad(ang)) * len]);
    ang -= pose.tailCurl * (tail === 'cat' ? 0.9 : 0.4);
  }
  part(
    g,
    (t) => {
      for (let i = 0; i < pts.length - 1; i++) {
        const a = pts[i] as [number, number];
        const b = pts[i + 1] as [number, number];
        line(t, a[0], a[1], b[0], b[1], 'f', thick);
      }
    },
    { outline: 'k', shade: SHADE },
  );
}

/** 귀. 머리보다 먼저 그려서 머리가 귀 밑동을 덮는다. */
function drawEars(g: Grid, r: Rig, pose: Pose, head: HeadDims): void {
  const { ears } = r.spec;
  if (ears === 'none' || ears === 'dog') return;
  const top = head.cy - head.ry;
  const k = r.size * r.headMod;

  if (ears === 'round') {
    // 햄스터: 머리 위에 작고 동그란 귀 둘
    const e = head.rx / 6.6;
    const lift = pose.ears === 'back' ? 1.4 : 0;
    for (const dx of [-4.4 * e, 3.4 * e]) {
      part(g, (t) => ellipse(t, head.cx + dx, top + 1.6 * e + lift, 3.2 * e, 3.2 * e, 'a'), { outline: 'k', shade: SHADE });
    }
    return;
  }

  if (ears === 'cat') {
    const e = head.rx / 6.6; // 머리가 클수록 귀도 같이 커진다
    // 귀는 넓은 밑변에 짧은 삼각형이어야 고양이답다(길고 좁으면 여우·토끼처럼 보인다)
    const tipUp = pose.ears === 'up' ? 5 : pose.ears === 'back' ? 2.6 : 2;
    const lean = pose.ears === 'back' ? -2.8 : pose.ears === 'down' ? -1.4 : 0;
    const ear = (bx: number): void => {
      part(
        g,
        (t) => {
          // 먼 쪽 귀도 같은 털색·같은 안쪽색으로 칠한다(그림자색을 쓰면 다른 색 귀가 붙은 것처럼 보였다)
          triangle(t, bx - 3.8 * e, top + 2.8 * e, bx + 3.8 * e, top + 2.8 * e, bx + lean * e + 0.2, top - tipUp * e, 'f');
        },
        { outline: 'k', shade: SHADE },
      );
    };
    ear(head.cx - 3.9 * e);
    ear(head.cx + 3.6 * e);
    return;
  }

  // 토끼: 긴 귀
  const spread = pose.ears === 'up' ? 0 : pose.ears === 'back' ? -8 : -4;
  const high = pose.ears === 'down' ? 0.55 : 1;
  const ear = (bx: number, far: boolean): void => {
    const tx = bx + (spread - (far ? 1.6 : 0)) * k * 0.7;
    const ty = top - 8.4 * k * high + (pose.ears === 'back' ? 6 * k : 0);
    part(
      g,
      (t) => {
        line(t, bx, top + 3 * k, tx, ty, far ? 'F' : 'f', 3.8 * k);
      },
      { outline: 'k', shade: far ? undefined : SHADE },
    );
  };
  ear(head.cx - 2.8 * k, true);
  ear(head.cx + 1.2 * k, false);
}

/** 강아지의 늘어진 귀: 머리 위에 얹는다(머리 다음에 그린다). */
function drawDogEars(g: Grid, r: Rig, pose: Pose, head: HeadDims): void {
  const k = r.size * r.headMod;
  const top = head.cy - head.ry;
  const lift = pose.ears === 'up' ? -1.8 : pose.ears === 'back' ? 0.8 : 0;
  const back = pose.ears === 'back' ? -1.8 : 0;
  // 먼 쪽 귀: 머리 위로 살짝 삐죽
  part(g, (t) => triangle(t, head.cx - 1.2 * k, top + 2 * k, head.cx + 3.4 * k, top + 2.6 * k, head.cx + 2.4 * k, top - 2.2 * k, 'A'), { outline: 'k' });
  // 가까운 쪽 귀: 늘어진 타원
  part(g, (t) => ellipse(t, head.cx - 2.9 * k + back, head.cy + 0.3 * k + lift, 2.5 * k, 4.4 * k, 'a'), { outline: 'k', shade: SHADE });
}

function drawEye(g: Grid, ex0: number, ey0: number, kind: EyePose, _small: boolean): void {
  // 눈은 2칸 격자에 맞춘다(그림을 16칸 굵기로 뭉칠 때 눈이 한 덩어리로 남도록)
  const ex = ex0 - (ex0 & 1);
  const ey = ey0 - (ey0 & 1);
  // 눈은 반짝임 없는 까만 점이다(콩 모양). 세세하게 그리면 오히려 덜 귀여웠다.
  const w = 2;
  const h = 2;
  switch (kind) {
    case 'open':
      rect(g, ex, ey, w, h, 'e');
      break;
    case 'wide':
      rect(g, ex - 1, ey - 1, w + 1, h + 1, 'e');
      break;
    case 'closed':
      rect(g, ex, ey + h - 2, w, 1, 'e');
      px(g, ex - 0, ey + h - 3, 'e');
      px(g, ex + w - 1, ey + h - 3, 'e');
      break;
    case 'happy':
      px(g, ex, ey + h - 1, 'e');
      px(g, ex + 1, ey + h - 2, 'e');
      px(g, ex + 2, ey + h - 1, 'e');
      break;
    case 'sleepy':
      rect(g, ex, ey + 1, w, 1, 'e');
      rect(g, ex, ey + 2, w, h - 2, 'e');
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

function drawMouth(g: Grid, nx: number, ny: number, kind: MouthPose): void {
  switch (kind) {
    case 'none':
      break;
    case 'smile':
      px(g, nx - 1, ny + 2, 'm');
      px(g, nx - 2, ny + 3, 'm');
      px(g, nx - 3, ny + 2, 'm');
      break;
    case 'open':
      rect(g, nx - 3, ny + 2, 3, 3, 'm');
      rect(g, nx - 3, ny + 4, 3, 1, 't');
      break;
    case 'chew':
      rect(g, nx - 3, ny + 2, 3, 2, 'm');
      px(g, nx - 2, ny + 3, 't');
      break;
  }
}

/** 옆모습 머리와 얼굴. */
function drawHead(g: Grid, r: Rig, pose: Pose, hc: HeadDims): void {
  const spec = r.spec;
  const k = r.size * r.headMod;
  const head: HeadDims = {
    cx: r.X(hc.cx) + pose.headDx * r.size,
    cy: r.Y(hc.cy) + pose.headDy * r.size,
    rx: hc.rx * k,
    ry: hc.ry * k,
  };
  const small = head.ry < 4.6;

  drawEars(g, r, pose, head);
  part(
    g,
    (t) => {
      ellipse(t, head.cx, head.cy, head.rx, head.ry, 'f');
      // 햄스터: 아래쪽 양옆이 불룩한 볼
      if (spec.cheeks) ellipse(t, head.cx + head.rx * 0.1, head.cy + head.ry * 0.5, head.rx * 1.02, head.ry * 0.62, 'f');
      if (spec.snout) ellipse(t, head.cx + head.rx * 0.78, head.cy + head.ry * 0.3, head.rx * 0.52, head.ry * 0.42, 'f');
      markEllipse(t, head.cx + head.rx * 0.5, head.cy + head.ry * 0.55, head.rx * 0.5, head.ry * 0.4, 'b');
    },
    { outline: 'k', shade: SHADE },
  );
  if (spec.ears === 'dog') drawDogEars(g, r, pose, head);

  const eyeX = Math.round(head.cx + head.rx * (spec.eyeAt ?? 0.28));
  const eyeY = Math.round(head.cy - head.ry * 0.2);
  const noseX = Math.round(head.cx + head.rx * (spec.snout ? 1.3 : 0.88));
  const noseY = Math.round(head.cy + head.ry * (spec.snout ? 0.08 : 0.18));

  drawEye(g, eyeX, eyeY, pose.eyes, small);
  rect(g, noseX - 1, noseY, 2, 2, 'n');
  drawMouth(g, noseX, noseY, pose.mouth);
  drawHeadAccessory(g, spec.accessory, head, [{ x: eyeX, y: eyeY }]);

  if (spec.whiskers) {
    // 짧은 수염 두 가닥(코를 가리지 않게 코보다 뒤쪽 볼에서 시작)
    line(g, noseX - 3, noseY + 3, noseX, noseY + 4, 'k');
    line(g, noseX - 3, noseY + 1, noseX - 1, noseY - 1, 'k');
  }
}

/** 몸통: 타원 + 배 + 무늬. */
function drawBody(g: Grid, r: Rig, pose: Pose): void {
  const { spec } = r;
  const m = spec.bodyScale ?? { rx: 1, ry: 1 };
  const cx = r.X(BODY.cx - pose.stretch * 1.2);
  const cy = r.Y(BODY.cy);
  const rx = (BODY.rx + pose.stretch * 1.8) * r.size * m.rx * (r.baby ? 0.92 : 1);
  const ry = BODY.ry * r.size * m.ry * (r.baby ? 0.95 : 1);
  part(
    g,
    (t) => {
      ellipse(t, cx, cy, rx, ry, spec.shell ? 'a' : 'f');
      if (spec.shell) {
        markEllipse(t, cx, cy - ry * 0.15, rx * 0.5, ry * 0.5, 'A');
        markEllipse(t, cx, cy + ry * 0.66, rx * 0.9, ry * 0.3, 'b');
      } else {
        markEllipse(t, cx + rx * 0.12, cy + ry * 0.62, rx * 0.86, ry * 0.5, 'b');
        if (spec.stripes) {
          for (let i = -1; i <= 1; i++) rect(t, Math.round(cx - rx * 0.1 + i * 3 * r.size), Math.round(cy - ry), 1, Math.max(2, Math.round(ry * 0.6)), 'a');
        }
        if (spec.patch) markEllipse(t, cx - rx * 0.25, cy - ry * 0.45, rx * 0.5, ry * 0.5, 'a');
      }
    },
    { outline: 'k', shade: SHADE },
  );
}

// ---- 자세별 그림 ----

/** 서 있는 자세(걷기·뛰기·점프·알림 등 대부분) */
function standing(r: Rig, pose: Pose): Grid {
  const g = blank();
  const { spec } = r;
  const m = spec.bodyScale ?? { rx: 1, ry: 1 };
  const rb = lowered(r, pose.crouch * r.size);
  const legTop = BODY.cy + BODY.ry * m.ry - 2;
  const s = pose.stretch;
  const c = pose.crouch;

  drawLeg(g, r, 14.6 + s * 1.2, legTop, 3, pose.legs.ff, true, c);
  drawLeg(g, r, 10.2 - s * 1.2, legTop, 3, pose.legs.bf, true, c);
  drawTail(g, rb, pose, { x: BODY.cx - BODY.rx * m.rx + 1 - s * 1.2, y: BODY.cy - 1.5 });
  drawBody(g, rb, pose);
  drawBackWings(g, spec.accessory, r.X(BODY.cx - s * 1.2) - 1, rb.Y(BODY.cy) - BODY.ry * m.ry * r.size + 1, r.size);
  if (spec.haunch) {
    part(
      g,
      (t) => ellipse(t, r.X(8.4 - s * 1.2) + pose.legs.bn.dx * r.size, rb.Y(23.6) - pose.legs.bn.lift * r.size, 4.6 * r.size, 4.4 * r.size, 'f'),
      { outline: 'k', shade: SHADE },
    );
  }
  drawLeg(g, r, 18.8 + s * 1.2, legTop, 3, pose.legs.fn, false, c);
  if (!spec.haunch) {
    drawLeg(g, r, 6.4 - s * 1.2, legTop, 3, pose.legs.bn, false, c);
  } else {
    part(
      g,
      (t) => ellipse(t, r.X(9.4 - s * 1.2) + pose.legs.bn.dx * r.size, GROUND - pose.legs.bn.lift * r.size - 1, 3.8 * r.size, 1.6 * r.size, 'f'),
      { outline: 'k', shade: SHADE },
    );
  }
  const h = headOf(spec);
  drawHead(g, rb, pose, { ...h, cx: h.cx + s * 1.2 });
  return pose.dy === 0 ? g : shift(g, 0, pose.dy);
}

/** 앉은 자세(앉기·졸기). headDy 로 고개를 숙인다. */
function sitting(r: Rig, pose: Pose): Grid {
  if (r.spec.shell) return standing(r, { ...pose, crouch: 2, legs: { ff: { dx: 0, lift: 0 }, fn: { dx: 0, lift: 0 }, bf: { dx: 0, lift: 0 }, bn: { dx: 0, lift: 0 } } });
  const g = blank();
  const { spec } = r;
  drawTail(g, r, { ...pose, tailAngle: pose.tailAngle - 25 }, { x: 7, y: 27.2 });

  part(g, (t) => rect(t, r.X(15.2), r.Y(22), Math.max(2, 3 * r.size), GROUND - r.Y(22), 'F'), { outline: 'k' });
  part(
    g,
    (t) => {
      ellipse(t, r.X(13), r.Y(21.5), 6.2 * r.size, 8 * r.size, 'f');
      markEllipse(t, r.X(15), r.Y(24), 3.2 * r.size, 5 * r.size, 'b');
      if (spec.stripes) for (let i = 0; i < 3; i++) rect(t, r.X(8.5 + i * 2.2), r.Y(14.5 + i * 0.2), 1, 3 * r.size, 'a');
      if (spec.patch) markEllipse(t, r.X(10), r.Y(17), 3 * r.size, 3.4 * r.size, 'a');
    },
    { outline: 'k', shade: SHADE },
  );
  drawBackWings(g, spec.accessory, r.X(11), r.Y(21.5) - 8 * r.size + 3, r.size);
  part(g, (t) => ellipse(t, r.X(10.6), r.Y(26.4), 5 * r.size, 3.6 * r.size, 'f'), { outline: 'k', shade: SHADE });
  part(g, (t) => ellipse(t, r.X(16.4), r.Y(29.2), 3.2 * r.size, 1.5 * r.size, 'f'), { outline: 'k', shade: SHADE });
  part(g, (t) => rect(t, r.X(18.2), r.Y(21.5), Math.max(2, 3 * r.size), GROUND - r.Y(21.5), 'f'), { outline: 'k', shade: SHADE });
  const h = headOf(spec);
  drawHead(g, r, pose, { ...h, cx: h.cx - 2, cy: h.cy - 1.4 });
  return pose.dy === 0 ? g : shift(g, 0, pose.dy);
}

/** 엎드린 자세(자기) */
function lying(r: Rig, pose: Pose): Grid {
  const g = blank();
  const { spec } = r;
  const breath = pose.stretch;
  if (spec.shell) {
    // 거북이: 납작한 등딱지, 머리는 빼꼼
    drawTail(g, r, pose, { x: 4.8, y: 27 });
    part(
      g,
      (t) => {
        ellipse(t, r.X(13.5), r.Y(26.6 - breath * 0.4), (10.4 + breath * 0.4) * r.size, (4.6 + breath * 0.5) * r.size, 'a');
        markEllipse(t, r.X(13.5), r.Y(25), 5 * r.size, 2.2 * r.size, 'A');
      },
      { outline: 'k', shade: SHADE },
    );
    drawHead(g, r, { ...pose, headDx: 0, headDy: 0 }, { cx: 23.4, cy: 27.4, rx: 3.6, ry: 3.2 });
    return g;
  }
  drawTail(g, r, { ...pose, tailAngle: 8, tailCurl: -10 }, { x: 4.5, y: 26.6 });
  part(
    g,
    (t) => {
      ellipse(t, r.X(13.2), r.Y(25.2 - breath * 0.4), (10 + breath * 0.5) * r.size, (4.8 + breath * 0.5) * r.size, 'f');
      markEllipse(t, r.X(14), r.Y(28), 8 * r.size, 2.2 * r.size, 'b');
      if (spec.stripes) for (let i = 0; i < 3; i++) rect(t, r.X(8 + i * 3), r.Y(21), 1, 2, 'a');
      if (spec.patch) markEllipse(t, r.X(9), r.Y(23), 3.4 * r.size, 2 * r.size, 'a');
    },
    { outline: 'k', shade: SHADE },
  );
  drawBackWings(g, spec.accessory, r.X(11), r.Y(25.2) - 4.8 * r.size + 1, r.size);
  part(g, (t) => ellipse(t, r.X(22.5), r.Y(28.2), 5 * r.size, 2.2 * r.size, 'f'), { outline: 'k', shade: SHADE });
  const h = headOf(spec);
  drawHead(g, r, { ...pose, headDx: 0, headDy: 0 }, { cx: 21.2, cy: 22.4, rx: h.rx - 0.2, ry: h.ry - 0.6 });
  return g;
}

/** 공처럼 만 자세: 둥근 몸에 머리가 얹혀 있어서 돌려도 귀엽다. */
function curled(r: Rig, pose: Pose): Grid {
  const g = blank();
  const { spec } = r;
  drawTail(g, r, { ...pose, tailAngle: -20, tailCurl: 28 }, { x: 5, y: 26 });
  part(
    g,
    (t) => {
      ellipse(t, r.X(15.4), r.Y(21.6), 9.4 * r.size, 8.6 * r.size, spec.shell ? 'a' : 'f');
      if (spec.shell) {
        markEllipse(t, r.X(14), r.Y(19.5), 5 * r.size, 4 * r.size, 'A');
      } else {
        markEllipse(t, r.X(15), r.Y(26), 6 * r.size, 3.4 * r.size, 'b');
        if (spec.stripes) for (let i = 0; i < 3; i++) rect(t, r.X(8 + i * 2.6), r.Y(14), 1, 3, 'a');
        if (spec.patch) markEllipse(t, r.X(10), r.Y(17), 3.4 * r.size, 3.2 * r.size, 'a');
      }
    },
    { outline: 'k', shade: SHADE },
  );
  drawBackWings(g, spec.accessory, r.X(12), r.Y(21.6) - 8.6 * r.size + 2, r.size);
  const h = spec.shell ? { cx: 23, cy: 24, rx: 4, ry: 3.6 } : { ...headOf(spec), cx: 19.6, cy: 16.6, rx: 6.2, ry: 5.7 };
  drawHead(g, r, { ...pose, eyes: pose.eyes, headDx: 0, headDy: 0 }, h);
  return g;
}

/** 정면으로 한 손(앞발)에 매달린 자세. 그림 맨 위 줄(마우스 위치)에서 팔이 내려온다. */
function hanging(r: Rig, pose: Pose): Grid {
  const g = blank();
  const { spec } = r;
  const k = r.size * r.headMod;
  const sz = r.size;
  const X = (x: number): number => CX + (x - CX) * sz;
  // 새끼는 몸이 작아서 팔이 보일 만큼 몸 전체를 조금 내린다
  const drop = r.baby ? 3 : 0;
  const Yh = (y: number): number => y * sz + drop;
  const hx = CX;
  const hy = Yh(12.4);
  const hrx = (spec.shell ? 5.6 : 7) * k;
  const hry = (spec.shell ? 5 : 6.4) * k;
  const swing = pose.legs.bf.dx;

  // 뒤: 등딱지·꼬리
  if (spec.shell) {
    part(g, (t) => ellipse(t, hx, Yh(21), 8.6 * sz, 7 * sz, 'a'), { outline: 'k', shade: SHADE });
    part(g, (t) => ellipse(t, hx, Yh(21), 4 * sz, 3 * sz, 'A'), { outline: null });
  }
  // 다리(흔들림)
  for (const [dx, d] of [[-2.6, swing], [2.6, -swing]] as const) {
    part(g, (t) => ellipse(t, X(CX + dx * 1.2 + d * 0.6), Yh(28), 2.2 * sz, 2.4 * sz, spec.shell ? 'f' : 'f'), { outline: 'k', shade: SHADE });
  }
  // 몸통
  if (!spec.shell) {
    part(
      g,
      (t) => {
        ellipse(t, hx, Yh(21.6), 5.8 * sz, 6.2 * sz, 'f');
        markEllipse(t, hx, Yh(23), 3.4 * sz, 4.2 * sz, 'b');
      },
      { outline: 'k', shade: SHADE },
    );
  }
  // 두 팔: 만세 하듯 머리 바깥으로 들어 올려 마우스 포인터 양옆을 붙잡는다
  const top = hy - hry;
  drawHangArms(g, { cx: hx, reach: Math.max(hrx, 5.8 * sz) + 1.8, shoulderY: Yh(18.5), arm: 'f', hand: 'b', scale: sz, sway: swing });
  // 귀(머리 뒤)
  if (spec.ears === 'cat') {
    for (const sx of [-1, 1]) {
      part(
        g,
        (t) => {
          triangle(t, hx + sx * 6.4 * k, top + 3 * k, hx + sx * 1.6 * k, top + 1.6 * k, hx + sx * 5.2 * k, top - 4.6 * k, 'f');
        },
        { outline: 'k', shade: SHADE },
      );
    }
  } else if (spec.ears === 'round') {
    for (const sx of [-1, 1]) {
      part(g, (t) => ellipse(t, hx + sx * 4.8 * k, top + 1.6 * k, 2.6 * k, 2.6 * k, 'a'), { outline: 'k', shade: SHADE });
    }
  } else if (spec.ears === 'rabbit') {
    for (const sx of [-1, 1]) {
      part(
        g,
        (t) => {
          // 매달릴 땐 귀를 짧게 접어서 위로 뻗은 팔과 구분한다
          line(t, hx + sx * 3.6 * k, top + 2, hx + sx * 4.4 * k, top - 4.2 * k, 'f', 3.4 * k);
        },
        { outline: 'k', shade: SHADE },
      );
    }
  }
  // 머리
  part(
    g,
    (t) => {
      ellipse(t, hx, hy, hrx, hry, 'f');
      if (spec.cheeks) ellipse(t, hx, hy + hry * 0.5, hrx * 1.08, hry * 0.62, 'f');
      markEllipse(t, hx, hy + hry * 0.55, hrx * 0.5, hry * 0.4, 'b');
      if (spec.stripes) for (let i = -1; i <= 1; i++) rect(t, hx + i * 2.4 - 0, Math.round(top + 0.5), 1, 2, 'a');
    },
    { outline: 'k', shade: SHADE },
  );
  if (spec.ears === 'dog') {
    for (const sx of [-1, 1]) {
      part(g, (t) => ellipse(t, hx + sx * (hrx - 0.6), hy + hry * 0.1, 2.6 * k, 5 * k, 'a'), { outline: 'k', shade: SHADE });
    }
  }
  // 얼굴(정면): 눈 둘, 코, 볼터치
  const small = hry < 4.6;
  const ey = Math.round(hy - hry * 0.25);
  drawEye(g, Math.round(hx - 4.2 * k * (small ? 0.7 : 1) - 1), ey, pose.eyes, small);
  drawEye(g, Math.round(hx + 1.6 * k * (small ? 0.7 : 1)), ey, pose.eyes, small);
  rect(g, hx - 1, Math.round(hy + hry * 0.18), 2, 2, 'n');
  drawMouth(g, hx + 1, Math.round(hy + hry * 0.18), pose.mouth);
  const eyeScale = small ? 0.7 : 1;
  drawHeadAccessory(g, spec.accessory, { cx: hx, cy: hy, rx: hrx, ry: hry }, [
    { x: Math.round(hx - 4.2 * k * eyeScale - 1), y: ey },
    { x: Math.round(hx + 1.6 * k * eyeScale), y: ey },
  ]);
  return g;
}

export type QuadShape = 'stand' | 'sit' | 'lie' | 'curl' | 'hang';

export function renderQuadShape(spec: QuadSpec, stage: ArtStage, shape: QuadShape, pose: Pose): string[] {
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

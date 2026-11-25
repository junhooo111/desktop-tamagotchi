/**
 * 마우스에 매달린 자세의 두 팔.
 *
 * 그림 맨 윗줄 한가운데가 마우스 포인터 자리다. 동물은 두 손을 번쩍 들어 그 포인터 양옆을 붙잡고 매달린다.
 * 예전에는 팔을 머리 위로 솟은 굵은 선 하나로 그려서 "머리 위에 뜬 정체 모를 막대"로 보였다.
 * (두 팔을 머리 위 가운데에 세워 봤더니 이번엔 토끼 귀처럼 보여서 그것도 버렸다.)
 * 지금은 팔을 어깨에서 시작해 머리 바깥쪽으로 곧게 올리고 끝에 밝고 동그란 손을 단다.
 * 머리 옆으로 내려오는 줄기가 몸에 이어져 있어서 "만세 하듯 든 팔"로 읽히고, 귀와 겹치지 않는다.
 */
import { ellipse, line, part } from '../pixel.js';
import { SHADE } from './types.js';

export interface HangArmsSpec {
  /** 가운데 칸(포인터 자리) */
  cx: number;
  /** 가운데에서 팔까지 좌우 거리. 머리 반폭보다 커서 팔이 머리 바깥으로 지난다. */
  reach: number;
  /** 팔이 시작하는 어깨 줄 */
  shoulderY: number;
  /** 팔 색, 손 색(팔레트 글자) */
  arm: string;
  hand: string;
  /** 팔 굵기와 손 크기를 같이 줄이는 배율(새끼는 작다) */
  scale: number;
  /** 매달려 버둥거릴 때 팔꿈치가 좌우로 밀리는 칸 수 */
  sway: number;
}

export function drawHangArms(g: string[][], s: HangArmsSpec): void {
  const k = Math.max(s.scale, 0.85);
  const handY = 2.2 * k;
  for (const sx of [-1, 1]) {
    const shoulderX = s.cx + sx * (s.reach - 3);
    const elbowX = s.cx + sx * s.reach + sx * s.sway * 0.3;
    const handX = s.cx + sx * (s.reach - 0.4);
    const elbowY = s.shoulderY - (s.shoulderY - handY) * 0.5;
    part(
      g,
      (t) => {
        line(t, shoulderX, s.shoulderY, elbowX, elbowY, s.arm, 2.8 * k);
        line(t, elbowX, elbowY, handX, handY, s.arm, 2.8 * k);
        // 손: 팔보다 밝고 둥글게 — "움켜쥔 손"으로 읽히게 한다
        ellipse(t, handX, handY, 2 * k, 1.9 * k, s.hand);
      },
      { outline: 'k', shade: SHADE },
    );
  }
}

/** 펫의 동작·자세를 나타내는 공통 타입과, 붙어 있는 면에 따른 그림 방향 규칙. */

/** 펫이 딛고 있는 면: 바닥, 왼쪽 벽, 오른쪽 벽 */
export type Surface = 'floor' | 'wallL' | 'wallR';
/** 바닥에서는 left/right, 벽에서는 up/down 을 쓴다. */
export type Dir = 'left' | 'right' | 'up' | 'down';
export type Mode =
  | 'idle'
  | 'walk'
  | 'run'
  | 'doze'
  | 'sleep'
  | 'climb'
  | 'slip'
  | 'play'
  | 'hang'
  | 'fall'
  | 'carried'
  /** 검사에서 문제를 찾아 그 자리에서 사용자를 기다린다 */
  | 'alert'
  /** 앉아서 쉰다(꼬리를 흔든다) */
  | 'sit'
  /** 쓰다듬어 줘서 좋아한다(하트가 떠오른다) */
  | 'happy'
  /** 밥을 먹는다(오물오물) */
  | 'eat'
  /** 높은 데서 떨어져 헤롱헤롱 기절한다(머리 위로 별이 돈다) */
  | 'dizzy'
  /** 씻는다(거품이 떠오른다) */
  | 'wash'
  /** 응가를 한다(웅크려서 끙끙) */
  | 'poop';
export type PlayKind = 'hop' | 'roll' | 'look';

/** 원본 그림(오른쪽을 보고 서 있음)을 먼저 좌우로 뒤집고, 시계 방향으로 quarter 번 돌린다. */
export interface Orientation {
  flip: boolean;
  quarter: 0 | 1 | 2 | 3;
}

export function orientationOf(surface: Surface, dir: Dir): Orientation {
  switch (surface) {
    case 'wallL': // 발이 왼쪽 벽에 닿는다
      return dir === 'down' ? { flip: false, quarter: 1 } : { flip: true, quarter: 1 };
    case 'wallR': // 발이 오른쪽 벽에 닿는다
      return dir === 'down' ? { flip: true, quarter: 3 } : { flip: false, quarter: 3 };
    default:
      return { flip: dir === 'left', quarter: 0 };
  }
}

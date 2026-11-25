/**
 * 한 마리가 가지는 그림 프레임의 이름들. 동작(걷기·잠·점프…)마다 전용 그림이 있다.
 *
 *   idleA/B        서서 숨 쉬기(꼬리·귀가 살짝 움직인다)
 *   sitA/B         앉아서 쉬기(꼬리를 흔든다)
 *   walk1~4        걷기 4프레임 사이클(접지 → 통과 → 접지 → 통과)
 *   run1~4         뛰기 4프레임 사이클(몸이 늘어나고 떠오른다)
 *   dozeA/B        졸기: 앉은 채 꾸벅꾸벅
 *   sleepA/B       엎드려 자기(숨 쉬듯 두 모습을 번갈아)
 *   jumpCrouch     점프 전 웅크리기      jumpUp 도약      jumpPeak 정점
 *   jumpDown       내려오기              (착지는 jumpCrouch 로 이어진다)
 *   curl           공처럼 몸을 만 모습(데굴데굴 구르기)
 *   climbA/B       벽 타기: 앞발을 번갈아 뻗는다(그림을 돌려서 벽에 붙인다)
 *   slipA/B        미끄러지기: 놀라서 팔다리를 벌린다
 *   hangA/B        마우스에 매달리기(정면, 대롱대롱)
 *   fall           떨어지는 중(허둥지둥)
 *   alertA/B       문제를 찾아 알리기: 눈이 커지고 통통 뛴다
 *   happyA/B       쓰다듬을 때 좋아하기
 *   eatA/B         먹기: 오물오물
 */
export const FRAME_NAMES = [
  'idleA',
  'idleB',
  'sitA',
  'sitB',
  'walk1',
  'walk2',
  'walk3',
  'walk4',
  'run1',
  'run2',
  'run3',
  'run4',
  'dozeA',
  'dozeB',
  'sleepA',
  'sleepB',
  'jumpCrouch',
  'jumpUp',
  'jumpPeak',
  'jumpDown',
  'curl',
  'climbA',
  'climbB',
  'slipA',
  'slipB',
  'hangA',
  'hangB',
  'fall',
  'alertA',
  'alertB',
  'happyA',
  'happyB',
  'eatA',
  'eatB',
] as const;

export type FrameName = (typeof FRAME_NAMES)[number];
export type Frames = Record<FrameName, string[]>;

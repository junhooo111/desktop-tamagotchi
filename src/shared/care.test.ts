import { describe, expect, it } from 'vitest';
import { resolvePose } from './animation.js';
import {
  CLEAN_MINUTES,
  DIRTY_BELOW,
  afterPoop,
  applyElapsed,
  canStroll,
  createPet,
  effectiveStage,
  finishStroll,
  isDirty,
  isDisplayStage,
  reachedStages,
  statusText,
  wash,
  type PetState,
} from './pet.js';
import { POOP_FADE_MS, POOP_LIFE_MS, POOP_POP_MS, POOP_SIZE, poopHtml, poopSvg } from './poop.js';

const NOW = 1_000_000;
const adult = (over: Partial<PetState> = {}): PetState => ({ ...createPet('cat', NOW), xp: 300, ...over });

describe('청결', () => {
  it('새 펫은 깨끗하고, 시간이 지나면 CLEAN_MINUTES 마다 1씩 줄어든다(0 밑으로는 안 내려간다)', () => {
    const p = adult();
    expect(p.clean).toBe(100);
    expect(applyElapsed(p, NOW + CLEAN_MINUTES * 60_000 * 10).clean).toBeCloseTo(90);
    expect(applyElapsed(p, NOW + 10 ** 10).clean).toBe(0);
  });

  it(`청결이 ${DIRTY_BELOW} 미만이면 더럽다`, () => {
    expect(isDirty(adult({ clean: DIRTY_BELOW }))).toBe(false);
    expect(isDirty(adult({ clean: DIRTY_BELOW - 1 }))).toBe(true);
  });

  it('상태 보기에 청결이 나온다', () => {
    expect(statusText(adult({ clean: 42 }))).toContain('청결 42/100');
  });
});

describe('씻기기', () => {
  it('더러우면 청결이 가득 차고 기분과 경험치가 오른다', () => {
    const r = wash(adult({ clean: 20, happiness: 50 }));
    expect(r.ok).toBe(true);
    expect(r.pet.clean).toBe(100);
    expect(r.pet.happiness).toBe(55);
    expect(r.pet.xp).toBe(304);
    expect(r.message).toContain('깨끗');
  });

  it('이미 깨끗하면(90 이상) 하지 않고, 알은 씻길 수 없다', () => {
    const clean = wash(adult({ clean: 95 }));
    expect(clean.ok).toBe(false);
    expect(clean.message).toContain('이미 깨끗');
    expect(wash({ ...createPet('cat', NOW), clean: 10 }).ok).toBe(false);
  });
});

describe('산책 규칙', () => {
  it('알이거나 너무 배고프면 못 나가고 이유를 알려 준다', () => {
    expect(canStroll(createPet('cat', NOW))).toMatchObject({ ok: false });
    expect(canStroll(adult({ hunger: 10 }))).toMatchObject({ ok: false });
    expect(canStroll(adult({ hunger: 10 })).message).toContain('배고파');
    expect(canStroll(adult())).toMatchObject({ ok: true });
  });

  it('산책이 끝나면 기분이 좋아지고 배고프고 지저분해지며 경험치를 받는다', () => {
    const r = finishStroll(adult({ happiness: 40, hunger: 60, clean: 80 }));
    expect(r.pet).toMatchObject({ happiness: 55, hunger: 50, clean: 70, xp: 306 });
  });

  it('응가를 하면 청결이 조금 줄어든다', () => {
    expect(afterPoop(adult({ clean: 50 })).clean).toBe(44);
    expect(afterPoop(adult({ clean: 3 })).clean).toBe(0);
  });
});

describe('응가 그림', () => {
  it('도트 SVG 한 장이고 스크립트·외부 주소가 없다', () => {
    const svg = poopSvg();
    expect(svg.startsWith('<svg')).toBe(true);
    expect(svg).toContain(`width="${POOP_SIZE.width}"`);
    expect(svg).not.toMatch(/<script|https?:\/\/(?!www\.w3\.org)|on\w+=/i);
  });

  it('창에 띄울 HTML 은 마지막 POOP_FADE_MS 동안 흐려지는 애니메이션이 있다', () => {
    const html = poopHtml();
    expect(html).toContain(`fade ${POOP_FADE_MS}ms linear ${POOP_LIFE_MS - POOP_FADE_MS}ms forwards`);
    expect(html).toContain('@keyframes pop'); // 통통 튀며 나타난다
  });

  it('마우스 커서의 절반쯤(약 18x16px)이고 눈·입·볼터치가 있는 모양이다', () => {
    expect(POOP_SIZE).toEqual({ width: 18, height: 16 });
    const svg = poopSvg();
    expect(svg).toContain('#2a1a10'); // 눈·입
    expect(svg).toContain('#f0a090'); // 볼터치
  });

  it('누르면 사라진다: mousedown 에서 줄어드는 연출 뒤 창을 닫는 한 줄 스크립트만 있고, 외부 요청은 없다', () => {
    const html = poopHtml();
    expect(html.match(/<script>/g)).toHaveLength(1);
    expect(html).toContain("addEventListener('mousedown'");
    expect(html).toContain('window.close()');
    expect(html).toContain(`},${POOP_POP_MS})`);
    expect(html).not.toMatch(/fetch\(|XMLHttpRequest|https?:\/\/(?!www\.w3\.org)|eval\(/);
  });
});

describe('새 동작의 자세', () => {
  const pose = (mode: 'dizzy' | 'wash' | 'poop', now = 1_000) => resolvePose({ mode, surface: 'floor', dir: 'right', play: 'hop', since: 0 }, now);

  it('기절: 앉아서 눈을 감고 흔들리며 별이 돈다', () => {
    const p = pose('dizzy', 700);
    expect(p).toMatchObject({ dizzy: true, eyesClosed: true });
    expect(['sitA', 'sitB']).toContain(p.frame);
    expect(new Set([100, 300, 500, 900].map((t) => pose('dizzy', t).dx)).size).toBeGreaterThan(1);
  });

  it('씻기: 몸을 떨며 거품이 난다', () => {
    expect(pose('wash')).toMatchObject({ bubbles: true });
    expect(pose('wash', 0).dx).not.toBe(pose('wash', 90).dx);
  });

  it('응가: 웅크려서 끙끙', () => {
    expect(pose('poop').frame).toBe('jumpCrouch');
  });
});

describe('이미 지나온 단계로 되돌린 모습', () => {
  it('reachedStages: 지나온 단계만(알은 없다)', () => {
    expect(reachedStages('egg')).toEqual([]);
    expect(reachedStages('baby')).toEqual(['baby']);
    expect(reachedStages('adult')).toEqual(['baby', 'adult']);
    expect(reachedStages('legend')).toEqual(['baby', 'adult', 'legend']);
  });

  it('effectiveStage: 지나온 단계는 그대로 보이고, 아직 안 지난 단계나 알은 지금 단계로 보인다', () => {
    expect(effectiveStage('adult', 'auto')).toBe('adult');
    expect(effectiveStage('adult', 'baby')).toBe('baby'); // 새끼 때로 되돌림
    expect(effectiveStage('adult', 'adult')).toBe('adult');
    expect(effectiveStage('adult', 'legend')).toBe('adult'); // 아직 전설이 아니다
    expect(effectiveStage('baby', 'adult')).toBe('baby');
    expect(effectiveStage('legend', 'baby')).toBe('baby');
    expect(effectiveStage('legend', 'adult')).toBe('adult');
    expect(effectiveStage('egg', 'baby')).toBe('egg'); // 알은 모습을 바꿀 수 없다
  });

  it('isDisplayStage', () => {
    expect(isDisplayStage('auto')).toBe(true);
    expect(isDisplayStage('egg')).toBe(false);
  });
});

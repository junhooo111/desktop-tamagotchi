import { describe, expect, it } from 'vitest';
import type { PageSnapshot, RawFinding } from './collector.js';
import { pageContentRect, pageOfKey, toFindings } from './scan.js';

const snapshot = (findings: RawFinding[], over: Partial<PageSnapshot> = {}): PageSnapshot => ({
  url: 'http://localhost:5173/dash?tab=1#top',
  title: '대시보드',
  visible: true,
  screenX: 100,
  screenY: 50,
  outerWidth: 1216, // 좌우 테두리 8px 씩
  outerHeight: 808,
  innerWidth: 1200,
  innerHeight: 700,
  findings,
  ...over,
});

const raw = (over: Partial<RawFinding> = {}): RawFinding => ({
  ruleId: 'img-alt',
  selector: 'body > img',
  rect: { x: 20, y: 30, w: 100, h: 60 },
  detail: '/a.png',
  ...over,
});

describe('pageContentRect', () => {
  it('좌우 테두리를 빼고, 위쪽은 탭·주소창 높이만큼 내려 계산한다', () => {
    // border = (1216-1200)/2 = 8, 위쪽 = (808-700) - 8 = 100
    expect(pageContentRect(snapshot([]))).toEqual({ x: 108, y: 150, width: 1200, height: 700 });
  });

  it('최대화처럼 테두리가 없는 창도 다룬다', () => {
    const s = snapshot([], { outerWidth: 1200, outerHeight: 760 });
    expect(pageContentRect(s)).toEqual({ x: 100, y: 110, width: 1200, height: 700 });
  });
});

describe('toFindings', () => {
  it('요소 위치를 화면 좌표로 바꾸고, 같은 페이지·규칙·요소는 같은 키를 갖는다', () => {
    const [f] = toFindings(snapshot([raw()]));
    expect(f).toMatchObject({
      key: 'http://localhost:5173/dash|img-alt|body > img',
      url: 'http://localhost:5173/dash',
      rect: { x: 128, y: 180, width: 100, height: 60 },
    });
    expect(toFindings(snapshot([raw()], { url: 'http://localhost:5173/dash?tab=2' }))[0]?.key).toBe(f?.key);
  });

  it('페이지 전체 문제나 화면 밖 요소는 위치(rect)가 null 이다', () => {
    const found = toFindings(
      snapshot([
        raw({ ruleId: 'html-lang', selector: 'document', rect: null }),
        raw({ rect: { x: 20, y: 2000, w: 10, h: 10 } }),
        raw({ rect: { x: -500, y: 10, w: 100, h: 10 } }),
        raw({ rect: { x: -50, y: 10, w: 100, h: 10 } }), // 일부만 보임
      ]),
    );
    expect(found.map((f) => f.rect === null)).toEqual([true, true, true, false]);
    expect(found.every((f) => f.page.width === 1200)).toBe(true);
  });
});

describe('pageOfKey', () => {
  it('키에서 페이지 주소를 꺼낸다', () => {
    expect(pageOfKey('http://localhost:5173/dash|img-alt|body > img')).toBe('http://localhost:5173/dash');
  });
});

/** 열려 있는 로컬 페이지를 검사해서, 펫이 찾아갈 수 있는 화면 좌표가 붙은 결과로 바꾼다. */
import type { RuleId } from '../shared/lessons.js';
import { evaluate, listTargets } from './cdp.js';
import { collectorExpression, type PageSnapshot } from './collector.js';
import { normalizeUrl, pickPageTargets } from './targets.js';

export interface ScreenRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Finding {
  /** 같은 문제를 알아보는 키: 페이지 주소 | 규칙 | 요소 경로 */
  key: string;
  ruleId: RuleId;
  url: string;
  selector: string;
  detail: string;
  /** 문제 요소의 화면 좌표. 화면에 보이지 않거나 페이지 전체 문제면 null */
  rect: ScreenRect | null;
  /** 브라우저 내용 영역의 화면 좌표 */
  page: ScreenRect;
}

export interface ScanResult {
  /** 디버그 포트에 연결됐는지 */
  reachable: boolean;
  /** 검사에 성공한 (보이는) 탭의 주소들 */
  scannedUrls: string[];
  findings: Finding[];
}

/**
 * 브라우저 내용 영역의 화면 좌표.
 * 창 가장자리 테두리를 좌우 같은 두께로 보고, 위쪽 나머지는 탭·주소창으로 본다. 브라우저 확대는 100% 로 가정한다.
 */
export function pageContentRect(s: PageSnapshot): ScreenRect {
  const border = Math.max(0, (s.outerWidth - s.innerWidth) / 2);
  return {
    x: s.screenX + border,
    y: s.screenY + (s.outerHeight - s.innerHeight) - border,
    width: s.innerWidth,
    height: s.innerHeight,
  };
}

/** 뷰포트 안에 (조금이라도) 보이는 요소인지 */
function inViewport(r: { x: number; y: number; w: number; h: number }, s: PageSnapshot): boolean {
  return r.x + r.w > 0 && r.y + r.h > 0 && r.x < s.innerWidth && r.y < s.innerHeight;
}

export function toFindings(snapshot: PageSnapshot): Finding[] {
  const page = pageContentRect(snapshot);
  const url = normalizeUrl(snapshot.url);
  return snapshot.findings.map((f) => ({
    key: `${url}|${f.ruleId}|${f.selector}`,
    ruleId: f.ruleId,
    url,
    selector: f.selector,
    detail: f.detail,
    rect:
      f.rect && inViewport(f.rect, snapshot)
        ? { x: page.x + f.rect.x, y: page.y + f.rect.y, width: f.rect.w, height: f.rect.h }
        : null,
    page,
  }));
}

export function pageOfKey(key: string): string {
  return key.split('|')[0] ?? key;
}

/** 디버그 포트의 로컬 탭들을 검사한다. 보이지 않는 탭은 좌표를 쓸 수 없어 건너뛴다. */
export async function scanLocalPages(port: number): Promise<ScanResult> {
  const targets = await listTargets(port);
  if (!targets) return { reachable: false, scannedUrls: [], findings: [] };

  const expression = collectorExpression();
  const scannedUrls: string[] = [];
  const findings: Finding[] = [];
  for (const target of pickPageTargets(targets)) {
    try {
      const snapshot = await evaluate<PageSnapshot>(target.webSocketDebuggerUrl, expression);
      if (!snapshot || !snapshot.visible) continue;
      scannedUrls.push(normalizeUrl(snapshot.url));
      findings.push(...toFindings(snapshot));
    } catch {
      // 탭이 닫혔거나 응답이 없으면 이번에는 건너뛴다.
    }
  }
  return { reachable: true, scannedUrls, findings };
}

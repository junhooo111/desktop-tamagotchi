/**
 * 브라우저 확장이 보내 주는 검사 결과를 받아서 쌓아 두는 곳.
 *
 * 평소 쓰는 크롬에서는 원격 디버깅 포트를 쓸 수 없어서, 확장(extension/)이 localhost 탭 안에서
 * 검사 수집기(collector.ts)를 직접 돌리고 결과만 앱으로 보낸다.
 * 여기서는 받은 값을 의심하고(형식·주소·크기) 검증한 뒤, 일정 시간 안에 받은 것만 "지금 열려 있는 페이지"로 본다.
 */
import { RULE_IDS } from '../shared/lessons.js';
import type { PageSnapshot, RawFinding } from './collector.js';
import { toFindings, type ScanResult } from './scan.js';
import { isLocalUrl, normalizeUrl } from './targets.js';

/** 이 시간(ms) 안에 다시 받지 못한 페이지는 닫힌 것으로 본다. 확장은 몇 초마다 보낸다. */
export const SNAPSHOT_TTL_MS = 15_000;

const MAX_FINDINGS = 60;
const MAX_TEXT = 300;
const MAX_PAGES = 30;

const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const clip = (v: unknown): string => (typeof v === 'string' ? v.slice(0, MAX_TEXT) : '');

function cleanFinding(raw: unknown): RawFinding | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const f = raw as Record<string, unknown>;
  if (typeof f['ruleId'] !== 'string' || !(RULE_IDS as readonly string[]).includes(f['ruleId'])) return null;
  let rect: RawFinding['rect'] = null;
  const r = f['rect'];
  if (typeof r === 'object' && r !== null) {
    const { x, y, w, h } = r as Record<string, unknown>;
    if (isNum(x) && isNum(y) && isNum(w) && isNum(h)) rect = { x, y, w, h };
  }
  return { ruleId: f['ruleId'] as RawFinding['ruleId'], selector: clip(f['selector']), rect, detail: clip(f['detail']) };
}

/** 받은 값이 쓸 만한 스냅샷이면 정리해서 돌려주고, 아니면 null (로컬 주소가 아니어도 null). */
export function cleanSnapshot(raw: unknown): PageSnapshot | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const s = raw as Record<string, unknown>;
  if (typeof s['url'] !== 'string' || !isLocalUrl(s['url'])) return null;
  const nums = ['screenX', 'screenY', 'outerWidth', 'outerHeight', 'innerWidth', 'innerHeight'] as const;
  if (!nums.every((k) => isNum(s[k]))) return null;
  if (!Array.isArray(s['findings'])) return null;
  const findings = s['findings']
    .slice(0, MAX_FINDINGS)
    .map(cleanFinding)
    .filter((f): f is RawFinding => f !== null);
  return {
    url: s['url'].slice(0, 500),
    title: clip(s['title']),
    visible: s['visible'] === true,
    screenX: s['screenX'] as number,
    screenY: s['screenY'] as number,
    outerWidth: s['outerWidth'] as number,
    outerHeight: s['outerHeight'] as number,
    innerWidth: s['innerWidth'] as number,
    innerHeight: s['innerHeight'] as number,
    findings,
  };
}

interface Entry {
  snapshot: PageSnapshot;
  at: number;
}

export class SnapshotFeed {
  private readonly pages = new Map<string, Entry>();

  /** 스냅샷 하나를 받는다. 받아들였으면 true. */
  ingest(raw: unknown, now: number): boolean {
    const snapshot = cleanSnapshot(raw);
    if (!snapshot) return false;
    const key = normalizeUrl(snapshot.url);
    // 같은 주소를 여러 탭이 열었으면 가장 최근에 받은 것을 쓴다.
    this.pages.set(key, { snapshot, at: now });
    this.expire(now);
    return true;
  }

  private expire(now: number): void {
    for (const [key, e] of this.pages) if (now - e.at > SNAPSHOT_TTL_MS) this.pages.delete(key);
    if (this.pages.size > MAX_PAGES) {
      const oldest = [...this.pages.entries()].sort((a, b) => a[1].at - b[1].at).slice(0, this.pages.size - MAX_PAGES);
      for (const [key] of oldest) this.pages.delete(key);
    }
  }

  /** 지금 열려 있는(최근에 받은) 로컬 페이지를 검사 결과 모양으로 돌려준다. 보이지 않는 탭은 좌표를 쓸 수 없어 건너뛴다. */
  scan(now: number): ScanResult {
    this.expire(now);
    const fresh = [...this.pages.values()].map((e) => e.snapshot);
    const visible = fresh.filter((s) => s.visible);
    return {
      reachable: fresh.length > 0,
      scannedUrls: visible.map((s) => normalizeUrl(s.url)),
      findings: visible.flatMap((s) => toFindings(s)),
    };
  }
}

/** 디버그 포트 검사와 확장 검사를 하나로 합친다(같은 문제는 키가 같아서 한 번만). */
export function mergeScans(a: ScanResult, b: ScanResult): ScanResult {
  const seen = new Set<string>();
  const findings = [...a.findings, ...b.findings].filter((f) => {
    if (seen.has(f.key)) return false;
    seen.add(f.key);
    return true;
  });
  return {
    reachable: a.reachable || b.reachable,
    scannedUrls: [...new Set([...a.scannedUrls, ...b.scannedUrls])],
    findings,
  };
}

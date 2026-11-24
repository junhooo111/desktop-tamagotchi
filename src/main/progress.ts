/**
 * 학습 진행도: 어떤 문제를 확인했는지, 고쳤는지, 잠시 미뤘는지.
 * 순수 함수와 파일 저장·복원으로 이루어져 있다.
 */
import fs from 'node:fs';
import path from 'node:path';
import { pageOfKey, type Finding } from '../inspect/scan.js';

export interface ConfirmedEntry {
  /** 확인한 시각(ms) */
  at: number;
  /** 고친 것이 확인되어 보너스를 받았는지 */
  fixed: boolean;
}

export interface Progress {
  confirmed: Record<string, ConfirmedEntry>;
  /** key → 이 시각(ms)까지 다시 알리지 않는다 */
  snoozed: Record<string, number>;
}

export const SNOOZE_MS = 10 * 60_000;

export const emptyProgress = (): Progress => ({ confirmed: {}, snoozed: {} });

/** 아직 확인하지 않았고 미루지도 않은 문제만 고른다. */
export function pendingFindings(findings: readonly Finding[], progress: Progress, now: number): Finding[] {
  return findings.filter((f) => !(f.key in progress.confirmed) && (progress.snoozed[f.key] ?? 0) <= now);
}

export function confirm(progress: Progress, key: string, now: number): Progress {
  const { [key]: _removed, ...snoozed } = progress.snoozed;
  return { confirmed: { ...progress.confirmed, [key]: { at: now, fixed: false } }, snoozed };
}

export function snooze(progress: Progress, key: string, now: number, ms = SNOOZE_MS): Progress {
  return { ...progress, snoozed: { ...progress.snoozed, [key]: now + ms } };
}

/**
 * 확인했던 문제가 이번 검사에서 사라졌으면 "고친 것"으로 본다.
 * 이번에 검사한 페이지의 문제만 대상이다(다른 탭이 닫혀서 안 보이는 것을 고친 것으로 착각하지 않는다).
 */
export function detectFixes(
  progress: Progress,
  scannedUrls: readonly string[],
  currentKeys: ReadonlySet<string>,
): string[] {
  const scanned = new Set(scannedUrls);
  return Object.entries(progress.confirmed)
    .filter(([key, entry]) => !entry.fixed && scanned.has(pageOfKey(key)) && !currentKeys.has(key))
    .map(([key]) => key);
}

export function markFixed(progress: Progress, keys: readonly string[]): Progress {
  const confirmed = { ...progress.confirmed };
  for (const key of keys) {
    const entry = confirmed[key];
    if (entry) confirmed[key] = { ...entry, fixed: true };
  }
  return { ...progress, confirmed };
}

/** 지난 미루기 기록을 정리해서 파일이 계속 커지지 않게 한다. */
export function prune(progress: Progress, now: number): Progress {
  const snoozed = Object.fromEntries(Object.entries(progress.snoozed).filter(([, until]) => until > now));
  return { ...progress, snoozed };
}

export function loadProgress(file: string): Progress {
  try {
    const raw: unknown = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (typeof raw !== 'object' || raw === null) return emptyProgress();
    const p = raw as Record<string, unknown>;
    const confirmed: Record<string, ConfirmedEntry> = {};
    if (typeof p['confirmed'] === 'object' && p['confirmed'] !== null) {
      for (const [key, v] of Object.entries(p['confirmed'] as Record<string, unknown>)) {
        const e = v as Record<string, unknown> | null;
        if (e && typeof e['at'] === 'number' && typeof e['fixed'] === 'boolean') {
          confirmed[key] = { at: e['at'], fixed: e['fixed'] };
        }
      }
    }
    const snoozed: Record<string, number> = {};
    if (typeof p['snoozed'] === 'object' && p['snoozed'] !== null) {
      for (const [key, v] of Object.entries(p['snoozed'] as Record<string, unknown>)) {
        if (typeof v === 'number') snoozed[key] = v;
      }
    }
    return { confirmed, snoozed };
  } catch {
    return emptyProgress();
  }
}

export function saveProgress(file: string, progress: Progress): void {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = `${file}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(progress, null, 2), 'utf8');
  fs.renameSync(tmp, file);
}

/**
 * 검사 결과 목록: 어떤 문제를 알릴지(규칙 끄기·무시 목록)와, 결과 창에 보여 줄 값을 만든다.
 * 순수 함수라서 시계·파일·화면 없이 테스트한다.
 */
import { CATEGORY_LABELS, LESSONS, RULE_IDS, type RuleCategory, type RuleId } from './lessons.js';
import { MAX_IGNORED_KEYS } from './settings.js';

/** 무시한 문제를 최대 몇 개까지 기억할지(오래된 것부터 잊는다). 설정 파일의 상한과 같다. */
export const MAX_IGNORED = MAX_IGNORED_KEYS;

export interface MuteSettings {
  disabledRules: readonly RuleId[];
  ignored: readonly string[];
}

export interface KeyedFinding {
  /** 같은 문제를 알아보는 키: 페이지 주소 | 규칙 | 요소 경로 */
  key: string;
  ruleId: RuleId;
}

/** 꺼 둔 규칙이거나 무시한 문제면 알리지 않는다. */
export function isMuted(f: KeyedFinding, s: MuteSettings): boolean {
  return s.disabledRules.includes(f.ruleId) || s.ignored.includes(f.key);
}

/** 알려도 되는 문제만 남긴다. */
export function visibleFindings<T extends KeyedFinding>(findings: readonly T[], s: MuteSettings): T[] {
  return findings.filter((f) => !isMuted(f, s));
}

/** 무시 목록에 키를 더한다(이미 있으면 그대로, 상한을 넘으면 오래된 것부터 버린다). */
export function addIgnored(ignored: readonly string[], key: string): string[] {
  if (ignored.includes(key)) return [...ignored];
  return [...ignored, key].slice(-MAX_IGNORED);
}

/** 키(주소|규칙|요소 경로)를 나눈다. 요소 경로에 '|' 가 있어도 안전하다. */
export function parseKey(key: string): { url: string; ruleId: RuleId | null; selector: string } {
  const [url = '', rule = '', ...rest] = key.split('|');
  const ruleId = (RULE_IDS as readonly string[]).includes(rule) ? (rule as RuleId) : null;
  return { url, ruleId, selector: rest.join('|') };
}

export type ResultState = 'new' | 'confirmed' | 'snoozed' | 'ignored' | 'disabled';

export interface ResultItem {
  key: string;
  ruleId: RuleId;
  category: RuleCategory;
  categoryLabel: string;
  title: string;
  where: string;
  fix: string;
  state: ResultState;
}

export interface ResultPage {
  url: string;
  items: ResultItem[];
}

export interface IgnoredEntry {
  key: string;
  url: string;
  title: string;
  where: string;
  /** 지금 열린 페이지에 아직 이 문제가 있는지(없으면 이미 고쳤거나 페이지를 닫은 것) */
  present: boolean;
}

export interface ResultsView {
  /** 지금 검사 중인 로컬 페이지가 있는지(없으면 결과가 비어 있는 이유가 "연결 안 됨"일 수 있다) */
  connected: boolean;
  pages: ResultPage[];
  counts: Record<ResultState, number>;
  ignored: IgnoredEntry[];
}

export interface ResultsContext {
  connected: boolean;
  confirmed: ReadonlySet<string>;
  snoozedUntil: Readonly<Record<string, number>>;
  settings: MuteSettings;
  now: number;
}

export interface ResultFinding extends KeyedFinding {
  url: string;
  selector: string;
  detail: string;
}

const ORDER: Record<ResultState, number> = { new: 0, snoozed: 1, confirmed: 2, ignored: 3, disabled: 4 };

function whereOf(selector: string, detail: string): string {
  const base = selector === 'document' ? '페이지 전체' : selector;
  return detail ? `${base} (${detail})` : base;
}

export function stateOf(f: KeyedFinding, ctx: ResultsContext): ResultState {
  if (ctx.settings.disabledRules.includes(f.ruleId)) return 'disabled';
  if (ctx.settings.ignored.includes(f.key)) return 'ignored';
  if (ctx.confirmed.has(f.key)) return 'confirmed';
  if ((ctx.snoozedUntil[f.key] ?? 0) > ctx.now) return 'snoozed';
  return 'new';
}

/** 지금 찾은 문제를 페이지별로 묶고, 알림 상태(새 문제·확인함·미룸·무시·규칙 꺼짐)를 붙인다. */
export function buildResults(findings: readonly ResultFinding[], ctx: ResultsContext): ResultsView {
  const counts: Record<ResultState, number> = { new: 0, confirmed: 0, snoozed: 0, ignored: 0, disabled: 0 };
  const byPage = new Map<string, ResultItem[]>();
  for (const f of findings) {
    const lesson = LESSONS[f.ruleId];
    const state = stateOf(f, ctx);
    counts[state]++;
    const item: ResultItem = {
      key: f.key,
      ruleId: f.ruleId,
      category: lesson.category,
      categoryLabel: CATEGORY_LABELS[lesson.category],
      title: lesson.title,
      where: whereOf(f.selector, f.detail),
      fix: lesson.fix,
      state,
    };
    byPage.set(f.url, [...(byPage.get(f.url) ?? []), item]);
  }
  const pages = [...byPage.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([url, items]) => ({ url, items: [...items].sort((a, b) => ORDER[a.state] - ORDER[b.state]) }));

  const presentKeys = new Set(findings.map((f) => f.key));
  const ignored: IgnoredEntry[] = ctx.settings.ignored.map((key) => {
    const p = parseKey(key);
    return {
      key,
      url: p.url,
      title: p.ruleId ? LESSONS[p.ruleId].title : '알 수 없는 규칙',
      where: whereOf(p.selector, ''),
      present: presentKeys.has(key),
    };
  });
  return { connected: ctx.connected, pages, counts, ignored };
}

/** 어떤 탭을 검사해도 되는지 정한다. 개발 중인 로컬 페이지만 허용하고, 나머지 탭은 연결조차 하지 않는다. */

export interface CdpTarget {
  id: string;
  type: string;
  title: string;
  url: string;
  webSocketDebuggerUrl?: string;
}

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]']);

export function isLocalHost(hostname: string): boolean {
  return LOCAL_HOSTS.has(hostname) || hostname.endsWith('.localhost');
}

/** http(s)://localhost 계열 주소인지 */
export function isLocalUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return (u.protocol === 'http:' || u.protocol === 'https:') && isLocalHost(u.hostname);
  } catch {
    return false;
  }
}

/** 검사할 수 있는 페이지 탭만 고른다. */
export function pickPageTargets(targets: readonly CdpTarget[]): (CdpTarget & { webSocketDebuggerUrl: string })[] {
  return targets.filter(
    (t): t is CdpTarget & { webSocketDebuggerUrl: string } =>
      t.type === 'page' && isLocalUrl(t.url) && typeof t.webSocketDebuggerUrl === 'string' && t.webSocketDebuggerUrl !== '',
  );
}

/** 해시·쿼리를 뺀 주소. 같은 페이지의 문제를 같은 것으로 세는 기준이다. */
export function normalizeUrl(url: string): string {
  try {
    const u = new URL(url);
    return `${u.origin}${u.pathname}`;
  } catch {
    return url;
  }
}

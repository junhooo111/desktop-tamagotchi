/** 크롬 개발자 도구 프로토콜(CDP) 최소 클라이언트. 외부 라이브러리 없이 Node 내장 fetch/WebSocket 만 쓴다. */
import { isLocalHost, type CdpTarget } from './targets.js';

export interface SocketLike {
  addEventListener(type: string, listener: (event: { data?: unknown }) => void): void;
  send(data: string): void;
  close(): void;
}

const isTarget = (v: unknown): v is CdpTarget => {
  if (typeof v !== 'object' || v === null) return false;
  const t = v as Record<string, unknown>;
  return typeof t['id'] === 'string' && typeof t['type'] === 'string' && typeof t['url'] === 'string';
};

/** 디버그 포트가 열려 있으면 탭 목록을, 아니면 null 을 돌려준다. */
export async function listTargets(
  port: number,
  fetchImpl: typeof fetch = fetch,
  timeoutMs = 1_000,
): Promise<CdpTarget[] | null> {
  try {
    const res = await fetchImpl(`http://127.0.0.1:${port}/json/list`, { signal: AbortSignal.timeout(timeoutMs) });
    if (!res.ok) return null;
    const data: unknown = await res.json();
    return Array.isArray(data) ? data.filter(isTarget) : null;
  } catch {
    return null;
  }
}

/** 페이지에서 식을 실행하고 값을 돌려받는다. 로컬 주소가 아닌 소켓에는 연결하지 않는다. */
export function evaluate<T>(
  wsUrl: string,
  expression: string,
  options: { timeoutMs?: number; createSocket?: (url: string) => SocketLike } = {},
): Promise<T> {
  const { timeoutMs = 4_000, createSocket = (url) => new WebSocket(url) as unknown as SocketLike } = options;
  return new Promise<T>((resolve, reject) => {
    let host: string;
    try {
      host = new URL(wsUrl).hostname;
    } catch {
      reject(new Error('잘못된 WebSocket 주소'));
      return;
    }
    if (!isLocalHost(host)) {
      reject(new Error(`로컬이 아닌 주소에는 연결하지 않습니다: ${host}`));
      return;
    }

    const socket = createSocket(wsUrl);
    let settled = false;
    const finish = (fn: () => void): void => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      try {
        socket.close();
      } catch {
        /* 이미 닫힘 */
      }
      fn();
    };
    const timer = setTimeout(() => finish(() => reject(new Error('시간 초과'))), timeoutMs);

    socket.addEventListener('open', () => {
      socket.send(
        JSON.stringify({ id: 1, method: 'Runtime.evaluate', params: { expression, returnByValue: true } }),
      );
    });
    socket.addEventListener('message', (event) => {
      let msg: {
        id?: number;
        error?: { message?: string };
        result?: { result?: { value?: unknown }; exceptionDetails?: { text?: string } };
      };
      try {
        msg = JSON.parse(String(event.data));
      } catch {
        return;
      }
      if (msg.id !== 1) return;
      if (msg.error) finish(() => reject(new Error(msg.error?.message ?? 'CDP 오류')));
      else if (msg.result?.exceptionDetails) {
        finish(() => reject(new Error(msg.result?.exceptionDetails?.text ?? '페이지 실행 오류')));
      } else finish(() => resolve(msg.result?.result?.value as T));
    });
    socket.addEventListener('error', () => finish(() => reject(new Error('연결 오류'))));
    socket.addEventListener('close', () => finish(() => reject(new Error('연결이 닫힘'))));
  });
}

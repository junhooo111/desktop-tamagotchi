import { describe, expect, it, vi } from 'vitest';
import { evaluate, listTargets, type SocketLike } from './cdp.js';

type Listener = (event: { data?: unknown }) => void;

/** 서버 흉내: 연결되면 open 을 알리고, 보낸 메시지에 reply 로 답한다. */
class FakeSocket implements SocketLike {
  sent: string[] = [];
  closed = false;
  private listeners = new Map<string, Listener[]>();
  constructor(private reply: ((sent: string) => unknown) | null, autoOpen = true) {
    if (autoOpen) queueMicrotask(() => this.emit('open', {}));
  }
  addEventListener(type: string, l: Listener): void {
    this.listeners.set(type, [...(this.listeners.get(type) ?? []), l]);
  }
  send(data: string): void {
    this.sent.push(data);
    const answer = this.reply?.(data);
    if (answer !== undefined) queueMicrotask(() => this.emit('message', { data: JSON.stringify(answer) }));
  }
  close(): void {
    this.closed = true;
  }
  emit(type: string, event: { data?: unknown }): void {
    this.listeners.get(type)?.forEach((l) => l(event));
  }
}

const WS = 'ws://127.0.0.1:9222/devtools/page/1';

describe('evaluate', () => {
  it('Runtime.evaluate 를 보내고 값을 돌려받은 뒤 연결을 닫는다', async () => {
    const socket = new FakeSocket(() => ({ id: 1, result: { result: { value: { ok: 42 } } } }));
    const value = await evaluate<{ ok: number }>(WS, '1+1', { createSocket: () => socket });
    expect(value).toEqual({ ok: 42 });
    expect(JSON.parse(socket.sent[0] ?? '{}')).toMatchObject({
      id: 1,
      method: 'Runtime.evaluate',
      params: { expression: '1+1', returnByValue: true },
    });
    expect(socket.closed).toBe(true);
  });

  it('다른 id 의 메시지는 무시한다', async () => {
    const socket = new FakeSocket(() => undefined);
    const promise = evaluate<number>(WS, 'x', { createSocket: () => socket });
    await Promise.resolve();
    socket.emit('message', { data: JSON.stringify({ id: 99, result: { result: { value: 1 } } }) });
    socket.emit('message', { data: 'not json' });
    socket.emit('message', { data: JSON.stringify({ id: 1, result: { result: { value: 7 } } }) });
    await expect(promise).resolves.toBe(7);
  });

  it('페이지에서 예외가 나면 거절한다', async () => {
    const socket = new FakeSocket(() => ({ id: 1, result: { exceptionDetails: { text: 'Uncaught ReferenceError' } } }));
    await expect(evaluate(WS, 'x', { createSocket: () => socket })).rejects.toThrow('Uncaught ReferenceError');
  });

  it('CDP 오류 응답이면 거절한다', async () => {
    const socket = new FakeSocket(() => ({ id: 1, error: { message: 'No target' } }));
    await expect(evaluate(WS, 'x', { createSocket: () => socket })).rejects.toThrow('No target');
  });

  it('응답이 없으면 시간 초과로 거절하고 연결을 닫는다', async () => {
    const socket = new FakeSocket(null);
    await expect(evaluate(WS, 'x', { timeoutMs: 20, createSocket: () => socket })).rejects.toThrow('시간 초과');
    expect(socket.closed).toBe(true);
  });

  it('연결 오류·끊김도 거절한다', async () => {
    const errored = new FakeSocket(null, false);
    const p1 = evaluate(WS, 'x', { createSocket: () => errored });
    errored.emit('error', {});
    await expect(p1).rejects.toThrow('연결 오류');

    const dropped = new FakeSocket(null, false);
    const p2 = evaluate(WS, 'x', { createSocket: () => dropped });
    dropped.emit('close', {});
    await expect(p2).rejects.toThrow('닫힘');
  });

  it('로컬이 아닌 주소에는 소켓을 만들지도 않는다', async () => {
    const create = vi.fn();
    await expect(evaluate('ws://evil.example.com/x', 'x', { createSocket: create })).rejects.toThrow('로컬이 아닌');
    await expect(evaluate('not a url', 'x', { createSocket: create })).rejects.toThrow('잘못된');
    expect(create).not.toHaveBeenCalled();
  });
});

describe('listTargets', () => {
  const respond = (body: unknown, ok = true) =>
    vi.fn(async () => ({ ok, json: async () => body }) as unknown as Response) as unknown as typeof fetch;

  it('탭 목록을 돌려주고 형식이 맞지 않는 항목은 버린다', async () => {
    const good = { id: '1', type: 'page', title: 't', url: 'http://localhost/' };
    const fetchImpl = respond([good, { id: 2 }, null, 'x']);
    expect(await listTargets(9222, fetchImpl)).toEqual([good]);
    expect(fetchImpl).toHaveBeenCalledWith('http://127.0.0.1:9222/json/list', expect.any(Object));
  });

  it('포트가 닫혀 있거나 응답이 이상하면 null', async () => {
    const failing = vi.fn(async () => {
      throw new Error('ECONNREFUSED');
    }) as unknown as typeof fetch;
    expect(await listTargets(9222, failing)).toBeNull();
    expect(await listTargets(9222, respond({ not: 'array' }))).toBeNull();
    expect(await listTargets(9222, respond([], false))).toBeNull();
  });
});

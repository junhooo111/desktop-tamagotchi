/**
 * GitHub 로그인(Supabase Auth, PKCE + 딥링크).
 * 로그인 흐름: 앱 → 기본 브라우저(GitHub 승인) → desktop-tamagotchi://auth?code=… → 앱이 코드를 세션으로 바꾼다.
 * 세션(리프레시 토큰 포함)은 OS 보안 저장소(Electron safeStorage)로 암호화해서 파일에 보관한다.
 * 규칙(주소 검사·저장 형식)은 순수 함수로 두어 Electron 없이 테스트한다.
 */
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { createClient, type Session, type SupabaseClient } from '@supabase/supabase-js';
import type { SyncRpc } from './account-sync.js';
import type { ServerRpc } from './server-game.js';

export const AUTH_SCHEME = 'desktop-tamagotchi';
export const AUTH_REDIRECT = `${AUTH_SCHEME}://auth`;
/**
 * 로그인 후 돌아오는 주소. 브라우저가 사용자 동작 없이 앱 전용 주소(desktop-tamagotchi://)를 여는 것을 막는 경우가 많아서,
 * 기본은 내 PC 안에서만 열리는 임시 주소(127.0.0.1)로 돌려받는다(데스크톱 앱의 표준 방식). 앱 전용 주소는 보조로 남긴다.
 * 이 주소는 Supabase 의 Redirect URLs 에 등록해 둔다.
 */
export const LOOPBACK_PORT = 47832;
export const LOOPBACK_REDIRECT = `http://127.0.0.1:${LOOPBACK_PORT}/auth/callback`;

export interface BackendConfig {
  url: string;
  anonKey: string;
}

/** 프로젝트 주소와 공개(anon) 키가 들어 있어야 로그인 기능을 켠다. */
export function isConfigured(config: BackendConfig): boolean {
  return /^https:\/\/[^/\s]+/.test(config.url) && config.anonKey.length > 20;
}

export type CallbackResult = { kind: 'code'; code: string } | { kind: 'error'; message: string } | { kind: 'ignore' };

/** 딥링크 주소를 검사한다. 우리 주소(desktop-tamagotchi://auth)가 아니면 무시한다. */
export function parseAuthCallback(raw: string): CallbackResult {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return { kind: 'ignore' };
  }
  const isDeepLink = url.protocol === `${AUTH_SCHEME}:` && url.hostname === 'auth';
  const isLoopback = url.protocol === 'http:' && url.hostname === '127.0.0.1' && url.port === String(LOOPBACK_PORT) && url.pathname === '/auth/callback';
  if (!isDeepLink && !isLoopback) return { kind: 'ignore' };
  const error = url.searchParams.get('error_description') ?? url.searchParams.get('error');
  if (error) return { kind: 'error', message: error.slice(0, 200) };
  const code = url.searchParams.get('code');
  if (!code || code.length > 2048) return { kind: 'ignore' };
  return { kind: 'code', code };
}

/** OS 암호화 기능(safeStorage)을 흉내 낼 수 있게 줄인 모양. Electron 의 비동기 함수(사용 중단된 동기 함수의 후속)를 따라 모두 Promise 를 돌려준다. */
export interface Crypto {
  isAvailable(): Promise<boolean>;
  encrypt(text: string): Promise<Buffer>;
  decrypt(data: Buffer): Promise<string>;
}

/** Supabase 클라이언트가 세션을 맡기는 저장소: 한 파일에 통째로 암호화해서 둔다. 암호화를 쓸 수 없으면 아무것도 저장하지 않는다. */
export class EncryptedFileStorage {
  private cache: Record<string, string> | null = null;
  constructor(
    private readonly file: string,
    private readonly crypto: Crypto,
  ) {}

  /** 쓰기를 한 줄로 세운다(동시에 저장해도 파일이 뒤섞이지 않게). */
  private queue: Promise<void> = Promise.resolve();

  private async load(): Promise<Record<string, string>> {
    if (this.cache) return this.cache;
    let data: Record<string, string> = {};
    try {
      if (await this.crypto.isAvailable()) {
        const parsed: unknown = JSON.parse(await this.crypto.decrypt(fs.readFileSync(this.file)));
        if (parsed && typeof parsed === 'object') {
          data = Object.fromEntries(Object.entries(parsed as Record<string, unknown>).filter(([, v]) => typeof v === 'string')) as Record<string, string>;
        }
      }
    } catch {
      data = {};
    }
    this.cache ??= data;
    return this.cache;
  }

  private async flush(): Promise<void> {
    if (!this.cache || !(await this.crypto.isAvailable())) return;
    fs.mkdirSync(path.dirname(this.file), { recursive: true });
    const tmp = this.file + '.tmp';
    fs.writeFileSync(tmp, await this.crypto.encrypt(JSON.stringify(this.cache)));
    fs.renameSync(tmp, this.file);
  }

  async getItem(key: string): Promise<string | null> {
    return (await this.load())[key] ?? null;
  }
  async setItem(key: string, value: string): Promise<void> {
    const data = await this.load();
    data[key] = value;
    const run = this.queue.then(() => this.flush());
    this.queue = run.catch(() => undefined);
    await run;
  }
  async removeItem(key: string): Promise<void> {
    const data = await this.load();
    delete data[key];
    const run = this.queue.then(() => this.flush());
    this.queue = run.catch(() => undefined);
    await run;
  }
}

export interface AuthUser {
  id: string;
  login: string;
  avatarUrl: string | null;
}

/** Supabase 세션의 사용자를 앱에서 쓰는 모양으로 바꾼다. GitHub 이름은 바뀔 수 있으니 표시용으로만 쓴다. */
export function toAuthUser(session: Session | null): AuthUser | null {
  const user = session?.user;
  if (!user) return null;
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const pick = (k: string): string | null => (typeof meta[k] === 'string' && meta[k] ? (meta[k] as string) : null);
  return {
    id: user.id,
    login: pick('user_name') ?? pick('preferred_username') ?? pick('name') ?? 'GitHub 사용자',
    avatarUrl: pick('avatar_url'),
  };
}

/** 127.0.0.1 에서 로그인 결과 한 번을 받는 임시 서버. 받으면(또는 시간이 지나면) 스스로 닫는다. */
export function startLoopback(onUrl: (url: string) => void, timeoutMs = 5 * 60_000): Promise<{ close(): void }> {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const raw = `http://127.0.0.1:${LOOPBACK_PORT}${req.url ?? ''}`;
      const parsed = parseAuthCallback(raw);
      if (parsed.kind === 'ignore') {
        res.writeHead(404).end();
        return;
      }
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
      res.end(
        parsed.kind === 'code'
          ? '<!doctype html><meta charset="utf-8"><title>Login complete</title><body style="font-family:sans-serif;text-align:center;margin-top:20vh"><h2>로그인이 끝났어요 / Login complete</h2><p>이 창은 닫아도 돼요. 펫에게 돌아가 보세요.<br>You can close this window and go back to your pet.</p>'
          : '<!doctype html><meta charset="utf-8"><title>Login failed</title><body style="font-family:sans-serif;text-align:center;margin-top:20vh"><h2>로그인하지 못했어요 / Login failed</h2><p>이 창을 닫고 펫 메뉴에서 다시 시도해 주세요.<br>Close this window and try again from the pet menu.</p>',
      );
      onUrl(raw);
      close();
    });
    let timer: ReturnType<typeof setTimeout> | null = null;
    const close = (): void => {
      if (timer) clearTimeout(timer);
      server.close();
      server.closeAllConnections?.();
    };
    server.once('error', reject);
    server.listen(LOOPBACK_PORT, '127.0.0.1', () => {
      timer = setTimeout(close, timeoutMs);
      resolve({ close });
    });
  });
}

export interface AuthDeps {
  config: BackendConfig;
  storage: EncryptedFileStorage;
  openExternal: (url: string) => Promise<void> | void;
  /** 시험에서 임시 서버 대신 끼우는 자리 */
  startLoopback?: typeof startLoopback;
  /** 시험에서 가짜 클라이언트를 끼우기 위한 자리 */
  makeClient?: (config: BackendConfig, storage: EncryptedFileStorage) => SupabaseClient;
}

export class AuthService {
  private client: SupabaseClient | null = null;
  private current: AuthUser | null = null;
  private listeners: Array<(user: AuthUser | null) => void> = [];
  private loopback: { close(): void } | null = null;
  private callbackListeners: Array<(r: { handled: boolean; ok: boolean; message?: string }) => void> = [];

  /** 임시 서버로 돌아온 로그인 결과(성공·실패)를 받는다. 앱이 말풍선을 띄우는 데 쓴다. */
  onCallbackResult(cb: (r: { handled: boolean; ok: boolean; message?: string }) => void): void {
    this.callbackListeners.push(cb);
  }

  constructor(private readonly deps: AuthDeps) {
    if (isConfigured(deps.config)) {
      this.client = (deps.makeClient ?? defaultClient)(deps.config, deps.storage);
      this.client.auth.onAuthStateChange((_event, session) => this.set(toAuthUser(session)));
    }
  }

  get enabled(): boolean {
    return this.client !== null;
  }
  get user(): AuthUser | null {
    return this.current;
  }
  onChange(cb: (user: AuthUser | null) => void): void {
    this.listeners.push(cb);
  }
  private set(user: AuthUser | null): void {
    if (this.current?.id === user?.id && this.current?.login === user?.login) return;
    this.current = user;
    for (const cb of this.listeners) cb(user);
  }

  /** 앱을 켤 때 저장된 세션을 복원한다. */
  async restore(): Promise<AuthUser | null> {
    if (!this.client) return null;
    const { data } = await this.client.auth.getSession();
    this.set(toAuthUser(data.session));
    return this.current;
  }

  /** 기본 브라우저로 GitHub 로그인 페이지를 연다. */
  async signIn(): Promise<void> {
    if (!this.client) throw new Error('로그인 서버가 아직 설정되지 않았어요');
    this.loopback?.close();
    this.loopback = null;
    try {
      this.loopback = await (this.deps.startLoopback ?? startLoopback)((url) => {
        void this.handleCallback(url).then((r) => this.callbackListeners.forEach((cb) => cb(r)));
      });
    } catch {
      throw new Error(`로그인 응답을 받을 자리(${LOOPBACK_PORT})를 열지 못했어요. 다른 프로그램이 쓰고 있을 수 있어요`);
    }
    const { data, error } = await this.client.auth.signInWithOAuth({
      provider: 'github',
      options: { redirectTo: LOOPBACK_REDIRECT, skipBrowserRedirect: true, scopes: 'read:user' },
    });
    if (error || !data.url) {
      this.loopback.close();
      throw new Error(error?.message ?? '로그인 주소를 만들지 못했어요');
    }
    await this.deps.openExternal(data.url);
  }

  /** 딥링크로 돌아온 코드를 세션으로 바꾼다. 우리 주소가 아니면 무시한다. */
  async handleCallback(raw: string): Promise<{ handled: boolean; ok: boolean; message?: string }> {
    const parsed = parseAuthCallback(raw);
    if (parsed.kind === 'ignore' || !this.client) return { handled: false, ok: false };
    if (parsed.kind === 'error') return { handled: true, ok: false, message: parsed.message };
    const { error } = await this.client.auth.exchangeCodeForSession(parsed.code);
    if (error) return { handled: true, ok: false, message: error.message };
    return { handled: true, ok: true };
  }

  /** 계정 저장분(save_get / save_put)을 부르는 통로. 서버가 설정되지 않았으면 null. */
  get syncRpc(): SyncRpc | null {
    const client = this.client;
    if (!client) return null;
    const fix = <T,>(r: { data: unknown; error: { message: string; hint?: string } | null }) => ({ data: r.data as T | null, error: r.error ? { message: r.error.message, hint: r.error.hint } : null });
    return {
      saveGet: async () => fix(await client.rpc('save_get')),
      savePut: async (data, schemaVersion, expectedVersion, device) =>
        fix(await client.rpc('save_put', { p_data: data, p_schema_version: schemaVersion, p_expected_version: expectedVersion, p_device: device })),
    };
  }

  /** 서버 판정 게임(뽑기·뽑기권·컬렉션)을 부르는 통로. 서버가 설정되지 않았으면 null. */
  get serverRpc(): ServerRpc | null {
    const client = this.client;
    if (!client) return null;
    const wrap = <T,>(r: { data: unknown; error: { message: string; hint?: string } | null }) => ({ data: r.data as T | null, error: r.error ? { message: r.error.message, hint: r.error.hint } : null });
    // 네트워크 오류는 예외로 올라올 수 있어서 같은 모양의 오류 결과로 바꾼다.
    const guard = async <T,>(run: () => PromiseLike<{ data: unknown; error: { message: string; hint?: string } | null }>) => {
      try {
        return wrap<T>(await run());
      } catch (e) {
        return { data: null, error: { message: e instanceof Error ? e.message : String(e) } };
      }
    };
    return {
      call: <T,>(fn: string, args?: Record<string, unknown>) => guard<T>(() => client.rpc(fn, args)),
      select: <T,>(table: string, columns: string) => guard<T[]>(() => client.from(table).select(columns)),
      invoke: async <T,>(name: string) => {
        try {
          const r = await client.functions.invoke(name, { method: 'POST' });
          if (r.error) {
            // 함수가 돌려준 오류 내용({error: '...'})을 꺼내 준다(기본 메시지는 '2xx 아님' 뿐이라 원인을 알 수 없다).
            const ctx = (r.error as { context?: { json?: () => Promise<{ error?: string }>; status?: number } }).context;
            let detail = r.error.message;
            try {
              const body = await ctx?.json?.();
              if (body?.error) detail = `${body.error} (${ctx?.status ?? '?'})`;
            } catch { /* 본문이 JSON 이 아님 */ }
            console.error('함수 호출 실패', name, detail);
            return { data: null, error: { message: detail } };
          }
          return { data: r.data as T | null, error: null };
        } catch (e) {
          return { data: null, error: { message: e instanceof Error ? e.message : String(e) } };
        }
      },
    };
  }

  async signOut(): Promise<void> {
    if (!this.client) return;
    await this.client.auth.signOut();
    this.set(null);
  }
}

function defaultClient(config: BackendConfig, storage: EncryptedFileStorage): SupabaseClient {
  return createClient(config.url, config.anonKey, {
    auth: { flowType: 'pkce', persistSession: true, autoRefreshToken: true, detectSessionInUrl: false, storage },
  });
}

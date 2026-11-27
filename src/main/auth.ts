/**
 * GitHub 로그인(Supabase Auth, PKCE + 딥링크).
 * 로그인 흐름: 앱 → 기본 브라우저(GitHub 승인) → desktop-tamagotchi://auth?code=… → 앱이 코드를 세션으로 바꾼다.
 * 세션(리프레시 토큰 포함)은 OS 보안 저장소(Electron safeStorage)로 암호화해서 파일에 보관한다.
 * 규칙(주소 검사·저장 형식)은 순수 함수로 두어 Electron 없이 테스트한다.
 */
import fs from 'node:fs';
import path from 'node:path';
import { createClient, type Session, type SupabaseClient } from '@supabase/supabase-js';

export const AUTH_SCHEME = 'desktop-tamagotchi';
export const AUTH_REDIRECT = `${AUTH_SCHEME}://auth`;

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
  if (url.protocol !== `${AUTH_SCHEME}:` || url.hostname !== 'auth') return { kind: 'ignore' };
  const error = url.searchParams.get('error_description') ?? url.searchParams.get('error');
  if (error) return { kind: 'error', message: error.slice(0, 200) };
  const code = url.searchParams.get('code');
  if (!code || code.length > 2048) return { kind: 'ignore' };
  return { kind: 'code', code };
}

/** OS 암호화 기능(safeStorage)을 흉내 낼 수 있게 줄인 모양. */
export interface Crypto {
  isAvailable(): boolean;
  encrypt(text: string): Buffer;
  decrypt(data: Buffer): string;
}

/** Supabase 클라이언트가 세션을 맡기는 저장소: 한 파일에 통째로 암호화해서 둔다. 암호화를 쓸 수 없으면 아무것도 저장하지 않는다. */
export class EncryptedFileStorage {
  private cache: Record<string, string> | null = null;
  constructor(
    private readonly file: string,
    private readonly crypto: Crypto,
  ) {}

  private load(): Record<string, string> {
    if (this.cache) return this.cache;
    let data: Record<string, string> = {};
    try {
      if (this.crypto.isAvailable()) {
        const parsed: unknown = JSON.parse(this.crypto.decrypt(fs.readFileSync(this.file)));
        if (parsed && typeof parsed === 'object') {
          data = Object.fromEntries(Object.entries(parsed as Record<string, unknown>).filter(([, v]) => typeof v === 'string')) as Record<string, string>;
        }
      }
    } catch {
      data = {};
    }
    this.cache = data;
    return data;
  }

  private flush(): void {
    if (!this.crypto.isAvailable() || !this.cache) return;
    fs.mkdirSync(path.dirname(this.file), { recursive: true });
    const tmp = this.file + '.tmp';
    fs.writeFileSync(tmp, this.crypto.encrypt(JSON.stringify(this.cache)));
    fs.renameSync(tmp, this.file);
  }

  getItem(key: string): string | null {
    return this.load()[key] ?? null;
  }
  setItem(key: string, value: string): void {
    this.load()[key] = value;
    this.flush();
  }
  removeItem(key: string): void {
    delete this.load()[key];
    this.flush();
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

export interface AuthDeps {
  config: BackendConfig;
  storage: EncryptedFileStorage;
  openExternal: (url: string) => Promise<void> | void;
  /** 시험에서 가짜 클라이언트를 끼우기 위한 자리 */
  makeClient?: (config: BackendConfig, storage: EncryptedFileStorage) => SupabaseClient;
}

export class AuthService {
  private client: SupabaseClient | null = null;
  private current: AuthUser | null = null;
  private listeners: Array<(user: AuthUser | null) => void> = [];

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
    const { data, error } = await this.client.auth.signInWithOAuth({
      provider: 'github',
      options: { redirectTo: AUTH_REDIRECT, skipBrowserRedirect: true, scopes: 'read:user' },
    });
    if (error || !data.url) throw new Error(error?.message ?? '로그인 주소를 만들지 못했어요');
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

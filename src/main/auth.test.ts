import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import type { Session, SupabaseClient } from '@supabase/supabase-js';
import { AuthService, EncryptedFileStorage, LOOPBACK_PORT, isConfigured, parseAuthCallback, startLoopback, toAuthUser, type Crypto } from './auth.js';

const fakeCrypto = (available = true): Crypto => ({
  isAvailable: () => available,
  encrypt: (t) => Buffer.from(t, 'utf8').reverse(),
  decrypt: (b) => Buffer.from(b).reverse().toString('utf8'),
});
const tmpFile = () => path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'pet-auth-')), 'auth.bin');

describe('isConfigured', () => {
  it('https 주소와 충분히 긴 키가 있어야 켠다', () => {
    expect(isConfigured({ url: '', anonKey: '' })).toBe(false);
    expect(isConfigured({ url: 'http://x.supabase.co', anonKey: 'a'.repeat(40) })).toBe(false);
    expect(isConfigured({ url: 'https://x.supabase.co', anonKey: 'short' })).toBe(false);
    expect(isConfigured({ url: 'https://x.supabase.co', anonKey: 'a'.repeat(40) })).toBe(true);
  });
});

describe('parseAuthCallback', () => {
  it('우리 주소의 코드를 꺼낸다', () => {
    expect(parseAuthCallback('desktop-tamagotchi://auth?code=abc123')).toEqual({ kind: 'code', code: 'abc123' });
  });
  it('내 PC 안의 임시 주소(127.0.0.1)로 돌아온 코드도 받는다', () => {
    expect(parseAuthCallback(`http://127.0.0.1:${LOOPBACK_PORT}/auth/callback?code=abc`)).toEqual({ kind: 'code', code: 'abc' });
  });
  it('다른 포트·다른 호스트·다른 경로의 http 주소는 무시한다', () => {
    expect(parseAuthCallback('http://127.0.0.1:9999/auth/callback?code=abc')).toEqual({ kind: 'ignore' });
    expect(parseAuthCallback(`http://evil.example:${LOOPBACK_PORT}/auth/callback?code=abc`)).toEqual({ kind: 'ignore' });
    expect(parseAuthCallback(`http://127.0.0.1:${LOOPBACK_PORT}/other?code=abc`)).toEqual({ kind: 'ignore' });
  });
  it('오류는 메시지로 돌려준다', () => {
    expect(parseAuthCallback('desktop-tamagotchi://auth?error=access_denied&error_description=denied')).toEqual({ kind: 'error', message: 'denied' });
  });
  it('다른 주소·다른 경로·코드 없음은 무시한다', () => {
    expect(parseAuthCallback('https://evil.example/auth?code=abc')).toEqual({ kind: 'ignore' });
    expect(parseAuthCallback('desktop-tamagotchi://other?code=abc')).toEqual({ kind: 'ignore' });
    expect(parseAuthCallback('desktop-tamagotchi://auth')).toEqual({ kind: 'ignore' });
    expect(parseAuthCallback('not a url')).toEqual({ kind: 'ignore' });
  });
  it('너무 긴 코드는 무시한다', () => {
    expect(parseAuthCallback('desktop-tamagotchi://auth?code=' + 'a'.repeat(3000))).toEqual({ kind: 'ignore' });
  });
});

describe('EncryptedFileStorage', () => {
  it('저장한 값을 다시 읽고, 파일에는 평문이 없다', () => {
    const file = tmpFile();
    const s = new EncryptedFileStorage(file, fakeCrypto());
    s.setItem('k', 'secret-refresh-token');
    expect(new EncryptedFileStorage(file, fakeCrypto()).getItem('k')).toBe('secret-refresh-token');
    expect(fs.readFileSync(file, 'utf8')).not.toContain('secret-refresh-token');
  });
  it('지운 값은 사라진다', () => {
    const file = tmpFile();
    const s = new EncryptedFileStorage(file, fakeCrypto());
    s.setItem('k', 'v');
    s.removeItem('k');
    expect(new EncryptedFileStorage(file, fakeCrypto()).getItem('k')).toBeNull();
  });
  it('암호화를 쓸 수 없으면 파일에 아무것도 쓰지 않는다', () => {
    const file = tmpFile();
    const s = new EncryptedFileStorage(file, fakeCrypto(false));
    s.setItem('k', 'v');
    expect(fs.existsSync(file)).toBe(false);
  });
  it('깨진 파일은 빈 저장소로 본다', () => {
    const file = tmpFile();
    fs.writeFileSync(file, 'garbage');
    expect(new EncryptedFileStorage(file, fakeCrypto()).getItem('k')).toBeNull();
  });
});

describe('startLoopback', () => {
  it('로그인 결과를 한 번 받고 닫힌다', async () => {
    const got: string[] = [];
    const h = await startLoopback((u) => got.push(u), 5_000);
    const ok = await fetch(`http://127.0.0.1:${LOOPBACK_PORT}/auth/callback?code=abc123`);
    expect(ok.status).toBe(200);
    expect(await ok.text()).toContain('로그인이 끝났어요');
    expect(got).toEqual([`http://127.0.0.1:${LOOPBACK_PORT}/auth/callback?code=abc123`]);
    await expect(fetch(`http://127.0.0.1:${LOOPBACK_PORT}/auth/callback?code=again`)).rejects.toThrow();
    h.close();
  });
  it('엉뚱한 요청은 404 로 무시하고 계속 기다린다', async () => {
    const got: string[] = [];
    const h = await startLoopback((u) => got.push(u), 5_000);
    expect((await fetch(`http://127.0.0.1:${LOOPBACK_PORT}/favicon.ico`)).status).toBe(404);
    expect(got).toEqual([]);
    h.close();
  });
});

describe('toAuthUser', () => {
  const session = (meta: Record<string, unknown>) => ({ user: { id: 'u1', user_metadata: meta } }) as unknown as Session;
  it('GitHub 이름과 아바타를 꺼낸다', () => {
    expect(toAuthUser(session({ user_name: 'junhooo111', avatar_url: 'https://a/x.png' }))).toEqual({ id: 'u1', login: 'junhooo111', avatarUrl: 'https://a/x.png' });
  });
  it('이름이 없으면 기본 문구', () => {
    expect(toAuthUser(session({}))?.login).toBe('GitHub 사용자');
  });
  it('세션이 없으면 null', () => {
    expect(toAuthUser(null)).toBeNull();
  });
});

describe('AuthService', () => {
  const config = { url: 'https://x.supabase.co', anonKey: 'a'.repeat(40) };
  function fakeClient() {
    const calls = { exchange: [] as string[], signOut: 0 };
    let handler: ((e: string, s: Session | null) => void) | null = null;
    const client = {
      auth: {
        onAuthStateChange: (cb: (e: string, s: Session | null) => void) => {
          handler = cb;
          return { data: { subscription: { unsubscribe() {} } } };
        },
        getSession: async () => ({ data: { session: { user: { id: 'u1', user_metadata: { user_name: 'me' } } } as unknown as Session } }),
        signInWithOAuth: async () => ({ data: { url: 'https://github.com/login/oauth/authorize?x=1' }, error: null }),
        exchangeCodeForSession: async (code: string) => {
          calls.exchange.push(code);
          handler?.('SIGNED_IN', { user: { id: 'u1', user_metadata: { user_name: 'me' } } } as unknown as Session);
          return { error: null };
        },
        signOut: async () => {
          calls.signOut++;
          return { error: null };
        },
      },
    } as unknown as SupabaseClient;
    return { client, calls };
  }
  const make = (cfg = config) => {
    const { client, calls } = fakeClient();
    const openExternal = vi.fn();
    const svc = new AuthService({ config: cfg, storage: new EncryptedFileStorage(tmpFile(), fakeCrypto()), openExternal, makeClient: () => client, startLoopback: async () => ({ close() {} }) });
    return { svc, calls, openExternal };
  };

  it('설정이 비어 있으면 꺼져 있고 로그인하려 하면 오류', async () => {
    const { svc } = make({ url: '', anonKey: '' });
    expect(svc.enabled).toBe(false);
    await expect(svc.signIn()).rejects.toThrow();
    expect(await svc.restore()).toBeNull();
  });
  it('signIn 은 브라우저로 로그인 주소를 연다', async () => {
    const { svc, openExternal } = make();
    await svc.signIn();
    expect(openExternal).toHaveBeenCalledWith('https://github.com/login/oauth/authorize?x=1');
  });
  it('딥링크 코드를 세션으로 바꾸고 사용자를 알린다', async () => {
    const { svc, calls } = make();
    const seen: Array<string | null> = [];
    svc.onChange((u) => seen.push(u?.login ?? null));
    const r = await svc.handleCallback('desktop-tamagotchi://auth?code=abc');
    expect(r).toEqual({ handled: true, ok: true });
    expect(calls.exchange).toEqual(['abc']);
    expect(svc.user?.login).toBe('me');
    expect(seen).toEqual(['me']);
  });
  it('남의 주소는 처리하지 않는다', async () => {
    const { svc, calls } = make();
    expect(await svc.handleCallback('https://evil.example/?code=abc')).toEqual({ handled: false, ok: false });
    expect(calls.exchange).toEqual([]);
  });
  it('오류 딥링크는 실패와 메시지를 돌려준다', async () => {
    const { svc } = make();
    expect(await svc.handleCallback('desktop-tamagotchi://auth?error_description=nope')).toEqual({ handled: true, ok: false, message: 'nope' });
  });
  it('restore 는 저장된 세션을 복원하고 signOut 은 비운다', async () => {
    const { svc, calls } = make();
    expect((await svc.restore())?.login).toBe('me');
    await svc.signOut();
    expect(calls.signOut).toBe(1);
    expect(svc.user).toBeNull();
  });
});

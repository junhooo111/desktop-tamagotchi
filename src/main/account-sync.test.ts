import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import {
  AccountSync,
  SAVE_FILES,
  applySnapshot,
  backupLocal,
  hasProgress,
  isValidSnapshot,
  loadState,
  readSnapshot,
  summarize,
  type Choice,
  type RpcResult,
  type SaveRow,
  type Snapshot,
  type SyncRpc,
} from './account-sync.js';

const tmpDir = () => fs.mkdtempSync(path.join(os.tmpdir(), 'pet-sync-'));
const write = (dir: string, name: string, v: unknown) => fs.writeFileSync(path.join(dir, name), JSON.stringify(v));
const read = (dir: string, name: string) => JSON.parse(fs.readFileSync(path.join(dir, name), 'utf8'));

const freshFiles = { 'pet.json': { speciesId: 'rabbit' }, 'collection.json': { owned: { rabbit: {} }, tickets: 3, pulls: 0 }, 'growth.json': { days: ['2026-11-27'], counters: { care: 5 }, achievements: {} } };
const playedFiles = { 'pet.json': { speciesId: 'cat' }, 'collection.json': { owned: { cat: {}, dog: {}, rabbit: {} }, tickets: 9, pulls: 12 }, 'growth.json': { days: ['a', 'b', 'c'], counters: { care: 80 }, achievements: { first: 1 } } };
const putFiles = (dir: string, files: Record<string, unknown>) => Object.entries(files).forEach(([k, v]) => write(dir, k, v));
const snap = (files: Record<string, unknown>): Snapshot => ({ schema: 1, appVersion: '0.9.0', files });

function fakeServer(initial: SaveRow | null) {
  let row = initial;
  const calls = { put: [] as number[] };
  const rpc: SyncRpc = {
    saveGet: async () => ({ data: row, error: null }) as RpcResult<SaveRow | null>,
    savePut: async (data, _schema, expected, device) => {
      calls.put.push(expected);
      if (expected !== (row?.version ?? 0)) return { data: null, error: { message: 'version_conflict' } };
      row = { version: (row?.version ?? 0) + 1, schema_version: 1, data, device, updated_at: '2026-11-27T00:00:00Z' };
      return { data: { version: row.version }, error: null };
    },
  };
  return { rpc, calls, get row() { return row; } };
}

function make(dir: string, server: ReturnType<typeof fakeServer>, choice: Choice = 'account') {
  const say = vi.fn();
  const restart = vi.fn();
  const ask = vi.fn(async () => choice);
  const sync = new AccountSync({ rpc: server.rpc, dir, appVersion: '0.9.0', device: 'pc-test', flush: () => {}, ask, restartWithNewSave: restart, say });
  return { sync, say, restart, ask };
}

describe('규칙', () => {
  it('처음 설치한 상태(알 한 개)는 진행이 아니고, 뽑거나 여러 마리면 진행이다', () => {
    expect(hasProgress(snap(freshFiles))).toBe(false);
    expect(hasProgress(snap(playedFiles))).toBe(true);
  });
  it('요약', () => {
    expect(summarize(snap(playedFiles))).toEqual({ pets: 3, tickets: 9, pulls: 12 });
  });
  it('받아 온 저장분은 우리가 아는 파일만 허용한다', () => {
    expect(isValidSnapshot(snap(playedFiles))).toBe(true);
    expect(isValidSnapshot(snap({ ...playedFiles, '../evil.json': {} }))).toBe(false);
    expect(isValidSnapshot({ schema: 99, files: playedFiles })).toBe(false);
    expect(isValidSnapshot({ schema: 1, files: { 'pet.json': {} } })).toBe(false);
  });
  it('읽기·쓰기·백업(최근 10개만)', () => {
    const dir = tmpDir();
    putFiles(dir, playedFiles);
    const s = readSnapshot(dir, '0.9.0');
    expect(Object.keys(s.files).sort()).toEqual(['collection.json', 'growth.json', 'pet.json']);
    for (let i = 0; i < 12; i++) backupLocal(dir, 't' + i, 1_000_000 + i * 1000);
    expect(fs.readdirSync(path.join(dir, 'backups'))).toHaveLength(10);
    const other = tmpDir();
    applySnapshot(other, snap({ ...playedFiles, 'evil.json': { x: 1 } } as Record<string, unknown>));
    expect(fs.existsSync(path.join(other, 'evil.json'))).toBe(false);
    expect(read(other, 'collection.json').tickets).toBe(9);
    expect(SAVE_FILES).toContain('progress.json');
  });
});

describe('AccountSync.reconcile', () => {
  it('서버가 비어 있고 이 PC에 진행이 있으면 백업 후 올린다', async () => {
    const dir = tmpDir();
    putFiles(dir, playedFiles);
    const server = fakeServer(null);
    const { sync, say } = make(dir, server);
    await sync.reconcile('u1');
    expect(server.calls.put).toEqual([0]);
    expect(server.row?.version).toBe(1);
    expect(loadState(path.join(dir, 'sync-state.json'))).toEqual({ userId: 'u1', version: 1 });
    expect(fs.readdirSync(path.join(dir, 'backups')).some((n) => n.endsWith('before-first-upload'))).toBe(true);
    expect(say).toHaveBeenCalled();
  });

  it('서버도 비어 있고 이 PC도 처음 상태면 아무것도 하지 않는다', async () => {
    const dir = tmpDir();
    putFiles(dir, freshFiles);
    const server = fakeServer(null);
    const { sync } = make(dir, server);
    await sync.reconcile('u1');
    expect(server.calls.put).toEqual([]);
  });

  it('다른 PC에서 새로 설치했으면 묻지 않고 계정 진행을 받아 오고 다시 시작한다(백업은 남긴다)', async () => {
    const dir = tmpDir();
    putFiles(dir, freshFiles);
    const server = fakeServer({ version: 4, schema_version: 1, data: snap(playedFiles), device: 'pc-a', updated_at: '2026-11-26T00:00:00Z' });
    const { sync, restart, ask } = make(dir, server);
    await sync.reconcile('u1');
    expect(ask).not.toHaveBeenCalled();
    expect(read(dir, 'collection.json').pulls).toBe(12);
    expect(restart).toHaveBeenCalledOnce();
    expect(loadState(path.join(dir, 'sync-state.json'))).toEqual({ userId: 'u1', version: 4 });
    expect(fs.readdirSync(path.join(dir, 'backups')).some((n) => n.endsWith('before-download'))).toBe(true);
  });

  it('양쪽에 진행이 있으면 자동으로 덮어쓰지 않고 묻는다 — 계정 것을 고르면 받아 온다', async () => {
    const dir = tmpDir();
    putFiles(dir, { ...playedFiles, 'collection.json': { owned: { x: {}, y: {} }, tickets: 1, pulls: 3 } });
    const server = fakeServer({ version: 2, schema_version: 1, data: snap(playedFiles), device: 'pc-a', updated_at: '2026-11-26T00:00:00Z' });
    const { sync, restart, ask } = make(dir, server, 'account');
    await sync.reconcile('u1');
    expect(ask).toHaveBeenCalledOnce();
    expect(read(dir, 'collection.json').pulls).toBe(12);
    expect(restart).toHaveBeenCalledOnce();
  });

  it('이 PC 것을 고르면 서버의 현재 버전을 보고 덮어쓴다', async () => {
    const dir = tmpDir();
    const mine = { ...playedFiles, 'collection.json': { owned: { x: {}, y: {} }, tickets: 1, pulls: 3 } };
    putFiles(dir, mine);
    const server = fakeServer({ version: 2, schema_version: 1, data: snap(playedFiles), device: 'pc-a', updated_at: '2026-11-26T00:00:00Z' });
    const { sync, restart } = make(dir, server, 'local');
    await sync.reconcile('u1');
    expect(server.calls.put).toEqual([2]);
    expect(server.row?.version).toBe(3);
    expect((server.row?.data.files['collection.json'] as { pulls: number }).pulls).toBe(3);
    expect(restart).not.toHaveBeenCalled();
  });

  it('나중에를 고르면 아무것도 바꾸지 않고, 그동안 주기 저장도 멈춘다', async () => {
    const dir = tmpDir();
    putFiles(dir, playedFiles);
    const server = fakeServer({ version: 2, schema_version: 1, data: snap({ ...playedFiles, 'collection.json': { owned: { z: {} }, tickets: 0, pulls: 1 } }), device: 'pc-a', updated_at: 'x' });
    const { sync } = make(dir, server, 'later');
    await sync.reconcile('u1');
    await sync.tick('u1');
    expect(server.calls.put).toEqual([]);
    expect(server.row?.version).toBe(2);
  });

  it('이미 맞춰 둔 상태면 묻지 않고 변경을 올린다', async () => {
    const dir = tmpDir();
    putFiles(dir, playedFiles);
    const server = fakeServer(null);
    const a = make(dir, server);
    await a.sync.reconcile('u1'); // 버전 1
    write(dir, 'collection.json', { ...playedFiles['collection.json'], tickets: 10 });
    const b = make(dir, server);
    await b.sync.reconcile('u1');
    expect(b.ask).not.toHaveBeenCalled();
    expect(server.row?.version).toBe(2);
  });

  it('주기 저장 중 다른 PC가 먼저 저장했으면 거절되고 멈춘다(덮어쓰지 않는다)', async () => {
    const dir = tmpDir();
    putFiles(dir, playedFiles);
    const server = fakeServer(null);
    const { sync, say } = make(dir, server);
    await sync.reconcile('u1'); // 서버 v1, 이 PC 상태 v1
    await server.rpc.savePut(snap(playedFiles), 1, 1, 'pc-b'); // 다른 PC가 v2 로 저장
    write(dir, 'collection.json', { ...playedFiles['collection.json'], tickets: 77 });
    await sync.tick('u1');
    expect(server.row?.version).toBe(2);
    expect((server.row?.data.files['collection.json'] as { tickets: number }).tickets).toBe(9);
    expect(say).toHaveBeenLastCalledWith(expect.stringContaining('다른 PC에서 먼저 저장'));
    await sync.tick('u1');
    expect(server.calls.put.filter((e) => e === 1)).toHaveLength(2); // 멈춘 뒤에는 더 시도하지 않는다(처음 올림 + 위 pc-b + 거절된 한 번)
  });

  it('서버의 저장분이 깨졌으면 건드리지 않는다', async () => {
    const dir = tmpDir();
    putFiles(dir, playedFiles);
    const server = fakeServer({ version: 2, schema_version: 1, data: { schema: 1, appVersion: '', files: { 'evil.json': {} } }, device: null, updated_at: 'x' });
    const { sync, restart } = make(dir, server);
    await sync.reconcile('u1');
    expect(restart).not.toHaveBeenCalled();
    expect(read(dir, 'collection.json').pulls).toBe(12);
  });
});

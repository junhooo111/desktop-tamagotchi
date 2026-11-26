/** MacAutoUpdater 에 실제 네트워크·파일·프로세스를 연결한다(Electron·Node 에 묶인 얇은 부분이라 테스트하지 않는다). */
import { execFile, spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { app } from 'electron';
import { MacAutoUpdater, appBundleOf, type MacArch } from './mac-updater.js';

export function createMacUpdater(): MacAutoUpdater {
  const base = path.join(app.getPath('temp'), 'desktop-tamagotchi-update');
  return new MacAutoUpdater({
    currentVersion: app.getVersion(),
    arch: (process.arch === 'arm64' ? 'arm64' : 'x64') satisfies MacArch,
    appPath: appBundleOf(process.execPath),
    async fetchJson(url) {
      const res = await fetch(url, { signal: AbortSignal.timeout(15_000), headers: { accept: 'application/json' } });
      if (!res.ok) throw new Error(`업데이트 정보를 받지 못했습니다 (${res.status})`);
      return res.json();
    },
    async download(url, dest) {
      const res = await fetch(url, { signal: AbortSignal.timeout(15 * 60_000) });
      if (!res.ok || !res.body) throw new Error(`업데이트 파일을 받지 못했습니다 (${res.status})`);
      await pipeline(Readable.fromWeb(res.body as never), fs.createWriteStream(dest));
    },
    async sha512(file) {
      const hash = createHash('sha512');
      await pipeline(fs.createReadStream(file), hash);
      return hash.digest('hex');
    },
    extract: (zip, dir) =>
      new Promise((resolve, reject) => {
        fs.mkdirSync(dir, { recursive: true });
        // ditto 는 맥에 기본으로 있고 심볼릭 링크·권한을 보존해서 푼다.
        execFile('/usr/bin/ditto', ['-x', '-k', zip, dir], (error) => (error ? reject(error) : resolve()));
      }),
    async workDir() {
      fs.rmSync(base, { recursive: true, force: true });
      fs.mkdirSync(base, { recursive: true });
      return base;
    },
    exists: (file) => fs.existsSync(file),
    writeScript(content) {
      const file = path.join(app.getPath('temp'), 'desktop-tamagotchi-update.sh');
      fs.writeFileSync(file, content, { mode: 0o755 });
      return file;
    },
    spawnScript(script) {
      // 앱이 끝나도 계속 도는 별도 프로세스로 실행한다.
      spawn('/bin/sh', [script], { detached: true, stdio: 'ignore' }).unref();
    },
    pid: process.pid,
    quit: () => app.quit(),
  });
}

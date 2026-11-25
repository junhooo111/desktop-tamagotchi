import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { RULE_IDS } from '../shared/lessons.js';

const dir = path.join(process.cwd(), 'extension');
const manifest = JSON.parse(fs.readFileSync(path.join(dir, 'manifest.json'), 'utf8')) as {
  manifest_version: number;
  permissions?: string[];
  host_permissions: string[];
  content_scripts: { matches: string[]; js: string[] }[];
};

describe('확장 manifest 의 권한', () => {
  it('MV3 이고, 특별한 API 권한(tabs·cookies 등)을 요청하지 않는다', () => {
    expect(manifest.manifest_version).toBe(3);
    expect(manifest.permissions ?? []).toEqual([]);
  });

  it('외부로 연결할 수 있는 곳은 이 PC 의 펫 앱(127.0.0.1)뿐이다', () => {
    expect(manifest.host_permissions).toEqual(['http://127.0.0.1:47831/*']);
  });

  it('검사 스크립트는 localhost 계열 페이지에만 들어간다', () => {
    const matches = manifest.content_scripts.flatMap((c) => c.matches);
    expect(matches.length).toBeGreaterThan(0);
    for (const m of matches) {
      expect(m, m).toMatch(/^https?:\/\/(localhost|127\.0\.0\.1|\*\.localhost|\[::1\])\/\*$/);
    }
  });
});

describe('확장 content.js', () => {
  const content = fs.readFileSync(path.join(dir, 'content.js'), 'utf8');

  it('앱이 쓰는 검사 규칙이 모두 들어 있다(npm run build 가 다시 만든다)', () => {
    for (const id of RULE_IDS) expect(content, id).toContain("'" + id + "'");
  });

  it('문법이 올바르고, 앱이 아닌 곳으로 보내는 코드(fetch·XHR 등)가 없다', () => {
    expect(() => new Function(content)).not.toThrow();
    expect(content).not.toMatch(/\bfetch\s*\(/);
    expect(content).not.toMatch(/XMLHttpRequest|WebSocket|sendBeacon/);
  });
});

describe('확장 background.js', () => {
  const bg = fs.readFileSync(path.join(dir, 'background.js'), 'utf8');

  it('이 확장의 콘텐츠 스크립트가 localhost 탭에서 보낸 것만 전달하고, 보내는 곳은 펫 앱 하나다', () => {
    expect(bg).toContain('sender.id !== chrome.runtime.id');
    expect(bg).toContain('isLocalPage(sender.tab.url)');
    const urls = bg.match(/https?:\/\/[^'"`\s)]+/g) ?? [];
    expect(new Set(urls)).toEqual(new Set(['http://127.0.0.1:47831']));
  });
});

describe('설치본에 확장 폴더 포함', () => {
  it('electron-builder 가 extension 폴더를 resources/extension 으로 넣는다(설치한 사람이 크롬에 로드할 수 있게)', () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf8')) as {
      build: { extraResources: { from: string; to: string }[] };
    };
    expect(pkg.build.extraResources).toContainEqual({ from: 'extension', to: 'extension' });
  });
});

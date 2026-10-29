import { describe, it, expect } from 'vitest';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { existsSync, mkdtempSync, writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { findBrowser, hasWebUi, launchApp } from './app-launcher';
import { shootScript } from './shoot-script';

const run = promisify(execFile);
const browser = findBrowser();
const project = (files: Record<string, string>) => {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'forge-vis-proj-'));
  for (const [f, c] of Object.entries(files)) {
    mkdirSync(path.dirname(path.join(dir, f)), { recursive: true });
    writeFileSync(path.join(dir, f), c);
  }
  return dir;
};

// A deliberately bad page: a 900px-wide box on a phone, 9px text, and a script error.
const BAD_PAGE = `<!doctype html><html><head><meta name="viewport" content="width=device-width"></head>
<body><h1>Expenses</h1><div style="width:900px;background:#eee">wide table</div><p style="font-size:9px">tiny print</p>
<script>window.notDefined()</script></body></html>`;

describe('visual gate tools', () => {
  it('knows which projects have a web UI', async () => {
    expect(await hasWebUi(project({ 'index.html': '<h1>x</h1>' }))).toBe(true);
    expect(await hasWebUi(project({ 'package.json': JSON.stringify({ dependencies: { react: '^18' } }) }))).toBe(true);
    expect(await hasWebUi(project({ 'cli.js': 'console.log(1)' }))).toBe(false);
  });

  it('runs a project with its own server (npm start + PORT) in a throwaway copy', async () => {
    const dir = project({
      'package.json': JSON.stringify({ name: 'srv', scripts: { start: 'node server.js' } }),
      'server.js': `require('http').createServer((q, s) => { require('fs').writeFileSync('touched.txt', 'x'); s.end('<h1>hello</h1>'); }).listen(process.env.PORT, '127.0.0.1')`,
    });
    const app = await launchApp(dir, 60_000);
    try {
      expect(await (await fetch(app.url)).text()).toContain('hello');
      expect(existsSync(path.join(dir, 'touched.txt'))).toBe(false); // the real project is never modified
    } finally {
      await app.stop();
    }
  }, 90_000);

  it.skipIf(!browser)('screenshots desktop and phone and measures real layout problems', async () => {
    const app = await launchApp(project({ 'index.html': BAD_PAGE }), 30_000);
    const work = mkdtempSync(path.join(os.tmpdir(), 'forge-vis-shots-'));
    try {
      writeFileSync(path.join(work, 'shoot.cjs'), shootScript(require.resolve('playwright-core'), browser!, app.url));
      const { stdout } = await run(process.execPath, ['shoot.cjs', 'first'], { cwd: work, timeout: 90_000 });
      const report = JSON.parse(stdout.slice(0, stdout.lastIndexOf('}') + 1));
      expect(existsSync(path.join(work, 'first-desktop.png'))).toBe(true);
      expect(readFileSync(path.join(work, 'first-phone.png')).length).toBeGreaterThan(1000);
      expect(report.phone.horizontalOverflow).toBe(true);
      expect(report.phone.tinyText.join(' ')).toContain('tiny print');
      expect(report.desktop.consoleErrors.join(' ')).toMatch(/notDefined/);
    } finally {
      await app.stop();
    }
  }, 120_000);
});

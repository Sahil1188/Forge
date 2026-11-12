import { ChildProcess, execFile, spawn } from 'node:child_process';
import { cp, mkdtemp, readFile, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { createServer, Server } from 'node:http';
import { AddressInfo, createServer as createNetServer } from 'node:net';
import * as os from 'node:os';
import * as path from 'node:path';
import { promisify } from 'node:util';
import { commandEnv } from '../../../infrastructure/security/safe-env';
import { killTree, stopProcessesIn } from '../../../workers/process-cleanup';

const run = promisify(execFile);

/** Chrome, Edge or Chromium for screenshots: FORGE_BROWSER_PATH, else the usual install locations. */
export function findBrowser(env: NodeJS.ProcessEnv = process.env): string | null {
  const candidates = [
    env.FORGE_BROWSER_PATH,
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  ];
  return candidates.find((p) => p && existsSync(p)) ?? null;
}

interface Pkg {
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

async function readPkg(dir: string): Promise<Pkg | null> {
  try {
    return JSON.parse(await readFile(path.join(dir, 'package.json'), 'utf8')) as Pkg;
  } catch {
    return null;
  }
}

/** Whether a project has something to look at in a browser. */
export async function hasWebUi(dir: string): Promise<boolean> {
  const pkg = await readPkg(dir);
  const deps = { ...(pkg?.dependencies ?? {}), ...(pkg?.devDependencies ?? {}) };
  if (
    ['react', 'vue', 'svelte', 'next', 'vite', '@angular/core', 'solid-js', 'preact'].some(
      (d) => d in deps,
    )
  )
    return true;
  return ['index.html', 'public/index.html', 'src/index.html', 'static/index.html'].some((f) =>
    existsSync(path.join(dir, f)),
  );
}

async function freePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const s = createNetServer();
    s.once('error', reject);
    s.listen(0, '127.0.0.1', () => {
      const port = (s.address() as AddressInfo).port;
      s.close(() => resolve(port));
    });
  });
}

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.webp': 'image/webp',
};

/** A tiny static server with single-page-app fallback, for projects without their own server. */
function serveStatic(dir: string, port: number): Promise<Server> {
  const server = createServer(async (req, res) => {
    const urlPath = decodeURIComponent((req.url ?? '/').split('?')[0]);
    let file = path.join(dir, urlPath);
    if (!file.startsWith(dir)) return void res.writeHead(403).end();
    try {
      if ((await stat(file)).isDirectory()) file = path.join(file, 'index.html');
    } catch {
      file = path.join(dir, 'index.html');
    }
    try {
      const body = await readFile(file);
      res
        .writeHead(200, { 'content-type': MIME[path.extname(file)] ?? 'application/octet-stream' })
        .end(body);
    } catch {
      res.writeHead(404).end();
    }
  });
  return new Promise((resolve) => server.listen(port, '127.0.0.1', () => resolve(server)));
}

export interface RunningApp {
  url: string;
  copyDir: string;
  stop(): Promise<void>;
  log(): string;
}

/**
 * Starts a project the way a user would — install, build, start — in a throwaway copy, so whatever
 * the app writes (data files, caches) never touches the real project. Waits until it answers HTTP.
 */
export async function launchApp(projectDir: string, timeoutMs = 120_000): Promise<RunningApp> {
  const copyDir = await mkdtemp(path.join(os.tmpdir(), 'forge-visual-app-'));
  await cp(projectDir, copyDir, {
    recursive: true,
    filter: (src) => !/[\\/](\.git|node_modules)([\\/]|$)/.test(src.slice(projectDir.length)),
  });
  const env = { ...commandEnv(), BROWSER: 'none', CI: '1' };
  let output = '';
  const note = (s: string) => (output = (output + s).slice(-6000));

  const pkg = await readPkg(copyDir);
  const deps = { ...(pkg?.dependencies ?? {}), ...(pkg?.devDependencies ?? {}) };
  if (Object.keys(deps).length) {
    const r = await run('npm', ['install', '--no-audit', '--no-fund'], {
      cwd: copyDir,
      env,
      shell: true,
      timeout: 300_000,
      maxBuffer: 20 * 1024 * 1024,
      windowsHide: true,
    }).catch((e) => e);
    note(`$ npm install\n${r.stdout ?? ''}${r.stderr ?? ''}`);
  }
  if (pkg?.scripts?.build) {
    const r = await run('npm', ['run', 'build'], {
      cwd: copyDir,
      env,
      shell: true,
      timeout: 300_000,
      maxBuffer: 20 * 1024 * 1024,
      windowsHide: true,
    }).catch((e) => e);
    note(`$ npm run build\n${r.stdout ?? ''}${r.stderr ?? ''}`);
  }

  const port = await freePort();
  const candidates = new Set<string>([`http://127.0.0.1:${port}/`]);
  let child: ChildProcess | undefined;
  let staticServer: Server | undefined;
  const script = pkg?.scripts?.start
    ? 'start'
    : pkg?.scripts?.preview
      ? 'preview'
      : pkg?.scripts?.dev
        ? 'dev'
        : null;
  if (script) {
    const args =
      script === 'start'
        ? ['start']
        : ['run', script, '--', '--port', String(port), '--host', '127.0.0.1'];
    child = spawn('npm', args, {
      cwd: copyDir,
      env: { ...env, PORT: String(port), HOST: '127.0.0.1' },
      shell: true,
      windowsHide: true,
      detached: process.platform !== 'win32',
    });
    const watch = (b: Buffer) => {
      const s = b.toString();
      note(s);
      for (const m of s.matchAll(
        /https?:\/\/(?:localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1?\]):(\d{2,5})/g,
      ))
        candidates.add(`http://127.0.0.1:${m[1]}/`);
    };
    child.stdout?.on('data', watch);
    child.stderr?.on('data', watch);
  } else {
    const dir = ['dist', 'build', 'public', '.']
      .map((d) => path.join(copyDir, d))
      .find((d) => existsSync(path.join(d, 'index.html')));
    if (!dir)
      throw new Error('No way to run this project: no start/preview/dev script and no index.html.');
    staticServer = await serveStatic(dir, port);
  }

  const stop = async () => {
    staticServer?.close();
    await killTree(child?.pid);
    child?.kill();
    await stopProcessesIn(copyDir);
  };

  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (child && child.exitCode !== null) break;
    for (const url of candidates) {
      try {
        const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
        if (res.status < 500) return { url, copyDir, stop, log: () => output };
      } catch {
        /* not up yet */
      }
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  await stop();
  throw new Error(
    `The app did not start (tried ${[...candidates].join(', ')}).\n${output.slice(-2000)}`,
  );
}

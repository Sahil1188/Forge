import { execFileSync } from 'node:child_process';
import { mkdtemp, mkdir, readFile, readdir, realpath, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import * as path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { DockerCommandSandbox } from '../src/modules/runtimes/custom/command-sandbox';

function dockerUp(): boolean {
  try {
    execFileSync('docker', ['info'], { stdio: 'ignore', timeout: 15_000 });
    return true;
  } catch {
    return false;
  }
}

/**
 * Real-container tests of the isolation the sandbox claims (spec §11). They run only when
 * a Docker daemon is reachable; the first run may pull the sandbox image.
 */
describe.skipIf(!dockerUp())('DockerCommandSandbox — real isolation', () => {
  let root: string;
  let ws: string;
  let outside: string;
  const sandbox = new DockerCommandSandbox();

  beforeAll(async () => {
    root = await realpath(await mkdtemp(path.join(tmpdir(), 'forge-sbx-e2e-')));
    ws = path.join(root, 'workspace');
    outside = path.join(root, 'outside');
    await mkdir(ws, { recursive: true });
    await mkdir(outside, { recursive: true });
    await writeFile(path.join(outside, 'secret.txt'), 'TOP-SECRET-HOST-FILE');
    // Warm the image so per-test timeouts measure the sandbox, not a registry pull.
    await sandbox.run('true', ws);
  }, 300_000);

  afterAll(async () => {
    await rm(root, { recursive: true, force: true });
  });

  it('runs a command with the workspace as /work and returns its output', async () => {
    const r = await sandbox.run('pwd && echo hello-from-container', ws);
    expect(r.isError).toBe(false);
    expect(r.output).toContain('/work');
    expect(r.output).toContain('hello-from-container');
  }, 60_000);

  it('files created in the container appear in the host workspace (the mount is live)', async () => {
    const r = await sandbox.run('echo built > artifact.txt', ws);
    expect(r.isError).toBe(false);
    expect(await readFile(path.join(ws, 'artifact.txt'), 'utf8')).toContain('built');
  }, 60_000);

  it('files already in the workspace are visible to the command', async () => {
    await writeFile(path.join(ws, 'input.txt'), 'from-host');
    const r = await sandbox.run('cat input.txt', ws);
    expect(r.output).toContain('from-host');
  }, 60_000);

  it('cannot see host files outside the workspace', async () => {
    const r = await sandbox.run(`cat "${path.join(outside, 'secret.txt').replace(/\\/g, '/')}"`, ws);
    expect(r.isError).toBe(true);
    expect(r.output).not.toContain('TOP-SECRET-HOST-FILE');
  }, 60_000);

  it('cannot walk out of /work to reach the host through relative paths', async () => {
    const r = await sandbox.run('ls /work/.. | head -50; test -e /work/../outside && echo LEAK || echo contained', ws);
    expect(r.output).toContain('contained');
    expect(r.output).not.toContain('LEAK');
  }, 60_000);

  it('has no network access', async () => {
    const r = await sandbox.run(
      `node -e "fetch('http://1.1.1.1', {signal: AbortSignal.timeout(4000)}).then(() => process.exit(0), () => process.exit(7))"`,
      ws,
    );
    expect(r.isError).toBe(true); // exit 7 = the request failed
  }, 60_000);

  it('has no outbound DNS either', async () => {
    const r = await sandbox.run('getent hosts example.com || echo no-dns', ws);
    expect(r.output).toContain('no-dns');
  }, 60_000);

  it('drops capabilities: even root inside cannot chown', async () => {
    await writeFile(path.join(ws, 'owned.txt'), 'x');
    const r = await sandbox.run('chown nobody owned.txt', ws);
    expect(r.isError).toBe(true);
  }, 60_000);

  it('flags a failing command as an error and keeps its output', async () => {
    const r = await sandbox.run('echo about-to-fail; exit 3', ws);
    expect(r.isError).toBe(true);
    expect(r.output).toContain('about-to-fail');
  }, 60_000);

  it('shell metacharacters are interpreted inside the container, not on the host', async () => {
    // If this ran through a host shell, the `touch` would create a file next to the repo.
    const marker = path.join(outside, 'host-shell-ran.txt').replace(/\\/g, '/');
    const r = await sandbox.run(`echo "$(touch '${marker}')" ; echo done`, ws);
    expect(r.output).toContain('done');
    expect(await readdir(outside)).not.toContain('host-shell-ran.txt');
  }, 60_000);

  it('enforces the memory cap (the process is killed instead of exhausting the host)', async () => {
    const tight = new DockerCommandSandbox(undefined, '64m', '1');
    const r = await tight.run(
      `node -e "const a=[]; for(;;) a.push(Buffer.alloc(8*1024*1024, 1))"`,
      ws,
    );
    expect(r.isError).toBe(true);
  }, 90_000);

  it('does not leave containers behind (--rm)', async () => {
    await sandbox.run('echo cleanup-check', ws);
    const leftovers = execFileSync('docker', ['ps', '-a', '--filter', 'ancestor=node:20-alpine', '--format', '{{.ID}}'], {
      encoding: 'utf8',
    }).trim();
    expect(leftovers).toBe('');
  }, 60_000);
});

import { describe, it, expect } from 'vitest';
import { spawn } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { stopProcessesIn } from './process-cleanup';

const alive = (pid: number) => {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
};

describe('stopping processes a run left behind', () => {
  it('stops a process started from inside the run folder, and nothing else', async () => {
    const runDir = mkdtempSync(path.join(os.tmpdir(), 'forge-run-cleanup-'));
    const otherDir = mkdtempSync(path.join(os.tmpdir(), 'forge-other-'));
    const keepAlive = 'setInterval(() => {}, 1000)';
    const leftover = spawn(process.execPath, ['-e', keepAlive, path.join(runDir, 'server.js')], {
      stdio: 'ignore',
    });
    const bystander = spawn(process.execPath, ['-e', keepAlive, path.join(otherDir, 'app.js')], {
      stdio: 'ignore',
    });
    await new Promise((r) => setTimeout(r, 500));
    try {
      const prev = process.env.FORGE_SKIP_PROCESS_CLEANUP;
      delete process.env.FORGE_SKIP_PROCESS_CLEANUP;
      await stopProcessesIn(runDir);
      if (prev !== undefined) process.env.FORGE_SKIP_PROCESS_CLEANUP = prev;
      await new Promise((r) => setTimeout(r, 500));
      expect(alive(leftover.pid!)).toBe(false);
      expect(alive(bystander.pid!)).toBe(true);
    } finally {
      leftover.kill();
      bystander.kill();
    }
  }, 30_000);
});

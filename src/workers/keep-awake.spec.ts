import { spawn } from 'node:child_process';
import { describe, expect, it } from 'vitest';
import { KEEP_AWAKE_SCRIPT } from './keep-awake.service';
import { killTree } from './process-cleanup';

describe.runIf(process.platform === 'win32')('keep-awake script', () => {
  it('starts, holds its request without erroring, and stops when killed', async () => {
    const ps = spawn(
      'powershell.exe',
      ['-NoProfile', '-NonInteractive', '-Command', KEEP_AWAKE_SCRIPT],
      { windowsHide: true },
    );
    let stderr = '';
    ps.stderr.on('data', (b: Buffer) => (stderr += b.toString()));
    await new Promise((r) => setTimeout(r, 4000));
    expect(stderr).toBe('');
    expect(ps.exitCode).toBeNull(); // still holding
    await killTree(ps.pid);
    await new Promise((r) => setTimeout(r, 500));
    expect(ps.exitCode !== null || ps.signalCode !== null).toBe(true);
  }, 20_000);
});

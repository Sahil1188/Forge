import { spawn } from 'node:child_process';
import { describe, expect, it } from 'vitest';
import { killTree } from './process-cleanup';

const alive = (pid: number) => {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
};

describe('killTree', () => {
  it('stops the server a shell started, not just the shell (the npm start → node server.js case)', async () => {
    // shell → node (parent) → node (the "server"), which prints its pid and runs forever.
    const inner = `require('child_process').spawn(process.execPath, ['-e', 'console.log(process.pid); setInterval(() => {}, 1000)'], { stdio: 'inherit' }); setInterval(() => {}, 1000)`;
    const child = spawn(`"${process.execPath}" -e "${inner.replace(/"/g, '\\"')}"`, {
      shell: true,
      windowsHide: true,
      detached: process.platform !== 'win32',
    });
    const serverPid = await new Promise<number>((resolve, reject) => {
      child.stdout!.on('data', (b: Buffer) => resolve(Number(b.toString().trim())));
      setTimeout(() => reject(new Error('server did not start')), 10_000);
    });
    expect(alive(serverPid)).toBe(true);

    await killTree(child.pid);
    await new Promise((r) => setTimeout(r, 500));
    expect(alive(serverPid)).toBe(false);
  }, 30_000);

  it('ignores a missing or finished process', async () => {
    await expect(killTree(undefined)).resolves.toBeUndefined();
    await expect(killTree(999_999)).resolves.toBeUndefined();
  });
});

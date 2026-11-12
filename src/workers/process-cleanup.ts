import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import * as path from 'node:path';

const run = promisify(execFile);

/**
 * Stops any process still running from inside a run's workspace once the run is over (a script that
 * started LibreOffice, a dev server the agent left running, …). Matching on the workspace path keeps
 * it precise: nothing outside that folder — Forge itself, the operator's own apps — is touched.
 * Best effort: failures are ignored.
 */
export async function stopProcessesIn(dir: string): Promise<number> {
  if (process.env.FORGE_SKIP_PROCESS_CLEANUP) return 0;
  const target = path.resolve(dir);
  if (target.length < 12) return 0; // never match something as broad as a drive root
  try {
    if (process.platform === 'win32') {
      const script = [
        `$t = '${target.replace(/'/g, "''")}'`,
        `$p = Get-CimInstance Win32_Process | Where-Object { $_.ProcessId -ne ${process.pid} -and $_.CommandLine -and ($_.CommandLine.Replace('/', '\\').ToLower().Contains($t.ToLower())) }`,
        '$p | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }',
        '@($p).Count',
      ].join('; ');
      const { stdout } = await run(
        'powershell.exe',
        ['-NoProfile', '-NonInteractive', '-Command', script],
        { windowsHide: true, timeout: 20_000 },
      );
      return Number(stdout.trim()) || 0;
    }
    await run('pkill', ['-f', '--', target], { timeout: 10_000 }).catch(() => undefined);
    return 0;
  } catch {
    return 0;
  }
}

/**
 * Stops a process and everything it started. `child.kill()` on a `shell: true` spawn only ends the
 * shell: on Windows the real server (`npm start` → cmd → `node server.js`) is orphaned and keeps its
 * port (observed live: visual-check apps left running for days). Best effort: failures are ignored.
 */
export async function killTree(pid: number | undefined): Promise<void> {
  if (!pid) return;
  try {
    if (process.platform === 'win32') {
      await run('taskkill', ['/pid', String(pid), '/T', '/F'], {
        windowsHide: true,
        timeout: 15_000,
      });
    } else {
      // Spawned detached, so the child leads its own process group: signal the whole group.
      process.kill(-pid, 'SIGKILL');
    }
  } catch {
    // already gone
  }
}

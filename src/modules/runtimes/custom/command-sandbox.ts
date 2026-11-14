import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import * as path from 'node:path';
import { commandEnv } from '../../../infrastructure/security/safe-env';

const execFileAsync = promisify(execFile);

export interface SandboxResult {
  output: string;
  isError: boolean;
}

/**
 * Where a worker's `run_command` actually executes (spec §11 security boundary).
 * The `HostCommandSandbox` runs on the host (dev default); the `DockerCommandSandbox`
 * runs each command in an ephemeral, network-less container that can only see the
 * run's workspace — closing the "an agent's shell command touches your machine" gap.
 */
export interface CommandSandbox {
  readonly kind: string;
  run(command: string, cwd: string): Promise<SandboxResult>;
}

const TIMEOUT_MS = 60_000;
const MAX_BUFFER = 5 * 1024 * 1024;

/** Dev/default: run directly on the host. Fast, but no isolation. */
export class HostCommandSandbox implements CommandSandbox {
  readonly kind = 'host';

  async run(command: string, cwd: string): Promise<SandboxResult> {
    try {
      const { stdout, stderr } = await execFileAsync(command, {
        cwd,
        timeout: TIMEOUT_MS,
        maxBuffer: MAX_BUFFER,
        windowsHide: true,
        shell: true,
        env: commandEnv(),
      });
      return { output: `${stdout ?? ''}${stderr ?? ''}` || 'ok', isError: false };
    } catch (err) {
      const e = err as { stdout?: string; stderr?: string; message?: string };
      return {
        output: `${e.stdout ?? ''}${e.stderr ?? ''}` || e.message || 'command failed',
        isError: true,
      };
    }
  }
}

/**
 * On Linux and macOS the command runs as the user who owns the workspace. Root with every capability
 * dropped cannot write into a folder owned by another user, and files it did create would belong to
 * root on the host. HOME points at /tmp so tools that write caches (npm, pip) work. Docker Desktop on
 * Windows maps ownership itself, so no user is passed there.
 */
export function hostUser(
  ids: { uid?: number; gid?: number } = { uid: process.getuid?.(), gid: process.getgid?.() },
): string[] {
  if (ids.uid === undefined || ids.gid === undefined) return [];
  return ['--user', `${ids.uid}:${ids.gid}`, '-e', 'HOME=/tmp'];
}

/**
 * Production isolation: `docker run --rm` with no network, capped memory/CPU/pids,
 * and only the workspace bind-mounted at /work. The container is torn down after
 * each command, so nothing persists and the host filesystem/network is unreachable.
 */
export class DockerCommandSandbox implements CommandSandbox {
  readonly kind = 'docker';

  constructor(
    private readonly image = process.env.FORGE_SANDBOX_IMAGE ?? 'node:20-alpine',
    private readonly memory = process.env.FORGE_SANDBOX_MEMORY ?? '1g',
    private readonly cpus = process.env.FORGE_SANDBOX_CPUS ?? '2',
  ) {}

  /** `docker run` arguments for one command; shared with acceptance checks (CommandRunner). */
  args(command: string, cwd: string): string[] {
    return [
      'run',
      '--rm',
      '--network',
      'none',
      '--memory',
      this.memory,
      '--cpus',
      this.cpus,
      '--pids-limit',
      '256',
      '--cap-drop',
      'ALL',
      '--security-opt',
      'no-new-privileges',
      ...hostUser(),
      '-v',
      `${path.resolve(cwd)}:/work`,
      '-w',
      '/work',
      this.image,
      'sh',
      '-lc',
      command, // passed as a single argv element — no host-side shell interpolation
    ];
  }

  async run(command: string, cwd: string): Promise<SandboxResult> {
    const args = this.args(command, cwd);
    try {
      const { stdout, stderr } = await execFileAsync('docker', args, {
        timeout: TIMEOUT_MS,
        maxBuffer: MAX_BUFFER,
        windowsHide: true,
      });
      return { output: `${stdout ?? ''}${stderr ?? ''}` || 'ok', isError: false };
    } catch (err) {
      const e = err as { stdout?: string; stderr?: string; message?: string };
      return {
        output: `${e.stdout ?? ''}${e.stderr ?? ''}` || e.message || 'command failed (sandbox)',
        isError: true,
      };
    }
  }
}

/**
 * Picks the sandbox from the environment. `FORGE_SANDBOX=docker` opts into
 * container isolation; anything else (including unset) stays on the host. This is
 * the single switch that hardens worker command execution in production.
 */
export function createCommandSandbox(): CommandSandbox {
  if ((process.env.FORGE_SANDBOX ?? '').toLowerCase() === 'docker') {
    return new DockerCommandSandbox();
  }
  return new HostCommandSandbox();
}

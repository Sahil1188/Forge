import { Injectable } from '@nestjs/common';
import { exec, execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { commandEnv } from '../../infrastructure/security/safe-env';
import { DockerCommandSandbox } from '../runtimes/custom/command-sandbox';

const execAsync = promisify(exec);
const execFileAsync = promisify(execFile);

export interface CommandResult {
  exitCode: number;
  output: string;
  timedOut: boolean;
}

interface ExecError {
  code?: number;
  killed?: boolean;
  stdout?: string;
  stderr?: string;
}

/**
 * Runs a check command (tests, acceptance checks) in a workspace, capturing exit code + output.
 * The command runs code the agent wrote, so it never sees server secrets (allowlisted env), and
 * with FORGE_SANDBOX=docker it runs in the same network-less container as worker commands.
 */
@Injectable()
export class CommandRunner {
  async run(command: string, cwd: string, timeoutMs = 120_000): Promise<CommandResult> {
    const opts = { timeout: timeoutMs, maxBuffer: 10 * 1024 * 1024, windowsHide: true };
    try {
      const { stdout, stderr } =
        (process.env.FORGE_SANDBOX ?? '').toLowerCase() === 'docker'
          ? await execFileAsync('docker', new DockerCommandSandbox().args(command, cwd), opts)
          : await execAsync(command, { ...opts, cwd, env: commandEnv() });
      return { exitCode: 0, output: `${stdout ?? ''}${stderr ?? ''}`, timedOut: false };
    } catch (err) {
      const e = err as ExecError;
      return {
        exitCode: typeof e.code === 'number' ? e.code : 1,
        output: `${e.stdout ?? ''}${e.stderr ?? ''}`,
        timedOut: e.killed === true,
      };
    }
  }
}

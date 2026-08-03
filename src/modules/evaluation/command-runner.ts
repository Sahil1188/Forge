import { Injectable } from '@nestjs/common';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';

const execAsync = promisify(exec);

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

/** Runs a shell command in a workspace, capturing exit code + output. */
@Injectable()
export class CommandRunner {
  async run(command: string, cwd: string, timeoutMs = 120_000): Promise<CommandResult> {
    try {
      const { stdout, stderr } = await execAsync(command, {
        cwd,
        timeout: timeoutMs,
        maxBuffer: 10 * 1024 * 1024,
        windowsHide: true,
      });
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

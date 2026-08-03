import { Injectable } from '@nestjs/common';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdir, writeFile } from 'node:fs/promises';
import * as path from 'node:path';
import { ToolDefinition } from './model-provider';

const execAsync = promisify(exec);

export interface ToolExecution {
  output: string;
  isError: boolean;
}

/**
 * The tools a CustomRuntime agent may call. Mirrors Claude Code's file/command
 * tools; all calls are confined to the run's workspace (cwd) and governed by the
 * same permission gate as ClaudeCodeRuntime.
 */
@Injectable()
export class ToolExecutor {
  definitions(): ToolDefinition[] {
    return [
      {
        name: 'write_file',
        description: 'Create or overwrite a file in the workspace.',
        inputSchema: {
          type: 'object',
          properties: { path: { type: 'string' }, content: { type: 'string' } },
          required: ['path', 'content'],
        },
      },
      {
        name: 'run_command',
        description: 'Run a shell command in the workspace.',
        inputSchema: {
          type: 'object',
          properties: { command: { type: 'string' } },
          required: ['command'],
        },
      },
    ];
  }

  async execute(name: string, input: unknown, cwd: string): Promise<ToolExecution> {
    try {
      if (name === 'write_file') {
        return await this.writeFile(input as { path: string; content: string }, cwd);
      }
      if (name === 'run_command') {
        return await this.runCommand(input as { command: string }, cwd);
      }
      return { output: `Unknown tool: ${name}`, isError: true };
    } catch (err) {
      return { output: `Tool ${name} failed: ${(err as Error).message}`, isError: true };
    }
  }

  private async writeFile(
    input: { path: string; content: string },
    cwd: string,
  ): Promise<ToolExecution> {
    const abs = path.resolve(cwd, input.path);
    // Confine writes to the workspace (no path traversal).
    if (abs !== cwd && !abs.startsWith(cwd + path.sep)) {
      return { output: `Refused: ${input.path} escapes the workspace`, isError: true };
    }
    await mkdir(path.dirname(abs), { recursive: true });
    await writeFile(abs, input.content ?? '', 'utf8');
    return { output: `wrote ${input.path}`, isError: false };
  }

  private async runCommand(input: { command: string }, cwd: string): Promise<ToolExecution> {
    try {
      const { stdout, stderr } = await execAsync(input.command, {
        cwd,
        timeout: 60_000,
        maxBuffer: 5 * 1024 * 1024,
        windowsHide: true,
      });
      return { output: `${stdout ?? ''}${stderr ?? ''}` || 'ok', isError: false };
    } catch (err) {
      const e = err as { stdout?: string; stderr?: string };
      return { output: `${e.stdout ?? ''}${e.stderr ?? ''}` || 'command failed', isError: true };
    }
  }
}

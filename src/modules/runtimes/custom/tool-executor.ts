import { Injectable, Logger } from '@nestjs/common';
import { mkdir, writeFile } from 'node:fs/promises';
import * as path from 'node:path';
import { ToolDefinition } from './model-provider';
import { CommandSandbox, createCommandSandbox } from './command-sandbox';
import { findPathViolation } from '../../governance/path-confinement';

export interface ToolExecution {
  output: string;
  isError: boolean;
}

/**
 * The tools a CustomRuntime agent may call. Mirrors Claude Code's file/command
 * tools; all calls are confined to the run's workspace (cwd) and governed by the
 * same permission gate as ClaudeCodeRuntime. `run_command` executes through a
 * `CommandSandbox` — the host by default, or an isolated Docker container when
 * `FORGE_SANDBOX=docker` (spec §11).
 */
@Injectable()
export class ToolExecutor {
  private readonly logger = new Logger(ToolExecutor.name);
  private readonly sandbox: CommandSandbox = createCommandSandbox();

  constructor() {
    if (this.sandbox.kind !== 'host') {
      this.logger.log(`Command sandbox: ${this.sandbox.kind}`);
    }
  }

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
    // Confine writes to the workspace (no traversal, no symlink/junction escape).
    if (await findPathViolation(cwd, 'write_file', input)) {
      return { output: `Refused: ${input.path} escapes the workspace`, isError: true };
    }
    const abs = path.resolve(cwd, input.path);
    await mkdir(path.dirname(abs), { recursive: true });
    await writeFile(abs, input.content ?? '', 'utf8');
    return { output: `wrote ${input.path}`, isError: false };
  }

  private async runCommand(input: { command: string }, cwd: string): Promise<ToolExecution> {
    // Delegated to the configured sandbox (host or Docker) — see command-sandbox.ts.
    return this.sandbox.run(input.command, cwd);
  }
}

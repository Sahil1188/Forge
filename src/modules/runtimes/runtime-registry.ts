import { Injectable } from '@nestjs/common';
import { AgentRuntime } from './runtime.port';
import { ClaudeCodeRuntime } from './claude-code/claude-code.runtime';
import { CustomRuntime } from './custom/custom.runtime';

/**
 * Maps a runtime key to its implementation. Employees reference a key, so adding
 * a runtime later is a registry entry, not a core change (spec §7). Tests can
 * `register()` a mock runtime to exercise the pipeline without the real SDK.
 */
@Injectable()
export class RuntimeRegistry {
  private readonly runtimes = new Map<string, AgentRuntime>();

  constructor(claudeCode: ClaudeCodeRuntime, custom: CustomRuntime) {
    this.register(claudeCode);
    this.register(custom);
  }

  register(runtime: AgentRuntime): void {
    this.runtimes.set(runtime.key, runtime);
  }

  has(key: string): boolean {
    return this.runtimes.has(key);
  }

  get(key: string): AgentRuntime {
    const runtime = this.runtimes.get(key);
    if (!runtime) {
      throw new Error(`No runtime registered for key '${key}'`);
    }
    return runtime;
  }
}

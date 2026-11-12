import { describe, it, expect } from 'vitest';
import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import * as path from 'node:path';
import { CustomRuntime } from './custom.runtime';
import { ProviderRegistry } from './provider-registry';
import { ToolExecutor } from './tool-executor';
import { ChatRequest, ChatResponse, ModelProvider } from './model-provider';
import { RuntimeEvent } from '../runtime.port';

/** Scripted provider: asks to write a file once, then ends the turn. */
class ScriptedProvider implements ModelProvider {
  readonly name = 'scripted';
  async chat(req: ChatRequest): Promise<ChatResponse> {
    const usedTool = req.messages.some((m) => m.role === 'tool');
    if (!usedTool) {
      return {
        text: 'writing the file',
        toolCalls: [{ id: 'c1', name: 'write_file', input: { path: 'app.js', content: 'ok\n' } }],
        stopReason: 'tool_use',
        usage: { inputTokens: 10, outputTokens: 5, costUsd: 0.01 },
      };
    }
    return {
      text: 'done',
      toolCalls: [],
      stopReason: 'end_turn',
      usage: { inputTokens: 3, outputTokens: 2, costUsd: 0.002 },
    };
  }
}

async function collect(it: AsyncIterable<RuntimeEvent>): Promise<RuntimeEvent[]> {
  const out: RuntimeEvent[] = [];
  for await (const e of it) out.push(e);
  return out;
}

function makeRuntime(): CustomRuntime {
  const registry = new ProviderRegistry();
  registry.register(new ScriptedProvider());
  return new CustomRuntime(registry, new ToolExecutor());
}

describe('CustomRuntime', () => {
  it('drives a provider tool-use loop, executes the tool, and completes', async () => {
    const cwd = await mkdtemp(path.join(tmpdir(), 'forge-custom-'));
    const runtime = makeRuntime();
    const events = await collect(
      runtime.run({
        workItemId: 'wi',
        employeeId: 'emp',
        cwd,
        task: 'create app.js',
        model: 'm',
        provider: 'scripted',
      }),
    );

    expect(events.map((e) => e.kind)).toEqual([
      'session',
      'assistant_text',
      'tool_use',
      'tool_result',
      'assistant_text',
      'usage',
      'completed',
    ]);
    expect(await readFile(path.join(cwd, 'app.js'), 'utf8')).toBe('ok\n');
  });

  it('pauses on a governance gate (needs_approval) instead of executing the tool', async () => {
    const cwd = await mkdtemp(path.join(tmpdir(), 'forge-custom-'));
    const runtime = makeRuntime();
    const events = await collect(
      runtime.run({
        workItemId: 'wi',
        employeeId: 'emp',
        cwd,
        task: 'create app.js',
        model: 'm',
        provider: 'scripted',
        canUseTool: async () => ({
          behavior: 'pause',
          message: 'approval required',
          approvalId: 'a1',
        }),
      }),
    );

    expect(events.some((e) => e.kind === 'needs_approval')).toBe(true);
    expect(events.some((e) => e.kind === 'completed')).toBe(false);
    // The gated file was never written.
    await expect(readFile(path.join(cwd, 'app.js'), 'utf8')).rejects.toThrow();
  });

  it('throws when the provider is not registered', async () => {
    const cwd = await mkdtemp(path.join(tmpdir(), 'forge-custom-'));
    const runtime = makeRuntime();
    await expect(
      collect(
        runtime.run({
          workItemId: 'w',
          employeeId: 'e',
          cwd,
          task: 't',
          model: 'm',
          provider: 'nope',
        }),
      ),
    ).rejects.toThrow(/No model provider/);
  });
});

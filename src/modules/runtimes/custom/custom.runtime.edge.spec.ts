import { describe, it, expect } from 'vitest';
import { mkdtemp, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import * as path from 'node:path';
import { CustomRuntime } from './custom.runtime';
import { ProviderRegistry } from './provider-registry';
import { ToolExecutor } from './tool-executor';
import { ChatRequest, ChatResponse, ModelProvider } from './model-provider';
import { RuntimeEvent, RuntimeRunContext } from '../runtime.port';

async function collect(it: AsyncIterable<RuntimeEvent>): Promise<RuntimeEvent[]> {
  const out: RuntimeEvent[] = [];
  for await (const e of it) out.push(e);
  return out;
}

/** Provider driven by a script of responses; records every request it receives. */
class Script implements ModelProvider {
  readonly name = 'script';
  readonly requests: ChatRequest[] = [];
  private i = 0;
  constructor(private readonly responses: Array<ChatResponse | Error>) {}
  async chat(req: ChatRequest): Promise<ChatResponse> {
    // Snapshot: the runtime mutates the same messages array between turns.
    this.requests.push({ ...req, messages: req.messages.map((m) => ({ ...m })) });
    const r = this.responses[Math.min(this.i, this.responses.length - 1)];
    this.i += 1;
    if (r instanceof Error) throw r;
    return r;
  }
}

const tool = (id: string, name: string, input: unknown) => ({ id, name, input });
const toolTurn = (calls: ReturnType<typeof tool>[], cost = 0.01, text = ''): ChatResponse => ({
  text,
  toolCalls: calls,
  stopReason: 'tool_use',
  usage: { inputTokens: 10, outputTokens: 5, costUsd: cost },
});
const endTurn = (text = 'done', cost = 0.001): ChatResponse => ({
  text,
  toolCalls: [],
  stopReason: 'end_turn',
  usage: { inputTokens: 1, outputTokens: 1, costUsd: cost },
});

async function setup(provider: ModelProvider, extra: Partial<RuntimeRunContext> = {}) {
  const registry = new ProviderRegistry();
  registry.register(provider);
  const cwd = await mkdtemp(path.join(tmpdir(), 'forge-cre-'));
  const runtime = new CustomRuntime(registry, new ToolExecutor());
  const ctx: RuntimeRunContext = {
    workItemId: 'wi',
    employeeId: 'emp',
    cwd,
    task: 'do it',
    model: 'm',
    provider: 'script',
    ...extra,
  };
  return { runtime, ctx, cwd };
}

describe('CustomRuntime — loop edge cases', () => {
  it('emits a session event first, with a unique id per run', async () => {
    const a = await setup(new Script([endTurn()]));
    const b = await setup(new Script([endTurn()]));
    const ea = await collect(a.runtime.run(a.ctx));
    const eb = await collect(b.runtime.run(b.ctx));
    expect(ea[0].kind).toBe('session');
    expect((ea[0] as { sessionId: string }).sessionId).not.toBe((eb[0] as { sessionId: string }).sessionId);
  });

  it('fails with max_turns (and still reports usage) when the model never stops calling tools', async () => {
    const p = new Script([toolTurn([tool('c1', 'write_file', { path: 'a.txt', content: 'x' })], 0.02)]);
    const { runtime, ctx } = await setup(p, { limits: { maxTurns: 3 } });
    const events = await collect(runtime.run(ctx));
    expect(p.requests).toHaveLength(3);
    const usage = events.find((e) => e.kind === 'usage') as Extract<RuntimeEvent, { kind: 'usage' }>;
    expect(usage.costUsd).toBeCloseTo(0.06, 10);
    expect(events.at(-1)).toEqual({ kind: 'failed', error: 'max_turns' });
    expect(events.some((e) => e.kind === 'completed')).toBe(false);
  });

  it('accumulates tokens and cost across turns into a single cumulative usage event', async () => {
    const p = new Script([
      toolTurn([tool('c1', 'write_file', { path: 'a.txt', content: '1' })], 0.01),
      toolTurn([tool('c2', 'write_file', { path: 'b.txt', content: '2' })], 0.02),
      endTurn('ok', 0.003),
    ]);
    const { runtime, ctx } = await setup(p);
    const events = await collect(runtime.run(ctx));
    const usage = events.filter((e) => e.kind === 'usage') as Extract<RuntimeEvent, { kind: 'usage' }>[];
    expect(usage).toHaveLength(1);
    expect(usage[0].costUsd).toBeCloseTo(0.033, 10);
    expect(usage[0].inputTokens).toBe(21);
    expect(usage[0].outputTokens).toBe(11);
  });

  it('feeds the assistant tool call and the tool result back to the model on the next turn', async () => {
    const p = new Script([toolTurn([tool('c1', 'write_file', { path: 'a.txt', content: 'hi' })], 0.01, 'writing'), endTurn()]);
    const { runtime, ctx } = await setup(p, { systemPromptAppend: '# identity' });
    await collect(runtime.run(ctx));
    const second = p.requests[1];
    expect(second.system).toBe('# identity');
    expect(second.messages.map((m) => m.role)).toEqual(['user', 'assistant', 'tool']);
    expect(second.messages[1].toolCalls?.[0].id).toBe('c1');
    expect(second.messages[2].toolCallId).toBe('c1');
    expect(second.messages[2].content).toContain('wrote a.txt');
    expect(p.requests[0].tools.map((t) => t.name).sort()).toEqual(['run_command', 'write_file']);
  });

  it('runs several tool calls from one response in order', async () => {
    const p = new Script([
      toolTurn([
        tool('c1', 'write_file', { path: 'one.txt', content: '1' }),
        tool('c2', 'write_file', { path: 'two.txt', content: '2' }),
      ]),
      endTurn(),
    ]);
    const { runtime, ctx, cwd } = await setup(p);
    const events = await collect(runtime.run(ctx));
    expect(events.filter((e) => e.kind === 'tool_use').map((e) => (e as { toolUseId: string }).toolUseId)).toEqual([
      'c1',
      'c2',
    ]);
    expect((await readdir(cwd)).sort()).toEqual(['one.txt', 'two.txt']);
  });

  it('a denied tool is NOT executed; the denial is reported to the model and the run continues', async () => {
    const p = new Script([toolTurn([tool('c1', 'write_file', { path: 'no.txt', content: 'x' })]), endTurn('fine')]);
    const { runtime, ctx, cwd } = await setup(p, {
      canUseTool: async () => ({ behavior: 'deny', message: 'policy says no' }),
    });
    const events = await collect(runtime.run(ctx));
    expect(await readdir(cwd)).toEqual([]);
    const result = events.find((e) => e.kind === 'tool_result') as Extract<RuntimeEvent, { kind: 'tool_result' }>;
    expect(result.isError).toBe(true);
    expect(result.content).toBe('policy says no');
    expect(p.requests[1].messages.at(-1)?.content).toBe('Denied: policy says no');
    expect(events.at(-1)?.kind).toBe('completed');
  });

  it('consults the gate with the exact tool name and input, once per call', async () => {
    const seen: Array<[string, unknown]> = [];
    const p = new Script([
      toolTurn([tool('c1', 'write_file', { path: 'a.txt', content: 'x' }), tool('c2', 'run_command', { command: 'echo hi' })]),
      endTurn(),
    ]);
    const { runtime, ctx } = await setup(p, {
      canUseTool: async (n, i) => {
        seen.push([n, i]);
        return { behavior: 'allow' };
      },
    });
    await collect(runtime.run(ctx));
    expect(seen).toEqual([
      ['write_file', { path: 'a.txt', content: 'x' }],
      ['run_command', { command: 'echo hi' }],
    ]);
  });

  it('a pause stops the loop immediately: no later tool in the same response runs', async () => {
    const p = new Script([
      toolTurn([tool('c1', 'write_file', { path: 'gated.txt', content: 'x' }), tool('c2', 'write_file', { path: 'after.txt', content: 'y' })]),
      endTurn(),
    ]);
    const { runtime, ctx, cwd } = await setup(p, {
      canUseTool: async () => ({ behavior: 'pause', message: 'wait', approvalId: 'ap1' }),
    });
    const events = await collect(runtime.run(ctx));
    expect(await readdir(cwd)).toEqual([]);
    expect(events.at(-1)).toMatchObject({ kind: 'needs_approval', toolName: 'write_file', approvalRef: 'ap1' });
    expect(p.requests).toHaveLength(1);
  });

  it('surfaces a tool failure (escape attempt) as an error result and lets the model recover', async () => {
    const p = new Script([toolTurn([tool('c1', 'write_file', { path: '../escape.txt', content: 'x' })]), endTurn()]);
    const { runtime, ctx, cwd } = await setup(p);
    const events = await collect(runtime.run(ctx));
    const result = events.find((e) => e.kind === 'tool_result') as Extract<RuntimeEvent, { kind: 'tool_result' }>;
    expect(result.isError).toBe(true);
    expect(String(result.content)).toMatch(/escapes the workspace/);
    expect(await readdir(path.dirname(cwd))).not.toContain('escape.txt');
    expect(events.at(-1)?.kind).toBe('completed');
  });

  it('a reply truncated by max_tokens that carries tool calls fails the run and never executes them', async () => {
    const p = new Script([
      {
        text: '',
        toolCalls: [tool('c1', 'write_file', { path: 'half.txt', content: 'partial…' })],
        stopReason: 'max_tokens',
        usage: { inputTokens: 5, outputTokens: 4096, costUsd: 0.05 },
      },
    ]);
    const { runtime, ctx, cwd } = await setup(p);
    const events = await collect(runtime.run(ctx));
    expect(await readdir(cwd)).toEqual([]);
    expect(events.at(-1)).toEqual({ kind: 'failed', error: 'max_tokens' });
    expect(events.some((e) => e.kind === 'tool_use')).toBe(false);
    expect((events.find((e) => e.kind === 'usage') as { costUsd: number }).costUsd).toBeCloseTo(0.05, 10);
  });

  it('propagates a provider failure to the caller (the worker turns it into a failed run)', async () => {
    const { runtime, ctx } = await setup(new Script([new Error('429 rate limited')]));
    await expect(collect(runtime.run(ctx))).rejects.toThrow('429 rate limited');
  });

  it('resume() re-executes the task (V1 semantics) with the same context', async () => {
    const p = new Script([endTurn('again')]);
    const { runtime, ctx } = await setup(p);
    const events = await collect(runtime.resume('old-session', ctx));
    expect(events.at(-1)).toMatchObject({ kind: 'completed', result: 'again' });
    expect(p.requests[0].messages[0].content).toBe('do it');
  });

  it('defaults to the anthropic provider when none is specified', async () => {
    const registry = new ProviderRegistry();
    const cwd = await mkdtemp(path.join(tmpdir(), 'forge-cre-'));
    const runtime = new CustomRuntime(registry, new ToolExecutor());
    await expect(
      collect(runtime.run({ workItemId: 'w', employeeId: 'e', cwd, task: 't', model: 'm' })),
    ).rejects.toThrow(/No model provider registered for 'anthropic'/);
  });
});

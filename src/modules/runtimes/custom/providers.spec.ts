import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { AnthropicMessagesProvider } from './anthropic-messages.provider';
import { OllamaProvider } from './ollama.provider';
import { estimateAnthropicCostUsd } from './anthropic-pricing';
import { ChatRequest } from './model-provider';

interface Captured {
  url: string;
  init: { method?: string; headers: Record<string, string>; body: string };
}

function mockFetch(responder: (c: Captured) => { status?: number; json?: unknown; text?: string }) {
  const calls: Captured[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string, init: Captured['init']) => {
      const c = { url, init };
      calls.push(c);
      const r = responder(c);
      const status = r.status ?? 200;
      return {
        ok: status >= 200 && status < 300,
        status,
        json: async () => r.json,
        text: async () => r.text ?? JSON.stringify(r.json ?? {}),
      };
    }),
  );
  return calls;
}

const tools = [
  {
    name: 'write_file',
    description: 'write',
    inputSchema: { type: 'object', properties: { path: { type: 'string' } } },
  },
];
const baseReq = (over: Partial<ChatRequest> = {}): ChatRequest => ({
  model: 'claude-sonnet-4-6',
  system: 'be good',
  messages: [{ role: 'user', content: 'hi' }],
  tools,
  ...over,
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe('AnthropicMessagesProvider', () => {
  beforeEach(() => {
    vi.stubEnv('FORGE_ANTHROPIC_API_KEY', 'sk-ant-forge-test-key-0000000000');
  });

  it('refuses to run without FORGE_ANTHROPIC_API_KEY', async () => {
    vi.stubEnv('FORGE_ANTHROPIC_API_KEY', '');
    await expect(new AnthropicMessagesProvider().chat(baseReq())).rejects.toThrow(
      /FORGE_ANTHROPIC_API_KEY/,
    );
  });

  it('never falls back to ANTHROPIC_API_KEY (billing separation from the subscription runtime)', async () => {
    vi.stubEnv('FORGE_ANTHROPIC_API_KEY', '');
    vi.stubEnv('ANTHROPIC_API_KEY', 'sk-ant-api03-should-not-be-used-000000');
    const calls = mockFetch(() => ({ json: {} }));
    await expect(new AnthropicMessagesProvider().chat(baseReq())).rejects.toThrow(
      /FORGE_ANTHROPIC_API_KEY/,
    );
    expect(calls).toHaveLength(0);
  });

  it('sends the key, version header, system prompt and tool schemas in the documented shape', async () => {
    const calls = mockFetch(() => ({
      json: {
        content: [{ type: 'text', text: 'ok' }],
        stop_reason: 'end_turn',
        usage: { input_tokens: 5, output_tokens: 7 },
      },
    }));
    await new AnthropicMessagesProvider().chat(baseReq({ maxTokens: 123 }));
    const { url, init } = calls[0];
    expect(url).toBe('https://api.anthropic.com/v1/messages');
    expect(init.method).toBe('POST');
    expect(init.headers['x-api-key']).toBe('sk-ant-forge-test-key-0000000000');
    expect(init.headers['anthropic-version']).toBe('2023-06-01');
    const body = JSON.parse(init.body);
    expect(body).toMatchObject({ model: 'claude-sonnet-4-6', max_tokens: 123, system: 'be good' });
    expect(body.tools[0]).toEqual({
      name: 'write_file',
      description: 'write',
      input_schema: tools[0].inputSchema,
    });
    expect(body.messages).toEqual([{ role: 'user', content: 'hi' }]);
  });

  it('defaults max_tokens to 4096', async () => {
    const calls = mockFetch(() => ({
      json: { content: [], stop_reason: 'end_turn', usage: { input_tokens: 0, output_tokens: 0 } },
    }));
    await new AnthropicMessagesProvider().chat(baseReq());
    expect(JSON.parse(calls[0].init.body).max_tokens).toBe(4096);
  });

  it('replays an assistant tool call and merges all tool results of one turn into ONE user message', async () => {
    const calls = mockFetch(() => ({
      json: { content: [], stop_reason: 'end_turn', usage: { input_tokens: 0, output_tokens: 0 } },
    }));
    await new AnthropicMessagesProvider().chat(
      baseReq({
        messages: [
          { role: 'user', content: 'do two things' },
          {
            role: 'assistant',
            content: 'on it',
            toolCalls: [
              { id: 'a', name: 'write_file', input: { path: 'x' } },
              { id: 'b', name: 'write_file', input: { path: 'y' } },
            ],
          },
          { role: 'tool', toolCallId: 'a', content: 'wrote x' },
          { role: 'tool', toolCallId: 'b', content: 'wrote y' },
        ],
      }),
    );
    const msgs = JSON.parse(calls[0].init.body).messages;
    expect(msgs).toHaveLength(3);
    expect(msgs[1]).toEqual({
      role: 'assistant',
      content: [
        { type: 'text', text: 'on it' },
        { type: 'tool_use', id: 'a', name: 'write_file', input: { path: 'x' } },
        { type: 'tool_use', id: 'b', name: 'write_file', input: { path: 'y' } },
      ],
    });
    expect(msgs[2]).toEqual({
      role: 'user',
      content: [
        { type: 'tool_result', tool_use_id: 'a', content: 'wrote x' },
        { type: 'tool_result', tool_use_id: 'b', content: 'wrote y' },
      ],
    });
  });

  it('omits an empty text block when replaying an assistant tool call', async () => {
    const calls = mockFetch(() => ({
      json: { content: [], stop_reason: 'end_turn', usage: { input_tokens: 0, output_tokens: 0 } },
    }));
    await new AnthropicMessagesProvider().chat(
      baseReq({
        messages: [
          {
            role: 'assistant',
            content: '',
            toolCalls: [{ id: 'a', name: 'write_file', input: {} }],
          },
        ],
      }),
    );
    const content = JSON.parse(calls[0].init.body).messages[0].content;
    expect(content).toEqual([{ type: 'tool_use', id: 'a', name: 'write_file', input: {} }]);
  });

  it('parses text, tool calls, stop reason and usage; reports an estimated cost', async () => {
    mockFetch(() => ({
      json: {
        content: [
          { type: 'text', text: 'part one ' },
          { type: 'text', text: 'part two' },
          { type: 'tool_use', id: 'toolu_1', name: 'write_file', input: { path: 'a.txt' } },
        ],
        stop_reason: 'tool_use',
        usage: { input_tokens: 1000, output_tokens: 500 },
      },
    }));
    const r = await new AnthropicMessagesProvider().chat(baseReq());
    expect(r.text).toBe('part one part two');
    expect(r.toolCalls).toEqual([{ id: 'toolu_1', name: 'write_file', input: { path: 'a.txt' } }]);
    expect(r.stopReason).toBe('tool_use');
    expect(r.usage.inputTokens).toBe(1000);
    expect(r.usage.outputTokens).toBe(500);
    // sonnet: (1000*3 + 500*15) / 1e6
    expect(r.usage.costUsd).toBeCloseTo(0.0105, 10);
  });

  it('reports max_tokens truthfully (a truncated reply is not an end_turn)', async () => {
    mockFetch(() => ({
      json: {
        content: [{ type: 'text', text: 'cut off' }],
        stop_reason: 'max_tokens',
        usage: { input_tokens: 1, output_tokens: 1 },
      },
    }));
    expect((await new AnthropicMessagesProvider().chat(baseReq())).stopReason).toBe('max_tokens');
  });

  it('maps stop_sequence / end_turn to end_turn', async () => {
    mockFetch(() => ({
      json: {
        content: [],
        stop_reason: 'stop_sequence',
        usage: { input_tokens: 1, output_tokens: 1 },
      },
    }));
    expect((await new AnthropicMessagesProvider().chat(baseReq())).stopReason).toBe('end_turn');
  });

  it('raises a descriptive error on API failures (rate limit, auth)', async () => {
    mockFetch(() => ({ status: 429, text: '{"error":"rate_limited"}' }));
    await expect(new AnthropicMessagesProvider().chat(baseReq())).rejects.toThrow(
      /Anthropic API error 429.*rate_limited/,
    );
  });
});

describe('estimateAnthropicCostUsd', () => {
  it('prices by model family', () => {
    expect(estimateAnthropicCostUsd('claude-haiku-4-5', 1_000_000, 1_000_000)).toBeCloseTo(6, 10);
    expect(estimateAnthropicCostUsd('claude-sonnet-4-6', 1_000_000, 1_000_000)).toBeCloseTo(18, 10);
    expect(estimateAnthropicCostUsd('claude-opus-4-8', 1_000_000, 1_000_000)).toBeCloseTo(90, 10);
  });

  it('prices an unknown model at the most expensive tier so budgets can only trip early', () => {
    expect(estimateAnthropicCostUsd('mystery-model', 1_000_000, 0)).toBeCloseTo(15, 10);
  });

  it('zero tokens cost nothing and cost scales linearly', () => {
    expect(estimateAnthropicCostUsd('claude-haiku-4-5', 0, 0)).toBe(0);
    const one = estimateAnthropicCostUsd('claude-haiku-4-5', 1000, 1000);
    expect(estimateAnthropicCostUsd('claude-haiku-4-5', 2000, 2000)).toBeCloseTo(one * 2, 12);
  });

  it('honours an operator override of the rate', () => {
    vi.stubEnv('FORGE_PRICE_HAIKU_IN', '2');
    vi.stubEnv('FORGE_PRICE_HAIKU_OUT', '10');
    expect(estimateAnthropicCostUsd('claude-haiku-4-5', 1_000_000, 1_000_000)).toBeCloseTo(12, 10);
  });

  it('ignores a nonsensical override', () => {
    vi.stubEnv('FORGE_PRICE_HAIKU_IN', 'abc');
    vi.stubEnv('FORGE_PRICE_HAIKU_OUT', '-5');
    expect(estimateAnthropicCostUsd('claude-haiku-4-5', 1_000_000, 1_000_000)).toBeCloseTo(6, 10);
  });
});

describe('OllamaProvider', () => {
  it('posts to the configured host with tools in function format and stream disabled', async () => {
    vi.stubEnv('FORGE_OLLAMA_HOST', 'http://gpu-box:11434/');
    const calls = mockFetch(() => ({
      json: { message: { role: 'assistant', content: 'hi' }, prompt_eval_count: 4, eval_count: 6 },
    }));
    await new OllamaProvider().chat(baseReq({ model: 'qwen2.5-coder', maxTokens: 256 }));
    expect(calls[0].url).toBe('http://gpu-box:11434/api/chat');
    const body = JSON.parse(calls[0].init.body);
    expect(body).toMatchObject({
      model: 'qwen2.5-coder',
      stream: false,
      options: { num_predict: 256 },
    });
    expect(body.messages[0]).toEqual({ role: 'system', content: 'be good' });
    expect(body.tools[0]).toEqual({
      type: 'function',
      function: { name: 'write_file', description: 'write', parameters: tools[0].inputSchema },
    });
  });

  it('defaults to localhost:11434', async () => {
    const calls = mockFetch(() => ({ json: { message: { content: '' } } }));
    await new OllamaProvider().chat(baseReq());
    expect(calls[0].url).toBe('http://localhost:11434/api/chat');
  });

  it('is free: reports token counts and zero cost', async () => {
    mockFetch(() => ({
      json: {
        message: { role: 'assistant', content: 'done' },
        done_reason: 'stop',
        prompt_eval_count: 11,
        eval_count: 22,
      },
    }));
    const r = await new OllamaProvider().chat(baseReq());
    expect(r).toMatchObject({ text: 'done', stopReason: 'end_turn', toolCalls: [] });
    expect(r.usage).toEqual({ inputTokens: 11, outputTokens: 22, costUsd: 0 });
  });

  it('turns tool_calls into provider-neutral calls with generated unique ids', async () => {
    mockFetch(() => ({
      json: {
        message: {
          role: 'assistant',
          content: '',
          tool_calls: [
            { function: { name: 'write_file', arguments: { path: 'a.txt', content: 'x' } } },
            { function: { name: 'run_command', arguments: '{"command":"ls"}' } },
          ],
        },
      },
    }));
    const r = await new OllamaProvider().chat(baseReq());
    expect(r.stopReason).toBe('tool_use');
    expect(r.toolCalls.map((c) => c.name)).toEqual(['write_file', 'run_command']);
    expect(r.toolCalls[0].input).toEqual({ path: 'a.txt', content: 'x' });
    expect(r.toolCalls[1].input).toEqual({ command: 'ls' }); // string arguments are parsed
    expect(new Set(r.toolCalls.map((c) => c.id)).size).toBe(2);
  });

  it('tolerates malformed string arguments instead of throwing', async () => {
    mockFetch(() => ({
      json: {
        message: { tool_calls: [{ function: { name: 'write_file', arguments: '{not json' } }] },
      },
    }));
    const r = await new OllamaProvider().chat(baseReq());
    expect(r.toolCalls[0].input).toEqual({});
  });

  it('drops tool calls with no function name', async () => {
    mockFetch(() => ({
      json: {
        message: {
          tool_calls: [{}, { function: {} }, { function: { name: 'ok', arguments: {} } }],
        },
      },
    }));
    expect((await new OllamaProvider().chat(baseReq())).toolCalls.map((c) => c.name)).toEqual([
      'ok',
    ]);
  });

  it('replays tool calls and labels each tool result with its tool name', async () => {
    const calls = mockFetch(() => ({ json: { message: { content: '' } } }));
    await new OllamaProvider().chat(
      baseReq({
        system: undefined,
        messages: [
          { role: 'user', content: 'go' },
          {
            role: 'assistant',
            content: 'ok',
            toolCalls: [{ id: 'c1', name: 'write_file', input: { path: 'a' } }],
          },
          { role: 'tool', toolCallId: 'c1', content: 'wrote a' },
        ],
      }),
    );
    const msgs = JSON.parse(calls[0].init.body).messages;
    expect(msgs[0].role).toBe('user'); // no system message when none supplied
    expect(msgs[1]).toEqual({
      role: 'assistant',
      content: 'ok',
      tool_calls: [{ function: { name: 'write_file', arguments: { path: 'a' } } }],
    });
    expect(msgs[2]).toEqual({ role: 'tool', content: 'wrote a', tool_name: 'write_file' });
  });

  it('maps a length cut-off to max_tokens', async () => {
    mockFetch(() => ({ json: { message: { content: 'trunc' }, done_reason: 'length' } }));
    expect((await new OllamaProvider().chat(baseReq())).stopReason).toBe('max_tokens');
  });

  it('gives an actionable error when the server is unreachable', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Promise.reject(new Error('ECONNREFUSED'))),
    );
    await expect(new OllamaProvider().chat(baseReq())).rejects.toThrow(
      /Could not reach Ollama.*ECONNREFUSED.*FORGE_OLLAMA_HOST/,
    );
  });

  it('surfaces HTTP errors from the server (e.g. model not pulled)', async () => {
    mockFetch(() => ({ status: 404, text: 'model "nope" not found' }));
    await expect(new OllamaProvider().chat(baseReq())).rejects.toThrow(
      /Ollama error 404.*not found/,
    );
  });
});

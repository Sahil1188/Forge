import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { OpenAICompatibleProvider } from './openai-compatible.provider';
import { fallbackSelection, looksLikeUsageLimit } from '../usage-limits';

const ENV = { FORGE_FALLBACK_BASE_URL: 'https://gateway.test/api/v1/', FORGE_FALLBACK_API_KEY: 'sk-or-secret', FORGE_FALLBACK_MODEL: 'auto' };

describe('OpenAI-compatible fallback provider (OmniRoute / OpenRouter / OpenAI)', () => {
  const saved = { ...process.env };
  beforeEach(() => Object.assign(process.env, ENV));
  afterEach(() => {
    process.env = { ...saved };
    vi.restoreAllMocks();
  });

  it('sends a chat-completions request with tools, tool calls and tool results, and maps the reply', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          choices: [{ message: { content: null, tool_calls: [{ id: 'c2', type: 'function', function: { name: 'write_file', arguments: '{"path":"a.js","content":"x"}' } }] }, finish_reason: 'tool_calls' }],
          usage: { prompt_tokens: 120, completion_tokens: 30, cost: 0.0012 },
        }),
        { status: 200 },
      ),
    );
    const out = await new OpenAICompatibleProvider().chat({
      model: 'auto',
      system: 'You are Grace',
      tools: [{ name: 'write_file', description: 'write', inputSchema: { type: 'object' } }],
      messages: [
        { role: 'user', content: 'Build it' },
        { role: 'assistant', content: '', toolCalls: [{ id: 'c1', name: 'run_command', input: { command: 'npm test' } }] },
        { role: 'tool', content: 'ok', toolCallId: 'c1' },
      ],
    });
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://gateway.test/api/v1/chat/completions');
    expect((init.headers as Record<string, string>).authorization).toBe('Bearer sk-or-secret');
    const body = JSON.parse(String(init.body));
    expect(body.model).toBe('auto');
    expect(body.messages[0]).toEqual({ role: 'system', content: 'You are Grace' });
    expect(body.messages[2].tool_calls[0]).toEqual({ id: 'c1', type: 'function', function: { name: 'run_command', arguments: '{"command":"npm test"}' } });
    expect(body.messages[3]).toEqual({ role: 'tool', tool_call_id: 'c1', content: 'ok' });
    expect(body.tools[0].function.name).toBe('write_file');
    expect(out).toEqual({ text: '', toolCalls: [{ id: 'c2', name: 'write_file', input: { path: 'a.js', content: 'x' } }], stopReason: 'tool_use', usage: { inputTokens: 120, outputTokens: 30, costUsd: 0.0012 } });
  });

  it('an out-of-credit error is surfaced in words Forge recognises, without leaking the key', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ error: { message: 'Insufficient credits. Add more using https://openrouter.ai/credits' } }), { status: 402 }));
    const err = await new OpenAICompatibleProvider().chat({ model: 'auto', messages: [{ role: 'user', content: 'x' }], tools: [] }).catch((e: Error) => e);
    expect(String(err)).toMatch(/402.*Insufficient credits/);
    expect(String(err)).not.toContain('sk-or-secret');
    expect(looksLikeUsageLimit(String(err))).toBe(true);
  });

  it('fallback is used only when an endpoint and model are configured, never from the fallback itself, and can be turned off', () => {
    expect(fallbackSelection('claude_code', ENV as NodeJS.ProcessEnv)).toEqual({ runtimeKey: 'custom', provider: 'openai', model: 'auto' });
    expect(fallbackSelection('custom', ENV as NodeJS.ProcessEnv)).toBeNull();
    expect(fallbackSelection('claude_code', { FORGE_FALLBACK_BASE_URL: 'x' } as NodeJS.ProcessEnv)).toBeNull();
    expect(fallbackSelection('claude_code', { ...ENV, FORGE_FALLBACK_AUTO: '0' } as NodeJS.ProcessEnv)).toBeNull();
  });
});

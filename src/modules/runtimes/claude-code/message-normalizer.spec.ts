import { describe, it, expect } from 'vitest';
import { normalizeSdkMessage, SdkMessage } from './message-normalizer';
import { RuntimeEvent } from '../runtime.port';

function normalizeAll(msgs: SdkMessage[]): RuntimeEvent[] {
  return msgs.flatMap(normalizeSdkMessage);
}

describe('normalizeSdkMessage', () => {
  it('extracts the session id from a system init message', () => {
    expect(normalizeSdkMessage({ type: 'system', subtype: 'init', session_id: 'sess-1' })).toEqual([
      { kind: 'session', sessionId: 'sess-1' },
    ]);
  });

  it('splits assistant content into text and tool_use events', () => {
    const events = normalizeSdkMessage({
      type: 'assistant',
      message: {
        content: [
          { type: 'text', text: 'Creating a file' },
          { type: 'tool_use', id: 'tu-1', name: 'Write', input: { path: 'hello.txt' } },
        ],
      },
    });
    expect(events).toEqual([
      { kind: 'assistant_text', text: 'Creating a file' },
      { kind: 'tool_use', toolName: 'Write', toolUseId: 'tu-1', input: { path: 'hello.txt' } },
    ]);
  });

  it('maps tool results from user messages', () => {
    const events = normalizeSdkMessage({
      type: 'user',
      message: { content: [{ type: 'tool_result', tool_use_id: 'tu-1', is_error: false, content: 'ok' }] },
    });
    expect(events).toEqual([
      { kind: 'tool_result', toolUseId: 'tu-1', isError: false, content: 'ok' },
    ]);
  });

  it('emits usage and completion for a successful result', () => {
    const events = normalizeSdkMessage({
      type: 'result',
      subtype: 'success',
      total_cost_usd: 0.42,
      usage: { input_tokens: 100, output_tokens: 50 },
      result: 'done',
      session_id: 'sess-1',
    });
    expect(events).toEqual([
      { kind: 'usage', inputTokens: 100, outputTokens: 50, costUsd: 0.42 },
      { kind: 'completed', result: 'done', sessionId: 'sess-1' },
    ]);
  });

  it('emits a failure for a non-success result subtype', () => {
    const events = normalizeSdkMessage({ type: 'result', subtype: 'error_max_turns' });
    expect(events).toContainEqual({ kind: 'failed', error: 'error_max_turns' });
  });

  it('normalizes a full session transcript in order', () => {
    const events = normalizeAll([
      { type: 'system', subtype: 'init', session_id: 's' },
      { type: 'assistant', message: { content: [{ type: 'tool_use', id: 't', name: 'Write', input: {} }] } },
      { type: 'user', message: { content: [{ type: 'tool_result', tool_use_id: 't', content: 'ok' }] } },
      { type: 'result', subtype: 'success', total_cost_usd: 0.1, result: 'ok', session_id: 's' },
    ]);
    expect(events.map((e) => e.kind)).toEqual([
      'session',
      'tool_use',
      'tool_result',
      'usage',
      'completed',
    ]);
  });
});

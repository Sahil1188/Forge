import { describe, it, expect, vi } from 'vitest';
import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import * as path from 'node:path';
import { ClaudeCodeRuntime } from './claude-code.runtime';
import { SdkMessage } from './message-normalizer';
import { SdkQueryArgs } from './sdk.provider';
import { RuntimeEvent } from '../runtime.port';

async function collect(iterable: AsyncIterable<RuntimeEvent>): Promise<RuntimeEvent[]> {
  const out: RuntimeEvent[] = [];
  for await (const e of iterable) out.push(e);
  return out;
}

describe('ClaudeCodeRuntime', () => {
  it('runs the SDK and yields normalized events + writes CLAUDE.md', async () => {
    const cwd = await mkdtemp(path.join(tmpdir(), 'forge-cc-'));
    const captured: SdkQueryArgs[] = [];

    const fakeQuery = (args: SdkQueryArgs): AsyncIterable<SdkMessage> => {
      captured.push(args);
      return (async function* () {
        yield { type: 'system', subtype: 'init', session_id: 'sess-9' };
        yield {
          type: 'assistant',
          message: { content: [{ type: 'text', text: 'working' }] },
        };
        yield {
          type: 'result',
          subtype: 'success',
          total_cost_usd: 0.05,
          usage: { input_tokens: 10, output_tokens: 5 },
          result: 'done',
          session_id: 'sess-9',
        };
      })();
    };

    const runtime = new ClaudeCodeRuntime(fakeQuery);
    const events = await collect(
      runtime.run({
        workItemId: 'wi-1',
        employeeId: 'emp-1',
        cwd,
        task: 'do the thing',
        model: 'claude-sonnet-4-6',
        systemPromptAppend: '# Ada — CEO',
        limits: { maxTurns: 5 },
      }),
    );

    expect(events.map((e) => e.kind)).toEqual(['session', 'assistant_text', 'usage', 'completed']);

    // CLAUDE.md was written to the workspace.
    expect(await readFile(path.join(cwd, 'CLAUDE.md'), 'utf8')).toBe('# Ada — CEO');

    // Options were passed through to the SDK.
    expect(captured[0].options).toMatchObject({
      cwd,
      model: 'claude-sonnet-4-6',
      maxTurns: 5,
      permissionMode: 'bypassPermissions',
    });
  });

  it('passes a resume session id through to the SDK', async () => {
    const cwd = await mkdtemp(path.join(tmpdir(), 'forge-cc-'));
    const spy = vi.fn((_args: SdkQueryArgs): AsyncIterable<SdkMessage> =>
      (async function* () {
        yield { type: 'result', subtype: 'success', result: 'ok' };
      })(),
    );
    const runtime = new ClaudeCodeRuntime(spy);
    await collect(
      runtime.resume('sess-prev', {
        workItemId: 'wi',
        employeeId: 'emp',
        cwd,
        task: 't',
        model: 'claude-haiku-4-5',
      }),
    );
    expect(spy.mock.calls[0][0].options).toMatchObject({ resume: 'sess-prev' });
  });
});

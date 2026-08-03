import { describe, it, expect } from 'vitest';
import { mkdtemp, readFile, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import * as path from 'node:path';
import { sdkQueryProvider, SDK_QUERY, SdkQueryFn } from '../src/modules/runtimes/claude-code/sdk.provider';
import { ClaudeCodeRuntime } from '../src/modules/runtimes/claude-code/claude-code.runtime';
import { RuntimeEvent } from '../src/modules/runtimes/runtime.port';

/**
 * Live Claude Agent SDK smoke test. Runs ONLY when Claude Code subscription auth
 * is available (CLAUDE_CODE_OAUTH_TOKEN). It must never depend on
 * ANTHROPIC_API_KEY (that would force per-token billing — see docs §7.1).
 */
const hasSubscriptionAuth = Boolean(process.env.CLAUDE_CODE_OAUTH_TOKEN);

describe.skipIf(!hasSubscriptionAuth)('ClaudeCodeRuntime (live SDK)', () => {
  it('creates a file in an isolated workspace via a real run', async () => {
    // Build the real SDK query fn the same way the app does.
    const factory = sdkQueryProvider as { useFactory: () => SdkQueryFn };
    const query = factory.useFactory();
    const runtime = new ClaudeCodeRuntime(query);
    const cwd = await mkdtemp(path.join(tmpdir(), 'forge-live-'));

    const events: RuntimeEvent[] = [];
    for await (const e of runtime.run({
      workItemId: 'live-wi',
      employeeId: 'live-emp',
      cwd,
      task: 'Create a file named hello.txt containing exactly the text: forge-ok',
      model: 'claude-haiku-4-5',
      limits: { maxTurns: 6 },
    })) {
      events.push(e);
    }

    expect(events.some((e) => e.kind === 'completed')).toBe(true);
    const files = await readdir(cwd);
    expect(files).toContain('hello.txt');
    const contents = await readFile(path.join(cwd, 'hello.txt'), 'utf8');
    expect(contents).toContain('forge-ok');
  }, 120_000);
});

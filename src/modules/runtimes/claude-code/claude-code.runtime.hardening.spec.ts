import { describe, it, expect, afterEach } from 'vitest';
import { access, mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import * as path from 'node:path';
import { ClaudeCodeRuntime } from './claude-code.runtime';
import { SdkMessage } from './message-normalizer';
import { SdkQueryArgs } from './sdk.provider';
import { RuntimeEvent, RuntimeRunContext } from '../runtime.port';

async function collect(iterable: AsyncIterable<RuntimeEvent>): Promise<RuntimeEvent[]> {
  const out: RuntimeEvent[] = [];
  for await (const e of iterable) out.push(e);
  return out;
}

const success: SdkMessage = { type: 'result', subtype: 'success', result: 'ok' };

function once(captured: SdkQueryArgs[], messages: SdkMessage[] = [success]) {
  return (args: SdkQueryArgs): AsyncIterable<SdkMessage> => {
    captured.push(args);
    return (async function* () {
      for (const m of messages) yield m;
    })();
  };
}

async function ctx(extra: Partial<RuntimeRunContext> = {}): Promise<RuntimeRunContext> {
  return {
    workItemId: 'wi',
    employeeId: 'emp',
    cwd: await mkdtemp(path.join(tmpdir(), 'forge-cch-')),
    task: 't',
    model: 'claude-haiku-4-5',
    ...extra,
  };
}

describe('ClaudeCodeRuntime — isolation & billing hardening', () => {
  const savedKey = process.env.ANTHROPIC_API_KEY;
  afterEach(() => {
    if (savedKey === undefined) delete process.env.ANTHROPIC_API_KEY;
    else process.env.ANTHROPIC_API_KEY = savedKey;
  });

  it('loads NO filesystem settings: the operator’s global config must not leak into an employee run (live bug: user additionalDirectories + ancestor CLAUDE.md files)', async () => {
    const captured: SdkQueryArgs[] = [];
    await collect(new ClaudeCodeRuntime(once(captured)).run(await ctx()));
    // Omitting settingSources loads user/project/local; ['project'] still walks up the
    // ancestor tree and pulls in e.g. ~/.claude/CLAUDE.md. Only [] fully isolates.
    expect(captured[0].options.settingSources).toEqual([]);
  });

  it('delivers the employee identity + memory through the system prompt (not via CLAUDE.md discovery)', async () => {
    const captured: SdkQueryArgs[] = [];
    await collect(
      new ClaudeCodeRuntime(once(captured)).run(
        await ctx({ systemPromptAppend: '# Ada — CEO\n## What you have learned\n- lesson' }),
      ),
    );
    const sp = captured[0].options.systemPrompt as { type: string; preset: string; append: string };
    expect(sp.type).toBe('preset');
    expect(sp.preset).toBe('claude_code');
    expect(sp.append).toContain('# Ada — CEO');
    expect(sp.append).toContain('- lesson');
  });

  it('tells the model its absolute workspace path (live bug: it guessed the home dir / a POSIX /tmp path)', async () => {
    const captured: SdkQueryArgs[] = [];
    const c = await ctx();
    await collect(new ClaudeCodeRuntime(once(captured)).run(c));
    const sp = captured[0].options.systemPrompt as { append: string };
    expect(sp.append).toContain(c.cwd);
    expect(sp.append).toMatch(/only (create|read|write|touch)|inside/i);
  });

  it('never forwards ANTHROPIC_API_KEY to the SDK (it would silently flip billing to per-token)', async () => {
    process.env.ANTHROPIC_API_KEY = 'sk-ant-api03-should-never-reach-the-agent-0000';
    const captured: SdkQueryArgs[] = [];
    await collect(new ClaudeCodeRuntime(once(captured)).run(await ctx()));
    const env = captured[0].options.env as Record<string, string | undefined> | undefined;
    expect(env).toBeDefined();
    expect(env!.ANTHROPIC_API_KEY).toBeUndefined();
    // …but the rest of the environment (PATH, auth token) still flows through.
    expect(env!.PATH ?? env!.Path).toBeTruthy();
  });

  it('keeps subscription auth: CLAUDE_CODE_OAUTH_TOKEN is preserved', async () => {
    process.env.CLAUDE_CODE_OAUTH_TOKEN = 'oauth-test-token';
    try {
      const captured: SdkQueryArgs[] = [];
      await collect(new ClaudeCodeRuntime(once(captured)).run(await ctx()));
      const env = captured[0].options.env as Record<string, string | undefined>;
      expect(env.CLAUDE_CODE_OAUTH_TOKEN).toBe('oauth-test-token');
    } finally {
      delete process.env.CLAUDE_CODE_OAUTH_TOKEN;
    }
  });
});

describe('ClaudeCodeRuntime — options & permission wiring', () => {
  it('uses bypassPermissions only when there is no governance gate', async () => {
    const a: SdkQueryArgs[] = [];
    await collect(new ClaudeCodeRuntime(once(a)).run(await ctx()));
    expect(a[0].options.permissionMode).toBe('bypassPermissions');

    const b: SdkQueryArgs[] = [];
    await collect(
      new ClaudeCodeRuntime(once(b)).run(
        await ctx({ canUseTool: async () => ({ behavior: 'allow' }) }),
      ),
    );
    expect(b[0].options.permissionMode).toBe('default');
    expect(typeof b[0].options.canUseTool).toBe('function');
  });

  it('an explicit permissionMode on the context wins', async () => {
    const a: SdkQueryArgs[] = [];
    await collect(new ClaudeCodeRuntime(once(a)).run(await ctx({ permissionMode: 'plan' })));
    expect(a[0].options.permissionMode).toBe('plan');
  });

  it('forwards tool restrictions and maxTurns only when provided', async () => {
    const a: SdkQueryArgs[] = [];
    await collect(new ClaudeCodeRuntime(once(a)).run(await ctx()));
    for (const k of ['allowedTools', 'tools', 'disallowedTools', 'maxTurns', 'resume']) {
      expect(k in a[0].options, k).toBe(false);
    }

    const b: SdkQueryArgs[] = [];
    await collect(
      new ClaudeCodeRuntime(once(b)).run(
        await ctx({ allowedTools: ['Read', 'Write'], limits: { maxTurns: 3 } }),
      ),
    );
    expect(b[0].options.maxTurns).toBe(3);
  });

  it('a governance whitelist restricts which tools EXIST (`tools`) — it must never become SDK `allowedTools`, which pre-approves and skips the gate', async () => {
    const a: SdkQueryArgs[] = [];
    await collect(
      new ClaudeCodeRuntime(once(a)).run(await ctx({ allowedTools: ['Read', 'Write'] })),
    );
    expect(a[0].options.tools).toEqual(['Read', 'Write']);
    expect('allowedTools' in a[0].options).toBe(false);
  });

  it('denied tools are hard-blocked via `disallowedTools` (live bug: the SDK ran an auto-approved Bash command that canUseTool never saw)', async () => {
    const a: SdkQueryArgs[] = [];
    await collect(
      new ClaudeCodeRuntime(once(a)).run(await ctx({ disallowedTools: ['Bash', 'WebFetch'] })),
    );
    expect(a[0].options.disallowedTools).toEqual(['Bash', 'WebFetch']);
  });

  it('an empty denied list adds nothing', async () => {
    const a: SdkQueryArgs[] = [];
    await collect(new ClaudeCodeRuntime(once(a)).run(await ctx({ disallowedTools: [] })));
    expect('disallowedTools' in a[0].options).toBe(false);
  });

  it('uses ctx.resumeSessionId on run() as the SDK resume id', async () => {
    const a: SdkQueryArgs[] = [];
    await collect(new ClaudeCodeRuntime(once(a)).run(await ctx({ resumeSessionId: 'prev' })));
    expect(a[0].options.resume).toBe('prev');
  });

  it('passes the task as the prompt', async () => {
    const a: SdkQueryArgs[] = [];
    await collect(new ClaudeCodeRuntime(once(a)).run(await ctx({ task: 'build the thing' })));
    expect(a[0].prompt).toBe('build the thing');
  });

  it('does not write CLAUDE.md when there is no systemPromptAppend', async () => {
    const c = await ctx();
    await collect(new ClaudeCodeRuntime(once([])).run(c));
    await expect(access(path.join(c.cwd, 'CLAUDE.md'))).rejects.toThrow();
  });
});

describe('ClaudeCodeRuntime — governance bridge (canUseTool)', () => {
  /** Fake SDK that calls canUseTool the way the real SDK does, then reports back. */
  function gatedQuery(
    toolName: string,
    input: unknown,
    sink: { result?: unknown; signal?: AbortSignal },
  ) {
    return (args: SdkQueryArgs): AsyncIterable<SdkMessage> => {
      const opts = args.options as {
        canUseTool: (n: string, i: unknown) => Promise<unknown>;
        abortController: AbortController;
      };
      sink.signal = opts.abortController.signal;
      return (async function* () {
        yield { type: 'system', subtype: 'init', session_id: 's1' } as SdkMessage;
        sink.result = await opts.canUseTool(toolName, input);
        if (opts.abortController.signal.aborted) throw new Error('aborted by pause');
        yield success;
      })();
    };
  }

  it('allow → SDK gets {behavior:allow, updatedInput}', async () => {
    const sink: { result?: unknown } = {};
    const events = await collect(
      new ClaudeCodeRuntime(gatedQuery('Write', { file_path: 'a' }, sink)).run(
        await ctx({ canUseTool: async () => ({ behavior: 'allow' }) }),
      ),
    );
    expect(sink.result).toEqual({ behavior: 'allow', updatedInput: { file_path: 'a' } });
    expect(events.at(-1)?.kind).toBe('completed');
  });

  it('deny → SDK gets {behavior:deny, message}; run continues', async () => {
    const sink: { result?: unknown } = {};
    const events = await collect(
      new ClaudeCodeRuntime(gatedQuery('Bash', { command: 'rm -rf /' }, sink)).run(
        await ctx({ canUseTool: async () => ({ behavior: 'deny', message: 'nope' }) }),
      ),
    );
    expect(sink.result).toEqual({ behavior: 'deny', message: 'nope' });
    expect(events.at(-1)?.kind).toBe('completed');
  });

  it('pause → aborts the SDK run, swallows the abort, and ends with needs_approval carrying the approval id', async () => {
    const sink: { result?: unknown; signal?: AbortSignal } = {};
    const events = await collect(
      new ClaudeCodeRuntime(gatedQuery('Deploy', { env: 'prod' }, sink)).run(
        await ctx({
          canUseTool: async () => ({
            behavior: 'pause',
            message: 'needs approval',
            approvalId: 'appr-1',
          }),
        }),
      ),
    );
    expect(sink.signal?.aborted).toBe(true);
    const last = events.at(-1)!;
    expect(last).toEqual({
      kind: 'needs_approval',
      toolName: 'Deploy',
      input: { env: 'prod' },
      approvalRef: 'appr-1',
    });
    expect(events.some((e) => e.kind === 'completed')).toBe(false);
  });
});

describe('ClaudeCodeRuntime — PreToolUse hook (gate authority over SDK auto-approval)', () => {
  type Hook = (
    input: unknown,
    id: string | undefined,
    o: { signal: AbortSignal },
  ) => Promise<Record<string, unknown>>;

  /** Fake SDK that fires the PreToolUse hook (as the real one does for EVERY call), then optionally canUseTool. */
  function hookedQuery(
    calls: Array<{ tool: string; input: unknown; id: string; alsoCanUseTool?: boolean }>,
    sink: { hookOut: Array<Record<string, unknown>>; canUseOut: unknown[]; signal?: AbortSignal },
  ) {
    return (args: SdkQueryArgs): AsyncIterable<SdkMessage> => {
      const opts = args.options as {
        hooks?: { PreToolUse?: Array<{ hooks: Hook[] }> };
        canUseTool: (
          n: string,
          i: unknown,
          o: { toolUseID: string; signal: AbortSignal },
        ) => Promise<unknown>;
        abortController: AbortController;
      };
      sink.signal = opts.abortController.signal;
      return (async function* () {
        yield { type: 'system', subtype: 'init', session_id: 's' } as SdkMessage;
        for (const c of calls) {
          const hook = opts.hooks!.PreToolUse![0].hooks[0];
          const out = await hook(
            {
              hook_event_name: 'PreToolUse',
              tool_name: c.tool,
              tool_input: c.input,
              tool_use_id: c.id,
            },
            c.id,
            { signal: opts.abortController.signal },
          );
          sink.hookOut.push(out);
          if (opts.abortController.signal.aborted) throw new Error('aborted');
          const denied =
            (out.hookSpecificOutput as { permissionDecision?: string } | undefined)
              ?.permissionDecision === 'deny';
          if (c.alsoCanUseTool && !denied) {
            sink.canUseOut.push(
              await opts.canUseTool(c.tool, c.input as Record<string, unknown>, {
                toolUseID: c.id,
                signal: opts.abortController.signal,
              }),
            );
          }
        }
        yield success;
      })();
    };
  }
  const sink = (): {
    hookOut: Array<Record<string, unknown>>;
    canUseOut: unknown[];
    signal?: AbortSignal;
  } => ({ hookOut: [], canUseOut: [] });

  it('installs a PreToolUse hook when there is a gate, and none otherwise', async () => {
    const withGate: SdkQueryArgs[] = [];
    await collect(
      new ClaudeCodeRuntime(once(withGate)).run(
        await ctx({ canUseTool: async () => ({ behavior: 'allow' }) }),
      ),
    );
    expect((withGate[0].options.hooks as { PreToolUse: unknown[] }).PreToolUse).toHaveLength(1);

    const noGate: SdkQueryArgs[] = [];
    await collect(new ClaudeCodeRuntime(once(noGate)).run(await ctx()));
    expect('hooks' in noGate[0].options).toBe(false);
  });

  it('allow → the hook stays out of the way (empty output, SDK flow continues)', async () => {
    const s = sink();
    await collect(
      new ClaudeCodeRuntime(
        hookedQuery([{ tool: 'Read', input: { file_path: 'a' }, id: 't1' }], s),
      ).run(await ctx({ canUseTool: async () => ({ behavior: 'allow' }) })),
    );
    expect(s.hookOut).toEqual([{}]);
  });

  it('deny → the hook blocks the call with the reason', async () => {
    const s = sink();
    await collect(
      new ClaudeCodeRuntime(
        hookedQuery([{ tool: 'Bash', input: { command: 'rm -rf /' }, id: 't1' }], s),
      ).run(await ctx({ canUseTool: async () => ({ behavior: 'deny', message: 'nope' }) })),
    );
    expect(s.hookOut[0]).toEqual({
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'deny',
        permissionDecisionReason: 'nope',
      },
    });
  });

  it('pause via the hook aborts the run and ends with needs_approval (even when the SDK would have auto-approved the call)', async () => {
    const s = sink();
    const events = await collect(
      new ClaudeCodeRuntime(
        hookedQuery([{ tool: 'Bash', input: { command: 'node --version' }, id: 't1' }], s),
      ).run(
        await ctx({
          canUseTool: async () => ({
            behavior: 'pause',
            message: 'approve me',
            approvalId: 'ap-9',
          }),
        }),
      ),
    );
    expect(s.signal?.aborted).toBe(true);
    expect(events.at(-1)).toEqual({
      kind: 'needs_approval',
      toolName: 'Bash',
      input: { command: 'node --version' },
      approvalRef: 'ap-9',
    });
  });

  it('a pause wins even if the SDK keeps going and emits a normal completion afterwards (live: it does not stop on abort)', async () => {
    const stubborn = (args: SdkQueryArgs): AsyncIterable<SdkMessage> => {
      const opts = args.options as {
        hooks: { PreToolUse: Array<{ hooks: Hook[] }> };
        abortController: AbortController;
      };
      return (async function* () {
        yield { type: 'system', subtype: 'init', session_id: 's' } as SdkMessage;
        await opts.hooks.PreToolUse[0].hooks[0](
          {
            hook_event_name: 'PreToolUse',
            tool_name: 'Bash',
            tool_input: { command: 'ls' },
            tool_use_id: 't1',
          },
          't1',
          { signal: opts.abortController.signal },
        );
        // The model reacts to the denial, then the SDK reports a normal success — no exception on abort.
        yield {
          type: 'assistant',
          message: { content: [{ type: 'text', text: 'please approve' }] },
        } as SdkMessage;
        yield {
          type: 'result',
          subtype: 'success',
          result: 'please approve',
          total_cost_usd: 0.01,
          session_id: 's',
        } as SdkMessage;
      })();
    };
    const events = await collect(
      new ClaudeCodeRuntime(stubborn).run(
        await ctx({
          canUseTool: async () => ({ behavior: 'pause', message: 'approve', approvalId: 'ap-1' }),
        }),
      ),
    );
    expect(events.some((e) => e.kind === 'completed')).toBe(false);
    expect(events.at(-1)).toMatchObject({
      kind: 'needs_approval',
      toolName: 'Bash',
      approvalRef: 'ap-1',
    });
    expect(events.some((e) => e.kind === 'session')).toBe(true); // the session id is kept so the run can resume
  });

  it('evaluates the gate exactly once per tool call even when both the hook and canUseTool fire (a one-shot approval must not be consumed twice)', async () => {
    const seen: string[] = [];
    const s = sink();
    await collect(
      new ClaudeCodeRuntime(
        hookedQuery(
          [{ tool: 'Write', input: { file_path: 'a' }, id: 't1', alsoCanUseTool: true }],
          s,
        ),
      ).run(
        await ctx({
          canUseTool: async (t) => {
            seen.push(t);
            return { behavior: 'allow' };
          },
        }),
      ),
    );
    expect(seen).toEqual(['Write']);
    expect(s.canUseOut).toEqual([{ behavior: 'allow', updatedInput: { file_path: 'a' } }]);
  });

  it('different tool calls are evaluated independently', async () => {
    const seen: string[] = [];
    const s = sink();
    await collect(
      new ClaudeCodeRuntime(
        hookedQuery(
          [
            { tool: 'Write', input: { file_path: 'a' }, id: 't1', alsoCanUseTool: true },
            { tool: 'Write', input: { file_path: 'b' }, id: 't2', alsoCanUseTool: true },
          ],
          s,
        ),
      ).run(
        await ctx({
          canUseTool: async (t, i) => {
            seen.push(`${t}:${(i as { file_path: string }).file_path}`);
            return { behavior: 'allow' };
          },
        }),
      ),
    );
    expect(seen).toEqual(['Write:a', 'Write:b']);
  });
});

describe('ClaudeCodeRuntime — failure & cancellation', () => {
  it('rethrows a genuine SDK error (not caused by an approval pause)', async () => {
    const boom = (): AsyncIterable<SdkMessage> =>
      (async function* () {
        yield { type: 'system', subtype: 'init', session_id: 's' } as SdkMessage;
        throw new Error('network down');
      })();
    await expect(collect(new ClaudeCodeRuntime(boom).run(await ctx()))).rejects.toThrow(
      'network down',
    );
  });

  it('a non-success result becomes a failed event with the SDK subtype', async () => {
    const events = await collect(
      new ClaudeCodeRuntime(once([], [{ type: 'result', subtype: 'error_max_turns' }])).run(
        await ctx(),
      ),
    );
    expect(events).toEqual([{ kind: 'failed', error: 'error_max_turns' }]);
  });

  it('aborts the underlying SDK run when the consumer stops early (timeout / budget kill backstop)', async () => {
    let signal: AbortSignal | undefined;
    const slow = (args: SdkQueryArgs): AsyncIterable<SdkMessage> => {
      signal = (args.options as { abortController: AbortController }).abortController.signal;
      return (async function* () {
        yield { type: 'system', subtype: 'init', session_id: 's' } as SdkMessage;
        yield {
          type: 'assistant',
          message: { content: [{ type: 'text', text: 'still going' }] },
        } as SdkMessage;
        yield success;
      })();
    };
    const iterator = new ClaudeCodeRuntime(slow).run(await ctx())[Symbol.asyncIterator]();
    await iterator.next(); // session
    expect(signal?.aborted).toBe(false);
    await iterator.return?.(undefined);
    expect(signal?.aborted).toBe(true);
  });
});

import { Inject, Injectable, Logger } from '@nestjs/common';
import { writeFile } from 'node:fs/promises';
import * as path from 'node:path';
import { AgentRuntime, PermissionDecision, RuntimeEvent, RuntimeRunContext } from '../runtime.port';
import { SDK_QUERY, SdkQueryFn } from './sdk.provider';
import { normalizeSdkMessage } from './message-normalizer';
import { agentEnv } from '../../../infrastructure/security/safe-env';

/**
 * The environment handed to the agent process is an allowlist (see safe-env): toolchain,
 * proxy and subscription auth only. ANTHROPIC_API_KEY never passes, so a stray key cannot
 * switch billing to per-token charges (docs §7.1), and server secrets such as DATABASE_URL
 * never reach the agent or the shell commands it runs.
 */

/**
 * The employee's identity/memory plus an explicit statement of the workspace. The
 * model otherwise has to guess its working directory (observed live: it picked the
 * user's home directory, or a POSIX `/tmp/...` path the native Write tool resolves
 * to a different place on Windows).
 */
/**
 * Claude Code's own command sandbox for everything the agent runs in its shell: OS-level isolation
 * (a separate rights-less user on Windows, bubblewrap/seatbelt elsewhere), writes confined to the
 * workspace, common credential stores unreadable, and the subscription token hidden from commands.
 * FORGE_AGENT_SANDBOX: `on` (default; warns and degrades if the platform can't sandbox),
 * `required` (refuse to run unsandboxed), `off`.
 */
export function agentSandbox(
  cwd: string,
  mode = (process.env.FORGE_AGENT_SANDBOX ?? 'on').toLowerCase(),
): Record<string, unknown> | undefined {
  if (mode === 'off' || mode === 'false' || mode === '0') return undefined;
  return {
    enabled: true,
    failIfUnavailable: mode === 'required',
    autoAllowBashIfSandboxed: true, // Forge's PreToolUse gate still judges every call
    allowUnsandboxedCommands: false, // the agent cannot opt a command out
    filesystem: { allowWrite: [cwd] },
    credentials: {
      envVars: [{ name: 'CLAUDE_CODE_OAUTH_TOKEN', mode: 'deny' }],
      files: [
        '~/.ssh',
        '~/.aws',
        '~/.azure',
        '~/.config/gcloud',
        '~/.config/gh',
        '~/.docker/config.json',
        '~/.npmrc',
        '~/.git-credentials',
        '~/.claude/.credentials.json',
      ].map((p) => ({ path: p, mode: 'deny' })),
    },
  };
}

function workspaceNotice(ctx: RuntimeRunContext): string {
  return [
    ctx.systemPromptAppend ?? '',
    '',
    '## Workspace',
    `Your working directory is: ${ctx.cwd}`,
    'Create and read files only inside it. Use paths relative to it, or absolute paths',
    'that start with it. Never write elsewhere (not the home directory, not /tmp).',
  ].join('\n');
}

/**
 * First-class coding runtime backed by the Claude Agent SDK. Writes an
 * employee-specific CLAUDE.md into the workspace (spec §9.5), runs the SDK, and
 * yields normalized RuntimeEvents.
 */
@Injectable()
export class ClaudeCodeRuntime implements AgentRuntime {
  readonly key = 'claude_code';
  private readonly logger = new Logger(ClaudeCodeRuntime.name);

  constructor(@Inject(SDK_QUERY) private readonly query: SdkQueryFn) {}

  run(ctx: RuntimeRunContext): AsyncIterable<RuntimeEvent> {
    return this.execute(ctx, ctx.resumeSessionId);
  }

  resume(sessionId: string, ctx: RuntimeRunContext): AsyncIterable<RuntimeEvent> {
    return this.execute(ctx, sessionId);
  }

  private async *execute(ctx: RuntimeRunContext, resume?: string): AsyncIterable<RuntimeEvent> {
    if (ctx.systemPromptAppend) {
      await writeFile(path.join(ctx.cwd, 'CLAUDE.md'), ctx.systemPromptAppend, 'utf8');
    }

    const abortController = new AbortController();
    // Forge stopping the work (cancel, limit) ends the agent process, not just our listening.
    if (ctx.abortSignal?.aborted) abortController.abort();
    ctx.abortSignal?.addEventListener('abort', () => abortController.abort(), { once: true });
    let pendingApproval: { toolName: string; input: unknown; approvalRef: string } | undefined;

    const options: Record<string, unknown> = {
      cwd: ctx.cwd,
      model: ctx.model,
      // Employees must not inherit the operator's personal Claude config (global
      // additionalDirectories, hooks, skills, CLAUDE.md). Even ['project'] walks up the
      // ancestor tree and loads e.g. ~/.claude/CLAUDE.md, so load nothing from disk and
      // deliver the employee identity + memory through the system prompt instead.
      settingSources: [],
      systemPrompt: {
        type: 'preset',
        preset: 'claude_code',
        append: workspaceNotice(ctx),
      },
      env: agentEnv(),
      // With a governance gate present, use 'default' so the SDK consults
      // canUseTool (spec §9.3); otherwise bypass for headless runs.
      permissionMode: ctx.permissionMode ?? (ctx.canUseTool ? 'default' : 'bypassPermissions'),
      abortController,
    };
    // NB: the SDK's own `allowedTools` means "auto-approve, skip permission checks" — passing
    // governance lists there would let those tools bypass canUseTool (approvals, confinement).
    // A whitelist therefore restricts which tools exist (`tools`); denials are hard-removed
    // (`disallowedTools`), since the SDK also auto-approves some calls without consulting canUseTool.
    if (ctx.allowedTools) options.tools = ctx.allowedTools;
    if (ctx.disallowedTools?.length) options.disallowedTools = ctx.disallowedTools;
    if (ctx.limits?.maxTurns) options.maxTurns = ctx.limits.maxTurns;
    const sandbox = agentSandbox(ctx.cwd);
    if (sandbox) options.sandbox = sandbox;
    if (resume) options.resume = resume;

    if (ctx.canUseTool) {
      const gate = ctx.canUseTool;
      // Each tool call is judged exactly once: the PreToolUse hook and canUseTool can both
      // fire for the same call, and a one-shot approval must not be consumed twice.
      const decisions = new Map<string, Promise<PermissionDecision>>();
      const decide = (
        toolName: string,
        input: unknown,
        toolUseId?: string,
      ): Promise<PermissionDecision> => {
        const judge = async (): Promise<PermissionDecision> => {
          const decision = await gate(toolName, input);
          if (decision.behavior === 'pause') {
            // record intent, abort the run, emit needs_approval below.
            pendingApproval = { toolName, input, approvalRef: decision.approvalId };
            abortController.abort();
          }
          return decision;
        };
        if (!toolUseId) return judge();
        const cached = decisions.get(toolUseId);
        if (cached) return cached;
        const fresh = judge();
        decisions.set(toolUseId, fresh);
        return fresh;
      };

      options.canUseTool = async (
        toolName: string,
        input: unknown,
        opts?: { toolUseID?: string },
      ) => {
        const decision = await decide(toolName, input, opts?.toolUseID);
        if (decision.behavior === 'allow') {
          return { behavior: 'allow', updatedInput: input };
        }
        return { behavior: 'deny', message: decision.message };
      };

      // The SDK auto-approves some calls (e.g. "safe" read-only Bash) WITHOUT consulting canUseTool.
      // PreToolUse fires for every call before its own permission logic, so Forge's gate stays
      // authoritative: approval-required and out-of-workspace calls are caught here too.
      options.hooks = {
        PreToolUse: [
          {
            hooks: [
              async (hookInput: unknown, toolUseId: string | undefined) => {
                const h = hookInput as {
                  tool_name: string;
                  tool_input: unknown;
                  tool_use_id?: string;
                };
                const decision = await decide(
                  h.tool_name,
                  h.tool_input,
                  toolUseId ?? h.tool_use_id,
                );
                if (decision.behavior === 'allow') return {};
                return {
                  hookSpecificOutput: {
                    hookEventName: 'PreToolUse',
                    permissionDecision: 'deny',
                    permissionDecisionReason: decision.message,
                  },
                };
              },
            ],
          },
        ],
      };
    }

    this.logger.log(
      `Starting Claude Code run for work item ${ctx.workItemId} (model ${ctx.model})`,
    );

    try {
      const iterable = this.query({ prompt: ctx.task, options });
      for await (const msg of iterable) {
        for (const event of normalizeSdkMessage(msg)) {
          // Once an approval is pending the run is parked: the SDK may keep talking (it does not
          // always stop on abort), but nothing after the pause may be reported — least of all a
          // "completed" that would make the worker treat a gated run as finished.
          if (pendingApproval && event.kind !== 'session') continue;
          yield event;
        }
        if (pendingApproval) break;
      }
    } catch (err) {
      // An abort we triggered for approval is expected; anything else is real.
      if (!pendingApproval) {
        throw err;
      }
    } finally {
      // If the consumer breaks early (platform timeout / budget kill), aborting
      // here stops the underlying SDK run — the circuit-breaker backstop (§21).
      abortController.abort();
    }

    if (pendingApproval) {
      yield {
        kind: 'needs_approval',
        toolName: pendingApproval.toolName,
        input: pendingApproval.input,
        approvalRef: pendingApproval.approvalRef,
      };
    }
  }
}

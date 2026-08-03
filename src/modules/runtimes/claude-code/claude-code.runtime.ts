import { Inject, Injectable, Logger } from '@nestjs/common';
import { writeFile } from 'node:fs/promises';
import * as path from 'node:path';
import { AgentRuntime, RuntimeEvent, RuntimeRunContext } from '../runtime.port';
import { SDK_QUERY, SdkQueryFn } from './sdk.provider';
import { normalizeSdkMessage } from './message-normalizer';

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

  private async *execute(
    ctx: RuntimeRunContext,
    resume?: string,
  ): AsyncIterable<RuntimeEvent> {
    if (ctx.systemPromptAppend) {
      await writeFile(path.join(ctx.cwd, 'CLAUDE.md'), ctx.systemPromptAppend, 'utf8');
    }

    const abortController = new AbortController();
    let pendingApproval: { toolName: string; input: unknown; approvalRef: string } | undefined;

    const options: Record<string, unknown> = {
      cwd: ctx.cwd,
      model: ctx.model,
      // With a governance gate present, use 'default' so the SDK consults
      // canUseTool (spec §9.3); otherwise bypass for headless runs.
      permissionMode: ctx.permissionMode ?? (ctx.canUseTool ? 'default' : 'bypassPermissions'),
      abortController,
    };
    if (ctx.allowedTools) options.allowedTools = ctx.allowedTools;
    if (ctx.limits?.maxTurns) options.maxTurns = ctx.limits.maxTurns;
    if (resume) options.resume = resume;

    if (ctx.canUseTool) {
      const gate = ctx.canUseTool;
      options.canUseTool = async (toolName: string, input: unknown) => {
        const decision = await gate(toolName, input);
        if (decision.behavior === 'allow') {
          return { behavior: 'allow', updatedInput: input };
        }
        if (decision.behavior === 'deny') {
          return { behavior: 'deny', message: decision.message };
        }
        // pause: record intent, abort the run, emit needs_approval below.
        pendingApproval = { toolName, input, approvalRef: decision.approvalId };
        abortController.abort();
        return { behavior: 'deny', message: decision.message };
      };
    }

    this.logger.log(`Starting Claude Code run for work item ${ctx.workItemId} (model ${ctx.model})`);

    try {
      const iterable = this.query({ prompt: ctx.task, options });
      for await (const msg of iterable) {
        for (const event of normalizeSdkMessage(msg)) {
          yield event;
        }
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

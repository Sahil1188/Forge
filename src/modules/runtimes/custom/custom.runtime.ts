import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { AgentRuntime, RuntimeEvent, RuntimeRunContext } from '../runtime.port';
import { ProviderRegistry } from './provider-registry';
import { ToolExecutor } from './tool-executor';
import { ChatMessage } from './model-provider';

/**
 * Native agent runtime (spec §3.2): drives a provider's model through a tool-use
 * loop, calling the model's API directly. Emits the same normalized RuntimeEvent
 * stream as ClaudeCodeRuntime, so governance, budget, and approval backstops
 * behave identically. Built out in M11 for worker employees; CEO/leads stay on
 * ClaudeCodeRuntime.
 */
@Injectable()
export class CustomRuntime implements AgentRuntime {
  readonly key = 'custom';
  private readonly logger = new Logger(CustomRuntime.name);

  constructor(
    private readonly providers: ProviderRegistry,
    private readonly tools: ToolExecutor,
  ) {}

  run(ctx: RuntimeRunContext): AsyncIterable<RuntimeEvent> {
    return this.execute(ctx);
  }

  resume(_sessionId: string, ctx: RuntimeRunContext): AsyncIterable<RuntimeEvent> {
    // V1: resume re-runs the task; an approved gate now passes on the retry.
    return this.execute(ctx);
  }

  private async *execute(ctx: RuntimeRunContext): AsyncIterable<RuntimeEvent> {
    const sessionId = randomUUID();
    yield { kind: 'session', sessionId };

    const provider = this.providers.get(ctx.provider ?? 'anthropic');
    const toolDefs = this.tools.definitions();
    const messages: ChatMessage[] = [{ role: 'user', content: ctx.task }];
    const maxTurns = ctx.limits?.maxTurns ?? 20;

    let inputTokens = 0;
    let outputTokens = 0;
    let costUsd = 0;

    for (let turn = 0; turn < maxTurns; turn += 1) {
      const response = await provider.chat({
        model: ctx.model,
        system: ctx.systemPromptAppend,
        messages,
        tools: toolDefs,
        maxTokens: 4096,
      });
      inputTokens += response.usage.inputTokens;
      outputTokens += response.usage.outputTokens;
      costUsd += response.usage.costUsd ?? 0;

      if (response.text) {
        yield { kind: 'assistant_text', text: response.text };
      }

      if (response.toolCalls.length === 0 || response.stopReason === 'end_turn') {
        yield { kind: 'usage', inputTokens, outputTokens, costUsd };
        yield { kind: 'completed', result: response.text, sessionId };
        return;
      }

      messages.push({ role: 'assistant', content: response.text, toolCalls: response.toolCalls });

      for (const call of response.toolCalls) {
        yield { kind: 'tool_use', toolName: call.name, toolUseId: call.id, input: call.input };

        // Same governance gate as ClaudeCodeRuntime (spec §9.3/§20).
        if (ctx.canUseTool) {
          const decision = await ctx.canUseTool(call.name, call.input);
          if (decision.behavior === 'deny') {
            messages.push({ role: 'tool', toolCallId: call.id, content: `Denied: ${decision.message}` });
            yield { kind: 'tool_result', toolUseId: call.id, isError: true, content: decision.message };
            continue;
          }
          if (decision.behavior === 'pause') {
            yield {
              kind: 'needs_approval',
              toolName: call.name,
              input: call.input,
              approvalRef: decision.approvalId,
            };
            return;
          }
        }

        const result = await this.tools.execute(call.name, call.input, ctx.cwd);
        messages.push({ role: 'tool', toolCallId: call.id, content: result.output });
        yield { kind: 'tool_result', toolUseId: call.id, isError: result.isError, content: result.output };
      }
    }

    yield { kind: 'usage', inputTokens, outputTokens, costUsd };
    yield { kind: 'failed', error: 'max_turns' };
  }
}

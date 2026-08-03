import { Injectable } from '@nestjs/common';
import { ChatRequest, ChatResponse, ModelProvider, ToolCall } from './model-provider';

interface AnthropicBlock {
  type: string;
  text?: string;
  id?: string;
  name?: string;
  input?: unknown;
}

/**
 * Real provider calling the Anthropic Messages API directly (spec §3.2).
 *
 * IMPORTANT (billing, docs §7.1): this is the per-token API path used only by
 * CustomRuntime workers — it reads `FORGE_ANTHROPIC_API_KEY`, deliberately NOT
 * `ANTHROPIC_API_KEY`, so it can never hijack the subscription-billed Claude
 * Code runtime. Env-guarded: throws if the key is absent (tests use a mock).
 */
@Injectable()
export class AnthropicMessagesProvider implements ModelProvider {
  readonly name = 'anthropic';

  async chat(request: ChatRequest): Promise<ChatResponse> {
    const apiKey = process.env.FORGE_ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error(
        'FORGE_ANTHROPIC_API_KEY is not set. CustomRuntime provider "anthropic" needs its own ' +
          'per-token key (separate from Claude Code subscription auth — see docs §7.1).',
      );
    }

    const body = {
      model: request.model,
      max_tokens: request.maxTokens ?? 4096,
      system: request.system,
      tools: request.tools.map((t) => ({
        name: t.name,
        description: t.description,
        input_schema: t.inputSchema,
      })),
      messages: request.messages.map((m) => {
        if (m.role === 'tool') {
          return {
            role: 'user',
            content: [{ type: 'tool_result', tool_use_id: m.toolCallId, content: m.content }],
          };
        }
        if (m.role === 'assistant' && m.toolCalls?.length) {
          return {
            role: 'assistant',
            content: [
              ...(m.content ? [{ type: 'text', text: m.content }] : []),
              ...m.toolCalls.map((c) => ({ type: 'tool_use', id: c.id, name: c.name, input: c.input })),
            ],
          };
        }
        return { role: m.role, content: m.content };
      }),
    };

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      throw new Error(`Anthropic API error ${res.status}: ${await res.text()}`);
    }
    const data = (await res.json()) as {
      content: AnthropicBlock[];
      stop_reason: string;
      usage: { input_tokens: number; output_tokens: number };
    };

    const text = data.content
      .filter((b) => b.type === 'text')
      .map((b) => b.text ?? '')
      .join('');
    const toolCalls: ToolCall[] = data.content
      .filter((b) => b.type === 'tool_use')
      .map((b) => ({ id: b.id ?? '', name: b.name ?? '', input: b.input }));

    return {
      text,
      toolCalls,
      stopReason: data.stop_reason === 'tool_use' ? 'tool_use' : 'end_turn',
      usage: {
        inputTokens: data.usage.input_tokens,
        outputTokens: data.usage.output_tokens,
      },
    };
  }
}

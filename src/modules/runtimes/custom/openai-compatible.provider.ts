import { Injectable } from '@nestjs/common';
import { ChatRequest, ChatResponse, ModelProvider, ToolCall } from './model-provider';

interface OpenAIToolCall {
  id?: string;
  type?: string;
  function?: { name?: string; arguments?: string };
}

interface OpenAIResponse {
  choices?: Array<{ message?: { content?: string | null; tool_calls?: OpenAIToolCall[] }; finish_reason?: string }>;
  usage?: { prompt_tokens?: number; completion_tokens?: number; cost?: number };
  error?: { message?: string };
}

/** Where the OpenAI-compatible endpoint is and how to reach it (gateway such as OmniRoute or OpenRouter). */
export interface OpenAICompatibleConfig {
  baseUrl: string;
  apiKey?: string;
  model?: string;
}

export function openAICompatibleConfig(env: NodeJS.ProcessEnv = process.env): OpenAICompatibleConfig | null {
  const baseUrl = env.FORGE_FALLBACK_BASE_URL?.trim();
  if (!baseUrl) return null;
  return { baseUrl: baseUrl.replace(/\/+$/, ''), apiKey: env.FORGE_FALLBACK_API_KEY?.trim() || undefined, model: env.FORGE_FALLBACK_MODEL?.trim() || undefined };
}

/**
 * Any OpenAI-compatible chat-completions endpoint with tool calling: an AI gateway such as OmniRoute
 * or OpenRouter (which rotate between many models and providers), OpenAI itself, or a local server.
 * Configured with FORGE_FALLBACK_BASE_URL / FORGE_FALLBACK_API_KEY / FORGE_FALLBACK_MODEL. The key
 * stays in Forge's process: agents and their commands never see it (safe-env allowlist).
 */
@Injectable()
export class OpenAICompatibleProvider implements ModelProvider {
  readonly name = 'openai';

  async chat(request: ChatRequest): Promise<ChatResponse> {
    const config = openAICompatibleConfig();
    if (!config) throw new Error('No fallback endpoint configured. Set FORGE_FALLBACK_BASE_URL (and FORGE_FALLBACK_API_KEY).');

    const messages: Array<Record<string, unknown>> = [];
    if (request.system) messages.push({ role: 'system', content: request.system });
    for (const m of request.messages) {
      if (m.role === 'assistant' && m.toolCalls?.length) {
        messages.push({
          role: 'assistant',
          content: m.content || null,
          tool_calls: m.toolCalls.map((c) => ({ id: c.id, type: 'function', function: { name: c.name, arguments: JSON.stringify(c.input ?? {}) } })),
        });
      } else if (m.role === 'tool') {
        messages.push({ role: 'tool', tool_call_id: m.toolCallId, content: m.content });
      } else {
        messages.push({ role: m.role, content: m.content });
      }
    }

    const body = JSON.stringify({
      model: request.model,
      messages,
      tools: request.tools.map((t) => ({ type: 'function', function: { name: t.name, description: t.description, parameters: t.inputSchema } })),
      ...(request.maxTokens ? { max_tokens: request.maxTokens } : {}),
      usage: { include: true }, // OpenRouter reports the request's cost when asked
    });
    // A gateway cycling through exhausted providers can hang for minutes (observed live: OmniRoute
    // tried several dead providers until Node's own 5-minute timeout). Bound each attempt, retry once.
    const timeoutMs = Math.max(10_000, Number(process.env.FORGE_FALLBACK_TIMEOUT_MS ?? 120_000) || 120_000);
    let res: Response | undefined;
    let raw = '';
    for (let attempt = 1; attempt <= 2; attempt += 1) {
      try {
        res = await fetch(`${config.baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            ...(config.apiKey ? { authorization: `Bearer ${config.apiKey}` } : {}),
            'x-title': 'Forge',
          },
          body,
          signal: AbortSignal.timeout(timeoutMs),
        });
        raw = await res.text();
      } catch (err) {
        if (attempt === 2) throw new Error(`Could not reach the fallback endpoint at ${config.baseUrl} (${(err as Error).message}).`);
        await new Promise((r) => setTimeout(r, 3_000));
        continue;
      }
      if ((res.status >= 500 || res.status === 429) && attempt === 1) {
        await new Promise((r) => setTimeout(r, 3_000));
        continue;
      }
      break;
    }
    if (!res) throw new Error(`Could not reach the fallback endpoint at ${config.baseUrl}.`);
    let data: OpenAIResponse = {};
    try {
      data = JSON.parse(raw) as OpenAIResponse;
    } catch {
      /* non-JSON error page */
    }
    if (!res.ok) {
      // Keep the provider's words (they say "rate limit", "insufficient credits", …) but never echo the key.
      throw new Error(`Fallback provider error ${res.status}: ${(data.error?.message ?? raw).slice(0, 300)}`);
    }

    const choice = data.choices?.[0];
    const toolCalls: ToolCall[] = (choice?.message?.tool_calls ?? [])
      .filter((c) => typeof c.function?.name === 'string')
      .map((c, i) => ({ id: c.id || `call_${i}`, name: c.function!.name!, input: safeJson(c.function?.arguments ?? '{}') }));

    return {
      text: choice?.message?.content ?? '',
      toolCalls,
      stopReason: toolCalls.length > 0 ? 'tool_use' : choice?.finish_reason === 'length' ? 'max_tokens' : 'end_turn',
      usage: {
        inputTokens: data.usage?.prompt_tokens ?? 0,
        outputTokens: data.usage?.completion_tokens ?? 0,
        costUsd: typeof data.usage?.cost === 'number' ? data.usage.cost : 0,
      },
    };
  }
}

function safeJson(s: string): unknown {
  try {
    return JSON.parse(s);
  } catch {
    return {};
  }
}

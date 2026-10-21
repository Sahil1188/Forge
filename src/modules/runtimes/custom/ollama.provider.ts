import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { ChatRequest, ChatResponse, ModelProvider, ToolCall } from './model-provider';

interface OllamaToolCall {
  function?: { name?: string; arguments?: unknown };
}

interface OllamaResponse {
  message?: { role?: string; content?: string; tool_calls?: OllamaToolCall[] };
  done_reason?: string;
  prompt_eval_count?: number;
  eval_count?: number;
}

/**
 * Local-LLM provider for CustomRuntime workers (spec §3.2), talking to an Ollama server
 * via its native `/api/chat` endpoint with tool calling. Local inference is free, so cost
 * is reported as 0. Host is `FORGE_OLLAMA_HOST` (default http://localhost:11434).
 *
 * Note: written against Ollama's documented chat/tool API and covered by mocked-fetch tests;
 * it has not been exercised against a live Ollama server in this repo's CI.
 */
@Injectable()
export class OllamaProvider implements ModelProvider {
  readonly name = 'ollama';

  async chat(request: ChatRequest): Promise<ChatResponse> {
    const host = (process.env.FORGE_OLLAMA_HOST ?? 'http://localhost:11434').replace(/\/+$/, '');

    const messages: Array<Record<string, unknown>> = [];
    if (request.system) messages.push({ role: 'system', content: request.system });
    // Ollama identifies a tool result by tool name, so remember which name each call id had.
    const nameById = new Map<string, string>();
    for (const m of request.messages) {
      if (m.role === 'assistant' && m.toolCalls?.length) {
        for (const c of m.toolCalls) nameById.set(c.id, c.name);
        messages.push({
          role: 'assistant',
          content: m.content,
          tool_calls: m.toolCalls.map((c) => ({ function: { name: c.name, arguments: c.input } })),
        });
      } else if (m.role === 'tool') {
        messages.push({ role: 'tool', content: m.content, tool_name: nameById.get(m.toolCallId ?? '') });
      } else {
        messages.push({ role: m.role, content: m.content });
      }
    }

    let res: Response;
    try {
      res = await fetch(`${host}/api/chat`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          model: request.model,
          stream: false,
          messages,
          tools: request.tools.map((t) => ({
            type: 'function',
            function: { name: t.name, description: t.description, parameters: t.inputSchema },
          })),
          options: request.maxTokens ? { num_predict: request.maxTokens } : undefined,
        }),
      });
    } catch (err) {
      throw new Error(
        `Could not reach Ollama at ${host} (${(err as Error).message}). Is it running? Set FORGE_OLLAMA_HOST if it is elsewhere.`,
      );
    }
    if (!res.ok) {
      throw new Error(`Ollama error ${res.status}: ${await res.text()}`);
    }
    const data = (await res.json()) as OllamaResponse;

    const toolCalls: ToolCall[] = (data.message?.tool_calls ?? [])
      .filter((c) => typeof c.function?.name === 'string')
      .map((c) => ({
        id: `call_${randomUUID()}`, // Ollama does not assign call ids
        name: c.function!.name!,
        input: typeof c.function!.arguments === 'string' ? safeJson(c.function!.arguments) : (c.function!.arguments ?? {}),
      }));

    return {
      text: data.message?.content ?? '',
      toolCalls,
      stopReason: toolCalls.length > 0 ? 'tool_use' : data.done_reason === 'length' ? 'max_tokens' : 'end_turn',
      usage: {
        inputTokens: data.prompt_eval_count ?? 0,
        outputTokens: data.eval_count ?? 0,
        costUsd: 0,
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

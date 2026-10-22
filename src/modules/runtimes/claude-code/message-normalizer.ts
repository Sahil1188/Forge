import { RuntimeEvent } from '../runtime.port';

/**
 * Loose shape of Claude Agent SDK messages. Kept intentionally permissive — we
 * only read the fields we normalize, so SDK additions won't break us.
 */
export interface SdkMessage {
  type: string;
  subtype?: string;
  session_id?: string;
  result?: string;
  total_cost_usd?: number;
  usage?: { input_tokens?: number; output_tokens?: number };
  rate_limit_info?: { status?: string; resetsAt?: number; rateLimitType?: string; utilization?: number };
  message?: {
    content?: Array<{
      type: string;
      text?: string;
      id?: string;
      name?: string;
      input?: unknown;
      tool_use_id?: string;
      content?: unknown;
      is_error?: boolean;
    }>;
  };
}

/**
 * Translates a single Claude Agent SDK message into zero or more normalized
 * `RuntimeEvent`s. Pure and SDK-version-tolerant so it can be unit-tested with
 * canned messages and no credentials.
 */
export function normalizeSdkMessage(msg: SdkMessage): RuntimeEvent[] {
  const out: RuntimeEvent[] = [];

  switch (msg.type) {
    case 'system':
      if (msg.subtype === 'init' && msg.session_id) {
        out.push({ kind: 'session', sessionId: msg.session_id });
      }
      break;

    case 'assistant':
      for (const block of msg.message?.content ?? []) {
        if (block.type === 'text' && block.text) {
          out.push({ kind: 'assistant_text', text: block.text });
        } else if (block.type === 'tool_use') {
          out.push({
            kind: 'tool_use',
            toolName: block.name ?? 'unknown',
            toolUseId: block.id ?? '',
            input: block.input,
          });
        }
      }
      break;

    case 'rate_limit_event': {
      const info = msg.rate_limit_info;
      if (info && (info.status === 'allowed' || info.status === 'allowed_warning' || info.status === 'rejected')) {
        out.push({
          kind: 'rate_limit',
          status: info.status,
          // The SDK reports seconds since the epoch.
          resetsAt: typeof info.resetsAt === 'number' ? (info.resetsAt < 1e12 ? info.resetsAt * 1000 : info.resetsAt) : undefined,
          limitType: info.rateLimitType,
          utilization: info.utilization,
        });
      }
      break;
    }

    case 'user':
      for (const block of msg.message?.content ?? []) {
        if (block.type === 'tool_result') {
          out.push({
            kind: 'tool_result',
            toolUseId: block.tool_use_id ?? '',
            isError: Boolean(block.is_error),
            content: block.content,
          });
        }
      }
      break;

    case 'result':
      if (typeof msg.total_cost_usd === 'number' || msg.usage) {
        out.push({
          kind: 'usage',
          inputTokens: msg.usage?.input_tokens ?? 0,
          outputTokens: msg.usage?.output_tokens ?? 0,
          costUsd: msg.total_cost_usd ?? 0,
        });
      }
      if (msg.subtype === 'success') {
        out.push({ kind: 'completed', result: msg.result ?? '', sessionId: msg.session_id });
      } else {
        out.push({ kind: 'failed', error: msg.subtype ?? 'error' });
      }
      break;

    default:
      break;
  }

  return out;
}

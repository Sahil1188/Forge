/**
 * Provider abstraction for CustomRuntime (spec §3.2). A native agent calls each
 * model's API directly, so tool-use is expressed in a provider-neutral shape and
 * each provider maps it to/from its own wire format.
 */

export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

export interface ToolCall {
  id: string;
  name: string;
  input: unknown;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'tool';
  content: string;
  toolCalls?: ToolCall[];
  toolCallId?: string;
}

export interface ChatRequest {
  model: string;
  system?: string;
  messages: ChatMessage[];
  tools: ToolDefinition[];
  maxTokens?: number;
}

export interface ChatUsage {
  inputTokens: number;
  outputTokens: number;
  costUsd?: number;
}

export interface ChatResponse {
  text: string;
  toolCalls: ToolCall[];
  stopReason: 'end_turn' | 'tool_use' | 'max_tokens';
  usage: ChatUsage;
}

export interface ModelProvider {
  readonly name: string;
  chat(request: ChatRequest): Promise<ChatResponse>;
}

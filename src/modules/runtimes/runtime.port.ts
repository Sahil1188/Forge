/**
 * Runtime abstraction (spec §7/§9). Nothing downstream is coupled to a specific
 * SDK's message shape — observability, evaluation and budgets consume the
 * normalized `RuntimeEvent` union below.
 */

export type RuntimeEvent =
  | { kind: 'session'; sessionId: string }
  | { kind: 'assistant_text'; text: string }
  | { kind: 'tool_use'; toolName: string; toolUseId: string; input: unknown }
  | { kind: 'tool_result'; toolUseId: string; isError: boolean; content: unknown }
  | { kind: 'needs_approval'; toolName: string; input: unknown; approvalRef?: string }
  | { kind: 'usage'; inputTokens: number; outputTokens: number; costUsd: number }
  | { kind: 'completed'; result: string; sessionId?: string }
  | { kind: 'failed'; error: string };

export interface RuntimeLimits {
  maxTurns?: number;
  maxToolCalls?: number;
  timeoutMs?: number;
}

/**
 * Per-tool permission decision returned by the governance callback. `pause`
 * means "human approval required": the runtime stops and emits `needs_approval`
 * so the run can be resumed after a decision (spec §9.3/§20).
 */
export type PermissionDecision =
  | { behavior: 'allow' }
  | { behavior: 'deny'; message: string }
  | { behavior: 'pause'; message: string; approvalId: string };

export type PermissionCallback = (
  toolName: string,
  input: unknown,
) => Promise<PermissionDecision>;

export interface RuntimeRunContext {
  workItemId: string;
  employeeId: string;
  /** Working directory (an isolated workspace root). */
  cwd: string;
  /** The instruction/prompt for the agent. */
  task: string;
  /** Concrete model id chosen by the Omni Router (M8) or the employee policy. */
  model: string;
  /** Provider chosen by the Omni Router — used by CustomRuntime (spec §3.2). */
  provider?: string;
  /** Employee-specific context written as CLAUDE.md for Claude Code (spec §9.5). */
  systemPromptAppend?: string;
  /** Strict whitelist: only these tools exist for the agent. */
  allowedTools?: string[];
  /** Tools removed outright (enforced by the runtime, not just by the permission callback). */
  disallowedTools?: string[];
  permissionMode?: string;
  limits?: RuntimeLimits;
  resumeSessionId?: string;
  /** Governance gate consulted before each tool call (maps to SDK canUseTool). */
  canUseTool?: PermissionCallback;
}

export interface AgentRuntime {
  readonly key: string;
  run(ctx: RuntimeRunContext): AsyncIterable<RuntimeEvent>;
  resume(sessionId: string, ctx: RuntimeRunContext): AsyncIterable<RuntimeEvent>;
}

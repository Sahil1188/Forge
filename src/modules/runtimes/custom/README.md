# `modules/runtimes/custom/` — the native "CustomRuntime" (worker path)

A from-scratch agent that calls a model provider's API directly and runs its own tool-use loop
(spec §3.2). Built for worker employees; emits the **same** normalized events as Claude Code, so
governance/budget/approval behave identically.

| File | What it does | Significance |
| --- | --- | --- |
| `model-provider.ts` | The provider-neutral interface: `ModelProvider.chat(request) → response`, plus `ChatMessage`/`ToolDefinition`/`ToolCall`/usage types. | Lets any provider (Anthropic API, Ollama, …) plug in behind one shape. |
| `provider-registry.ts` | Maps provider name → `ModelProvider`; tests register a scripted provider. | Selects the provider the Omni Router chose. |
| `tool-executor.ts` | Implements the agent's tools: `write_file` (workspace-confined, path-traversal guarded) and `run_command`. | The hands of the custom agent; every call is governed. |
| `custom.runtime.ts` | `CustomRuntime`: the native loop — call provider → get tool calls → **gate via `canUseTool`** (deny/pause) → execute tool → feed result back → repeat until end-turn; emits normalized events. | Makes non-Claude execution real, with identical safety backstops. |
| `anthropic-messages.provider.ts` | A real HTTP provider for the Anthropic Messages API. Reads **`FORGE_ANTHROPIC_API_KEY`** (deliberately not `ANTHROPIC_API_KEY`) so it can never hijack the subscription-billed Claude Code path. | The one place a per-token API key is expected — env-guarded, clearly separated (docs §7.1). |
| `custom.runtime.spec.ts` | Unit tests with a scripted provider: tool loop + file write, governance pause, unknown-provider error. | Proves the loop without any credentials. |

**Relationships:** registered under key `custom` in `RuntimeRegistry`; provider chosen by
`routing/omni`. CEO/leads stay on `claude_code`; workers use this.

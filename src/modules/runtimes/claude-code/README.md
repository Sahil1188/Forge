# `modules/runtimes/claude-code/` — the Claude Code runtime (first-class)

Drives Claude Code via the **Claude Agent SDK** (spec §9.1 — SDK, not CLI-scraping), the primary path
for CEO/leads. Auth is the Claude Code **subscription session** — never `ANTHROPIC_API_KEY`.

| File | What it does | Significance |
| --- | --- | --- |
| `sdk.provider.ts` | The `SDK_QUERY` DI token + factory that lazily loads `@anthropic-ai/claude-agent-sdk`'s `query`. Throws only when a run is actually attempted without it. | Lets the app boot (and unit tests run) without the SDK/credentials; injectable so tests pass a fake. |
| `message-normalizer.ts` | **Pure** function mapping raw SDK messages → normalized `RuntimeEvent`s. | Decouples everything from the SDK's wire shape; unit-tested with canned messages. |
| `claude-executable.ts` | Picks the Claude Code program: `FORGE_CLAUDE_PATH`, else the SDK's bundled one, else `claude` on PATH (npm silently skips the bundled program when its download fails). | An installed Forge keeps working when the optional platform package is missing. |
| `claude-code.runtime.ts` | `ClaudeCodeRuntime`: writes the per-run `CLAUDE.md`, calls `query()` with model/tools/permission mode, wires `canUseTool` (governance), aborts on approval-pause, and (in `finally`) aborts on early consumer break — the circuit-breaker backstop. | The real execution adapter for the native Claude path. |
| `message-normalizer.spec.ts` | Unit tests for the normalizer. | — |
| `claude-code.runtime.spec.ts` | Unit tests using a fake `query` (no credentials): event stream, `CLAUDE.md` written, resume passthrough. | Proves the runtime logic without the SDK. |

**Relationships:** registered under key `claude_code` in `RuntimeRegistry`; consumes governance via
`ctx.canUseTool` built by the execution worker.

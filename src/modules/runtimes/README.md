# `modules/runtimes/` — how an employee's work is executed

A runtime is what actually runs an agent. Everything else in Forge consumes one normalised stream of
events (session, text, tool use, tool result, needs approval, usage, rate limit, completed, failed),
so an employee can run on Claude Code or on a native agent driving any model, without the rest of the
app caring.

## How it works

- **Claude Code runtime** (`claude-code/`, key `claude_code`): the Claude Agent SDK on your Claude
  **subscription** (`claude login`, or `CLAUDE_CODE_OAUTH_TOKEN` in CI). It never reads
  `ANTHROPIC_API_KEY`, so it can never switch to per-token billing. Every tool call goes through
  Forge's permission check (`canUseTool`), and the agent process gets the allowlisted environment.
- **Custom runtime** (`custom/`, key `custom`): Forge's own tool-use loop driving a model through a
  provider. The model has two tools, `write_file` and `run_command` (reading and searching happen
  through commands), both confined to the workspace:
  - `openai` — any OpenAI-compatible endpoint: an AI gateway such as OmniRoute or OpenRouter, or
    OpenAI itself. This is the automatic fallback. Each call has a time limit and is retried once on a
    network error, 5xx or 429.
  - `anthropic` — the Messages API with `FORGE_ANTHROPIC_API_KEY` (per-token billing, separate from the
    subscription).
  - `ollama` — a local model server.
  - A worker's commands run on the host, or with `FORGE_SANDBOX=docker` in a throwaway container with
    no network and only the workspace mounted (`command-sandbox.ts`).
- **Usage limits** (`usage-limits.ts`): records each runtime's limit state and reset time. While Claude
  is limited, `fallbackSelection` sends work to the fallback endpoint; work returns to Claude after the
  reset.
- **Attempts** (`attempts.ts`): decides which runs count against a step's attempts. Usage-limit stops
  never count; a time/tool/turn stop that changed files is a continuation (up to
  `FORGE_MAX_CONTINUATIONS`); fallback runs are best effort and don't count (up to 6).
- **Availability** (`runtime-availability.ts`): whether a runtime can run right now (installed,
  signed in, key present), so routing never assigns work nobody can run.
- **Agent runs** (`agent-runs.schema.ts`): one row per run: status, tokens, cost, tool calls, files
  changed, session id, workspace, error.

## Settings

| Variable | Default | Effect |
| --- | --- | --- |
| `CLAUDE_CODE_OAUTH_TOKEN` | unset | Subscription token for headless/CI use (`claude setup-token`). |
| `FORGE_AGENT_SANDBOX` | `on` | Claude Code's own command sandbox: `on`, `required` (refuse to run without it) or `off`. |
| `FORGE_FALLBACK_BASE_URL` | unset | OpenAI-compatible endpoint used while Claude is limited (ends in `/v1`). |
| `FORGE_FALLBACK_API_KEY` | unset | Its key. Stays inside Forge; agents never see it. |
| `FORGE_FALLBACK_MODEL` | unset | Model or route to ask for (e.g. `auto/coding` on OmniRoute). |
| `FORGE_FALLBACK_AUTO` | on | `0` turns the automatic fallback off. |
| `FORGE_FALLBACK_TIMEOUT_MS` | `120000` | Time limit per fallback call. |
| `FORGE_MAX_CONTINUATIONS` | `6` | Productive limit stops per step that don't count as attempts. |
| `FORGE_ANTHROPIC_API_KEY` | unset | Key for the `anthropic` provider (per-token). Never `ANTHROPIC_API_KEY`. |
| `FORGE_OLLAMA_HOST` | `http://localhost:11434` | Local model server for the `ollama` provider. |
| `FORGE_SANDBOX` | `host` | `docker` runs custom-runtime commands in a container. |
| `FORGE_SANDBOX_IMAGE` / `_MEMORY` / `_CPUS` | `node:20-alpine` / `1g` / `2` | That container's image and limits. |

## Files

| File | Purpose |
| --- | --- |
| `runtime.port.ts` | The runtime interface, event union, run context, limits, permission callback. |
| `runtime-registry.ts` | Runtime key → implementation. |
| `runtimes.module.ts` | Wiring. |
| `agent-runs.schema.ts` / `agent-runs.service.ts` | The run record and its lifecycle. |
| `usage-limits.ts` | Limit state per runtime; fallback selection; usage-limit detection in errors. |
| `attempts.ts` | Which runs count as attempts. |
| `runtime-availability.ts` | Whether a runtime can run now. |
| `claude-code/` | The Claude Code runtime, SDK provider, message normaliser (own README). |
| `custom/` | The native runtime, tool executor, providers, command sandbox, pricing (own README). |

## Tests

Unit specs next to each file (runtime hardening, message normalisation, providers and retries,
tool executor, command sandbox, attempts, availability). End to end: `test/custom-runtime.e2e-spec.ts`,
`test/sandbox-docker.e2e-spec.ts`, `test/claude-code-live.e2e-spec.ts` (needs a signed-in Claude Code;
skipped otherwise).

## Related

Driven by `workers` (execution) and `heartbeats` (planning); `routing/omni` picks the runtime and model;
`governance` supplies the permission check.

# `modules/runtimes/` — the execution runtimes

The abstraction that lets an employee run on Claude Code **or** a custom native agent, without the
rest of the app caring (spec §3/§7/§9). Everything downstream consumes a normalized event stream.

| File | What it does | Significance |
| --- | --- | --- |
| `runtime.port.ts` | Defines `AgentRuntime` (`run`/`resume`), the normalized `RuntimeEvent` union (session/text/tool_use/tool_result/needs_approval/usage/completed/failed), `RuntimeRunContext`, `RuntimeLimits`, and the `PermissionCallback` (`canUseTool`) with its allow/deny/pause decisions. | **The core contract.** Nothing outside is coupled to a specific SDK; governance, budget, and pause all key off these events. |
| `runtime-registry.ts` | Maps `runtimeKey → AgentRuntime`; tests `register()` a mock. | Adding a runtime is a registry entry, not a rewrite. |
| `agent-runs.schema.ts` | The `agent_runs` table: one execution (tokens, cost, session, tool count, files changed, status; ties to a work item **or** a goal). | The observability/perf record of every run. |
| `agent-runs.service.ts` | Create / attach workspace / finish / status / transcript / queries. | How the worker records a run's lifecycle. |
| `runtimes.module.ts` | Provides the SDK query, both runtimes, the provider registry, the runtime registry, and `AgentRunsService`. | Central wiring for execution. |
| `claude-code/` | The first-class Claude Code runtime (Agent SDK). See its README. | — |
| `custom/` | The native provider-API agent runtime + providers. See its README. | — |

**Relationships:** driven by `workers/execution.worker.ts` and `heartbeats`; emits events the worker
turns into governance/budget/evaluation actions.

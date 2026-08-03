# `workers/` — background orchestration

Where the pipeline is actually driven. The execution worker turns an assigned work item into a real,
governed, budgeted, evaluated run. This is the busiest coordinator in the system.

| File | What it does | Significance |
| --- | --- | --- |
| `execution.worker.ts` | `runOnce()` picks an assigned work item → Omni Router selects model → budget precheck → prepare workspace → create `agent_run` → build the governance gate → **drive the runtime's event stream**, enforcing the circuit breakers (duration/tool-cap/hard-budget) → on completion collect artifacts and set the item to `evaluating`; on a gated tool it **pauses**; `onApprovalDecision()` resumes/halts. | The central execution engine — ties together runtimes, workspaces, governance, approvals, budgets, routing, and the work state machine. |
| `approval-decision.listener.ts` | Subscribes to `approval.approved`/`approval.denied` and calls `execution.worker.onApprovalDecision()`. | Prod glue that resumes/halts a paused run after a human decides. |
| `workers.module.ts` | Wires the worker + listener; imports runtimes/workspaces/employees/work/governance/approvals/budgets/routing. | The assembly point for execution. |

**Relationships:** triggered (in prod) by `work.assigned`; reads/writes almost every domain module.
Under the test runner its auto-triggers are off — tests call `runOnce()` / `onApprovalDecision()`
directly for determinism. Note: the CEO **planning** run lives in `modules/heartbeats`, not here — a
planning run is goal-level, an execution run is work-item-level.

# `modules/approvals/` — human-in-the-loop approvals

When governance says a tool needs approval, the run **pauses** here until a human decides
(spec §20). Resume happens by runtime session id.

| File | What it does | Significance |
| --- | --- | --- |
| `approvals.schema.ts` | The `approvals` table (agent run, work item, tool, requested action, status, `consumed`). | The pending/decided record a human acts on. |
| `approvals.service.ts` | `requestIfAbsent()` (create pending + emit `approval.requested`), `decide()` (approve/deny + emit event), `consumeIfApproved()` (atomic single-use grant), queries. | The mechanics of pause→decide→resume; single-use consumption prevents replay. |
| `approvals.controller.ts` | `GET /approvals/:id`, `POST /approvals/:id/decision`. | Where a human approves/denies. |
| `approvals.module.ts` | Wires + exports `ApprovalsService`. | Used by the execution worker's gate. |
| `dto/` | Validation (see its README). | — |

**Relationships:** the gate in `workers/execution.worker.ts` calls `requestIfAbsent`; a decision
emits an event that `workers/approval-decision.listener.ts` turns into a resume/halt.

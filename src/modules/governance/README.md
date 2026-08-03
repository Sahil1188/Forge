# `modules/governance/` — the tool gate + secret redaction

Decides whether a tool call is allowed, denied, or needs human approval, and strips secrets from
anything persisted (spec §19/§20/§24). Built **on** the runtime's permission callback rather than a
separate policing layer.

| File | What it does | Significance |
| --- | --- | --- |
| `governance.service.ts` | `evaluate(governance, toolName) → allow | deny | approval_required` from the employee's `governance_json` (`allowedTools`/`deniedTools`/`approvalRequiredTools`); `allowedTools()` forwards an allow-list to the runtime. | Pure policy; default-deny capable. The execution worker calls this inside `canUseTool`. |
| `redaction.ts` | `redactSecrets(text)` — masks token/bearer/keyed-secret patterns. | Applied to every stored transcript so secrets never land on disk/logs. |
| `governance.service.spec.ts` | Unit tests for allow/deny/approval. | Locks the policy. |
| `redaction.spec.ts` | Unit tests proving secrets are masked. | — |

**Relationships:** consumed by `workers/execution.worker.ts` (builds the gate) and referenced by
`evaluation` (redacts command output). Pairs with `approvals` for the human-in-the-loop.

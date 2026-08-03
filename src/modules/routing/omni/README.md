# `modules/routing/omni/` — the Omni Router (WHAT)

Chooses the runtime + provider + model for a work item, per the employee's policy (spec §8).

| File | What it does | Significance |
| --- | --- | --- |
| `omni-router.port.ts` | `OmniRouterPort` interface (`selectModel(workItem, employee) → { runtimeKey, provider, model }`) + `OMNI_ROUTER` token. | The seam; callers depend only on this. |
| `dynamic-omni-router.service.ts` | Resolves the model by **task type → complexity tier (strong vs cheap) → default**, and carries the provider for custom-runtime employees. | The "working" router (M11) — a real, complexity-aware policy that stays backward compatible with simple `byTaskType` policies. |

**Relationships:** reads `employees` `ModelPolicy` + `complexityOf` (from `performance/skill-math`);
its selection sets the runtime/model on each `agent_run`. For `claude_code` employees this is "which
Claude model"; for `custom` employees it also picks the provider.

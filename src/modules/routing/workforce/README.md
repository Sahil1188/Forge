# `modules/routing/workforce/` — the Workforce Router (WHO)

Chooses the best-fit employee for a work item — by capability, not just role label (spec §7).

| File | What it does | Significance |
| --- | --- | --- |
| `workforce-router.port.ts` | `WorkforceRouterPort` interface + `WORKFORCE_ROUTER` token + decision types. | The pluggable seam. |
| `candidate-scoring.ts` | **Pure** scoring: `scoreCandidate` weighs skill match + role affinity + availability (reputation is an input at **weight 0** in V1) and `selectBest` picks the winner. | Deterministic, unit-testable routing logic; flip reputation on later without changing callers. |
| `scoring-workforce-router.service.ts` | The service: gathers same-company candidates with their skills + computed reputation, then delegates to `selectBest`. | Wires the pure scorer to real data. |

**Relationships:** consumes `employees` (candidates + skills) and `performance` (reputation); its
decision feeds `work.assign()`.

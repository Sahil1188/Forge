# `modules/` — feature modules (bounded contexts)

One folder per domain. Each is a self-contained NestJS module exposing a service or port to others.
Grouped here by their role in the pipeline (see [`docs/FLOW.md`](../../docs/FLOW.md) for the order).

**Organization & work graph**
| Module | Role |
| --- | --- |
| [`companies/`](companies/README.md) | Companies + users (the org root). |
| [`employees/`](employees/README.md) | The workforce records (identity, runtime config, skills, governance). |
| [`goals/`](goals/README.md) | Human objectives; starting one kicks off autonomy. |
| [`projects/`](projects/README.md) | Groups of work items under a goal. |
| [`work/`](work/README.md) | Work items + dependencies + the status state machine. |

**Execution**
| Module | Role |
| --- | --- |
| [`runtimes/`](runtimes/README.md) | The runtime abstraction + Claude Code and Custom runtimes + agent-run records. |
| [`workspaces/`](workspaces/README.md) | Per-run isolated git workspaces. |
| [`routing/`](routing/README.md) | Workforce Router (WHO) + Omni Router (WHAT). |
| [`heartbeats/`](heartbeats/README.md) | Wakes the CEO and plans a goal into routed work. |

**Governance & safety**
| Module | Role |
| --- | --- |
| [`governance/`](governance/README.md) | The tool-permission gate + secret redaction. |
| [`approvals/`](approvals/README.md) | Human-in-the-loop pause/resume. |
| [`budgets/`](budgets/README.md) | Cost ledger + budget circuit breaker. |

**Results & learning**
| Module | Role |
| --- | --- |
| [`evaluation/`](evaluation/README.md) | Objective build/test/lint verification. |
| [`performance/`](performance/README.md) | Performance records + computed reputation/specialization + skill growth. |
| [`memory/`](memory/README.md) | Long-term per-employee memory: lessons written from evaluations, recalled into future runs. |

**Platform**
| Module | Role |
| --- | --- |
| [`observability/`](observability/README.md) | Read-side views + the `/ui` dashboard. |
| [`health/`](health/README.md) | Liveness/readiness. |

The background orchestration that drives these lives in [`../workers/`](../workers/README.md).

# `modules/approvals/` — a person decides before a gated tool runs

When an employee's permissions say a tool needs approval, the run pauses here until an admin approves
or denies that exact call. The run then resumes from its saved session.

## How it works

- The execution worker's permission check calls `requestIfAbsent` with the tool and its exact input;
  an identical pending request is reused instead of duplicated.
- The step moves to `needs_approval` and the approval appears in the console's Approvals list.
- An admin approves or denies it. The decision publishes an event; the worker resumes the run
  (approved) or stops it (denied).
- An approval is **single use** and only for that exact call: `consumeIfApproved` atomically marks it
  consumed when the resumed run makes the same call (compared as JSON, key order independent).

## HTTP API

| Method | Path | Role | What it does |
| --- | --- | --- | --- |
| GET | `/approvals/:id` | viewer | One approval request. |
| POST | `/approvals/:id/decision` | admin | `{ decision: 'approved' \| 'denied' }`. |

Pending approvals for a company are listed by `GET /companies/:id/approvals` (see `console`).

## Events

Publishes `approval.requested`, `approval.approved`, `approval.denied`.

## Files

| File | Purpose |
| --- | --- |
| `approvals.schema.ts` | The `approvals` table (run, step, tool, requested input, status, consumed). |
| `approvals.service.ts` | Request, decide, single-use consumption, queries. |
| `approvals.controller.ts` | The endpoints above. |
| `dto/decide-approval.dto.ts` | Request validation. |
| `approvals.module.ts` | Wiring; exports `ApprovalsService`. |

## Tests

`test/approvals.e2e-spec.ts` (pause, approve and resume, deny, single use).

## Related

`governance` (decides what needs approval), `workers` (pauses and resumes runs,
`approval-decision.listener.ts`), `console` (the Approvals page).

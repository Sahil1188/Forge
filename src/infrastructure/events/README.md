# `infrastructure/events/` — domain events through a transactional outbox

When something important changes (a goal starts, a step is assigned, an approval is decided), the
event is written to the `events` table **in the same transaction** as the change. A dispatcher then
publishes unpublished events to in-process subscribers. A crash can never lose an event or publish one
for a change that was rolled back.

## How it works

- Services call `outbox.record(tx, event)` inside their write transaction.
- `OutboxDispatcher` polls unpublished rows on an interval, publishes each to the `EventBus` in
  creation order, and stamps `published_at`, so every event is delivered once. Tests call `tick()`
  instead.
- `EventBus` is a small in-process pub/sub: subscribe to an exact type, or `'*'` for everything. It can
  be replaced by a real broker without changing publishers or subscribers.

## Event types

Defined in `event-types.ts`: `goal.created`, `goal.started`, `goal.completed`, `project.created`,
`work.created`, `work.assigned`, `work.status_changed`, `approval.requested`, `approval.approved`,
`approval.denied`, `budget.exceeded`.

| Subscriber | Listens to | Does |
| --- | --- | --- |
| `heartbeats` | `goal.started` | Plans the goal. |
| `workers` | `work.assigned` | Starts the run. |
| `evaluation` | `work.status_changed` (to `evaluating`) | Checks the work. |
| `workers` (approval listener) | `approval.approved` / `approval.denied` | Resumes or stops the run. |

## Files

| File | Purpose |
| --- | --- |
| `events.schema.ts` | The `events` outbox table. |
| `event-types.ts` | The event type names. |
| `outbox.service.ts` | Records an event in the caller's transaction. |
| `outbox.dispatcher.ts` | Publishes unpublished events and stamps them. |
| `event-bus.ts` | In-process pub/sub. |
| `events.module.ts` | Global module providing the above. |

## Tests

`event-bus.spec.ts` (unit); `test/outbox-events.e2e-spec.ts` (exactly-once delivery, order,
timestamps).

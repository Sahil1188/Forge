# `infrastructure/events/` — transactional outbox + in-process event bus

The event backbone (spec §22). Domain writes record events **in the same DB transaction** as the
data change; a dispatcher later publishes them to in-process subscribers. No Kafka — the abstraction
is clean so a real broker can replace the bus later.

| File | What it does | Significance |
| --- | --- | --- |
| `events.schema.ts` | The `events` outbox table (aggregate type/id, type, payload, `published_at`). | Durable event log; survives crashes, stays consistent with the data. |
| `event-types.ts` | `EventTypes` constants (`goal.created`, `work.assigned`, `approval.approved`, `budget.exceeded`, …). | The canonical vocabulary; publishers and subscribers agree on these strings. |
| `outbox.service.ts` | `record(tx, event)` — inserts an event row using the caller's transaction. | How services emit events atomically with their write. |
| `event-bus.ts` | In-process pub/sub: `subscribe(type, handler)` / `publish(event)`; supports `'*'`. | The delivery mechanism subscribers listen on. Swappable interface. |
| `outbox.dispatcher.ts` | Polls unpublished `events` rows, publishes them to the bus, stamps `published_at`. Interval in prod; `tick()` in tests. | Bridges the durable outbox to live subscribers. |
| `events.module.ts` | `@Global` module providing all of the above. | Makes `EventBus`/`OutboxService`/dispatcher available everywhere. |

**Relationships:** producers = domain services (goals, work, approvals, budgets). Consumers =
`heartbeats` (on `goal.started`), `workers/execution.worker.ts` (on `work.assigned`), `evaluation`
(on `work.status_changed`), and `workers/approval-decision.listener.ts`.

# `src/workers/` — where the work actually runs

The execution worker turns assigned work items into agent runs: it picks the runtime and model, gives
the employee their workspace and brief, enforces limits and permissions while the agent works, and
hands finished work to evaluation. It runs several employees at once and keeps going through usage
limits, restarts and sleep.

## How it works

- **Dispatcher.** A drain loop keeps up to `FORGE_CONCURRENCY` runs going. A free slot is filled the
  moment work arrives (it does not wait for a run to finish). One person never runs two tasks at once.
- **Parallel teammates.** When one person has queued work and others in the same role are busy,
  Forge adds a teammate with the same role, skills, brief and model (up to `FORGE_MAX_PER_ROLE` per
  role, never executives) and spreads the queue. Each step owns its folders, so teammates don't
  overlap.
- **Each run:** choose runtime and model (Omni Router), check the budget, prepare the git workspace,
  write the prompt (shared rules, Forge rules, brief, time budget, brand, lessons, task standards, the
  task), then drive the runtime's event stream with circuit breakers: time, tool calls, turns, budget,
  cancellation and permission checks on every tool call.
- **Limits are not failures.** A run stopped by its time, tool or turn limit after changing files is a
  continuation: the next run starts from that work. A thrown turn-limit error is treated the same way.
- **Usage limits.** When Claude reports its limit, work moves to the fallback (any OpenAI-compatible
  endpoint) until the reset, then returns to Claude. Fallback runs never use up a step's attempts;
  after 3 fallback tries a step waits for Claude. If the fallback cannot be reached, the work is held
  (never failed) and retried every 10 minutes and at the reset.
- **Live transcripts.** Every event is streamed to a file as it happens, so the console shows what an
  employee is doing right now.
- **Clean up.** Processes started inside a run's folder are stopped when the run ends.
- **Process guard.** An agent may stop only processes it started: by a literal PID, `kill %1` or
  `kill $!`. Stopping Forge itself, or stopping processes by name, pattern, pipeline or variable, is
  refused (an agent once killed Forge while looking for its own test server).
- **Approvals.** A tool call that needs approval pauses the run; the decision resumes or stops it.
- **Safe restarts (drain mode).** `POST /system/intake { paused: true }` stops new runs; once
  `safeToRestart` is true, restarting loses nothing. Interrupted runs and checks resume on start.
- **Keep awake.** On Windows, the PC is kept awake (and the display on, which Modern Standby PCs need)
  while there is work in flight or queued, and allowed to sleep when idle.
- **Fallback drill.** `POST /system/fallback-drill` makes Forge treat Claude as limited for a few
  minutes, to rehearse the switch.

## HTTP API

| Method | Path | Role | What it does |
| --- | --- | --- | --- |
| GET | `/system/intake` | viewer | `{ paused, running, evaluating, safeToRestart }`. |
| POST | `/system/intake` | admin | `{ paused }`: stop or resume starting new runs. |
| GET | `/system/fallback-drill` | viewer | Whether a drill is on and which fallback is used. |
| POST | `/system/fallback-drill` | admin | `{ minutes }` (1–120): treat Claude as limited. |
| DELETE | `/system/fallback-drill` | admin | Ends the drill. |

## Settings

| Variable | Default | Effect |
| --- | --- | --- |
| `FORGE_CONCURRENCY` | `5` | Runs at the same time. |
| `FORGE_MAX_PER_ROLE` | `3` | People per role when adding teammates. |
| `FORGE_AUTOSTAFF` | on | `0` never adds teammates. |
| `FORGE_MAX_RUN_MINUTES` | `30` | Time limit per run (it continues in the next run). |
| `FORGE_MAX_ATTEMPTS` | `3` | Failed attempts before a step fails. |
| `FORGE_KEEP_AWAKE` | on | `0` lets Windows sleep while work is running. |
| `FORGE_KEEP_DISPLAY_ON` | on | `0` keeps only the system awake (not enough on Modern Standby PCs). |
| `FORGE_CANCEL_POLL_MS` | `3000` | How often a running step checks whether it was cancelled. |
| `FORGE_MANUAL_DRIVE` | unset | Set to stop automatic running (tests and scripts drive it). |

## Events

Subscribes to `work.assigned` (start work), `approval.approved` / `approval.denied` (resume or stop).

## Files

| File | Purpose |
| --- | --- |
| `execution.worker.ts` | Dispatcher, teammates, runs, circuit breakers, limits, fallback, transcripts, recovery. |
| `approval-decision.listener.ts` | Applies approval decisions to paused runs. |
| `intake.controller.ts` | Drain mode for safe restarts. |
| `fallback-drill.controller.ts` | The fallback drill. |
| `keep-awake.service.ts` | Keeps Windows awake while work is in flight or queued. |
| `process-cleanup.ts` | Stops processes left running inside a run's folder; `killTree`. |
| `process-guard.ts` | Refuses shell commands that would stop processes the agent did not start. |
| `workers.module.ts` | Wiring. |

## Tests

Unit: `process-guard.spec.ts`, `keep-awake.spec.ts`, `kill-tree.spec.ts`, `process-cleanup.spec.ts`,
`ran-out-of-turns.spec.ts`, `desktop-app-guard.spec.ts`. End to end:
`test/execution-lifecycle.e2e-spec.ts` (limits, fallback, teammates, transcripts, briefs),
`test/execution.e2e-spec.ts`, `test/circuit-breakers.e2e-spec.ts`, `test/approvals.e2e-spec.ts`.

## Related

`runtimes`, `routing`, `workspaces`, `governance`, `approvals`, `budgets`, `employees`, `memory`,
`brands`; hands finished work to `evaluation`. Planning runs live in `modules/heartbeats`.

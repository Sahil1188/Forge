# `modules/workspaces/` — a separate git workspace for every run

Every run gets its own folder and branch, so employees working at the same time never collide. The
project's `main` branch is the deliverable; finished work reaches it only through `integrate`.

## How it works

- `prepare` creates a git worktree of the project on a new branch `forge/<work item>-<run>`, starting
  from the latest `main`. A retry starts from `main` with the previous attempt merged in, so it
  continues instead of starting over. Planning runs get their own workspace too.
- `collect` commits everything the run changed and lists the files.
- `catchUp` merges the latest `main` into a finished step's worktree before it is checked, so it is
  evaluated as the code `main` will become. On conflict the merge is aborted and reported.
- `integrate` merges a passed step's branch into `main`. On conflict the merge is aborted and the step
  goes back for rework.
- `seedFile` commits a file straight onto `main` (for example the brand as `BRAND.md`).
- Work on one project is serialised with a lock, so merges never race.
- Workspaces are kept after the run (marked archived) for audit and transcripts.

The `WorkspacePort` interface keeps this replaceable, for example by a container-based workspace.

## Files

| File | Purpose |
| --- | --- |
| `workspace.port.ts` | The interface and DI token. |
| `local-worktree.workspace.ts` | The git worktree implementation. |
| `workspaces.schema.ts` | The `workspaces` table (path, branch, base, status). |
| `workspaces.module.ts` | Binds the port to the git implementation. |

## Tests

`test/project-workspace.e2e-spec.ts` (steps build on each other, failed work is not merged, retries
continue, conflicts, regressions, parallel steps).

## Related

`workers` and `heartbeats` (prepare/collect), `evaluation` (catch-up and integrate), `projects`
(where the repository is), `brands` (seeded `BRAND.md`).

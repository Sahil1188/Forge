# `modules/governance/` — what an employee's agent may do

Every tool call an agent makes passes through a permission check before it runs. This module holds the
rules: which tools an employee may use, which need a person's approval, which paths a tool may touch,
and which secrets must never be stored.

## How it works

- **Tool permissions** (`governance.service.ts`), from the employee's `governance_json`:
  - `deniedTools` → always denied;
  - `allowedTools` set → anything not in it is denied (default-deny is opt-in);
  - `approvalRequiredTools` → paused for a person's decision (see `approvals`);
  - otherwise allowed.
- **Path confinement** (`path-confinement.ts`): tools that take a file path (Claude Code's built-ins
  and the custom runtime's `write_file`) may only touch files inside the run's workspace. Symlinks and
  junctions are resolved first, so they can't be used to escape. Shell commands are contained by the
  command sandbox instead (see `runtimes`).
- **Redaction** (`redaction.ts`): secret-shaped text (API keys, GitHub and Slack tokens, AWS keys,
  bearer tokens, private keys, `password=`-style assignments) is masked before any transcript, log or
  check output is stored.

## Files

| File | Purpose |
| --- | --- |
| `governance.service.ts` | Allow, deny or needs-approval per tool. |
| `path-confinement.ts` | The workspace boundary for path-taking tools. |
| `redaction.ts` | Secret masking. |
| `governance.module.ts` | Wiring; exports `GovernanceService`. |

## Tests

`governance.service.spec.ts`, `governance.edge.spec.ts`, `path-confinement.spec.ts`,
`redaction.spec.ts`, `redaction.edge.spec.ts`.

## Related

`workers` (builds the permission check for each run), `approvals`, `runtimes` (Claude Code's
`canUseTool`, the command sandbox), `evaluation` (redacts check output).

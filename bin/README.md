# `bin/` — the Forge CLI

One entry point to stand the platform up and drive it. Run in dev with
`npm run forge -- <command>` (or `node bin/forge.cjs <command>`), or install globally
(`npm link` / `npm i -g .`) for a `forge` command.

| File | What it does |
| --- | --- |
| `forge.ts` | The CLI: `up` (build + Postgres + migrate + seed), `seed`, `serve` (HTTP + `/ui`), `status`, `goal "<text>"`, `task "<text>"`. |
| `forge.cjs` | Global-install launcher: registers `tsx` and hands off to `forge.ts`. |

## Giving Forge work

```bash
# A short task: one employee, no planning step — fastest and cheapest (one agent run).
forge task "Create index.js at the root exporting add(a, b), with tests run by npm test"

# A bigger goal: the CEO breaks it into at most 3 ordered work items (FORGE_MAX_PLAN_ITEMS).
forge goal "Build a Node.js string toolkit: slugify, capitalize, truncate, wordCount, with tests"

# Pin down what "done" means: each --check must exit 0 for the work to pass evaluation.
forge task "…" --check "node -e \"require('./index.js').add(1, 2) === 3 || process.exit(1)\""
```

Options: `--check "<cmd>"` (repeatable), `--direct` (on `goal`, same as `task`), `--company <id>`.

What happens: work items run in one shared git repository per project, each starting from the
previous items' merged work. Each item is evaluated objectively — the project's own
`npm build/test/lint` **plus** its acceptance checks (yours, and the ones the CEO writes per item) —
passing work is merged into the project's `main`, failing work is retried with the failure in the
employee's memory (up to `FORGE_MAX_ATTEMPTS`, default 3). The command ends with an honest summary,
the path of the deliverable (`workspaces/projects/<projectId>`), and a non-zero exit code if
anything did not pass.

## The web console

`forge serve` also serves the console at http://localhost:3000: set up a company, describe work, watch it
run live, approve gated actions, browse the delivered files and manage the team. See `public/README.md`.

## Notes

**Why it boots `dist/`, not `src/`:** the `goal`/`task`/`status` commands load the **compiled** app
from `dist/` because `tsc` emits the decorator metadata NestJS DI relies on, which `tsx`/esbuild does
not. So `npm run build` (or `forge up`, which builds for you) must run first.

**Claude Code auth.** `claude_code` employees run on your Claude Code login (or
`CLAUDE_CODE_OAUTH_TOKEN` from `claude setup-token` on servers/CI). Forge never uses
`ANTHROPIC_API_KEY` and strips it from the agent's environment, so billing stays on your plan.

**Deterministic drive.** The CLI sets `FORGE_MANUAL_DRIVE=1`, which turns off the app's background
auto-triggers so the CLI steps the pipeline itself. `forge serve` runs the same chain automatically
from events (goal started → plan → run → evaluate → retry/merge → goal completed).

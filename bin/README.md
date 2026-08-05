# `bin/` — the Forge CLI

One entry point to stand the platform up and drive it. Run in dev with
`npm run forge -- <command>`, or install globally (`npm link` / `npm i -g .`) for a `forge` command.

| File | What it does | Significance |
| --- | --- | --- |
| `forge.ts` | The CLI: `up` (build + Postgres + migrate + seed), `seed`, `serve` (HTTP + `/ui`), `status`, and `goal "<text>"`. | `goal` drives the **real** pipeline in-process — CEO plans → routes → workers execute → objective evaluation → performance/memory update — printing each step. |
| `forge.cjs` | Global-install launcher: registers `tsx` and hands off to `forge.ts`. | Lets `bin: forge` resolve to a runnable file. |

**Why it boots `dist/`, not `src/`:** the `goal`/`status` commands load the **compiled** app from
`dist/` because `tsc` emits the decorator metadata NestJS DI relies on, which `tsx`/esbuild does not.
So `npm run build` (or `forge up`, which builds for you) must run first.

**Live runs need Claude Code auth.** `goal` uses the live runtime for `claude_code` employees (CEO and
leads). Run `claude setup-token` and export `CLAUDE_CODE_OAUTH_TOKEN`. Forge never sets
`ANTHROPIC_API_KEY`, so auth stays on your subscription plan.

**Deterministic drive.** The CLI sets `FORGE_MANUAL_DRIVE=1`, which turns off the app's background
auto-triggers (the same off-switch the test runner uses) so the CLI steps the pipeline itself.

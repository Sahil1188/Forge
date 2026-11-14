# Forge

**An AI company you run from your own machine.** You describe what you want built; an executive plans
it, specialists build it in parallel, every step is checked objectively before it is accepted, and the
finished product lands in a git repository on your disk.

Forge runs on your **Claude subscription** through the Claude Agent SDK. When Claude reaches its usage
limit, work moves to any OpenAI-compatible endpoint you configure (OmniRoute, OpenRouter, OpenAI…) and
returns to Claude after the reset, so work doesn't stop.

**Website and docs:** https://sahil1188.github.io/Forge/ ([tutorials, internals and reference](https://sahil1188.github.io/Forge/#docs))

> Forge lets AI agents write and run code on your computer. Read [Security](#security) before you
> expose it beyond `localhost` or run it on a machine with data you care about.

---

## What it does

- **Plans like a company.** A goal goes to the executive who owns its domain (CTO, CFO, CISO…). They
  write a short plan: one small contract step first, then features in parallel, each with an owner,
  the folders it owns, and acceptance checks. A final independent review is added automatically.
- **Builds in parallel.** Up to five runs at once. When one person has a queue, Forge adds teammates
  with the same role, skills and brief, so independent steps don't wait for each other.
- **Never takes the agent's word for it.** Each finished step is merged with the latest `main` and
  must pass the project's lint, typecheck, tests and build, its own acceptance checks, **and every
  earlier step's checks**. Frontend steps are also screenshotted in a real browser and reviewed against
  the project's brand. Failing work goes back to the same employee with the evidence.
- **Learns.** Every evaluation updates the employee's skills, reputation and memory. Lessons from
  failures are put in front of them on similar tasks.
- **Keeps going.** Usage limits switch work to the fallback and back. Runs stopped by time or turn
  limits continue from where they were. Restarts drain first and lose nothing. The PC is kept awake
  while there is work.
- **Lets you steer.** A web console shows every goal, step, live activity, transcript, file and cost.
  You can edit each employee's brief (mission, standards, way of working, definition of done), skills,
  permissions and budget; approve sensitive tool calls; request changes on delivered work; and ask
  questions about any project in plain words (**Ask Forge**).
- **Follows a brand.** Every UI Forge builds follows one of the brand systems in [`brands/`](brands/).

## How it works

```
 Goal ─► executive plans (PLAN.json) ─► steps with owners, dependencies, acceptance checks
                                              │
            Workforce Router: who?  ◄─────────┤
            Omni Router: which runtime/model? ┘
                                              │
            each step runs in its own git worktree, under permissions, budgets and limits
                                              │
            catch up with main ─► lint / typecheck / test / build ─► acceptance checks
                               ─► every earlier step's checks ─► visual review (UI)
                                     │                    │
                                   pass                 fail ─► back to the employee
                                     │
                    merged into main (the deliverable) ─► skills, reputation, memory
```

A file-by-file walkthrough is in [`docs/FLOW.md`](docs/FLOW.md); the design and its decisions are in
[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md). Every folder under `src/` has a README describing what it
does, its endpoints and its settings.

## Requirements

- **Node.js 22** or newer
- **Docker** (for PostgreSQL; or bring your own PostgreSQL 16)
- **Claude Code** signed in to a Claude subscription (`claude login`), or `CLAUDE_CODE_OAUTH_TOKEN`
  from `claude setup-token` for headless use
- **Git**
- Optional: Chrome, Edge or Chromium for the visual review of UIs

Forge is developed on Windows and runs on Linux and macOS. For real isolation of agents' shell
commands, run it on Linux, macOS or WSL2 (see [Security](#security)).

## Quick start

Three ways in. Each needs Claude Code signed in to a Claude subscription (`claude login`, or
`CLAUDE_CODE_OAUTH_TOKEN` from `claude setup-token`).

**npm** (quickest; needs Node.js 22 and Docker for the database):

```bash
npm install -g forge-ai
forge up        # PostgreSQL in Docker, migrations, a demo company
forge serve     # http://127.0.0.1:3000
```

**Docker** (everything in containers, including the agents' commands; needs only Docker):

```bash
curl -O https://raw.githubusercontent.com/Sahil1188/Forge/main/docker/compose.yml
echo "FORGE_API_TOKEN=$(openssl rand -hex 32)" > .env
echo "CLAUDE_CODE_OAUTH_TOKEN=<from: claude setup-token>" >> .env
docker compose up -d
```

Open `http://localhost:3000/?token=<your FORGE_API_TOKEN>` once. Finished projects appear in
`./forge-projects`.

**From source** (for contributors):

```bash
git clone https://github.com/Sahil1188/Forge.git && cd Forge
npm install && cp .env.example .env
npm run db:up && npm run db:migrate
npm run build && npm run start:prod
```

Open **http://127.0.0.1:3000**, create a company, add the starter team, and give it a goal, or run
`forge goal "A landing page for my bakery"`. See [`bin/README.md`](bin/README.md) for the CLI.

### Fallback when Claude is at its limit

Set an OpenAI-compatible endpoint in `.env`:

```bash
FORGE_FALLBACK_BASE_URL=https://openrouter.ai/api/v1   # or your OmniRoute URL ending in /v1
FORGE_FALLBACK_API_KEY=...
FORGE_FALLBACK_MODEL=openrouter/auto                   # or a model / route the gateway serves
```

The key stays inside Forge; agents and their commands never see it. Rehearse the switch with
`POST /system/fallback-drill { "minutes": 5 }` (admin).

## Billing

Forge's Claude Code runtime uses your **subscription**. **Never set `ANTHROPIC_API_KEY`** for Forge: it
would switch Claude Code to per-token billing. Forge removes it from every process it starts. The only
per-token path is the optional custom-runtime Anthropic provider, which reads a separate variable,
`FORGE_ANTHROPIC_API_KEY`.

## Configuration

All settings are environment variables; [`.env.example`](.env.example) lists them with comments. The
ones you are most likely to change:

| Variable | Default | Effect |
| --- | --- | --- |
| `DATABASE_URL` | `postgres://forge:forge@127.0.0.1:5433/forge` | PostgreSQL connection. |
| `PORT` / `FORGE_HOST` | `3000` / `127.0.0.1` | Where the server listens. Non-loopback requires `FORGE_API_TOKEN`. |
| `FORGE_API_TOKEN` | unset | Access token (24+ characters) for remote or API use. |
| `FORGE_PROJECTS_DIR` | `~/Forge Projects` | Where finished projects are written. |
| `FORGE_CONCURRENCY` | `5` | Runs at the same time. |
| `FORGE_MAX_RUN_MINUTES` | `30` | Time per run before it continues in a new one. |
| `FORGE_FALLBACK_*` | unset | The fallback endpoint (see above). |
| `FORGE_SANDBOX` | `host` | `docker` runs custom-runtime commands and checks in a network-less container. |
| `FORGE_AGENT_SANDBOX` | `on` | Claude Code's own command sandbox: `on`, `required` or `off`. |

Each module's README documents its own settings.

## Security

Forge treats agents as untrusted. What it does:

- **Listens on `127.0.0.1` only** unless you set `FORGE_API_TOKEN`; refuses to start otherwise.
- **Blocks browser-based attacks** on the local API: Host allowlist (DNS rebinding), same-origin JSON
  only for writes (CSRF), security headers, rate limits.
- **Accounts and roles** (viewer, member, admin, owner) once you create the first account.
- **Every tool call is checked**: per-employee allow/deny/approval rules, file access confined to the
  run's workspace, sensitive tools paused for a person's approval.
- **Allowlisted environments** for agents and their commands: no database URL, no API keys, no Forge
  token.
- **Secrets are redacted** from transcripts, logs and check output before they are stored.
- **Limits** on budget, run time, tool calls and turns, enforced by the platform.

What it does not do: on native Windows, Claude Code cannot sandbox its own shell commands, so agents'
commands run as your user. Use Linux, macOS or WSL2 with `FORGE_AGENT_SANDBOX=required` for real
isolation, and `FORGE_SANDBOX=docker` for custom-runtime workers. Don't run Forge on a machine where
an agent mistake could cost you data you can't restore.

To report a vulnerability, see [SECURITY.md](SECURITY.md).

## Development

```bash
npm run start:dev        # watch mode
npm test                 # unit tests (no database needed)
npm run test:e2e         # end-to-end tests against PostgreSQL (database forge_test)
npm run lint
npm run typecheck        # tsc --noEmit
npm run db:generate      # migration from schema changes
```

End-to-end tests use `FORGE_TEST_DATABASE_URL` (default
`postgres://forge:forge@127.0.0.1:5433/forge_test`); create that database and run
`DATABASE_URL=<it> npm run db:migrate` once. Runtimes are scripted in tests, so no Claude account or
API key is needed; the one live Claude Code test is skipped unless you are signed in.

The web console in `public/` is plain ES modules with no build step and follows
[`public/DESIGN.md`](public/DESIGN.md).

Contributions are welcome: see [CONTRIBUTING.md](CONTRIBUTING.md).

## Project layout

```
bin/            the forge CLI
brands/         brand systems every UI follows
docs/           architecture, flow walkthrough, implementation plan
drizzle/        SQL migrations
public/         the web console
src/
  main.ts       bootstrap (security middleware, validation)
  infrastructure/   database, events (outbox), security
  modules/      one folder per domain (see src/modules/README.md)
  workers/      the execution worker, drain mode, keep-awake
test/           end-to-end tests
```

## License

[MIT](LICENSE)

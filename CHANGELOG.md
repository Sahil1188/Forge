# Changelog

All notable changes are listed here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow
[Semantic Versioning](https://semver.org/).

## [0.1.2] — 2026-11-15

- `forge help` matches the website and docs: the console address, the owning executive planning a
  goal, and every option for `goal` and `task` (`--check`, `--company`, `--direct`).

## [0.1.1] — 2026-11-15

- The npm package is published as `@sahil1188/forge` (`npm install -g @sahil1188/forge`); the name
  `forge-ai` is held by npm. The command is still `forge`.
- Learning is fairer: only the skills a step exercised move; a failed step always counts against the
  employee, even when most of its checks passed; a pass is discounted for each failed attempt before
  it; retries count failed attempts, not runs that continued after a time limit.
- Skill matching uses whole words for short hints, so "go" no longer matches "governance" or
  "negotiation" (this also sharpens routing).
- The installed `forge` command works again (`tsx` is a runtime dependency), CI installs the packed
  package and runs it, and `/system` reports Forge's own version.
- Dependency updates: Claude Agent SDK 0.3.322, NestJS 11.2.9, class-validator 0.15,
  playwright-core 1.65; GitHub Actions on their current major versions.

## [0.1.0] — 2026-11-14

First public release.

### Planning and building

- Goals are planned by the executive who owns their domain, with a small contract step first, parallel
  features, owned folders per step, acceptance checks, and an automatic final independent review.
- Direct tasks skip planning and go straight to the best-fit employee.
- Parallel teammates: queued work for one person is spread to teammates with the same role, skills and
  brief; free slots fill as soon as work arrives.
- Every step works in its own git worktree; passing work is merged into the project's `main`.
- Brand systems (`brands/`): every UI follows one, committed to the project as `BRAND.md`.

### Checking work

- Objective evaluation: project lint, typecheck, tests and build, plus each step's acceptance checks.
- Steps are checked against the latest `main` and must pass every earlier step's checks before they
  merge; a step that breaks earlier work is sent back naming what it broke.
- Visual review of UIs: screenshots in a real browser, reviewed against a design rubric and the brand.
- Broken checks are reported as invalid instead of failing the work.

### Running unattended

- Claude Code runtime on the Claude subscription; automatic fallback to any OpenAI-compatible endpoint
  (OmniRoute, OpenRouter, OpenAI) while Claude is at its usage limit, and back after the reset.
- Fallback runs never use up a step's attempts; an unreachable fallback holds work instead of failing
  it; after three fallback tries a step waits for Claude.
- Runs stopped by time, tool or turn limits continue from their work.
- Drain mode for restarts that lose nothing; interrupted runs and checks resume on start.
- Keeps Windows awake (display on, for Modern Standby PCs) while work is in flight or queued.
- Fallback drill to rehearse a usage limit.

### Console

- Dashboard, goal board, live activity, transcripts, project files and downloads, costs.
- Employees: profile, editable brief, skills, permissions, budget, memory, runs.
- Approvals for sensitive tool calls; change requests on delivered work; retries.
- Ask Forge: questions about a company or goal, answered read-only.
- Accounts with per-company roles.

### Learning

- Performance records, recency-weighted reputation, non-uniform skill growth and inferred
  specialisation from evaluated work.
- Durable lessons per employee, recalled into similar tasks.

### Security

- Localhost-only by default; token required for any other address.
- Host allowlist, CSRF protection, security headers and write rate limits.
- Allowlisted environments for agents and their commands; `ANTHROPIC_API_KEY` always removed.
- Per-employee tool rules, workspace confinement, single-use approvals, secret redaction.
- Budget, time, tool-call and turn limits enforced by the platform.
- Optional Docker sandbox for custom-runtime commands and checks; it runs commands as the workspace
  owner, so it can write to the workspace on Linux.
- Agents may stop only processes they started.

### Install

- npm package (`forge up`, `forge serve`, `forge goal`, `forge task`). Uses the SDK's bundled
  Claude Code program, or the `claude` on PATH when npm skipped that optional download
  (`FORGE_CLAUDE_PATH` to choose).
- Docker image and compose file with PostgreSQL.
- Website with documentation: https://sahil1188.github.io/Forge/

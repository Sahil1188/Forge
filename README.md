<div align="center">

```
  ███████╗  ██████╗  ██████╗   ██████╗  ███████╗
  ██╔════╝ ██╔═══██╗ ██╔══██╗ ██╔════╝  ██╔════╝
  █████╗   ██║   ██║ ██████╔╝ ██║  ███╗ █████╗
  ██╔══╝   ██║   ██║ ██╔══██╗ ██║   ██║ ██╔══╝
  ██║      ╚██████╔╝ ██║  ██║ ╚██████╔╝ ███████╗
  ╚═╝       ╚═════╝  ╚═╝  ╚═╝  ╚═════╝  ╚══════╝
```

### 🔨 Forge — the Autonomous AI Workforce Operating System

**An AI workforce that learns which employees, runtimes, and models perform best for different kinds of work — and gets measurably better at assigning work over time.**

<br/>

![status](https://img.shields.io/badge/status-V1%20complete-brightgreen)
![tests](https://img.shields.io/badge/tests-69%20passing-brightgreen)
![build](https://img.shields.io/badge/build-passing-brightgreen)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6)
![NestJS](https://img.shields.io/badge/NestJS-10-e0234e)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169e1)
![Node](https://img.shields.io/badge/Node-22-339933)
![license](https://img.shields.io/badge/license-MIT-blue)

</div>

---

## 📖 Table of contents

- [What is Forge?](#-what-is-forge)
- [The north star](#-the-north-star)
- [Why Forge is different (vs Paperclip)](#-why-forge-is-different-vs-paperclip)
- [How it works — the loop](#-how-it-works--the-loop)
- [Architecture at a glance](#-architecture-at-a-glance)
- [The parts, in detail](#-the-parts-in-detail)
- [Tech stack](#-tech-stack)
- [Project structure](#-project-structure)
- [Getting started](#-getting-started)
- [The dashboard](#-the-dashboard)
- [Configuration & billing](#-configuration--billing)
- [Runtimes & models](#-runtimes--models)
- [API reference](#-api-reference)
- [Data model](#-data-model)
- [Testing](#-testing)
- [Security posture](#-security-posture)
- [Roadmap](#-roadmap)
- [Design principles](#-design-principles)
- [License](#-license)

---

## 🧭 What is Forge?

Forge is a production-grade platform for creating and operating **autonomous AI companies**.

- **Humans create companies.**
- Companies contain **departments** and **AI employees**.
- Employees have roles, responsibilities, skills, memory, permissions, budgets, workspaces, and configurable AI runtimes.
- Employees receive goals and tasks, and can **delegate** work to other employees.
- A **Workforce Router** decides *who* should do a piece of work.
- An **Omni Router** decides *what* model/runtime should execute it.
- Completed work is **objectively evaluated** — never self‑certified by the agent that did it.
- Employees earn **performance, reputation, and experience** from measurable results, which feed back into future assignment.

The result: a workforce that **improves its own allocation of work over time**.

> An **employee is a database record + state**, not a running process and not bound to a single model. It can run on Claude Code today and a local model tomorrow — the architecture is runtime‑agnostic by design.

---

## 🌟 The north star

> A human says *"Build me a SaaS product,"* and an AI **CEO** understands the objective, forms a strategy, breaks it into projects and work items, delegates to the right employees, selects the right runtimes/models, monitors execution, evaluates results, requests rework when needed, approves completed work, updates performance, and uses accumulated data to make **better decisions next time**.

Forge V1 delivers the complete end‑to‑end vertical slice of exactly this loop.

---

## 🆚 Why Forge is different (vs Paperclip)

Forge deliberately replicates the proven **organizational skeleton** popularized by [Paperclip](https://github.com/) (company → departments → employees → roles → reporting lines → budgets → heartbeats → governance). That base is sound.

On top of it, Forge adds a **results‑driven intelligence layer that Paperclip does not have**:

| Capability | Paperclip | **Forge** |
| --- | :---: | :---: |
| Org chart, roles, reporting lines, budgets, heartbeats, governance | ✅ | ✅ |
| Agent‑agnostic execution | ✅ | ✅ |
| **Evaluation Engine** — objective build/test/lint verification, not self‑report | ❌ | ✅ |
| **Performance / Reputation / Experience** — persistent, measured capability profiles | ❌ | ✅ |
| **Workforce Router** — assignment by *historical performance*, not just role label | ❌ | ✅ |
| **Omni Router** — per‑task model/runtime selection by cost/quality/complexity | ❌ | ✅ |
| **Dynamic specialization** — inferred from work history, not manually labeled | ❌ | ✅ |

> **Paperclip gives agents a company to work inside. Forge additionally gives that company a memory of who is actually good at what — and uses that memory to keep getting better at assigning work.**

---

## 🔁 How it works — the loop

```
        ┌──────────────────────────────────────────────────────────────┐
        │                                                              │
   Goal │   heartbeat wakes CEO ──► CEO plans (PLAN.json) ──► work items│
        │                                    │                         │
        │                                    ▼                         │
        │                       Workforce Router  (WHO?)               │
        │                                    │                         │
        │                                    ▼                         │
        │                        Omni Router  (WHAT?)                  │
        │                                    │                         │
        │                                    ▼                         │
        │        Runtime executes in an isolated git workspace         │
        │        under governance + approval + circuit breakers        │
        │                                    │                         │
        │                                    ▼                         │
        │             Evaluation Engine (real build/test/lint)         │
        │                            ┌───────┴───────┐                 │
        │                           PASS            FAIL               │
        │                            │                │                │
        │                          done            rework              │
        │                            │                                 │
        │                            ▼                                 │
        │        Performance ► Reputation ► Skills ► Specialization    │
        │                            │                                 │
        └────────────────────────────┴──── feeds back into ───────────┘
                                            future routing
```

The whole path is proven end‑to‑end in `test/vertical-slice.e2e-spec.ts`.

---

## 🏗️ Architecture at a glance

A **modular monolith** (single NestJS process) with in‑process background workers, one PostgreSQL database, and a clean runtime abstraction. Strong interfaces between modules mean any piece can become a standalone service later.

```
                         HUMAN ──► REST API / Dashboard (/ui)
                                        │
     ┌──────────────────────────────────┼──────────────────────────────────┐
     ▼                                  ▼                                  ▼
 ORGANIZATION                       WORK ENGINE                       GOVERNANCE
 companies / employees        goals / projects / work           permissions / approvals
 departments / reporting      dependencies / status machine     budgets / circuit breakers
     │                                  │                                  │
     └──────────────┬───────────────────┴───────────────┬──────────────────┘
                    ▼                                   ▼
             WORKFORCE ROUTER (WHO)              OMNI ROUTER (WHAT)
                    └─────────────────┬─────────────────┘
                                      ▼
                             RUNTIME LAYER
                      ┌──────────────┴──────────────┐
                      ▼                             ▼
              ClaudeCodeRuntime               CustomRuntime
             (Claude Agent SDK)          (native provider loop)
                      └──────────────┬──────────────┘
                                     ▼
                        WORKER  (isolated git workspace)
                        Git · APIs · DB · Browser · Files
                                     │
                                     ▼
                              EVALUATION ENGINE
                                     │
                                     ▼
                         PERFORMANCE / REPUTATION / SKILLS
                                     │
                                     └────► back to FUTURE ROUTING
```

📎 New to the code? Read **[`docs/FLOW.md`](docs/FLOW.md)** — a file‑by‑file walkthrough in execution order. Every folder under `src/` also has its own `README.md`.

---

## 🧩 The parts, in detail

Each subsystem is a self‑contained module exposing a service or port interface. Here's what every part does and why it matters.

### 🏢 Organization — `modules/companies`, `modules/employees`
The org hierarchy. A human owns a **company**; companies contain **employees** with a self‑referencing reporting line (`managerEmployeeId`). An employee record holds identity, **runtime config** (`runtimeKey` + `modelPolicy`), **skills**, and **governance** rules. This is the capability record every router and worker reads. *An employee is data, not a process.*

### 🎯 Work graph — `modules/goals`, `modules/projects`, `modules/work`
Not a flat task list. A **goal** creates **projects**; projects contain **work items**; items can depend on other items. Work items move through a **pure, guarded state machine** (`work-status.ts`): `created → assigned → in_progress → evaluating → done`, with a `needs_approval` pause and a `rework` loop. Illegal transitions are rejected at the boundary.

### 🫀 Heartbeat & CEO planning — `modules/heartbeats`
The **autonomous entry point**. Starting a goal fires a heartbeat that wakes the **CEO**, who runs through its runtime as a *goal‑level* run and writes a `PLAN.json`. Forge parses it, creates the work items, and routes each one. Resilient: a missing/invalid plan still yields at least one work item.

### 👥 Workforce Router (WHO?) — `modules/routing/workforce`
A **pluggable scoring engine**, not hardcoded rules. Scores each candidate on **skill match + role affinity + availability**, with **historical reputation wired in but weighted 0** in V1 (flip it on later with zero caller changes). Picks the best‑fit employee — an employee with a better *track record* can beat one with higher raw skills.

### 🧠 Omni Router (WHAT?) — `modules/routing/omni`
A *different* decision: which **runtime + provider + model** should execute the work. Resolves **task‑type mapping → complexity tier (strong vs cheap) → default**. For Claude Code employees this is "which Claude model" (Opus vs Sonnet vs Haiku); for Custom employees it also carries the provider.

### ⚙️ Runtimes — `modules/runtimes`
The abstraction that makes Forge runtime‑agnostic. A normalized **`RuntimeEvent`** stream (session / text / tool_use / tool_result / needs_approval / usage / completed / failed) means *nothing downstream is coupled to any SDK*.
- **`ClaudeCodeRuntime`** — first‑class, driven by the **Claude Agent SDK** (structured events, sessions, hooks). Auth is the Claude Code **subscription session**.
- **`CustomRuntime`** — a real **native agent loop** that calls a model provider's API directly (`ModelProvider` interface → tool‑use loop → `ToolExecutor`), emitting the **same** events so governance/budget/approval behave identically. Providers plug in behind one interface (Anthropic API today, Ollama/others next).

### 📦 Workspaces — `modules/workspaces`
Every run gets its **own git workspace + branch** (`forge/<id>`), so parallel employees never collide. The `WorkspacePort` interface keeps **Docker/K8s isolation pluggable** — the named next hardening boundary.

### 🛡️ Governance & Tool Gateway — `modules/governance`
The tool‑permission gate: `allow | deny | approval_required`, default‑deny capable, built **on** the runtime's `canUseTool` callback (which maps onto Claude Code's native hooks) rather than a parallel policing layer. Also strips secrets from anything persisted (`redactSecrets`).

### ✋ Approvals (human‑in‑the‑loop) — `modules/approvals`
When a tool needs approval, the run **pauses**: a pending approval is created, the runtime emits `needs_approval`, execution halts. A human decides via `POST /approvals/:id/decision`; **approve → resume by session id**, **deny → halt**. Grants are single‑use to prevent replay.

### 💰 Budgets & circuit breakers — `modules/budgets`
Every run reports token usage → a `cost_events` ledger. Three **platform‑enforced** backstops, independent of the model's judgment:
- **Soft limit** → block new runs + alert.
- **Hard limit** → kill the in‑flight run.
- **Max duration** and **max tool calls** → hard kill runaway loops.

### ✅ Evaluation Engine — `modules/evaluation`
The core differentiator. Work is **never self‑certified**. Forge discovers the repo's *actual* build/test/lint commands (reading `package.json` scripts), runs them, scores each dimension, and routes the item to `done` (pass) or `rework` (fail). Output is redacted before storage.

### 📈 Performance, Reputation & Skills — `modules/performance`
Turns objective results into a persistent capability profile. Stores **raw measurements only** — reputation is *computed* on read (recency‑weighted, task‑type aware), so the formula can change without a migration. **Skill growth is non‑uniform**: trivial work barely moves the needle, hard high‑quality work moves it more, failures decrement, with diminishing returns near the cap. **Specialization is inferred** from history, not labeled.

### 🧠 Agent memory — `modules/memory`
Durable, per‑employee **lessons that persist across runs** (distinct from the episodic run/transcript record). After each objective evaluation the system writes a memory — *objectively*, never self‑narrated — with a `salience` (failures rank high: you learn most from what broke). Before the next run, the top memories are **recalled** (ranked by salience + task‑type relevance + recency) and injected into the employee's `CLAUDE.md` context. No embeddings in V1 — deterministic and testable, with a vector store able to slot in behind the same interface.

### 📡 Observability & Events — `modules/observability`, `infrastructure/events`
A **transactional outbox** records domain events atomically with each write; an in‑process **EventBus** delivers them (no Kafka — swappable interface). The observability layer exposes company/run/history views and a minimal **dashboard at `/ui`**.

### 🤖 Execution worker — `workers`
The busiest coordinator: picks up an assigned item → Omni Router → budget precheck → prepare workspace → create `agent_run` → recall the employee's memory → drive the runtime's event stream while enforcing every circuit breaker → collect artifacts → hand off to evaluation. Pauses and resumes runs around human approvals.

### 🖥️ CLI — `bin/forge`
One command to stand the platform up and drive it: `forge up` (build + Postgres + migrate + seed), `forge serve`, `forge status`, and **`forge goal "<text>"`** — which runs the whole loop live in‑process (CEO plans → routes → workers execute → objective evaluation → performance/memory update), printing each step. See [`bin/README.md`](bin/README.md).

---

## 🛠️ Tech stack

| Layer | Choice |
| --- | --- |
| Language | TypeScript (strict) |
| Framework | NestJS 10 (modular monolith) |
| Database | PostgreSQL 16 |
| ORM / query | Drizzle ORM (raw‑SQL‑friendly) + drizzle‑kit migrations |
| Coding runtime | Claude Agent SDK (`@anthropic-ai/claude-agent-sdk`) |
| Testing | Vitest (unit + e2e) + Supertest |
| Local infra | Docker Compose (PostgreSQL) |
| Package manager | npm |

---

## 📁 Project structure

```
forge/
├─ docs/
│  ├─ ARCHITECTURE.md          # the design & decisions
│  ├─ IMPLEMENTATION_PLAN.md   # the 11 milestones
│  └─ FLOW.md                  # end-to-end, file-by-file walkthrough  ⭐ read this
├─ drizzle/                    # generated SQL migrations
├─ src/
│  ├─ main.ts                  # bootstrap
│  ├─ app.module.ts            # the module graph
│  ├─ infrastructure/
│  │  ├─ database/             # Drizzle client, schema barrel, migrate, seed
│  │  └─ events/               # outbox + EventBus + dispatcher
│  ├─ modules/
│  │  ├─ companies/  employees/  goals/  projects/  work/     # org + work graph
│  │  ├─ runtimes/   workspaces/  routing/  heartbeats/       # execution
│  │  ├─ governance/ approvals/  budgets/                     # safety
│  │  ├─ evaluation/ performance/                             # results + learning
│  │  └─ observability/ health/                               # platform
│  └─ workers/                 # execution worker + listeners
└─ test/                       # end-to-end specs (real Postgres)
```

Every folder above has a `README.md` describing each file and its significance.

---

## 🚀 Getting started

### Prerequisites
- **Node.js 22+**
- **Docker** (for local PostgreSQL)
- For real Claude Code runs (optional): a Claude Code **subscription** session or `CLAUDE_CODE_OAUTH_TOKEN`

### Install & run

```bash
# 1. install dependencies
npm install

# 2. start PostgreSQL (published on host port 5433 to avoid clashing with a native Postgres)
npm run db:up

# 3. apply migrations
npm run db:migrate

# 4. (optional) seed a demo company: CEO + Backend Engineer on Claude Code, a worker on CustomRuntime
npm run db:seed

# 5. start the API
npm run start:dev
```

Or do it all with the **CLI** (`npm link` once for a global `forge`, or use `npm run forge -- <cmd>`):

```bash
forge up                                        # build + Postgres + migrate + seed
forge status                                    # companies, employees, work items
forge goal "Build a Node/Express hello API with a test"   # drive the whole loop, live
```

`forge goal` uses the **live** runtime for the CEO/leads, so authenticate first (subscription billing,
never a per‑token API key):

```bash
claude setup-token                              # prints CLAUDE_CODE_OAUTH_TOKEN
export CLAUDE_CODE_OAUTH_TOKEN=...              # Forge never sets ANTHROPIC_API_KEY
```

Verify it's alive:

```bash
curl http://localhost:3000/health      # {"status":"ok","db":"up"}
```

---

## 🖥️ The dashboard

Open **http://localhost:3000/ui** — a minimal console (spec §23) showing each employee's live status,
model, and latest run, plus a computed profile (reputation, specialization, skills) per employee.
Enter a company id (from `POST /companies`, or the seeded one) and load.

```
🔨 Forge                                    Autonomous AI Workforce
─────────────────────────────────────────────────────────────────
Employees                          │  Employee profile
Ada    CEO       idle  opus-4-8    │  Grace — Backend Engineer
Grace  Engineer  idle  sonnet-4-6  │  Reputation: 100 (1 samples)
Kai    Frontend  idle  qwen2.5     │  Specialization: coding (100)
                                   │  Skills: node 92 · sql 80
```

---

## ⚙️ Configuration & billing

Environment variables (`.env`, see `.env.example`):

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection (defaults to `...127.0.0.1:5433/forge`) |
| `PORT` | HTTP port (default 3000) |
| `CLAUDE_CODE_OAUTH_TOKEN` | Claude Code **subscription** auth for CI (from `claude setup-token`) |
| `FORGE_ANTHROPIC_API_KEY` | Per‑token key for the **CustomRuntime** Anthropic provider only |
| `FORGE_EXECUTION_WORKER=1` | Enable the background execution loop in prod |

> ⚠️ **Billing rule (important):** the `ClaudeCodeRuntime` runs on your Claude Code **subscription**.
> **Never set `ANTHROPIC_API_KEY`** for that path — it would override subscription billing and charge
> per‑token. The only per‑token path is the CustomRuntime Anthropic provider, which deliberately reads
> a **separate** variable (`FORGE_ANTHROPIC_API_KEY`) so the two can never be confused. See
> `docs/ARCHITECTURE.md` §7.1.

---

## 🔌 Runtimes & models

Forge separates **runtime** (execution mechanism) from **model/provider** (the reasoning):

| Employee role | Runtime | Models | Billing |
| --- | --- | --- | --- |
| **CEO / leads** | `ClaudeCodeRuntime` (pinned) | Claude Opus / Sonnet / Haiku | Subscription |
| **Workers** | `CustomRuntime` | Any provider via the Omni Router (Claude API, local LLM, …) | Per‑token / local |

Model ids in use: `claude-opus-4-8`, `claude-sonnet-4-6`, `claude-haiku-4-5`.

Example Omni Router policy for one employee:

```jsonc
{
  "default": "claude-sonnet-4-6",
  "byTaskType": { "architecture": "claude-opus-4-8", "coding": "claude-sonnet-4-6" },
  "byComplexity": { "high": "qwen2.5-coder:32b", "low": "qwen2.5-coder:7b" },
  "complexityThreshold": 0.6
}
```

---

## 📚 API reference

| Method & path | Description |
| --- | --- |
| `POST /companies` | Create a company |
| `POST /companies/:id/employees` | Create an employee (runtime config + skills) |
| `POST /companies/:id/goals` · `POST /goals/:id/start` | Create / start a goal |
| `POST /goals/:id/plan` | Wake the CEO to plan a goal |
| `POST /goals/:id/projects` · `POST /projects/:id/work-items` | Build the work graph |
| `POST /work-items/:id/route` | Auto‑assign via the Workforce Router |
| `POST /work-items/:id/{assign,status,dependencies}` | Manual work‑item ops |
| `PUT /employees/:id/budget` | Set a budget |
| `POST /approvals/:id/decision` | Approve / deny a paused tool call |
| `GET /employees/:id/profile` | Computed reputation + specialization + skills |
| `GET /companies/:id/overview` | Live employee/status view |
| `GET /work-items/:id/runs` · `GET /agent-runs/:id` | Execution history |
| `GET /ui` | The dashboard |

---

## 🗄️ Data model

19 tables, grouped:

- **Org:** `users`, `companies`, `employees`, `employee_runtime_configs`, `employee_skills`
- **Work:** `goals`, `projects`, `work_items`, `work_dependencies`, `work_assignments`
- **Execution:** `workspaces`, `agent_runs`, `heartbeats`
- **Governance:** `approvals`, `budgets`, `cost_events`
- **Results:** `evaluations`, `performance_records`
- **Platform:** `events` (outbox)

Reputation/rank is **never stored** — it's computed from `performance_records` on read.

---

## 🧪 Testing

```bash
npm test           # unit tests — no DB required, CI-safe
npm run test:e2e   # end-to-end — boots the app against real PostgreSQL
npm run lint       # eslint
npm run build      # nest build
```

**69 tests** (48 unit + 20 e2e + 1 guarded live), all green. The runtime pipeline is proven via
**mock runtimes/providers** registered on the registry, so the suite needs no live SDK or API keys.
Set `CLAUDE_CODE_OAUTH_TOKEN` to run the guarded live Claude Agent SDK smoke test.

---

## 🔒 Security posture

Autonomous agents are treated as **untrusted processes** from day one:

- **Isolated workspaces** — each run in its own git worktree/branch.
- **Default‑deny tool gateway** via the runtime's permission hooks.
- **Human approval** for sensitive actions, with real pause/resume.
- **Secret redaction** on every persisted transcript/log.
- **Resource limits** — budget, duration, and tool‑call circuit breakers.
- **Audit trail** — every tool call, approval, and kill recorded.
- **Container sandbox for worker commands** — set `FORGE_SANDBOX=docker` and a CustomRuntime worker's
  `run_command` runs in an ephemeral `docker run --rm --network none` container with only the workspace
  mounted (capped memory/CPU/pids, `--cap-drop ALL`). No host filesystem or network reachable.

**Honest caveat:** the container sandbox covers **worker (CustomRuntime) command execution**. Claude
Code's own bash runs inside the Agent SDK on the host; sandboxing *that* means running the whole
runtime in a container — the named next boundary. On the host (default) execution is confined by path
guards and workspace isolation but is not a true sandbox.

---

## 🗺️ Roadmap

V1 is complete (all 11 milestones), plus **M12**: agent memory, the Docker command sandbox, and the
`forge` CLI. Natural next steps:

- [x] **Docker command sandbox** — network‑less, resource‑capped container for worker `run_command`
- [x] **Agent memory** — durable per‑employee lessons recalled into future runs
- [x] **`forge` CLI** — one‑command setup + live goal runner
- [ ] **Containerize the whole Claude Code runtime** (sandbox its host bash too)
- [ ] **Live local‑model provider** (Ollama/vLLM) wiring for CustomRuntime workers
- [ ] **Full mid‑task session resume** (preserve context across an approval pause)
- [ ] **Vector‑backed memory recall** behind the existing `MemoryService` interface
- [ ] **Richer dashboard** — live run streaming, org chart, cost analytics

---

## 🎓 Design principles

- **Prefer working software over speculative abstraction.** No premature microservices.
- **No sophisticated routing before there's real data to route on.**
- **Never build a custom LLM. Never recreate Claude Code** — use the Agent SDK.
- **Store measurements, compute ranks.** Flexibility without migrations.
- **Every milestone stays runnable and testable.**

---

## 📄 License

Released under the **MIT License**. Add a `LICENSE` file with your chosen copyright holder before publishing.

---

<div align="center">

**Forge** — *an AI workforce that learns who's actually good at what, and keeps getting better at assigning work.*

🔨 Built incrementally, tested end‑to‑end.

</div>

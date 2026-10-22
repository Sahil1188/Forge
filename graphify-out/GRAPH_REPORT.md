# Graph Report - Forge  (2026-10-21)

## Corpus Check
- 269 files · ~122,039 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1555 nodes · 4023 edges · 81 communities (63 shown, 18 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 41 edges (avg confidence: 0.66)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `9464f4b7`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- RuntimeEvent
- execution.worker.ts
- Database
- WorkService
- app.module.ts
- scripts
- work.schema.ts
- budgets.service.ts
- devDependencies
- EmployeesService
- GoalsService
- compilerOptions
- companies.service.ts
- ProjectsService
- health.service.ts
- approvals.controller.ts
- exclude
- nest-cli.json
- evaluation.worker.ts
- performance.service.ts
- custom-runtime.e2e-spec.ts
- README.md
- runtime.port.ts
- RuntimeEvent
- memory.service.ts
- execution-lifecycle.e2e-spec.ts
- tool-executor.ts
- runtimes.module.ts
- scoring-workforce-router.service.ts
- Forge — V1 Architecture Proposal
- outbox.service.ts
- Forge — V1 Implementation Plan
- SetBudgetDto
- .plan
- ObservabilityService
- approvals.service.ts
- ceo-planner.service.ts
- scripts
- Database
- employees.service.ts
- candidate-scoring.ts
- planner.e2e-spec.ts
- EventBus
- forge.ts
- Forge — Code Flow Walkthrough
- modules/README.md
- event-bus.ts
- WorkItem
- EmployeesController
- EvaluationWorker
- files
- package.json
- 🚀 Getting started
- infrastructure/README.md
- .setBudget
- FLOW.md
- cli.e2e-spec.ts
- .route
- `test/` — end-to-end tests
- CLAUDE.md
- tsx
- approvals/dto/README.md
- drizzle.provider.ts
- budgets/dto/README.md
- @nestjs/core
- companies/dto/README.md
- employees/dto/README.md
- goals/dto/README.md
- projects/dto/README.md
- omni/README.md
- workforce/README.md
- claude-code/README.md
- custom/README.md
- work/dto/README.md

## God Nodes (most connected - your core abstractions)
1. `Database` - 118 edges
2. `RuntimeEvent` - 64 edges
3. `html()` - 62 edges
4. `ExecutionWorker` - 54 edges
5. `RuntimeRunContext` - 50 edges
6. `RuntimeRegistry` - 38 edges
7. `icon()` - 36 edges
8. `AgentRunsService` - 32 edges
9. `AgentRuntime` - 32 edges
10. `EmployeesService` - 30 edges

## Surprising Connections (you probably didn't know these)
- `bootApp()` --references--> `test`  [EXTRACTED]
  test/helpers.ts → package.json
- `bootApp()` --indirect_call--> `AppModule`  [INFERRED]
  test/helpers.ts → src/app.module.ts
- `pumpUntil()` --indirect_call--> `OutboxDispatcher`  [INFERRED]
  test/server-autochain.e2e-spec.ts → src/infrastructure/events/outbox.dispatcher.ts
- `builtGoal()` --indirect_call--> `EvaluationWorker`  [INFERRED]
  test/console-api.e2e-spec.ts → src/modules/evaluation/evaluation.worker.ts
- `builtGoal()` --indirect_call--> `CeoPlanner`  [INFERRED]
  test/console-api.e2e-spec.ts → src/modules/heartbeats/ceo-planner.service.ts

## Import Cycles
- None detected.

## Communities (81 total, 18 thin omitted)

### Community 0 - "RuntimeEvent"
Cohesion: 0.10
Nodes (17): AppModule, Module, bootstrap(), EvaluationWorker, Injectable, AgentRuntime, RuntimeEvent, RuntimeRunContext (+9 more)

### Community 1 - "execution.worker.ts"
Cohesion: 0.22
Nodes (8): 1. Principles, 2. Colour, 3. Typography — Forge "large" scale, 4. Layout and spacing, 5. Shape and depth, 6. Components, 7. Writing, Design guideline — Field Notebook (Sahil Shaikh brand, Platform UI)

### Community 2 - "Database"
Cohesion: 0.08
Nodes (9): BudgetEvaluation, BudgetState, evaluateBudget(), AgentRun, ApprovalDecisionListener, Injectable, ExecutionWorker, Injectable (+1 more)

### Community 3 - "WorkService"
Cohesion: 0.06
Nodes (36): Param, Post, AddDependencyDto, AssignWorkDto, ChangeStatusDto, CreateWorkItemDto, TASK_TYPES, ArrayMaxSize (+28 more)

### Community 4 - "app.module.ts"
Cohesion: 0.05
Nodes (52): DatabaseModule, Global, Inject, Module, EventsModule, Global, Module, ApprovalsModule (+44 more)

### Community 5 - "scripts"
Cohesion: 0.07
Nodes (27): @anthropic-ai/claude-agent-sdk, class-transformer, class-validator, dotenv, drizzle-orm, @nestjs/common, @nestjs/config, @nestjs/core (+19 more)

### Community 6 - "work.schema.ts"
Cohesion: 0.18
Nodes (11): createDb(), main(), EmployeeRuntimeConfig, employeeRuntimeConfigs, EmployeeSkill, employeeSkills, EmployeeStatus, ModelPolicy (+3 more)

### Community 7 - "budgets.service.ts"
Cohesion: 0.12
Nodes (17): agentEnv(), ClaudeCodeRuntime, Hook, success, Inject, Injectable, workspaceNotice(), normalizeSdkMessage() (+9 more)

### Community 8 - "devDependencies"
Cohesion: 0.06
Nodes (31): drizzle-kit, eslint, eslint-config-prettier, @nestjs/cli, @nestjs/schematics, @nestjs/testing, devDependencies, drizzle-kit (+23 more)

### Community 9 - "EmployeesService"
Cohesion: 0.10
Nodes (29): Delete, HttpCode, IsObject, CreateEmployeeDto, EmployeeSkillDto, GovernanceDto, RuntimeConfigDto, SetSkillsDto (+21 more)

### Community 10 - "GoalsService"
Cohesion: 0.18
Nodes (6): Inject, GoalsService, Inject, Injectable, Inject, Inject

### Community 11 - "compilerOptions"
Cohesion: 0.07
Nodes (26): compilerOptions, allowSyntheticDefaultImports, baseUrl, declaration, emitDecoratorMetadata, esModuleInterop, experimentalDecorators, forceConsistentCasingInFileNames (+18 more)

### Community 12 - "companies.service.ts"
Cohesion: 0.13
Nodes (13): DomainEvent, DomainEventInput, EventBus, EventHandler, Injectable, OutboxDispatcher, Inject, Injectable (+5 more)

### Community 13 - "ProjectsService"
Cohesion: 0.16
Nodes (12): CreateProjectDto, IsString, MaxLength, ProjectsController, Body, Controller, Get, Param (+4 more)

### Community 14 - "health.service.ts"
Cohesion: 0.18
Nodes (9): HealthController, Controller, Get, HealthModule, Module, HealthService, HealthStatus, Inject (+1 more)

### Community 15 - "approvals.controller.ts"
Cohesion: 0.11
Nodes (15): ApprovalsController, Body, Controller, Get, Param, Post, Approval, ApprovalsService (+7 more)

### Community 16 - "exclude"
Cohesion: 0.22
Nodes (8): **/*.spec.ts, test, exclude, extends, dist, drizzle.config.ts, node_modules, ./tsconfig.json

### Community 17 - "nest-cli.json"
Cohesion: 0.33
Nodes (5): collection, compilerOptions, deleteOutDir, $schema, sourceRoot

### Community 23 - "evaluation.worker.ts"
Cohesion: 0.09
Nodes (20): CommandResult, CommandRunner, execAsync, ExecError, Injectable, DimensionResult, FakeDiscovery, FakeRunner (+12 more)

### Community 24 - "performance.service.ts"
Cohesion: 0.05
Nodes (40): IsBoolean, CreateGoalDto, ArrayMaxSize, IsArray, IsIn, IsOptional, IsString, IsUUID (+32 more)

### Community 25 - "custom-runtime.e2e-spec.ts"
Cohesion: 0.14
Nodes (37): EventRow, events, AgentRunsService, Injectable, RuntimeRegistry, Injectable, twoItems(), builtGoal() (+29 more)

### Community 26 - "README.md"
Cohesion: 0.10
Nodes (19): 📚 API reference, 🏗️ Architecture at a glance, ⚙️ Configuration & billing, 🗄️ Data model, 🎓 Design principles, 🔨 Forge — the Autonomous AI Workforce Operating System, 🔁 How it works — the loop, 📄 License (+11 more)

### Community 27 - "runtime.port.ts"
Cohesion: 0.09
Nodes (19): BudgetsService, RecordCostInput, Injectable, Inject, AgentRunStatus, CreateAgentRunInput, FinishAgentRunInput, DEFAULT_LIMITS (+11 more)

### Community 28 - "RuntimeEvent"
Cohesion: 0.17
Nodes (5): CustomRuntime, Injectable, ToolDefinition, ToolExecutor, Injectable

### Community 29 - "memory.service.ts"
Cohesion: 0.11
Nodes (15): MemoryController, Controller, Get, Param, Query, agentMemories, AgentMemory, MemoryKind (+7 more)

### Community 30 - "execution-lifecycle.e2e-spec.ts"
Cohesion: 0.22
Nodes (6): Database, ConsoleService, emptyProgress(), Injectable, Inject, Inject

### Community 31 - "tool-executor.ts"
Cohesion: 0.26
Nodes (12): approvals, budgets, CostEvent, costEvents, employees, evaluations, projects, agentRuns (+4 more)

### Community 32 - "runtimes.module.ts"
Cohesion: 0.21
Nodes (7): ProviderRegistry, Availability, RuntimeAvailability, make(), provider(), runtime(), Injectable

### Community 33 - "scoring-workforce-router.service.ts"
Cohesion: 0.06
Nodes (106): applyFilter(), boot(), closeOverlay(), ctx, GLOBAL_ACTIONS, NAV, onChange(), onClick() (+98 more)

### Community 34 - "Forge — V1 Architecture Proposal"
Cohesion: 0.11
Nodes (17): 10. Tool Gateway & approval flow via native hooks (§31.10), 11. Concurrency & workspace isolation (§31.11), 12. Budget & circuit breakers (§31.12), 13. Security concerns specific to autonomous code execution (§31.13), 14. Key decisions locked for V1, 1. Repository state (§31.1), 2. High-level shape of the V1 slice (§31.2), 3. Domain entities (§31.3) (+9 more)

### Community 35 - "outbox.service.ts"
Cohesion: 0.23
Nodes (8): DRIZZLE, drizzleProvider, PG_CLIENT, pgClientProvider, EventType, EventTypes, ApprovalStatus, RequestApprovalInput

### Community 36 - "Forge — V1 Implementation Plan"
Cohesion: 0.12
Nodes (16): Cross-cutting throughout, Forge — V1 Implementation Plan, M0 — Project skeleton & CI loop, M10 — V1 Vertical Slice end-to-end (§27) + minimal UI, M11 — CustomRuntime + working Omni Router (worker execution off Claude Code), M12 — Memory, sandbox, and the operator CLI, M1 — Organization & workforce CRUD, M2 — Work graph & event outbox (+8 more)

### Community 37 - "SetBudgetDto"
Cohesion: 0.11
Nodes (17): CompaniesController, Body, Controller, Get, Param, Patch, Post, Company (+9 more)

### Community 38 - ".plan"
Cohesion: 0.12
Nodes (14): IsNumber, BudgetsController, Body, Controller, Get, Param, Put, BudgetPeriod (+6 more)

### Community 39 - "ObservabilityService"
Cohesion: 0.12
Nodes (17): 🧠 Agent memory — `modules/memory`, ✋ Approvals (human‑in‑the‑loop) — `modules/approvals`, 💰 Budgets & circuit breakers — `modules/budgets`, 🖥️ CLI — `bin/forge`, ✅ Evaluation Engine — `modules/evaluation`, 🤖 Execution worker — `workers`, 🛡️ Governance & Tool Gateway — `modules/governance`, 🫀 Heartbeat & CEO planning — `modules/heartbeats` (+9 more)

### Community 40 - "approvals.service.ts"
Cohesion: 0.15
Nodes (13): Script, ScriptedProvider, ChatRequest, ChatResponse, ModelProvider, ToolCall, OllamaProvider, OllamaResponse (+5 more)

### Community 41 - "ceo-planner.service.ts"
Cohesion: 0.21
Nodes (7): CommandSandbox, createCommandSandbox(), DockerCommandSandbox, execFileAsync, HostCommandSandbox, SandboxResult, ToolExecution

### Community 42 - "scripts"
Cohesion: 0.13
Nodes (15): scripts, build, db:down, db:generate, db:migrate, db:seed, db:up, forge (+7 more)

### Community 43 - "Database"
Cohesion: 0.17
Nodes (12): AnthropicBlock, AnthropicMessagesProvider, isToolResultTurn(), toWireMessages(), Injectable, DEFAULTS, estimateAnthropicCostUsd(), family() (+4 more)

### Community 44 - "employees.service.ts"
Cohesion: 0.19
Nodes (5): setup(), tool(), makeRuntime(), ChatMessage, ChatUsage

### Community 45 - "candidate-scoring.ts"
Cohesion: 0.23
Nodes (9): companies, User, users, goals, GoalStatus, Heartbeat, heartbeats, HeartbeatStatus (+1 more)

### Community 46 - "planner.e2e-spec.ts"
Cohesion: 0.15
Nodes (8): ConsoleController, Body, Controller, Get, Param, Post, Query, git

### Community 47 - "EventBus"
Cohesion: 0.15
Nodes (10): EvaluationController, Controller, Get, Param, Evaluation, EvaluationSummary, NotAwaitingEvaluationError, EvaluationsService (+2 more)

### Community 48 - "forge.ts"
Cohesion: 0.16
Nodes (13): Cmd, commands, main(), usage(), flag(), flagAll(), goalFields(), goalText() (+5 more)

### Community 49 - "Forge — Code Flow Walkthrough"
Cohesion: 0.17
Nodes (12): 0. Boot, 1. Set up the organization (human-driven REST), 2. Define the work (human-driven REST), 3. Start the goal → the CEO plans (the autonomous entry point), 4. Who does it? — the Workforce Router, 5. What runs it? — the Omni Router, then execution, 5a. Governance & approvals (during the run), 6. Was it any good? — Evaluation (never self-reported) (+4 more)

### Community 50 - "modules/README.md"
Cohesion: 0.06
Nodes (18): `modules/approvals/` — human-in-the-loop approvals, `modules/budgets/` — cost tracking + budget circuit breaker, `modules/companies/` — companies & users, `modules/employees/` — the workforce, `modules/evaluation/` — objective verification (never self-report), `modules/goals/` — goals, `modules/governance/` — the tool gate + secret redaction, `modules/health/` — liveness/readiness (+10 more)

### Community 51 - "event-bus.ts"
Cohesion: 0.40
Nodes (4): `bin/` — the Forge CLI, Giving Forge work, Notes, The web console

### Community 52 - "WorkItem"
Cohesion: 0.40
Nodes (4): StarterTeamDto, IsOptional, IsString, MaxLength

### Community 53 - "EmployeesController"
Cohesion: 0.22
Nodes (8): Res, PUBLIC_DIR, Response, Controller, Get, Param, TYPES, UiController

### Community 55 - "files"
Cohesion: 0.22
Nodes (9): files, drizzle.config.ts, src, tsconfig.json, bin, docker-compose.yml, drizzle, .env.example (+1 more)

### Community 56 - "package.json"
Cohesion: 0.29
Nodes (6): bin, forge, description, name, private, version

### Community 57 - "🚀 Getting started"
Cohesion: 0.67
Nodes (3): 🚀 Getting started, Install & run, Prerequisites

### Community 58 - "infrastructure/README.md"
Cohesion: 0.33
Nodes (3): `infrastructure/database/` — PostgreSQL + Drizzle plumbing, `infrastructure/events/` — transactional outbox + in-process event bus, `infrastructure/` — cross-cutting plumbing

### Community 61 - "FLOW.md"
Cohesion: 0.40
Nodes (3): Conventions, Layout, `src/` — application root

### Community 63 - ".route"
Cohesion: 0.13
Nodes (9): Inject, runSummary(), Employee, assertUniqueSkills(), EmployeesService, Inject, Injectable, Inject (+1 more)

### Community 70 - "tsx"
Cohesion: 0.05
Nodes (51): EmployeeWithRelations, PerformanceRecord, performanceRecords, PerformanceService, Inject, Injectable, ProfileController, Controller (+43 more)

## Knowledge Gaps
- **306 isolated node(s):** `Cmd`, `commands`, `$schema`, `collection`, `sourceRoot` (+301 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **18 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Database` connect `execution-lifecycle.e2e-spec.ts` to `Database`, `WorkService`, `work.schema.ts`, `GoalsService`, `companies.service.ts`, `ProjectsService`, `health.service.ts`, `approvals.controller.ts`, `performance.service.ts`, `custom-runtime.e2e-spec.ts`, `runtime.port.ts`, `memory.service.ts`, `tool-executor.ts`, `outbox.service.ts`, `SetBudgetDto`, `.plan`, `approvals.service.ts`, `EventBus`, `.setBudget`, `.route`, `tsx`?**
  _High betweenness centrality (0.132) - this node is a cross-community bridge._
- **Why does `bootApp()` connect `custom-runtime.e2e-spec.ts` to `RuntimeEvent`, `scripts`, `EvaluationWorker`?**
  _High betweenness centrality (0.079) - this node is a cross-community bridge._
- **Why does `scripts` connect `scripts` to `package.json`?**
  _High betweenness centrality (0.078) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `ExecutionWorker` (e.g. with `builtGoal()` and `runWorkItem()`) actually correct?**
  _`ExecutionWorker` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Cmd`, `commands`, `$schema` to the rest of the system?**
  _306 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `RuntimeEvent` be split into smaller, more focused modules?**
  _Cohesion score 0.09740259740259741 - nodes in this community are weakly interconnected._
- **Should `Database` be split into smaller, more focused modules?**
  _Cohesion score 0.08333333333333333 - nodes in this community are weakly interconnected._
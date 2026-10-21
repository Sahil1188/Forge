# Graph Report - Forge  (2026-10-21)

## Corpus Check
- 248 files · ~107,034 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1341 nodes · 3258 edges · 85 communities (66 shown, 19 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 21 edges (avg confidence: 0.77)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `c3e74dc9`
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
- .run
- infrastructure/README.md
- @nestjs/core
- FLOW.md
- cli.e2e-spec.ts
- .route
- `test/` — end-to-end tests
- CLAUDE.md
- RuntimeAvailability
- @nestjs/config
- dotenv
- rxjs
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
1. `Database` - 104 edges
2. `RuntimeEvent` - 63 edges
3. `ExecutionWorker` - 52 edges
4. `RuntimeRunContext` - 49 edges
5. `RuntimeRegistry` - 36 edges
6. `AgentRuntime` - 32 edges
7. `AgentRunsService` - 30 edges
8. `EmployeesService` - 28 edges
9. `WorkService` - 23 edges
10. `EvaluationWorker` - 21 edges

## Surprising Connections (you probably didn't know these)
- `bootApp()` --references--> `test`  [EXTRACTED]
  test/helpers.ts → package.json
- `bootApp()` --indirect_call--> `AppModule`  [INFERRED]
  test/helpers.ts → src/app.module.ts
- `planWith()` --indirect_call--> `CeoPlanner`  [INFERRED]
  test/project-workspace.e2e-spec.ts → src/modules/heartbeats/ceo-planner.service.ts
- `workspaceOf()` --indirect_call--> `AgentRunsService`  [INFERRED]
  test/live-pipeline.e2e-spec.ts → src/modules/runtimes/agent-runs.service.ts
- `twoEmployeeCompany()` --indirect_call--> `RuntimeRegistry`  [INFERRED]
  test/execution-lifecycle.e2e-spec.ts → src/modules/runtimes/runtime-registry.ts

## Import Cycles
- None detected.

## Communities (85 total, 19 thin omitted)

### Community 0 - "RuntimeEvent"
Cohesion: 0.10
Nodes (16): AppModule, Module, bootstrap(), CustomRuntime, Injectable, AgentRuntime, RuntimeEvent, RuntimeRunContext (+8 more)

### Community 1 - "execution.worker.ts"
Cohesion: 0.12
Nodes (17): 🧠 Agent memory — `modules/memory`, ✋ Approvals (human‑in‑the‑loop) — `modules/approvals`, 💰 Budgets & circuit breakers — `modules/budgets`, 🖥️ CLI — `bin/forge`, ✅ Evaluation Engine — `modules/evaluation`, 🤖 Execution worker — `workers`, 🛡️ Governance & Tool Gateway — `modules/governance`, 🫀 Heartbeat & CEO planning — `modules/heartbeats` (+9 more)

### Community 2 - "Database"
Cohesion: 0.05
Nodes (21): Database, Executor, Approval, ApprovalsService, sameAction(), Inject, Injectable, EvaluationWorker (+13 more)

### Community 3 - "WorkService"
Cohesion: 0.09
Nodes (29): AddDependencyDto, AssignWorkDto, ChangeStatusDto, CreateWorkItemDto, TASK_TYPES, ArrayMaxSize, IsArray, IsIn (+21 more)

### Community 4 - "app.module.ts"
Cohesion: 0.06
Nodes (44): Header, DatabaseModule, Global, Inject, Module, ApprovalsModule, Module, BudgetsModule (+36 more)

### Community 5 - "scripts"
Cohesion: 0.12
Nodes (17): @anthropic-ai/claude-agent-sdk, class-validator, dotenv, drizzle-orm, @nestjs/common, @nestjs/platform-express, dependencies, @anthropic-ai/claude-agent-sdk (+9 more)

### Community 6 - "work.schema.ts"
Cohesion: 0.15
Nodes (16): createDb(), main(), Employee, EmployeeRuntimeConfig, employeeRuntimeConfigs, employees, EmployeeSkill, employeeSkills (+8 more)

### Community 7 - "budgets.service.ts"
Cohesion: 0.16
Nodes (13): BudgetEvaluation, BudgetState, evaluateBudget(), Budget, BudgetPeriod, budgets, CostEvent, costEvents (+5 more)

### Community 8 - "devDependencies"
Cohesion: 0.06
Nodes (31): drizzle-kit, eslint, eslint-config-prettier, @nestjs/cli, @nestjs/schematics, @nestjs/testing, devDependencies, drizzle-kit (+23 more)

### Community 9 - "EmployeesService"
Cohesion: 0.09
Nodes (30): Delete, HttpCode, IsObject, Patch, CreateEmployeeDto, EmployeeSkillDto, GovernanceDto, RuntimeConfigDto (+22 more)

### Community 10 - "GoalsService"
Cohesion: 0.24
Nodes (6): GoalsController, Body, Controller, Get, Param, Post

### Community 11 - "compilerOptions"
Cohesion: 0.07
Nodes (26): compilerOptions, allowSyntheticDefaultImports, baseUrl, declaration, emitDecoratorMetadata, esModuleInterop, experimentalDecorators, forceConsistentCasingInFileNames (+18 more)

### Community 12 - "companies.service.ts"
Cohesion: 0.20
Nodes (7): ObservabilityController, Controller, Get, Param, ObservabilityService, summarizeRun(), Injectable

### Community 13 - "ProjectsService"
Cohesion: 0.18
Nodes (9): CreateProjectDto, IsString, MaxLength, ProjectsController, Body, Controller, Get, Param (+1 more)

### Community 14 - "health.service.ts"
Cohesion: 0.18
Nodes (9): HealthController, Controller, Get, HealthModule, Module, HealthService, HealthStatus, Inject (+1 more)

### Community 15 - "approvals.controller.ts"
Cohesion: 0.16
Nodes (10): ApprovalsController, Body, Controller, Get, Param, Post, DecideApprovalDto, IsIn (+2 more)

### Community 16 - "exclude"
Cohesion: 0.22
Nodes (8): **/*.spec.ts, test, exclude, extends, dist, drizzle.config.ts, node_modules, ./tsconfig.json

### Community 17 - "nest-cli.json"
Cohesion: 0.33
Nodes (5): collection, compilerOptions, deleteOutDir, $schema, sourceRoot

### Community 23 - "evaluation.worker.ts"
Cohesion: 0.10
Nodes (15): CommandResult, CommandRunner, execAsync, ExecError, Injectable, FakeDiscovery, FakeRunner, EvaluationEngine (+7 more)

### Community 24 - "performance.service.ts"
Cohesion: 0.13
Nodes (18): PerformanceRecord, PerformanceService, Inject, Injectable, ProfileController, Controller, Get, Param (+10 more)

### Community 25 - "custom-runtime.e2e-spec.ts"
Cohesion: 0.07
Nodes (50): DomainEvent, DomainEventInput, EventBus, EventHandler, Injectable, EventsModule, Global, Module (+42 more)

### Community 26 - "README.md"
Cohesion: 0.10
Nodes (19): 📚 API reference, 🏗️ Architecture at a glance, ⚙️ Configuration & billing, 🗄️ Data model, 🎓 Design principles, 🔨 Forge — the Autonomous AI Workforce Operating System, 🔁 How it works — the loop, 📄 License (+11 more)

### Community 27 - "runtime.port.ts"
Cohesion: 0.16
Nodes (12): Inject, EmployeesService, Injectable, Inject, AgentRun, agentRuns, AgentRunStatus, AgentRunsService (+4 more)

### Community 28 - "RuntimeEvent"
Cohesion: 0.23
Nodes (4): ToolDefinition, ToolExecution, ToolExecutor, Injectable

### Community 29 - "memory.service.ts"
Cohesion: 0.11
Nodes (15): Query, MemoryController, Controller, Get, Param, agentMemories, AgentMemory, MemoryKind (+7 more)

### Community 30 - "execution-lifecycle.e2e-spec.ts"
Cohesion: 0.12
Nodes (16): agentEnv(), ClaudeCodeRuntime, Hook, success, Inject, Injectable, workspaceNotice(), normalizeSdkMessage() (+8 more)

### Community 31 - "tool-executor.ts"
Cohesion: 0.38
Nodes (3): Goal, CeoPlanner, Injectable

### Community 32 - "runtimes.module.ts"
Cohesion: 0.14
Nodes (12): setup(), makeRuntime(), ProviderRegistry, Availability, RuntimeAvailability, make(), provider(), runtime() (+4 more)

### Community 33 - "scoring-workforce-router.service.ts"
Cohesion: 0.35
Nodes (5): EmployeeWithRelations, DynamicOmniRouter, Injectable, ModelSelection, OmniRouterPort

### Community 34 - "Forge — V1 Architecture Proposal"
Cohesion: 0.11
Nodes (17): 10. Tool Gateway & approval flow via native hooks (§31.10), 11. Concurrency & workspace isolation (§31.11), 12. Budget & circuit breakers (§31.12), 13. Security concerns specific to autonomous code execution (§31.13), 14. Key decisions locked for V1, 1. Repository state (§31.1), 2. High-level shape of the V1 slice (§31.2), 3. Domain entities (§31.3) (+9 more)

### Community 35 - "outbox.service.ts"
Cohesion: 0.17
Nodes (15): DRIZZLE, EventType, EventTypes, OutboxService, Injectable, GoalsService, Inject, Injectable (+7 more)

### Community 36 - "Forge — V1 Implementation Plan"
Cohesion: 0.12
Nodes (16): Cross-cutting throughout, Forge — V1 Implementation Plan, M0 — Project skeleton & CI loop, M10 — V1 Vertical Slice end-to-end (§27) + minimal UI, M11 — CustomRuntime + working Omni Router (worker execution off Claude Code), M12 — Memory, sandbox, and the operator CLI, M1 — Organization & workforce CRUD, M2 — Work graph & event outbox (+8 more)

### Community 37 - "SetBudgetDto"
Cohesion: 0.11
Nodes (16): CompaniesController, Body, Controller, Get, Param, Post, Company, CompaniesService (+8 more)

### Community 38 - ".plan"
Cohesion: 0.18
Nodes (12): approvals, ApprovalStatus, RequestApprovalInput, companies, User, users, goals, GoalStatus (+4 more)

### Community 39 - "ObservabilityService"
Cohesion: 0.18
Nodes (7): HeartbeatWorker, Inject, Injectable, HeartbeatsController, Controller, Param, Post

### Community 40 - "approvals.service.ts"
Cohesion: 0.08
Nodes (27): AnthropicBlock, AnthropicMessagesProvider, isToolResultTurn(), toWireMessages(), Injectable, DEFAULTS, estimateAnthropicCostUsd(), family() (+19 more)

### Community 41 - "ceo-planner.service.ts"
Cohesion: 0.23
Nodes (6): CommandSandbox, createCommandSandbox(), DockerCommandSandbox, execFileAsync, HostCommandSandbox, SandboxResult

### Community 42 - "scripts"
Cohesion: 0.13
Nodes (15): scripts, build, db:down, db:generate, db:migrate, db:seed, db:up, forge (+7 more)

### Community 43 - "Database"
Cohesion: 0.14
Nodes (12): IsNumber, BudgetsController, Body, Controller, Get, Param, Put, SetBudgetDto (+4 more)

### Community 44 - "employees.service.ts"
Cohesion: 0.28
Nodes (10): DimensionResult, EvaluationResult, Evaluation, evaluations, EvaluationStatus, EvaluationSummary, CreateEvaluationInput, performanceRecords (+2 more)

### Community 45 - "candidate-scoring.ts"
Cohesion: 0.67
Nodes (3): 🚀 Getting started, Install & run, Prerequisites

### Community 46 - "planner.e2e-spec.ts"
Cohesion: 0.18
Nodes (14): AVAILABILITY, CandidateInput, CandidateSkill, executionPool(), isExecutive(), relevantSkillScore(), roleAffinity(), scoreCandidate() (+6 more)

### Community 47 - "EventBus"
Cohesion: 0.20
Nodes (7): EvaluationController, Controller, Get, Param, EvaluationsService, Inject, Injectable

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
Cohesion: 0.50
Nodes (3): `bin/` — the Forge CLI, Giving Forge work, Notes

### Community 53 - "EmployeesController"
Cohesion: 0.32
Nodes (7): VALID_TASK_TYPES, attachGoalAcceptance(), capPlan(), PlannedItem, resolveDependencies(), sanitizeChecks(), sanitizeItem()

### Community 54 - "EvaluationWorker"
Cohesion: 0.22
Nodes (9): CreateGoalDto, ArrayMaxSize, IsArray, IsIn, IsOptional, IsString, IsUUID, MaxLength (+1 more)

### Community 55 - "files"
Cohesion: 0.25
Nodes (8): files, drizzle.config.ts, src, tsconfig.json, bin, docker-compose.yml, drizzle, .env.example

### Community 56 - "package.json"
Cohesion: 0.29
Nodes (6): bin, forge, description, name, private, version

### Community 57 - ".run"
Cohesion: 0.33
Nodes (7): confinementGate(), findPathViolation(), isInside(), norm(), PATH_KEYS, realAncestor(), PermissionCallback

### Community 58 - "infrastructure/README.md"
Cohesion: 0.33
Nodes (3): `infrastructure/database/` — PostgreSQL + Drizzle plumbing, `infrastructure/events/` — transactional outbox + in-process event bus, `infrastructure/` — cross-cutting plumbing

### Community 59 - "@nestjs/core"
Cohesion: 0.18
Nodes (10): OMNI_ROUTER, DEFAULT_LIMITS, ExecutionStatus, ExecutionSummary, KILL_STATUS, KillReason, KillStatus, RunLimits (+2 more)

### Community 61 - "FLOW.md"
Cohesion: 0.40
Nodes (3): Conventions, Layout, `src/` — application root

### Community 63 - ".route"
Cohesion: 0.17
Nodes (9): RoutingController, Controller, Inject, Param, Post, ScoringWorkforceRouter, Injectable, WORKFORCE_ROUTER (+1 more)

### Community 66 - "RuntimeAvailability"
Cohesion: 0.31
Nodes (3): BudgetMockRuntime, sleep(), TimeoutMockRuntime

### Community 68 - "dotenv"
Cohesion: 0.50
Nodes (5): clamp(), complexityOf(), computeSkillDelta(), round1(), TASK_WEIGHTS

### Community 72 - "drizzle.provider.ts"
Cohesion: 0.70
Nodes (3): drizzleProvider, PG_CLIENT, pgClientProvider

## Knowledge Gaps
- **273 isolated node(s):** `Cmd`, `commands`, `$schema`, `collection`, `sourceRoot` (+268 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **19 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Database` connect `Database` to `work.schema.ts`, `budgets.service.ts`, `EmployeesService`, `GoalsService`, `companies.service.ts`, `health.service.ts`, `performance.service.ts`, `custom-runtime.e2e-spec.ts`, `runtime.port.ts`, `memory.service.ts`, `tool-executor.ts`, `outbox.service.ts`, `SetBudgetDto`, `.plan`, `ObservabilityService`, `approvals.service.ts`, `employees.service.ts`, `EventBus`, `@nestjs/core`, `drizzle.provider.ts`?**
  _High betweenness centrality (0.143) - this node is a cross-community bridge._
- **Why does `bootApp()` connect `custom-runtime.e2e-spec.ts` to `RuntimeEvent`, `scripts`, `runtime.port.ts`?**
  _High betweenness centrality (0.094) - this node is a cross-community bridge._
- **Why does `scripts` connect `scripts` to `package.json`?**
  _High betweenness centrality (0.094) - this node is a cross-community bridge._
- **Are the 6 inferred relationships involving `RuntimeRegistry` (e.g. with `twoEmployeeCompany()` and `world()`) actually correct?**
  _`RuntimeRegistry` has 6 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Cmd`, `commands`, `$schema` to the rest of the system?**
  _273 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `RuntimeEvent` be split into smaller, more focused modules?**
  _Cohesion score 0.09562289562289562 - nodes in this community are weakly interconnected._
- **Should `execution.worker.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.11764705882352941 - nodes in this community are weakly interconnected._
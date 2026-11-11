# Graph Report - Forge  (2026-11-11)

## Corpus Check
- 342 files · ~257,680 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2682 nodes · 6010 edges · 206 communities (186 shown, 20 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 52 edges (avg confidence: 0.68)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `68e9a660`
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
- html
- auth.controller.ts
- AuthService
- icon
- tsx
- approvals/dto/README.md
- drizzle.provider.ts
- budgets/dto/README.md
- @nestjs/core
- companies/dto/README.md
- AuthController
- employees/dto/README.md
- domains.ts
- goals/dto/README.md
- settings.js
- EvaluationWorker
- ask.js
- employees.service.ts
- ScriptDiscovery
- projects/dto/README.md
- omni/README.md
- evaluation-engine.ts
- workforce/README.md
- claude-code/README.md
- custom/README.md
- WorkController
- work/dto/README.md
- CreateGoalDto
- work-status.ts
- safe-env.ts
- AddMemberDto
- pageHead
- companies.controller.ts
- HeartbeatWorker
- FakeDiscovery
- AuthModule
- approvals/README.md
- NotAwaitingEvaluationError
- projects/README.md
- visual-gate.ts
- ObservabilityService
- openai-compatible.provider.ts
- KeepAwakeService
- process-cleanup.ts
- path-confinement.ts
- Part 1 · Brand foundations
- 4. Components
- Part 1 · Brand foundations
- 4. Components
- Part 1 · Brand foundations
- 4. Components
- Part 1 · Brand foundations
- 4. Components
- Part 1 · Brand foundations
- 4. Components
- Part 1 · Brand foundations
- 4. Components
- Part 1 · Brand foundations
- 4. Components
- Part 1 · Brand foundations
- 4. Components
- Part 1 · Brand foundations
- 4. Components
- safe-env.ts
- model-provider.ts
- BudgetsController
- 3. Page anatomy
- field-notebook.md
- 3. Page anatomy
- 3. Page anatomy
- 3. Page anatomy
- 3. Page anatomy
- 3. Page anatomy
- 3. Page anatomy
- 3. Page anatomy
- 3. Page anatomy
- 3. Page anatomy
- 3. Page anatomy
- custom-runtime.e2e-spec.ts
- Part 3 · Website guideline
- Part 2 · Platform UI guideline
- 4. Motion system
- Part 2 · Platform UI guideline
- 4. Motion system
- Part 3 · Website guideline
- Part 2 · Platform UI guideline
- 4. Motion system
- Part 3 · Website guideline
- Part 2 · Platform UI guideline
- 4. Motion system
- Part 3 · Website guideline
- Part 2 · Platform UI guideline
- 4. Motion system
- Part 3 · Website guideline
- Part 2 · Platform UI guideline
- 4. Motion system
- Part 3 · Website guideline
- Part 2 · Platform UI guideline
- 4. Motion system
- Part 3 · Website guideline
- Part 2 · Platform UI guideline
- 4. Motion system
- Part 3 · Website guideline
- Part 2 · Platform UI guideline
- 4. Motion system
- Part 3 · Website guideline
- Part 2 · Platform UI guideline
- 4. Motion system
- Part 3 · Website guideline
- Part 2 · Platform UI guideline
- 4. Motion system
- 4. Colour
- Part 4 · Code
- Part 3 · Website guideline
- 4. Colour
- 4. Colour
- Part 4 · Code
- 4. Colour
- Part 4 · Code
- 4. Colour
- Part 4 · Code
- 4. Colour
- Part 4 · Code
- 4. Colour
- Part 4 · Code
- 4. Colour
- Part 4 · Code
- 4. Colour
- Part 4 · Code
- 4. Colour
- Part 4 · Code
- 4. Colour
- Part 4 · Code
- custom.runtime.edge.spec.ts
- Brand systems
- HeartbeatsController
- .record
- EventsModule
- HealthModule

## God Nodes (most connected - your core abstractions)
1. `Database` - 157 edges
2. `html()` - 74 edges
3. `ExecutionWorker` - 73 edges
4. `RuntimeEvent` - 66 edges
5. `RuntimeRunContext` - 52 edges
6. `RuntimeRegistry` - 46 edges
7. `icon()` - 39 edges
8. `AgentRunsService` - 34 edges
9. `EmployeesService` - 33 edges
10. `AgentRuntime` - 32 edges

## Surprising Connections (you probably didn't know these)
- `runWorkItem()` --indirect_call--> `ExecutionWorker`  [INFERRED]
  test/evaluation.e2e-spec.ts → src/workers/execution.worker.ts
- `bootApp()` --references--> `test`  [EXTRACTED]
  test/helpers.ts → package.json
- `serveStatic()` --indirect_call--> `body()`  [INFERRED]
  src/modules/evaluation/visual/app-launcher.ts → public/assets/goal.js
- `bootApp()` --indirect_call--> `AppModule`  [INFERRED]
  test/helpers.ts → src/app.module.ts
- `builtGoal()` --indirect_call--> `EvaluationWorker`  [INFERRED]
  test/console-api.e2e-spec.ts → src/modules/evaluation/evaluation.worker.ts

## Import Cycles
- None detected.

## Communities (206 total, 20 thin omitted)

### Community 0 - "RuntimeEvent"
Cohesion: 0.08
Nodes (23): AppModule, Module, AgentRunStatus, AgentRunsService, CreateAgentRunInput, FinishAgentRunInput, Injectable, AgentRuntime (+15 more)

### Community 1 - "execution.worker.ts"
Cohesion: 0.22
Nodes (8): 1. Principles, 2. Colour, 3. Typography — Forge "large" scale, 4. Layout and spacing, 5. Shape and depth, 6. Components, 7. Writing, Design guideline — Field Notebook (Sahil Shaikh brand, Platform UI)

### Community 2 - "Database"
Cohesion: 0.10
Nodes (3): AgentRun, ExecutionWorker, Injectable

### Community 3 - "WorkService"
Cohesion: 0.10
Nodes (29): AddDependencyDto, AssignWorkDto, ChangeStatusDto, CreateWorkItemDto, ArrayMaxSize, IsArray, IsIn, IsInt (+21 more)

### Community 4 - "app.module.ts"
Cohesion: 0.22
Nodes (11): FULL_ORG, modelPolicyFor(), OrgMember, briefForEmployee(), BRIEFS, EmployeeBrief, ModelTier, renderBrief() (+3 more)

### Community 5 - "scripts"
Cohesion: 0.07
Nodes (29): @anthropic-ai/claude-agent-sdk, class-transformer, class-validator, dotenv, drizzle-orm, @nestjs/common, @nestjs/config, @nestjs/core (+21 more)

### Community 6 - "work.schema.ts"
Cohesion: 0.16
Nodes (12): createDb(), main(), EmployeeRuntimeConfig, employeeRuntimeConfigs, EmployeeSkill, employeeSkills, EmployeeStatus, ModelPolicy (+4 more)

### Community 7 - "budgets.service.ts"
Cohesion: 0.12
Nodes (15): agentSandbox(), ClaudeCodeRuntime, Hook, success, Inject, Injectable, workspaceNotice(), normalizeSdkMessage() (+7 more)

### Community 8 - "devDependencies"
Cohesion: 0.06
Nodes (31): drizzle-kit, eslint, eslint-config-prettier, @nestjs/cli, @nestjs/schematics, @nestjs/testing, devDependencies, drizzle-kit (+23 more)

### Community 9 - "EmployeesService"
Cohesion: 0.10
Nodes (29): IsObject, CreateEmployeeDto, EmployeeSkillDto, GovernanceDto, RuntimeConfigDto, SetSkillsDto, ArrayMaxSize, IsArray (+21 more)

### Community 10 - "GoalsService"
Cohesion: 0.15
Nodes (18): boardBriefing(), BoardLike, companyBriefing(), CompanyLike, ItemLike, mins(), RunLike, runLine() (+10 more)

### Community 11 - "compilerOptions"
Cohesion: 0.07
Nodes (26): compilerOptions, allowSyntheticDefaultImports, baseUrl, declaration, emitDecoratorMetadata, esModuleInterop, experimentalDecorators, forceConsistentCasingInFileNames (+18 more)

### Community 12 - "companies.service.ts"
Cohesion: 0.16
Nodes (11): DomainEvent, DomainEventInput, EventBus, EventHandler, Injectable, OutboxDispatcher, Inject, Injectable (+3 more)

### Community 13 - "ProjectsService"
Cohesion: 0.06
Nodes (43): AnthropicBlock, AnthropicMessagesProvider, isToolResultTurn(), toWireMessages(), Injectable, DEFAULTS, estimateAnthropicCostUsd(), family() (+35 more)

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
Cohesion: 0.16
Nodes (22): ApprovalsModule, Module, BudgetsModule, Module, ConsoleModule, Module, EmployeesModule, Module (+14 more)

### Community 24 - "performance.service.ts"
Cohesion: 0.27
Nodes (6): GoalsController, Body, Controller, Get, Param, Post

### Community 25 - "custom-runtime.e2e-spec.ts"
Cohesion: 0.15
Nodes (38): CeoPlanner, Injectable, RuntimeRegistry, Injectable, twoItems(), plannedCompany(), builtGoal(), delivered() (+30 more)

### Community 26 - "README.md"
Cohesion: 0.10
Nodes (19): 📚 API reference, 🏗️ Architecture at a glance, ⚙️ Configuration & billing, 🗄️ Data model, 🎓 Design principles, 🔨 Forge — the Autonomous AI Workforce Operating System, 🔁 How it works — the loop, 📄 License (+11 more)

### Community 27 - "runtime.port.ts"
Cohesion: 0.18
Nodes (15): Classification, classify(), DELIVERABLES, HINTS, rx(), Signals, CASES, Domain (+7 more)

### Community 29 - "memory.service.ts"
Cohesion: 0.12
Nodes (15): MemoryController, Controller, Get, Param, Query, agentMemories, AgentMemory, MemoryKind (+7 more)

### Community 30 - "execution-lifecycle.e2e-spec.ts"
Cohesion: 0.16
Nodes (5): ConsoleService, emptyProgress(), git, runSummary(), Injectable

### Community 31 - "tool-executor.ts"
Cohesion: 0.13
Nodes (13): EventType, EventTypes, OutboxService, Injectable, ApprovalStatus, RequestApprovalInput, Inject, GoalsService (+5 more)

### Community 32 - "runtimes.module.ts"
Cohesion: 0.22
Nodes (13): Brand, brandChecklist(), brandProblem(), BrandSummary, describeBrand(), FIT, fittingBrand(), getBrand() (+5 more)

### Community 33 - "scoring-workforce-router.service.ts"
Cohesion: 0.11
Nodes (18): composerForms, openComposer(), goalFields(), ICONS, LABELS, lines(), list(), MODELS (+10 more)

### Community 34 - "Forge — V1 Architecture Proposal"
Cohesion: 0.11
Nodes (17): 10. Tool Gateway & approval flow via native hooks (§31.10), 11. Concurrency & workspace isolation (§31.11), 12. Budget & circuit breakers (§31.12), 13. Security concerns specific to autonomous code execution (§31.13), 14. Key decisions locked for V1, 1. Repository state (§31.1), 2. High-level shape of the V1 slice (§31.2), 3. Domain entities (§31.3) (+9 more)

### Community 35 - "outbox.service.ts"
Cohesion: 0.12
Nodes (15): ENV, fallbackSelection(), LimitStatus, looksLikeUsageLimit(), UsageLimitState, DrillDto, FallbackDrillController, Body (+7 more)

### Community 36 - "Forge — V1 Implementation Plan"
Cohesion: 0.12
Nodes (16): Cross-cutting throughout, Forge — V1 Implementation Plan, M0 — Project skeleton & CI loop, M10 — V1 Vertical Slice end-to-end (§27) + minimal UI, M11 — CustomRuntime + working Omni Router (worker execution off Claude Code), M12 — Memory, sandbox, and the operator CLI, M1 — Organization & workforce CRUD, M2 — Work graph & event outbox (+8 more)

### Community 37 - "SetBudgetDto"
Cohesion: 0.12
Nodes (17): Req, ForgeRequest, Get, SessionUser, CompaniesController, Body, Controller, Get (+9 more)

### Community 38 - ".plan"
Cohesion: 0.14
Nodes (16): IsNumber, BudgetEvaluation, BudgetState, evaluateBudget(), Budget, BudgetPeriod, budgets, CostEvent (+8 more)

### Community 39 - "ObservabilityService"
Cohesion: 0.12
Nodes (17): 🧠 Agent memory — `modules/memory`, ✋ Approvals (human‑in‑the‑loop) — `modules/approvals`, 💰 Budgets & circuit breakers — `modules/budgets`, 🖥️ CLI — `bin/forge`, ✅ Evaluation Engine — `modules/evaluation`, 🤖 Execution worker — `workers`, 🛡️ Governance & Tool Gateway — `modules/governance`, 🫀 Heartbeat & CEO planning — `modules/heartbeats` (+9 more)

### Community 40 - "approvals.service.ts"
Cohesion: 0.14
Nodes (9): BudgetsController, Body, Controller, Get, Param, Put, BudgetsService, Inject (+1 more)

### Community 41 - "ceo-planner.service.ts"
Cohesion: 0.10
Nodes (18): CommandResult, CommandRunner, execAsync, ExecError, execFileAsync, Injectable, brokenCheck(), FakeDiscovery (+10 more)

### Community 42 - "scripts"
Cohesion: 0.13
Nodes (15): scripts, build, db:down, db:generate, db:migrate, db:seed, db:up, forge (+7 more)

### Community 43 - "Database"
Cohesion: 0.15
Nodes (30): applyFilter(), boot(), claudeLimit(), closeOverlay(), ctx, GLOBAL_ACTIONS, LIMIT_WINDOWS, NAV (+22 more)

### Community 44 - "employees.service.ts"
Cohesion: 0.16
Nodes (12): CreateProjectDto, IsString, MaxLength, ProjectsController, Body, Controller, Get, Param (+4 more)

### Community 45 - "candidate-scoring.ts"
Cohesion: 0.15
Nodes (23): approvals, Membership, memberships, sessions, companies, User, users, AskMessage (+15 more)

### Community 46 - "planner.e2e-spec.ts"
Cohesion: 0.21
Nodes (7): ConsoleController, Body, Controller, Get, Param, Post, Query

### Community 47 - "EventBus"
Cohesion: 0.19
Nodes (7): EvaluationController, Controller, Get, Param, EvaluationsService, Inject, Injectable

### Community 48 - "forge.ts"
Cohesion: 0.16
Nodes (13): Cmd, commands, main(), usage(), flag(), flagAll(), goalFields(), goalText() (+5 more)

### Community 49 - "Forge — Code Flow Walkthrough"
Cohesion: 0.17
Nodes (12): 0. Boot, 1. Set up the organization (human-driven REST), 2. Define the work (human-driven REST), 3. Start the goal → the CEO plans (the autonomous entry point), 4. Who does it? — the Workforce Router, 5. What runs it? — the Omni Router, then execution, 5a. Governance & approvals (during the run), 6. Was it any good? — Evaluation (never self-reported) (+4 more)

### Community 50 - "modules/README.md"
Cohesion: 0.06
Nodes (16): `modules/budgets/` — cost tracking + budget circuit breaker, `modules/companies/` — companies & users, `modules/employees/` — the workforce, `modules/evaluation/` — objective verification (never self-report), `modules/goals/` — goals, `modules/governance/` — the tool gate + secret redaction, `modules/health/` — liveness/readiness, `modules/heartbeats/` — waking the CEO + planning (+8 more)

### Community 51 - "event-bus.ts"
Cohesion: 0.40
Nodes (4): `bin/` — the Forge CLI, Giving Forge work, Notes, The web console

### Community 52 - "WorkItem"
Cohesion: 0.29
Nodes (10): AskDto, ChangeRequestDto, DownloadResponse, StarterTeamDto, IsIn, IsOptional, IsString, IsUUID (+2 more)

### Community 53 - "EmployeesController"
Cohesion: 0.16
Nodes (20): assertSafeToListen(), cookie(), deny(), digest(), header(), hostOnly(), isLoopback(), LOOPBACK (+12 more)

### Community 54 - "EvaluationWorker"
Cohesion: 0.32
Nodes (8): attachGoalAcceptance(), capPlan(), PlannedHire, PlannedItem, resolveDependencies(), sanitizeChecks(), sanitizeHire(), sanitizeItem()

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

### Community 59 - ".setBudget"
Cohesion: 0.07
Nodes (23): brandBrief(), Inject, Inject, Inject, Injectable, UsageLimits, CANCEL_POLL_MS, CANCELLED (+15 more)

### Community 61 - "FLOW.md"
Cohesion: 0.40
Nodes (3): Conventions, Layout, `src/` — application root

### Community 63 - ".route"
Cohesion: 0.19
Nodes (7): Employee, EmployeeWithRelations, assertUniqueSkills(), EmployeesService, Inject, Injectable, isExecutiveRole()

### Community 66 - "html"
Cohesion: 0.24
Nodes (12): actions, budgetSection(), forms, memorySection(), permissionsSection(), profileSection(), render(), runsSection() (+4 more)

### Community 67 - "auth.controller.ts"
Cohesion: 0.17
Nodes (14): AccessGuard, digest(), readCookie(), Injectable, atLeast(), isPublic(), KINDS, requiredRole() (+6 more)

### Community 68 - "AuthService"
Cohesion: 0.16
Nodes (6): Role, AuthService, scrypt, sha256(), Inject, Injectable

### Community 69 - "icon"
Cohesion: 0.21
Nodes (23): actions, body(), deliverable(), expanded, forms, item(), planningState(), render() (+15 more)

### Community 70 - "tsx"
Cohesion: 0.14
Nodes (19): RoutingController, Controller, Inject, AVAILABILITY, CandidateInput, CandidateSkill, executionPool(), isExecutive() (+11 more)

### Community 76 - "AuthController"
Cohesion: 0.20
Nodes (10): Res, AuthController, sessionCookie(), Body, Controller, Delete, HttpCode, Param (+2 more)

### Community 78 - "domains.ts"
Cohesion: 0.12
Nodes (18): PerformanceRecord, PerformanceService, Inject, Injectable, ProfileController, Controller, Get, Param (+10 more)

### Community 80 - "settings.js"
Cohesion: 0.22
Nodes (17): html(), pad(), when(), actions, brands(), changes, claude(), company() (+9 more)

### Community 81 - "EvaluationWorker"
Cohesion: 0.12
Nodes (9): Goal, Param, Post, standardsFor(), WorkItem, WorkItemWithRelations, Inject, Injectable (+1 more)

### Community 82 - "ask.js"
Cohesion: 0.18
Nodes (12): findBrowser(), freePort(), hasWebUi(), launchApp(), MIME, Pkg, readPkg(), run (+4 more)

### Community 83 - "employees.service.ts"
Cohesion: 0.73
Nodes (4): defaultProjectsRoot(), folderProblem(), resolveRepoPath(), slug()

### Community 84 - "ScriptDiscovery"
Cohesion: 0.24
Nodes (9): clamp(), complexityOf(), computeSkillDelta(), round1(), DynamicOmniRouter, Injectable, ModelSelection, OMNI_ROUTER (+1 more)

### Community 87 - "evaluation-engine.ts"
Cohesion: 0.22
Nodes (4): Database, EvaluationWorker, Injectable, Inject

### Community 91 - "WorkController"
Cohesion: 0.09
Nodes (13): once(), CommandSandbox, createCommandSandbox(), DockerCommandSandbox, execFileAsync, HostCommandSandbox, SandboxResult, CustomRuntime (+5 more)

### Community 93 - "CreateGoalDto"
Cohesion: 0.20
Nodes (10): CreateGoalDto, ArrayMaxSize, IsArray, IsBoolean, IsIn, IsOptional, IsString, IsUUID (+2 more)

### Community 95 - "work-status.ts"
Cohesion: 0.23
Nodes (7): DimensionResult, shootScript(), RUBRIC, Injectable, VisualGate, VisualIssue, VisualReview

### Community 96 - "safe-env.ts"
Cohesion: 0.20
Nodes (6): Approval, ApprovalsService, sameAction(), Inject, Injectable, Inject

### Community 97 - "AddMemberDto"
Cohesion: 0.29
Nodes (11): IsEmail, AddMemberDto, CookieResponse, LoginDto, RoleDto, SetupDto, IsIn, IsOptional (+3 more)

### Community 98 - "pageHead"
Cohesion: 0.15
Nodes (22): actions, changes, formatAnswer(), forms, message(), pending, render(), SUGGESTIONS (+14 more)

### Community 99 - "companies.controller.ts"
Cohesion: 0.19
Nodes (6): GovernanceModule, Module, GovernancePolicy, GovernanceService, ToolDecision, Injectable

### Community 100 - "HeartbeatWorker"
Cohesion: 0.20
Nodes (7): IntakeController, IntakeDto, Body, Controller, Get, IsBoolean, Post

### Community 101 - "FakeDiscovery"
Cohesion: 0.15
Nodes (13): 4. Components, Badges, Buttons, Cards and KPIs, Checkbox, radio, toggle, Data visualisation, Empty, loading and error states, Modals and side sheets (+5 more)

### Community 102 - "AuthModule"
Cohesion: 0.23
Nodes (7): PUBLIC_DIR, Response, Controller, Get, Param, TYPES, UiController

### Community 104 - "NotAwaitingEvaluationError"
Cohesion: 0.26
Nodes (11): actions, historyView(), pendingView(), render(), avatar(), actions, addForm(), forms (+3 more)

### Community 106 - "visual-gate.ts"
Cohesion: 0.17
Nodes (12): 10. Voice and writing, 11. Accessibility, 12. Do and don't, 1. The idea, 2. Principles, 3. Logo, 5. Typography, 6. Layout and spacing (+4 more)

### Community 107 - "ObservabilityService"
Cohesion: 0.17
Nodes (9): ObservabilityController, Controller, Get, Param, ObservabilityModule, Module, ObservabilityService, summarizeRun() (+1 more)

### Community 109 - "KeepAwakeService"
Cohesion: 0.17
Nodes (12): 4. Components, Badges, Buttons, Cards and KPIs, Checkbox, radio, toggle, Data visualisation, Modals and side sheets, Navigation (+4 more)

### Community 110 - "process-cleanup.ts"
Cohesion: 0.17
Nodes (12): 10. Voice and writing, 11. Accessibility, 12. Do and don't, 1. The idea, 2. Principles, 3. Logo, 5. Typography, 6. Layout and spacing (+4 more)

### Community 111 - "path-confinement.ts"
Cohesion: 0.33
Nodes (7): confinementGate(), findPathViolation(), isInside(), norm(), PATH_KEYS, realAncestor(), PermissionCallback

### Community 112 - "Part 1 · Brand foundations"
Cohesion: 0.17
Nodes (12): 10. Voice and writing, 11. Accessibility, 12. Do and don't, 1. The idea, 2. Principles, 3. Logo, 5. Typography, 6. Layout and spacing (+4 more)

### Community 113 - "4. Components"
Cohesion: 0.17
Nodes (12): 4. Components, Badges, Buttons, Cards and KPIs, Checkbox, radio, toggle, Data visualisation, Modals and side sheets, Navigation (+4 more)

### Community 114 - "Part 1 · Brand foundations"
Cohesion: 0.17
Nodes (12): 10. Voice and writing, 11. Accessibility, 12. Do and don't, 1. The idea, 2. Principles, 3. Logo, 5. Typography, 6. Layout and spacing (+4 more)

### Community 115 - "4. Components"
Cohesion: 0.17
Nodes (12): 4. Components, Badges, Buttons, Cards and KPIs, Checkbox, radio, toggle, Data visualisation, Modals and side sheets, Navigation (+4 more)

### Community 116 - "Part 1 · Brand foundations"
Cohesion: 0.17
Nodes (12): 10. Voice and writing, 11. Accessibility, 12. Do and don't, 1. The idea, 2. Principles, 3. Logo, 5. Typography, 6. Layout and spacing (+4 more)

### Community 117 - "4. Components"
Cohesion: 0.17
Nodes (12): 4. Components, Badges, Buttons, Cards and KPIs, Checkbox, radio, toggle, Data visualisation, Modals and side sheets, Navigation (+4 more)

### Community 118 - "Part 1 · Brand foundations"
Cohesion: 0.17
Nodes (12): 10. Voice and writing, 11. Accessibility, 12. Do and don't, 1. The idea, 2. Principles, 3. Logo, 5. Typography, 6. Layout and spacing (+4 more)

### Community 119 - "4. Components"
Cohesion: 0.17
Nodes (12): 4. Components, Badges, Buttons, Cards and KPIs, Checkbox, radio, toggle, Data visualisation, Modals and side sheets, Navigation (+4 more)

### Community 120 - "Part 1 · Brand foundations"
Cohesion: 0.17
Nodes (12): 10. Voice and writing, 11. Accessibility, 12. Do and don't, 1. The idea, 2. Principles, 3. Logo, 5. Typography, 6. Layout and spacing (+4 more)

### Community 121 - "4. Components"
Cohesion: 0.17
Nodes (12): 4. Components, Badges, Buttons, Cards and KPIs, Checkbox, radio, toggle, Data visualisation, Modals and side sheets, Navigation (+4 more)

### Community 122 - "Part 1 · Brand foundations"
Cohesion: 0.17
Nodes (12): 10. Voice and writing, 11. Accessibility, 12. Do and don't, 1. The idea, 2. Principles, 3. Logo, 5. Typography, 6. Layout and spacing (+4 more)

### Community 123 - "4. Components"
Cohesion: 0.17
Nodes (12): 4. Components, Badges, Buttons, Cards and KPIs, Checkbox, radio, toggle, Data visualisation, Modals and side sheets, Navigation (+4 more)

### Community 124 - "Part 1 · Brand foundations"
Cohesion: 0.17
Nodes (12): 10. Voice and writing, 11. Accessibility, 12. Do and don't, 1. The idea, 2. Principles, 3. Logo, 5. Typography, 6. Layout and spacing (+4 more)

### Community 125 - "4. Components"
Cohesion: 0.17
Nodes (12): 4. Components, Badges, Buttons, Cards and KPIs, Checkbox, radio, toggle, Data visualisation, Modals and side sheets, Navigation (+4 more)

### Community 126 - "Part 1 · Brand foundations"
Cohesion: 0.17
Nodes (12): 10. Voice and writing, 11. Accessibility, 12. Do and don't, 1. The idea, 2. Principles, 3. Logo, 5. Typography, 6. Layout and spacing (+4 more)

### Community 127 - "4. Components"
Cohesion: 0.17
Nodes (12): 4. Components, Badges, Buttons, Cards and KPIs, Checkbox, radio, toggle, Data visualisation, Modals and side sheets, Navigation (+4 more)

### Community 128 - "Part 1 · Brand foundations"
Cohesion: 0.17
Nodes (12): 10. Voice and writing, 11. Accessibility, 12. Do and don't, 1. The idea, 2. Principles, 3. Logo, 5. Typography, 6. Layout and spacing (+4 more)

### Community 129 - "4. Components"
Cohesion: 0.17
Nodes (12): 4. Components, Badges, Buttons, Cards and KPIs, Checkbox, radio, toggle, Data visualisation, Modals and side sheets, Navigation (+4 more)

### Community 130 - "safe-env.ts"
Cohesion: 0.29
Nodes (9): agentEnv(), BASE_KEYS, CLAUDE_KEYS, commandEnv(), HEADLESS, passthrough(), pick(), PROXY_KEYS (+1 more)

### Community 131 - "model-provider.ts"
Cohesion: 0.21
Nodes (8): DRIZZLE, drizzleProvider, PG_CLIENT, pgClientProvider, Company, CompaniesService, Inject, Injectable

### Community 132 - "BudgetsController"
Cohesion: 0.18
Nodes (8): BrandsController, Body, Controller, Get, Param, Post, BrandsModule, Module

### Community 133 - "3. Page anatomy"
Cohesion: 0.25
Nodes (8): 3. Page anatomy, Contact, Footer, Hero, Navigation, Notes / writing list, Section header, Work cards

### Community 134 - "field-notebook.md"
Cohesion: 0.25
Nodes (7): components.css, FIELD-NOTEBOOK.md · Sahil Shaikh brand (all-in-one), How Claude Code should use this file, motion.css (website only), Part 4 · Code, tailwind-theme.css (only if the project uses Tailwind v4), tokens.css

### Community 135 - "3. Page anatomy"
Cohesion: 0.25
Nodes (8): 3. Page anatomy, Contact, Footer, Hero, Navigation, Notes / writing list, Section header, Work cards

### Community 136 - "3. Page anatomy"
Cohesion: 0.25
Nodes (8): 3. Page anatomy, Contact, Footer, Hero, Navigation, Notes / writing list, Section header, Work cards

### Community 137 - "3. Page anatomy"
Cohesion: 0.25
Nodes (8): 3. Page anatomy, Contact, Footer, Hero, Navigation, Notes / writing list, Section header, Work cards

### Community 138 - "3. Page anatomy"
Cohesion: 0.25
Nodes (8): 3. Page anatomy, Contact, Footer, Hero, Navigation, Notes / writing list, Section header, Work cards

### Community 139 - "3. Page anatomy"
Cohesion: 0.25
Nodes (8): 3. Page anatomy, Contact, Footer, Hero, Navigation, Notes / writing list, Section header, Work cards

### Community 140 - "3. Page anatomy"
Cohesion: 0.25
Nodes (8): 3. Page anatomy, Contact, Footer, Hero, Navigation, Notes / writing list, Section header, Work cards

### Community 141 - "3. Page anatomy"
Cohesion: 0.25
Nodes (8): 3. Page anatomy, Contact, Footer, Hero, Navigation, Notes / writing list, Section header, Work cards

### Community 142 - "3. Page anatomy"
Cohesion: 0.25
Nodes (8): 3. Page anatomy, Contact, Footer, Hero, Navigation, Notes / writing list, Section header, Work cards

### Community 143 - "3. Page anatomy"
Cohesion: 0.25
Nodes (8): 3. Page anatomy, Contact, Footer, Hero, Navigation, Notes / writing list, Section header, Work cards

### Community 144 - "3. Page anatomy"
Cohesion: 0.25
Nodes (8): 3. Page anatomy, Contact, Footer, Hero, Navigation, Notes / writing list, Section header, Work cards

### Community 145 - "custom-runtime.e2e-spec.ts"
Cohesion: 0.24
Nodes (3): KeepAwakeService, Inject, Injectable

### Community 146 - "Part 3 · Website guideline"
Cohesion: 0.31
Nodes (4): KEEP_AWAKE_SCRIPT, killTree(), run, stopProcessesIn()

### Community 147 - "Part 2 · Platform UI guideline"
Cohesion: 0.29
Nodes (7): 1. Foundations for the platform, 2. Type scale, 3. App layout, 5. Patterns, 6. No-motion rules, 7. Checklist for every screen, Part 2 · Platform UI guideline

### Community 148 - "4. Motion system"
Cohesion: 0.18
Nodes (11): 1. Layout, 2. Type scale, 4. Motion system, 5. Checklist for every page, Never, Part 3 · Website guideline, Reduced motion, Reference CSS (+3 more)

### Community 149 - "Part 2 · Platform UI guideline"
Cohesion: 0.29
Nodes (7): 1. Foundations for the platform, 2. Type scale, 3. App layout, 5. Patterns, 6. No-motion rules, 7. Checklist for every screen, Part 2 · Platform UI guideline

### Community 150 - "4. Motion system"
Cohesion: 0.29
Nodes (7): 4. Motion system, Never, Reduced motion, Reference CSS, Responses to the user, The hero sequence (in order), Tokens

### Community 151 - "Part 3 · Website guideline"
Cohesion: 0.28
Nodes (6): CompaniesModule, Module, GoalsModule, Module, ProjectsModule, Module

### Community 152 - "Part 2 · Platform UI guideline"
Cohesion: 0.29
Nodes (7): 1. Foundations for the platform, 2. Type scale, 3. App layout, 5. Patterns, 6. No-motion rules, 7. Checklist for every screen, Part 2 · Platform UI guideline

### Community 153 - "4. Motion system"
Cohesion: 0.18
Nodes (11): 1. Layout, 2. Type scale, 4. Motion system, 5. Checklist for every page, Never, Part 3 · Website guideline, Reduced motion, Reference CSS (+3 more)

### Community 154 - "Part 3 · Website guideline"
Cohesion: 0.29
Nodes (6): 1. Layout, 2. Type scale, 5. Checklist for every page, GRAPH-PAPER.md · Sahil Shaikh brand (all-in-one), How Claude Code should use this file, Part 3 · Website guideline

### Community 155 - "Part 2 · Platform UI guideline"
Cohesion: 0.29
Nodes (7): 1. Foundations for the platform, 2. Type scale, 3. App layout, 5. Patterns, 6. No-motion rules, 7. Checklist for every screen, Part 2 · Platform UI guideline

### Community 156 - "4. Motion system"
Cohesion: 0.29
Nodes (7): 4. Motion system, Never, Reduced motion, Reference CSS, Responses to the user, The hero sequence (in order), Tokens

### Community 157 - "Part 3 · Website guideline"
Cohesion: 0.29
Nodes (6): 1. Layout, 2. Type scale, 5. Checklist for every page, How Claude Code should use this file, IVORY-PRESS.md · Sahil Shaikh brand (all-in-one), Part 3 · Website guideline

### Community 158 - "Part 2 · Platform UI guideline"
Cohesion: 0.29
Nodes (7): 1. Foundations for the platform, 2. Type scale, 3. App layout, 5. Patterns, 6. No-motion rules, 7. Checklist for every screen, Part 2 · Platform UI guideline

### Community 159 - "4. Motion system"
Cohesion: 0.29
Nodes (7): 4. Motion system, Never, Reduced motion, Reference CSS, Responses to the user, The hero sequence (in order), Tokens

### Community 160 - "Part 3 · Website guideline"
Cohesion: 0.29
Nodes (6): 1. Layout, 2. Type scale, 5. Checklist for every page, How Claude Code should use this file, PAPER-CUT.md · Sahil Shaikh brand (all-in-one), Part 3 · Website guideline

### Community 161 - "Part 2 · Platform UI guideline"
Cohesion: 0.29
Nodes (7): 1. Foundations for the platform, 2. Type scale, 3. App layout, 5. Patterns, 6. No-motion rules, 7. Checklist for every screen, Part 2 · Platform UI guideline

### Community 162 - "4. Motion system"
Cohesion: 0.18
Nodes (11): 1. Layout, 2. Type scale, 4. Motion system, 5. Checklist for every page, Never, Part 3 · Website guideline, Reduced motion, Reference CSS (+3 more)

### Community 163 - "Part 3 · Website guideline"
Cohesion: 0.29
Nodes (6): 1. Layout, 2. Type scale, 5. Checklist for every page, How Claude Code should use this file, NOTEPAD.md · Sahil Shaikh brand (all-in-one), Part 3 · Website guideline

### Community 164 - "Part 2 · Platform UI guideline"
Cohesion: 0.29
Nodes (7): 1. Foundations for the platform, 2. Type scale, 3. App layout, 5. Patterns, 6. No-motion rules, 7. Checklist for every screen, Part 2 · Platform UI guideline

### Community 165 - "4. Motion system"
Cohesion: 0.29
Nodes (7): 4. Motion system, Never, Reduced motion, Reference CSS, Responses to the user, The hero sequence (in order), Tokens

### Community 166 - "Part 3 · Website guideline"
Cohesion: 0.14
Nodes (14): EvaluationResult, Evaluation, evaluations, EvaluationStatus, EvaluationSummary, keyLines(), mergeConflictResult(), NotAwaitingEvaluationError (+6 more)

### Community 167 - "Part 2 · Platform UI guideline"
Cohesion: 0.29
Nodes (7): 1. Foundations for the platform, 2. Type scale, 3. App layout, 5. Patterns, 6. No-motion rules, 7. Checklist for every screen, Part 2 · Platform UI guideline

### Community 168 - "4. Motion system"
Cohesion: 0.29
Nodes (7): 4. Motion system, Never, Reduced motion, Reference CSS, Responses to the user, The hero sequence (in order), Tokens

### Community 169 - "Part 3 · Website guideline"
Cohesion: 0.29
Nodes (6): 1. Layout, 2. Type scale, 5. Checklist for every page, How Claude Code should use this file, Part 3 · Website guideline, PORCELAIN.md · Sahil Shaikh brand (all-in-one)

### Community 170 - "Part 2 · Platform UI guideline"
Cohesion: 0.29
Nodes (7): 1. Foundations for the platform, 2. Type scale, 3. App layout, 5. Patterns, 6. No-motion rules, 7. Checklist for every screen, Part 2 · Platform UI guideline

### Community 171 - "4. Motion system"
Cohesion: 0.29
Nodes (7): 4. Motion system, Never, Reduced motion, Reference CSS, Responses to the user, The hero sequence (in order), Tokens

### Community 172 - "Part 3 · Website guideline"
Cohesion: 0.29
Nodes (6): 1. Layout, 2. Type scale, 5. Checklist for every page, How Claude Code should use this file, Part 3 · Website guideline, SAGE-LEDGER.md · Sahil Shaikh brand (all-in-one)

### Community 173 - "Part 2 · Platform UI guideline"
Cohesion: 0.29
Nodes (7): 1. Foundations for the platform, 2. Type scale, 3. App layout, 5. Patterns, 6. No-motion rules, 7. Checklist for every screen, Part 2 · Platform UI guideline

### Community 174 - "4. Motion system"
Cohesion: 0.29
Nodes (7): 4. Motion system, Never, Reduced motion, Reference CSS, Responses to the user, The hero sequence (in order), Tokens

### Community 175 - "Part 3 · Website guideline"
Cohesion: 0.29
Nodes (6): 1. Layout, 2. Type scale, 5. Checklist for every page, How Claude Code should use this file, Part 3 · Website guideline, STUDIO-SIGNAL.md · Sahil Shaikh brand (all-in-one)

### Community 176 - "Part 2 · Platform UI guideline"
Cohesion: 0.29
Nodes (7): 1. Foundations for the platform, 2. Type scale, 3. App layout, 5. Patterns, 6. No-motion rules, 7. Checklist for every screen, Part 2 · Platform UI guideline

### Community 177 - "4. Motion system"
Cohesion: 0.29
Nodes (7): 4. Motion system, Never, Reduced motion, Reference CSS, Responses to the user, The hero sequence (in order), Tokens

### Community 178 - "4. Colour"
Cohesion: 0.40
Nodes (5): 4. Colour, Charts, Core palette, Proportions, Rules

### Community 179 - "Part 4 · Code"
Cohesion: 0.25
Nodes (7): components.css, FIELD-INSTRUMENT.md · Sahil Shaikh brand (all-in-one), How Claude Code should use this file, motion.css (website only), Part 4 · Code, tailwind-theme.css (only if the project uses Tailwind v4), tokens.css

### Community 180 - "Part 3 · Website guideline"
Cohesion: 0.40
Nodes (5): 1. Layout, 2. Type scale, 5. Imagery on the website, 6. Checklist for every page, Part 3 · Website guideline

### Community 181 - "4. Colour"
Cohesion: 0.40
Nodes (5): 4. Colour, Charts, Core palette, Proportions, Rules

### Community 182 - "4. Colour"
Cohesion: 0.40
Nodes (5): 4. Colour, Charts, Core palette, Proportions, Rules

### Community 183 - "Part 4 · Code"
Cohesion: 0.25
Nodes (7): components.css, GLASSHOUSE.md · Sahil Shaikh brand (all-in-one), How Claude Code should use this file, motion.css (website only), Part 4 · Code, tailwind-theme.css (only if the project uses Tailwind v4), tokens.css

### Community 184 - "4. Colour"
Cohesion: 0.40
Nodes (5): 4. Colour, Charts, Core palette, Proportions, Rules

### Community 185 - "Part 4 · Code"
Cohesion: 0.40
Nodes (5): components.css, motion.css (website only), Part 4 · Code, tailwind-theme.css (only if the project uses Tailwind v4), tokens.css

### Community 186 - "4. Colour"
Cohesion: 0.40
Nodes (5): 4. Colour, Charts, Core palette, Proportions, Rules

### Community 187 - "Part 4 · Code"
Cohesion: 0.40
Nodes (5): components.css, motion.css (website only), Part 4 · Code, tailwind-theme.css (only if the project uses Tailwind v4), tokens.css

### Community 188 - "4. Colour"
Cohesion: 0.40
Nodes (5): 4. Colour, Charts, Core palette, Proportions, Rules

### Community 189 - "Part 4 · Code"
Cohesion: 0.25
Nodes (7): components.css, How Claude Code should use this file, LILAC-DESK.md · Sahil Shaikh brand (all-in-one), motion.css (website only), Part 4 · Code, tailwind-theme.css (only if the project uses Tailwind v4), tokens.css

### Community 190 - "4. Colour"
Cohesion: 0.40
Nodes (5): 4. Colour, Charts, Core palette, Proportions, Rules

### Community 191 - "Part 4 · Code"
Cohesion: 0.40
Nodes (5): components.css, motion.css (website only), Part 4 · Code, tailwind-theme.css (only if the project uses Tailwind v4), tokens.css

### Community 192 - "4. Colour"
Cohesion: 0.40
Nodes (5): 4. Colour, Charts, Core palette, Proportions, Rules

### Community 193 - "Part 4 · Code"
Cohesion: 0.40
Nodes (5): components.css, motion.css (website only), Part 4 · Code, tailwind-theme.css (only if the project uses Tailwind v4), tokens.css

### Community 194 - "4. Colour"
Cohesion: 0.40
Nodes (5): 4. Colour, Charts, Core palette, Proportions, Rules

### Community 195 - "Part 4 · Code"
Cohesion: 0.40
Nodes (5): components.css, motion.css (website only), Part 4 · Code, tailwind-theme.css (only if the project uses Tailwind v4), tokens.css

### Community 196 - "4. Colour"
Cohesion: 0.40
Nodes (5): 4. Colour, Charts, Core palette, Proportions, Rules

### Community 197 - "Part 4 · Code"
Cohesion: 0.40
Nodes (5): components.css, motion.css (website only), Part 4 · Code, tailwind-theme.css (only if the project uses Tailwind v4), tokens.css

### Community 198 - "4. Colour"
Cohesion: 0.40
Nodes (5): 4. Colour, Charts, Core palette, Proportions, Rules

### Community 199 - "Part 4 · Code"
Cohesion: 0.40
Nodes (5): components.css, motion.css (website only), Part 4 · Code, tailwind-theme.css (only if the project uses Tailwind v4), tokens.css

### Community 200 - "custom.runtime.edge.spec.ts"
Cohesion: 0.33
Nodes (4): DatabaseModule, Global, Inject, Module

### Community 201 - "Brand systems"
Cohesion: 0.50
Nodes (3): Adding a brand, Brand systems, How Forge uses them

### Community 202 - "HeartbeatsController"
Cohesion: 0.17
Nodes (9): PlanResult, HeartbeatWorker, Injectable, HeartbeatsController, Controller, Param, Post, HeartbeatsModule (+1 more)

### Community 203 - ".record"
Cohesion: 0.50
Nodes (3): EventRow, events, Executor

### Community 204 - "EventsModule"
Cohesion: 0.67
Nodes (3): EventsModule, Global, Module

### Community 205 - "HealthModule"
Cohesion: 0.40
Nodes (5): Matches, SaveBrandDto, IsString, MaxLength, MinLength

## Knowledge Gaps
- **950 isolated node(s):** `Cmd`, `commands`, `$schema`, `collection`, `sourceRoot` (+945 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **20 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Database` connect `evaluation-engine.ts` to `RuntimeEvent`, `Database`, `model-provider.ts`, `WorkService`, `work.schema.ts`, `GoalsService`, `companies.service.ts`, `ProjectsService`, `health.service.ts`, `custom-runtime.e2e-spec.ts`, `custom-runtime.e2e-spec.ts`, `memory.service.ts`, `execution-lifecycle.e2e-spec.ts`, `tool-executor.ts`, `runtimes.module.ts`, `SetBudgetDto`, `.plan`, `Part 3 · Website guideline`, `approvals.service.ts`, `employees.service.ts`, `candidate-scoring.ts`, `EventBus`, `.setBudget`, `.route`, `auth.controller.ts`, `AuthService`, `HeartbeatsController`, `.record`, `AuthController`, `domains.ts`, `EvaluationWorker`, `safe-env.ts`?**
  _High betweenness centrality (0.145) - this node is a cross-community bridge._
- **Why does `item()` connect `icon` to `settings.js`, `Database`, `.route`?**
  _High betweenness centrality (0.070) - this node is a cross-community bridge._
- **Why does `bootApp()` connect `custom-runtime.e2e-spec.ts` to `RuntimeEvent`, `scripts`, `companies.service.ts`, `EmployeesController`?**
  _High betweenness centrality (0.037) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `ExecutionWorker` (e.g. with `builtGoal()` and `delivered()`) actually correct?**
  _`ExecutionWorker` has 3 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Cmd`, `commands`, `$schema` to the rest of the system?**
  _950 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `RuntimeEvent` be split into smaller, more focused modules?**
  _Cohesion score 0.08340649692712906 - nodes in this community are weakly interconnected._
- **Should `Database` be split into smaller, more focused modules?**
  _Cohesion score 0.10017730496453901 - nodes in this community are weakly interconnected._
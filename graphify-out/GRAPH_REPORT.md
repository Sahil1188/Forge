# Graph Report - C:\Projects\Forge  (2026-08-03)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 625 nodes · 1366 edges · 23 communities
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 2 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

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

## God Nodes (most connected - your core abstractions)
1. `Database` - 68 edges
2. `ExecutionWorker` - 33 edges
3. `RuntimeEvent` - 28 edges
4. `compilerOptions` - 20 edges
5. `RuntimeRunContext` - 18 edges
6. `AgentRuntime` - 17 edges
7. `AgentRunsService` - 16 edges
8. `WorkItem` - 16 edges
9. `WorkService` - 16 edges
10. `scripts` - 14 edges

## Surprising Connections (you probably didn't know these)
- `bootstrap()` --indirect_call--> `AppModule`  [INFERRED]
  src/main.ts → src/app.module.ts
- `normalizeAll()` --indirect_call--> `normalizeSdkMessage()`  [INFERRED]
  src/modules/runtimes/claude-code/message-normalizer.spec.ts → src/modules/runtimes/claude-code/message-normalizer.ts
- `ApprovalMockRuntime` --implements--> `AgentRuntime`  [EXTRACTED]
  test/approvals.e2e-spec.ts → src/modules/runtimes/runtime.port.ts
- `BudgetMockRuntime` --implements--> `AgentRuntime`  [EXTRACTED]
  test/circuit-breakers.e2e-spec.ts → src/modules/runtimes/runtime.port.ts
- `TimeoutMockRuntime` --implements--> `AgentRuntime`  [EXTRACTED]
  test/circuit-breakers.e2e-spec.ts → src/modules/runtimes/runtime.port.ts

## Import Cycles
- None detected.

## Communities (23 total, 0 thin omitted)

### Community 0 - "RuntimeEvent"
Cohesion: 0.08
Nodes (28): AppModule, Module, bootstrap(), ClaudeCodeRuntime, Inject, Injectable, normalizeSdkMessage(), SdkMessage (+20 more)

### Community 1 - "execution.worker.ts"
Cohesion: 0.07
Nodes (33): DRIZZLE, drizzleProvider, PG_CLIENT, pgClientProvider, DomainEvent, DomainEventInput, EventBus, EventHandler (+25 more)

### Community 2 - "Database"
Cohesion: 0.09
Nodes (14): Database, Approval, ApprovalsService, Inject, Injectable, EmployeeWithRelations, AgentRun, AgentRunsService (+6 more)

### Community 3 - "WorkService"
Cohesion: 0.08
Nodes (29): Executor, AddDependencyDto, AssignWorkDto, ChangeStatusDto, CreateWorkItemDto, TASK_TYPES, IsIn, IsInt (+21 more)

### Community 4 - "app.module.ts"
Cohesion: 0.07
Nodes (31): DatabaseModule, Global, Inject, Module, EventsModule, Global, Module, ApprovalsModule (+23 more)

### Community 5 - "scripts"
Cohesion: 0.05
Nodes (43): @anthropic-ai/claude-agent-sdk, class-transformer, class-validator, dotenv, drizzle-orm, @nestjs/common, @nestjs/config, @nestjs/core (+35 more)

### Community 6 - "work.schema.ts"
Cohesion: 0.10
Nodes (30): createDb(), main(), approvals, ApprovalStatus, companies, User, users, Employee (+22 more)

### Community 7 - "budgets.service.ts"
Cohesion: 0.09
Nodes (25): IsNumber, Put, BudgetEvaluation, BudgetState, evaluateBudget(), BudgetsController, Body, Controller (+17 more)

### Community 8 - "devDependencies"
Cohesion: 0.06
Nodes (33): drizzle-kit, eslint, eslint-config-prettier, @nestjs/cli, @nestjs/schematics, @nestjs/testing, devDependencies, drizzle-kit (+25 more)

### Community 9 - "EmployeesService"
Cohesion: 0.08
Nodes (24): IsArray, IsObject, CreateEmployeeDto, EmployeeSkillDto, RuntimeConfigDto, IsInt, IsOptional, IsString (+16 more)

### Community 10 - "GoalsService"
Cohesion: 0.11
Nodes (16): CreateGoalDto, IsOptional, IsString, IsUUID, MaxLength, GoalsController, Body, Controller (+8 more)

### Community 11 - "compilerOptions"
Cohesion: 0.07
Nodes (26): src/**/*, compilerOptions, allowSyntheticDefaultImports, baseUrl, declaration, emitDecoratorMetadata, esModuleInterop, experimentalDecorators (+18 more)

### Community 12 - "companies.service.ts"
Cohesion: 0.12
Nodes (15): CompaniesController, Body, Controller, Get, Param, Post, Company, CompaniesService (+7 more)

### Community 13 - "ProjectsService"
Cohesion: 0.15
Nodes (12): CreateProjectDto, IsString, MaxLength, ProjectsController, Body, Controller, Get, Param (+4 more)

### Community 14 - "health.service.ts"
Cohesion: 0.18
Nodes (9): HealthController, Controller, Get, HealthModule, Module, HealthService, HealthStatus, Inject (+1 more)

### Community 15 - "approvals.controller.ts"
Cohesion: 0.16
Nodes (10): ApprovalsController, Body, Controller, Get, Param, Post, DecideApprovalDto, IsIn (+2 more)

### Community 16 - "exclude"
Cohesion: 0.22
Nodes (8): **/*.spec.ts, test, ./tsconfig.json, exclude, extends, dist, drizzle.config.ts, node_modules

### Community 17 - "nest-cli.json"
Cohesion: 0.33
Nodes (5): collection, compilerOptions, deleteOutDir, $schema, sourceRoot

## Knowledge Gaps
- **113 isolated node(s):** `$schema`, `collection`, `sourceRoot`, `deleteOutDir`, `name` (+108 more)
  These have ≤1 connection - possible missing edges or undocumented components.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Database` connect `Database` to `execution.worker.ts`, `WorkService`, `work.schema.ts`, `budgets.service.ts`, `EmployeesService`, `GoalsService`, `companies.service.ts`, `ProjectsService`, `health.service.ts`?**
  _High betweenness centrality (0.210) - this node is a cross-community bridge._
- **Why does `RuntimeEvent` connect `RuntimeEvent` to `execution.worker.ts`, `Database`?**
  _High betweenness centrality (0.036) - this node is a cross-community bridge._
- **Why does `ExecutionWorker` connect `Database` to `RuntimeEvent`, `execution.worker.ts`, `app.module.ts`?**
  _High betweenness centrality (0.031) - this node is a cross-community bridge._
- **What connects `$schema`, `collection`, `sourceRoot` to the rest of the system?**
  _113 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `RuntimeEvent` be split into smaller, more focused modules?**
  _Cohesion score 0.08382936507936507 - nodes in this community are weakly interconnected._
- **Should `execution.worker.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07138535995160314 - nodes in this community are weakly interconnected._
- **Should `Database` be split into smaller, more focused modules?**
  _Cohesion score 0.08771929824561403 - nodes in this community are weakly interconnected._
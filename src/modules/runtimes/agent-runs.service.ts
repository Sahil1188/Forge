import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { desc, eq } from 'drizzle-orm';
import { DRIZZLE, Database } from '../../infrastructure/database/drizzle.provider';
import { agentRuns, AgentRun, AgentRunStatus } from './agent-runs.schema';

export interface CreateAgentRunInput {
  workItemId?: string | null;
  goalId?: string | null;
  employeeId: string;
  workspaceId?: string;
  runtimeKey: string;
  provider?: string;
  model?: string;
}

export interface FinishAgentRunInput {
  status: AgentRunStatus;
  sessionId?: string;
  inputTokens?: number;
  outputTokens?: number;
  estimatedCostUsd?: number;
  toolCallCount?: number;
  filesChangedCount?: number;
  error?: string;
}

@Injectable()
export class AgentRunsService {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  async create(input: CreateAgentRunInput): Promise<AgentRun> {
    const [run] = await this.db
      .insert(agentRuns)
      .values({
        workItemId: input.workItemId ?? null,
        goalId: input.goalId ?? null,
        employeeId: input.employeeId,
        workspaceId: input.workspaceId ?? null,
        runtimeKey: input.runtimeKey,
        provider: input.provider ?? null,
        model: input.model ?? null,
      })
      .returning();
    return run;
  }

  async attachWorkspace(id: string, workspaceId: string): Promise<void> {
    await this.db.update(agentRuns).set({ workspaceId }).where(eq(agentRuns.id, id));
  }

  async setStatus(id: string, status: AgentRunStatus): Promise<void> {
    await this.db.update(agentRuns).set({ status }).where(eq(agentRuns.id, id));
  }

  async setTranscriptRef(id: string, transcriptRef: string): Promise<void> {
    await this.db.update(agentRuns).set({ transcriptRef }).where(eq(agentRuns.id, id));
  }

  async finish(id: string, input: FinishAgentRunInput): Promise<AgentRun> {
    const current = await this.findOne(id);
    const endedAt = new Date();
    const durationMs = endedAt.getTime() - current.startedAt.getTime();
    const [run] = await this.db
      .update(agentRuns)
      .set({
        status: input.status,
        endedAt,
        durationMs,
        sessionId: input.sessionId ?? current.sessionId,
        inputTokens: input.inputTokens ?? current.inputTokens,
        outputTokens: input.outputTokens ?? current.outputTokens,
        estimatedCostUsd: input.estimatedCostUsd ?? current.estimatedCostUsd,
        toolCallCount: input.toolCallCount ?? current.toolCallCount,
        filesChangedCount: input.filesChangedCount ?? current.filesChangedCount,
        errorJson: input.error ? { message: input.error } : current.errorJson,
      })
      .where(eq(agentRuns.id, id))
      .returning();
    return run;
  }

  async findOne(id: string): Promise<AgentRun> {
    const [run] = await this.db.select().from(agentRuns).where(eq(agentRuns.id, id));
    if (!run) {
      throw new NotFoundException(`Agent run ${id} not found`);
    }
    return run;
  }

  async findByWorkItem(workItemId: string): Promise<AgentRun[]> {
    return this.db
      .select()
      .from(agentRuns)
      .where(eq(agentRuns.workItemId, workItemId))
      .orderBy(desc(agentRuns.createdAt));
  }

  async findByEmployee(employeeId: string, limit = 5): Promise<AgentRun[]> {
    return this.db
      .select()
      .from(agentRuns)
      .where(eq(agentRuns.employeeId, employeeId))
      .orderBy(desc(agentRuns.createdAt))
      .limit(limit);
  }
}

import { Inject, Injectable, Logger } from '@nestjs/common';
import { desc, eq } from 'drizzle-orm';
import { DRIZZLE, Database } from '../../infrastructure/database/drizzle.provider';
import { agentMemories, AgentMemory, MemoryKind } from './memory.schema';

export interface RememberInput {
  employeeId: string;
  content: string;
  kind?: MemoryKind;
  taskType?: string | null;
  skillKey?: string | null;
  salience?: number;
  sourceRunId?: string | null;
}

export interface RecallOptions {
  taskType?: string | null;
  limit?: number;
}

/**
 * Working/semantic memory for employees (spec §15). `remember` stores a durable
 * lesson; `recall` returns the most relevant ones to inject into a run's context.
 *
 * Ranking is intentionally simple and dependency-free (no embeddings in V1):
 * candidates are scored by salience, task-type relevance, and recency. This keeps
 * memory fully deterministic and testable; a vector store can slot in behind the
 * same interface later without changing callers.
 */
@Injectable()
export class MemoryService {
  private readonly logger = new Logger(MemoryService.name);
  /** How many recent memories to consider before ranking. */
  private readonly candidatePool = 40;

  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  async remember(input: RememberInput): Promise<AgentMemory> {
    const [row] = await this.db
      .insert(agentMemories)
      .values({
        employeeId: input.employeeId,
        content: input.content,
        kind: input.kind ?? 'outcome',
        taskType: input.taskType ?? null,
        skillKey: input.skillKey ?? null,
        salience: clamp(input.salience ?? 50, 0, 100),
        sourceRunId: input.sourceRunId ?? null,
      })
      .returning();
    return row;
  }

  /** Top memories for an employee, ranked for the given task type. */
  async recall(employeeId: string, opts: RecallOptions = {}): Promise<AgentMemory[]> {
    const limit = opts.limit ?? 5;
    const pool = await this.db
      .select()
      .from(agentMemories)
      .where(eq(agentMemories.employeeId, employeeId))
      .orderBy(desc(agentMemories.createdAt))
      .limit(this.candidatePool);

    const now = Date.now();
    return pool
      .map((m) => ({ m, score: this.score(m, opts.taskType ?? null, now) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((r) => r.m);
  }

  /** A CLAUDE.md-ready block of recalled memories, or '' when the employee is new. */
  async recallBlock(employeeId: string, taskType?: string | null): Promise<string> {
    const memories = await this.recall(employeeId, { taskType, limit: 5 });
    if (memories.length === 0) return '';
    const lines = memories.map((m) => `- (${m.kind}) ${m.content}`);
    return ['## What you have learned so far', ...lines, ''].join('\n');
  }

  async findByEmployee(employeeId: string, limit = 20): Promise<AgentMemory[]> {
    return this.db
      .select()
      .from(agentMemories)
      .where(eq(agentMemories.employeeId, employeeId))
      .orderBy(desc(agentMemories.createdAt))
      .limit(limit);
  }

  private score(m: AgentMemory, taskType: string | null, now: number): number {
    let score = m.salience;
    if (taskType && m.taskType === taskType) score += 30;
    // Recency: decays ~1 point/day, capped so old lessons never fully vanish.
    const ageDays = (now - m.createdAt.getTime()) / 86_400_000;
    score -= Math.min(ageDays, 20);
    return score;
  }
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

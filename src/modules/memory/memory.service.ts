import { Inject, Injectable, Logger } from '@nestjs/common';
import { and, desc, eq, gte, ne } from 'drizzle-orm';
import { DRIZZLE, Database } from '../../infrastructure/database/drizzle.provider';
import { agentMemories, AgentMemory, MemoryKind } from './memory.schema';
import { employees } from '../employees/employees.schema';

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
    const memories = await this.recall(employeeId, { taskType, limit: 6 });
    // The playbook is a bonus: if it can't be read, carry on with personal memory only.
    const team = taskType ? await this.teamPlaybook(employeeId, taskType).catch(() => [] as AgentMemory[]) : [];
    if (memories.length === 0 && team.length === 0) return '';
    return [
      ...(memories.length ? ['## What you have learned so far', ...memories.map((m) => `- (${m.kind}) ${m.content}`), ''] : []),
      ...(team.length ? ['## Team playbook (lessons colleagues learned on this kind of work)', ...team.map((m) => `- ${m.content}`), ''] : []),
    ].join('\n');
  }

  /**
   * The strongest lessons colleagues in the same company learned on the same kind of work, so a
   * mistake one person made is avoided by everyone (a shared playbook, not just personal memory).
   */
  async teamPlaybook(employeeId: string, taskType: string, limit = 4): Promise<AgentMemory[]> {
    const [me] = await this.db.select({ companyId: employees.companyId }).from(employees).where(eq(employees.id, employeeId));
    if (!me) return [];
    const rows = await this.db
      .select({ m: agentMemories })
      .from(agentMemories)
      .innerJoin(employees, eq(employees.id, agentMemories.employeeId))
      .where(
        and(
          eq(employees.companyId, me.companyId),
          ne(agentMemories.employeeId, employeeId),
          eq(agentMemories.taskType, taskType),
          eq(agentMemories.kind, 'lesson'),
          gte(agentMemories.salience, 65),
        ),
      )
      .orderBy(desc(agentMemories.salience), desc(agentMemories.createdAt))
      .limit(limit);
    return rows.map((r) => r.m);
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

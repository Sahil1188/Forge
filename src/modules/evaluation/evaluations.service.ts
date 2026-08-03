import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { desc, eq } from 'drizzle-orm';
import { DRIZZLE, Database } from '../../infrastructure/database/drizzle.provider';
import { evaluations, Evaluation } from './evaluation.schema';
import { EvaluationResult } from './evaluation-engine';

export interface CreateEvaluationInput {
  workItemId: string;
  agentRunId?: string | null;
  result: EvaluationResult;
}

@Injectable()
export class EvaluationsService {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  async create(input: CreateEvaluationInput): Promise<Evaluation> {
    const [row] = await this.db
      .insert(evaluations)
      .values({
        workItemId: input.workItemId,
        agentRunId: input.agentRunId ?? null,
        status: input.result.status,
        overallScore: input.result.overallScore,
        detail: { dimensions: input.result.dimensions, note: input.result.note },
      })
      .returning();
    return row;
  }

  async findByWorkItem(workItemId: string): Promise<Evaluation[]> {
    return this.db
      .select()
      .from(evaluations)
      .where(eq(evaluations.workItemId, workItemId))
      .orderBy(desc(evaluations.createdAt));
  }

  async findOne(id: string): Promise<Evaluation> {
    const [row] = await this.db.select().from(evaluations).where(eq(evaluations.id, id));
    if (!row) {
      throw new NotFoundException(`Evaluation ${id} not found`);
    }
    return row;
  }
}

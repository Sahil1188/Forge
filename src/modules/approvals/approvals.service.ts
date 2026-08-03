import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, desc, eq } from 'drizzle-orm';
import { DRIZZLE, Database } from '../../infrastructure/database/drizzle.provider';
import { OutboxService } from '../../infrastructure/events/outbox.service';
import { EventTypes } from '../../infrastructure/events/event-types';
import { approvals, Approval, ApprovalStatus } from './approvals.schema';

export interface RequestApprovalInput {
  agentRunId: string;
  workItemId: string;
  employeeId: string;
  toolName: string;
  input: unknown;
}

@Injectable()
export class ApprovalsService {
  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly outbox: OutboxService,
  ) {}

  /** Creates a pending approval unless one already exists for this run+tool. */
  async requestIfAbsent(input: RequestApprovalInput): Promise<Approval> {
    const [existing] = await this.db
      .select()
      .from(approvals)
      .where(
        and(
          eq(approvals.agentRunId, input.agentRunId),
          eq(approvals.toolName, input.toolName),
          eq(approvals.status, 'pending'),
        ),
      );
    if (existing) {
      return existing;
    }

    return this.db.transaction(async (tx) => {
      const [row] = await tx
        .insert(approvals)
        .values({
          agentRunId: input.agentRunId,
          workItemId: input.workItemId,
          employeeId: input.employeeId,
          toolName: input.toolName,
          requestedAction: { toolName: input.toolName, input: input.input },
        })
        .returning();
      await this.outbox.record(tx, {
        type: EventTypes.ApprovalRequested,
        aggregateType: 'approval',
        aggregateId: row.id,
        payload: { agentRunId: input.agentRunId, workItemId: input.workItemId, toolName: input.toolName },
      });
      return row;
    });
  }

  async decide(id: string, decision: 'approved' | 'denied', userId?: string): Promise<Approval> {
    const approval = await this.findOne(id);
    return this.db.transaction(async (tx) => {
      const [row] = await tx
        .update(approvals)
        .set({
          status: decision as ApprovalStatus,
          decidedByUserId: userId ?? null,
          decidedAt: new Date(),
        })
        .where(eq(approvals.id, id))
        .returning();
      await this.outbox.record(tx, {
        type: decision === 'approved' ? EventTypes.ApprovalApproved : EventTypes.ApprovalDenied,
        aggregateType: 'approval',
        aggregateId: id,
        payload: { agentRunId: approval.agentRunId, workItemId: approval.workItemId },
      });
      return row;
    });
  }

  /** Atomically consumes an approved decision for a run+tool; true if granted. */
  async consumeIfApproved(agentRunId: string, toolName: string): Promise<boolean> {
    const [row] = await this.db
      .update(approvals)
      .set({ consumed: true })
      .where(
        and(
          eq(approvals.agentRunId, agentRunId),
          eq(approvals.toolName, toolName),
          eq(approvals.status, 'approved'),
          eq(approvals.consumed, false),
        ),
      )
      .returning();
    return Boolean(row);
  }

  async latestForRun(agentRunId: string): Promise<Approval | undefined> {
    const [row] = await this.db
      .select()
      .from(approvals)
      .where(eq(approvals.agentRunId, agentRunId))
      .orderBy(desc(approvals.createdAt))
      .limit(1);
    return row;
  }

  async findByRun(agentRunId: string): Promise<Approval[]> {
    return this.db.select().from(approvals).where(eq(approvals.agentRunId, agentRunId));
  }

  async findOne(id: string): Promise<Approval> {
    const [row] = await this.db.select().from(approvals).where(eq(approvals.id, id));
    if (!row) {
      throw new NotFoundException(`Approval ${id} not found`);
    }
    return row;
  }
}

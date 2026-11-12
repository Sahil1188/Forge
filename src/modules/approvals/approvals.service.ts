import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, desc, eq, sql } from 'drizzle-orm';
import { DRIZZLE, Database } from '../../infrastructure/database/drizzle.provider';
import { OutboxService } from '../../infrastructure/events/outbox.service';
import { EventTypes } from '../../infrastructure/events/event-types';
import { approvals, Approval, ApprovalStatus } from './approvals.schema';

/** SQL predicate: the stored request equals this exact tool call (jsonb equality, key-order independent). */
function sameAction(toolName: string, input: unknown) {
  return sql`${approvals.requestedAction} = ${JSON.stringify({ toolName, input })}::jsonb`;
}

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

  /**
   * Creates a pending approval unless one already exists for this exact call
   * (run + tool + input). An approval authorises one specific action — approving
   * "Deploy staging" must not also green-light "Deploy prod".
   */
  async requestIfAbsent(input: RequestApprovalInput): Promise<Approval> {
    const [existing] = await this.db
      .select()
      .from(approvals)
      .where(
        and(
          eq(approvals.agentRunId, input.agentRunId),
          eq(approvals.toolName, input.toolName),
          eq(approvals.status, 'pending'),
          sameAction(input.toolName, input.input),
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
        payload: {
          agentRunId: input.agentRunId,
          workItemId: input.workItemId,
          toolName: input.toolName,
        },
      });
      return row;
    });
  }

  /**
   * Records a human decision. Only a pending approval can be decided: repeating the
   * same decision is a harmless no-op, but a contradictory one (approved → denied)
   * is a conflict — otherwise a decision that already released a run could be flipped.
   */
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
        .where(and(eq(approvals.id, id), eq(approvals.status, 'pending')))
        .returning();
      if (!row) {
        const current = await this.findOne(id);
        if (current.status === decision) return current;
        throw new ConflictException(`Approval ${id} was already ${current.status}`);
      }
      await this.outbox.record(tx, {
        type: decision === 'approved' ? EventTypes.ApprovalApproved : EventTypes.ApprovalDenied,
        aggregateType: 'approval',
        aggregateId: id,
        payload: { agentRunId: approval.agentRunId, workItemId: approval.workItemId },
      });
      return row;
    });
  }

  /** Atomically consumes an approved decision for this exact run+tool+input; true if granted. */
  async consumeIfApproved(agentRunId: string, toolName: string, input: unknown): Promise<boolean> {
    const [row] = await this.db
      .update(approvals)
      .set({ consumed: true })
      .where(
        and(
          eq(approvals.agentRunId, agentRunId),
          eq(approvals.toolName, toolName),
          eq(approvals.status, 'approved'),
          eq(approvals.consumed, false),
          sameAction(toolName, input),
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

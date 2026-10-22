export type WorkItemStatus =
  | 'created'
  | 'assigned'
  | 'in_progress'
  | 'needs_approval'
  | 'evaluating'
  | 'rework'
  | 'done'
  | 'failed'
  | 'cancelled';

/** Allowed forward transitions of the work-item lifecycle (spec §11). */
const TRANSITIONS: Record<WorkItemStatus, WorkItemStatus[]> = {
  created: ['assigned', 'cancelled', 'failed'],
  assigned: ['in_progress', 'created', 'cancelled', 'failed'],
  // in_progress → assigned: a run stopped by a usage limit goes back in the queue.
  in_progress: ['needs_approval', 'evaluating', 'failed', 'cancelled', 'assigned'],
  needs_approval: ['in_progress', 'failed', 'cancelled'],
  evaluating: ['done', 'rework', 'failed'],
  rework: ['assigned', 'in_progress', 'cancelled', 'failed'],
  done: [],
  failed: ['assigned'],
  cancelled: [],
};

export function canTransition(from: WorkItemStatus, to: WorkItemStatus): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}

export class InvalidTransitionError extends Error {
  constructor(
    public readonly from: WorkItemStatus,
    public readonly to: WorkItemStatus,
  ) {
    super(`Invalid work-item transition: ${from} -> ${to}`);
    this.name = 'InvalidTransitionError';
  }
}

export function assertTransition(from: WorkItemStatus, to: WorkItemStatus): void {
  if (!canTransition(from, to)) {
    throw new InvalidTransitionError(from, to);
  }
}

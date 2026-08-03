/** Canonical domain event type names (see spec §22). */
export const EventTypes = {
  GoalCreated: 'goal.created',
  GoalStarted: 'goal.started',
  ProjectCreated: 'project.created',
  WorkCreated: 'work.created',
  WorkAssigned: 'work.assigned',
  WorkStatusChanged: 'work.status_changed',
  ApprovalRequested: 'approval.requested',
  ApprovalApproved: 'approval.approved',
  ApprovalDenied: 'approval.denied',
  BudgetExceeded: 'budget.exceeded',
} as const;

export type EventType = (typeof EventTypes)[keyof typeof EventTypes];

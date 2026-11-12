import { describe, it, expect } from 'vitest';
import { summarizeGoal, GoalItemOutcome } from './summary';

const item = (over: Partial<GoalItemOutcome>): GoalItemOutcome => ({
  workItemId: 'wi',
  execution: 'completed',
  evaluation: 'passed',
  finalStatus: 'done',
  ...over,
});

describe('summarizeGoal', () => {
  it('all items done → success, exit code 0', () => {
    const s = summarizeGoal([item({}), item({})]);
    expect(s.ok).toBe(true);
    expect(s.exitCode).toBe(0);
    expect(s.lines[0]).toMatch(/2 of 2 work item\(s\) passed/);
  });

  it('any failed execution → failure, exit code 2, and it is named', () => {
    const s = summarizeGoal([
      item({}),
      item({
        workItemId: 'bad',
        execution: 'failed',
        evaluation: undefined,
        finalStatus: 'failed',
      }),
    ]);
    expect(s.ok).toBe(false);
    expect(s.exitCode).toBe(2);
    expect(s.lines.join('\n')).toMatch(/1 of 2/);
    expect(s.lines.join('\n')).toContain('bad');
  });

  it('a failed evaluation (sent to rework) is not a pass', () => {
    const s = summarizeGoal([item({ evaluation: 'failed', finalStatus: 'rework' })]);
    expect(s.ok).toBe(false);
    expect(s.lines.join('\n')).toMatch(/rework/);
  });

  it('an item left unrun (never executed) counts as not done', () => {
    const s = summarizeGoal([
      item({}),
      item({
        workItemId: 'idle',
        execution: undefined,
        evaluation: undefined,
        finalStatus: 'assigned',
      }),
    ]);
    expect(s.ok).toBe(false);
    expect(s.lines.join('\n')).toContain('idle');
  });

  it('a paused item is reported as awaiting approval, not as a failure', () => {
    const s = summarizeGoal([
      item({ execution: 'paused', evaluation: undefined, finalStatus: 'needs_approval' }),
    ]);
    expect(s.ok).toBe(false);
    expect(s.exitCode).toBe(3);
    expect(s.lines.join('\n')).toMatch(/approval/i);
  });

  it('an inconclusive evaluation (nothing to verify) is done but flagged as unverified', () => {
    const s = summarizeGoal([item({ evaluation: 'inconclusive', finalStatus: 'done' })]);
    expect(s.ok).toBe(true);
    expect(s.lines.join('\n')).toMatch(/unverified|not verified|nothing to verify/i);
  });

  it('no items at all is not a success', () => {
    const s = summarizeGoal([]);
    expect(s.ok).toBe(false);
    expect(s.exitCode).toBe(2);
  });
});

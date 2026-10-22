import { describe, it, expect } from 'vitest';
import {
  assertTransition,
  canTransition,
  InvalidTransitionError,
  WorkItemStatus,
} from './work-status';

const ALL: WorkItemStatus[] = [
  'created',
  'assigned',
  'in_progress',
  'needs_approval',
  'evaluating',
  'rework',
  'done',
  'failed',
  'cancelled',
];

// Independent oracle for the lifecycle in spec §11 — every legal edge, nothing else.
const LEGAL: Array<[WorkItemStatus, WorkItemStatus]> = [
  ['created', 'assigned'],
  ['created', 'cancelled'],
  ['created', 'failed'],
  ['assigned', 'in_progress'],
  ['assigned', 'created'],
  ['assigned', 'cancelled'],
  ['assigned', 'failed'],
  ['in_progress', 'needs_approval'],
  ['in_progress', 'evaluating'],
  ['in_progress', 'failed'],
  ['in_progress', 'cancelled'],
  ['in_progress', 'assigned'], // requeued after a usage limit
  ['needs_approval', 'in_progress'],
  ['needs_approval', 'failed'],
  ['needs_approval', 'cancelled'],
  ['evaluating', 'done'],
  ['evaluating', 'rework'],
  ['evaluating', 'failed'],
  ['rework', 'assigned'],
  ['rework', 'in_progress'],
  ['rework', 'cancelled'],
  ['rework', 'failed'],
  ['failed', 'assigned'],
];

describe('work-item status machine — exhaustive matrix', () => {
  const legal = new Set(LEGAL.map(([a, b]) => `${a}->${b}`));

  for (const from of ALL) {
    for (const to of ALL) {
      const expected = legal.has(`${from}->${to}`);
      it(`${from} -> ${to} is ${expected ? 'allowed' : 'rejected'}`, () => {
        expect(canTransition(from, to)).toBe(expected);
        if (expected) {
          expect(() => assertTransition(from, to)).not.toThrow();
        } else {
          expect(() => assertTransition(from, to)).toThrow(InvalidTransitionError);
        }
      });
    }
  }

  it('done and cancelled are terminal (no way out)', () => {
    for (const to of ALL) {
      expect(canTransition('done', to)).toBe(false);
      expect(canTransition('cancelled', to)).toBe(false);
    }
  });

  it('no self-transitions are ever allowed', () => {
    for (const s of ALL) expect(canTransition(s, s)).toBe(false);
  });

  it('done is only reachable through evaluation (work cannot skip the objective gate)', () => {
    const into = ALL.filter((from) => canTransition(from, 'done'));
    expect(into).toEqual(['evaluating']);
  });

  it('every non-terminal state can still reach done (no dead-end traps)', () => {
    for (const start of ALL.filter((s) => s !== 'done' && s !== 'cancelled')) {
      const seen = new Set<WorkItemStatus>([start]);
      const queue: WorkItemStatus[] = [start];
      while (queue.length) {
        const cur = queue.shift()!;
        for (const next of ALL) {
          if (canTransition(cur, next) && !seen.has(next)) {
            seen.add(next);
            queue.push(next);
          }
        }
      }
      expect(seen.has('done'), `${start} cannot reach done`).toBe(true);
    }
  });

  it('InvalidTransitionError carries the offending edge', () => {
    try {
      assertTransition('done', 'created');
      expect.unreachable();
    } catch (e) {
      const err = e as InvalidTransitionError;
      expect(err.from).toBe('done');
      expect(err.to).toBe('created');
      expect(err.message).toContain('done -> created');
    }
  });

  it('an unknown status never transitions (fail closed)', () => {
    expect(canTransition('bogus' as WorkItemStatus, 'done')).toBe(false);
  });
});

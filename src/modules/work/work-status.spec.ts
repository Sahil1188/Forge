import { describe, it, expect } from 'vitest';
import {
  assertTransition,
  canTransition,
  InvalidTransitionError,
  WorkItemStatus,
} from './work-status';

describe('work-item status machine', () => {
  it('allows the happy-path lifecycle', () => {
    const path: [WorkItemStatus, WorkItemStatus][] = [
      ['created', 'assigned'],
      ['assigned', 'in_progress'],
      ['in_progress', 'evaluating'],
      ['evaluating', 'done'],
    ];
    for (const [from, to] of path) {
      expect(canTransition(from, to)).toBe(true);
    }
  });

  it('supports the rework loop and approval pause', () => {
    expect(canTransition('evaluating', 'rework')).toBe(true);
    expect(canTransition('rework', 'in_progress')).toBe(true);
    expect(canTransition('in_progress', 'needs_approval')).toBe(true);
    expect(canTransition('needs_approval', 'in_progress')).toBe(true);
  });

  it('rejects illegal transitions', () => {
    expect(canTransition('done', 'in_progress')).toBe(false);
    expect(canTransition('created', 'done')).toBe(false);
    expect(canTransition('cancelled', 'assigned')).toBe(false);
  });

  it('assertTransition throws InvalidTransitionError on illegal moves', () => {
    expect(() => assertTransition('done', 'assigned')).toThrow(InvalidTransitionError);
    expect(() => assertTransition('created', 'assigned')).not.toThrow();
  });
});

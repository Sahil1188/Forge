import { describe, it, expect } from 'vitest';
import { evaluateBudget } from './budget-evaluation';

describe('evaluateBudget', () => {
  it('returns ok below the soft limit', () => {
    expect(evaluateBudget(5, 10, 20)).toBe('ok');
  });

  it('blocks (soft_exceeded) at or above the soft limit', () => {
    expect(evaluateBudget(10, 10, 20)).toBe('soft_exceeded');
    expect(evaluateBudget(15, 10, 20)).toBe('soft_exceeded');
  });

  it('kills (hard_exceeded) at or above the hard limit', () => {
    expect(evaluateBudget(20, 10, 20)).toBe('hard_exceeded');
    expect(evaluateBudget(25, 10, 20)).toBe('hard_exceeded');
  });

  it('treats missing limits as unlimited', () => {
    expect(evaluateBudget(1000)).toBe('ok');
    expect(evaluateBudget(1000, null, null)).toBe('ok');
    expect(evaluateBudget(1000, undefined, 2000)).toBe('ok');
  });
});

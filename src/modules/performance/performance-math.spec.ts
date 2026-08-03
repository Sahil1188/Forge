import { describe, it, expect } from 'vitest';
import { computeReputation } from './reputation-math';
import { computeSkillDelta, complexityOf } from './skill-math';

describe('computeReputation', () => {
  it('returns null with no history', () => {
    expect(computeReputation([])).toBeNull();
  });

  it('weights recent scores more heavily than old ones', () => {
    // oldest=0, newest=100. Plain mean would be 50; recency pulls it up.
    const rep = computeReputation([0, 100], 0.5);
    expect(rep).toBeCloseTo(66.67, 1);
    expect(rep!).toBeGreaterThan(50);
  });

  it('returns the value for a steady history', () => {
    expect(computeReputation([90, 90, 90])).toBe(90);
  });
});

describe('computeSkillDelta', () => {
  it('barely moves for trivial (low-complexity) work', () => {
    expect(Math.abs(computeSkillDelta(70, 100, 0.05))).toBeLessThan(0.5);
  });

  it('grows meaningfully for hard, high-quality work', () => {
    const hard = computeSkillDelta(70, 95, 1.0);
    const trivial = computeSkillDelta(70, 95, 0.05);
    expect(hard).toBeGreaterThan(1);
    expect(hard).toBeGreaterThan(trivial);
  });

  it('decrements on failure', () => {
    expect(computeSkillDelta(70, 20, 0.5)).toBeLessThan(0);
  });

  it('has diminishing returns near the cap', () => {
    const lowLevel = computeSkillDelta(50, 100, 1.0);
    const highLevel = computeSkillDelta(95, 100, 1.0);
    expect(highLevel).toBeLessThan(lowLevel);
  });
});

describe('complexityOf', () => {
  it('ranks architecture above generic work', () => {
    expect(complexityOf('architecture')).toBeGreaterThan(complexityOf('generic'));
  });

  it('nudges up with priority and stays within [0,1]', () => {
    expect(complexityOf('coding', 100)).toBeGreaterThan(complexityOf('coding', 0));
    expect(complexityOf('architecture', 100)).toBeLessThanOrEqual(1);
  });
});

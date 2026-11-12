import { describe, it, expect } from 'vitest';
import { computeReputation, mean, DEFAULT_DECAY } from './reputation-math';
import { complexityOf, computeSkillDelta } from './skill-math';

describe('computeReputation — edge cases', () => {
  it('no samples → null (never a fabricated number)', () => {
    expect(computeReputation([])).toBeNull();
    expect(mean([])).toBeNull();
  });

  it('a single sample is its own reputation', () => {
    expect(computeReputation([73])).toBe(73);
  });

  it('identical scores yield that score regardless of decay', () => {
    expect(computeReputation([80, 80, 80, 80])).toBe(80);
    expect(computeReputation([80, 80, 80], 0.1)).toBe(80);
  });

  it('recent results weigh more: improving beats declining over the same scores', () => {
    const improving = computeReputation([0, 50, 100])!;
    const declining = computeReputation([100, 50, 0])!;
    expect(improving).toBeGreaterThan(declining);
    expect(improving).toBeGreaterThan(50);
    expect(declining).toBeLessThan(50);
  });

  it('decay = 1 is a plain mean; decay = 0 is only the latest result', () => {
    expect(computeReputation([0, 50, 100], 1)).toBe(50);
    expect(computeReputation([0, 50, 100], 0)).toBe(100);
  });

  it('always stays within the min/max of the inputs', () => {
    for (const scores of [
      [10, 90],
      [0, 100, 0, 100],
      [55, 56, 57],
      [100, 0],
    ]) {
      const r = computeReputation(scores)!;
      expect(r).toBeGreaterThanOrEqual(Math.min(...scores));
      expect(r).toBeLessThanOrEqual(Math.max(...scores));
    }
  });

  it('matches a hand-computed value for the default decay', () => {
    // weights: 0.7^1, 0.7^0 → (0.7*40 + 1*100) / 1.7
    expect(DEFAULT_DECAY).toBe(0.7);
    expect(computeReputation([40, 100])).toBeCloseTo(75.29, 2);
  });

  it('mean rounds to two decimals', () => {
    expect(mean([1, 2, 2])).toBe(1.67);
  });
});

describe('computeSkillDelta — edge cases', () => {
  it('neutral work (score 60) does not move the needle', () => {
    expect(computeSkillDelta(50, 60, 1)).toBe(0);
  });

  it('a perfect score at max complexity gains the maximum, scaled by headroom', () => {
    expect(computeSkillDelta(0, 100, 1)).toBe(8);
    expect(computeSkillDelta(50, 100, 1)).toBe(4);
  });

  it('no gain is possible at level 100 (no headroom) but failures still cost', () => {
    expect(computeSkillDelta(100, 100, 1)).toBe(0);
    expect(computeSkillDelta(100, 0, 1)).toBeLessThan(0);
  });

  it('trivial (zero-complexity) work earns nothing even when perfect', () => {
    expect(computeSkillDelta(20, 100, 0)).toBe(0);
  });

  it('complexity is clamped to 0..1', () => {
    expect(computeSkillDelta(0, 100, 5)).toBe(computeSkillDelta(0, 100, 1));
    expect(computeSkillDelta(0, 100, -3)).toBe(0);
  });

  it('failures decrement the same regardless of complexity or current level', () => {
    expect(computeSkillDelta(10, 0, 0)).toBe(computeSkillDelta(90, 0, 1));
    expect(computeSkillDelta(10, 0, 0)).toBe(-6);
  });

  it('a worse score never yields a larger delta (monotonic)', () => {
    let prev = -Infinity;
    for (let score = 0; score <= 100; score += 10) {
      const d = computeSkillDelta(40, score, 0.6);
      expect(d).toBeGreaterThanOrEqual(prev);
      prev = d;
    }
  });

  it('rounds to one decimal', () => {
    const d = computeSkillDelta(33, 77, 0.55);
    expect(Math.round(d * 10) / 10).toBe(d);
  });
});

describe('complexityOf — edge cases', () => {
  it('ranks architecture above coding above generic', () => {
    expect(complexityOf('architecture')).toBeGreaterThan(complexityOf('coding'));
    expect(complexityOf('coding')).toBeGreaterThan(complexityOf('generic'));
  });

  it('priority nudges complexity up by at most 0.2 and is clamped', () => {
    expect(complexityOf('coding', 100)).toBeCloseTo(0.8, 10);
    expect(complexityOf('coding', 9999)).toBeCloseTo(0.8, 10);
    expect(complexityOf('coding', -50)).toBe(complexityOf('coding', 0));
  });

  it('never exceeds 1', () => {
    expect(complexityOf('architecture', 100)).toBeLessThanOrEqual(1);
  });

  it('an unknown task type gets a mid-range default', () => {
    expect(complexityOf('mystery')).toBe(0.5);
  });
});

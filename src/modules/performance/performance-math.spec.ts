import { describe, it, expect } from 'vitest';
import { computeReputation } from './reputation-math';
import { computeSkillDelta, complexityOf, learningScore } from './skill-math';
import { skillFitsTask } from '../work/domains';

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

describe('learningScore', () => {
  it('counts a failed step below neutral even when most of its checks passed', () => {
    expect(learningScore(67, false, 0)).toBe(40); // 1 of 3 checks failed
    expect(computeSkillDelta(50, learningScore(67, false, 0), 0.8)).toBeLessThan(0);
    expect(learningScore(0, false, 2)).toBe(0); // a worse failure stays worse
  });

  it('discounts a pass for each failed attempt before it, never below neutral', () => {
    expect(learningScore(100, true, 0)).toBe(100);
    expect(learningScore(100, true, 1)).toBe(90);
    expect(learningScore(100, true, 4)).toBe(60);
    expect(learningScore(100, true, 9)).toBe(60);
    expect(computeSkillDelta(50, learningScore(100, true, 4), 0.8)).toBe(0);
  });
});

describe('skillFitsTask', () => {
  it("matches only the skills the task's domain exercises", () => {
    expect(skillFitsTask('coding', 'SQL')).toBe(true);
    expect(skillFitsTask('coding', 'typescript')).toBe(true);
    expect(skillFitsTask('coding', 'negotiation')).toBe(false);
    expect(skillFitsTask('generic', 'typescript')).toBe(false);
  });
});

import { describe, it, expect } from 'vitest';
import {
  attachGoalAcceptance,
  capPlan,
  PlannedItem,
  resolveDependencies,
  sanitizeChecks,
  sanitizeItem,
} from './plan-shaping';

const items = (...titles: string[]): PlannedItem[] => titles.map((title) => ({ title }));

describe('sanitizeItem / sanitizeChecks', () => {
  it('keeps valid acceptance checks, trimmed', () => {
    expect(
      sanitizeItem({ title: 't', acceptance: ['  node -e "1"  ', 'test'] })[0].acceptance,
    ).toEqual(['node -e "1"', 'test']);
  });

  it('drops non-strings, blanks and over-long checks; caps the count', () => {
    expect(sanitizeChecks([1, null, '', '   ', 'x'.repeat(501), 'ok'])).toEqual(['ok']);
    expect(sanitizeChecks(Array.from({ length: 15 }, (_, i) => `c${i}`))).toHaveLength(10);
    expect(sanitizeChecks('nope')).toBeUndefined();
    expect(sanitizeChecks([])).toBeUndefined();
  });
});

describe('capPlan', () => {
  it('leaves a plan within the cap untouched', () => {
    const p = items('a', 'b', 'c');
    expect(capPlan(p, 3)).toBe(p);
  });

  it('folds items beyond the cap into the last kept one (nothing is dropped)', () => {
    const p: PlannedItem[] = [
      { title: 'Init' },
      { title: 'Build', description: 'core' },
      { title: 'Tests', description: 'write tests', acceptance: ['node -e "require(\'./a\')"'] },
      { title: 'Verify', acceptance: ['npm test'] },
    ];
    const capped = capPlan(p, 2);
    expect(capped).toHaveLength(2);
    expect(capped[0].title).toBe('Init');
    expect(capped[1].title).toBe('Build');
    expect(capped[1].description).toBe('Build: core\nTests: write tests\nVerify');
    expect(capped[1].acceptance).toEqual(['node -e "require(\'./a\')"', 'npm test']);
  });

  it('a cap of 1 turns any plan into a single item', () => {
    const capped = capPlan(items('a', 'b', 'c'), 1);
    expect(capped).toHaveLength(1);
    expect(capped[0].description).toBe('a\nb\nc');
  });

  it('a nonsensical cap behaves like 1', () => {
    expect(capPlan(items('a', 'b'), 0)).toHaveLength(1);
    expect(capPlan(items('a', 'b'), -5)).toHaveLength(1);
  });

  it('keeps explicit dependencies of folded items that point at kept items', () => {
    const p: PlannedItem[] = [
      { title: 'a' },
      { title: 'b', dependsOn: [] },
      { title: 'c', dependsOn: [0, 1] },
    ];
    const capped = capPlan(p, 2);
    expect(capped[1].dependsOn).toEqual([0]); // index 1 was folded into itself, so only 0 remains
  });

  it('folded items with no explicit deps keep the default chain', () => {
    expect(capPlan(items('a', 'b', 'c'), 2)[1].dependsOn).toBeUndefined();
  });
});

describe('resolveDependencies', () => {
  it('chains in plan order by default', () => {
    expect(resolveDependencies(items('a', 'b', 'c'))).toEqual([[], [0], [1]]);
  });

  it('honours explicit earlier-only deps, ignoring self/forward/negative', () => {
    expect(
      resolveDependencies([
        { title: 'a', dependsOn: [0, 1] },
        { title: 'b', dependsOn: [] },
        { title: 'c', dependsOn: [0, 2, 9, -1, 0] },
      ]),
    ).toEqual([[], [], [0]]);
  });
});

describe('attachGoalAcceptance', () => {
  it('puts goal checks on the final item, merged with its own', () => {
    const p: PlannedItem[] = [{ title: 'a' }, { title: 'b', acceptance: ['own'] }];
    const { items: out } = attachGoalAcceptance(p, resolveDependencies(p), ['goal', 'own']);
    expect(out[0].acceptance).toBeUndefined();
    expect(out[1].acceptance).toEqual(['own', 'goal']);
  });

  it('makes the final item wait for every other loose end, so it checks the integrated result', () => {
    const p: PlannedItem[] = [
      { title: 'a' },
      { title: 'b', dependsOn: [] },
      { title: 'c', dependsOn: [] },
    ];
    const { deps } = attachGoalAcceptance(p, resolveDependencies(p), ['check']);
    expect(deps[2].sort()).toEqual([0, 1]);
  });

  it('is a no-op without goal checks', () => {
    const p = items('a', 'b');
    const deps = resolveDependencies(p);
    expect(attachGoalAcceptance(p, deps, [])).toEqual({ items: p, deps });
  });
});

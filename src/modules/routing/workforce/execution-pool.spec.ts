import { describe, it, expect } from 'vitest';
import { executionPool, isExecutive } from './candidate-scoring';

describe('execution pool', () => {
  it('recognises executive titles', () => {
    for (const r of ['CEO', 'ceo', 'Chief Technology Officer', 'Co-founder & CEO']) expect(isExecutive(r), r).toBe(true);
    for (const r of ['Engineer', 'Product Manager', 'Mischief Maker', 'Procedure Writer']) expect(isExecutive(r), r).toBe(false);
  });

  it('excludes executives when anyone else can do the work', () => {
    const pool = executionPool([{ role: 'CEO' }, { role: 'Engineer' }, { role: 'Chief Architect' }, { role: 'QA' }]);
    expect(pool.map((c) => c.role)).toEqual(['Engineer', 'QA']);
  });

  it('falls back to executives when they are the only ones', () => {
    expect(executionPool([{ role: 'CEO' }]).map((c) => c.role)).toEqual(['CEO']);
  });

  it('an empty roster stays empty', () => {
    expect(executionPool([])).toEqual([]);
  });
});

import { describe, expect, it } from 'vitest';
import { countAttempts } from './attempts';

describe('countAttempts', () => {
  it('ignores usage-limit pauses and restarts', () => {
    expect(countAttempts([{ status: 'rate_limited' }, { status: 'rate_limited' }, { status: 'completed' }])).toEqual({ attempts: 1, continuations: 0 });
  });

  it('treats a limit stop that changed files as a continuation, not an attempt', () => {
    const runs = [
      { status: 'completed', filesChangedCount: 14 },
      { status: 'killed_timeout', filesChangedCount: 9 },
      { status: 'killed_turns', filesChangedCount: 2 },
    ];
    expect(countAttempts(runs)).toEqual({ attempts: 1, continuations: 2 });
  });

  it('counts a limit stop that changed nothing, and any real failure', () => {
    expect(countAttempts([{ status: 'killed_timeout', filesChangedCount: 0 }, { status: 'failed', filesChangedCount: 5 }])).toEqual({ attempts: 2, continuations: 0 });
  });

  it('caps continuations so a step that never converges still ends', () => {
    const runs = Array.from({ length: 5 }, () => ({ status: 'killed_timeout', filesChangedCount: 3 }));
    expect(countAttempts(runs, 3)).toEqual({ attempts: 2, continuations: 3 });
  });
});

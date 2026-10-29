import { describe, expect, it } from 'vitest';
import { ranOutOfTurns } from './execution.worker';

describe('ranOutOfTurns', () => {
  it('recognises both ways Claude Code reports a used-up turn allowance', () => {
    expect(ranOutOfTurns('error_max_turns')).toBe(true);
    expect(ranOutOfTurns('Claude Code returned an error result: Reached maximum number of turns (100)')).toBe(true);
  });

  it('does not mistake real failures for it', () => {
    expect(ranOutOfTurns('error_during_execution')).toBe(false);
    expect(ranOutOfTurns(undefined)).toBe(false);
  });
});

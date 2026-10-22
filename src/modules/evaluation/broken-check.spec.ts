import { describe, it, expect } from 'vitest';
import { brokenCheck } from './evaluation-engine';

describe('broken acceptance checks are told apart from failing work', () => {
  it('a check whose own script does not parse, or whose program is missing, is broken', () => {
    expect(brokenCheck('[eval]:1\nconst s=1;if(!/food[^\n                ^\n\nSyntaxError: Invalid regular expression: missing /')).toBe(true);
    expect(brokenCheck("'pytest' is not recognized as an internal or external command,")).toBe(true);
    expect(brokenCheck('sh: 1: jq: command not found')).toBe(true);
  });

  it('the work failing the check is not "broken"', () => {
    expect(brokenCheck("Error: Cannot find module './cli.js'")).toBe(false);
    expect(brokenCheck('expected 20, got 19.5')).toBe(false);
    expect(brokenCheck('/work/cli.js:3\n  foo(\nSyntaxError: Unexpected end of input')).toBe(false); // the work's own syntax error
  });
});

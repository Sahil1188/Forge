import { describe, it, expect } from 'vitest';
import { redactSecrets } from './redaction';

describe('redactSecrets', () => {
  it('masks GitHub and OpenAI-style tokens', () => {
    const secret = 'ghp_0123456789abcdef0123456789abcdef0123';
    const out = redactSecrets(`Deployed with token ${secret}`);
    expect(out).not.toContain(secret);
    expect(out).toContain('***REDACTED***');
  });

  it('masks bearer tokens and keyed secrets', () => {
    const out = redactSecrets('Authorization: Bearer abcdef012345XYZ; api_key=supersecretvalue');
    expect(out).not.toContain('abcdef012345XYZ');
    expect(out).not.toContain('supersecretvalue');
  });

  it('leaves ordinary text untouched', () => {
    expect(redactSecrets('just a normal log line')).toBe('just a normal log line');
  });
});

import { describe, it, expect } from 'vitest';
import { redactSecrets } from './redaction';

const R = '***REDACTED***';

describe('redactSecrets — coverage', () => {
  const secrets: Array<[string, string]> = [
    ['anthropic api key', 'sk-ant-api03-AbCdEfGhIjKlMnOpQrStUvWxYz0123456789'],
    ['anthropic oauth token', 'sk-ant-oat01-AbCdEfGhIjKlMnOpQrStUvWxYz0123456789'],
    ['openai key', 'sk-proj-abcdefghijklmnopqrstuvwxyz0123456789'],
    ['github pat (classic)', 'ghp_abcdefghijklmnopqrstuvwxyz0123456789'],
    ['github oauth token', 'gho_abcdefghijklmnopqrstuvwxyz0123456789'],
    ['github fine-grained pat', 'github_pat_11ABCDEFG0abcdefghijklmnopqrstuv'],
    ['slack bot token', 'xoxb-1234567890-abcdefghij'],
    ['aws access key id', 'AKIAIOSFODNN7EXAMPLE'],
  ];
  for (const [name, secret] of secrets) {
    it(`masks a ${name} anywhere in a line`, () => {
      const out = redactSecrets(`before ${secret} after`);
      expect(out).not.toContain(secret);
      expect(out).toContain(R);
      expect(out.startsWith('before ')).toBe(true);
      expect(out.endsWith(' after')).toBe(true);
    });
  }

  it('masks bearer tokens (case-insensitive scheme)', () => {
    expect(redactSecrets('Authorization: Bearer abcdef0123456789xyz')).not.toContain('abcdef0123456789xyz');
    expect(redactSecrets('authorization: bearer abcdef0123456789xyz')).not.toContain('abcdef0123456789xyz');
  });

  it('masks a multi-line private key block entirely', () => {
    const key = '-----BEGIN RSA PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASC\nabc123\n-----END RSA PRIVATE KEY-----';
    const out = redactSecrets(`key:\n${key}\ntrailer`);
    expect(out).not.toContain('MIIEvQIBADANBg');
    expect(out).not.toContain('BEGIN RSA');
    expect(out).toContain('trailer');
  });

  it('masks keyed assignments in env, JSON and YAML styles but keeps the key name', () => {
    expect(redactSecrets('DB_PASSWORD=hunter2hunter2')).toBe(`DB_PASSWORD=${R}`);
    expect(redactSecrets('{"apiKey":"abcdefgh12345"}')).not.toContain('abcdefgh12345');
    expect(redactSecrets('{"api_key": "abcdefgh12345"}')).toContain('api_key');
    expect(redactSecrets('secret: s3cr3t-value')).toBe(`secret: ${R}`);
    expect(redactSecrets("token = 'abcdef123456'")).not.toContain('abcdef123456');
  });

  it('masks several secrets on one line', () => {
    const out = redactSecrets('a=ghp_abcdefghijklmnopqrstuvwxyz0123456789 b=AKIAIOSFODNN7EXAMPLE');
    expect(out).not.toContain('ghp_');
    expect(out).not.toContain('AKIA');
  });

  it('is idempotent', () => {
    const once = redactSecrets('password=hunter2hunter2 ghp_abcdefghijklmnopqrstuvwxyz0123456789');
    expect(redactSecrets(once)).toBe(once);
  });

  it('handles the empty string', () => {
    expect(redactSecrets('')).toBe('');
  });
});

describe('redactSecrets — must not mangle ordinary text', () => {
  const benign = [
    'The build passed in 12.3s',
    'max_tokens: 4096',
    'tokenizer loaded; 1,024 tokens processed',
    'we discussed the password policy in the meeting',
    'sk-short',
    'const apiKeyHeader = "X-Api-Key";',
    'import { secretsManager } from "./secrets";',
    'git commit -m "fix: ghp parsing"',
  ];
  for (const text of benign) {
    it(`leaves "${text}" untouched`, () => {
      expect(redactSecrets(text)).toBe(text);
    });
  }

  it('very short values are deliberately not masked (below the 6-char floor)', () => {
    expect(redactSecrets('password=abc')).toBe('password=abc');
  });
});

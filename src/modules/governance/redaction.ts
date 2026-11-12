const REDACTED = '***REDACTED***';

/**
 * Secret-shaped patterns masked before any transcript/log is persisted
 * (spec §19/§24). Pattern-based so it works without knowing specific values.
 */
const PATTERNS: RegExp[] = [
  /sk-[A-Za-z0-9_-]{16,}/g, // OpenAI-style / Anthropic-style keys
  /ghp_[A-Za-z0-9]{20,}/g, // GitHub personal access tokens
  /gho_[A-Za-z0-9]{20,}/g,
  /github_pat_[A-Za-z0-9_]{20,}/g,
  /xox[baprs]-[A-Za-z0-9-]{10,}/g, // Slack tokens
  /AKIA[0-9A-Z]{16}/g, // AWS access key id
  /Bearer\s+[A-Za-z0-9._-]{12,}/gi, // bearer tokens
  /-----BEGIN[ A-Z]*PRIVATE KEY-----[\s\S]*?-----END[ A-Z]*PRIVATE KEY-----/g,
];

/** key: value / key = value shaped assignments where the key implies a secret. */
const KEYED =
  /((?:api[_-]?key|secret|token|password|passwd|pwd)\s*["'`]?\s*[:=]\s*["'`]?)([^\s"'`,}]{6,})/gi;

export function redactSecrets(input: string): string {
  let out = input;
  for (const pattern of PATTERNS) {
    out = out.replace(pattern, REDACTED);
  }
  out = out.replace(KEYED, (_m, prefix: string) => `${prefix}${REDACTED}`);
  return out;
}

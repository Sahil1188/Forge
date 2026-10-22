/**
 * Environments for child processes that run agent-written or agent-chosen code.
 *
 * The server's own environment holds DATABASE_URL (with its password), API keys and tokens.
 * Agents and the commands they cause (tests, acceptance checks, shell tools) get an allowlist
 * instead: what a toolchain needs to run, nothing that grants access to Forge or other services.
 */

const BASE_KEYS = [
  // executables and the OS
  'PATH', 'Path', 'PATHEXT', 'SystemRoot', 'SYSTEMROOT', 'SystemDrive', 'windir', 'WINDIR', 'ComSpec', 'COMSPEC', 'OS',
  'PROCESSOR_ARCHITECTURE', 'NUMBER_OF_PROCESSORS', 'ProgramFiles', 'ProgramFiles(x86)', 'ProgramW6432', 'ProgramData',
  'CommonProgramFiles', 'CommonProgramFiles(x86)', 'SHELL',
  // user profile and temp dirs (git, npm and the Claude CLI look here)
  'HOME', 'USERPROFILE', 'HOMEDRIVE', 'HOMEPATH', 'APPDATA', 'LOCALAPPDATA', 'USER', 'USERNAME', 'LOGNAME',
  'TEMP', 'TMP', 'TMPDIR', 'XDG_CONFIG_HOME', 'XDG_CACHE_HOME', 'XDG_DATA_HOME',
  // locale and terminal
  'LANG', 'LANGUAGE', 'LC_ALL', 'LC_CTYPE', 'TERM', 'TZ',
];

/** Network egress settings, needed for the agent to reach its model in proxied networks. */
const PROXY_KEYS = ['HTTP_PROXY', 'HTTPS_PROXY', 'NO_PROXY', 'http_proxy', 'https_proxy', 'no_proxy', 'NODE_EXTRA_CA_CERTS'];

/** Subscription auth for the Claude Code CLI. Never ANTHROPIC_API_KEY (would switch billing). */
const CLAUDE_KEYS = ['CLAUDE_CODE_OAUTH_TOKEN', 'CLAUDE_CONFIG_DIR'];

function pick(env: NodeJS.ProcessEnv, keys: string[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const k of keys) {
    const v = env[k];
    if (typeof v === 'string') out[k] = v;
  }
  return out;
}

/** Extra names the operator explicitly allows through (FORGE_CHILD_ENV_PASSTHROUGH=FOO,BAR). */
function passthrough(env: NodeJS.ProcessEnv): string[] {
  return (env.FORGE_CHILD_ENV_PASSTHROUGH ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s && s !== 'ANTHROPIC_API_KEY' && s !== 'DATABASE_URL' && s !== 'FORGE_API_TOKEN');
}

/**
 * Agents work unattended: anything they start must not pop up on the operator's desktop.
 * Observed live: a script launched LibreOffice, which showed a "waiting for printer" window and
 * hung the run. svp = LibreOffice's windowless rendering backend.
 */
const HEADLESS = { SAL_USE_VCLPLUGIN: 'svp' };

/** For the Claude Code agent process: toolchain + proxy + subscription auth, no server secrets. */
export function agentEnv(env: NodeJS.ProcessEnv = process.env): Record<string, string> {
  return { ...pick(env, [...BASE_KEYS, ...PROXY_KEYS, ...CLAUDE_KEYS, ...passthrough(env)]), ...HEADLESS };
}

/** For tests, acceptance checks and worker shell commands: toolchain only, no credentials at all. */
export function commandEnv(env: NodeJS.ProcessEnv = process.env): Record<string, string> {
  return { ...pick(env, [...BASE_KEYS, ...PROXY_KEYS, ...passthrough(env)]), ...HEADLESS, CI: '1' };
}

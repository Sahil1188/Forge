/**
 * Stops agents from killing processes they did not start.
 *
 * Observed live: a QA agent looked for its own test server by searching command lines for "main.js",
 * found Forge itself (`node dist/main.js`) as well, and force-stopped both. Forge died mid-goal twice.
 * On native Windows nothing else prevents this, because Claude Code cannot sandbox shell commands.
 *
 * The rule: a command may stop a process only by a literal PID that is not Forge (or its launcher),
 * by a shell job (`kill %1`), or by `$!` (the last process that shell started). Killing by name, by a
 * pattern, through a pipeline or through a variable is refused, since that is how an agent reaches
 * processes it never started.
 */

const SHELL_TOOLS = new Set(['Bash', 'PowerShell']);

/** Kill commands that pick their targets by name or pattern. */
const BY_NAME =
  /\btaskkill\b[^\n;&|]*\/im\b|\bstop-process\b[^\n;&|]*-(name|processname)\b|\bpkill\b|\bkillall\b|\bkill-port\b|\bfuser\b[^\n;&|]*-k\b/i;

/** A pipeline that ends in Stop-Process (targets come from a query, e.g. Get-Process node | Stop-Process). */
const PIPED_STOP = /\|\s*(stop-process|kill|spps)\b/i;

/** `Stop-Process -Id 1,2`, `taskkill /PID 1 /PID 2`, `kill -9 1 2`, `spps -Id 1`. */
const BY_ID =
  /\b(?:stop-process|spps)\b([^\n;&|]*)|\btaskkill\b([^\n;&|]*)|(?:^|[;&|(]\s*|\bthen\s+|\bdo\s+)kill\b([^\n;&|)]*)/gi;

export interface ProcessGuardOptions {
  /** PIDs that must never be stopped: Forge itself and the process that launched it. */
  protectedPids: number[];
}

export function defaultProtectedPids(): number[] {
  return [process.pid, process.ppid].filter((p) => Number.isInteger(p) && p > 0);
}

/** Why a shell command may not run (it would stop processes the agent did not start), or null. */
export function processKillViolation(
  toolName: string,
  input: unknown,
  opts: ProcessGuardOptions = { protectedPids: defaultProtectedPids() },
): string | null {
  if (!SHELL_TOOLS.has(toolName)) return null;
  const command = String((input as { command?: unknown } | null)?.command ?? '');
  if (!command) return null;

  if (BY_NAME.test(command)) {
    return 'Stopping processes by name or pattern is not allowed: other employees and Forge itself run as the same programs. Stop only a process you started, by the PID it printed, `kill %1`, or `kill $!`.';
  }
  if (PIPED_STOP.test(command)) {
    return 'Stopping processes found by a query (a pipeline into Stop-Process or kill) is not allowed: it reaches processes you did not start. Stop your own process by its PID, `kill %1`, or `kill $!`.';
  }

  for (const match of command.matchAll(BY_ID)) {
    const args = (match[1] ?? match[2] ?? match[3] ?? '').trim();
    if (!args) continue;
    // Shell jobs and the last background process of this shell are always the agent's own.
    const targets = args
      .replace(
        /\s-(id|pid|force|f|t|9|kill|term|sigkill|sigterm|s\s+\w+|erroraction\s+\w+)\b/gi,
        ' ',
      )
      .replace(/\/(pid|f|t)\b/gi, ' ')
      .split(/[\s,]+/)
      .map((t) => t.trim())
      .filter(Boolean)
      .filter((t) => !/^-/.test(t) && !/^\/\w$/.test(t));
    for (const target of targets) {
      if (/^%\d+$/.test(target) || target === '$!' || target === '"$!"' || target === "'$!'")
        continue;
      if (!/^\d+$/.test(target)) {
        return `Stopping a process through "${target}" is not allowed: use the literal PID of a process you started, \`kill %1\`, or \`kill $!\`.`;
      }
      if (opts.protectedPids.includes(Number(target))) {
        return `Process ${target} is Forge itself and must never be stopped. Stop only processes you started.`;
      }
    }
  }
  return null;
}

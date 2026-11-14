import { existsSync } from 'node:fs';
import path from 'node:path';

/**
 * Which Claude Code program the SDK should start, or undefined to let the SDK use its own.
 *
 * The SDK ships its program in a per-platform optional package (for example
 * `@anthropic-ai/claude-agent-sdk-win32-x64`). npm silently skips optional packages when their
 * download fails, which leaves an installed Forge unable to run anything. Forge already requires
 * Claude Code, so when the bundled program is missing it falls back to the `claude` on PATH.
 * FORGE_CLAUDE_PATH overrides both.
 */
export function claudeExecutable(
  env: NodeJS.ProcessEnv = process.env,
  bundled: () => boolean = hasBundledProgram,
  exists: (file: string) => boolean = existsSync,
  platform: NodeJS.Platform = process.platform,
): string | undefined {
  if (env.FORGE_CLAUDE_PATH) return env.FORGE_CLAUDE_PATH;
  if (bundled()) return undefined;
  const names = platform === 'win32' ? ['claude.exe'] : ['claude'];
  const dirs = (env.PATH ?? env.Path ?? '').split(path.delimiter).filter(Boolean);
  const home = env.HOME ?? env.USERPROFILE;
  if (home) dirs.push(path.join(home, '.local', 'bin'), path.join(home, '.claude', 'local'));
  for (const dir of dirs) {
    for (const name of names) {
      const file = path.join(dir, name);
      if (exists(file)) return file;
    }
  }
  return undefined;
}

function hasBundledProgram(): boolean {
  const base = `@anthropic-ai/claude-agent-sdk-${process.platform}-${process.arch}`;
  return [base, `${base}-musl`].some((name) => {
    try {
      require.resolve(`${name}/package.json`);
      return true;
    } catch {
      return false;
    }
  });
}

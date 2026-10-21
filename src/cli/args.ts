/** Argument parsing for the `forge` CLI — pure, so it is unit-testable without booting Nest. */

/** Flags that take a value; the value must never leak into positional text. */
const VALUE_FLAGS = new Set(['--company', '--check']);

/** The value following `name`, or undefined when the flag is absent or has no value. */
export function flag(args: string[], name: string): string | undefined {
  const i = args.indexOf(name);
  if (i < 0) return undefined;
  const value = args[i + 1];
  return value === undefined || value.startsWith('--') ? undefined : value;
}

/** The goal text: every positional word, excluding flags and the values of value-flags. */
export function goalText(args: string[]): string {
  const words: string[] = [];
  for (let i = 0; i < args.length; i += 1) {
    const a = args[i];
    if (VALUE_FLAGS.has(a)) {
      i += 1; // skip the flag's value
    } else if (!a.startsWith('--')) {
      words.push(a);
    }
  }
  return words.join(' ').trim();
}

/** Every value of a repeatable flag, in order (e.g. `--check a --check b`). */
export function flagAll(args: string[], name: string): string[] {
  const out: string[] = [];
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === name && args[i + 1] !== undefined && !args[i + 1].startsWith('--')) out.push(args[i + 1]);
  }
  return out;
}

/** True when a boolean flag is present. */
export function hasFlag(args: string[], name: string): boolean {
  return args.includes(name);
}

/**
 * A goal's title (bounded for display/storage) and the full text as description, so a long
 * instruction is never silently cut off.
 */
export function goalFields(text: string): { title: string; description?: string } {
  const oneLine = text.replace(/\s+/g, ' ').trim();
  if (oneLine.length <= 120) return { title: oneLine };
  return { title: `${oneLine.slice(0, 117)}...`, description: text.trim() };
}

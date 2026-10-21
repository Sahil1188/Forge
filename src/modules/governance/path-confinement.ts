import { realpath } from 'node:fs/promises';
import * as path from 'node:path';
import { PermissionCallback } from '../runtimes/runtime.port';

/**
 * Tools that take a filesystem path, and the input keys that carry it. Covers
 * Claude Code's built-ins and CustomRuntime's `write_file`. Tools without a path
 * (Bash, WebSearch, …) are not handled here — shell commands are contained by the
 * command sandbox instead.
 */
const PATH_KEYS: Record<string, string[]> = {
  Write: ['file_path'],
  Edit: ['file_path'],
  MultiEdit: ['file_path'],
  NotebookEdit: ['notebook_path'],
  Read: ['file_path'],
  Glob: ['path'],
  Grep: ['path'],
  write_file: ['path'],
};

const isWindows = process.platform === 'win32';
const norm = (p: string): string => (isWindows ? p.toLowerCase() : p);

function isInside(root: string, target: string): boolean {
  const rel = path.relative(norm(root), norm(target));
  return rel === '' || (!rel.startsWith('..') && !path.isAbsolute(rel));
}

/** Resolves symlinks/junctions on the deepest existing ancestor of `target`. */
async function realAncestor(target: string): Promise<string> {
  let current = target;
  const tail: string[] = [];
  for (;;) {
    try {
      return path.join(await realpath(current), ...tail.reverse());
    } catch {
      const parent = path.dirname(current);
      if (parent === current) return target;
      tail.push(path.basename(current));
      current = parent;
    }
  }
}

/**
 * Returns a human-readable reason when a tool call would touch a path outside the
 * run's workspace, or null when it is fine (or carries no path). Resolves symlinks
 * so a link inside the workspace cannot be used to escape it.
 */
export async function findPathViolation(
  cwd: string,
  toolName: string,
  input: unknown,
): Promise<string | null> {
  const keys = PATH_KEYS[toolName];
  if (!keys || typeof input !== 'object' || input === null) return null;

  const root = await realAncestor(path.resolve(cwd));
  for (const key of keys) {
    const value = (input as Record<string, unknown>)[key];
    if (typeof value !== 'string') continue;
    const target = await realAncestor(path.resolve(cwd, value));
    if (!isInside(root, target)) {
      return `Path ${value} is outside the workspace. Use a path inside ${cwd}.`;
    }
  }
  return null;
}

/** A permission callback that only enforces workspace confinement (allows the rest). */
export function confinementGate(cwd: string): PermissionCallback {
  return async (toolName, input) => {
    const violation = await findPathViolation(cwd, toolName, input);
    return violation ? { behavior: 'deny', message: violation } : { behavior: 'allow' };
  };
}

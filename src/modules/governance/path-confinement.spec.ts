import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdtemp, mkdir, realpath, rm, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import * as path from 'node:path';
import { confinementGate, findPathViolation } from './path-confinement';

describe('workspace path confinement', () => {
  let root: string;
  let cwd: string;
  let outside: string;

  beforeAll(async () => {
    root = await realpath(await mkdtemp(path.join(tmpdir(), 'forge-pc-')));
    cwd = path.join(root, 'ws');
    outside = path.join(root, 'ws-evil'); // shares the workspace name as a prefix
    await mkdir(cwd, { recursive: true });
    await mkdir(outside, { recursive: true });
  });

  afterAll(async () => {
    await rm(root, { recursive: true, force: true });
  });

  it('allows relative and absolute paths inside the workspace', async () => {
    expect(await findPathViolation(cwd, 'Write', { file_path: 'a.txt' })).toBeNull();
    expect(await findPathViolation(cwd, 'Write', { file_path: 'src/deep/a.txt' })).toBeNull();
    expect(await findPathViolation(cwd, 'Edit', { file_path: path.join(cwd, 'a.txt') })).toBeNull();
    expect(await findPathViolation(cwd, 'write_file', { path: 'x/y.js' })).toBeNull();
  });

  it('denies parent-directory traversal', async () => {
    expect(await findPathViolation(cwd, 'Write', { file_path: '../x.txt' })).toMatch(/outside/i);
    expect(await findPathViolation(cwd, 'Write', { file_path: 'a/../../x.txt' })).toMatch(/outside/i);
  });

  it('denies absolute paths outside the workspace (the live "wrote to home dir" bug)', async () => {
    expect(await findPathViolation(cwd, 'Write', { file_path: path.join(root, 'hello.txt') })).toMatch(
      /outside/i,
    );
    expect(await findPathViolation(cwd, 'Write', { file_path: os_home() })).toMatch(/outside/i);
  });

  it('denies a sibling directory that merely shares the workspace name as a prefix', async () => {
    expect(await findPathViolation(cwd, 'Write', { file_path: path.join(outside, 'x.txt') })).toMatch(
      /outside/i,
    );
  });

  it('confines reads and searches too (no host file disclosure to the model)', async () => {
    expect(await findPathViolation(cwd, 'Read', { file_path: path.join(root, 'secret.txt') })).toMatch(
      /outside/i,
    );
    expect(await findPathViolation(cwd, 'Glob', { pattern: '*', path: root })).toMatch(/outside/i);
    expect(await findPathViolation(cwd, 'Grep', { pattern: 'x', path: outside })).toMatch(/outside/i);
    expect(await findPathViolation(cwd, 'NotebookEdit', { notebook_path: path.join(root, 'n.ipynb') })).toMatch(
      /outside/i,
    );
  });

  it('a search with no explicit path defaults to the workspace and is allowed', async () => {
    expect(await findPathViolation(cwd, 'Grep', { pattern: 'x' })).toBeNull();
    expect(await findPathViolation(cwd, 'Glob', { pattern: '**/*.ts' })).toBeNull();
  });

  it('ignores tools that carry no path (Bash is handled by the sandbox, not here)', async () => {
    expect(await findPathViolation(cwd, 'Bash', { command: 'cat /etc/passwd' })).toBeNull();
    expect(await findPathViolation(cwd, 'WebSearch', { query: 'x' })).toBeNull();
  });

  it('tolerates malformed input without throwing', async () => {
    expect(await findPathViolation(cwd, 'Write', null)).toBeNull();
    expect(await findPathViolation(cwd, 'Write', 'nope')).toBeNull();
    expect(await findPathViolation(cwd, 'Write', { file_path: 42 })).toBeNull();
  });

  it('denies a symlink/junction inside the workspace that points outside', async () => {
    const link = path.join(cwd, 'escape');
    try {
      await symlink(outside, link, 'junction'); // junction: no admin needed on Windows
    } catch {
      return; // environment cannot create links; nothing to assert
    }
    expect(await findPathViolation(cwd, 'Write', { file_path: 'escape/x.txt' })).toMatch(/outside/i);
    expect(await findPathViolation(cwd, 'Write', { file_path: path.join(link, 'x.txt') })).toMatch(/outside/i);
  });

  it('confinementGate allows clean calls and denies violations with a message', async () => {
    const gate = confinementGate(cwd);
    expect(await gate('Write', { file_path: 'ok.txt' })).toEqual({ behavior: 'allow' });
    const denied = await gate('Write', { file_path: '../nope.txt' });
    expect(denied.behavior).toBe('deny');
    expect((denied as { message: string }).message).toMatch(/outside/i);
  });
});

function os_home(): string {
  return process.env.USERPROFILE ?? process.env.HOME ?? path.resolve('/');
}

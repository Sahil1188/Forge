import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdtemp, mkdir, readFile, readdir, realpath, rm, symlink, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import * as path from 'node:path';
import { ToolExecutor } from './tool-executor';

describe('ToolExecutor', () => {
  let root: string;
  let cwd: string;
  const tools = new ToolExecutor();

  beforeAll(async () => {
    root = await realpath(await mkdtemp(path.join(tmpdir(), 'forge-te-')));
    cwd = path.join(root, 'ws');
    await mkdir(cwd, { recursive: true });
  });
  afterAll(async () => {
    await rm(root, { recursive: true, force: true });
  });

  const exists = (p: string) =>
    stat(p).then(
      () => true,
      () => false,
    );

  it('advertises exactly write_file and run_command, with required fields', () => {
    const defs = tools.definitions();
    expect(defs.map((d) => d.name).sort()).toEqual(['run_command', 'write_file']);
    const write = defs.find((d) => d.name === 'write_file')!;
    expect(write.inputSchema.required).toEqual(['path', 'content']);
  });

  it('writes a file, creating intermediate directories', async () => {
    const r = await tools.execute('write_file', { path: 'src/a/b/c.txt', content: 'hi' }, cwd);
    expect(r.isError).toBe(false);
    expect(await readFile(path.join(cwd, 'src/a/b/c.txt'), 'utf8')).toBe('hi');
  });

  it('overwrites an existing file', async () => {
    await tools.execute('write_file', { path: 'o.txt', content: 'one' }, cwd);
    await tools.execute('write_file', { path: 'o.txt', content: 'two' }, cwd);
    expect(await readFile(path.join(cwd, 'o.txt'), 'utf8')).toBe('two');
  });

  it('treats missing content as an empty file rather than crashing', async () => {
    const r = await tools.execute('write_file', { path: 'empty.txt' }, cwd);
    expect(r.isError).toBe(false);
    expect(await readFile(path.join(cwd, 'empty.txt'), 'utf8')).toBe('');
  });

  it('refuses ../ traversal and creates nothing outside', async () => {
    const r = await tools.execute('write_file', { path: '../pwned.txt', content: 'x' }, cwd);
    expect(r.isError).toBe(true);
    expect(r.output).toMatch(/escapes the workspace/);
    expect(await exists(path.join(root, 'pwned.txt'))).toBe(false);
  });

  it('refuses an absolute path outside the workspace', async () => {
    const target = path.join(root, 'abs.txt');
    const r = await tools.execute('write_file', { path: target, content: 'x' }, cwd);
    expect(r.isError).toBe(true);
    expect(await exists(target)).toBe(false);
  });

  it('refuses a sibling directory that shares the workspace name as a prefix', async () => {
    const evil = path.join(root, 'ws-evil');
    await mkdir(evil, { recursive: true });
    const r = await tools.execute(
      'write_file',
      { path: path.join(evil, 'x.txt'), content: 'x' },
      cwd,
    );
    expect(r.isError).toBe(true);
    expect(await readdir(evil)).toEqual([]);
  });

  it('refuses to write through a symlink/junction that points outside the workspace', async () => {
    const outside = path.join(root, 'outside-target');
    await mkdir(outside, { recursive: true });
    try {
      await symlink(outside, path.join(cwd, 'link'), 'junction');
    } catch {
      return; // cannot create links in this environment
    }
    const r = await tools.execute('write_file', { path: 'link/leak.txt', content: 'x' }, cwd);
    expect(r.isError).toBe(true);
    expect(await exists(path.join(outside, 'leak.txt'))).toBe(false);
  });

  it('reports (does not throw) when the target is a directory', async () => {
    await mkdir(path.join(cwd, 'adir'), { recursive: true });
    const r = await tools.execute('write_file', { path: 'adir', content: 'x' }, cwd);
    expect(r.isError).toBe(true);
    expect(r.output).toMatch(/write_file failed/);
  });

  it('reports an unknown tool as an error', async () => {
    const r = await tools.execute('delete_everything', {}, cwd);
    expect(r).toEqual({ output: 'Unknown tool: delete_everything', isError: true });
  });

  it('run_command executes inside the workspace', async () => {
    await tools.execute('write_file', { path: 'marker.txt', content: 'm' }, cwd);
    const r = await tools.execute(
      'run_command',
      { command: "node -e \"console.log(require('fs').readdirSync('.').join(','))\"" },
      cwd,
    );
    expect(r.isError).toBe(false);
    expect(r.output).toContain('marker.txt');
  });

  it('run_command surfaces a non-zero exit as an error with output', async () => {
    const r = await tools.execute(
      'run_command',
      { command: 'node -e "console.error(\'bad\'); process.exit(3)"' },
      cwd,
    );
    expect(r.isError).toBe(true);
    expect(r.output).toContain('bad');
  });
});

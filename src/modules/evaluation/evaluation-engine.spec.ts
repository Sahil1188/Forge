import { describe, it, expect } from 'vitest';
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import * as path from 'node:path';
import { EvaluationEngine } from './evaluation-engine';
import { ScriptDiscovery } from './script-discovery';
import { CommandRunner } from './command-runner';

const engine = new EvaluationEngine(new ScriptDiscovery(), new CommandRunner());

async function makeRepo(
  scripts: Record<string, string>,
  files: Record<string, string>,
): Promise<string> {
  const root = await mkdtemp(path.join(tmpdir(), 'forge-eval-'));
  await writeFile(
    path.join(root, 'package.json'),
    JSON.stringify({ name: 'fixture', version: '1.0.0', scripts }, null, 2),
    'utf8',
  );
  for (const [name, content] of Object.entries(files)) {
    await mkdir(path.dirname(path.join(root, name)), { recursive: true });
    await writeFile(path.join(root, name), content, 'utf8');
  }
  return root;
}

describe('EvaluationEngine.evaluateRepo', () => {
  it('passes a repo whose build and test scripts succeed', async () => {
    const root = await makeRepo(
      { build: 'node build.js', test: 'node test.js' },
      { 'build.js': 'process.exit(0);\n', 'test.js': 'process.exit(0);\n' },
    );
    const result = await engine.evaluateRepo(root);
    expect(result.status).toBe('passed');
    expect(result.overallScore).toBe(100);
    expect(result.dimensions.build.exitCode).toBe(0);
    expect(result.dimensions.test.exitCode).toBe(0);
  }, 30_000);

  it('fails a repo whose test script fails', async () => {
    const root = await makeRepo(
      { build: 'node build.js', test: 'node test.js' },
      { 'build.js': 'process.exit(0);\n', 'test.js': 'process.exit(1);\n' },
    );
    const result = await engine.evaluateRepo(root);
    expect(result.status).toBe('failed');
    expect(result.overallScore).toBe(50); // build 100, test 0
    expect(result.dimensions.test.exitCode).toBe(1);
  }, 30_000);

  it('is inconclusive when no known toolchain is present', async () => {
    const root = await mkdtemp(path.join(tmpdir(), 'forge-eval-empty-'));
    const result = await engine.evaluateRepo(root);
    expect(result.status).toBe('inconclusive');
    expect(result.overallScore).toBeNull();
  }, 30_000);
});

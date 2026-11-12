import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import * as path from 'node:path';
import { EvaluationEngine } from './evaluation-engine';
import { ScriptDiscovery, DiscoveredScript } from './script-discovery';
import { CommandRunner, CommandResult } from './command-runner';

class FakeDiscovery extends ScriptDiscovery {
  constructor(private readonly scripts: DiscoveredScript[]) {
    super();
  }
  async discover(): Promise<DiscoveredScript[]> {
    return this.scripts;
  }
}

class FakeRunner extends CommandRunner {
  readonly ran: string[] = [];
  constructor(private readonly byCommand: Record<string, Partial<CommandResult>>) {
    super();
  }
  async run(command: string): Promise<CommandResult> {
    this.ran.push(command);
    return { exitCode: 0, output: '', timedOut: false, ...(this.byCommand[command] ?? {}) };
  }
}

const S = (name: string): DiscoveredScript => ({ name, command: `npm --silent run ${name}` });

describe('EvaluationEngine — scoring semantics', () => {
  it('all dimensions pass → passed, score 100', async () => {
    const e = new EvaluationEngine(
      new FakeDiscovery([S('build'), S('test'), S('lint')]),
      new FakeRunner({}),
    );
    const r = await e.evaluateRepo('/x');
    expect(r.status).toBe('passed');
    expect(r.overallScore).toBe(100);
    expect(Object.keys(r.dimensions)).toEqual(['build', 'test', 'lint']);
  });

  it('one failing dimension fails the whole run even if the average looks good (all-pass gate)', async () => {
    const e = new EvaluationEngine(
      new FakeDiscovery([S('build'), S('test'), S('lint')]),
      new FakeRunner({ 'npm --silent run lint': { exitCode: 1 } }),
    );
    const r = await e.evaluateRepo('/x');
    expect(r.status).toBe('failed');
    expect(r.overallScore).toBe(67); // mean(100,100,0) rounded
    expect(r.dimensions.lint.score).toBe(0);
    expect(r.dimensions.build.score).toBe(100);
  });

  it('half failing → 50', async () => {
    const e = new EvaluationEngine(
      new FakeDiscovery([S('build'), S('test')]),
      new FakeRunner({ 'npm --silent run test': { exitCode: 2 } }),
    );
    const r = await e.evaluateRepo('/x');
    expect(r.overallScore).toBe(50);
    expect(r.status).toBe('failed');
    expect(r.dimensions.test.exitCode).toBe(2);
  });

  it('everything failing → 0', async () => {
    const e = new EvaluationEngine(
      new FakeDiscovery([S('build'), S('test')]),
      new FakeRunner({
        'npm --silent run build': { exitCode: 1 },
        'npm --silent run test': { exitCode: 1 },
      }),
    );
    const r = await e.evaluateRepo('/x');
    expect(r.overallScore).toBe(0);
    expect(r.status).toBe('failed');
  });

  it('a timed-out command counts as a failure', async () => {
    const e = new EvaluationEngine(
      new FakeDiscovery([S('test')]),
      new FakeRunner({ 'npm --silent run test': { exitCode: 1, timedOut: true } }),
    );
    const r = await e.evaluateRepo('/x');
    expect(r.status).toBe('failed');
  });

  it('no discoverable toolchain → inconclusive with a null score and an explanatory note', async () => {
    const e = new EvaluationEngine(new FakeDiscovery([]), new FakeRunner({}));
    const r = await e.evaluateRepo('/x');
    expect(r).toMatchObject({ status: 'inconclusive', overallScore: null, dimensions: {} });
    expect(r.note).toMatch(/No known toolchain/);
  });

  it('runs every dimension even after an earlier failure (full diagnosis, not fail-fast)', async () => {
    const runner = new FakeRunner({ 'npm --silent run build': { exitCode: 1 } });
    const e = new EvaluationEngine(new FakeDiscovery([S('build'), S('test')]), runner);
    await e.evaluateRepo('/x');
    expect(runner.ran).toEqual(['npm --silent run build', 'npm --silent run test']);
  });

  it('redacts secrets in captured output and truncates it to 4000 chars', async () => {
    const out = `token=ghp_abcdefghijklmnopqrstuvwxyz0123456789 ${'x'.repeat(10_000)}`;
    const e = new EvaluationEngine(
      new FakeDiscovery([S('test')]),
      new FakeRunner({ 'npm --silent run test': { exitCode: 1, output: out } }),
    );
    const r = await e.evaluateRepo('/x');
    expect(r.dimensions.test.output.length).toBeLessThanOrEqual(4000);
    expect(r.dimensions.test.output).not.toContain('ghp_abcdefghijklmnopqrstuvwxyz0123456789');
  });

  it('records the command and a non-negative duration per dimension', async () => {
    const e = new EvaluationEngine(new FakeDiscovery([S('build')]), new FakeRunner({}));
    const r = await e.evaluateRepo('/x');
    expect(r.dimensions.build.command).toBe('npm --silent run build');
    expect(r.dimensions.build.ran).toBe(true);
    expect(r.dimensions.build.durationMs).toBeGreaterThanOrEqual(0);
  });
});

describe('ScriptDiscovery — real package.json handling', () => {
  let dir: string;
  const discovery = new ScriptDiscovery();

  beforeAll(async () => {
    dir = await mkdtemp(path.join(tmpdir(), 'forge-sd-'));
  });
  afterAll(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  async function pkg(content: string): Promise<string> {
    const d = await mkdtemp(path.join(dir, 'p-'));
    await writeFile(path.join(d, 'package.json'), content, 'utf8');
    return d;
  }

  it('returns build, test, lint in a fixed order regardless of key order', async () => {
    const d = await pkg(
      JSON.stringify({ scripts: { lint: 'x', test: 'y', build: 'z', start: 'node .' } }),
    );
    expect((await discovery.discover(d)).map((s) => s.name)).toEqual(['build', 'test', 'lint']);
  });

  it('ignores scripts that are not part of the verification set', async () => {
    const d = await pkg(JSON.stringify({ scripts: { start: 'node .', dev: 'x', format: 'y' } }));
    expect(await discovery.discover(d)).toEqual([]);
  });

  it('ignores empty and non-string script values', async () => {
    const d = await pkg(JSON.stringify({ scripts: { build: '', test: 42, lint: null } }));
    expect(await discovery.discover(d)).toEqual([]);
  });

  it('a malformed package.json yields no scripts instead of throwing', async () => {
    expect(await discovery.discover(await pkg('{ not json'))).toEqual([]);
  });

  it('a package.json without a scripts field yields no scripts', async () => {
    expect(await discovery.discover(await pkg('{"name":"x"}'))).toEqual([]);
  });

  it('a missing package.json yields no scripts', async () => {
    expect(await discovery.discover(await mkdtemp(path.join(dir, 'empty-')))).toEqual([]);
  });

  it('builds a quiet npm run command per script', async () => {
    const d = await pkg(JSON.stringify({ scripts: { test: 'vitest' } }));
    expect(await discovery.discover(d)).toEqual([
      { name: 'test', command: 'npm --silent run test' },
    ]);
  });
});

describe('CommandRunner — real process behaviour', () => {
  const runner = new CommandRunner();

  it('reports exit 0 and captures stdout+stderr', async () => {
    const r = await runner.run(
      "node -e \"console.log('out'); console.error('err')\"",
      process.cwd(),
    );
    expect(r.exitCode).toBe(0);
    expect(r.output).toContain('out');
    expect(r.output).toContain('err');
    expect(r.timedOut).toBe(false);
  });

  it('reports the real non-zero exit code', async () => {
    const r = await runner.run('node -e "process.exit(7)"', process.cwd());
    expect(r.exitCode).toBe(7);
  });

  it('kills a command that exceeds the timeout and flags it', async () => {
    const r = await runner.run('node -e "setTimeout(()=>{}, 30000)"', process.cwd(), 300);
    expect(r.timedOut).toBe(true);
    expect(r.exitCode).not.toBe(0);
  }, 15_000);
});

describe('EvaluationEngine — acceptance checks (does the work match its brief?)', () => {
  it('runs acceptance commands as extra dimensions after the repo scripts', async () => {
    const runner = new FakeRunner({});
    const e = new EvaluationEngine(new FakeDiscovery([S('test')]), runner);
    const r = await e.evaluateRepo('/x', ['node -e "require(\'./index.js\')"', 'node -e "1"']);
    expect(Object.keys(r.dimensions)).toEqual(['test', 'acceptance#1', 'acceptance#2']);
    expect(runner.ran).toEqual([
      'npm --silent run test',
      'node -e "require(\'./index.js\')"',
      'node -e "1"',
    ]);
    expect(r.status).toBe('passed');
  });

  it('green tests are not enough: a failing acceptance check fails the item (the "right code, wrong layout" case)', async () => {
    const e = new EvaluationEngine(
      new FakeDiscovery([S('test')]),
      new FakeRunner({
        'node -e "require(\'./index.js\')"': {
          exitCode: 1,
          output: 'Cannot find module ./index.js',
        },
      }),
    );
    const r = await e.evaluateRepo('/x', ['node -e "require(\'./index.js\')"']);
    expect(r.status).toBe('failed');
    expect(r.overallScore).toBe(50);
    expect(r.dimensions['acceptance#1'].output).toContain('Cannot find module');
  });

  it('acceptance checks alone make a repo verifiable (no longer "done but unverified")', async () => {
    const e = new EvaluationEngine(new FakeDiscovery([]), new FakeRunner({}));
    const r = await e.evaluateRepo('/x', ['node -e "1"']);
    expect(r.status).toBe('passed');
    expect(r.overallScore).toBe(100);
  });
});

describe('EvaluationEngine — speed without losing feedback', () => {
  it('skips acceptance checks while the project checks fail, keeping the failing output as the feedback', async () => {
    const runner = new FakeRunner({
      'npm --silent run lint': { exitCode: 1, output: "'x' is never used" },
    });
    const e = new EvaluationEngine(new FakeDiscovery([S('lint'), S('test')]), runner);
    const r = await e.evaluateRepo('/x', ['node -e "check()"']);
    expect(r.status).toBe('failed');
    expect(r.dimensions.lint.output).toContain('never used');
    expect(r.dimensions.test.ran).toBe(true); // every project check still runs, for complete feedback
    expect(r.dimensions['acceptance#1']).toMatchObject({ ran: false, score: 0 });
    expect(runner.ran).not.toContain('node -e "check()"');
    expect(r.brokenChecks).toBeUndefined();
  });

  it('runs acceptance checks once the project checks pass, and never runs the same command twice', async () => {
    const runner = new FakeRunner({});
    const e = new EvaluationEngine(new FakeDiscovery([S('build'), S('test')]), runner);
    const r = await e.evaluateRepo('/x', ['npm --silent run build', 'node -e "check()"']);
    expect(r.status).toBe('passed');
    expect(runner.ran.filter((c) => c === 'npm --silent run build')).toHaveLength(1);
    expect(runner.ran).toContain('node -e "check()"');
    expect(r.dimensions['acceptance#1'].ran).toBe(true);
  });
});

import { spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import * as path from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';

const ROOT = path.resolve(__dirname, '..');
const CLI = path.join(ROOT, 'bin', 'forge.cjs');

function forge(args: string[], timeout = 120_000) {
  const res = spawnSync(process.execPath, [CLI, ...args], {
    cwd: ROOT,
    encoding: 'utf8',
    timeout,
    env: { ...process.env },
  });
  return { code: res.status, out: `${res.stdout ?? ''}${res.stderr ?? ''}` };
}

describe('forge CLI', () => {
  describe('argument handling (no database needed)', () => {
    it('prints usage and exits 0 for `help`, `--help` and `-h`', () => {
      for (const flag of ['help', '--help', '-h']) {
        const r = forge([flag]);
        expect(r.code, flag).toBe(0);
        expect(r.out).toContain('Usage: forge <command>');
        for (const cmd of ['up', 'seed', 'serve', 'status', 'goal']) expect(r.out).toContain(cmd);
      }
    });

    it('prints usage and exits 1 when no command is given', () => {
      const r = forge([]);
      expect(r.code).toBe(1);
      expect(r.out).toContain('Usage: forge <command>');
    });

    it('rejects an unknown command with a non-zero exit', () => {
      const r = forge(['frobnicate']);
      expect(r.code).toBe(1);
      expect(r.out).toContain('Unknown command: frobnicate');
    });

    it('`goal` without text exits 1 with a usage hint (and does not start a run)', () => {
      const r = forge(['goal']);
      expect(r.code).toBe(1);
      expect(r.out).toContain('Usage: forge goal');
    });

    it('`goal` with only flags is still "no text"', () => {
      const r = forge(['goal', '--company', randomUUID()]);
      expect(r.code).toBe(1);
      expect(r.out).toContain('Usage: forge goal');
    });
  });

  describe('against the real database (compiled dist/)', () => {
    beforeAll(() => {
      // The CLI boots the compiled app (tsx/esbuild cannot emit Nest's decorator metadata).
      const build = spawnSync('npm', ['run', 'build'], { cwd: ROOT, shell: true, encoding: 'utf8', timeout: 240_000 });
      expect(build.status, build.stdout + build.stderr).toBe(0);
    }, 300_000);

    it('`status` boots the real container and lists companies with their employees', () => {
      const r = forge(['status']);
      expect(r.code, r.out).toBe(0);
      expect(r.out).toMatch(/🏢|No companies yet/);
    }, 180_000);

    it('`goal` with an unknown --company exits 1 without creating anything or calling a model', () => {
      const r = forge(['goal', 'Build something', '--company', randomUUID()]);
      expect(r.code, r.out).toBe(1);
      expect(r.out).toContain('No company found');
    }, 180_000);

    it('the --company value never leaks into the goal text (flag before or after the words)', () => {
      const id = randomUUID();
      for (const args of [
        ['goal', 'Build', 'something', '--company', id],
        ['goal', '--company', id, 'Build something'],
      ]) {
        const r = forge(args);
        expect(r.code, r.out).toBe(1);
        expect(r.out).toContain('No company found');
      }
    }, 240_000);
  });
});

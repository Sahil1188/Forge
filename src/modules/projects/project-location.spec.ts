import { describe, it, expect } from 'vitest';
import { mkdtempSync, writeFileSync } from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { defaultProjectsRoot, folderProblem, resolveRepoPath, slug } from './project-location';

const ID = '42c93b0a-4324-4048-a717-cfc76ce661d6';

describe('project locations', () => {
  it('defaults to ~/Forge Projects, overridable with FORGE_PROJECTS_DIR', () => {
    expect(defaultProjectsRoot({} as NodeJS.ProcessEnv)).toBe(
      path.join(os.homedir(), 'Forge Projects'),
    );
    expect(
      defaultProjectsRoot({ FORGE_PROJECTS_DIR: path.join(os.tmpdir(), 'x') } as NodeJS.ProcessEnv),
    ).toBe(path.join(os.tmpdir(), 'x'));
  });

  it('puts each project in <root>/<company>/<project>-<id8>', () => {
    const env = { FORGE_PROJECTS_DIR: path.join(os.tmpdir(), 'root') } as NodeJS.ProcessEnv;
    expect(
      resolveRepoPath({
        companyName: 'Acme Fintech',
        projectName: 'Loan Model v2!',
        projectId: ID,
        env,
      }),
    ).toBe(path.join(os.tmpdir(), 'root', 'acme-fintech', 'loan-model-v2-42c93b0a'));
  });

  it('a company folder replaces the root; a goal location is used exactly', () => {
    const companyDir = path.join(os.tmpdir(), 'acme');
    expect(
      resolveRepoPath({ companyDir, companyName: 'Acme', projectName: 'App', projectId: ID }),
    ).toBe(path.join(companyDir, 'app-42c93b0a'));
    const exact = path.join(os.tmpdir(), 'my-app');
    expect(
      resolveRepoPath({
        location: exact,
        companyDir,
        companyName: 'Acme',
        projectName: 'App',
        projectId: ID,
      }),
    ).toBe(exact);
  });

  it('slugs are safe folder names', () => {
    expect(slug('../../etc/passwd')).toBe('etc-passwd');
    expect(slug('   ')).toBe('project');
    expect(slug('Ünïcödé Café')).toBe('unicode-cafe');
  });

  it('refuses unsafe or occupied folders with a clear reason', () => {
    expect(folderProblem('relative/dir', { mustBeEmpty: true })).toMatch(/full path/);
    expect(folderProblem(path.parse(os.tmpdir()).root, { mustBeEmpty: true })).toMatch(
      /root of a drive/,
    );
    expect(folderProblem(os.homedir(), { mustBeEmpty: false })).toMatch(/home folder itself/);
    const full = mkdtempSync(path.join(os.tmpdir(), 'forge-loc-'));
    writeFileSync(path.join(full, 'mine.txt'), 'x');
    expect(folderProblem(full, { mustBeEmpty: true })).toMatch(/not empty/);
    expect(folderProblem(full, { mustBeEmpty: false })).toBeNull();
    expect(folderProblem(path.join(full, 'new-folder'), { mustBeEmpty: true })).toBeNull();
    expect(folderProblem(path.join(full, 'mine.txt'), { mustBeEmpty: true })).toMatch(/is a file/);
  });
});

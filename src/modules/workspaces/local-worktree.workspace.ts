import { Inject, Injectable, Logger } from '@nestjs/common';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { randomUUID } from 'node:crypto';
import { access, mkdir, writeFile } from 'node:fs/promises';
import * as path from 'node:path';
import { eq } from 'drizzle-orm';
import { DRIZZLE, Database } from '../../infrastructure/database/drizzle.provider';
import { workspaces } from './workspaces.schema';
import { projects } from '../projects/projects.schema';
import {
  CollectResult,
  IntegrateResult,
  PrepareWorkspaceInput,
  WorkspaceHandle,
  WorkspacePort,
} from './workspace.port';

const exec = promisify(execFile);

// Dependency/build output, plus Forge's per-run CLAUDE.md (employee identity + memories),
// which belongs to the run, not to the deliverable.
const DEFAULT_GITIGNORE = [
  'node_modules/',
  'dist/',
  'build/',
  '.venv/',
  'venv/',
  '__pycache__/',
  '*.pyc',
  '.next/',
  'target/',
  '/CLAUDE.md',
  '',
].join('\n');
const MAIN = 'main';

/**
 * Per-run git isolation (spec §11).
 *
 * Work items of a project share one repository (`workspaces/projects/<projectId>`, branch
 * `main` = the integrated deliverable). Each run gets its own git worktree on its own branch,
 * started from `main` — so it sees everything earlier items delivered — and a passing item is
 * merged back into `main`. Goal-level planning runs (no project yet) get a throwaway repo.
 */
@Injectable()
export class LocalWorktreeWorkspace implements WorkspacePort {
  private readonly logger = new Logger(LocalWorktreeWorkspace.name);
  private readonly rootDir = path.join(process.cwd(), 'workspaces', 'runs');
  /** Where projects created before per-project locations lived. */
  private readonly legacyProjectsDir = path.join(process.cwd(), 'workspaces', 'projects');
  private readonly paths = new Map<string, string>();
  /** Serialises git operations per project repo (worktree add / merge touch shared refs). */
  private readonly locks = new Map<string, Promise<unknown>>();

  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  async projectPath(projectId: string): Promise<string> {
    const known = this.paths.get(projectId);
    if (known) return known;
    const [row] = await this.db
      .select({ repoPath: projects.repoPath })
      .from(projects)
      .where(eq(projects.id, projectId));
    const resolved = row?.repoPath ?? path.join(this.legacyProjectsDir, projectId);
    if (row) this.paths.set(projectId, resolved);
    return resolved;
  }

  async prepare(input: PrepareWorkspaceInput): Promise<WorkspaceHandle> {
    const folder = randomUUID();
    const root = path.join(this.rootDir, folder);
    await mkdir(root, { recursive: true });
    let branch: string;
    let baseRef: string | null = null;

    if (input.projectId) {
      const repo = await this.ensureProjectRepo(input.projectId);
      // Unique per run, so a rework attempt never collides with an earlier attempt's branch.
      branch = `forge/${input.workItemId ?? 'run'}-${folder.slice(0, 8)}`;
      await this.withLock(input.projectId, async () => {
        const merging =
          input.mergeFrom && (await this.branchExists(repo, input.mergeFrom))
            ? input.mergeFrom
            : undefined;
        const start =
          !merging && input.baseRef && (await this.branchExists(repo, input.baseRef))
            ? input.baseRef
            : MAIN;
        baseRef = merging ? `${MAIN}+${merging}` : start;
        await this.git(repo, ['worktree', 'add', '-q', '-b', branch, root, start]);
        if (merging) {
          await this.configureIdentity(root);
          // Conflicts are expected here: leave the markers for the agent instead of failing.
          await this.git(root, ['merge', '--no-ff', '--no-commit', merging]).catch(() => undefined);
        }
      });
    } else if (input.baseRepoPath) {
      // Worktree off an existing base repo (modify-existing-project case).
      branch = `forge/${input.workItemId ?? folder}`;
      baseRef = input.baseRepoPath;
      await this.git(input.baseRepoPath, ['worktree', 'add', '-b', branch, root]);
    } else {
      branch = `forge/${input.workItemId ?? (input.goalId ? `plan-${input.goalId}` : folder)}`;
      await this.initRepo(root, branch);
    }

    const [row] = await this.db
      .insert(workspaces)
      .values({
        employeeId: input.employeeId,
        workItemId: input.workItemId ?? null,
        goalId: input.goalId ?? null,
        kind: 'local_worktree',
        rootPath: root,
        gitBranch: branch,
        baseRef,
        status: 'ready',
      })
      .returning();

    this.logger.log(`Prepared workspace ${row.id} at ${root} (branch ${branch})`);
    return { id: row.id, rootPath: root, branch, kind: 'local_worktree' };
  }

  async collect(handle: WorkspaceHandle): Promise<CollectResult> {
    await this.configureIdentity(handle.rootPath);
    await this.git(handle.rootPath, ['add', '-A']);
    const namesOut = await this.git(handle.rootPath, ['diff', '--cached', '--name-only']);
    const filesChanged = namesOut
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
    await this.git(handle.rootPath, ['commit', '-q', '--allow-empty', '-m', 'feat: work output']);
    return { filesChanged, branch: handle.branch };
  }

  async integrate(projectId: string, branch: string): Promise<IntegrateResult> {
    const repo = await this.projectPath(projectId);
    return this.withLock(projectId, async () => {
      try {
        await this.git(repo, ['merge', '--no-ff', '-q', '-m', `merge ${branch}`, branch]);
        this.logger.log(`Integrated ${branch} into ${projectId}/${MAIN}`);
        return { merged: true };
      } catch (err) {
        await this.git(repo, ['merge', '--abort']).catch(() => undefined);
        const e = err as { stdout?: string; stderr?: string; message?: string };
        return {
          merged: false,
          conflict: `${e.stdout ?? ''}${e.stderr ?? ''}`.trim() || e.message,
        };
      }
    });
  }

  async catchUp(projectId: string, rootPath: string): Promise<IntegrateResult> {
    return this.withLock(projectId, async () => {
      try {
        await this.configureIdentity(rootPath);
        await this.git(rootPath, ['merge', '--no-ff', '-q', '-m', `catch up with ${MAIN}`, MAIN]);
        return { merged: true };
      } catch (err) {
        await this.git(rootPath, ['merge', '--abort']).catch(() => undefined);
        const e = err as { stdout?: string; stderr?: string; message?: string };
        return {
          merged: false,
          conflict: `${e.stdout ?? ''}${e.stderr ?? ''}`.trim() || e.message,
        };
      }
    });
  }

  async seedFile(
    projectId: string,
    relPath: string,
    content: string,
    message: string,
  ): Promise<void> {
    if (relPath.includes('..') || path.isAbsolute(relPath))
      throw new Error(`Refusing to seed ${relPath} outside the project`);
    const repo = await this.ensureProjectRepo(projectId);
    await this.withLock(projectId, async () => {
      const file = path.join(repo, relPath);
      await mkdir(path.dirname(file), { recursive: true });
      await writeFile(file, content, 'utf8');
      await this.git(repo, ['add', '--', relPath]);
      // Nothing to commit when the same file is already there.
      const status = await this.git(repo, ['status', '--porcelain', '--', relPath]);
      if (status.trim()) await this.git(repo, ['commit', '-q', '-m', message]);
    });
  }

  async cleanup(handle: WorkspaceHandle): Promise<void> {
    // V1: retain the workspace for audit; just mark it archived.
    await this.db
      .update(workspaces)
      .set({ status: 'archived' })
      .where(eq(workspaces.id, handle.id));
  }

  private async ensureProjectRepo(projectId: string): Promise<string> {
    const repo = await this.projectPath(projectId);
    await this.withLock(projectId, async () => {
      try {
        await access(path.join(repo, '.git'));
      } catch {
        await mkdir(repo, { recursive: true });
        await this.initRepo(repo, MAIN);
        this.logger.log(`Created project repository ${repo}`);
      }
    });
    return repo;
  }

  private async initRepo(root: string, branch: string): Promise<void> {
    await this.git(root, ['init', '-q']);
    await this.configureIdentity(root);
    await this.git(root, ['checkout', '-q', '-b', branch]);
    // Dependency and build output must never be committed as "work output" (an agent's
    // `npm install` once put thousands of node_modules files into a run's artifacts).
    await writeFile(path.join(root, '.gitignore'), DEFAULT_GITIGNORE, 'utf8');
    await this.git(root, ['add', '.gitignore']);
    await this.git(root, ['commit', '-q', '-m', 'chore: init workspace']);
  }

  private async branchExists(repo: string, branch: string): Promise<boolean> {
    try {
      await this.git(repo, ['rev-parse', '--verify', '-q', `refs/heads/${branch}`]);
      return true;
    } catch {
      return false;
    }
  }

  private async withLock<T>(key: string, fn: () => Promise<T>): Promise<T> {
    const prev = this.locks.get(key) ?? Promise.resolve();
    const next = prev.then(fn, fn);
    this.locks.set(
      key,
      next.catch(() => undefined),
    );
    return next;
  }

  private async configureIdentity(cwd: string): Promise<void> {
    await this.git(cwd, ['config', 'user.email', 'forge@forge.local']);
    await this.git(cwd, ['config', 'user.name', 'Forge']);
  }

  private async git(cwd: string, args: string[]): Promise<string> {
    const { stdout } = await exec('git', args, { cwd, windowsHide: true });
    return stdout;
  }
}

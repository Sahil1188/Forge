export interface PrepareWorkspaceInput {
  employeeId: string;
  /** A work-item workspace or a goal-level (planning) workspace — at least one. */
  workItemId?: string;
  goalId?: string;
  /**
   * The project this work belongs to. When set, the run gets a branch off the project's
   * shared repository, so it starts from everything earlier work items already delivered.
   */
  projectId?: string;
  /** Project branch to start from instead of `main` (e.g. a rework continuing a prior attempt). */
  baseRef?: string;
  /**
   * Start from the latest `main` and merge this earlier branch into it (used after a merge conflict):
   * conflicting spots are left marked in the files for the agent to reconcile.
   */
  mergeFrom?: string;
  /** Optional base repo to branch from; when omitted a fresh git repo is created. */
  baseRepoPath?: string;
}

export interface WorkspaceHandle {
  id: string;
  rootPath: string;
  branch: string;
  kind: string;
}

export interface CollectResult {
  filesChanged: string[];
  branch: string;
}

export interface IntegrateResult {
  merged: boolean;
  /** Set when the branch could not be merged cleanly (the merge is aborted). */
  conflict?: string;
}

/**
 * Workspace abstraction (spec §10). V1 provides `LocalWorktreeWorkspace`; a
 * `DockerWorkspace` / `KubernetesWorkspace` can implement the same port later
 * without the rest of the app caring.
 */
export interface WorkspacePort {
  prepare(input: PrepareWorkspaceInput): Promise<WorkspaceHandle>;
  collect(handle: WorkspaceHandle): Promise<CollectResult>;
  /** Merges a finished work item's branch into the project's `main` (the deliverable). */
  integrate(projectId: string, branch: string): Promise<IntegrateResult>;
  /**
   * Merges the project's latest `main` into a finished item's worktree, so it is checked as the
   * code `main` will become (other steps may have merged since it started). Aborted on conflict.
   */
  catchUp(projectId: string, rootPath: string): Promise<IntegrateResult>;
  /** Commits a file onto the project's shared main (e.g. BRAND.md), so every later item starts with it. */
  seedFile(projectId: string, relPath: string, content: string, message: string): Promise<void>;
  /** Where the project's integrated deliverable lives on disk (its git repository). */
  projectPath(projectId: string): Promise<string>;
  cleanup(handle: WorkspaceHandle): Promise<void>;
}

export const WORKSPACE_PORT = Symbol('WORKSPACE_PORT');

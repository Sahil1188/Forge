import { Module } from '@nestjs/common';
import { LocalWorktreeWorkspace } from './local-worktree.workspace';
import { WORKSPACE_PORT } from './workspace.port';

@Module({
  providers: [
    LocalWorktreeWorkspace,
    { provide: WORKSPACE_PORT, useExisting: LocalWorktreeWorkspace },
  ],
  exports: [WORKSPACE_PORT, LocalWorktreeWorkspace],
})
export class WorkspacesModule {}

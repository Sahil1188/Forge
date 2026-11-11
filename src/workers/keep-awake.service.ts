import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ChildProcess, spawn } from 'node:child_process';
import { inArray, eq, sql } from 'drizzle-orm';
import { DRIZZLE, Database } from '../infrastructure/database/drizzle.provider';
import { workItems } from '../modules/work/work.schema';
import { agentRuns } from '../modules/runtimes/agent-runs.schema';
import { killTree } from './process-cleanup';

const CHECK_MS = 30_000;

/**
 * The PowerShell that holds the "system required" request: SetThreadExecutionState(ES_CONTINUOUS |
 * ES_SYSTEM_REQUIRED) keeps Windows from sleeping on idle while it runs (the screen may still turn off).
 * The request ends with the process, so a crash of Forge can never keep the PC awake for good.
 */
export const KEEP_AWAKE_SCRIPT = [
  "$sig = '[DllImport(\"kernel32.dll\")] public static extern uint SetThreadExecutionState(uint esFlags);'",
  '$k = Add-Type -MemberDefinition $sig -Name Power -Namespace Forge -PassThru',
  'while ($true) { [void]$k::SetThreadExecutionState([uint32]2147483649); Start-Sleep -Seconds 60 }',
].join('; ');

/**
 * Keeps the computer awake while Forge has work in flight, and lets it sleep again when idle.
 * Observed live: an overnight sleep froze a step's checks for 16 hours. Windows only; elsewhere a
 * no-op. FORGE_KEEP_AWAKE=0 turns it off.
 */
@Injectable()
export class KeepAwakeService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KeepAwakeService.name);
  private timer?: NodeJS.Timeout;
  private holder?: ChildProcess;

  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  get enabled(): boolean {
    return process.platform === 'win32' && process.env.FORGE_KEEP_AWAKE !== '0' && process.env.NODE_ENV !== 'test' && !process.env.VITEST;
  }

  get holding(): boolean {
    return Boolean(this.holder && this.holder.exitCode === null);
  }

  onModuleInit(): void {
    if (!this.enabled) return;
    this.timer = setInterval(() => void this.check().catch(() => undefined), CHECK_MS);
    this.timer.unref?.();
    void this.check().catch(() => undefined);
  }

  async onModuleDestroy(): Promise<void> {
    if (this.timer) clearInterval(this.timer);
    await this.release();
  }

  /** Is anything working or being checked right now? */
  async busy(): Promise<boolean> {
    const [row] = await this.db
      .select({
        // Running work, plus queued work that is ready to run (e.g. held until a usage limit resets:
        // observed live, a PC that slept through the reset resumed hours late).
        n: sql<number>`(select count(*) from ${workItems} where ${inArray(workItems.status, ['in_progress', 'evaluating'])})
          + (select count(*) from ${agentRuns} where ${eq(agentRuns.status, 'running')})
          + (select count(*) from work_items w where w.status = 'assigned' and not exists (
              select 1 from work_dependencies d join work_items dep on dep.id = d.depends_on_work_item_id
              where d.work_item_id = w.id and dep.status <> 'done'))`,
      })
      .from(sql`(select 1) as one`);
    return Number(row?.n ?? 0) > 0;
  }

  async check(): Promise<void> {
    const busy = await this.busy();
    if (busy && !this.holding) this.hold();
    else if (!busy && this.holding) await this.release();
  }

  private hold(): void {
    this.holder = spawn('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', KEEP_AWAKE_SCRIPT], {
      windowsHide: true,
      stdio: 'ignore',
    });
    this.holder.on('error', (e) => this.logger.warn(`Could not keep the computer awake: ${e.message}`));
    this.logger.log('Work in progress: keeping the computer awake');
  }

  private async release(): Promise<void> {
    if (!this.holder) return;
    const pid = this.holder.pid;
    this.holder = undefined;
    await killTree(pid);
    this.logger.log('No work in progress: the computer may sleep again');
  }
}

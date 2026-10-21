/** Honest end-of-run reporting for `forge goal` — pure, so it is unit-testable. */

export interface GoalItemOutcome {
  workItemId: string;
  /** Result of the execution step; undefined when the item never ran. */
  execution?: 'completed' | 'failed' | 'paused' | 'blocked' | 'killed_budget' | 'killed_timeout' | 'killed_tools';
  /** Result of the objective evaluation, when one ran. */
  evaluation?: 'passed' | 'failed' | 'inconclusive';
  finalStatus: string;
}

export interface GoalSummary {
  ok: boolean;
  /** 0 = all passed, 2 = something failed / did not run, 3 = waiting for approval. */
  exitCode: number;
  lines: string[];
}

export function summarizeGoal(items: GoalItemOutcome[]): GoalSummary {
  const done = items.filter((i) => i.finalStatus === 'done');
  const paused = items.filter((i) => i.execution === 'paused');
  const notDone = items.filter((i) => i.finalStatus !== 'done' && i.execution !== 'paused');
  const unverified = done.filter((i) => i.evaluation === 'inconclusive');

  const lines = [`${done.length} of ${items.length} work item(s) passed.`];
  for (const i of notDone) {
    const why =
      i.finalStatus === 'rework'
        ? 'failed evaluation → rework'
        : i.execution
          ? `${i.execution}`
          : 'never ran';
    lines.push(`  ✗ ${i.workItemId}: ${why} (status ${i.finalStatus})`);
  }
  for (const i of paused) {
    lines.push(`  ⏸ ${i.workItemId}: waiting for approval — decide it, then re-run`);
  }
  if (unverified.length > 0) {
    lines.push(`  ⚠ ${unverified.length} item(s) marked done but unverified (nothing to verify: no package.json scripts).`);
  }

  const ok = items.length > 0 && notDone.length === 0 && paused.length === 0;
  const exitCode = ok ? 0 : paused.length > 0 && notDone.length === 0 ? 3 : 2;
  return { ok, exitCode, lines };
}

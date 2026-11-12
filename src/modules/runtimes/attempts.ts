/** The run fields that decide whether a run used up one of its work item's attempts. */
export interface AttemptRun {
  status: string;
  filesChangedCount?: number | null;
  /** The runtime the run used: runs on the fallback ('custom' standing in for Claude) are best effort. */
  runtimeKey?: string | null;
}

const LIMIT_KILLS = new Set(['killed_timeout', 'killed_tools', 'killed_turns']);

/** Default cap on productive limit stops per work item (see `countAttempts`). */
export const DEFAULT_MAX_CONTINUATIONS = 6;
/** Fallback runs that do not use up an attempt, per work item (see `countAttempts`). */
export const DEFAULT_MAX_FALLBACK_RUNS = 6;

/**
 * Which runs count against a work item's attempts.
 *
 * - Usage-limit pauses and restarts (`rate_limited`) never count: nobody did anything wrong.
 * - A run stopped by its time/tool/turn limit after changing files made progress, and the next run
 *   continues from that work, so it is a continuation, not a failed attempt. Observed live: a big
 *   frontend step wrote pages and tests for 30 minutes, was stopped at the limit, and was about to
 *   be failed for "three attempts" while still moving forward.
 * - Continuations are capped (FORGE_MAX_CONTINUATIONS, default 6) so a step that never converges
 *   still ends: past the cap, further limit stops count as attempts again.
 */
export function countAttempts(
  runs: AttemptRun[],
  maxContinuations = defaultMaxContinuations(),
  maxFallbackRuns = DEFAULT_MAX_FALLBACK_RUNS,
): { attempts: number; continuations: number } {
  let attempts = 0;
  let continuations = 0;
  let fallbackRuns = 0;
  for (const r of runs) {
    if (r.status === 'rate_limited') continue;
    // Work done on the fallback model while Claude was at its limit is best effort: a failure there
    // must not fail the step, so Claude can redo it after the reset (observed live: two steps failed
    // for good on weaker fallback models). Capped, so a step that never converges still ends.
    if (r.runtimeKey === 'custom' && fallbackRuns < maxFallbackRuns) {
      fallbackRuns += 1;
      continue;
    }
    if (
      LIMIT_KILLS.has(r.status) &&
      (r.filesChangedCount ?? 0) > 0 &&
      continuations < maxContinuations
    ) {
      continuations += 1;
      continue;
    }
    attempts += 1;
  }
  return { attempts, continuations };
}

function defaultMaxContinuations(): number {
  const n = Number(process.env.FORGE_MAX_CONTINUATIONS);
  return Number.isFinite(n) && n >= 0 ? n : DEFAULT_MAX_CONTINUATIONS;
}

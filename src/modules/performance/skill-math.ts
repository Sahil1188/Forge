import { DOMAINS, domainOf } from '../work/domains';
const NEUTRAL_SCORE = 60;
const MAX_GAIN = 8;
const DROP_FACTOR = 4;

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const round1 = (v: number) => Math.round(v * 10) / 10;

/**
 * Non-uniform skill delta (spec §14): high-quality, high-complexity work moves
 * the needle meaningfully; trivial work barely does; failures decrement. Gains
 * have diminishing returns as the level approaches 100.
 */
export function computeSkillDelta(
  currentLevel: number,
  evaluationScore: number,
  complexity: number,
): number {
  const performance = (evaluationScore - NEUTRAL_SCORE) / 40; // +1 at 100, -1.5 at 0
  const comp = clamp(complexity, 0, 1);
  if (performance >= 0) {
    const headroom = Math.max(0, (100 - currentLevel) / 100);
    return round1(performance * comp * MAX_GAIN * headroom);
  }
  // Failures decrement regardless of complexity (no diminishing returns).
  return round1(performance * DROP_FACTOR);
}


/** Maps a work item's task type + priority to a 0..1 complexity factor. */
export function complexityOf(taskType: string, priority = 0): number {
  const base = taskType in DOMAINS ? domainOf(taskType).weight : 0.5;
  const nudge = (clamp(priority, 0, 100) / 100) * 0.2;
  return clamp(base + nudge, 0, 1);
}

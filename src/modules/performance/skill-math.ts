import { DOMAINS, domainOf } from '../work/domains';
const NEUTRAL_SCORE = 60;
const MAX_GAIN = 8;
const DROP_FACTOR = 4;
/** A failed step scores at most this, so it always counts against the employee. */
const FAILED_SCORE_CAP = 40;
/** Each failed attempt before a pass takes this share off the score, up to MAX_DISCOUNTED_RETRIES. */
const RETRY_DISCOUNT = 0.1;
const MAX_DISCOUNTED_RETRIES = 4;

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

/**
 * The score that skills and reputation learn from. Checks score 100 or 0 each, so a failed step can
 * still average well (one failing check of three is 67); a failure is capped below neutral so it never
 * raises anything. A pass is discounted for every failed attempt before it, so passing on the fifth
 * try is worth less than passing first time, but never drops below neutral: passing work does not
 * lower a skill.
 */
export function learningScore(overallScore: number, passed: boolean, retries: number): number {
  if (!passed) return Math.min(overallScore, FAILED_SCORE_CAP);
  const counted = clamp(Math.floor(retries), 0, MAX_DISCOUNTED_RETRIES);
  return Math.max(NEUTRAL_SCORE, Math.round(overallScore * (1 - RETRY_DISCOUNT * counted)));
}

/** Maps a work item's task type + priority to a 0..1 complexity factor. */
export function complexityOf(taskType: string, priority = 0): number {
  const base = taskType in DOMAINS ? domainOf(taskType).weight : 0.5;
  const nudge = (clamp(priority, 0, 100) / 100) * 0.2;
  return clamp(base + nudge, 0, 1);
}

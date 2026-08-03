/**
 * Recency-weighted reputation (spec §13/§14). Scores are ordered oldest→newest;
 * newer results carry more weight via geometric decay. Pure and stored nowhere.
 */
export const DEFAULT_DECAY = 0.7;

export function computeReputation(scores: number[], decay: number = DEFAULT_DECAY): number | null {
  if (scores.length === 0) {
    return null;
  }
  const n = scores.length;
  let weightedSum = 0;
  let weightTotal = 0;
  scores.forEach((score, i) => {
    const weight = Math.pow(decay, n - 1 - i);
    weightedSum += weight * score;
    weightTotal += weight;
  });
  return Math.round((weightedSum / weightTotal) * 100) / 100;
}

export function mean(scores: number[]): number | null {
  if (scores.length === 0) return null;
  return Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100) / 100;
}

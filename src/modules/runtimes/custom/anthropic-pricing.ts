/**
 * Estimated USD per million tokens by Claude model family. These are *estimates* used
 * only to feed Forge's budget circuit breakers for CustomRuntime workers (which, unlike
 * Claude Code, are billed per token and report no cost themselves). They are deliberately
 * conservative: an unknown model is priced at the most expensive tier, so the breaker can
 * only trip early, never late. Override with FORGE_PRICE_<FAMILY>_IN / _OUT (USD per MTok).
 */
interface Rate {
  inPerMTok: number;
  outPerMTok: number;
}

const DEFAULTS: Record<'opus' | 'sonnet' | 'haiku', Rate> = {
  opus: { inPerMTok: 15, outPerMTok: 75 },
  sonnet: { inPerMTok: 3, outPerMTok: 15 },
  haiku: { inPerMTok: 1, outPerMTok: 5 },
};

function family(model: string): keyof typeof DEFAULTS {
  const m = model.toLowerCase();
  if (m.includes('haiku')) return 'haiku';
  if (m.includes('sonnet')) return 'sonnet';
  return 'opus'; // opus and anything unrecognised: price high
}

function rateFor(model: string): Rate {
  const fam = family(model);
  const envIn = Number(process.env[`FORGE_PRICE_${fam.toUpperCase()}_IN`]);
  const envOut = Number(process.env[`FORGE_PRICE_${fam.toUpperCase()}_OUT`]);
  return {
    inPerMTok: Number.isFinite(envIn) && envIn > 0 ? envIn : DEFAULTS[fam].inPerMTok,
    outPerMTok: Number.isFinite(envOut) && envOut > 0 ? envOut : DEFAULTS[fam].outPerMTok,
  };
}

export function estimateAnthropicCostUsd(
  model: string,
  inputTokens: number,
  outputTokens: number,
): number {
  const r = rateFor(model);
  return (inputTokens * r.inPerMTok + outputTokens * r.outPerMTok) / 1_000_000;
}

import { Injectable, Logger } from '@nestjs/common';

export type LimitStatus = 'allowed' | 'allowed_warning' | 'rejected';

export interface UsageLimitState {
  runtimeKey: string;
  status: LimitStatus;
  /** When the limit resets (epoch ms), if the runtime told us. */
  resetsAt: number | null;
  /** Which window: five_hour, seven_day, seven_day_opus, ... */
  limitType: string | null;
  /** 0..1 share of the window used, when reported. */
  utilization: number | null;
  updatedAt: number;
}

/** When a limit is hit but no reset time is known, wait this long before trying again. */
const UNKNOWN_RESET_MS = 15 * 60_000;

/**
 * The subscription usage limits reported by runtimes (Claude Code sends a rate-limit event on
 * each run). Work for a runtime that hit its limit is held until the reset instead of failing
 * and burning retries; the console shows the current state.
 */
@Injectable()
export class UsageLimits {
  private readonly logger = new Logger(UsageLimits.name);
  private readonly states = new Map<string, UsageLimitState>();

  record(
    runtimeKey: string,
    info: {
      status: LimitStatus;
      resetsAt?: number | null;
      limitType?: string | null;
      utilization?: number | null;
    },
    now = Date.now(),
  ): UsageLimitState {
    const resetsAt = info.resetsAt ?? (info.status === 'rejected' ? now + UNKNOWN_RESET_MS : null);
    const state: UsageLimitState = {
      runtimeKey,
      status: info.status,
      resetsAt,
      limitType: info.limitType ?? null,
      utilization: info.utilization ?? null,
      updatedAt: now,
    };
    const before = this.states.get(runtimeKey);
    this.states.set(runtimeKey, state);
    if (info.status === 'rejected' && before?.status !== 'rejected') {
      this.logger.warn(
        `${runtimeKey} usage limit reached${resetsAt ? `; resets ${new Date(resetsAt).toISOString()}` : ''}`,
      );
    }
    return state;
  }

  /** Epoch ms until which new runs on this runtime should wait, or null when it can run now. */
  blockedUntil(runtimeKey: string, now = Date.now()): number | null {
    const s = this.states.get(runtimeKey);
    if (!s || s.status !== 'rejected') return null;
    if (s.resetsAt !== null && s.resetsAt <= now) return null;
    return s.resetsAt;
  }

  snapshot(now = Date.now()): UsageLimitState[] {
    return [...this.states.values()].map((s) =>
      s.status === 'rejected' && s.resetsAt !== null && s.resetsAt <= now
        ? { ...s, status: 'allowed' as const }
        : s,
    );
  }
}

/** Recognises a usage-limit or out-of-credit failure from error text (runtimes without structured events). */
export function looksLikeUsageLimit(error: string | undefined): boolean {
  return Boolean(
    error &&
    /usage limit|rate limit|limit reached|too many requests|\b429\b|\b402\b|insufficient (credits|quota|funds|balance)|quota exceeded|out of credits/i.test(
      error,
    ),
  );
}

/**
 * Where work goes while a runtime is at its limit: the OpenAI-compatible fallback endpoint (an
 * AI gateway such as OmniRoute or OpenRouter), when configured with a model. Never falls back from
 * the fallback itself — if that runs out too, work waits for a reset like before.
 */
export function fallbackSelection(
  blockedRuntime: string,
  env: NodeJS.ProcessEnv = process.env,
): { runtimeKey: string; provider: string; model: string } | null {
  if (blockedRuntime === 'custom') return null;
  if (env.FORGE_FALLBACK_AUTO === '0') return null;
  const base = env.FORGE_FALLBACK_BASE_URL?.trim();
  const model = env.FORGE_FALLBACK_MODEL?.trim();
  if (!base || !model) return null;
  return { runtimeKey: 'custom', provider: 'openai', model };
}

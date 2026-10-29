import { Injectable } from '@nestjs/common';
import { RuntimeRegistry } from './runtime-registry';
import { ProviderRegistry } from './custom/provider-registry';

export interface Availability {
  available: boolean;
  reason?: string;
}

const OLLAMA_CACHE_MS = 30_000;
const OLLAMA_PROBE_MS = 1_500;

/**
 * Can an employee's configured runtime actually run right now? The router uses this so work
 * is never handed to someone who can only fail (observed live: a demo worker on a local LLM
 * that wasn't running was assigned real work).
 */
@Injectable()
export class RuntimeAvailability {
  private ollama?: { host: string; ok: boolean; at: number };

  constructor(
    private readonly runtimes: RuntimeRegistry,
    private readonly providers: ProviderRegistry,
  ) {}

  async check(runtimeKey: string, provider?: string | null): Promise<Availability> {
    if (!this.runtimes.has(runtimeKey)) {
      return { available: false, reason: `runtime '${runtimeKey}' is not installed` };
    }
    if (runtimeKey !== 'custom') return { available: true };

    const name = provider ?? 'anthropic';
    if (!this.providers.has(name)) {
      return { available: false, reason: `model provider '${name}' is not installed` };
    }
    if (name === 'anthropic') {
      return process.env.FORGE_ANTHROPIC_API_KEY
        ? { available: true }
        : { available: false, reason: 'FORGE_ANTHROPIC_API_KEY is not set' };
    }
    if (name === 'openai') {
      return process.env.FORGE_FALLBACK_BASE_URL
        ? { available: true }
        : { available: false, reason: 'FORGE_FALLBACK_BASE_URL is not set' };
    }
    if (name === 'ollama') {
      return (await this.ollamaReachable())
        ? { available: true }
        : { available: false, reason: 'Ollama is not reachable' };
    }
    return { available: true };
  }

  private async ollamaReachable(): Promise<boolean> {
    const host = (process.env.FORGE_OLLAMA_HOST ?? 'http://localhost:11434').replace(/\/+$/, '');
    if (this.ollama && this.ollama.host === host && Date.now() - this.ollama.at < OLLAMA_CACHE_MS) {
      return this.ollama.ok;
    }
    let ok = false;
    try {
      const res = await fetch(`${host}/api/tags`, { signal: AbortSignal.timeout(OLLAMA_PROBE_MS) });
      ok = res.ok;
    } catch {
      ok = false;
    }
    this.ollama = { host, ok, at: Date.now() };
    return ok;
  }
}

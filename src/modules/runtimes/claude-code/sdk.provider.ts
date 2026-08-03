import { Provider } from '@nestjs/common';
import { SdkMessage } from './message-normalizer';

export const SDK_QUERY = Symbol('SDK_QUERY');

export interface SdkQueryArgs {
  prompt: string;
  options: Record<string, unknown>;
}

export type SdkQueryFn = (args: SdkQueryArgs) => AsyncIterable<SdkMessage>;

/**
 * Provides the Claude Agent SDK `query` function (spec §9.1: SDK, not CLI).
 * Loaded lazily so the app boots even if the SDK isn't installed/authenticated;
 * it only throws when a Claude Code run is actually attempted without it.
 *
 * Auth: the SDK uses the Claude Code SUBSCRIPTION session (local OAuth or
 * CLAUDE_CODE_OAUTH_TOKEN). ANTHROPIC_API_KEY must NOT be set — see docs §7.1.
 */
export const sdkQueryProvider: Provider = {
  provide: SDK_QUERY,
  useFactory: (): SdkQueryFn => {
    let real: SdkQueryFn | undefined;
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const mod = require('@anthropic-ai/claude-agent-sdk');
      real = (args: SdkQueryArgs) => mod.query(args) as AsyncIterable<SdkMessage>;
    } catch {
      real = undefined;
    }
    return (args: SdkQueryArgs) => {
      if (!real) {
        throw new Error(
          "Claude Agent SDK ('@anthropic-ai/claude-agent-sdk') is not installed. " +
            'Install it and authenticate via the Claude Code subscription session.',
        );
      }
      return real(args);
    };
  },
};

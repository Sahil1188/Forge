import { ModelProvider } from './model-provider';

/**
 * Maps a provider name to its implementation. Tests register a scripted provider
 * to exercise CustomRuntime without any real API credentials.
 */
export class ProviderRegistry {
  private readonly providers = new Map<string, ModelProvider>();

  register(provider: ModelProvider): void {
    this.providers.set(provider.name, provider);
  }

  get(name: string): ModelProvider {
    const provider = this.providers.get(name);
    if (!provider) {
      throw new Error(`No model provider registered for '${name}'`);
    }
    return provider;
  }
}

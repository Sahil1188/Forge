import { Module } from '@nestjs/common';
import { sdkQueryProvider } from './claude-code/sdk.provider';
import { ClaudeCodeRuntime } from './claude-code/claude-code.runtime';
import { CustomRuntime } from './custom/custom.runtime';
import { ToolExecutor } from './custom/tool-executor';
import { ProviderRegistry } from './custom/provider-registry';
import { AnthropicMessagesProvider } from './custom/anthropic-messages.provider';
import { OllamaProvider } from './custom/ollama.provider';
import { OpenAICompatibleProvider } from './custom/openai-compatible.provider';
import { RuntimeRegistry } from './runtime-registry';
import { AgentRunsService } from './agent-runs.service';
import { RuntimeAvailability } from './runtime-availability';
import { UsageLimits } from './usage-limits';

@Module({
  providers: [
    sdkQueryProvider,
    ClaudeCodeRuntime,
    ToolExecutor,
    AnthropicMessagesProvider,
    OllamaProvider,
    OpenAICompatibleProvider,
    {
      // Built-in provider registry, seeded with the real providers.
      provide: ProviderRegistry,
      useFactory: (anthropic: AnthropicMessagesProvider, ollama: OllamaProvider, openai: OpenAICompatibleProvider) => {
        const registry = new ProviderRegistry();
        registry.register(anthropic);
        registry.register(ollama);
        registry.register(openai);
        return registry;
      },
      inject: [AnthropicMessagesProvider, OllamaProvider, OpenAICompatibleProvider],
    },
    CustomRuntime,
    RuntimeRegistry,
    AgentRunsService,
    RuntimeAvailability,
    UsageLimits,
  ],
  exports: [RuntimeRegistry, AgentRunsService, ProviderRegistry, RuntimeAvailability, UsageLimits],
})
export class RuntimesModule {}

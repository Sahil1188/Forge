import { Module } from '@nestjs/common';
import { sdkQueryProvider } from './claude-code/sdk.provider';
import { ClaudeCodeRuntime } from './claude-code/claude-code.runtime';
import { CustomRuntime } from './custom/custom.runtime';
import { ToolExecutor } from './custom/tool-executor';
import { ProviderRegistry } from './custom/provider-registry';
import { AnthropicMessagesProvider } from './custom/anthropic-messages.provider';
import { RuntimeRegistry } from './runtime-registry';
import { AgentRunsService } from './agent-runs.service';

@Module({
  providers: [
    sdkQueryProvider,
    ClaudeCodeRuntime,
    ToolExecutor,
    AnthropicMessagesProvider,
    {
      // Built-in provider registry, seeded with the real Anthropic provider.
      provide: ProviderRegistry,
      useFactory: (anthropic: AnthropicMessagesProvider) => {
        const registry = new ProviderRegistry();
        registry.register(anthropic);
        return registry;
      },
      inject: [AnthropicMessagesProvider],
    },
    CustomRuntime,
    RuntimeRegistry,
    AgentRunsService,
  ],
  exports: [RuntimeRegistry, AgentRunsService, ProviderRegistry],
})
export class RuntimesModule {}

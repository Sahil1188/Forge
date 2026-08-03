import { Global, Module, OnApplicationShutdown, Inject } from '@nestjs/common';
import postgres from 'postgres';
import { drizzleProvider, pgClientProvider, PG_CLIENT } from './drizzle.provider';

@Global()
@Module({
  providers: [pgClientProvider, drizzleProvider],
  exports: [drizzleProvider, pgClientProvider],
})
export class DatabaseModule implements OnApplicationShutdown {
  constructor(@Inject(PG_CLIENT) private readonly client: ReturnType<typeof postgres>) {}

  async onApplicationShutdown(): Promise<void> {
    await this.client.end({ timeout: 5 });
  }
}

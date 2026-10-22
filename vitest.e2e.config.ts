import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

// E2E tests — require a running PostgreSQL (see `npm run db:up`).
// They share one database and the global work queue, so run them sequentially
// in a single fork to avoid cross-spec contamination of assigned work items.
export default defineConfig({
  test: {
    globals: true,
    root: './',
    include: ['test/**/*.e2e-spec.ts'],
    // Never the live database: a running `forge serve` would pick up the suites' queued work.
    env: { DATABASE_URL: process.env.FORGE_TEST_DATABASE_URL ?? 'postgres://forge:forge@127.0.0.1:5433/forge_test' },
    setupFiles: ['test/setup-clean-queue.ts'],
    hookTimeout: 30_000,
    testTimeout: 30_000,
    fileParallelism: false,
    pool: 'forks',
    poolOptions: { forks: { singleFork: true } },
  },
  plugins: [swc.vite({ module: { type: 'es6' } })],
});

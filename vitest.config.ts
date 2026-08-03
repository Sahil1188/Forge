import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

// Unit tests only — no external services required (safe for CI without a DB).
export default defineConfig({
  test: {
    globals: true,
    root: './',
    include: ['src/**/*.spec.ts'],
  },
  // SWC transform gives us emitDecoratorMetadata so NestJS DI works in tests.
  plugins: [swc.vite({ module: { type: 'es6' } })],
});

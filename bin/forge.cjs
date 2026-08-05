#!/usr/bin/env node
/**
 * Global-install launcher for the Forge CLI. Registers tsx so the TypeScript
 * entrypoint (forge.ts) runs directly against the shipped `src/`, then hands off.
 * Local dev can also just use `npm run forge -- <command>`.
 */
try {
  require('tsx/cjs/api').register();
} catch {
  console.error('Forge CLI needs its dependencies. Run `npm install` in the Forge project first.');
  process.exit(1);
}
require('./forge.ts');

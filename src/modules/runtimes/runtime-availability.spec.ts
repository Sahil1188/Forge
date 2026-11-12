import { describe, it, expect, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { createServer, Server } from 'node:http';
import { AddressInfo } from 'node:net';
import { RuntimeAvailability } from './runtime-availability';
import { RuntimeRegistry } from './runtime-registry';
import { ProviderRegistry } from './custom/provider-registry';
import { AgentRuntime } from './runtime.port';
import { ModelProvider } from './custom/model-provider';

const runtime = (key: string) =>
  ({ key, run: vi.fn(), resume: vi.fn() }) as unknown as AgentRuntime;
const provider = (name: string) => ({ name, chat: vi.fn() }) as unknown as ModelProvider;

function make(): RuntimeAvailability {
  const runtimes = new RuntimeRegistry(runtime('claude_code') as never, runtime('custom') as never);
  const providers = new ProviderRegistry();
  providers.register(provider('anthropic'));
  providers.register(provider('ollama'));
  return new RuntimeAvailability(runtimes, providers);
}

describe('RuntimeAvailability', () => {
  let ollama: Server;
  let ollamaUrl: string;

  beforeAll(async () => {
    ollama = createServer((req, res) => {
      res.writeHead(req.url === '/api/tags' ? 200 : 404, { 'content-type': 'application/json' });
      res.end('{"models":[]}');
    });
    await new Promise<void>((r) => ollama.listen(0, '127.0.0.1', r));
    ollamaUrl = `http://127.0.0.1:${(ollama.address() as AddressInfo).port}`;
  });
  afterAll(() => new Promise<void>((r) => ollama.close(() => r())));
  afterEach(() => vi.unstubAllEnvs());

  it('claude_code is available (it runs on the operator’s Claude Code login)', async () => {
    expect(await make().check('claude_code')).toEqual({ available: true });
  });

  it('an unregistered runtime is unavailable, with a reason', async () => {
    const r = await make().check('quantum');
    expect(r.available).toBe(false);
    expect(r.reason).toMatch(/quantum/);
  });

  it('custom + an unknown provider is unavailable', async () => {
    expect((await make().check('custom', 'mystery')).available).toBe(false);
  });

  it('custom + anthropic needs FORGE_ANTHROPIC_API_KEY', async () => {
    vi.stubEnv('FORGE_ANTHROPIC_API_KEY', '');
    expect((await make().check('custom', 'anthropic')).reason).toMatch(/FORGE_ANTHROPIC_API_KEY/);
    vi.stubEnv('FORGE_ANTHROPIC_API_KEY', 'sk-ant-x');
    expect(await make().check('custom', 'anthropic')).toEqual({ available: true });
  });

  it('custom with no provider defaults to anthropic', async () => {
    vi.stubEnv('FORGE_ANTHROPIC_API_KEY', '');
    expect((await make().check('custom')).available).toBe(false);
  });

  it('custom + ollama is available only when the server answers', async () => {
    vi.stubEnv('FORGE_OLLAMA_HOST', ollamaUrl);
    expect(await make().check('custom', 'ollama')).toEqual({ available: true });
    vi.stubEnv('FORGE_OLLAMA_HOST', 'http://127.0.0.1:9'); // nothing listens on the discard port
    const r = await make().check('custom', 'ollama');
    expect(r.available).toBe(false);
    expect(r.reason).toMatch(/Ollama/);
  });

  it('caches the Ollama probe per host', async () => {
    vi.stubEnv('FORGE_OLLAMA_HOST', ollamaUrl);
    const a = make();
    const spy = vi.spyOn(globalThis, 'fetch');
    await a.check('custom', 'ollama');
    await a.check('custom', 'ollama');
    expect(spy).toHaveBeenCalledTimes(1);
    spy.mockRestore();
  });
});

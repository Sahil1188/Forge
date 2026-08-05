import { describe, it, expect, afterEach } from 'vitest';
import { createCommandSandbox, HostCommandSandbox, DockerCommandSandbox } from './command-sandbox';

describe('command sandbox', () => {
  afterEach(() => {
    delete process.env.FORGE_SANDBOX;
  });

  it('defaults to the host sandbox', () => {
    delete process.env.FORGE_SANDBOX;
    expect(createCommandSandbox()).toBeInstanceOf(HostCommandSandbox);
  });

  it('selects the Docker sandbox when FORGE_SANDBOX=docker', () => {
    process.env.FORGE_SANDBOX = 'docker';
    const sb = createCommandSandbox();
    expect(sb).toBeInstanceOf(DockerCommandSandbox);
    expect(sb.kind).toBe('docker');
  });

  it('host sandbox runs a command and returns its output', async () => {
    const result = await new HostCommandSandbox().run('echo forge-ok', process.cwd());
    expect(result.isError).toBe(false);
    expect(result.output).toContain('forge-ok');
  });

  it('host sandbox flags a failing command as an error', async () => {
    const result = await new HostCommandSandbox().run('exit 1', process.cwd());
    expect(result.isError).toBe(true);
  });
});

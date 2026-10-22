import { describe, it, expect } from 'vitest';
import { agentEnv, commandEnv } from './safe-env';

const SERVER_ENV = {
  PATH: '/usr/bin',
  HOME: '/home/op',
  DATABASE_URL: 'postgres://forge:secret@localhost/forge',
  ANTHROPIC_API_KEY: 'sk-ant-api03-xxx',
  FORGE_API_TOKEN: 'tok',
  OPENAI_API_KEY: 'sk-xxx',
  AWS_SECRET_ACCESS_KEY: 'aws',
  GITHUB_TOKEN: 'ghp_x',
  CLAUDE_CODE_OAUTH_TOKEN: 'sk-ant-oat01-xxx',
  HTTPS_PROXY: 'http://proxy:8080',
} as NodeJS.ProcessEnv;

describe('child process environments', () => {
  it('the agent gets toolchain, proxy and subscription auth — no server secrets, no API key', () => {
    const env = agentEnv(SERVER_ENV);
    expect(env).toMatchObject({ PATH: '/usr/bin', HOME: '/home/op', HTTPS_PROXY: 'http://proxy:8080', CLAUDE_CODE_OAUTH_TOKEN: 'sk-ant-oat01-xxx' });
    for (const k of ['DATABASE_URL', 'ANTHROPIC_API_KEY', 'FORGE_API_TOKEN', 'OPENAI_API_KEY', 'AWS_SECRET_ACCESS_KEY', 'GITHUB_TOKEN']) {
      expect(env[k], k).toBeUndefined();
    }
  });

  it('tests and acceptance checks get no credentials at all', () => {
    const env = commandEnv(SERVER_ENV);
    expect(env.PATH).toBe('/usr/bin');
    expect(env.CI).toBe('1');
    expect(env.CLAUDE_CODE_OAUTH_TOKEN).toBeUndefined();
    expect(env.DATABASE_URL).toBeUndefined();
  });

  it('operators can pass extra names through, but never the secrets that matter most', () => {
    const env = commandEnv({ ...SERVER_ENV, FORGE_CHILD_ENV_PASSTHROUGH: 'GITHUB_TOKEN, DATABASE_URL,ANTHROPIC_API_KEY' } as NodeJS.ProcessEnv);
    expect(env.GITHUB_TOKEN).toBe('ghp_x');
    expect(env.DATABASE_URL).toBeUndefined();
    expect(env.ANTHROPIC_API_KEY).toBeUndefined();
  });
});

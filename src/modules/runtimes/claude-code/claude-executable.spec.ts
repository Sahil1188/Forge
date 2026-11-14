import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { claudeExecutable } from './claude-executable';

const dir = path.join('opt', 'bin');

describe('claudeExecutable', () => {
  it('uses FORGE_CLAUDE_PATH when set', () => {
    expect(claudeExecutable({ FORGE_CLAUDE_PATH: '/x/claude' }, () => true)).toBe('/x/claude');
  });

  it("leaves the SDK's bundled program alone when it is installed", () => {
    expect(
      claudeExecutable(
        { PATH: dir },
        () => true,
        () => true,
      ),
    ).toBeUndefined();
  });

  it('falls back to claude on PATH when the bundled program is missing', () => {
    const want = path.join(dir, 'claude');
    expect(
      claudeExecutable(
        { PATH: dir },
        () => false,
        (f) => f === want,
        'linux',
      ),
    ).toBe(want);
  });

  it('looks for claude.exe on Windows, including ~/.local/bin', () => {
    const want = path.join('home', '.local', 'bin', 'claude.exe');
    expect(
      claudeExecutable(
        { PATH: dir, USERPROFILE: 'home' },
        () => false,
        (f) => f === want,
        'win32',
      ),
    ).toBe(want);
  });

  it('returns undefined when nothing is found, so the SDK reports its own error', () => {
    expect(
      claudeExecutable(
        { PATH: dir },
        () => false,
        () => false,
      ),
    ).toBeUndefined();
  });
});

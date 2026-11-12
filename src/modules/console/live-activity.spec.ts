import { describe, expect, it } from 'vitest';
import { summariseLive } from './console.service';

describe('summariseLive', () => {
  it('counts actions and reports the latest one with its time', () => {
    const raw = [
      { kind: 'session', sessionId: 's', at: '2026-10-27T10:00:00.000Z' },
      {
        kind: 'tool_use',
        toolName: 'Read',
        input: { file_path: 'src/app.ts' },
        at: '2026-10-27T10:00:01.000Z',
      },
      {
        kind: 'assistant_text',
        text: 'Now I will   run the tests',
        at: '2026-10-27T10:00:02.000Z',
      },
      {
        kind: 'tool_use',
        toolName: 'Bash',
        input: { command: 'npm\n test' },
        at: '2026-10-27T10:00:03.000Z',
      },
    ]
      .map((e) => JSON.stringify(e))
      .join('\n');
    expect(summariseLive(raw)).toEqual({
      actions: 2,
      last: 'Bash: npm test',
      lastAt: '2026-10-27T10:00:03.000Z',
    });
  });

  it('copes with an empty or partly written file', () => {
    expect(summariseLive('')).toEqual({ actions: 0, last: null, lastAt: null });
    expect(summariseLive('{"kind":"tool_use","toolName":"Write"}\n{"kind":"tool_')).toEqual({
      actions: 1,
      last: 'Write',
      lastAt: null,
    });
  });
});

describe('summariseLive paths', () => {
  it('shows files relative to the project, not the agent’s private workspace', () => {
    const raw = JSON.stringify({
      kind: 'tool_use',
      toolName: 'Write',
      input: {
        file_path: String.raw`C:\Projects\Forge\workspaces\runs\83f14858-6e67-4b86-bdf7-ba4cbe0e38e6\apps\web\src\EquityBridge.tsx`,
      },
    });
    expect(summariseLive(raw).last).toBe(String.raw`Write: apps\web\src\EquityBridge.tsx`);
    const unix = JSON.stringify({
      kind: 'tool_use',
      toolName: 'Bash',
      input: {
        command:
          'cd /srv/forge/workspaces/runs/83f14858-6e67-4b86-bdf7-ba4cbe0e38e6/apps && npm test',
      },
    });
    expect(summariseLive(unix).last).toBe('Bash: cd apps && npm test');
  });
});

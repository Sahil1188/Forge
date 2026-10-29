import { describe, expect, it } from 'vitest';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import * as path from 'node:path';
import { boardBriefing, companyBriefing } from './ask-briefing';
import { readOnlyGate } from './ask.service';

const now = Date.parse('2026-10-27T10:00:00Z');

describe('boardBriefing', () => {
  const board = {
    goal: { title: 'Dealdesk', description: 'M&A workbench', status: 'active' },
    projects: [{ name: 'dealdesk', deliverablePath: 'C:/Forge Projects/dealdesk' }],
    totals: { items: 3, done: 1, failed: 0, running: 1, costUsd: 14 },
    items: [
      { id: 'a', title: 'Engine', status: 'done', assignee: { name: 'Grace', role: 'Engineer' }, dependsOn: [], costUsd: 3, runs: [{ status: 'completed', durationMs: 600_000, toolCallCount: 53, estimatedCostUsd: 3 }], evaluation: { status: 'passed', score: 100, dimensions: [] } },
      {
        id: 'b', title: 'Design', status: 'in_progress', assignee: { name: 'Noor', role: 'Designer' }, dependsOn: ['a'], costUsd: 5,
        runs: [{ status: 'running', startedAt: '2026-10-27T09:30:00Z', toolCallCount: 12, estimatedCostUsd: 1, live: { actions: 12, last: 'Edit: README.md', lastAt: '2026-10-27T09:58:00Z' } }],
        evaluation: { status: 'failed', score: 50, dimensions: [{ name: 'test', score: 0, command: 'npm test', output: 'Expected 5 got 4' }] },
      },
      { id: 'c', title: 'Frontend', status: 'assigned', assignee: { name: 'Mira', role: 'Frontend' }, dependsOn: ['b'], costUsd: 0, runs: [] },
    ],
  };

  it('says where the goal is, who does what, what each waits for, live activity and failing checks', () => {
    const text = boardBriefing(board, now);
    expect(text).toContain('Progress: 1/3 steps done, 1 running');
    expect(text).toContain('C:/Forge Projects/dealdesk');
    expect(text).toContain('Owner: Noor (Designer)');
    expect(text).toContain('Waits for: Design');
    expect(text).toContain('running for 30 min');
    expect(text).toContain('now: Edit: README.md (last action 2 min ago)');
    expect(text).toContain('FAILED test: `npm test`');
    expect(text).toContain('Expected 5 got 4');
    expect(text).toContain('queued (waiting for its turn');
  });
});

describe('companyBriefing', () => {
  it('lists goals with progress and the team with their models', () => {
    const text = companyBriefing({
      company: { name: 'Northwind' },
      stats: { activeGoals: 1, spendTotalUsd: 14 },
      goals: [{ title: 'Dealdesk', status: 'active', items: 6, done: 3, failed: 0, running: 1, costUsd: 14 }],
      team: [{ name: 'Grace', role: 'Engineer', department: 'engineering', status: 'active', runtimeConfig: { model: 'opus' } }],
    }, now);
    expect(text).toContain('Dealdesk (active): 3/6 done');
    expect(text).toContain('spendTotalUsd USD 14.00');
    expect(text).toContain('Grace, Engineer (engineering), model opus');
  });
});

describe('readOnlyGate', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'ask-'));
  const gate = readOnlyGate(dir);

  it('allows reading inside the project', async () => {
    expect((await gate('Read', { file_path: path.join(dir, 'a.txt') })).behavior).toBe('allow');
    expect((await gate('Grep', { pattern: 'x', path: dir })).behavior).toBe('allow');
  });

  it('refuses anything that writes or runs, and reading outside the project', async () => {
    for (const tool of ['Write', 'Edit', 'Bash', 'WebFetch', 'Task']) {
      expect((await gate(tool, { file_path: path.join(dir, 'a.txt'), command: 'rm -rf .' })).behavior).toBe('deny');
    }
    expect((await gate('Read', { file_path: path.join(dir, '..', 'secret.txt') })).behavior).toBe('deny');
  });
});

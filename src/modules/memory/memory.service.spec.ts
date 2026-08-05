import { describe, it, expect } from 'vitest';
import { MemoryService } from './memory.service';
import { AgentMemory } from './memory.schema';

/** Minimal fluent fake of the Drizzle select chain used by `recall`. */
function fakeDb(rows: AgentMemory[]): any {
  const chain: any = {
    select: () => chain,
    from: () => chain,
    where: () => chain,
    orderBy: () => chain,
    limit: () => Promise.resolve(rows),
  };
  return chain;
}

const now = Date.now();
const mem = (over: Partial<AgentMemory>): AgentMemory =>
  ({
    id: 'x',
    employeeId: 'e',
    kind: 'outcome',
    taskType: null,
    skillKey: null,
    content: 'c',
    salience: 50,
    sourceRunId: null,
    createdAt: new Date(now),
    ...over,
  }) as AgentMemory;

describe('MemoryService.recall', () => {
  it('ranks by salience with a task-type relevance boost', async () => {
    const rows = [
      mem({ content: 'general', salience: 40, taskType: null }),
      mem({ content: 'coding match', salience: 41, taskType: 'coding' }), // +30 => 71
      mem({ content: 'high other', salience: 90, taskType: 'qa' }),
    ];
    const svc = new MemoryService(fakeDb(rows));
    const top = await svc.recall('e', { taskType: 'coding', limit: 2 });
    expect(top.map((m) => m.content)).toEqual(['high other', 'coding match']);
  });

  it('recallBlock is empty for a new employee', async () => {
    const svc = new MemoryService(fakeDb([]));
    expect(await svc.recallBlock('e', 'coding')).toBe('');
  });

  it('recallBlock renders memories as bullet lines', async () => {
    const svc = new MemoryService(fakeDb([mem({ kind: 'lesson', content: 'do X' })]));
    const block = await svc.recallBlock('e', 'coding');
    expect(block).toContain('What you have learned');
    expect(block).toContain('- (lesson) do X');
  });
});

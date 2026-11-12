import { describe, it, expect } from 'vitest';
import { CandidateInput, scoreCandidate, selectBest } from './workforce/candidate-scoring';
import { DynamicOmniRouter } from './omni/dynamic-omni-router.service';
import type { EmployeeWithRelations } from '../employees/employees.schema';

describe('WorkforceRouter scoring', () => {
  const backendDev: CandidateInput = {
    id: 'dev',
    role: 'Backend Engineer',
    status: 'idle',
    skills: [
      { skillKey: 'node', level: 90 },
      { skillKey: 'sql', level: 80 },
    ],
  };
  const designer: CandidateInput = {
    id: 'designer',
    role: 'Designer',
    status: 'working',
    skills: [{ skillKey: 'figma', level: 95 }],
  };

  it('selects the best-fit candidate for a coding task', () => {
    const decision = selectBest('coding', [designer, backendDev]);
    expect(decision?.employeeId).toBe('dev');
  });

  it('rewards relevant skill, role match, and availability', () => {
    const dev = scoreCandidate('coding', backendDev);
    const des = scoreCandidate('coding', designer);
    expect(dev.score).toBeGreaterThan(des.score);
    expect(dev.reasons.role).toBe(100); // "Backend Engineer" matches coding roles
    expect(dev.reasons.availability).toBe(100); // idle
  });

  it('a proven track record wins work; newcomers start neutral, not at zero', () => {
    const proven = scoreCandidate('coding', { ...backendDev, reputation: 95 });
    const struggling = scoreCandidate('coding', { ...backendDev, reputation: 30 });
    const newcomer = scoreCandidate('coding', { ...backendDev, reputation: null });
    expect(proven.score).toBeGreaterThan(newcomer.score);
    expect(newcomer.score).toBeGreaterThan(struggling.score);
    expect(
      selectBest('coding', [
        { ...backendDev, id: 'b', reputation: 30 },
        { ...backendDev, id: 'a', reputation: 95 },
      ])?.employeeId,
    ).toBe('a');
  });

  it('returns null with no candidates', () => {
    expect(selectBest('coding', [])).toBeNull();
  });
});

describe('DynamicOmniRouter', () => {
  const router = new DynamicOmniRouter();

  function employee(
    policy: Record<string, unknown>,
    rc: Partial<{ runtimeKey: string; provider: string }> = {},
  ): EmployeeWithRelations {
    return {
      runtimeConfig: {
        runtimeKey: rc.runtimeKey ?? 'claude_code',
        provider: rc.provider ?? 'anthropic',
        modelPolicy: policy,
      },
    } as unknown as EmployeeWithRelations;
  }

  it('prefers a task-type-specific model over the default', () => {
    const emp = employee({
      default: 'claude-sonnet-4-6',
      byTaskType: { architecture: 'claude-opus-4-8' },
    });
    expect(router.selectModel({ taskType: 'architecture' }, emp).model).toBe('claude-opus-4-8');
    expect(router.selectModel({ taskType: 'coding' }, emp).model).toBe('claude-sonnet-4-6');
  });

  it('selects by complexity tier when no task-type mapping exists', () => {
    const emp = employee({
      byComplexity: { high: 'strong-model', low: 'cheap-model' },
      complexityThreshold: 0.6,
    });
    // architecture (0.9) is above threshold -> strong; qa (0.5) below -> cheap.
    expect(router.selectModel({ taskType: 'architecture' }, emp).model).toBe('strong-model');
    expect(router.selectModel({ taskType: 'qa' }, emp).model).toBe('cheap-model');
  });

  it('carries the provider for custom-runtime employees', () => {
    const emp = employee(
      { default: 'qwen2.5-coder' },
      { runtimeKey: 'custom', provider: 'ollama' },
    );
    const selection = router.selectModel({ taskType: 'coding' }, emp);
    expect(selection.runtimeKey).toBe('custom');
    expect(selection.provider).toBe('ollama');
    expect(selection.model).toBe('qwen2.5-coder');
  });

  it('falls back to a safe default when no policy is set', () => {
    const emp = { runtimeConfig: null } as unknown as EmployeeWithRelations;
    const selection = router.selectModel({ taskType: 'coding' }, emp);
    expect(selection.model).toBe('sonnet');
    expect(selection.runtimeKey).toBe('claude_code');
  });
});

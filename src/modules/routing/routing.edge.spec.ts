import { describe, it, expect } from 'vitest';
import { CandidateInput, scoreCandidate, selectBest } from './workforce/candidate-scoring';
import { DynamicOmniRouter } from './omni/dynamic-omni-router.service';
import { complexityOf } from '../performance/skill-math';
import type { EmployeeWithRelations } from '../employees/employees.schema';

const cand = (over: Partial<CandidateInput> & { id: string }): CandidateInput => ({
  role: 'Software Engineer',
  status: 'idle',
  skills: [{ skillKey: 'typescript', level: 80 }],
  ...over,
});

describe('WorkforceRouter — scoring edge cases', () => {
  it('an idle candidate beats an otherwise identical busy one', () => {
    const d = selectBest('coding', [cand({ id: 'busy', status: 'working' }), cand({ id: 'idle' })]);
    expect(d?.employeeId).toBe('idle');
  });

  it('an employee in error state is the worst choice, all else equal', () => {
    const idle = scoreCandidate('coding', cand({ id: 'a' })).score;
    const err = scoreCandidate('coding', cand({ id: 'b', status: 'error' })).score;
    expect(err).toBeLessThan(idle);
    expect(scoreCandidate('coding', cand({ id: 'b', status: 'error' })).reasons.availability).toBe(
      0,
    );
  });

  it('an unknown status gets a neutral availability, not a crash', () => {
    expect(
      scoreCandidate('coding', cand({ id: 'a', status: 'on_vacation' })).reasons.availability,
    ).toBe(50);
  });

  it('ties go to the first candidate (stable, deterministic)', () => {
    const d = selectBest('coding', [cand({ id: 'first' }), cand({ id: 'second' })]);
    expect(d?.employeeId).toBe('first');
  });

  it('a candidate with no skills scores zero on skill but is still routable', () => {
    const r = scoreCandidate('coding', cand({ id: 'a', skills: [] }));
    expect(r.reasons.skill).toBe(0);
    expect(selectBest('coding', [cand({ id: 'a', skills: [] })])?.employeeId).toBe('a');
  });

  it('only skills relevant to the task type are averaged when any match', () => {
    const r = scoreCandidate(
      'coding',
      cand({
        id: 'a',
        skills: [
          { skillKey: 'node', level: 100 },
          { skillKey: 'watercolour', level: 0 },
        ],
      }),
    );
    expect(r.reasons.skill).toBe(100);
  });

  it('falls back to all skills at half weight when none match the task hints', () => {
    const r = scoreCandidate(
      'devops',
      cand({ id: 'a', skills: [{ skillKey: 'watercolour', level: 40 }] }),
    );
    expect(r.reasons.skill).toBe(20);
  });

  it('skill matching is case-insensitive and substring-based', () => {
    expect(
      scoreCandidate('coding', cand({ id: 'a', skills: [{ skillKey: 'NodeJS', level: 70 }] }))
        .reasons.skill,
    ).toBe(70);
  });

  it('the department can supply the role affinity', () => {
    const noDept = scoreCandidate('devops', cand({ id: 'a', role: 'Wizard' })).reasons.role;
    const withDept = scoreCandidate(
      'devops',
      cand({ id: 'a', role: 'Wizard', department: 'Platform' }),
    ).reasons.role;
    expect(noDept).toBe(30);
    expect(withDept).toBe(100);
  });

  it('a domain expert wins work in their domain and loses work outside it', () => {
    const analyst = cand({
      id: 'fin',
      role: 'Senior financial analyst',
      department: 'Finance',
      skills: [{ skillKey: 'financial modeling', level: 95 }],
    });
    const coder = cand({
      id: 'dev',
      role: 'Senior backend engineer',
      department: 'Engineering',
      skills: [{ skillKey: 'typescript', level: 95 }],
    });
    expect(selectBest('finance', [coder, analyst])?.employeeId).toBe('fin');
    expect(selectBest('coding', [coder, analyst])?.employeeId).toBe('dev');
  });

  it('the generic task type has no role/skill hints but still routes', () => {
    const d = selectBest('generic', [cand({ id: 'a' })]);
    expect(d?.employeeId).toBe('a');
  });

  it('an unknown task type does not throw', () => {
    expect(() => selectBest('time-travel', [cand({ id: 'a' })])).not.toThrow();
  });

  it('scores are bounded to 0..100 and rounded to 2 decimals', () => {
    const best = scoreCandidate(
      'coding',
      cand({ id: 'a', skills: [{ skillKey: 'node', level: 100 }], role: 'Backend Engineer' }),
    );
    expect(best.score).toBeLessThanOrEqual(100);
    expect(best.score).toBeGreaterThanOrEqual(0);
    expect(Number.isInteger(best.score * 100)).toBe(true);
    expect(
      scoreCandidate('coding', cand({ id: 'z', status: 'error', skills: [], role: 'Cook' })).score,
    ).toBeGreaterThanOrEqual(0);
  });

  it('architecture work prefers the architect over a generic engineer', () => {
    const d = selectBest('architecture', [
      cand({ id: 'eng', role: 'Software Engineer', skills: [{ skillKey: 'node', level: 90 }] }),
      cand({
        id: 'arch',
        role: 'Principal Architect',
        skills: [{ skillKey: 'system-design', level: 90 }],
      }),
    ]);
    expect(d?.employeeId).toBe('arch');
  });

  it('QA work prefers a QA role', () => {
    const d = selectBest('qa', [
      cand({ id: 'eng', skills: [{ skillKey: 'node', level: 80 }] }),
      cand({ id: 'qa', role: 'QA Engineer', skills: [{ skillKey: 'testing', level: 80 }] }),
    ]);
    expect(d?.employeeId).toBe('qa');
  });
});

describe('DynamicOmniRouter — edge cases', () => {
  const router = new DynamicOmniRouter();
  const emp = (policy: Record<string, unknown>, rc: Record<string, string> = {}) =>
    ({
      runtimeConfig: {
        runtimeKey: 'claude_code',
        provider: 'anthropic',
        modelPolicy: policy,
        ...rc,
      },
    }) as unknown as EmployeeWithRelations;

  it('an explicit byTaskType mapping beats the complexity tier', () => {
    const e = emp({
      byTaskType: { architecture: 'explicit' },
      byComplexity: { high: 'hi', low: 'lo' },
    });
    expect(router.selectModel({ taskType: 'architecture' }, e).model).toBe('explicit');
  });

  it('raising priority can push borderline work into the strong-model tier', () => {
    const e = emp({ byComplexity: { high: 'hi', low: 'lo' }, complexityThreshold: 0.7 });
    expect(complexityOf('qa', 0)).toBeLessThan(0.7);
    expect(router.selectModel({ taskType: 'qa', priority: 0 }, e).model).toBe('lo');
    // qa 0.5 + 100/100*0.2 = 0.7
    expect(router.selectModel({ taskType: 'qa', priority: 100 }, e).model).toBe('hi');
  });

  it('the default threshold is 0.6 (inclusive)', () => {
    const e = emp({ byComplexity: { high: 'hi', low: 'lo' } });
    expect(complexityOf('coding', 0)).toBe(0.6);
    expect(router.selectModel({ taskType: 'coding' }, e).model).toBe('hi');
    expect(router.selectModel({ taskType: 'generic' }, e).model).toBe('lo');
  });

  it('falls back to policy.default when no mapping or tier applies', () => {
    expect(router.selectModel({ taskType: 'qa' }, emp({ default: 'dflt' })).model).toBe('dflt');
  });

  it('an unmapped task type with only a byTaskType table uses the default', () => {
    const e = emp({ default: 'dflt', byTaskType: { architecture: 'big' } });
    expect(router.selectModel({ taskType: 'review' }, e).model).toBe('dflt');
  });

  it('preserves runtime key and provider from the employee config', () => {
    const s = router.selectModel(
      { taskType: 'coding' },
      emp({ default: 'm' }, { runtimeKey: 'custom', provider: 'ollama' }),
    );
    expect(s).toEqual({ runtimeKey: 'custom', provider: 'ollama', model: 'm' });
  });

  it('an employee without any runtime config still resolves safely', () => {
    const s = router.selectModel({ taskType: 'coding' }, {
      runtimeConfig: null,
    } as unknown as EmployeeWithRelations);
    expect(s).toEqual({ runtimeKey: 'claude_code', provider: 'anthropic', model: 'sonnet' });
  });
});

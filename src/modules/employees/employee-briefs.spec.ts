import { describe, expect, it } from 'vitest';
import {
  BRIEFS,
  SHARED_RULES,
  briefForEmployee,
  renderBrief,
  systemPromptFor,
} from './employee-briefs';
import { FULL_ORG } from '../console/org-template';

describe('employee briefs', () => {
  it('every member of the default organisation has a brief', () => {
    for (const m of FULL_ORG) expect(briefForEmployee(m)?.name, m.name).toBe(m.name);
    expect(BRIEFS).toHaveLength(FULL_ORG.length);
  });

  it('matches by name first, then by exact role, else none', () => {
    expect(briefForEmployee({ name: 'Grace', role: 'Whatever' })?.id).toBe('grace');
    expect(briefForEmployee({ name: 'New Person', role: 'Senior QA Engineer' })?.id).toBe('tom');
    expect(briefForEmployee({ name: 'New Person', role: 'Astronaut' })).toBeNull();
  });

  it('every brief is complete', () => {
    for (const b of BRIEFS) {
      expect(b.mission.length, b.id).toBeGreaterThan(20);
      for (const field of [
        'standards',
        'workflow',
        'definitionOfDone',
        'never',
        'escalateWhen',
      ] as const) {
        expect(b[field].length, `${b.id}.${field}`).toBeGreaterThan(0);
      }
      expect(b.deliverable.length, b.id).toBeGreaterThan(10);
    }
  });

  it('renders the brief with every section and no skill numbers', () => {
    const text = renderBrief(BRIEFS.find((b) => b.id === 'mira')!);
    for (const h of [
      '## Mission',
      '## Standards (non-negotiable)',
      '## How you work',
      '## Definition of done',
      '## Never',
      '## Stop and escalate when',
      '## You deliver',
    ]) {
      expect(text).toContain(h);
    }
    expect(text).not.toMatch(/\(\d{2}\)/);
  });

  it('builds the system prompt in cache order: shared rules, brief, brand, lessons', () => {
    const prompt = systemPromptFor('grace', {
      brandRules: 'BRAND-X',
      lessons: ['Do not repeat Y'],
    });
    const order = [SHARED_RULES.slice(0, 30), '# You are Grace', '# Brand rules', '# Lessons'].map(
      (s) => prompt.indexOf(s),
    );
    expect(order.every((i) => i >= 0)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
    expect(() => systemPromptFor('nobody')).toThrow('Unknown employee');
  });

  it('an edited brief replaces the built-in text but keeps the model tier and the person', () => {
    const edited = {
      mission: 'Ship the billing service.',
      standards: ['Money is integer pence.'],
      workflow: ['Read the ledger code first.'],
      definitionOfDone: [],
      never: [],
      escalateWhen: [],
      deliverable: 'A merged change.',
    };
    const b = briefForEmployee({ name: 'Grace', role: 'Senior Backend Engineer', brief: edited })!;
    expect(b.mission).toBe('Ship the billing service.');
    expect(b.model).toEqual(BRIEFS.find((x) => x.id === 'grace')!.model);
    expect(renderBrief(b)).toContain('# You are Grace, Senior Backend Engineer');
    // A person with no built-in brief can still be given one.
    expect(briefForEmployee({ name: 'Zed', role: 'Astronaut', brief: edited })?.mission).toBe(
      'Ship the billing service.',
    );
  });
});

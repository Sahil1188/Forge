import { describe, it, expect } from 'vitest';
import * as vm from 'node:vm';
import { UiController } from './ui.controller';

/**
 * Executes the dashboard's real inline script in a stubbed DOM and inspects what it
 * would render. Employee names/roles/models are operator- (or agent-) controlled data
 * that arrives over the API, so they must never be interpreted as HTML.
 */
function harness(responses: Record<string, unknown>) {
  const html = new UiController().dashboard();
  const script = /<script>([\s\S]*?)<\/script>/.exec(html)![1];
  const els: Record<string, { value: string; innerHTML: string }> = {
    companyId: { value: 'c1', innerHTML: '' },
    employees: { value: '', innerHTML: '' },
    profile: { value: '', innerHTML: '' },
  };
  const sandbox: Record<string, unknown> = {
    document: { getElementById: (id: string) => els[id] },
    fetch: async (url: string) => ({
      ok: url in responses,
      status: url in responses ? 200 : 404,
      json: async () => responses[url],
    }),
  };
  vm.createContext(sandbox);
  vm.runInContext(`${script}\nthis.__api = { loadOverview, loadProfile };`, sandbox);
  return { els, api: sandbox.__api as { loadOverview(): Promise<void>; loadProfile(id: string): Promise<void> } };
}

const PAYLOAD = '<img src=x onerror=alert(1)>';

describe('dashboard /ui', () => {
  it('serves an HTML document', () => {
    const html = new UiController().dashboard();
    expect(html).toMatch(/^<!doctype html>/i);
    expect(html).toContain('Forge');
  });

  it('renders employees from the API', async () => {
    const { els, api } = harness({
      '/companies/c1/overview': {
        employees: [
          { id: 'e1', name: 'Ada', role: 'CEO', status: 'idle', defaultModel: 'claude-opus-4-8', latestRun: { status: 'completed', estimatedCostUsd: 0.1234 } },
        ],
      },
    });
    await api.loadOverview();
    expect(els.employees.innerHTML).toContain('Ada');
    expect(els.employees.innerHTML).toContain('claude-opus-4-8');
    expect(els.employees.innerHTML).toContain('completed · $0.1234');
  });

  it('shows an empty-state row when there are no employees', async () => {
    const { els, api } = harness({ '/companies/c1/overview': { employees: [] } });
    await api.loadOverview();
    expect(els.employees.innerHTML).toContain('No employees');
  });

  it('shows an error row (not an exception) when the API fails', async () => {
    const { els, api } = harness({});
    await api.loadOverview();
    expect(els.employees.innerHTML).toContain('Error');
  });

  it('does not inject HTML from an employee name or role (stored XSS)', async () => {
    const { els, api } = harness({
      '/companies/c1/overview': {
        employees: [{ id: 'e1', name: PAYLOAD, role: PAYLOAD, status: 'idle', defaultModel: PAYLOAD, latestRun: null }],
      },
    });
    await api.loadOverview();
    expect(els.employees.innerHTML).not.toContain('<img');
    expect(els.employees.innerHTML).toContain('&lt;img');
  });

  it('does not inject HTML via an unexpected status value', async () => {
    const { els, api } = harness({
      '/companies/c1/overview': {
        employees: [{ id: 'e1', name: 'x', role: 'y', status: '"><script>alert(1)</script>', latestRun: null }],
      },
    });
    await api.loadOverview();
    expect(els.employees.innerHTML).not.toContain('<script>');
  });

  it('does not break out of the onclick handler via a hostile id', async () => {
    const { els, api } = harness({
      '/companies/c1/overview': {
        employees: [{ id: "');alert(1);('", name: 'x', role: 'y', status: 'idle', latestRun: null }],
      },
    });
    await api.loadOverview();
    expect(els.employees.innerHTML).not.toContain("');alert(1)");
  });

  it('does not inject HTML from profile fields (name, role, skills, specializations)', async () => {
    const { els, api } = harness({
      '/employees/e1/profile': {
        employee: { name: PAYLOAD, role: PAYLOAD, skills: [{ skillKey: PAYLOAD, level: 5 }] },
        reputation: { overall: 90, samples: 3 },
        specializations: [{ taskType: PAYLOAD, reputation: 80 }],
        recentPerformance: [],
      },
    });
    await api.loadProfile('e1');
    expect(els.profile.innerHTML).not.toContain('<img');
    expect(els.profile.innerHTML).toContain('&lt;img');
  });

  it('renders a profile with reputation and skills', async () => {
    const { els, api } = harness({
      '/employees/e1/profile': {
        employee: { name: 'Grace', role: 'Engineer', skills: [{ skillKey: 'node', level: 92 }] },
        reputation: { overall: 88, samples: 4 },
        specializations: [{ taskType: 'coding', reputation: 90 }],
        recentPerformance: [{}, {}],
      },
    });
    await api.loadProfile('e1');
    expect(els.profile.innerHTML).toContain('Grace');
    expect(els.profile.innerHTML).toContain('node 92');
    expect(els.profile.innerHTML).toContain('coding (90)');
    expect(els.profile.innerHTML).toContain('2 evaluated');
  });
});

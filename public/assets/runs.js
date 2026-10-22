import { ago, badge, duration, empty, html, icon, kpi, money, pageHead, searchBox, tabs, transcript } from './lib.js';

const TABS = [
  ['all', 'All', () => true],
  ['work', 'Work', (r) => r.kind === 'work'],
  ['planning', 'Planning', (r) => r.kind === 'planning'],
  ['failed', 'Stopped or failed', (r) => /^(failed|killed_)/.test(r.status)],
];

export async function render(ctx) {
  const all = await ctx.api(`/companies/${ctx.company.id}/runs`);
  const tab = TABS.find((t) => t[0] === ctx.query.get('tab')) ?? TABS[0];
  const rows = all.filter(tab[2]);
  if (all.some((r) => r.status === 'running')) ctx.poll(4000);
  const spend = all.reduce((a, r) => a + (r.estimatedCostUsd ?? 0), 0);
  const done = all.filter((r) => r.durationMs);
  const avg = done.length ? done.reduce((a, r) => a + r.durationMs, 0) / done.length : null;

  return html`${pageHead({
    title: 'Runs',
    desc: 'Every time an employee worked: what ran, for how long, and what it cost. Open one to read its transcript.',
  })}

  <section class="grid-4" aria-label="Run totals">
    ${kpi('Runs', all.length, 'Most recent 200')}
    ${kpi('Running now', all.filter((r) => r.status === 'running').length, 'Updates automatically')}
    ${kpi('Average time', duration(avg), 'Per finished run')}
    ${kpi('Spend', money(spend), 'Across these runs')}
  </section>

  <div style="display:flex;flex-direction:column;gap:var(--space-4)">
    <div class="toolbar">
      ${tabs(TABS.map(([key, text, fn]) => ({ key, text, href: key === 'all' ? '#/runs' : `#/runs?tab=${key}`, count: all.filter(fn).length })), tab[0])}
      ${searchBox('#runs-table', 'Filter by person or work')}
    </div>
    ${rows.length
      ? html`<div class="table-wrap" id="runs-table"><table class="table">
          <thead><tr><th>Employee</th><th>Work</th><th>Status</th><th class="hide-sm">Model</th><th class="hide-sm">Time</th><th class="r hide-sm">Tools</th><th class="r">Cost</th><th class="hide-sm">Started</th><th></th></tr></thead>
          <tbody>${rows.map(
            (r) => html`<tr data-text="${r.employeeName} ${r.workItemTitle ?? 'planning'} ${r.model ?? ''}">
              <td class="primary">${r.employeeName}</td>
              <td class="clip">${r.kind === 'planning'
                ? html`<a href="#/work/${r.goalId}" class="secondary">Planning</a>`
                : r.goalId ? html`<a href="#/work/${r.goalId}" class="secondary">${r.workItemTitle}</a>` : r.workItemTitle ?? '—'}</td>
              <td>${badge(r.status)}</td>
              <td class="hide-sm"><span class="id">${r.model ?? r.runtimeKey}</span></td>
              <td class="num hide-sm">${duration(r.durationMs)}</td>
              <td class="r num hide-sm">${r.toolCallCount}</td>
              <td class="r num">${money(r.estimatedCostUsd)}</td>
              <td class="hide-sm">${ago(r.startedAt)}</td>
              <td class="r"><button class="btn btn-sm btn-ghost" data-action="transcript" data-run="${r.id}" aria-label="Transcript">${icon('terminal')}<span class="hide-sm">Transcript</span></button></td>
            </tr>`,
          )}
          <tr class="no-match" hidden><td colspan="9" class="muted">No runs match that filter.</td></tr>
          </tbody></table></div>`
      : empty('activity', 'No runs yet', 'Runs appear here as soon as an employee starts working.')}
  </div>`;
}

export const actions = {
  async transcript(el, ctx) {
    const t = await ctx.api(`/agent-runs/${el.dataset.run}/transcript`);
    ctx.openPanel(`Transcript · ${t.run.model ?? t.run.runtimeKey}`, transcript(t));
  },
};

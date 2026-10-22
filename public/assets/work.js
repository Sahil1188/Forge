import { ago, badge, empty, html, icon, money, pageHead, progress, searchBox, tabs } from './lib.js';

const TABS = [
  ['all', 'All', () => true],
  ['active', 'In progress', (g) => g.status === 'active'],
  ['attention', 'Needs attention', (g) => g.waiting > 0 || g.failed > 0],
  ['completed', 'Completed', (g) => g.status === 'completed'],
  ['draft', 'Drafts', (g) => g.status === 'draft'],
];

export async function render(ctx) {
  const d = await ctx.api(`/companies/${ctx.company.id}/dashboard`);
  const tab = TABS.find((t) => t[0] === ctx.query.get('tab')) ?? TABS[0];
  const rows = d.goals.filter(tab[2]);
  if (d.goals.some((g) => g.status === 'active')) ctx.poll(5000);

  return html`${pageHead({
    title: 'Work',
    desc: 'Every task and goal you have given the team, newest first.',
    actions: html`<button class="btn" data-action="new-task" data-mode="goal">${icon('target')}New goal</button>
      <button class="btn btn-primary" data-action="new-task">${icon('plus')}New task</button>`,
  })}

  <div style="display:flex;flex-direction:column;gap:var(--space-4)">
    <div class="toolbar">
      ${tabs(
        TABS.map(([key, text, fn]) => ({ key, text, href: key === 'all' ? '#/work' : `#/work?tab=${key}`, count: d.goals.filter(fn).length })),
        tab[0],
      )}
      ${searchBox('#work-table', 'Filter work')}
    </div>

    ${rows.length
      ? html`<div class="table-wrap" id="work-table"><table class="table">
          <thead><tr><th>Title</th><th class="hide-sm">Type</th><th>Status</th><th class="hide-sm">Progress</th><th class="r hide-sm">Cost</th><th class="hide-sm">Created</th></tr></thead>
          <tbody>${rows.map(
            (g) => html`<tr class="link" data-href="#/work/${g.id}" data-text="${g.title}">
              <td class="primary clip"><a href="#/work/${g.id}" style="color:inherit">${g.title}</a></td>
              <td class="hide-sm">${g.mode === 'direct' ? 'Task' : 'Goal'}</td>
              <td>${g.waiting ? badge('needs_approval') : g.failed && g.status === 'active' ? badge('failed', 'Has failures') : badge(g.status)}</td>
              <td class="hide-sm">${progress(g.done, g.items)}</td>
              <td class="r num hide-sm">${money(g.costUsd)}</td>
              <td class="hide-sm">${ago(g.createdAt)}</td>
            </tr>`,
          )}
          <tr class="no-match" hidden><td colspan="6" class="muted">No work matches that filter.</td></tr>
          </tbody></table>
          <div class="table-foot"><span>${rows.length} ${rows.length === 1 ? 'item' : 'items'}</span><span>Updates automatically</span></div></div>`
      : d.goals.length
        ? empty('work', `Nothing ${tab[1].toLowerCase()}`, 'Try another tab.')
        : empty('work', 'No work yet', 'Give your team its first task. It is assigned, built and checked automatically.', html`<button class="btn" data-action="new-task">${icon('plus')}New task</button>`)}
  </div>`;
}

import { ago, avatar, badge, empty, html, icon, pageHead, tabs, toast, when } from './lib.js';

export async function render(ctx) {
  const history = ctx.query.get('tab') === 'history';
  const [pending, decided] = await Promise.all([
    ctx.api(`/companies/${ctx.company.id}/approvals`),
    history ? ctx.api(`/companies/${ctx.company.id}/approvals?status=decided`) : null,
  ]);
  if (!history) ctx.poll(5000);

  return html`${pageHead({
    title: 'Approvals',
    desc: 'Runs pause here when an employee wants a tool that needs your sign-off. Set which tools need it under each employee’s permissions.',
  })}
  <div style="display:flex;flex-direction:column;gap:var(--space-4)">
    ${tabs([
      { key: 'pending', text: 'Pending', href: '#/approvals', count: pending.length },
      { key: 'history', text: 'History', href: '#/approvals?tab=history' },
    ], history ? 'history' : 'pending')}
    ${history ? historyView(decided) : pendingView(pending)}
  </div>`;
}

function pendingView(items) {
  if (!items.length) return empty('shield', 'Nothing is waiting for you', 'When a run needs your sign-off, it shows up here and pauses until you decide.');
  return html`<div style="display:flex;flex-direction:column;gap:var(--space-4)">${items.map(
    (a) => html`<article class="card">
      <div class="card-head" style="align-items:flex-start">
        <span class="person" style="gap:var(--space-3);align-items:flex-start">${avatar(a.employeeName)}
          <span style="display:flex;flex-direction:column;gap:2px">
            <span><b style="font-weight:600">${a.employeeName}</b> wants to use <b style="font-weight:600">${a.toolName}</b></span>
            <span class="help">${a.goalId ? html`<a href="#/work/${a.goalId}">${a.workItemTitle}</a>` : a.workItemTitle} · ${ago(a.createdAt)}</span>
          </span></span>
        ${badge('pending', 'Waiting')}
      </div>
      <pre class="out" style="max-height:240px">${JSON.stringify(a.requestedAction?.input ?? {}, null, 2)}</pre>
      <div class="actions" style="justify-content:flex-end">
        <button class="btn btn-link-danger" data-action="decide" data-id="${a.id}" data-decision="denied">Deny</button>
        <button class="btn" data-action="decide" data-id="${a.id}" data-decision="approved">${icon('check')}Approve</button>
      </div>
    </article>`,
  )}</div>`;
}

function historyView(items) {
  if (!items.length) return empty('inbox', 'No decisions yet', 'Approved and denied requests are listed here.');
  return html`<div class="table-wrap"><table class="table">
    <thead><tr><th>Employee</th><th>Tool</th><th class="hide-sm">Work</th><th>Decision</th><th class="hide-sm">Decided</th></tr></thead>
    <tbody>${items.map(
      (a) => html`<tr>
        <td><span class="person">${avatar(a.employeeName)}<span style="color:var(--ink)">${a.employeeName}</span></span></td>
        <td><span class="id" style="color:var(--ink-secondary)">${a.toolName}</span></td>
        <td class="clip hide-sm">${a.goalId ? html`<a class="secondary" href="#/work/${a.goalId}">${a.workItemTitle}</a>` : a.workItemTitle}</td>
        <td>${badge(a.status)}</td>
        <td class="hide-sm">${when(a.decidedAt)}</td>
      </tr>`,
    )}</tbody></table></div>`;
}

export const actions = {
  async decide(el, ctx) {
    await ctx.api(`/approvals/${el.dataset.id}/decision`, { method: 'POST', body: { decision: el.dataset.decision } });
    toast(el.dataset.decision === 'approved' ? 'Approved. The run continues.' : 'Denied. The step stops.');
    ctx.refreshChrome();
    ctx.refresh();
  },
};

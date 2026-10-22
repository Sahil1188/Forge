import { ago, badge, day, empty, html, icon, kpi, money, pageHead, progress } from './lib.js';

export async function render(ctx) {
  const d = await ctx.api(`/companies/${ctx.company.id}/dashboard`);
  const s = d.stats;
  if (d.goals.some((g) => g.status === 'active')) ctx.poll(5000);

  const max = Math.max(1, ...d.activity.map((a) => a.runs));
  const week = d.activity.reduce((a, x) => ({ runs: a.runs + x.runs, cost: a.cost + x.costUsd }), { runs: 0, cost: 0 });

  return html`${pageHead({
    eyebrow: d.company.name,
    title: 'Overview',
    desc: 'What your AI team is working on, and what needs you.',
    actions: html`<button class="btn btn-primary" data-action="new-task">${icon('plus')}New task</button>`,
  })}

  ${d.team.length === 0
    ? html`<div class="notice">${icon('team')}<span class="grow">Nobody works here yet. Add a CEO who plans and an engineer who builds to get started.</span>
        <button class="btn btn-sm" data-action="starter-team">Add starter team</button></div>`
    : ''}

  <section class="grid-4" aria-label="Key numbers">
    ${kpi('Active work', s.activeGoals, `${s.employees} ${s.employees === 1 ? 'employee' : 'employees'} on the team`)}
    ${kpi('Completed', s.completedGoals, s.pendingApprovals ? `${s.pendingApprovals} waiting for approval` : 'Nothing waiting for you', s.pendingApprovals ? 'warning' : '')}
    ${kpi('Success rate', d.successRate === null ? '—' : `${d.successRate}%`, 'Checks passed, last 30 days', d.successRate !== null && d.successRate >= 80 ? 'success' : '')}
    ${kpi('Spend today', money(s.spendTodayUsd), `${money(s.spendTotalUsd)} all time`)}
  </section>

  <section class="grid-main">
    <div class="card">
      <div class="card-head"><h2>Activity</h2><span class="muted num">${week.runs} ${week.runs === 1 ? 'run' : 'runs'} · ${money(week.cost)} this week</span></div>
      <div class="chart" role="img" aria-label="Agent runs per day for the last 7 days">
        ${d.activity.map(
          (a, i) => html`<div class="col ${i === d.activity.length - 1 ? 'today' : ''}" title="${day(a.date)}: ${a.runs} runs, ${money(a.costUsd)}">
            <span class="val">${a.runs}</span>
            <span class="b" style="height:${Math.round((a.runs / max) * 130)}px"></span>
            <span class="day">${i === d.activity.length - 1 ? 'Today' : day(a.date)}</span>
          </div>`,
        )}
      </div>
    </div>

    <div class="card">
      <div class="card-head"><h2>Needs attention</h2>${d.needsAttention.length ? html`<span class="badge warning">${d.needsAttention.length}</span>` : ''}</div>
      ${d.needsAttention.length
        ? html`<div class="rows">${d.needsAttention.slice(0, 6).map(
            (n) => html`<a class="rowi" href="${n.kind === 'approval' ? '#/approvals' : n.goalId ? `#/work/${n.goalId}` : '#/work'}">
              <span class="tile" style="color:var(--${n.kind === 'failed' ? 'danger' : 'warning'})">${icon(n.kind === 'approval' ? 'shield' : n.kind === 'failed' ? 'circleX' : 'retry')}</span>
              <span class="body"><span class="t">${n.title}</span><span class="s">${n.detail} · ${ago(n.at)}</span></span>
            </a>`,
          )}</div>`
        : html`<div class="empty" style="padding:var(--space-8) 0">${icon('circleCheck')}<h3>All clear</h3><p>Approvals and failed work show up here.</p></div>`}
    </div>
  </section>

  <section class="card card-flush">
    <div class="card-head"><h2>Recent work</h2><a class="btn btn-sm btn-ghost" href="#/work">View all${icon('chevronRight')}</a></div>
    ${d.goals.length
      ? html`<div style="overflow-x:auto"><table class="table">
          <thead><tr><th>Title</th><th class="hide-sm">Type</th><th>Status</th><th class="hide-sm">Progress</th><th class="r hide-sm">Cost</th><th class="hide-sm">Created</th></tr></thead>
          <tbody>${d.goals.slice(0, 8).map(
            (g) => html`<tr class="link" data-href="#/work/${g.id}">
              <td class="primary clip"><a href="#/work/${g.id}" style="color:inherit">${g.title}</a></td>
              <td class="hide-sm">${g.mode === 'direct' ? 'Task' : 'Goal'}</td>
              <td>${g.waiting ? badge('needs_approval') : badge(g.status)}</td>
              <td class="hide-sm">${progress(g.done, g.items)}</td>
              <td class="r num hide-sm">${money(g.costUsd)}</td>
              <td class="hide-sm">${ago(g.createdAt)}</td>
            </tr>`,
          )}</tbody></table></div>`
      : empty('work', 'No work yet', 'Give your team its first task. It is assigned, built and checked automatically.', html`<button class="btn" data-action="new-task">${icon('plus')}New task</button>`)}
  </section>`;
}

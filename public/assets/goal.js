import { ago, avatar, badge, duration, empty, html, icon, kpi, label, money, pageHead, person, toast, transcript, when } from './lib.js';

const expanded = new Set();
let lastGoal = null;

export async function render(ctx) {
  const id = ctx.params.id;
  if (lastGoal !== id) {
    expanded.clear();
    lastGoal = id;
  }
  const b = await ctx.api(`/goals/${id}/board`);
  const files = await Promise.all(b.projects.map((p) => ctx.api(`/projects/${p.id}/files`).catch(() => ({ files: [] }))));
  const live = b.goal.status === 'active' || b.totals.running > 0;
  if (live) ctx.poll(3000);
  for (const it of b.items) if (['in_progress', 'evaluating', 'needs_approval', 'failed'].includes(it.status)) expanded.add(it.id);
  const t = b.totals;
  const kind = b.goal.mode === 'direct' ? 'Task' : 'Goal';
  const allRuns = [...(b.planningRun ? [b.planningRun] : []), ...b.items.flatMap((i) => i.runs)];
  const time = allRuns.reduce((a, r) => a + (r.durationMs ?? 0), 0);
  const people = [...new Map(b.items.filter((i) => i.assignee).map((i) => [i.assignee.id, i.assignee])).values()];
  const waiting = b.items.some((i) => i.pendingApprovals.length);

  return html`${pageHead({
    eyebrow: html`<a href="#/work">Work</a> / ${kind}`,
    title: b.goal.title,
    desc: b.goal.description && b.goal.description !== b.goal.title ? b.goal.description : null,
    meta: html`${waiting ? badge('needs_approval') : badge(b.goal.status)}
      <span class="muted">${b.planningRun ? 'Planned by your CEO' : 'Direct task'} · Created ${when(b.goal.createdAt)}</span>
      ${live ? html`<span class="muted">· Updates automatically</span>` : ''}`,
    actions:
      b.goal.status === 'draft'
        ? html`<button class="btn btn-primary" data-action="start">${icon('play')}Start</button>`
        : b.projects.length && b.items.length
          ? html`<button class="btn" data-action="changes">${icon('retry')}Request changes</button>`
          : '',
  })}

  <section class="grid-4" aria-label="Summary">
    ${kpi('Progress', `${t.done} of ${t.items}`, t.failed ? `${t.failed} failed` : t.running ? `${t.running} working now` : t.items ? 'steps done' : 'Not planned yet', t.failed ? 'warning' : '')}
    ${kpi('Cost', money(t.costUsd), 'Planning and work')}
    ${kpi('Runs', allRuns.length, `${allRuns.filter((r) => r.status === 'completed').length} completed`)}
    ${kpi('Agent time', duration(time), people.length ? `${people.length} ${people.length === 1 ? 'person' : 'people'}` : 'Nobody assigned yet')}
  </section>

  ${b.items.length === 0 ? planningState(b) : ''}

  ${b.items.length
    ? html`<section class="card card-flush">
        <div class="card-head"><h2>Steps</h2><span class="muted num">${t.done} of ${t.items} done</span></div>
        <div style="overflow-x:auto"><table class="table">
          <thead><tr><th style="width:44px">#</th><th>Step</th><th>Status</th><th class="hide-sm">Assignee</th><th class="r hide-sm">Cost</th><th style="width:44px"></th></tr></thead>
          <tbody>${b.items.map((it, i) => item(it, i, b.goal))}</tbody>
        </table></div>
      </section>`
    : ''}

  <section class="grid-2">
    <div class="card">
      <div class="card-head"><h2>Details</h2></div>
      <dl class="kv">
        <dt>Type</dt><dd>${kind}</dd>
        <dt>Status</dt><dd>${badge(b.goal.status)}</dd>
        <dt>Created</dt><dd>${when(b.goal.createdAt)}</dd>
        <dt>People</dt><dd>${people.length ? html`<span style="display:flex;flex-wrap:wrap;gap:var(--space-3)">${people.map((p) => html`<a href="#/team/${p.id}" class="person" style="color:var(--ink)">${avatar(p.name)}${p.name}</a>`)}</span>` : html`<span class="muted">Nobody yet</span>`}</dd>
        <dt>ID</dt><dd class="id">${b.goal.id}</dd>
      </dl>
      ${b.goal.acceptance?.length
        ? html`<div style="display:flex;flex-direction:column;gap:var(--space-2)"><span class="label">Acceptance checks</span>
            <div class="checks">${b.goal.acceptance.map((c) => html`<div class="check-row">${icon('terminal')}<code>${c}</code></div>`)}</div></div>`
        : ''}
    </div>
    <div class="card">
      <div class="card-head"><h2>Deliverable</h2>${b.projects[0] ? html`<a class="btn btn-sm btn-ghost" href="#/deliverables/${b.projects[0].id}">Open${icon('chevronRight')}</a>` : ''}</div>
      ${b.projects.length
        ? b.projects.map((p, i) => deliverable(p, files[i]))
        : html`<p class="muted">The project is created when work is planned.</p>`}
    </div>
  </section>`;
}

function planningState(b) {
  if (b.goal.status === 'draft') {
    return html`<div class="notice">${icon('clock')}<span class="grow">Not started yet. Start it to plan and assign the work.</span></div>`;
  }
  if (b.planningRun?.status === 'failed') {
    return html`<div class="notice danger">${icon('alert')}<span class="grow">Planning failed${b.planningRun.error ? html`: ${b.planningRun.error}` : ''}</span>
      <button class="btn btn-sm" data-action="replan">${icon('retry')}Plan again</button></div>`;
  }
  return html`<div class="notice">${icon('clock')}<span class="grow">${b.goal.mode === 'direct' ? 'Setting up the task…' : 'Your CEO is planning this goal…'}</span><span>Updates automatically</span></div>`;
}

function item(it, i, goal) {
  const open = expanded.has(it.id);
  return html`<tr class="link" data-action="toggle" data-id="${it.id}" aria-expanded="${open}">
      <td class="id">${String(i + 1).padStart(2, '0')}</td>
      <td class="primary clip">${it.title}</td>
      <td>${it.pendingApprovals.length ? badge('needs_approval') : badge(it.status)}</td>
      <td class="hide-sm">${person(it.assignee)}</td>
      <td class="r num hide-sm">${money(it.costUsd)}</td>
      <td class="r muted">${icon(open ? 'chevronDown' : 'chevronRight')}</td>
    </tr>
    ${open ? html`<tr class="item-detail"><td colspan="6">${body(it, goal)}</td></tr>` : ''}`;
}

function body(it, goal) {
  const ev = it.evaluation;
  const dims = ev?.dimensions ?? [];
  return html`<div class="stack">
    ${it.description && it.description !== goal.description ? html`<p class="desc-text">${it.description}</p>` : ''}

    ${it.pendingApprovals.map(
      (a) => html`<div class="notice warning" style="align-items:flex-start">${icon('shield')}
        <div class="grow" style="display:flex;flex-direction:column;gap:var(--space-2);min-width:0">
          <span>Wants to use <b style="font-weight:600">${a.toolName}</b></span>
          <pre class="out">${JSON.stringify(a.requestedAction?.input ?? {}, null, 2)}</pre>
        </div>
        <div class="actions">
          <button class="btn btn-sm" data-action="decide" data-id="${a.id}" data-decision="approved">${icon('check')}Approve</button>
          <button class="btn btn-sm btn-link-danger" data-action="decide" data-id="${a.id}" data-decision="denied">Deny</button>
        </div></div>`,
    )}

    ${dims.length || it.acceptance.length
      ? html`<div style="display:flex;flex-direction:column;gap:var(--space-2)">
          <span class="label">Checks${ev ? html` · ${label(ev.status)}` : ''}</span>
          <div class="checks">${dims.length
            ? dims.map(
                (d) => html`<div class="check-row">${d.score === 100 ? badge('passed', 'Pass') : badge('failed', 'Fail')}<code>${d.name.startsWith('acceptance') ? d.command : `npm run ${d.name}`}</code></div>
                  ${d.score !== 100 && d.output ? html`<pre class="out">${d.output}</pre>` : ''}`,
              )
            : it.acceptance.map((c) => html`<div class="check-row">${badge('created', 'Pending')}<code>${c}</code></div>`)}</div></div>`
      : ev?.note
        ? html`<p class="muted">${ev.note}</p>`
        : ''}

    ${it.runs.length
      ? html`<div style="display:flex;flex-direction:column;gap:var(--space-2)"><span class="label">Runs</span>
          <div class="table-wrap"><table class="table">
          <thead><tr><th>Status</th><th class="hide-sm">Model</th><th>Time</th><th class="r hide-sm">Tools</th><th class="r">Cost</th><th class="hide-sm">Started</th><th></th></tr></thead><tbody>
          ${it.runs.map(
            (r) => html`<tr>
              <td>${badge(r.status)}</td><td class="hide-sm"><span class="id">${r.model ?? '—'}</span></td><td class="num">${duration(r.durationMs)}</td>
              <td class="r num hide-sm">${r.toolCallCount}</td><td class="r num">${money(r.estimatedCostUsd)}</td><td class="hide-sm">${ago(r.startedAt)}</td>
              <td class="r"><button class="btn btn-sm btn-ghost" data-action="transcript" data-run="${r.id}">${icon('terminal')}Transcript</button></td>
            </tr>${r.error ? html`<tr><td colspan="7" class="wrap"><pre class="out">${r.error}</pre></td></tr>` : ''}`,
          )}
          </tbody></table></div></div>`
      : ''}

    ${['failed', 'rework', 'created', 'assigned', 'needs_approval'].includes(it.status)
      ? html`<div class="actions" style="justify-content:flex-end">
          ${['created', 'assigned', 'rework', 'needs_approval'].includes(it.status) ? html`<button class="btn btn-sm btn-link-danger" data-action="cancel" data-id="${it.id}">Cancel step</button>` : ''}
          ${['failed', 'rework'].includes(it.status) ? html`<button class="btn btn-sm" data-action="retry" data-id="${it.id}">${icon('retry')}Retry</button>` : ''}
        </div>`
      : ''}
  </div>`;
}

function deliverable(p, listing) {
  const files = listing?.files ?? [];
  return html`<div style="display:flex;flex-direction:column;gap:var(--space-3)">
    ${files.length
      ? html`<div class="rows">${files.slice(0, 8).map(
          (f) => html`<a class="rowi" style="padding:var(--space-2) 0" href="#/deliverables/${p.id}?file=${encodeURIComponent(f)}">${icon('file')}<span class="body"><span class="t mono" style="font-weight:400">${f}</span></span></a>`,
        )}</div>${files.length > 8 ? html`<a href="#/deliverables/${p.id}">${files.length - 8} more files</a>` : ''}`
      : html`<p class="muted">Files appear here as finished work is merged.</p>`}
    <p class="help mono" title="Where the finished project lives" style="word-break:break-all">${p.deliverablePath}</p>
  </div>`;
}

export const forms = {
  async changes(data, form, ctx) {
    const res = await ctx.api(`/goals/${ctx.params.id}/changes`, {
      method: 'POST',
      body: { feedback: String(data.feedback ?? '').trim(), ...(data.step ? { workItemId: data.step } : {}) },
    });
    ctx.closeOverlay(true);
    toast(`Change requested. ${res.regressionChecks} earlier check${res.regressionChecks === 1 ? '' : 's'} must still pass.`);
    ctx.refresh();
  },
};

export const actions = {
  async changes(el, ctx) {
    const b = await ctx.api(`/goals/${ctx.params.id}/board`);
    ctx.openModal({
      title: 'Request changes',
      desc: 'Say what you’d like changed. Forge fixes just that, and everything that worked before must keep working.',
      body: html`<form class="form" data-form="changes">
        <label class="field"><span>What should change?</span>
          <textarea name="feedback" required minlength="3" maxlength="4000" rows="5" placeholder="The total in the summary sheet should include tax"></textarea></label>
        <label class="field"><span>Which part is it about? <span class="muted" style="font-weight:400">(optional)</span></span>
          <select name="step"><option value="">Let Forge work it out</option>${b.items
            .filter((i) => !i.title.startsWith('Change request:'))
            .map((i) => html`<option value="${i.id}">${i.title}${i.assignee ? ` — ${i.assignee.name}` : ''}</option>`)}</select>
          <span class="help">Picking a part sends the change to the person who built it.</span></label>
        <div class="form-foot"><button class="btn" type="button" data-action="close-overlay">Cancel</button><button class="btn btn-primary" type="submit">Request change</button></div>
      </form>`,
    });
  },
  toggle(el, ctx) {
    const id = el.dataset.id;
    if (expanded.has(id)) expanded.delete(id);
    else expanded.add(id);
    ctx.refresh();
  },
  async transcript(el, ctx) {
    const t = await ctx.api(`/agent-runs/${el.dataset.run}/transcript`);
    ctx.openPanel(`Transcript · ${t.run.model ?? t.run.runtimeKey}`, transcript(t));
  },
  async retry(el, ctx) {
    await ctx.api(`/work-items/${el.dataset.id}/retry`, { method: 'POST' });
    toast('Sent back to work');
    ctx.refresh();
  },
  async cancel(el, ctx) {
    if (!confirm('Cancel this step?')) return;
    await ctx.api(`/work-items/${el.dataset.id}/status`, { method: 'POST', body: { status: 'cancelled' } });
    toast('Step cancelled');
    ctx.refresh();
  },
  async decide(el, ctx) {
    await ctx.api(`/approvals/${el.dataset.id}/decision`, { method: 'POST', body: { decision: el.dataset.decision } });
    toast(el.dataset.decision === 'approved' ? 'Approved. The run continues.' : 'Denied');
    ctx.refreshChrome();
    ctx.refresh();
  },
  async start(el, ctx) {
    await ctx.api(`/goals/${ctx.params.id}/start`, { method: 'POST' });
    toast('Started');
    ctx.refresh();
  },
  async replan(el, ctx) {
    await ctx.api(`/goals/${ctx.params.id}/plan`, { method: 'POST' });
    toast('Planning again');
    ctx.refresh();
  },
};

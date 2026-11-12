import { ago, avatar, badge, duration, empty, html, icon, list, money, MODELS, pageHead, parseSkills, RUNTIMES, runtimeLabel, toast, openTranscript, when, runBadge, runCost } from './lib.js';

const SECTIONS = [
  ['profile', 'Profile'],
  ['brief', 'Brief'],
  ['skills', 'Skills'],
  ['permissions', 'Permissions'],
  ['budget', 'Budget'],
  ['memory', 'Memory'],
  ['runs', 'Runs'],
];

export async function render(ctx) {
  const id = ctx.params.id;
  const section = SECTIONS.find((s) => s[0] === ctx.query.get('s'))?.[0] ?? 'profile';
  const profile = await ctx.api(`/employees/${id}/profile`);
  const e = profile.employee;
  const rc = e.runtimeConfig ?? { runtimeKey: 'claude_code', provider: 'anthropic', modelPolicy: {}, settings: {} };

  let body;
  if (section === 'profile') body = await profileSection(ctx, e, rc, profile);
  else if (section === 'brief') body = briefSection(e, await ctx.api(`/employees/${id}/brief`));
  else if (section === 'skills') body = skillsSection(e);
  else if (section === 'permissions') body = permissionsSection(e);
  else if (section === 'budget') body = budgetSection(await ctx.api(`/employees/${id}/budget`));
  else if (section === 'memory') body = memorySection(e, await ctx.api(`/employees/${id}/memories`));
  else body = runsSection(await ctx.api(`/employees/${id}/runs`));

  return html`${pageHead({
    eyebrow: html`<a href="#/team">Team</a>`,
    title: html`<span class="person" style="gap:var(--space-3)">${avatar(e.name, 'lg')}<span>${e.name}</span></span>`,
    meta: html`${badge(e.status)}<span class="muted">${e.role}${e.department ? ` · ${e.department}` : ''} · ${runtimeLabel(rc)}</span>`,
  })}
  <div class="subnav-layout">
    <nav class="subnav" aria-label="Employee sections">${SECTIONS.map(
      ([key, text]) => html`<a href="#/team/${id}${key === 'profile' ? '' : `?s=${key}`}" ${key === section ? html`aria-current="page"` : ''}>${text}</a>`,
    )}</nav>
    <div style="display:flex;flex-direction:column;gap:var(--space-6);min-width:0">${body}</div>
  </div>`;
}

async function profileSection(ctx, e, rc, profile) {
  const people = await ctx.api(`/companies/${ctx.company.id}/team`);
  const rep = profile.reputation;
  const runtimeValue = `${rc.runtimeKey}|${rc.provider ?? 'anthropic'}`;
  return html`
  <section class="grid-3" aria-label="Performance">
    <div class="card kpi"><span class="k">Reputation</span><span class="v">${rep.overall ?? '—'}</span><span class="d">${rep.samples} evaluated ${rep.samples === 1 ? 'item' : 'items'}</span></div>
    <div class="card kpi"><span class="k">Strongest at</span><span class="v" style="font-family:var(--font-sans);font-size:var(--text-heading);line-height:var(--leading-numeric);font-weight:600">${profile.specializations?.[0]?.taskType ?? '—'}</span><span class="d">${profile.specializations?.length ? `${profile.specializations.length} task types seen` : 'Grows with evaluated work'}</span></div>
    <div class="card kpi"><span class="k">Model</span><span class="v mono" style="font-size:var(--text-small);line-height:var(--leading-numeric);font-weight:500">${rc.modelPolicy?.default ?? 'default'}</span><span class="d">${runtimeLabel(rc)}</span></div>
  </section>

  <form class="card" data-form="profile">
    <div class="card-head"><h2>Profile</h2></div>
    <div class="form">
      <div class="form-row">
        <label class="field"><span>Name</span><input name="name" value="${e.name}" required maxlength="200" /></label>
        <label class="field"><span>Role</span><input name="role" value="${e.role}" required maxlength="200" /></label>
      </div>
      <label class="field"><span>Reports to</span><select name="manager"><option value="">Nobody</option>${people
        .filter((p) => p.id !== e.id)
        .map((p) => html`<option value="${p.id}" ${p.id === e.managerEmployeeId ? html`selected` : ''}>${p.name} — ${p.role}</option>`)}</select></label>
    </div>
    <div class="card-head" style="margin-top:var(--space-4)"><h2>Runtime</h2></div>
    <div class="form">
      <div class="form-row">
        <label class="field"><span>Runs on</span><select name="runtime">${RUNTIMES.map((r) => html`<option value="${r.value}" ${r.value === runtimeValue ? html`selected` : ''}>${r.label}</option>`)}</select></label>
        <label class="field"><span>Model</span><input name="model" list="models" value="${rc.modelPolicy?.default ?? ''}" placeholder="${MODELS[0]}" /></label>
      </div>
      <div class="form-row">
        <label class="field"><span>Max turns</span><input name="maxTurns" type="number" min="1" max="200" value="${rc.settings?.maxTurns ?? ''}" placeholder="40" /></label>
        <label class="field"><span>Max tool calls</span><input name="maxToolCalls" type="number" min="1" max="1000" value="${rc.settings?.maxToolCalls ?? ''}" placeholder="50" /></label>
      </div>
      <datalist id="models">${[...MODELS, 'qwen2.5-coder'].map((m) => html`<option value="${m}"></option>`)}</datalist>
    </div>
    <div class="form-foot"><button class="btn btn-primary" type="submit">Save changes</button></div>
  </form>

  <section class="card">
    <div class="card-head"><div><h2>Remove from company</h2><p class="muted" style="margin-top:var(--space-1)">History is kept. Not possible while they have active work or direct reports.</p></div>
      <button class="btn btn-link-danger" data-action="deactivate">Remove employee</button></div>
  </section>`;
}

/** The brief fields a person edits; lists are one item per line. */
const BRIEF_FIELDS = [
  ['mission', 'Mission', 'One or two sentences: why this person exists.', false],
  ['standards', 'Standards', 'Non-negotiable rules for their craft. One per line.', true],
  ['workflow', 'How they work', 'The steps they follow on every task, in order. One per line.', true],
  ['definitionOfDone', 'Definition of done', 'A task is not done until every line is true. One per line.', true],
  ['never', 'Never', 'Hard rules they must not break. One per line.', true],
  ['escalateWhen', 'Stop and ask when', 'When to hand back instead of guessing. One per line.', true],
  ['deliverable', 'Hands back', 'What they deliver at the end of a task.', false],
];

function briefSection(e, data) {
  const b = data.brief;
  if (!b) {
    return html`<section class="card">${empty('book', 'No brief yet', `${e.name} works from the shared rules only. Write a brief below to give them a mission and standards.`)}</section>${briefForm(e, null, false)}`;
  }
  return briefForm(e, b, data.custom);
}

function briefForm(e, b, custom) {
  const value = (key, isList) => (b ? (isList ? (b[key] ?? []).join('\n') : (b[key] ?? '')) : '');
  return html`<form class="card" data-form="brief">
    <div class="card-head"><div><h2>Brief</h2><p class="muted" style="margin-top:var(--space-1)">What ${e.name} is told at the start of every task. Changes apply from their next task.</p></div>
      ${custom ? html`<span class="badge info">Edited</span>` : html`<span class="badge plain">Built-in</span>`}</div>
    <div class="form">
      ${BRIEF_FIELDS.map(
        ([key, label, help, isList]) => html`<label class="field"><span>${label}</span>
          <textarea name="${key}" rows="${isList ? 6 : 2}" required>${value(key, isList)}</textarea>
          <span class="help">${help}</span></label>`,
      )}
    </div>
    <div class="form-foot">
      ${custom ? html`<button class="btn btn-ghost" type="button" data-action="resetBrief">Reset to built-in</button>` : ''}
      <button class="btn btn-primary" type="submit">Save brief</button>
    </div>
  </form>`;
}

function skillsSection(e) {
  return html`<form class="card" data-form="skills">
    <div class="card-head"><div><h2>Skills</h2><p class="muted" style="margin-top:var(--space-1)">Routing prefers relevant skills. Evaluated work moves them up or down.</p></div></div>
    ${e.skills.length
      ? html`<div class="table-wrap"><table class="table"><thead><tr><th>Skill</th><th>Level</th><th class="r">Score</th></tr></thead><tbody>
          ${e.skills.map((s) => html`<tr><td class="primary">${s.skillKey}</td><td><span class="bar" style="width:160px"><span style="width:${s.level}%"></span></span></td><td class="r num">${s.level}</td></tr>`)}
        </tbody></table></div>`
      : ''}
    <label class="field"><span>Edit skills</span><textarea name="skills" rows="3">${e.skills.map((s) => `${s.skillKey} ${s.level}`).join(', ')}</textarea>
      <span class="help">Comma separated, each with a level from 0 to 100. For example: node 80, testing 60.</span></label>
    <div class="form-foot"><button class="btn btn-primary" type="submit">Save skills</button></div>
  </form>`;
}

function permissionsSection(e) {
  const gov = e.governance ?? {};
  return html`<form class="card" data-form="governance">
    <div class="card-head"><div><h2>Permissions</h2><p class="muted" style="margin-top:var(--space-1)">Which tools this employee may use. Work always stays inside its own repository.</p></div></div>
    <div class="form">
      <label class="field"><span>Needs your approval</span><input name="approval" value="${(gov.approvalRequiredTools ?? []).join(', ')}" placeholder="Bash, Write" />
        <span class="help">The run pauses in Approvals until you decide.</span></label>
      <div class="form-row">
        <label class="field"><span>Never allowed</span><input name="denied" value="${(gov.deniedTools ?? []).join(', ')}" placeholder="WebFetch" /></label>
        <label class="field"><span>Only allowed</span><input name="allowed" value="${(gov.allowedTools ?? []).join(', ')}" placeholder="Leave empty to allow all" /></label>
      </div>
    </div>
    <div class="form-foot"><button class="btn btn-primary" type="submit">Save permissions</button></div>
  </form>`;
}

function budgetSection(budget) {
  const limit = budget.hardLimit ?? budget.softLimit;
  return html`
  <section class="grid-3" aria-label="Spend">
    <div class="card kpi"><span class="k">${budget.period === 'total' ? 'Spent' : 'Spent today'}</span><span class="v">${money(budget.spend)}</span><span class="d">${limit ? `${Math.round((budget.spend / limit) * 100)}% of limit` : 'No limit set'}</span></div>
    <div class="card kpi"><span class="k">Soft limit</span><span class="v">${budget.softLimit ? money(budget.softLimit) : '—'}</span><span class="d">New runs wait</span></div>
    <div class="card kpi"><span class="k">Hard limit</span><span class="v">${budget.hardLimit ? money(budget.hardLimit) : '—'}</span><span class="d">Running work stops</span></div>
  </section>
  <form class="card" data-form="budget">
    <div class="card-head"><div><h2>Budget</h2><p class="muted" style="margin-top:var(--space-1)">Over the soft limit, new runs wait. At the hard limit, running work stops.</p></div></div>
    <div class="form">
      <div class="form-row">
        <label class="field"><span>Soft limit (USD)</span><input name="soft" type="number" step="0.01" min="0" value="${budget.softLimit ?? ''}" placeholder="None" /></label>
        <label class="field"><span>Hard limit (USD)</span><input name="hard" type="number" step="0.01" min="0" value="${budget.hardLimit ?? ''}" placeholder="None" /></label>
      </div>
      <label class="field"><span>Period</span><select name="period"><option value="day">Per day</option><option value="total" ${budget.period === 'total' ? html`selected` : ''}>All time</option></select></label>
    </div>
    <div class="form-foot"><button class="btn btn-primary" type="submit">Save budget</button></div>
  </form>`;
}

function memorySection(e, memories) {
  return html`<section class="card">
    <div class="card-head"><div><h2>Memory</h2><p class="muted" style="margin-top:var(--space-1)">What ${e.name} has learned from evaluated work. Used as context on similar tasks.</p></div></div>
    ${memories.length
      ? html`<div class="rows">${memories.map(
          (m) => html`<div class="rowi" style="align-items:flex-start">
            <span class="tile" style="color:var(--${m.kind === 'lesson' ? 'warning' : 'success'})">${icon(m.kind === 'lesson' ? 'alert' : 'circleCheck')}</span>
            <span class="body"><span class="t" style="white-space:normal;font-weight:400">${m.content}</span>
              <span class="s">${m.kind === 'lesson' ? 'Lesson' : 'What worked'} · ${m.taskType ?? 'General'} · ${when(m.createdAt)}</span></span>
          </div>`,
        )}</div>`
      : empty('book', 'Nothing learned yet', 'Lessons show up here after evaluated work.')}
  </section>`;
}

function runsSection(runs) {
  return html`<section class="card card-flush">
    <div class="card-head"><h2>Runs</h2><span class="muted num">${runs.length}</span></div>
    ${runs.length
      ? html`<div style="overflow-x:auto"><table class="table">
          <thead><tr><th>Status</th><th class="hide-sm">Model</th><th>Time</th><th class="r hide-sm">Tools</th><th class="r">Cost</th><th class="hide-sm">Started</th><th></th></tr></thead>
          <tbody>${runs.map(
            (r) => html`<tr><td>${runBadge(r)}</td><td class="hide-sm"><span class="id">${r.model ?? r.runtimeKey}</span></td><td class="num">${duration(r.durationMs)}</td>
              <td class="r num hide-sm">${r.toolCallCount}</td><td class="r num">${runCost(r)}</td><td class="hide-sm">${ago(r.startedAt)}</td>
              <td class="r"><button class="btn btn-sm btn-ghost" data-action="transcript" data-run="${r.id}" aria-label="Transcript">${icon('terminal')}<span class="hide-sm">Transcript</span></button></td></tr>`,
          )}</tbody></table></div>`
      : empty('activity', 'No runs yet', 'Runs appear here once this employee is given work.')}
  </section>`;
}

const num = (v) => (v === '' || v === undefined || v === null ? undefined : Number(v));

export const forms = {
  async profile(data, form, ctx) {
    const [runtimeKey, provider] = String(data.runtime).split('|');
    const settings = {};
    if (num(data.maxTurns)) settings.maxTurns = num(data.maxTurns);
    if (num(data.maxToolCalls)) settings.maxToolCalls = num(data.maxToolCalls);
    await ctx.api(`/employees/${ctx.params.id}`, {
      method: 'PATCH',
      body: {
        name: data.name,
        role: data.role,
        managerEmployeeId: data.manager || null,
        runtimeConfig: { runtimeKey, provider, ...(data.model ? { modelPolicy: { default: data.model } } : {}), settings },
      },
    });
    toast('Profile saved');
    ctx.refresh();
  },
  async brief(data, form, ctx) {
    const lines = (v) => String(v ?? '').split('\n').map((l) => l.trim()).filter(Boolean);
    const body = {};
    for (const [key, , , isList] of BRIEF_FIELDS) body[key] = isList ? lines(data[key]) : String(data[key] ?? '').trim();
    await ctx.api(`/employees/${ctx.params.id}/brief`, { method: 'PUT', body });
    toast('Brief saved');
    ctx.refresh();
  },
  async skills(data, form, ctx) {
    await ctx.api(`/employees/${ctx.params.id}/skills`, { method: 'PUT', body: { skills: parseSkills(data.skills) } });
    toast('Skills saved');
    ctx.refresh();
  },
  async governance(data, form, ctx) {
    const governance = {};
    if (list(data.approval).length) governance.approvalRequiredTools = list(data.approval);
    if (list(data.denied).length) governance.deniedTools = list(data.denied);
    if (list(data.allowed).length) governance.allowedTools = list(data.allowed);
    await ctx.api(`/employees/${ctx.params.id}`, { method: 'PATCH', body: { governance } });
    toast('Permissions saved');
    ctx.refresh();
  },
  async budget(data, form, ctx) {
    await ctx.api(`/employees/${ctx.params.id}/budget`, {
      method: 'PUT',
      body: { softLimitUsd: num(data.soft), hardLimitUsd: num(data.hard), period: data.period },
    });
    toast('Budget saved');
    ctx.refresh();
  },
};

export const actions = {
  async deactivate(el, ctx) {
    if (!confirm('Remove this employee from the company?')) return;
    await ctx.api(`/employees/${ctx.params.id}`, { method: 'DELETE' });
    toast('Employee removed');
    ctx.go('#/team');
  },
  async resetBrief(el, ctx) {
    if (!confirm('Go back to the built-in brief? Your edits are discarded.')) return;
    await ctx.api(`/employees/${ctx.params.id}/brief`, { method: 'DELETE' });
    toast('Brief reset');
    ctx.refresh();
  },
  async transcript(el, ctx) {
    await openTranscript(ctx, el.dataset.run);
  },
};

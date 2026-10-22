import { ago, avatar, badge, empty, html, icon, MODELS, pageHead, parseSkills, RUNTIMES, runtimeLabel, searchBox, tabs, toast } from './lib.js';

export async function render(ctx) {
  const people = await ctx.api(`/companies/${ctx.company.id}/team`);
  const view = ctx.query.get('tab') === 'org' ? 'org' : 'members';
  const byId = new Map(people.map((p) => [p.id, p]));

  return html`${pageHead({
    title: 'Team',
    desc: 'Your AI employees. Roles with “CEO” or “Chief” plan goals; everyone else does the work.',
    actions: html`${people.length === 0 ? html`<button class="btn" data-action="starter-team">Add starter team</button>` : ''}
      <button class="btn btn-primary" data-action="add">${icon('plus')}Add employee</button>`,
  })}

  ${people.length
    ? html`<div style="display:flex;flex-direction:column;gap:var(--space-4)">
        <div class="toolbar">
          ${tabs([
            { key: 'members', text: 'Members', href: '#/team', count: people.length },
            { key: 'org', text: 'Org chart', href: '#/team?tab=org' },
          ], view)}
          ${view === 'members' ? searchBox('#team-table', 'Filter people') : ''}
        </div>
        ${view === 'org' ? org(people) : members(people, byId)}
      </div>`
    : empty('team', 'No one here yet', 'Add a starter team (a CEO who plans and an engineer who builds) or create your own employee.', html`<button class="btn" data-action="starter-team">Add starter team</button>`)}`;
}

function members(people, byId) {
  return html`<div class="table-wrap" id="team-table"><table class="table">
    <thead><tr><th>Name</th><th class="hide-sm">Reports to</th><th class="hide-sm">Runs on</th><th class="hide-sm">Skills</th><th class="r">Reputation</th><th>Status</th><th class="hide-sm">Last run</th></tr></thead>
    <tbody>${people.map(
      (p) => html`<tr class="link" data-href="#/team/${p.id}" data-text="${p.name} ${p.role} ${p.skills.map((s) => s.skillKey).join(' ')}">
        <td><span class="person">${avatar(p.name)}<span style="display:flex;flex-direction:column;line-height:var(--leading-label)">
          <a href="#/team/${p.id}" style="color:var(--ink);font-weight:500">${p.name}</a><span class="help">${p.role}</span></span></span></td>
        <td class="hide-sm">${p.managerEmployeeId && byId.get(p.managerEmployeeId) ? byId.get(p.managerEmployeeId).name : html`<span class="muted">—</span>`}</td>
        <td class="hide-sm">${runtimeLabel(p.runtimeConfig)} <span class="id">${p.runtimeConfig?.modelPolicy?.default ?? ''}</span></td>
        <td class="hide-sm clip">${p.skills.slice(0, 3).map((s) => s.skillKey).join(', ') || html`<span class="muted">—</span>`}</td>
        <td class="r num">${p.reputation ?? html`<span class="muted">—</span>`}</td>
        <td>${badge(p.status)}</td>
        <td class="hide-sm">${p.latestRun ? ago(p.latestRun.startedAt) : html`<span class="muted">Never</span>`}</td>
      </tr>`,
    )}
    <tr class="no-match" hidden><td colspan="7" class="muted">Nobody matches that filter.</td></tr>
    </tbody></table></div>`;
}

function org(people) {
  const ids = new Set(people.map((p) => p.id));
  const kids = (id) => people.filter((p) => (id === null ? !p.managerEmployeeId || !ids.has(p.managerEmployeeId) : p.managerEmployeeId === id));
  const tree = (id, depth) =>
    depth > 8
      ? ''
      : html`<ul>${kids(id).map(
          (p) => html`<li><a class="node" href="#/team/${p.id}">${avatar(p.name)}<span style="display:flex;flex-direction:column;line-height:var(--leading-label)"><span style="font-weight:500">${p.name}</span><span class="r">${p.role}</span></span></a>${tree(p.id, depth + 1)}</li>`,
        )}</ul>`;
  return html`<section class="card org" aria-label="Org chart">${tree(null, 0)}</section>`;
}

function addForm(people) {
  return html`<form class="form" data-form="create">
    <div class="form-row">
      <label class="field"><span>Name</span><input name="name" required maxlength="200" placeholder="Linus" /></label>
      <label class="field"><span>Role</span><input name="role" required maxlength="200" placeholder="Backend engineer" /></label>
    </div>
    <div class="form-row">
      <label class="field"><span>Reports to</span><select name="manager"><option value="">Nobody</option>${people.map((p) => html`<option value="${p.id}">${p.name} — ${p.role}</option>`)}</select></label>
      <label class="field"><span>Runs on</span><select name="runtime">${RUNTIMES.map((r) => html`<option value="${r.value}">${r.label}</option>`)}</select></label>
    </div>
    <label class="field"><span>Model</span><input name="model" list="models" value="${MODELS[0]}" required />
      <span class="help">Haiku is cheapest; Sonnet is a good default.</span></label>
    <label class="field"><span>Skills</span><input name="skills" placeholder="node 80, typescript 75, testing 60" />
      <span class="help">Used for routing, 0–100. They move up or down with evaluated results.</span></label>
    <datalist id="models">${[...MODELS, 'qwen2.5-coder'].map((m) => html`<option value="${m}"></option>`)}</datalist>
    <div class="form-foot"><button class="btn" type="button" data-action="close-overlay">Cancel</button><button class="btn btn-primary" type="submit">Add employee</button></div>
  </form>`;
}

export const actions = {
  async add(el, ctx) {
    const people = await ctx.api(`/companies/${ctx.company.id}/team`);
    ctx.openModal({ title: 'Add employee', desc: 'A new AI employee for this company.', body: addForm(people) });
  },
};

export const forms = {
  async create(data, form, ctx) {
    const [runtimeKey, provider] = String(data.runtime).split('|');
    const created = await ctx.api(`/companies/${ctx.company.id}/employees`, {
      method: 'POST',
      body: {
        name: data.name,
        role: data.role,
        managerEmployeeId: data.manager || undefined,
        runtimeConfig: { runtimeKey, provider, modelPolicy: { default: data.model } },
        skills: parseSkills(data.skills),
      },
    });
    ctx.closeOverlay(true);
    toast(`${created.name} joined the team`);
    ctx.refresh();
  },
};

import { badge, html, icon, pageHead, toast, when } from './lib.js';

const SECTIONS = [
  ['company', 'Company'],
  ['people', 'People & access'],
  ['runtimes', 'Runtimes'],
  ['claude', 'Claude Code'],
];

export async function render(ctx) {
  const section = SECTIONS.find((s) => s[0] === ctx.query.get('s'))?.[0] ?? 'company';
  const system = await ctx.api('/system');
  const body =
    section === 'company' ? company(ctx, system) : section === 'people' ? await people(ctx) : section === 'runtimes' ? runtimes(system) : claude(system);

  return html`${pageHead({ title: 'Settings', desc: 'Your company and the runtimes your team works on.' })}
  <div class="subnav-layout">
    <nav class="subnav" aria-label="Settings sections">${SECTIONS.map(
      ([key, text]) => html`<a href="#/settings${key === 'company' ? '' : `?s=${key}`}" ${key === section ? html`aria-current="page"` : ''}>${text}</a>`,
    )}</nav>
    <div style="display:flex;flex-direction:column;gap:var(--space-6);min-width:0">${body}</div>
  </div>`;
}

function company(ctx, system) {
  const c = ctx.company;
  const sep = system.projectsRoot?.includes('\\') ? '\\' : '/';
  const defaultDir = `${system.projectsRoot}${sep}${companySlug(c.name)}`;
  return html`<form class="card" data-form="company">
      <div class="card-head"><h2>Company</h2></div>
      <div class="form">
        <label class="field"><span>Name</span><input name="name" value="${c.name}" required maxlength="200" /></label>
        <label class="field"><span>Description</span><textarea name="description" rows="3" maxlength="2000" placeholder="What this company works on">${c.description ?? ''}</textarea></label>
        <label class="field"><span>Projects folder</span><input name="projectsDir" value="${c.projectsDir ?? ''}" maxlength="500" placeholder="${defaultDir}" style="font-family:var(--font-mono);font-size:var(--text-small, 13px)" />
          <span class="help">Every project gets its own subfolder here. Leave empty to use ${defaultDir}. A single task can also choose its own folder.</span></label>
      </div>
      <dl class="kv"><dt>Created</dt><dd>${when(c.createdAt)}</dd><dt>ID</dt><dd class="id">${c.id}</dd></dl>
      <div class="form-foot"><button class="btn btn-primary" type="submit">Save changes</button></div>
    </form>
    <section class="card">
      <div class="card-head"><div><h2>Another company</h2><p class="muted" style="margin-top:var(--space-1)">Each company has its own team, work and budget.</p></div>
        <a class="btn" href="#/setup">${icon('plus')}New company</a></div>
    </section>`;
}

const ROLE_HELP = {
  viewer: 'Sees everything, changes nothing',
  member: 'Gives work, requests changes, retries and cancels',
  admin: 'Also manages employees, budgets, permissions, approvals and settings',
  owner: 'Also manages people and their access',
};

async function people(ctx) {
  const auth = await ctx.api('/auth/status');
  if (!auth.accounts) {
    return html`<form class="card" data-form="setup-accounts">
      <div class="card-head"><div><h2>Turn on accounts</h2><p class="muted" style="margin-top:var(--space-1)">Right now anyone who can open this page can use Forge. Create the owner account to require sign-in and give other people their own roles.</p></div></div>
      <div class="form">
        <div class="form-row">
          <label class="field"><span>Your name</span><input name="name" required maxlength="200" autocomplete="name" /></label>
          <label class="field"><span>Email</span><input name="email" type="email" required maxlength="200" autocomplete="username" /></label>
        </div>
        <label class="field"><span>Password</span><input name="password" type="password" required minlength="10" maxlength="200" autocomplete="new-password" />
          <span class="help">At least 10 characters. You become owner of every company.</span></label>
      </div>
      <div class="form-foot"><button class="btn btn-primary" type="submit">Turn on accounts</button></div>
    </form>`;
  }
  let members;
  try {
    members = await ctx.api(`/companies/${ctx.company.id}/members`);
  } catch {
    return html`<section class="card"><div class="card-head"><h2>People & access</h2></div><p class="muted">Only owners can see and manage people in ${ctx.company.name}.</p></section>`;
  }
  return html`<section class="card card-flush">
      <div class="card-head"><h2>People in ${ctx.company.name}</h2><span class="muted num">${members.length}</span></div>
      <div style="overflow-x:auto"><table class="table">
        <thead><tr><th>Name</th><th>Email</th><th>Role</th><th></th></tr></thead>
        <tbody>${members.map(
          (m) => html`<tr><td class="primary">${m.name}</td><td>${m.email}</td>
            <td><select data-change="role" data-user="${m.userId}" aria-label="Role for ${m.name}" style="width:auto">${Object.keys(ROLE_HELP).map(
              (r) => html`<option value="${r}" ${r === m.role ? html`selected` : ''}>${r}</option>`,
            )}</select></td>
            <td class="r">${m.userId === auth.user?.id ? html`<span class="muted">You</span>` : html`<button class="btn btn-sm btn-link-danger" data-action="remove-member" data-user="${m.userId}">Remove</button>`}</td></tr>`,
        )}</tbody></table></div>
    </section>
    <form class="card" data-form="add-member">
      <div class="card-head"><h2>Add a person</h2></div>
      <div class="form">
        <div class="form-row">
          <label class="field"><span>Name</span><input name="name" required maxlength="200" /></label>
          <label class="field"><span>Email</span><input name="email" type="email" required maxlength="200" /></label>
        </div>
        <div class="form-row">
          <label class="field"><span>Role</span><select name="role">${Object.entries(ROLE_HELP).map(([r, h]) => html`<option value="${r}" ${r === 'member' ? html`selected` : ''}>${r} — ${h}</option>`)}</select></label>
          <label class="field"><span>Password</span><input name="password" type="password" minlength="10" maxlength="200" autocomplete="new-password" />
            <span class="help">Needed only if they don’t have a Forge account yet. Share it with them privately.</span></label>
        </div>
      </div>
      <div class="form-foot"><button class="btn btn-primary" type="submit">Add person</button></div>
    </form>`;
}

/** Same folder naming as the server (project-location.ts slug). */
function companySlug(name) {
  const s = String(name ?? '')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48)
    .replace(/-+$/, '');
  return s || 'company';
}

const WINDOWS = { five_hour: '5-hour window', seven_day: 'Weekly', seven_day_opus: 'Weekly (Opus)', seven_day_sonnet: 'Weekly (Sonnet)' };

function usage(s) {
  const u = (s.usage ?? []).find((x) => x.runtimeKey === 'claude_code');
  const state = !u ? badge('created', 'No data yet') : u.status === 'rejected' ? badge('failed', 'Limit reached') : u.status === 'allowed_warning' ? badge('needs_approval', 'Near the limit') : badge('done', 'OK');
  return html`<section class="card">
      <div class="card-head"><h2>Claude usage</h2>${state}</div>
      ${u
        ? html`<dl class="kv">
            <dt>Window</dt><dd>${WINDOWS[u.limitType] ?? u.limitType ?? '—'}</dd>
            <dt>Used</dt><dd class="num">${typeof u.utilization === 'number' ? `${Math.round(u.utilization * 100)}%` : '—'}</dd>
            <dt>Resets</dt><dd>${u.resetsAt ? when(u.resetsAt) : '—'}</dd>
            <dt>Updated</dt><dd>${when(u.updatedAt)}</dd>
          </dl>
          ${u.status === 'rejected' ? html`<p class="help">Work waiting for Claude is paused, not failed. It starts again by itself when the limit resets.</p>` : ''}`
        : html`<p class="muted">Shown after the first run. Claude Code reports your subscription's usage with every run.</p>`}
    </section>`;
}

function runtimes(s) {
  return html`${usage(s)}<section class="card card-flush">
      <div class="card-head"><h2>Runtimes</h2><span class="muted">Checked just now</span></div>
      <div style="overflow-x:auto"><table class="table">
        <thead><tr><th>Runtime</th><th>Status</th><th class="hide-sm">Detail</th></tr></thead>
        <tbody>${s.runtimes.map(
          (r) => html`<tr><td class="primary">${r.label}</td><td>${r.available ? badge('done', 'Available') : badge('created', 'Not available')}</td>
            <td class="wrap hide-sm">${r.reason ?? r.detail ?? (r.available ? 'Ready' : '—')}</td></tr>`,
        )}</tbody></table></div>
    </section>
    <section class="card">
      <div class="card-head"><h2>Installation</h2></div>
      <dl class="kv">
        <dt>Version</dt><dd class="mono">${s.version}</dd>
        <dt>Auto-run</dt><dd>${s.autoRun ? badge('done', 'On') : badge('created', 'Off')}<span class="muted" style="margin-left:var(--space-2)">${s.autoRun ? 'Work runs as soon as it is assigned' : 'Set by FORGE_MANUAL_DRIVE'}</span></dd>
        <dt>Checks and tests</dt><dd>${s.sandbox === 'docker' ? 'Docker container' : 'This machine'} <span class="muted">(FORGE_SANDBOX=${s.sandbox})</span></dd>
        <dt>Agent commands</dt><dd>${s.agentSandbox?.protected ? badge('done', 'Sandboxed') : badge('needs_approval', 'Not isolated')}
          <span class="help" style="display:block;margin-top:var(--space-1)">${s.agentSandbox?.note ?? ''}</span></dd>
      </dl>
    </section>`;
}

function claude(s) {
  const cc = s.runtimes.find((r) => r.key === 'claude_code');
  return html`<section class="card">
      <div class="card-head"><h2>Claude Code</h2>${cc?.available ? badge('done', 'Connected') : badge('failed', 'Not connected')}</div>
      <p class="secondary">Forge runs your employees on your own Claude Code subscription. No API key is needed and per-token billing is never used.</p>
      ${cc?.available
        ? html`<div class="notice success">${icon('circleCheck')}<span class="grow">Claude Code is signed in on this machine. Your team is ready to work.</span></div>`
        : html`<div class="notice warning">${icon('alert')}<span class="grow">${cc?.reason ?? 'Claude Code is not signed in on this machine.'}</span></div>`}
    </section>
    <section class="card">
      <div class="card-head"><h2>Connect on this machine</h2></div>
      <div class="rows">
        ${[
          ['1', 'Install Claude Code', 'npm install -g @anthropic-ai/claude-code'],
          ['2', 'Sign in with your subscription', 'claude login'],
          ['3', 'Restart Forge', 'forge serve'],
        ].map(([n, t, cmd]) => html`<div class="rowi"><span class="tile num">${n}</span><span class="body"><span class="t">${t}</span><code class="s">${cmd}</code></span></div>`)}
      </div>
    </section>
    <section class="card">
      <div class="card-head"><h2>Servers and containers</h2></div>
      <p class="secondary">Where you can’t sign in interactively, create a long-lived token on your own machine and pass it to Forge.</p>
      <pre class="out" style="max-height:none">claude setup-token
CLAUDE_CODE_OAUTH_TOKEN=&lt;token&gt; forge serve</pre>
      <p class="help">Do not set ANTHROPIC_API_KEY. Forge removes it from agent environments so work is never billed per token by accident.</p>
    </section>`;
}

export const actions = {
  async 'remove-member'(el, ctx) {
    if (!confirm('Remove this person from the company?')) return;
    await ctx.api(`/companies/${ctx.company.id}/members/${el.dataset.user}`, { method: 'DELETE' });
    toast('Person removed');
    ctx.refresh();
  },
};

export const changes = {
  async role(el, ctx) {
    try {
      await ctx.api(`/companies/${ctx.company.id}/members/${el.dataset.user}`, { method: 'PATCH', body: { role: el.value } });
      toast('Role updated');
    } catch (err) {
      toast(err.message, 'bad');
    }
    ctx.refresh();
  },
};

export const forms = {
  async 'setup-accounts'(data, form, ctx) {
    await ctx.api('/auth/setup', { method: 'POST', body: { name: data.name, email: data.email, password: data.password } });
    toast('Accounts are on. You are the owner.');
    location.reload();
  },
  async 'add-member'(data, form, ctx) {
    await ctx.api(`/companies/${ctx.company.id}/members`, {
      method: 'POST',
      body: { name: data.name, email: data.email, role: data.role, ...(data.password ? { password: data.password } : {}) },
    });
    toast(`${data.name} added`);
    ctx.refresh();
  },
  async company(data, form, ctx) {
    await ctx.api(`/companies/${ctx.company.id}`, {
      method: 'PATCH',
      body: { name: data.name, description: data.description || undefined, projectsDir: String(data.projectsDir ?? '').trim() },
    });
    await ctx.reloadCompanies(ctx.company.id);
    ctx.refreshChrome();
    toast('Company saved');
    ctx.refresh();
  },
};

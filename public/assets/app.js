import { api, avatar, html, icon, store, toast, when } from './lib.js';
import { composerForms, openComposer } from './compose.js';
import * as home from './home.js';
import * as work from './work.js';
import * as goal from './goal.js';
import * as runs from './runs.js';
import * as deliverables from './deliverables.js';
import * as team from './team.js';
import * as employee from './employee.js';
import * as approvals from './approvals.js';
import * as settings from './settings.js';
import * as setup from './setup.js';
import { renderSignIn } from './signin.js';

const ROUTES = [
  { re: /^\/?$/, view: home, nav: 'overview' },
  { re: /^\/work$/, view: work, nav: 'work' },
  { re: /^\/work\/([\w-]+)$/, view: goal, nav: 'work', keys: ['id'] },
  { re: /^\/goals\/([\w-]+)$/, view: goal, nav: 'work', keys: ['id'] }, // older links
  { re: /^\/runs$/, view: runs, nav: 'runs' },
  { re: /^\/deliverables$/, view: deliverables, nav: 'deliverables' },
  { re: /^\/deliverables\/([\w-]+)$/, view: deliverables, nav: 'deliverables', keys: ['id'] },
  { re: /^\/team$/, view: team, nav: 'team' },
  { re: /^\/team\/([\w-]+)$/, view: employee, nav: 'team', keys: ['id'] },
  { re: /^\/approvals$/, view: approvals, nav: 'approvals' },
  { re: /^\/settings$/, view: settings, nav: 'settings' },
  { re: /^\/system$/, view: settings, nav: 'settings' }, // older links
  { re: /^\/setup$/, view: setup, nav: null, bare: true },
];

const NAV = [
  ['workspace', [
    ['overview', '#/', 'Overview', 'overview'],
    ['work', '#/work', 'Work', 'work'],
    ['runs', '#/runs', 'Runs', 'activity'],
    ['deliverables', '#/deliverables', 'Deliverables', 'folder'],
    ['team', '#/team', 'Team', 'team'],
    ['approvals', '#/approvals', 'Approvals', 'shield'],
  ]],
  ['account', [['settings', '#/settings', 'Settings', 'settings']]],
];

const state = {
  companies: [],
  company: null,
  route: ROUTES[0],
  params: {},
  query: new URLSearchParams(),
  poll: null,
  overlay: null,
  system: null,
  pending: 0,
  index: null,
};

const ctx = {
  api,
  get company() {
    return state.company;
  },
  get companies() {
    return state.companies;
  },
  get params() {
    return state.params;
  },
  get query() {
    return state.query;
  },
  get system() {
    return state.system;
  },
  go(hash) {
    if (location.hash === hash) render();
    else location.hash = hash;
  },
  refresh: () => render({ silent: true, force: true }),
  poll(ms) {
    clearInterval(state.poll);
    state.poll = setInterval(() => render({ silent: true }), ms);
  },
  openPanel(title, body) {
    state.overlay = { type: 'panel', title, body };
    renderOverlay();
  },
  openModal({ title, desc, body, size = '' }) {
    state.overlay = { type: 'modal', title, desc, body, size };
    renderOverlay();
  },
  closeOverlay,
  async reloadCompanies(selectId) {
    state.companies = await api('/companies');
    if (selectId) setCompany(selectId);
    else setCompany(state.company?.id);
  },
  refreshChrome,
};

function setCompany(id) {
  state.company = state.companies.find((c) => c.id === id) ?? state.companies[0] ?? null;
  state.index = null;
  store.set('company', state.company?.id ?? null);
}

async function boot() {
  document.addEventListener('click', onClick);
  document.addEventListener('submit', onSubmit);
  document.addEventListener('change', onChange);
  document.addEventListener('input', onInput);
  document.addEventListener('keydown', onKey);
  window.addEventListener('hashchange', route);
  try {
    state.auth = await api('/auth/status');
    if (state.auth.accounts && !state.auth.user) {
      renderSignIn(document.getElementById('app'));
      return;
    }
    [state.companies, state.system] = await Promise.all([api('/companies'), api('/system').catch(() => null)]);
  } catch (err) {
    document.getElementById('app').innerHTML = html`<div class="onboard"><div class="card">
      <div class="empty" style="padding:0">${icon('alert')}<h3>Can’t reach Forge</h3><p>${err.message}</p>
      <p>Check that <code>forge serve</code> is running and Postgres is up, then reload.</p></div></div></div>`.value;
    return;
  }
  setCompany(store.get('company'));
  route();
}

function parseHash() {
  const raw = (location.hash || '#/').slice(1);
  const [p, q = ''] = raw.split('?');
  return { path: p || '/', query: new URLSearchParams(q) };
}

function route() {
  const { path, query } = parseHash();
  let match = ROUTES.find((r) => r.re.test(path)) ?? ROUTES[0];
  const m = path.match(match.re);
  state.params = {};
  (match.keys ?? []).forEach((k, i) => (state.params[k] = m?.[i + 1]));
  state.query = query;
  if (!state.company && match.view !== setup) match = ROUTES.find((r) => r.view === setup);
  const shellChanged = Boolean(state.route.bare) !== Boolean(match.bare) || !document.getElementById('main');
  state.route = match;
  closeOverlay(true);
  if (shellChanged) renderShell();
  document.querySelector('.shell')?.classList.remove('nav-open');
  renderNav();
  render();
  window.scrollTo(0, 0);
  refreshChrome();
}

function renderShell() {
  const app = document.getElementById('app');
  if (state.route.bare) {
    app.innerHTML = html`<main id="main" class="onboard" tabindex="-1"></main><div id="overlay"></div>`.value;
    return;
  }
  app.innerHTML = html`<div class="shell">
      <aside class="sidebar" aria-label="Main">
        <a class="logo" href="#/"><span class="mark" aria-hidden="true"></span><span class="wordmark">Forge</span></a>
        <div class="company-pick">
          <label class="nav-title" for="company" style="padding:0">company</label>
          <select id="company" data-change="company"></select>
        </div>
        <nav id="nav" style="display:flex;flex-direction:column;gap:var(--space-5)"></nav>
        <div class="sidebar-foot" id="foot"></div>
      </aside>
      <div class="scrim" data-action="close-nav"></div>
      <div class="main-col">
        <header class="topbar">
          <button class="icon-btn menu-btn" data-action="open-nav" aria-label="Open navigation">${icon('menu')}</button>
          <div class="search" id="global-search">
            ${icon('search')}
            <input type="search" id="q" placeholder="Search work and people" aria-label="Search work and people" autocomplete="off" />
            <div class="search-results" id="q-results" hidden></div>
          </div>
          <div class="top-right">
            <button class="icon-btn" data-action="help" aria-label="How Forge works">${icon('help')}</button>
            <span id="top-avatar"></span>
          </div>
        </header>
        <div id="limit-banner" class="limit-banner"></div>
        <main id="main" class="content" tabindex="-1"></main>
      </div>
    </div>
    <div id="overlay"></div>`.value;
}

const LIMIT_WINDOWS = { five_hour: '5-hour', seven_day: 'weekly', seven_day_opus: 'weekly Opus', seven_day_sonnet: 'weekly Sonnet' };

function claudeLimit() {
  return state.system?.usage?.find((u) => u.runtimeKey === 'claude_code') ?? null;
}

/** Subscription usage: a warning as the limit nears, and a clear notice while work waits for the reset. */
function renderLimitBanner() {
  const el = document.getElementById('limit-banner');
  if (!el) return;
  const u = claudeLimit();
  const windowName = u?.limitType ? `${LIMIT_WINDOWS[u.limitType] ?? u.limitType.replace(/_/g, ' ')} ` : '';
  const resets = u?.resetsAt ? ` It resets ${when(u.resetsAt)}.` : '';
  if (u?.status === 'rejected') {
    el.innerHTML = html`<div class="notice warning">${icon('clock')}<span class="grow">Claude ${windowName}usage limit reached. Work is paused and resumes on its own.${resets}</span></div>`.value;
  } else if (u?.status === 'allowed_warning') {
    const used = typeof u.utilization === 'number' ? `${Math.round(u.utilization * 100)}% of the` : 'Close to the';
    el.innerHTML = html`<div class="notice">${icon('alert')}<span class="grow">${used} Claude ${windowName}usage limit used.${resets}</span></div>`.value;
  } else {
    el.innerHTML = '';
  }
}

function renderNav() {
  const nav = document.getElementById('nav');
  if (!nav) return;
  nav.innerHTML = NAV.map(
    ([title, items]) => html`<div class="nav-group"><span class="nav-title">${title}</span>${items.map(
      ([key, href, text, ico]) =>
        html`<a href="${href}" ${state.route.nav === key ? html`aria-current="page"` : ''}>${icon(ico)}<span class="grow">${text}</span>${
          key === 'approvals' && state.pending > 0 ? html`<span class="nav-count attn" title="Waiting for you">${state.pending}</span>` : ''
        }</a>`,
    )}</div>`.value,
  ).join('');

  const select = document.getElementById('company');
  if (select) {
    select.innerHTML = html`${state.companies.map((c) => html`<option value="${c.id}" ${state.company?.id === c.id ? html`selected` : ''}>${c.name}</option>`)}
      <option value="__new">New company…</option>`.value;
  }
  const cc = state.system?.runtimes?.find((r) => r.key === 'claude_code');
  const foot = document.getElementById('foot');
  if (foot) {
    const who = state.auth?.user;
    foot.innerHTML = html`${avatar(who?.name ?? state.company?.name ?? 'F')}<div class="who"><b>${who?.name ?? state.company?.name ?? 'Forge'}</b>
      <span>${!state.system ? 'Checking runtime…' : claudeLimit()?.status === 'rejected' ? 'Usage limit reached' : cc?.available ? 'Claude Code connected' : 'No runtime connected'}</span></div>
      ${who ? html`<button class="icon-btn" data-action="sign-out" aria-label="Sign out" title="Sign out">${icon('arrowLeft')}</button>` : ''}`.value;
  }
  renderLimitBanner();
  const top = document.getElementById('top-avatar');
  if (top) top.innerHTML = html`<a href="#/settings" aria-label="Settings">${avatar(state.company?.name ?? 'F')}</a>`.value;
}

async function refreshChrome() {
  try {
    state.system = await api('/system');
    if (state.company) state.pending = (await api(`/companies/${state.company.id}/approvals`)).length;
    renderNav();
  } catch {
    /* chrome is best-effort */
  }
}

let rendering = false;
async function render({ silent = false, force = false } = {}) {
  const main = document.getElementById('main');
  if (!main) return;
  if (silent && !force) {
    const active = document.activeElement;
    const typing = active && main.contains(active) && /^(INPUT|TEXTAREA|SELECT)$/.test(active.tagName);
    if (typing || state.overlay || rendering) return;
  }
  if (!silent) {
    clearInterval(state.poll);
    main.innerHTML = '<p class="muted">Loading…</p>';
  }
  rendering = true;
  try {
    const view = state.route.view;
    const out = await view.render(ctx);
    if (view !== state.route.view) return;
    const y = window.scrollY;
    const filter = main.querySelector('[data-filter]')?.value;
    main.innerHTML = out.value;
    if (filter) {
      const input = main.querySelector('[data-filter]');
      if (input) {
        input.value = filter;
        applyFilter(input);
      }
    }
    if (silent) window.scrollTo(0, y);
  } catch (err) {
    clearInterval(state.poll);
    main.innerHTML = html`<div class="notice danger">${icon('alert')}<span class="grow">${err.message}</span>
      <button class="btn btn-sm" data-action="reload">Try again</button></div>`.value;
  } finally {
    rendering = false;
  }
}

function renderOverlay() {
  const host = document.getElementById('overlay');
  if (!host) return;
  const o = state.overlay;
  if (!o) {
    host.innerHTML = '';
    return;
  }
  host.innerHTML =
    o.type === 'panel'
      ? html`<div class="backdrop" data-action="close-overlay"></div>
        <section class="panel" role="dialog" aria-modal="true" aria-label="${o.title}">
          <div class="panel-head"><h2>${o.title}</h2>
            <button class="icon-btn" data-action="close-overlay" id="overlay-close" aria-label="Close">${icon('x')}</button></div>
          <div class="panel-body">${o.body}</div>
        </section>`.value
      : html`<div class="backdrop" data-action="close-overlay"></div>
        <section class="modal ${o.size}" role="dialog" aria-modal="true" aria-labelledby="modal-title">
          <div class="modal-head"><div><h2 id="modal-title">${o.title}</h2>${o.desc ? html`<p>${o.desc}</p>` : ''}</div>
            <button class="icon-btn" data-action="close-overlay" id="overlay-close" aria-label="Close">${icon('x')}</button></div>
          <div class="modal-body">${o.body}</div>
        </section>`.value;
  const first = host.querySelector('.modal-body input:not([type=hidden]):not([type=radio]), .modal-body textarea, .modal-body select');
  (first ?? document.getElementById('overlay-close'))?.focus();
}

function closeOverlay(quiet) {
  if (!state.overlay) return;
  state.overlay = null;
  renderOverlay();
  if (!quiet) render({ silent: true });
}

/* ---------- global search (work + people of the current company) ---------- */

async function searchIndex() {
  if (state.index && Date.now() - state.index.at < 30_000) return state.index.items;
  const d = await api(`/companies/${state.company.id}/dashboard`);
  const items = [
    ...d.goals.map((g) => ({ text: g.title, type: g.mode === 'direct' ? 'Task' : 'Goal', href: `#/work/${g.id}`, ico: 'work' })),
    ...d.team.map((p) => ({ text: `${p.name} — ${p.role}`, type: 'Person', href: `#/team/${p.id}`, ico: 'team' })),
  ];
  state.index = { at: Date.now(), items };
  return items;
}

async function runSearch(input) {
  const box = document.getElementById('q-results');
  const q = input.value.trim().toLowerCase();
  if (!q || !state.company) {
    box.hidden = true;
    return;
  }
  const items = (await searchIndex()).filter((i) => i.text.toLowerCase().includes(q)).slice(0, 8);
  if (input.value.trim().toLowerCase() !== q) return;
  box.innerHTML = items.length
    ? items.map((i) => html`<a href="${i.href}">${icon(i.ico)}<span>${i.text}</span><span class="type">${i.type}</span></a>`.value).join('')
    : html`<div class="none">No results for “${input.value.trim()}”</div>`.value;
  box.hidden = false;
}

function applyFilter(input) {
  const q = input.value.trim().toLowerCase();
  const scope = document.querySelector(input.dataset.filter);
  if (!scope) return;
  let shown = 0;
  scope.querySelectorAll('[data-text]').forEach((row) => {
    const hit = !q || row.dataset.text.toLowerCase().includes(q);
    row.hidden = !hit;
    if (hit) shown += 1;
  });
  const none = scope.querySelector('.no-match');
  if (none) none.hidden = shown > 0;
}

/* ---------- events ---------- */

const GLOBAL_ACTIONS = {
  'close-overlay': () => closeOverlay(),
  'open-nav': () => document.querySelector('.shell')?.classList.add('nav-open'),
  'close-nav': () => document.querySelector('.shell')?.classList.remove('nav-open'),
  reload: () => render(),
  'sign-out': async () => {
    await api('/auth/logout', { method: 'POST' });
    location.hash = '#/';
    location.reload();
  },
  'new-task': (el) => openComposer(ctx, el.dataset.mode),
  help: () =>
    ctx.openModal({
      title: 'How Forge works',
      desc: 'Your AI team plans, builds and checks work on your own Claude Code subscription.',
      size: 'sm',
      body: html`<div class="rows">
        ${[
          ['work', 'Give it work', 'A task goes straight to one employee. A goal is planned by your CEO into a few steps.'],
          ['activity', 'Agents run', 'Each step runs in its own branch of a shared project repository.'],
          ['circleCheck', 'Checks decide', 'Tests and your acceptance checks must pass before work is merged.'],
          ['shield', 'You stay in control', 'Tools that need sign-off pause in Approvals until you decide.'],
        ].map(([i, t, s]) => html`<div class="rowi"><span class="tile">${icon(i)}</span><span class="body"><span class="t">${t}</span><span class="s" style="white-space:normal">${s}</span></span></div>`)}
      </div>
      <div class="form-foot" style="margin-top:var(--space-4)"><a class="btn" href="#/settings?s=claude">Connecting Claude Code</a>
        <button class="btn btn-primary" data-action="close-overlay">Got it</button></div>`,
    }),
  'starter-team': async () => {
    await api(`/companies/${state.company.id}/starter-team`, { method: 'POST', body: {} });
    state.index = null;
    toast('Starter team added: a CEO and a software engineer');
    render();
  },
};

async function onClick(e) {
  const results = document.getElementById('q-results');
  if (results && !e.target.closest('#global-search')) results.hidden = true;
  if (e.target.closest('#q-results a')) {
    results.hidden = true;
    document.getElementById('q').value = '';
  }
  const row = e.target.closest('tr[data-href]');
  if (row && !e.target.closest('a,button,input,select')) {
    location.hash = row.dataset.href;
    return;
  }
  const el = e.target.closest('[data-action]');
  if (!el) return;
  const handler = state.route.view.actions?.[el.dataset.action] ?? GLOBAL_ACTIONS[el.dataset.action];
  if (!handler) return;
  e.preventDefault();
  if (el.disabled) return;
  const isButton = el.tagName === 'BUTTON';
  if (isButton) el.disabled = true;
  try {
    await handler(el, ctx);
  } catch (err) {
    toast(err.message, 'bad');
  } finally {
    if (isButton && el.isConnected) el.disabled = false;
  }
}

async function onSubmit(e) {
  const form = e.target.closest('form[data-form]');
  if (!form) return;
  e.preventDefault();
  const handler = state.route.view.forms?.[form.dataset.form] ?? composerForms[form.dataset.form];
  if (!handler) return;
  const data = Object.fromEntries(new FormData(form));
  form.querySelectorAll('input[type=checkbox]').forEach((c) => (data[c.name] = c.checked));
  const submit = form.querySelector('[type=submit]');
  if (submit) submit.disabled = true;
  try {
    await handler(data, form, ctx);
  } catch (err) {
    toast(err.message, 'bad');
  } finally {
    if (submit && submit.isConnected) submit.disabled = false;
  }
}

function onChange(e) {
  const el = e.target.closest('[data-change]');
  if (!el) return;
  if (el.dataset.change === 'company') {
    if (el.value === '__new') {
      el.value = state.company?.id ?? '';
      ctx.go('#/setup');
      return;
    }
    setCompany(el.value);
    ctx.go('#/');
    return;
  }
  const handler = state.route.view.changes?.[el.dataset.change];
  if (handler) handler(el, ctx);
}

let searchTimer;
function onInput(e) {
  if (e.target.id === 'q') {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => runSearch(e.target).catch(() => {}), 120);
    return;
  }
  if (e.target.dataset?.filter) applyFilter(e.target);
}

function onKey(e) {
  if (e.key === 'Escape') {
    if (state.overlay) closeOverlay();
    document.querySelector('.shell')?.classList.remove('nav-open');
    const r = document.getElementById('q-results');
    if (r) r.hidden = true;
  }
  if (e.key === '/' && !/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName ?? '') && !state.overlay) {
    const q = document.getElementById('q');
    if (q) {
      e.preventDefault();
      q.focus();
    }
  }
  // Ctrl/⌘ + Enter submits the focused form.
  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) e.target.closest?.('form')?.requestSubmit();
}

boot();
// Keep runtime status and usage limits current while the console is open.
setInterval(() => void refreshChrome(), 30_000);

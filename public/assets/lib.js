/**
 * Tiny UI toolkit for the Forge console — no framework, no build step.
 * `html` is an auto-escaping tagged template: interpolated values are always text unless they
 * are themselves `html` results. Everything from the API is data, never markup.
 */

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;', '`': '&#96;' };

export function esc(value) {
  return String(value ?? '').replace(/[&<>"'`]/g, (c) => ESC[c]);
}

export class Safe {
  constructor(value) {
    this.value = value;
  }
  toString() {
    return this.value;
  }
}

function renderValue(v) {
  if (v === null || v === undefined || v === false) return '';
  if (v instanceof Safe) return v.value;
  if (Array.isArray(v)) return v.map(renderValue).join('');
  return esc(v);
}

export function html(strings, ...values) {
  let out = strings[0];
  for (let i = 0; i < values.length; i += 1) out += renderValue(values[i]) + strings[i + 1];
  return new Safe(out);
}

/** JSON over HTTP with readable errors (Nest validation messages are joined). */
export async function api(path, { method = 'GET', body } = {}) {
  const res = await fetch(path, {
    method,
    headers: body !== undefined ? { 'content-type': 'application/json' } : {},
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (!res.ok) {
    const msg = data && typeof data === 'object' ? data.message : null;
    throw new Error(Array.isArray(msg) ? msg.join('; ') : msg || `Request failed (${res.status})`);
  }
  return data;
}

/* ---------- formatting (DESIGN.md §6: "USD 1.25", "21 Oct 2026, 14:32") ---------- */

export function money(n) {
  const v = Number(n) || 0;
  if (v > 0 && v < 0.01) return `USD ${v.toFixed(4)}`;
  return `USD ${v.toFixed(2)}`;
}

export function duration(ms) {
  if (ms === null || ms === undefined) return '—';
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  return `${m}m ${String(s % 60).padStart(2, '0')}s`;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const pad = (n) => String(n).padStart(2, '0');

export function when(date) {
  if (!date) return '—';
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return '—';
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}, ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function day(date) {
  const d = new Date(date);
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

export function ago(date) {
  if (!date) return '';
  const s = Math.max(0, Math.round((Date.now() - new Date(date).getTime()) / 1000));
  if (s < 45) return 'Just now';
  if (s < 3600) return `${Math.round(s / 60)} min ago`;
  if (s < 86400) return `${Math.round(s / 3600)} h ago`;
  if (s < 7 * 86400) return `${Math.round(s / 86400)} d ago`;
  return when(date);
}

const LABELS = {
  created: 'Queued',
  assigned: 'Queued',
  in_progress: 'Working',
  needs_approval: 'Needs approval',
  evaluating: 'Checking',
  rework: 'Retrying',
  done: 'Done',
  failed: 'Failed',
  cancelled: 'Cancelled',
  draft: 'Draft',
  active: 'In progress',
  completed: 'Completed',
  running: 'Working',
  passed: 'Passed',
  inconclusive: 'Unverified',
  paused: 'Paused',
  blocked: 'Blocked',
  killed_budget: 'Stopped: budget',
  killed_timeout: 'Stopped: time limit',
  killed_tools: 'Stopped: tool limit',
  idle: 'Idle',
  working: 'Working',
  error: 'Error',
  pending: 'Pending',
  approved: 'Approved',
  denied: 'Denied',
  inactive: 'Removed',
};

export function label(status) {
  return LABELS[status] ?? String(status ?? '');
}

/** Status → badge tone (DESIGN.md §5: colour carries meaning, always with a word). */
export function tone(s) {
  if (['done', 'completed', 'passed', 'approved'].includes(s)) return 'success';
  if (['in_progress', 'evaluating', 'active', 'working', 'running'].includes(s)) return 'info';
  if (['needs_approval', 'paused', 'blocked', 'inconclusive', 'rework', 'pending'].includes(s)) return 'warning';
  if (['failed', 'killed_budget', 'killed_timeout', 'killed_tools', 'error', 'denied'].includes(s)) return 'danger';
  return '';
}

export function badge(s, text) {
  return html`<span class="badge ${tone(s)}">${text ?? label(s)}</span>`;
}

/** A goal's title from free text (bounded) plus the full text as description when long. */
export function goalFields(text) {
  const one = text.replace(/\s+/g, ' ').trim();
  if (one.length <= 120) return { title: one };
  return { title: `${one.slice(0, 117)}...`, description: text.trim() };
}

export const store = {
  get(key) {
    try {
      return localStorage.getItem(`forge.${key}`);
    } catch {
      return null;
    }
  },
  set(key, value) {
    try {
      if (value === null || value === undefined) localStorage.removeItem(`forge.${key}`);
      else localStorage.setItem(`forge.${key}`, value);
    } catch {
      /* storage unavailable: per-session only */
    }
  },
};

let toastTimer;
export function toast(message, kind = 'ok') {
  let el = document.querySelector('.toast');
  if (!el) {
    el = document.createElement('div');
    el.setAttribute('role', 'status');
    document.body.appendChild(el);
  }
  const bad = kind === 'bad' || kind === 'danger';
  el.className = `toast ${bad ? 'danger' : ''}`;
  el.innerHTML = html`${icon(bad ? 'alert' : 'circleCheck')}<span>${message}</span>`.value;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.remove(), 4000);
}

/** "node:80, testing 60" → [{skillKey, level}] */
export function parseSkills(text) {
  return String(text ?? '')
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => {
      const m = s.match(/^(.+?)[\s:=]+(\d{1,3})$/);
      return m ? { skillKey: m[1].trim(), level: Math.min(100, Number(m[2])) } : { skillKey: s, level: 50 };
    });
}

export function list(text) {
  return String(text ?? '')
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function lines(text) {
  return String(text ?? '')
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);
}

// Aliases always mean the newest model of that family; a specific model ID can still be typed per employee.
export const MODELS = ['sonnet', 'opus', 'haiku'];

export const RUNTIMES = [
  { value: 'claude_code|anthropic', label: 'Claude Code (your subscription)' },
  { value: 'custom|ollama', label: 'Local model (Ollama)' },
  { value: 'custom|anthropic', label: 'API worker (per-token key)' },
];

export function runtimeLabel(rc) {
  const v = `${rc?.runtimeKey ?? 'claude_code'}|${rc?.provider ?? 'anthropic'}`;
  return (RUNTIMES.find((r) => r.value === v)?.label ?? rc?.runtimeKey ?? '—').replace(/ \(.*\)$/, '');
}

/* ---------- Lucide icons (24 grid, 1.5 stroke — DESIGN.md §7) ---------- */

const ICONS = {
  download: '<path d="M12 15V3"/><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/>',
  overview: '<rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/>',
  work: '<path d="m3 17 2 2 4-4"/><path d="m3 7 2 2 4-4"/><path d="M13 6h8"/><path d="M13 12h8"/><path d="M13 18h8"/>',
  activity: '<path d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2"/>',
  folder: '<path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/>',
  team: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  shield: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',
  settings: '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>',
  search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  help: '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/>',
  plus: '<path d="M5 12h14"/><path d="M12 5v14"/>',
  x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  chevronDown: '<path d="m6 9 6 6 6-6"/>',
  chevronRight: '<path d="m9 18 6-6-6-6"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  circleCheck: '<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>',
  circleX: '<circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/>',
  circle: '<circle cx="12" cy="12" r="10"/>',
  alert: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
  file: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/>',
  fileText: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/>',
  terminal: '<polyline points="4 17 10 11 4 5"/><line x1="12" x2="20" y1="19" y2="19"/>',
  arrowLeft: '<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>',
  menu: '<line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/>',
  inbox: '<polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>',
  retry: '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>',
  play: '<polygon points="6 3 20 12 6 21 6 3"/>',
  cpu: '<rect width="16" height="16" x="4" y="4" rx="2"/><rect width="6" height="6" x="9" y="9" rx="1"/><path d="M15 2v2"/><path d="M15 20v2"/><path d="M2 15h2"/><path d="M2 9h2"/><path d="M20 15h2"/><path d="M20 9h2"/><path d="M9 2v2"/><path d="M9 20v2"/>',
  building: '<path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/>',
  clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
  book: '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>',
  branch: '<line x1="6" x2="6" y1="3" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/>',
  target: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
  link: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
};

export function icon(name, cls = '') {
  return new Safe(`<svg class="ico ${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[name] ?? ''}</svg>`);
}

export function avatar(name, cls = '') {
  const initials = String(name ?? '?')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
  return html`<span class="avatar ${cls}" aria-hidden="true">${initials || '?'}</span>`;
}

export function person(p) {
  return p ? html`<span class="person">${avatar(p.name)}<span>${p.name}</span></span>` : html`<span class="muted">Unassigned</span>`;
}

/** Done-of-total with a thin bar — data, not decoration. */
export function progress(done, total) {
  if (!total) return html`<span class="muted">—</span>`;
  const pct = Math.round((done / total) * 100);
  return html`<span class="progress"><span class="bar ${done === total ? 'done' : ''}" role="img" aria-label="${done} of ${total} done"><span style="width:${pct}%"></span></span>${done}/${total}</span>`;
}

/* ---------- page building blocks ---------- */

/** Page header: eyebrow (breadcrumb), serif title, one-line description, actions on the right. */
export function pageHead({ eyebrow, title, desc, actions, meta }) {
  return html`<header class="page-head">
    <div>
      ${eyebrow ? html`<span class="eyebrow">${eyebrow}</span>` : ''}
      <h1 class="ui-page-title">${title}</h1>
      ${desc ? html`<p class="desc">${desc}</p>` : ''}
      ${meta ? html`<div class="actions" style="margin-top:var(--space-3)">${meta}</div>` : ''}
    </div>
    ${actions ? html`<div class="actions">${actions}</div>` : ''}
  </header>`;
}

/** Empty state: 20px icon, heading, one line, and (optionally) the action that fills it. */
export function empty(iconName, heading, line, action) {
  return html`<div class="empty">${icon(iconName)}<h3>${heading}</h3>${line ? html`<p>${line}</p>` : ''}${action ?? ''}</div>`;
}

/** Tabs as links; `items` = [{key, text, href, count}]. */
export function tabs(items, active) {
  return html`<nav class="tabs" role="tablist">${items.map(
    (t) => html`<a role="tab" href="${t.href}" aria-selected="${t.key === active}">${t.text}${
      t.count !== undefined ? html`<span class="cnt">${t.count}</span>` : ''
    }</a>`,
  )}</nav>`;
}

export function kpi(k, v, d, dTone = '') {
  return html`<div class="card kpi"><span class="k">${k}</span><span class="v">${v}</span>${d ? html`<span class="d ${dTone}">${d}</span>` : ''}</div>`;
}

export function searchBox(target, placeholder) {
  return html`<div class="search" style="width:320px"><span>${icon('search')}</span>
    <input type="search" placeholder="${placeholder}" aria-label="${placeholder}" data-filter="${target}" /></div>`;
}

/** Transcript events of a run, for the side panel. */
export function transcript(t) {
  if (!t.events.length) return empty('terminal', 'No transcript', 'Nothing was recorded for this run.');
  const clip = (v, n) => {
    const s = typeof v === 'string' ? v : JSON.stringify(v, null, 2);
    return s && s.length > n ? `${s.slice(0, n)}…` : s ?? '';
  };
  const body = (e) => {
    switch (e.kind) {
      case 'session':
        return html`<span class="id">${e.sessionId}</span>`;
      case 'assistant_text':
        return html`<pre style="font-family:var(--font-sans);font-size:var(--text-body);line-height:var(--leading-body);color:var(--ink)">${clip(e.text, 4000)}</pre>`;
      case 'tool_use':
        return html`<b style="font-weight:500;color:var(--ink)">${e.toolName}</b><pre>${clip(e.input, 1200)}</pre>`;
      case 'tool_result':
        return html`${e.isError ? html`<span class="badge danger">Error</span>` : ''}<pre>${clip(e.content, 1500)}</pre>`;
      case 'usage':
        return html`<span class="num">${e.inputTokens} in · ${e.outputTokens} out · ${money(e.costUsd)}</span>`;
      case 'needs_approval':
        return html`Paused for approval: ${e.toolName}`;
      case 'completed':
        return html`<pre style="font-family:var(--font-sans);font-size:var(--text-body);line-height:var(--leading-body);color:var(--ink)">${clip(e.result, 3000)}</pre>`;
      case 'failed':
        return html`<span style="color:var(--danger)">${e.error}</span>`;
      default:
        return html`<pre>${clip(e, 800)}</pre>`;
    }
  };
  return html`<div class="events">${t.events.map((e) => html`<div class="ev"><span class="k">${String(e.kind).replace(/_/g, ' ')}</span><div>${body(e)}</div></div>`)}</div>`;
}

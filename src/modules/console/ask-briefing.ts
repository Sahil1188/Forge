/**
 * Plain-text briefings of what is going on, handed to the model that answers "Ask Forge" questions.
 * Kept pure (data in, text out) so what the model sees is predictable and testable.
 */

interface RunLike {
  status: string;
  model?: string | null;
  durationMs?: number | null;
  toolCallCount?: number;
  estimatedCostUsd?: number;
  error?: string | null;
  startedAt?: Date | string;
  live?: { actions: number; last: string | null; lastAt: string | null } | null;
}

interface ItemLike {
  id: string;
  title: string;
  description?: string | null;
  taskType?: string | null;
  status: string;
  assignee?: { name: string; role: string } | null;
  dependsOn: string[];
  runs: RunLike[];
  costUsd: number;
  evaluation?: {
    status: string;
    score?: number | null;
    note?: string | null;
    dimensions: { name: string; score: number; command: string; output: string }[];
  } | null;
  pendingApprovals?: { toolName: string; requestedAction?: unknown }[];
}

export interface BoardLike {
  goal: { title: string; description?: string | null; status: string; createdAt?: Date | string };
  projects: { name: string; deliverablePath: string }[];
  items: ItemLike[];
  totals: { items: number; done: number; failed: number; running: number; costUsd: number };
}

export interface CompanyLike {
  company: { name: string };
  stats: Record<string, number>;
  goals: { title: string; status: string; items: number; done: number; failed: number; running: number; costUsd: number }[];
  team: { name: string; role: string; department?: string | null; status: string; runtimeConfig?: unknown; latestRun?: RunLike | null }[];
}

const STATUS: Record<string, string> = {
  created: 'queued',
  assigned: 'queued (waiting for its turn or for steps it depends on)',
  in_progress: 'being worked on now',
  evaluating: 'running its checks',
  needs_approval: 'paused, waiting for a human approval',
  rework: 'sent back for rework',
  failed: 'failed (out of attempts)',
  done: 'done and merged into the project',
  cancelled: 'cancelled',
};

const usd = (n: number | undefined) => `USD ${(n ?? 0).toFixed(2)}`;
const mins = (ms: number) => `${Math.round(ms / 60_000)} min`;

function runLine(r: RunLike, now: number): string {
  // Recovered runs are stored as rate_limited; say what really happened so nobody blames usage limits.
  const interrupted = r.error?.startsWith('Interrupted');
  const parts = [interrupted ? 'interrupted (Forge was restarted; the work was saved and continues in the next run)' : r.status];
  if (r.model) parts.push(r.model);
  if (r.status === 'running' && r.startedAt) parts.push(`running for ${mins(now - new Date(r.startedAt).getTime())}`);
  else if (r.durationMs) parts.push(mins(r.durationMs));
  parts.push(`${r.toolCallCount ?? 0} tool calls`, usd(r.estimatedCostUsd));
  let line = parts.join(', ');
  if (r.error && !interrupted) line += ` | error: ${r.error.slice(0, 300)}`;
  if (r.live) {
    const quiet = r.live.lastAt ? ` (last action ${mins(now - new Date(r.live.lastAt).getTime())} ago)` : '';
    line += ` | live: ${r.live.actions} actions so far, now: ${r.live.last ?? 'starting'}${quiet}`;
  }
  return line;
}

export function boardBriefing(b: BoardLike, now = Date.now()): string {
  const titles = new Map(b.items.map((i) => [i.id, i.title]));
  const out = [
    `# Goal: ${b.goal.title} (${b.goal.status})`,
    b.goal.description ? `Brief: ${b.goal.description.slice(0, 2500)}` : '',
    `Progress: ${b.totals.done}/${b.totals.items} steps done, ${b.totals.running} running, ${b.totals.failed} failed. Spend so far ${usd(b.totals.costUsd)}.`,
    ...b.projects.map((p) => `Project "${p.name}" is built in: ${p.deliverablePath}`),
    '',
    '## Steps (in plan order)',
  ];
  b.items.forEach((it, n) => {
    out.push(`### ${n + 1}. ${it.title}`);
    out.push(`- Status: ${STATUS[it.status] ?? it.status}`);
    out.push(`- Owner: ${it.assignee ? `${it.assignee.name} (${it.assignee.role})` : 'unassigned'}${it.taskType ? `, kind: ${it.taskType}` : ''}`);
    if (it.dependsOn.length) out.push(`- Waits for: ${it.dependsOn.map((d) => titles.get(d) ?? d).join('; ')}`);
    if (it.description) out.push(`- Task: ${it.description.replace(/\s+/g, ' ').slice(0, 600)}`);
    out.push(`- Attempts: ${it.runs.length}, spend ${usd(it.costUsd)}`);
    it.runs.slice(-3).forEach((r, k, arr) => out.push(`  - run ${it.runs.length - arr.length + k + 1}: ${runLine(r, now)}`));
    if (it.evaluation) {
      const failing = it.evaluation.dimensions.filter((d) => d.score !== 100);
      out.push(`- Latest checks: ${it.evaluation.status}${it.evaluation.score != null ? ` (score ${it.evaluation.score})` : ''}${it.evaluation.note ? ` | ${it.evaluation.note}` : ''}`);
      for (const d of failing) out.push(`  - FAILED ${d.name}: \`${d.command}\`\n    ${d.output.slice(-600).replace(/\n/g, '\n    ')}`);
    }
    for (const a of it.pendingApprovals ?? []) out.push(`- Waiting for approval: ${a.toolName} ${a.requestedAction ? JSON.stringify(a.requestedAction).slice(0, 200) : ''}`);
  });
  return out.filter((l) => l !== '').join('\n');
}

export function companyBriefing(c: CompanyLike, now = Date.now()): string {
  const out = [
    `# Company: ${c.company.name}`,
    `Stats: ${Object.entries(c.stats).map(([k, v]) => `${k} ${typeof v === 'number' && k.toLowerCase().includes('usd') ? usd(v) : v}`).join(', ')}`,
    '',
    '## Goals',
    ...c.goals.map((g) => `- ${g.title} (${g.status}): ${g.done}/${g.items} done, ${g.running} running, ${g.failed} failed, ${usd(g.costUsd)}`),
    '',
    '## Team',
    ...c.team.map((e) => {
      const model = (e.runtimeConfig as { model?: string } | null)?.model;
      const last = e.latestRun ? ` | latest run: ${runLine(e.latestRun, now)}` : '';
      return `- ${e.name}, ${e.role}${e.department ? ` (${e.department})` : ''}${model ? `, model ${model}` : ''}, ${e.status}${last}`;
    }),
  ];
  return out.join('\n');
}

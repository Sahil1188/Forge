/**
 * Pure shaping of a CEO plan into the work graph Forge creates — sanitising model output,
 * capping its size, resolving run order and attaching goal-level acceptance checks.
 */

export interface PlannedItem {
  title: string;
  description?: string;
  taskType?: string;
  /** 0-based indices of EARLIER plan items this one builds on; absent = the previous item. */
  dependsOn?: number[];
  /** Commands that must exit 0 for this item to pass evaluation. */
  acceptance?: string[];
}

export const MAX_TITLE = 300; // matches CreateWorkItemDto
const MAX_CHECKS = 10;
const MAX_CHECK_LEN = 500;

/** Keeps a plan entry only if it has a usable title; drops malformed fields from the rest. */
export function sanitizeItem(raw: unknown): PlannedItem[] {
  if (typeof raw !== 'object' || raw === null) return [];
  const r = raw as Record<string, unknown>;
  if (typeof r.title !== 'string' || !r.title.trim()) return [];
  return [
    {
      title: r.title.trim().slice(0, MAX_TITLE),
      description: typeof r.description === 'string' ? r.description : undefined,
      taskType: typeof r.taskType === 'string' ? r.taskType : undefined,
      dependsOn: Array.isArray(r.dependsOn) ? r.dependsOn.filter((d): d is number => Number.isInteger(d)) : undefined,
      acceptance: sanitizeChecks(r.acceptance),
    },
  ];
}

export function sanitizeChecks(raw: unknown): string[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const checks = raw
    .filter((c): c is string => typeof c === 'string' && c.trim().length > 0 && c.length <= MAX_CHECK_LEN)
    .map((c) => c.trim())
    .slice(0, MAX_CHECKS);
  return checks.length > 0 ? checks : undefined;
}

/**
 * Bounds the number of work items. Every item is a full agent run, and models like to slice
 * small goals into many trivial steps ("initialise", "verify end-to-end"…), which costs time
 * and money and fragments the work. Items beyond the cap are folded — not dropped — into the
 * last kept item, so their intent and acceptance checks still have to be delivered.
 */
export function capPlan(items: PlannedItem[], max: number): PlannedItem[] {
  const cap = Math.max(1, Math.floor(max));
  if (items.length <= cap) return items;
  const kept = items.slice(0, cap - 1);
  const folded = items.slice(cap - 1);
  const head = folded[0];
  const deps = folded
    .flatMap((i) => i.dependsOn ?? [])
    .filter((d) => d < cap - 1);
  const anyExplicit = folded.some((i) => i.dependsOn !== undefined);
  const checks = [...new Set(folded.flatMap((i) => i.acceptance ?? []))];
  const merged: PlannedItem = {
    title: head.title,
    taskType: head.taskType,
    description: folded
      .map((i) => (i.description ? `${i.title}: ${i.description}` : i.title))
      .join('\n'),
    dependsOn: anyExplicit ? [...new Set(deps)] : undefined,
    acceptance: checks.length > 0 ? checks.slice(0, MAX_CHECKS) : undefined,
  };
  return [...kept, merged];
}

/** Dependencies per item: explicit earlier-only indices, else the previous item (plan order). */
export function resolveDependencies(items: PlannedItem[]): number[][] {
  return items.map((item, i) => {
    if (i === 0) return [];
    const declared = item.dependsOn;
    return declared ? [...new Set(declared.filter((d) => d >= 0 && d < i))] : [i - 1];
  });
}

/**
 * Goal-level checks must hold for the delivered whole, so they go on the final item, and that
 * item is made to wait for every other end of the graph (so it runs on the integrated result).
 */
export function attachGoalAcceptance(
  items: PlannedItem[],
  deps: number[][],
  goalChecks: string[],
): { items: PlannedItem[]; deps: number[][] } {
  if (goalChecks.length === 0 || items.length === 0) return { items, deps };
  const last = items.length - 1;
  const dependedOn = new Set(deps.flat());
  const otherSinks = items.map((_, i) => i).filter((i) => i !== last && !dependedOn.has(i));
  const nextDeps = deps.map((d, i) => (i === last ? [...new Set([...d, ...otherSinks])] : d));
  const nextItems = items.map((it, i) =>
    i === last ? { ...it, acceptance: [...new Set([...(it.acceptance ?? []), ...goalChecks])] } : it,
  );
  return { items: nextItems, deps: nextDeps };
}

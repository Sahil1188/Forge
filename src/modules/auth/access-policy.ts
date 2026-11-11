import { Role, ROLES } from './auth.schema';

/** Pages, assets, health and sign-in work without a session. */
export function isPublic(method: string, path: string): boolean {
  if (method === 'GET' && (/^\/(ui)?$/.test(path) || /^\/assets\/[^/]+$/.test(path) || /^\/health(\/.*)?$/.test(path))) return true;
  return /^\/auth\/(status|login|setup|logout)$/.test(path);
}

export function atLeast(have: Role | null | undefined, need: Role): boolean {
  return have != null && ROLES.indexOf(have) >= ROLES.indexOf(need);
}

/**
 * The role a request needs in the company it touches.
 *  viewer  — read anything
 *  member  — give work, request changes, start/retry/cancel work
 *  admin   — manage employees, budgets, permissions, approvals, assignment, company settings
 *  owner   — manage people and their access
 */
export function requiredRole(method: string, path: string): Role {
  // People and their emails/roles: owners only, even to read.
  if (/^\/companies\/[^/]+\/members(\/[^/]+)?$/.test(path)) return 'owner';
  if (/^\/system\/intake$/.test(path) && method === 'POST') return 'admin';
  if (/^\/brands$/.test(path) && method === 'POST') return 'admin';
  if (/^\/system\/fallback-drill$/.test(path) && method !== 'GET') return 'admin';
  if (method === 'GET' || method === 'HEAD') return 'viewer';
  if (method === 'PATCH' && /^\/companies\/[^/]+$/.test(path)) return 'admin';
  if (/^\/companies\/[^/]+\/(employees|starter-team)$/.test(path)) return 'admin';
  if (/^\/employees\//.test(path)) return 'admin';
  if (/^\/approvals\/[^/]+\/decision$/.test(path)) return 'admin';
  if (/^\/work-items\/[^/]+\/(assign|route|dependencies)$/.test(path)) return 'admin';
  return 'member';
}

export type ResourceKind = 'company' | 'goal' | 'employee' | 'work_item' | 'project' | 'agent_run' | 'approval' | 'evaluation';

const KINDS: Record<string, ResourceKind> = {
  companies: 'company',
  goals: 'goal',
  employees: 'employee',
  'work-items': 'work_item',
  projects: 'project',
  'agent-runs': 'agent_run',
  approvals: 'approval',
  evaluations: 'evaluation',
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Which record a request is about (its company decides access), or null for company-less routes. */
export function resourceOf(path: string): { kind: ResourceKind; id: string } | null {
  const [, first, id] = path.split('/');
  const kind = KINDS[first];
  if (!kind || !id || !UUID.test(id)) return null;
  return { kind, id };
}

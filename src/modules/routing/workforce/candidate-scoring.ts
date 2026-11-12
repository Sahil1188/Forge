import { WorkforceRoutingDecision } from './workforce-router.port';
import { domainOf } from '../../work/domains';

export interface CandidateSkill {
  skillKey: string;
  level: number;
}

export interface CandidateInput {
  id: string;
  role: string;
  department?: string | null;
  status: string;
  skills: CandidateSkill[];
  reputation?: number | null;
}

// Track record counts: people whose work keeps passing get preferred. Newcomers start neutral.
const WEIGHTS = { skill: 0.4, role: 0.3, availability: 0.15, reputation: 0.15 };
const NEUTRAL_REPUTATION = 60;

const AVAILABILITY: Record<string, number> = {
  idle: 1,
  working: 0.3,
  paused_for_approval: 0.1,
  error: 0,
};

function relevantSkillScore(taskType: string, skills: CandidateSkill[]): number {
  if (skills.length === 0) return 0;
  const hints = domainOf(taskType).skills;
  const matched = skills.filter((s) => hints.some((h) => s.skillKey.toLowerCase().includes(h)));
  // No relevant skill: general seniority still counts, but at half weight (a finance expert is not a coder).
  const pool = matched.length > 0 ? matched : skills;
  const avg = pool.reduce((a, s) => a + s.level, 0) / pool.length;
  return (matched.length > 0 || hints.length === 0 ? avg : avg / 2) / 100;
}

/** 1 when the candidate's role fits the work or they sit in the department that owns its domain. */
function roleAffinity(taskType: string, role: string, department?: string | null): number {
  const domain = domainOf(taskType);
  const inDepartment =
    Boolean(domain.department) &&
    (department ?? '').toLowerCase() === domain.department.toLowerCase();
  const hay = `${role} ${department ?? ''}`.toLowerCase();
  const roleFits = domain.roles.some((k) => hay.includes(k));
  if (roleFits) return 1;
  return inDepartment ? 0.8 : 0.3;
}

export function scoreCandidate(
  taskType: string,
  candidate: CandidateInput,
): { score: number; reasons: Record<string, number> } {
  const skill = relevantSkillScore(taskType, candidate.skills);
  const role = roleAffinity(taskType, candidate.role, candidate.department);
  const availability = AVAILABILITY[candidate.status] ?? 0.5;
  const reputation = (candidate.reputation ?? NEUTRAL_REPUTATION) / 100;

  const score =
    (WEIGHTS.skill * skill +
      WEIGHTS.role * role +
      WEIGHTS.availability * availability +
      WEIGHTS.reputation * reputation) *
    100;

  return {
    score: Math.round(score * 100) / 100,
    reasons: {
      skill: Math.round(skill * 100),
      role: Math.round(role * 100),
      availability: Math.round(availability * 100),
      reputation: Math.round(reputation * 100),
    },
  };
}

export function selectBest(
  taskType: string,
  candidates: CandidateInput[],
): WorkforceRoutingDecision | null {
  let best: WorkforceRoutingDecision | null = null;
  for (const candidate of candidates) {
    const { score, reasons } = scoreCandidate(taskType, candidate);
    if (!best || score > best.score) {
      best = { employeeId: candidate.id, score, reasons };
    }
  }
  return best;
}

/** Executives (CEO / Chief …) plan and delegate; they are not the default doers of work. */
export function isExecutive(role: string): boolean {
  return /\bceo\b|\bchief\b/i.test(role);
}

/**
 * The candidates eligible to execute work: executives are only considered when nobody else
 * is available (observed live: a CEO routed execution work ran out of its planning turn budget).
 */
export function executionPool<T extends { role: string }>(candidates: T[]): T[] {
  const doers = candidates.filter((c) => !isExecutive(c.role));
  return doers.length > 0 ? doers : candidates;
}

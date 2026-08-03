import { WorkforceRoutingDecision } from './workforce-router.port';

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

// V1 weights. Reputation is wired but weighted 0 (spec §7) until there's data.
const WEIGHTS = { skill: 0.5, role: 0.3, availability: 0.2, reputation: 0.0 };

const TASK_SKILL_HINTS: Record<string, string[]> = {
  architecture: ['architecture', 'design', 'system'],
  coding: ['node', 'java', 'python', 'typescript', 'go', 'coding', 'backend', 'frontend', 'sql', 'spring'],
  review: ['review', 'quality', 'architecture'],
  devops: ['devops', 'kubernetes', 'docker', 'ci', 'cloud', 'sre'],
  qa: ['qa', 'test', 'testing'],
  generic: [],
};

const TASK_ROLE_HINTS: Record<string, string[]> = {
  architecture: ['architect', 'cto', 'lead', 'principal'],
  coding: ['engineer', 'developer', 'backend', 'frontend', 'software'],
  review: ['reviewer', 'senior', 'lead', 'principal'],
  devops: ['devops', 'sre', 'ops', 'platform'],
  qa: ['qa', 'test', 'quality'],
  generic: [],
};

const AVAILABILITY: Record<string, number> = {
  idle: 1,
  working: 0.3,
  paused_for_approval: 0.1,
  error: 0,
};

function relevantSkillScore(taskType: string, skills: CandidateSkill[]): number {
  if (skills.length === 0) return 0;
  const hints = TASK_SKILL_HINTS[taskType] ?? [];
  const matched = skills.filter((s) => hints.some((h) => s.skillKey.toLowerCase().includes(h)));
  const pool = matched.length > 0 ? matched : skills;
  const avg = pool.reduce((a, s) => a + s.level, 0) / pool.length;
  return avg / 100;
}

function roleAffinity(taskType: string, role: string, department?: string | null): number {
  const hints = TASK_ROLE_HINTS[taskType] ?? [];
  const hay = `${role} ${department ?? ''}`.toLowerCase();
  return hints.some((k) => hay.includes(k)) ? 1 : 0.3;
}

export function scoreCandidate(
  taskType: string,
  candidate: CandidateInput,
): { score: number; reasons: Record<string, number> } {
  const skill = relevantSkillScore(taskType, candidate.skills);
  const role = roleAffinity(taskType, candidate.role, candidate.department);
  const availability = AVAILABILITY[candidate.status] ?? 0.5;
  const reputation = (candidate.reputation ?? 0) / 100;

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

/**
 * The work domains of a Forge company. One table drives task types, which department owns the
 * work, routing hints (skills and roles), complexity, and how a plain-text task is classified.
 */

import { classify } from './classify';

interface Domain {
  department: string;
  weight: number;
  skills: string[];
  roles: string[];
  keywords: string[];
}

export const DOMAINS = {
  architecture: { department: 'Engineering', weight: 0.9, skills: ['architecture', 'system design'], roles: ['architect', 'principal', 'lead'], keywords: ['architecture', 'system design', 'design doc'] },
  coding: { department: 'Engineering', weight: 0.6, skills: ['node', 'typescript', 'javascript', 'python', 'java', 'go', 'backend', 'api', 'sql'], roles: ['backend', 'software', 'engineer', 'developer'], keywords: ['api', 'backend', 'cli', 'script', 'library', 'endpoint', 'database', 'implement'] },
  frontend: { department: 'Engineering', weight: 0.6, skills: ['frontend', 'react', 'css', 'html', 'accessibility'], roles: ['frontend', 'web'], keywords: ['frontend', 'front-end', 'react', 'web page', 'website', 'landing page', 'css', 'html'] },
  qa: { department: 'Engineering', weight: 0.5, skills: ['testing', 'qa', 'test automation'], roles: ['qa', 'test', 'quality'], keywords: ['test plan', 'test suite', 'qa ', 'regression'] },
  review: { department: 'Engineering', weight: 0.5, skills: ['code review', 'quality', 'architecture'], roles: ['reviewer', 'principal', 'lead'], keywords: ['code review', 'review the'] },
  design: { department: 'Product & Design', weight: 0.6, skills: ['ui design', 'ux', 'design systems', 'user research'], roles: ['designer', 'ux'], keywords: ['ux', 'user experience', 'wireframe', 'mockup', 'design system', 'user flow'] },
  product: { department: 'Product & Design', weight: 0.6, skills: ['product management', 'requirements', 'roadmapping'], roles: ['product'], keywords: ['requirements', 'roadmap', 'user stories', 'prd', 'product spec'] },
  devops: { department: 'Cloud & Infrastructure', weight: 0.6, skills: ['devops', 'ci', 'docker', 'kubernetes', 'sre'], roles: ['devops', 'sre', 'platform'], keywords: ['ci/cd', 'pipeline', 'docker', 'kubernetes', 'deploy', 'github actions'] },
  cloud: { department: 'Cloud & Infrastructure', weight: 0.8, skills: ['aws', 'azure', 'gcp', 'terraform', 'cloud architecture'], roles: ['cloud'], keywords: ['aws', 'azure', 'gcp', 'terraform', 'cloud', 'serverless'] },
  network: { department: 'Cloud & Infrastructure', weight: 0.8, skills: ['networking', 'tcp/ip', 'dns', 'routing', 'vpn'], roles: ['network'], keywords: ['network', 'subnet', 'vpc', 'dns', 'firewall', 'vpn', 'load balancer'] },
  security: { department: 'Security', weight: 0.8, skills: ['application security', 'threat modeling', 'compliance', 'cryptography'], roles: ['security'], keywords: ['security', 'threat model', 'vulnerab', 'owasp', 'compliance', 'audit', 'encryption'] },
  data: { department: 'Data', weight: 0.7, skills: ['data engineering', 'statistics', 'machine learning', 'sql', 'analytics'], roles: ['data'], keywords: ['data pipeline', 'etl', 'dataset', 'machine learning', 'analytics', 'dashboard metrics'] },
  finance: { department: 'Finance', weight: 0.8, skills: ['financial modeling', 'banking', 'fintech', 'accounting', 'valuation'], roles: ['financ', 'cfo', 'analyst'], keywords: ['finance', 'financial', 'revenue model', 'forecast', 'valuation', 'budget', 'loan', 'banking', 'fintech', 'pricing model', 'p&l', 'cash flow'] },
  operations: { department: 'Operations', weight: 0.5, skills: ['operations', 'process design', 'project management'], roles: ['operations', 'ops'], keywords: ['process', 'sop', 'runbook', 'operations', 'onboarding plan'] },
  marketing: { department: 'Operations', weight: 0.5, skills: ['marketing', 'copywriting', 'seo', 'growth'], roles: ['marketing', 'growth'], keywords: ['marketing', 'copy', 'seo', 'campaign', 'launch plan'] },
  legal: { department: 'Operations', weight: 0.6, skills: ['contracts', 'privacy', 'compliance'], roles: ['legal', 'counsel'], keywords: ['terms of service', 'privacy policy', 'contract', 'gdpr', 'legal'] },
  generic: { department: '', weight: 0.4, skills: [], roles: [], keywords: [] },
} satisfies Record<string, Domain>;

export type TaskType = keyof typeof DOMAINS;
export const TASK_TYPES = Object.keys(DOMAINS) as TaskType[];

export function isTaskType(value: unknown): value is TaskType {
  return typeof value === 'string' && value in DOMAINS;
}

export function domainOf(taskType: string): Domain {
  return (DOMAINS as Record<string, Domain>)[taskType] ?? DOMAINS.generic;
}

/** Best-guess domain for free text (direct tasks, change requests, choosing a goal's planner). */
export function inferTaskType(text: string): TaskType {
  return classify(text).taskType;
}

/**
 * Classifies a plain-language request into a work domain.
 *
 * Counting keywords is not enough: "add a web interface … reuse the CLI's logic … test the web API"
 * mentions backend words more often, yet what is being asked for is a user interface. So the
 * classifier looks for the deliverable — an action verb followed by the thing to produce — and lets
 * the first deliverable in the request outweigh incidental mentions anywhere else.
 */
import type { TaskType } from './domains';

type Signals = Partial<Record<TaskType, string[]>>;

/** Things a request can ask to be produced, per domain (regex fragments, matched on word boundaries). */
const DELIVERABLES: Signals = {
  frontend: [
    'web ?(interface|ui|app|application|front ?end|page|portal|client)',
    'user interface',
    'ui',
    'front-?end',
    'website',
    'landing page(?! copy)',
    'single[- ]page app',
    'spa',
    'dashboard',
    'admin panel',
    'page(?! copy)',
    'screen',
    'react (app|component)',
    'vue app',
    'component library',
    'mobile[- ]friendly (site|page|ui)',
    'responsive (site|page|ui|layout)',
  ],
  design: [
    'wireframes?',
    'mock-?ups?',
    'prototype',
    'design system',
    'style guide',
    'user flows?',
    'ux (design|audit|review)',
    'logo',
    'brand identity',
  ],
  coding: [
    '(rest |graphql |web )?api',
    'endpoints?',
    'back-?end',
    '(micro)?services?',
    'cli',
    'command[- ]line (tool|app|application|interface)?',
    'library',
    'sdk',
    'script',
    'database schema',
    'migrations?',
    'worker',
    'bot',
    'parser',
    'integration',
    'server',
    'function',
  ],
  qa: ['test suite', 'test plan', '(e2e|end-to-end|integration|regression|load) tests', 'qa plan'],
  devops: [
    'ci/?cd( pipeline)?',
    'pipeline',
    'dockerfile',
    'docker image',
    'kubernetes (manifests|deployment)',
    'helm chart',
    'github actions( workflow)?',
    'deployment',
  ],
  cloud: [
    'terraform( module| config)?',
    'cloud (infrastructure|architecture|setup)',
    'aws (setup|infrastructure|stack)',
    'azure (setup|infrastructure)',
    'gcp (setup|infrastructure)',
    'serverless (app|stack|function)',
  ],
  network: [
    'network (design|topology|plan)',
    'vpcs?',
    'subnets?',
    'firewall rules',
    'vpn',
    'dns (setup|records)',
    'load balancer',
  ],
  security: [
    'security (review|audit|assessment|hardening)',
    'threat model',
    'pen(etration)? ?test',
    'vulnerability (scan|assessment)',
    'owasp review',
  ],
  data: [
    'data pipeline',
    'etl( job)?',
    'dataset',
    '(ml|machine learning) model',
    'data warehouse',
    'analytics (report|pipeline)',
    'notebook',
  ],
  finance: [
    'financial model',
    'revenue model',
    '(cash flow|revenue|sales) forecast',
    'forecast',
    'valuation',
    'budget( workbook)?',
    'loan (model|calculator)',
    'amortization (model|schedule|calculator)',
    'p&l',
    'pricing model',
    'unit economics',
    'invoice',
    'cap table',
  ],
  product: [
    'prd',
    'product (spec|requirements)',
    'requirements( doc(ument)?)?',
    'user stories',
    'roadmap',
  ],
  operations: ['sops?', 'runbooks?', 'process (doc|design|map)', 'onboarding plan', 'playbook'],
  marketing: [
    'marketing plan',
    'launch plan',
    '(landing page |website )?copy',
    'seo (plan|audit|content)',
    'campaign',
    'blog posts?',
    'newsletter',
  ],
  legal: [
    'terms of (service|use)',
    'privacy policy',
    'contracts?',
    'nda',
    'dpa',
    'gdpr (review|policy)',
  ],
  architecture: [
    'architecture( doc(ument)?| diagram)?',
    'system design',
    'design doc(ument)?',
    'adrs?',
    'technical design',
  ],
};

/** Weaker words that hint at a domain wherever they appear. */
const HINTS: Signals = {
  frontend: [
    'html',
    'css',
    'react',
    'vue',
    'svelte',
    'angular',
    'next\\.js',
    'browser',
    'responsive',
    'accessibility',
    'charts?',
    'forms?',
    'button',
    'layout',
  ],
  coding: [
    'node(\\.js)?',
    'python',
    'typescript',
    'golang',
    'java',
    'sql',
    'database',
    'json',
    'http',
  ],
  qa: ['tests?', 'coverage', 'regression'],
  devops: ['docker', 'kubernetes', 'k8s', 'deploy'],
  cloud: ['aws', 'azure', 'gcp', 'cloud', 'lambda', 's3', 'iam'],
  network: ['network', 'dns', 'tcp', 'routing', 'bgp'],
  security: [
    'security',
    'secure',
    'encryption',
    'vulnerab\\w*',
    'owasp',
    'compliance',
    'soc ?2',
    'iso ?27001',
    'pci',
  ],
  data: ['data', 'analytics', 'statistics', 'machine learning'],
  finance: [
    'finance',
    'financial',
    'fintech',
    'banking',
    'interest',
    'revenue',
    'cash',
    'loan',
    'expenses?',
  ],
  design: ['ux', 'design', 'figma'],
  marketing: ['marketing', 'seo', 'audience'],
  legal: ['legal', 'gdpr', 'compliance', 'liability'],
};

const VERBS =
  'build|create|add|make|design|develop|write|draft|set ?up|implement|generate|produce|prepare|put together|ship|deliver|give me|i need|i want|we need';

function rx(fragment: string): RegExp {
  return new RegExp(`\\b(?:${fragment})\\b`, 'gi');
}

export interface Classification {
  taskType: TaskType;
  scores: Partial<Record<TaskType, number>>;
}

export function classify(text: string): Classification {
  const t = ` ${text.toLowerCase().replace(/\s+/g, ' ')} `;
  const scores: Partial<Record<TaskType, number>> = {};
  const add = (k: TaskType, n: number) => (scores[k] = (scores[k] ?? 0) + n);

  // Deliverables: "<verb> [a/an/the/some + up to 4 words] <thing>". The first one stated is the main ask.
  const found: Array<{ k: TaskType; at: number; end: number; noun: number }> = [];
  for (const [k, fragments] of Object.entries(DELIVERABLES) as Array<[TaskType, string[]]>) {
    for (const f of fragments) {
      const re = new RegExp(
        `\\b(?:${VERBS})\\b(?:\\s+(?:a|an|the|some|my|our|this|that|its|new|simple|small|clean|modern|full|proper|basic))*(?:\\s+[\\w./&'-]+){0,4}?\\s+(?<noun>${f})\\b`,
        'gi',
      );
      for (const m of t.matchAll(re)) {
        const at = m.index ?? 0;
        found.push({ k, at, end: at + m[0].length, noun: m.groups?.noun?.length ?? 0 });
      }
    }
    // Mentioned anywhere as a thing: medium signal, counted once per pattern.
    for (const f of fragments) if (rx(f).test(t)) add(k, 1);
  }
  // Earliest verb first; for the same verb, the thing closest to it, then the most specific one.
  found.sort((a, b) => a.at - b.at || a.end - b.end || b.noun - a.noun);
  found.forEach((d, i) => add(d.k, i === 0 ? 5 : 1.5));

  for (const [k, words] of Object.entries(HINTS) as Array<[TaskType, string[]]>) {
    for (const w of words) if (rx(w).test(t)) add(k, 0.5);
  }

  let best: TaskType = 'coding';
  let top = 0;
  for (const [k, v] of Object.entries(scores) as Array<[TaskType, number]>) {
    if (v > top) {
      best = k;
      top = v;
    }
  }
  return { taskType: best, scores };
}

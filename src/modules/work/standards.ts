import type { TaskType } from './domains';

/**
 * The production bar each specialist is held to: concrete industry practices a senior reviewer would
 * insist on, per domain, plus what every deliverable must have. Given to the agent with its task and
 * used by the final production review.
 */

export const GENERAL_STANDARDS = [
  'Deliver a complete, polished product, not a demo: handle the edge cases a real user will hit.',
  'Clear structure: small focused modules, meaningful names, no dead code or TODO placeholders.',
  'Validate every input at the boundary and fail with clear, actionable messages; never crash on bad input.',
  'Automated tests for the important behaviour, including edge cases and failure paths; all must pass.',
  'README.md: what it is, how to install, run, configure and test it, with real example commands and output.',
  'No secrets in code; configuration through environment variables with documented defaults.',
  'Consistent formatting; lint/format scripts if the ecosystem has them.',
];

export const STANDARDS: Partial<Record<TaskType, string[]>> = {
  frontend: [
    'A real design, not browser defaults: a consistent type scale, spacing scale and colour palette defined once (CSS variables/design tokens).',
    'Responsive from 360px to wide desktop: no horizontal scrolling, nothing cut off; tables become stacked cards or scroll inside their container on phones.',
    'Accessible (WCAG 2.2 AA): semantic HTML, labelled form fields, visible keyboard focus, sufficient contrast, ARIA only where needed.',
    'Every state designed: loading, empty (with a helpful message and next step), error (with retry), success feedback.',
    'Forms: inline validation, disabled submit while saving, errors next to the field, keep user input on failure.',
    'Charts and visuals must actually render data (correct widths/heights from values) and have text labels.',
    'Safe rendering: never inject untrusted data as HTML (escape or use textContent); add a Content-Security-Policy where you serve pages.',
    'Check it in a real browser engine (e.g. a headless render or a test that loads the page) at phone and desktop widths before finishing.',
  ],
  coding: [
    'Layered design: input handling, business logic and storage separated so logic is testable without I/O.',
    'HTTP APIs: correct status codes, JSON error bodies with a message, input validation, request size limits, security headers.',
    'Data integrity: atomic writes (write to a temp file then rename) or transactions; no corrupted state on crash.',
    'Structured, levelled logging for servers; graceful shutdown; configurable port/host via environment.',
    'Unit tests for logic and integration tests for the interface (CLI commands / HTTP endpoints).',
  ],
  qa: ['Test plan covering happy paths, edge cases, invalid input and regressions; automated where possible.', 'Tests are deterministic, isolated (temp dirs, no shared state) and fast.'],
  design: ['Design tokens (colour, type, spacing, radius) and component specs with all states.', 'Accessibility and responsive behaviour specified, not left to the developer.'],
  devops: ['Reproducible builds with pinned versions; least-privilege CI tokens; caching; fails fast on test/lint errors.', 'Containers run as non-root with a minimal base image and a healthcheck.'],
  cloud: ['Infrastructure as code with variables and outputs; least-privilege IAM; encryption at rest and in transit; tagging; cost awareness.'],
  network: ['Documented addressing plan, segmentation (public/private), deny-by-default firewall rules, redundancy, and a diagram.'],
  security: ['Map findings to OWASP / CWE with severity and evidence; fix with a test that proves the fix; never weaken other controls.'],
  data: ['Reproducible pipelines with schema validation and data-quality checks; idempotent loads; documented lineage.'],
  finance: [
    'Driver-based model: every assumption in one clearly labelled place, never hard-coded inside formulas.',
    'Money handled exactly (integer cents or decimal), rounding stated, totals that tie out; checks that prove the maths.',
    'Workbooks use real formulas, number formats, frozen headers and a summary sheet; documents explain method and limitations.',
  ],
  product: ['Problem, users, goals and non-goals, user stories with acceptance criteria, metrics, risks.'],
  operations: ['Step-by-step procedures with owners, triggers, rollback/escalation paths and checklists.'],
  marketing: ['Clear positioning and audience, benefit-led copy, a measurable plan with channels and KPIs.'],
  legal: ['Plain-language drafts with defined terms; flag jurisdiction-specific points; note they need review by a qualified lawyer.'],
  architecture: ['Context, constraints, options considered with trade-offs, the decision, and consequences; diagrams.'],
};

export function standardsFor(taskType: string): string[] {
  return [...GENERAL_STANDARDS, ...(STANDARDS[taskType as TaskType] ?? [])];
}

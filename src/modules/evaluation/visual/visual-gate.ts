import { Injectable, Logger } from '@nestjs/common';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import * as path from 'node:path';
import { RuntimeRegistry } from '../../runtimes/runtime-registry';
import { AgentRunsService } from '../../runtimes/agent-runs.service';
import { BudgetsService } from '../../budgets/budgets.service';
import { EmployeesService } from '../../employees/employees.service';
import { confinementGate } from '../../governance/path-confinement';
import { findBrowser, hasWebUi, launchApp } from './app-launcher';
import { shootScript } from './shoot-script';
import type { DimensionResult } from '../evaluation-engine';
import { brandChecklist, describeBrand } from '../../brands/brand-library';

export interface VisualIssue {
  severity: 'critical' | 'major' | 'minor';
  screen?: string;
  problem: string;
  fix?: string;
}

interface VisualReview {
  pass?: boolean;
  score?: number;
  summary?: string;
  issues?: VisualIssue[];
}

/** The bar a senior product designer holds a screen to. */
const RUBRIC = [
  'Layout: a clear grid, consistent alignment and spacing, no awkward empty areas, content sized to its container; tabular data shown as a real table on desktop, as cards only on small screens.',
  'Hierarchy and typography: one obvious primary action, a clear type scale, nothing below 12px except tiny captions, labels readable (charts included).',
  'Finish: every component looks designed (no default browser styling, no stray boxes, no misaligned icons, no overlapping elements), consistent colours with sufficient contrast.',
  'Phone (390px): nothing cut off or overlapping (floating buttons must not cover content), touch targets at least 40px, comfortable spacing.',
  'States: a helpful empty state; the app still looks right filled with realistic data; feedback (toasts, errors) is clear and does not pile up or hide content.',
  'Overall: would a senior designer at a top product company ship this to customers today?',
];

/**
 * The visual quality gate. Tests prove an app works, not that it looks right, so for UI work Forge
 * runs the app (in a throwaway copy), and a design reviewer on a strong model drives it with a
 * screenshot tool, looks at desktop and phone screenshots, and grades them against the rubric.
 * Failing screens go back to the builder with the specific problems.
 */
@Injectable()
export class VisualGate {
  private readonly logger = new Logger(VisualGate.name);

  constructor(
    private readonly registry: RuntimeRegistry,
    private readonly agentRuns: AgentRunsService,
    private readonly budgets: BudgetsService,
    private readonly employees: EmployeesService,
  ) {}

  async check(
    rootPath: string,
    opts: { companyId: string; goalId: string; title: string },
  ): Promise<DimensionResult | null> {
    if (process.env.FORGE_VISUAL_GATE === '0') return null;
    if (!(await hasWebUi(rootPath))) return null;
    const browser = findBrowser();
    if (!browser) {
      this.logger.warn(
        'Visual gate skipped: no Chrome/Edge/Chromium found (set FORGE_BROWSER_PATH)',
      );
      return null;
    }
    const reviewer = await this.pickReviewer(opts.companyId);
    if (!reviewer) return null;

    const started = Date.now();
    let app;
    try {
      app = await launchApp(rootPath);
    } catch (err) {
      // A UI that does not even start is a failure of the work, not of the gate.
      return this.result(
        false,
        0,
        `The app could not be started the way a user would (install, build, start):\n${(err as Error).message}`,
        started,
      );
    }

    const dir = path.join(process.cwd(), 'workspaces', 'visual', randomUUID());
    try {
      await mkdir(dir, { recursive: true });
      await writeFile(
        path.join(dir, 'shoot.cjs'),
        shootScript(require.resolve('playwright-core'), browser, app.url),
        'utf8',
      );
      const model = process.env.FORGE_VISUAL_MODEL ?? 'opus';
      const run = await this.agentRuns.create({
        goalId: opts.goalId,
        employeeId: reviewer.id,
        runtimeKey: 'claude_code',
        provider: 'anthropic',
        model,
      });
      let costUsd = 0;
      let completed = false;
      for await (const event of this.registry.get('claude_code').run({
        workItemId: `visual:${opts.goalId}`,
        employeeId: reviewer.id,
        cwd: dir,
        model,
        task: this.task(opts.title, app.url, await brandRules(rootPath)),
        systemPromptAppend: `# ${reviewer.name} — design review\n\n${reviewer.description ?? 'Senior product designer.'}\nYou judge screens like a demanding design lead. Be specific and strict.`,
        limits: { maxTurns: 60 },
        canUseTool: confinementGate(dir),
      })) {
        if (event.kind === 'usage') {
          costUsd += event.costUsd;
          await this.budgets.recordCost(run.id, reviewer.id, {
            inputTokens: event.inputTokens,
            outputTokens: event.outputTokens,
            costUsd: event.costUsd,
          });
        } else if (event.kind === 'completed') completed = true;
      }
      await this.agentRuns.finish(run.id, {
        status: completed ? 'completed' : 'failed',
        estimatedCostUsd: costUsd,
        error: completed ? undefined : 'visual review did not finish',
      });

      const review = await this.readReview(dir);
      if (!review)
        return this.result(
          false,
          0,
          'The design review produced no verdict (VISUAL_REVIEW.json missing); treat the UI as unverified.',
          started,
        );
      const issues = review.issues ?? [];
      const serious = issues.filter((i) => i.severity === 'critical' || i.severity === 'major');
      const score = Math.max(0, Math.min(100, Math.round(review.score ?? 0)));
      const pass =
        review.pass === true &&
        score >= Number(process.env.FORGE_VISUAL_MIN_SCORE ?? 85) &&
        serious.length === 0;
      const lines = [
        `Design review: ${score}/100 — ${pass ? 'passed' : 'not good enough to ship'}.${review.summary ? ` ${review.summary}` : ''}`,
        ...issues.map(
          (i) =>
            `- [${i.severity}]${i.screen ? ` (${i.screen})` : ''} ${i.problem}${i.fix ? ` → Fix: ${i.fix}` : ''}`,
        ),
        `Screenshots: ${dir}`,
      ];
      return this.result(pass, score, lines.join('\n'), started);
    } finally {
      await app.stop();
    }
  }

  private task(title: string, url: string, brand: string[] = []): string {
    return [
      `Review the user interface of "${title}". It is running at ${url}.`,
      '',
      'Use the screenshot tool in this folder:  node shoot.cjs <name> [steps.json]',
      'It saves <name>-desktop.png and <name>-phone.png and prints measured problems. Open the PNGs with the Read tool and look at them carefully.',
      'Steps are JSON like [{"do":"click","selector":"#add"},{"do":"fill","selector":"#amount","value":"42.50"},{"do":"wait","ms":400}].',
      '',
      '1. Screenshot the first screen as-is (empty state).',
      '2. Find the main forms/buttons (read the page source with: node -e "fetch(\'' +
        url +
        '\').then(r=>r.text()).then(console.log)") and add 5-8 realistic records through the UI, then screenshot the filled state.',
      '3. Screenshot any important dialog or secondary view.',
      '',
      'Grade strictly against this rubric:',
      ...RUBRIC.map((r) => `- ${r}`),
      ...brand,
      '',
      'Write VISUAL_REVIEW.json in this folder:',
      '{ "pass": boolean, "score": 0-100, "summary": "one sentence", "issues": [ { "severity": "critical"|"major"|"minor", "screen": "desktop|phone|both", "problem": "what is wrong, specifically", "fix": "what to change" } ] }',
      'Pass only if a senior designer would ship it today: score 85+ with no critical or major issues. Do not change the app.',
    ].join('\n');
  }

  private async readReview(dir: string): Promise<VisualReview | null> {
    try {
      return JSON.parse(
        await readFile(path.join(dir, 'VISUAL_REVIEW.json'), 'utf8'),
      ) as VisualReview;
    } catch {
      return null;
    }
  }

  /** The company's designer, else the principal reviewer, else anyone. */
  private async pickReviewer(companyId: string) {
    const roster = await this.employees.findByCompany(companyId);
    const base =
      roster.find((e) => /designer|ux/i.test(e.role)) ??
      roster.find((e) => /review/i.test(e.role)) ??
      roster[0];
    return base ? this.employees.findOne(base.id) : null;
  }

  private result(pass: boolean, score: number, output: string, started: number): DimensionResult {
    return {
      score: pass ? 100 : 0,
      ran: true,
      exitCode: pass ? 0 : 1,
      command: `visual design review (${score}/100)`,
      output: output.slice(0, 4000),
      durationMs: Date.now() - started,
    };
  }
}

/**
 * When the product follows a brand (BRAND.md), the review also grades it against that brand: its
 * own screen checklist, and the rules that most often slip (palette, fonts, light only).
 */
export async function brandRules(rootPath: string): Promise<string[]> {
  let content: string;
  try {
    content = await readFile(path.join(rootPath, 'BRAND.md'), 'utf8');
  } catch {
    return [];
  }
  const { name } = describeBrand('brand', content);
  const checklist = brandChecklist(content, 'platform');
  return [
    `- Brand: the product must follow the ${name} brand in BRAND.md (open it). Any screen using colours, fonts, radii or components that are not the brand's, any dark mode or dark section, or a generic default look is a major issue.`,
    ...(checklist.length
      ? [`- ${name} checklist, every screen:`, ...checklist.map((c) => `  - ${c}`)]
      : []),
  ];
}

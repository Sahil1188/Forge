import { Injectable } from '@nestjs/common';
import { ScriptDiscovery } from './script-discovery';
import { CommandRunner } from './command-runner';
import { EvaluationStatus } from './evaluation.schema';
import { redactSecrets } from '../governance/redaction';

export interface DimensionResult {
  score: number;
  ran: boolean;
  exitCode: number | null;
  command: string;
  output: string;
  durationMs: number;
}

export interface EvaluationResult {
  status: EvaluationStatus;
  overallScore: number | null;
  dimensions: Record<string, DimensionResult>;
  note?: string;
  /** Acceptance checks that could not run at all (invalid check, not failing work). */
  brokenChecks?: string[];
}

const OUTPUT_LIMIT = 4000;

/**
 * Runs the discovered verification commands and scores the result. Each present
 * dimension scores 100 (exit 0) or 0; overall is their mean. A run passes only
 * if every dimension passes (spec §12) — never on the agent's say-so.
 */
@Injectable()
export class EvaluationEngine {
  constructor(
    private readonly discovery: ScriptDiscovery,
    private readonly runner: CommandRunner,
  ) {}

  /**
   * `acceptance`: extra commands that must exit 0 — objective checks that the work matches its
   * brief (e.g. "index.js exists and exports slugify"), not just that its own tests pass.
   */
  async evaluateRepo(rootPath: string, acceptance: string[] = []): Promise<EvaluationResult> {
    const discovered = await this.discovery.discover(rootPath);
    const scripts = [
      ...discovered,
      ...acceptance.map((command, i) => ({ name: `acceptance#${i + 1}`, command })),
    ];
    if (scripts.length === 0) {
      return {
        status: 'inconclusive',
        overallScore: null,
        dimensions: {},
        note: 'No known toolchain (package.json scripts) found to verify.',
      };
    }

    const dimensions: Record<string, DimensionResult> = {};
    const scores: number[] = [];
    // The same command is never run twice in one round (checks often repeat build/test).
    const ranAlready = new Map<string, { exitCode: number | null; output: string }>();
    let projectChecksFailed = false;
    for (const script of scripts) {
      const isAcceptance = script.name.startsWith('acceptance');
      // When the project's own lint/test/build already fail, acceptance checks would rebuild and fail on
      // the same errors: skip them this round (the failing checks carry the feedback) to save minutes.
      if (isAcceptance && projectChecksFailed) {
        dimensions[script.name] = {
          score: 0,
          ran: false,
          exitCode: null,
          command: script.command,
          output: 'Not run this round: fix the failing project checks (lint/test/build) first.',
          durationMs: 0,
        };
        scores.push(0);
        continue;
      }
      const started = Date.now();
      const result = ranAlready.get(script.command) ?? (await this.runner.run(script.command, rootPath));
      ranAlready.set(script.command, result);
      const score = result.exitCode === 0 ? 100 : 0;
      if (!isAcceptance && score === 0) projectChecksFailed = true;
      dimensions[script.name] = {
        score,
        ran: true,
        exitCode: result.exitCode,
        command: script.command,
        output: redactSecrets(result.output).slice(0, OUTPUT_LIMIT),
        durationMs: Date.now() - started,
      };
      scores.push(score);
    }

    const overallScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    const allPassed = Object.values(dimensions).every((d) => d.exitCode === 0);
    // An acceptance check that cannot even run is the check's fault, not the work's: say so, so
    // nobody burns retries trying to satisfy it (observed live: a quoting slip broke a check).
    const broken = Object.entries(dimensions)
      .filter(([name, d]) => name.startsWith('acceptance') && d.exitCode !== 0 && brokenCheck(d.output))
      .map(([name]) => name);
    return {
      status: allPassed ? 'passed' : 'failed',
      overallScore,
      dimensions,
      ...(broken.length
        ? { note: `The acceptance check${broken.length > 1 ? 's' : ''} ${broken.join(', ')} could not run (the check itself is invalid). Fix the check; the work was not retried for it.`, brokenChecks: broken }
        : {}),
    };
  }
}

/**
 * True when a check failed before testing anything: its own script does not parse (`node -e` with a
 * syntax error), or its program does not exist. Failures of the work itself never look like this.
 */
export function brokenCheck(output: string): boolean {
  return (
    /^\[eval\]:\d+[\s\S]*SyntaxError/m.test(output) ||
    /is not recognized as an internal or external command|command not found|No such file or directory.*\bnode\b/i.test(output)
  );
}

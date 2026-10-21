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
    for (const script of scripts) {
      const started = Date.now();
      const result = await this.runner.run(script.command, rootPath);
      const score = result.exitCode === 0 ? 100 : 0;
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
    return {
      status: allPassed ? 'passed' : 'failed',
      overallScore,
      dimensions,
    };
  }
}

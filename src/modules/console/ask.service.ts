import { BadRequestException, Inject, Injectable, Logger } from '@nestjs/common';
import { and, asc, eq, isNull } from 'drizzle-orm';
import { stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { DRIZZLE, Database } from '../../infrastructure/database/drizzle.provider';
import { RuntimeRegistry } from '../runtimes/runtime-registry';
import { UsageLimits, fallbackSelection } from '../runtimes/usage-limits';
import { PermissionCallback } from '../runtimes/runtime.port';
import { confinementGate } from '../governance/path-confinement';
import { defaultProjectsRoot } from '../projects/project-location';
import { GoalsService } from '../goals/goals.service';
import { ConsoleService } from './console.service';
import { askMessages } from './ask.schema';
import { boardBriefing, companyBriefing } from './ask-briefing';

const MAX_QUESTION = 4000;
const HISTORY_TURNS = 6;
const ASK_TIMEOUT_MS = 4 * 60_000;
/** Answering only ever reads: the model can look at the project, never change or run anything. */
export const READ_ONLY_TOOLS = ['Read', 'Grep', 'Glob'];

/** Allows only read tools, and only inside the folder being asked about. */
export function readOnlyGate(cwd: string): PermissionCallback {
  const confine = confinementGate(cwd);
  return async (toolName, input) => {
    if (!READ_ONLY_TOOLS.includes(toolName)) {
      return { behavior: 'deny', message: `${toolName} is not available when answering questions (read-only).` };
    }
    return confine(toolName, input);
  };
}

/**
 * "Ask Forge": answers questions about a company or one goal from the dashboard, so nobody has to
 * open a terminal session to find out where a project is, what is left, or why something failed.
 * The model gets a live briefing (steps, owners, checks, errors, what agents are doing right now)
 * plus read-only access to the project files.
 */
@Injectable()
export class AskService {
  private readonly logger = new Logger(AskService.name);

  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly console: ConsoleService,
    private readonly goals: GoalsService,
    private readonly registry: RuntimeRegistry,
    private readonly usageLimits: UsageLimits,
  ) {}

  async history(companyId: string, goalId?: string | null) {
    if (goalId) await this.goalInCompany(companyId, goalId);
    return this.db
      .select()
      .from(askMessages)
      .where(and(eq(askMessages.companyId, companyId), goalId ? eq(askMessages.goalId, goalId) : isNull(askMessages.goalId)))
      .orderBy(asc(askMessages.createdAt))
      .limit(200);
  }

  async ask(companyId: string, input: { question: string; goalId?: string | null }) {
    const question = String(input.question ?? '').trim();
    if (!question) throw new BadRequestException('Ask a question');
    if (question.length > MAX_QUESTION) throw new BadRequestException(`Keep the question under ${MAX_QUESTION} characters`);
    const goalId = input.goalId || null;

    let briefing: string;
    let cwd: string;
    if (goalId) {
      await this.goalInCompany(companyId, goalId);
      const board = await this.console.board(goalId);
      briefing = boardBriefing(board);
      cwd = await firstExisting([board.projects[0]?.deliverablePath, defaultProjectsRoot()]);
    } else {
      briefing = companyBriefing(await this.console.dashboard(companyId));
      cwd = await firstExisting([defaultProjectsRoot()]);
    }
    const earlier = (await this.history(companyId, goalId)).slice(-HISTORY_TURNS * 2);

    await this.db.insert(askMessages).values({ companyId, goalId, role: 'user', content: question });
    const { answer, costUsd } = await this.answer(prompt(briefing, earlier, question, cwd), cwd);
    const [saved] = await this.db
      .insert(askMessages)
      .values({ companyId, goalId, role: 'assistant', content: answer, costUsd })
      .returning();
    return saved;
  }

  private async answer(task: string, cwd: string): Promise<{ answer: string; costUsd: number }> {
    let selection: { runtimeKey: string; provider?: string; model: string } = { runtimeKey: 'claude_code', model: 'sonnet' };
    if (this.usageLimits.blockedUntil('claude_code') !== null) {
      const fallback = fallbackSelection('claude_code');
      if (!fallback) {
        return { answer: 'Claude is at its usage limit right now and no fallback is configured, so I cannot answer until it resets.', costUsd: 0 };
      }
      selection = fallback;
    }
    const abort = new AbortController();
    const timer = setTimeout(() => abort.abort(), ASK_TIMEOUT_MS);
    timer.unref?.();
    let text = '';
    let result = '';
    let error: string | undefined;
    let costUsd = 0;
    try {
      for await (const e of this.registry.get(selection.runtimeKey).run({
        workItemId: 'ask',
        employeeId: 'ask',
        cwd,
        task,
        model: selection.model,
        provider: selection.provider,
        allowedTools: READ_ONLY_TOOLS,
        disallowedTools: ['Write', 'Edit', 'MultiEdit', 'NotebookEdit', 'Bash', 'WebFetch', 'WebSearch', 'Task'],
        limits: { maxTurns: 15 },
        abortSignal: abort.signal,
        canUseTool: readOnlyGate(cwd),
      })) {
        if (e.kind === 'assistant_text') text = e.text;
        else if (e.kind === 'completed') result = e.result;
        else if (e.kind === 'usage') costUsd += e.costUsd;
        else if (e.kind === 'failed') error = e.error;
        else if (e.kind === 'rate_limit') this.usageLimits.record(selection.runtimeKey, e);
      }
    } catch (err) {
      error = (err as Error).message;
    } finally {
      clearTimeout(timer);
    }
    const answer = (result || text).trim();
    if (answer) return { answer, costUsd };
    this.logger.warn(`Ask failed: ${error ?? 'no answer'}`);
    return {
      answer: abort.signal.aborted
        ? 'That took too long to answer. Try a narrower question.'
        : `I could not answer that just now${error ? ` (${error.slice(0, 200)})` : ''}. Please try again.`,
      costUsd,
    };
  }

  private async goalInCompany(companyId: string, goalId: string) {
    const goal = await this.goals.findOne(goalId);
    if (goal.companyId !== companyId) throw new BadRequestException('That goal belongs to another company');
    return goal;
  }
}

async function firstExisting(paths: (string | undefined)[]): Promise<string> {
  for (const p of paths) {
    if (!p) continue;
    try {
      if ((await stat(p)).isDirectory()) return p;
    } catch {
      // try the next one
    }
  }
  return tmpdir();
}

function prompt(briefing: string, earlier: { role: string; content: string }[], question: string, cwd: string): string {
  return [
    'You are Forge\'s project assistant. The person asking runs this AI company from a web dashboard and',
    'wants straight answers about their work: where a project has reached, what is left, who is doing',
    'what, why something failed or is slow, what was built and how to run it.',
    '',
    'Rules:',
    '- Answer from the live briefing below first; it is current as of right now.',
    `- You may read the project files (Read, Grep, Glob) under ${cwd} to answer questions about the code`,
    '  or deliverables. You cannot change anything or run commands, so never claim you did.',
    '- Be concrete and brief: plain language, short paragraphs or bullets, real names, numbers and file',
    '  paths. Say clearly when something looks stuck or broken and what would unblock it.',
    '- If the briefing does not contain the answer, say so instead of guessing.',
    '',
    '<live_briefing>',
    briefing,
    '</live_briefing>',
    ...(earlier.length
      ? ['', '<conversation_so_far>', ...earlier.map((m) => `${m.role === 'user' ? 'Q' : 'A'}: ${m.content.slice(0, 2000)}`), '</conversation_so_far>']
      : []),
    '',
    `Question: ${question}`,
  ].join('\n');
}

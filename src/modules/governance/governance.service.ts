import { Injectable } from '@nestjs/common';

export type ToolDecision = 'allow' | 'deny' | 'approval_required';

/**
 * Employee governance model (spec §20). Default-deny is opt-in via `allowedTools`;
 * otherwise tools are allowed unless explicitly denied or gated behind approval.
 */
export interface GovernancePolicy {
  allowedTools?: string[];
  deniedTools?: string[];
  approvalRequiredTools?: string[];
}

@Injectable()
export class GovernanceService {
  evaluate(governance: Record<string, unknown> | null | undefined, toolName: string): ToolDecision {
    const policy = (governance ?? {}) as GovernancePolicy;
    const denied = policy.deniedTools ?? [];
    const approval = policy.approvalRequiredTools ?? [];

    if (denied.includes(toolName)) {
      return 'deny';
    }
    if (policy.allowedTools && !policy.allowedTools.includes(toolName)) {
      return 'deny';
    }
    if (approval.includes(toolName)) {
      return 'approval_required';
    }
    return 'allow';
  }

  /** Optional allow-list forwarded to the runtime (SDK `allowedTools`). */
  allowedTools(governance: Record<string, unknown> | null | undefined): string[] | undefined {
    const policy = (governance ?? {}) as GovernancePolicy;
    return policy.allowedTools;
  }
}

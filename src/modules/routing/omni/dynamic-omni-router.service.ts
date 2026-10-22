import { Injectable } from '@nestjs/common';
import { EmployeeWithRelations } from '../../employees/employees.schema';
import { complexityOf } from '../../performance/skill-math';
import { ModelSelection, OmniRouterPort } from './omni-router.port';

// An alias: always the newest Sonnet the subscription offers.
const DEFAULT_MODEL = 'sonnet';

/**
 * V1+ Omni Router (spec §8): selects provider + model per task. Resolution order
 * per employee policy: explicit task-type mapping → complexity tier (strong vs
 * cheap) → default. For claude_code employees this is "which Claude model"; for
 * custom employees it also carries the provider (M11).
 */
@Injectable()
export class DynamicOmniRouter implements OmniRouterPort {
  selectModel(
    workItem: { taskType: string; priority?: number },
    employee: EmployeeWithRelations,
  ): ModelSelection {
    const rc = employee.runtimeConfig;
    const policy = rc?.modelPolicy ?? {};

    let model = policy.byTaskType?.[workItem.taskType];
    if (!model && policy.byComplexity) {
      const complexity = complexityOf(workItem.taskType, workItem.priority ?? 0);
      const threshold = policy.complexityThreshold ?? 0.6;
      model = complexity >= threshold ? policy.byComplexity.high : policy.byComplexity.low;
    }
    model = model ?? policy.default ?? DEFAULT_MODEL;

    return {
      runtimeKey: rc?.runtimeKey ?? 'claude_code',
      provider: rc?.provider ?? 'anthropic',
      model,
    };
  }
}

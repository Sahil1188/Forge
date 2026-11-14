import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DRIZZLE, Database } from '../../infrastructure/database/drizzle.provider';
import { employeeSkills, EmployeeSkill } from '../employees/employees.schema';
import { skillFitsTask } from '../work/domains';
import { computeSkillDelta } from './skill-math';

/**
 * Applies non-uniform skill growth after an evaluation (spec §14). Treats the
 * employee profile as a dynamic capability model, not an XP counter. Only the
 * skills the task exercised move (the same domain hints routing uses); work of a
 * kind with no skill hints, or with none of the employee's skills, moves none.
 */
@Injectable()
export class SkillProgressionService {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  async applyGrowth(
    employeeId: string,
    taskType: string,
    evaluationScore: number,
    complexity: number,
  ): Promise<EmployeeSkill[]> {
    const skills = (
      await this.db.select().from(employeeSkills).where(eq(employeeSkills.employeeId, employeeId))
    ).filter((skill) => skillFitsTask(taskType, skill.skillKey));

    const updated: EmployeeSkill[] = [];
    for (const skill of skills) {
      const delta = computeSkillDelta(skill.level, evaluationScore, complexity);
      const next = Math.max(0, Math.min(100, Math.round(skill.level + delta)));
      if (next !== skill.level) {
        const [row] = await this.db
          .update(employeeSkills)
          .set({ level: next })
          .where(eq(employeeSkills.id, skill.id))
          .returning();
        updated.push(row);
      } else {
        updated.push(skill);
      }
    }
    return updated;
  }
}

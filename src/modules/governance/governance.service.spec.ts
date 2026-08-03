import { describe, it, expect } from 'vitest';
import { GovernanceService } from './governance.service';

describe('GovernanceService.evaluate', () => {
  const svc = new GovernanceService();

  it('allows by default when no policy is set', () => {
    expect(svc.evaluate({}, 'Write')).toBe('allow');
    expect(svc.evaluate(null, 'Write')).toBe('allow');
  });

  it('denies explicitly denied tools', () => {
    expect(svc.evaluate({ deniedTools: ['Bash'] }, 'Bash')).toBe('deny');
  });

  it('denies tools outside an allow-list', () => {
    expect(svc.evaluate({ allowedTools: ['Read'] }, 'Write')).toBe('deny');
    expect(svc.evaluate({ allowedTools: ['Read'] }, 'Read')).toBe('allow');
  });

  it('flags approval-required tools', () => {
    expect(svc.evaluate({ approvalRequiredTools: ['Deploy'] }, 'Deploy')).toBe('approval_required');
  });
});

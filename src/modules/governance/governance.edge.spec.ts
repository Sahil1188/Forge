import { describe, it, expect } from 'vitest';
import { GovernanceService } from './governance.service';

describe('GovernanceService — precedence and edges', () => {
  const svc = new GovernanceService();

  it('deny beats an allow-list entry for the same tool', () => {
    expect(svc.evaluate({ allowedTools: ['Bash'], deniedTools: ['Bash'] }, 'Bash')).toBe('deny');
  });

  it('deny beats approval-required for the same tool', () => {
    expect(
      svc.evaluate({ deniedTools: ['Deploy'], approvalRequiredTools: ['Deploy'] }, 'Deploy'),
    ).toBe('deny');
  });

  it('the allow-list beats approval-required: a tool outside the whitelist is denied, not queued', () => {
    expect(
      svc.evaluate({ allowedTools: ['Read'], approvalRequiredTools: ['Deploy'] }, 'Deploy'),
    ).toBe('deny');
  });

  it('an approval-required tool inside the whitelist still needs approval', () => {
    expect(
      svc.evaluate({ allowedTools: ['Deploy'], approvalRequiredTools: ['Deploy'] }, 'Deploy'),
    ).toBe('approval_required');
  });

  it('an empty allow-list denies everything (explicit lock-down), unlike an absent one', () => {
    expect(svc.evaluate({ allowedTools: [] }, 'Read')).toBe('deny');
    expect(svc.evaluate({}, 'Read')).toBe('allow');
  });

  it('tool names are matched exactly (case-sensitive)', () => {
    expect(svc.evaluate({ deniedTools: ['Bash'] }, 'bash')).toBe('allow');
  });

  it('unrelated policy keys (e.g. githubRead) are ignored', () => {
    expect(svc.evaluate({ githubRead: true, githubWrite: true }, 'Write')).toBe('allow');
  });

  describe('lists forwarded to the runtime', () => {
    it('deniedTools returns the list, or undefined when empty/absent', () => {
      expect(svc.deniedTools({ deniedTools: ['Bash'] })).toEqual(['Bash']);
      expect(svc.deniedTools({ deniedTools: [] })).toBeUndefined();
      expect(svc.deniedTools({})).toBeUndefined();
      expect(svc.deniedTools(null)).toBeUndefined();
    });

    it('allowedTools returns the whitelist, or undefined when absent', () => {
      expect(svc.allowedTools({ allowedTools: ['Read'] })).toEqual(['Read']);
      expect(svc.allowedTools({})).toBeUndefined();
      expect(svc.allowedTools(undefined)).toBeUndefined();
    });
  });
});

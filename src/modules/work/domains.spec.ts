import { describe, it, expect } from 'vitest';
import { domainOf, inferTaskType, isTaskType, TASK_TYPES } from './domains';

describe('work domains', () => {
  it('classifies plain-text work by domain', () => {
    expect(
      inferTaskType(
        'Build a 3-year revenue forecast and cash flow model for a fintech lending startup',
      ),
    ).toBe('finance');
    expect(inferTaskType('Threat model the login flow and fix OWASP issues')).toBe('security');
    expect(inferTaskType('Design the VPC, subnets and firewall rules for production')).toBe(
      'network',
    );
    expect(inferTaskType('Write Terraform for an AWS serverless stack')).toBe('cloud');
    expect(inferTaskType('Create wireframes and a design system for onboarding')).toBe('design');
    expect(inferTaskType('Build a React landing page')).toBe('frontend');
    expect(inferTaskType('Add a REST API endpoint for orders')).toBe('coding');
    expect(inferTaskType('Something completely vague')).toBe('coding');
  });

  it('every domain has a department (except generic) and a complexity weight', () => {
    for (const t of TASK_TYPES) {
      expect(domainOf(t).weight).toBeGreaterThan(0);
      if (t !== 'generic') expect(domainOf(t).department).not.toBe('');
    }
    expect(isTaskType('finance')).toBe(true);
    expect(isTaskType('astrology')).toBe(false);
    expect(domainOf('unknown').department).toBe('');
  });
});

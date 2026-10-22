import { describe, it, expect } from 'vitest';
import { classify } from './classify';

const CASES: Array<[string, string]> = [
  // The live miss: backend words appear more often, but the ask is a user interface.
  [
    'Add a web interface to this expense tracker. Run it with "npm run web": a small local web server using only Node built-ins on http://localhost:4100. The page lets me add an expense, see all expenses in a table, delete one, and see totals per category with a bar chart. Reuse the CLI\'s logic and keep the CLI and its tests working. Add tests for the web API.',
    'frontend',
  ],
  ['Build a React dashboard that shows sales per region with charts', 'frontend'],
  ['Create a landing page for our product launch, mobile friendly', 'frontend'],
  ['Make the settings screen responsive and accessible', 'frontend'],
  ['Build a Node.js command-line expense tracker with add, list and summary commands', 'coding'],
  ['Add a REST API endpoint for orders with validation and tests', 'coding'],
  ['Write a Python script that renames files by date', 'coding'],
  ['Build a 3-year revenue forecast and cash flow model for a fintech lending startup', 'finance'],
  ['Create a loan amortization calculator for our lending product', 'finance'],
  ['Prepare a 12-month budget workbook for a seed-stage startup', 'finance'],
  ['Threat model the login flow and fix OWASP issues', 'security'],
  ['Do a security review of the payments service', 'security'],
  ['Design the VPC, subnets and firewall rules for production', 'network'],
  ['Write Terraform for an AWS serverless stack', 'cloud'],
  ['Set up a GitHub Actions CI/CD pipeline that builds and deploys the Docker image', 'devops'],
  ['Create wireframes and a design system for onboarding', 'design'],
  ['Write a PRD with user stories for team invitations', 'product'],
  ['Draft a privacy policy and terms of service for our app', 'legal'],
  ['Write runbooks for on-call incidents', 'operations'],
  ['Write a launch plan and landing page copy', 'marketing'],
  ['Build an ETL data pipeline from Postgres to the warehouse', 'data'],
  ['Write a system design doc for the notifications service', 'architecture'],
  ['Something completely vague', 'coding'],
];

describe('request classifier', () => {
  for (const [text, expected] of CASES) {
    it(`${expected}: ${text.slice(0, 70)}`, () => {
      expect(classify(text).taskType).toBe(expected);
    });
  }

  it('word boundaries: "rapid" is not "api", "cliché" is not "cli"', () => {
    expect(classify('Write a rapid cliché-free newsletter').taskType).toBe('marketing');
  });
});

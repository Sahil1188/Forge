import { describe, it, expect } from 'vitest';
// The console's toolkit is plain browser ESM; it is importable in Node because it touches no
// browser globals at import time.
import { duration, esc, goalFields, html, label, lines, list, money, parseSkills, when } from '../../../public/assets/lib.js';

const XSS = `<img src=x onerror="alert('x')">`;

describe('console html`` — escaping by construction', () => {
  it('escapes every interpolated value', () => {
    const out = html`<td>${XSS}</td>`.value;
    expect(out).not.toContain('<img');
    expect(out).toContain('&lt;img src=x onerror=&quot;alert(&#39;x&#39;)&quot;&gt;');
  });

  it('escapes inside attributes (no breaking out of quotes)', () => {
    const id = `"><script>alert(1)</script>`;
    const out = html`<a href="#/goals/${id}" data-id="${id}">x</a>`.value;
    expect(out).not.toContain('<script>');
    expect(out).not.toMatch(/data-id=""/);
  });

  it('nested html`` results are kept as markup, arrays are joined, null/false render nothing', () => {
    const items = ['a', '<b>'];
    const out = html`<ul>${items.map((i) => html`<li>${i}</li>`)}</ul>${null}${false}${undefined}`.value;
    expect(out).toBe('<ul><li>a</li><li>&lt;b&gt;</li></ul>');
  });

  it('a plain string that looks like markup is never trusted', () => {
    const fake = { value: '<b>bold</b>' }; // not a Safe instance
    expect(html`${fake}`.value).toBe('[object Object]');
    expect(esc('<b>')).toBe('&lt;b&gt;');
  });

  it('numbers and zero render', () => {
    expect(html`${0} ${12.5}`.value).toBe('0 12.5');
  });
});

describe('console formatting helpers', () => {
  it('money (brand format: "USD 1.25")', () => {
    expect(money(0)).toBe('USD 0.00');
    expect(money(0.0042)).toBe('USD 0.0042');
    expect(money(1.234)).toBe('USD 1.23');
    expect(money(undefined)).toBe('USD 0.00');
  });

  it('when (brand format: "21 Oct 2026, 14:32")', () => {
    expect(when(new Date(2026, 9, 21, 14, 32))).toBe('21 Oct 2026, 14:32');
    expect(when(null)).toBe('—');
  });

  it('duration', () => {
    expect(duration(null)).toBe('—');
    expect(duration(4200)).toBe('4s');
    expect(duration(102_000)).toBe('1m 42s');
  });

  it('labels every work and run status in plain language', () => {
    for (const s of ['created', 'assigned', 'in_progress', 'needs_approval', 'evaluating', 'rework', 'done', 'failed', 'cancelled', 'killed_budget']) {
      expect(label(s)).not.toBe(s);
    }
    expect(label('mystery')).toBe('mystery');
  });

  it('goalFields keeps long instructions intact', () => {
    expect(goalFields('Fix the bug')).toEqual({ title: 'Fix the bug' });
    const long = 'x '.repeat(100).trim();
    const f = goalFields(long);
    expect(f.title.length).toBeLessThanOrEqual(120);
    expect(f.description).toBe(long);
  });

  it('parses skills, lists and lines from form text', () => {
    expect(parseSkills('node 80, typescript:75\ntesting=60, design')).toEqual([
      { skillKey: 'node', level: 80 },
      { skillKey: 'typescript', level: 75 },
      { skillKey: 'testing', level: 60 },
      { skillKey: 'design', level: 50 },
    ]);
    expect(parseSkills('x 999')).toEqual([{ skillKey: 'x', level: 100 }]);
    expect(list('Bash, Write,\nWebFetch,,')).toEqual(['Bash', 'Write', 'WebFetch']);
    expect(lines(' a \n\n b ')).toEqual(['a', 'b']);
  });
});

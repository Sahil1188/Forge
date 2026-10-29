import { describe, expect, it } from 'vitest';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import * as path from 'node:path';
import { brandChecklist, brandProblem, describeBrand, fittingBrand, getBrand, listBrands, saveBrand } from './brand-library';

const sample = [
  '# DEMO.md · Sahil Shaikh brand (all-in-one)',
  "Sahil Shaikh's brand and design system, **Demo Brand**. Part 1 is the brand foundations.",
  '| **Metaphor** | A demo metaphor. |',
  '| **Personality** | Calm, exact. |',
  '| **Feeling we want** | "It just works." |',
  '## 7. Checklist for every screen',
  '- [ ] Light canvas',
  '- [ ] One primary button',
  '# Part 3 · Website guideline',
  '## 5. Checklist for every page',
  '- [ ] One hero motion',
  '## tokens.css',
  '```css',
  ':root { --ink: #000; }',
  '```',
  '## components.css',
  '```css',
  'body { color: var(--ink); }',
  '```',
].join('\n');

describe('brand library', () => {
  it('describes a brand from its file', () => {
    expect(describeBrand('demo', sample)).toEqual({ slug: 'demo', name: 'Demo Brand', metaphor: 'A demo metaphor.', personality: 'Calm, exact.', feeling: 'It just works.' });
  });

  it('extracts the platform and website checklists', () => {
    expect(brandChecklist(sample, 'platform')).toEqual(['Light canvas', 'One primary button']);
    expect(brandChecklist(sample, 'website')).toEqual(['One hero motion']);
  });

  it('rejects files without the code the projects copy', () => {
    expect(brandProblem(sample)).toBeNull();
    expect(brandProblem('# just text')).toContain('tokens.css');
  });

  it('lists, reads and saves brands in a folder (README and invalid files skipped)', async () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'brands-'));
    writeFileSync(path.join(dir, 'README.md'), 'readme');
    writeFileSync(path.join(dir, 'broken.md'), 'no code');
    await saveBrand('demo', sample, dir);
    expect((await listBrands(dir)).map((b) => b.slug)).toEqual(['demo']);
    expect((await getBrand('demo', dir))?.content).toContain('--ink');
    expect(await getBrand('../etc', dir)).toBeNull();
    await expect(saveBrand('Bad Slug!', sample, dir)).rejects.toThrow('lowercase');
    await expect(saveBrand('demo2', 'nothing', dir)).rejects.toThrow('tokens.css');
  });

  it('picks a brand that fits the product, with a safe default', () => {
    const all = ['studio-signal', 'sage-ledger', 'porcelain', 'graph-paper'];
    expect(fittingBrand('M&A deal workbench with DCF valuation', all)).toBe('studio-signal');
    expect(fittingBrand('Shift scheduling for clinics', all)).toBe('graph-paper');
    expect(fittingBrand('A recipe app', all)).toBe('porcelain');
    expect(fittingBrand('anything', [])).toBeNull();
  });

  it('reads the real brand folder', async () => {
    const real = await listBrands(path.join(process.cwd(), 'brands'));
    expect(real.length).toBeGreaterThanOrEqual(10);
    expect(real.find((b) => b.slug === 'studio-signal')?.name).toBe('Studio Signal');
    for (const b of real) expect(b.metaphor).not.toBe('');
  });
});

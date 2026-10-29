import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
import * as path from 'node:path';

/**
 * Sahil Shaikh's brand systems: one all-in-one markdown file per brand in `brands/` (brand rules,
 * platform UI rules, website rules and the exact CSS). Every UI Forge builds follows one of them.
 * The folder is read on every call, so a brand added as a file is available immediately.
 */

export interface BrandSummary {
  slug: string;
  name: string;
  metaphor: string;
  personality: string;
  feeling: string;
}

export interface Brand extends BrandSummary {
  content: string;
}

const SLUG = /^[a-z0-9][a-z0-9-]{1,48}$/;

export function brandsDir(env: NodeJS.ProcessEnv = process.env): string {
  return env.FORGE_BRANDS_DIR?.trim() || path.join(process.cwd(), 'brands');
}

/** Reads the descriptive fields out of a brand file (tolerant: missing fields are empty). */
export function describeBrand(slug: string, content: string): BrandSummary {
  const name =
    /design system, \*\*([^*]+)\*\*/.exec(content)?.[1] ??
    /^#\s+([A-Z0-9-]+)\.md/m.exec(content)?.[1]?.replace(/-/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()) ??
    slug;
  const row = (label: string) => new RegExp(`\\|\\s*\\*\\*${label}\\*\\*\\s*\\|\\s*([^|]+)\\|`).exec(content)?.[1]?.trim() ?? '';
  return { slug, name: name.trim(), metaphor: row('Metaphor'), personality: row('Personality'), feeling: row('Feeling we want').replace(/^"|"$/g, '') };
}

/** A brand file is usable only if it carries the code the projects copy. */
export function brandProblem(content: string): string | null {
  if (!/^##\s+tokens\.css/m.test(content)) return 'The brand file has no "## tokens.css" code section (Part 4).';
  if (!/^##\s+components\.css/m.test(content)) return 'The brand file has no "## components.css" code section (Part 4).';
  if (content.length > 400_000) return 'The brand file is too large (max 400 KB).';
  return null;
}

/** The checklist a screen (platform) or page (website) is graded against. */
export function brandChecklist(content: string, surface: 'platform' | 'website' = 'platform'): string[] {
  const heading = surface === 'platform' ? /^##\s+\d+\.\s+Checklist for every screen/m : /^##\s+\d+\.\s+Checklist for every page/m;
  const start = content.search(heading);
  if (start < 0) return [];
  const rest = content.slice(start).split('\n').slice(1);
  const items: string[] = [];
  for (const line of rest) {
    if (/^#{1,3}\s/.test(line)) break;
    const m = /^\s*-\s*\[ \]\s*(.+)$/.exec(line);
    if (m) items.push(m[1].trim());
  }
  return items;
}

export async function listBrands(dir = brandsDir()): Promise<BrandSummary[]> {
  let files: string[] = [];
  try {
    files = await readdir(dir);
  } catch {
    return [];
  }
  const out: BrandSummary[] = [];
  for (const f of files.sort()) {
    if (!f.endsWith('.md') || f.toLowerCase() === 'readme.md') continue;
    const slug = f.slice(0, -3);
    if (!SLUG.test(slug)) continue;
    const content = await readFile(path.join(dir, f), 'utf8').catch(() => '');
    if (content && !brandProblem(content)) out.push(describeBrand(slug, content));
  }
  return out;
}

export async function getBrand(slug: string | null | undefined, dir = brandsDir()): Promise<Brand | null> {
  if (!slug || !SLUG.test(slug)) return null;
  try {
    const content = await readFile(path.join(dir, `${slug}.md`), 'utf8');
    if (brandProblem(content)) return null;
    return { ...describeBrand(slug, content), content };
  } catch {
    return null;
  }
}

/** Adds (or replaces) a brand file. Returns the stored brand. */
export async function saveBrand(slug: string, content: string, dir = brandsDir()): Promise<BrandSummary> {
  const clean = slug.trim().toLowerCase();
  if (!SLUG.test(clean) || clean === 'readme') throw new Error('Brand id must be 2-49 lowercase letters, digits or dashes.');
  const problem = brandProblem(content);
  if (problem) throw new Error(problem);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, `${clean}.md`), content.replace(/\r\n/g, '\n'), 'utf8');
  return describeBrand(clean, content);
}

/** Which brand suits a product, when nobody chose one: matched on what the product is about. */
const FIT: Array<[RegExp, string]> = [
  [/\b(bank|fintech|payment|invest|trading|m&a|deal|valuation|wealth|fund|treasury|lending|insurance|finance|financial)\b/i, 'studio-signal'],
  [/\b(account|ledger|bookkeep|invoice|expense|budget|tax|payroll|audit)\b/i, 'sage-ledger'],
  [/\b(legal|law|contract|report|research|publication|journal|policy|compliance|memo)\b/i, 'ivory-press'],
  [/\b(developer|devtool|api|cli|terminal|command|keyboard|code|engineering)\b/i, 'lilac-desk'],
  [/\b(schedul|calendar|booking|appointment|slot|shift|availability|reservation)\b/i, 'graph-paper'],
  [/\b(monitor|observability|iot|device|sensor|hardware|telemetry|infrastructure|ops)\b/i, 'field-instrument'],
  [/\b(note|docs?|wiki|knowledge|writing|editor|todo|task)\b/i, 'notepad'],
  [/\b(creative|studio|portfolio|agency|design|art|mood ?board|collage)\b/i, 'paper-cut'],
  [/\b(health|wellness|travel|education|learning|community|consumer)\b/i, 'glasshouse'],
];

export function fittingBrand(text: string, available: string[]): string | null {
  for (const [re, slug] of FIT) if (re.test(text) && available.includes(slug)) return slug;
  for (const fallback of ['porcelain', 'glasshouse']) if (available.includes(fallback)) return fallback;
  return available[0] ?? null;
}

/** The brief every UI-building agent gets when the project has a brand. */
export function brandBrief(name: string): string[] {
  return [
    `## Brand: ${name} (BRAND.md in the project root is the law for every pixel)`,
    '- Read BRAND.md fully before any UI work. Decide the surface: platform UI (app, dashboard, admin) follows Part 2; a marketing/landing page follows Part 3.',
    '- Create tokens.css and components.css by copying the Part 4 code blocks EXACTLY (motion.css for website pages only; tailwind-theme.css if the project uses Tailwind v4). Import them once at the app root.',
    "- Use only the brand's CSS variables and component classes. Never hard-code colours, font sizes or fonts; no other palette, no default component-library look. A library like Radix may supply behaviour only, styled with the brand tokens.",
    '- Load exactly the Google Fonts the brand names. Follow its type scale, radii, density (14px text, 34px controls, 44px rows) and its one-accent-colour rules.',
    '- Light only: never add dark mode, a theme toggle or dark sections. Platform UI has no animation (wrap the app in the brand\'s *-app class).',
    '- Use the brand voice for copy (verbs on buttons, errors that say how to fix them, dates like 21 Oct 2026).',
    '- Before finishing, go through the brand checklist (Part 2 section 7 for platforms, Part 3 section 5 for websites) screen by screen and fix every miss.',
  ];
}

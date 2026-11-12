# `modules/brands/` — the brand systems every UI follows

Forge's employees build user interfaces, and every one of them follows a brand system: colours, type,
spacing, components and voice. Each brand is one self-contained markdown file in the top-level
`brands/` folder. This module reads them, picks one for each product, and hands it to the people who
build and review the UI.

## How it works

- **Choosing a brand for a goal:** the brand named on the goal, else the company's default, else the
  one the planning executive picks for the product, else a fit by keywords in the goal (`fittingBrand`), falling back to Porcelain or Glasshouse.
- The chosen brand is committed into the project as `BRAND.md`, so every step starts with it.
- Builders get a short brief of the brand in their prompt (`brandBrief`). The visual review checks
  screenshots against the brand's checklist (`brandChecklist`).
- `brandProblem` rejects a file that is not a usable brand before it is saved: it must have a
  `## tokens.css` and a `## components.css` code section, and be under 400 KB.

## HTTP API

| Method | Path | Role | What it does |
| --- | --- | --- | --- |
| GET | `/brands` | viewer | Every brand: slug, name and one-line summary. |
| GET | `/brands/:slug` | viewer | One brand's summary plus its screen and page checklists. |
| POST | `/brands` | admin | Adds or replaces a brand (`{ slug, content }`), validated first. |

## Settings

| Variable | Default | Effect |
| --- | --- | --- |
| `FORGE_BRANDS_DIR` | `<repo>/brands` | Where brand files are read from and saved to. |

## Files

| File | Purpose |
| --- | --- |
| `brand-library.ts` | Lists, reads, validates, saves and matches brands; builds the brief and review checklist. |
| `brands.controller.ts` | The endpoints above. |
| `brands.module.ts` | Wiring. |
| `brand-library.spec.ts` | Unit tests: parsing, validation, matching, brief and checklist. |

## Tests

`brand-library.spec.ts` (unit) and `test/brands.e2e-spec.ts` (brand chosen per goal, committed as
`BRAND.md`, shown to builders).

## Related

`heartbeats` (planner picks and applies the brand), `workers` (brand brief in the prompt),
`evaluation/visual` (brand checklist in the visual review), `companies` and `goals` (stored brand).

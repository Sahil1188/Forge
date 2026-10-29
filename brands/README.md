# Brand systems

Every user interface Forge builds follows one of these brand systems (Sahil Shaikh's brands).

Each file is a complete, all-in-one system:

- **Part 1 · Brand foundations**: idea, logo, colour, type, layout, shape, icons, imagery, voice, accessibility.
- **Part 2 · Platform UI**: rules for apps, dashboards and tools. No animation.
- **Part 3 · Website**: the same brand with larger type and one defined motion moment.
- **Part 4 · Code**: `tokens.css`, `components.css`, `motion.css` (website only) and `tailwind-theme.css`, to be copied exactly.

## How Forge uses them

1. A goal can name a brand; otherwise the company's default brand is used; otherwise the planner picks the brand that best fits the product.
2. The chosen file is copied into the project as `BRAND.md`.
3. The designer builds DESIGN.md on top of it, and frontend work creates `tokens.css` and `components.css` from Part 4 and uses only their variables and classes.
4. The design review and the production review check every screen against the brand's checklist (Part 2 for platforms, Part 3 for websites).

Rules that hold for every brand: light only (never dark mode or dark sections), no hard-coded colours, sizes or fonts, and no animation in platform UI.

## Adding a brand

Drop a new `<slug>.md` file in this folder (or add it from the console under Settings → Brands). It must follow the same structure, including the Part 4 `tokens.css` and `components.css` code blocks. Forge picks it up immediately; no restart needed.

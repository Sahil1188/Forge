# SAGE-LEDGER.md · Sahil Shaikh brand (all-in-one)

**For Claude Code:** this single file contains the whole Sage Ledger system: brand rules, platform UI rules (no animation), website rules (with motion), and the complete CSS. Put it in the project root and add this line to `CLAUDE.md`:

```
All UI follows SAGE-LEDGER.md. Before writing UI, create tokens.css, components.css (and motion.css for website pages) from Part 4 if they don't exist, then use only their variables and classes. Light only, never dark. Platform UI has no animation.
```

## How Claude Code should use this file

1. Decide the surface: **Platform UI** (app, dashboard, admin, settings) or **Website** (marketing, portfolio, landing). If unclear, assume Platform UI.
2. If `tokens.css` and `components.css` don't exist in the project, create them by copying the code blocks in Part 4 exactly. For website pages also create `motion.css`. With Tailwind v4 also create `tailwind-theme.css`.
3. Load the Google Fonts in Part 1, section 5.
4. Never hard-code colours, font sizes or fonts. Never add dark mode or dark sections.
5. Platform UI: wrap the app in `class="sl-app"` (kills all motion). Website: follow Part 3, section 4.
6. Finish by running the checklist at the end of Part 2 or Part 3.

---

Sahil Shaikh's brand and design system, **Sage Ledger**. Part 1 is the brand foundations, Part 2 the platform UI rules (no animation), Part 3 the website rules (with motion), Part 4 the code.

*Researched from: Granola, Anthropic, accounting ledgers. Inspired by, not copied from: no logos, fonts or assets of those products are used.*

---

# Part 1 · Brand foundations

The brand of Sahil Shaikh, Full Stack AI Engineer. **Sage Ledger**: a green-bound ledger: oat paper, faint ruled lines, olive ink and a lime tab marking today's page. It covers every platform Sahil designs and his website.

This system has three parts:

1. **Brand foundations** (Part 1): idea, logo, colour, type, layout, shape, icons, imagery, voice and accessibility.
2. **Platform UI** (Part 2): rules for any app, dashboard or tool. **No animation.**
3. **Website** (Part 3): the same brand with larger type and a defined motion system.

Light only. There is no dark theme, and no dark sections, panels or backgrounds anywhere.

---

## 1. The idea

| | |
|---|---|
| **Metaphor** | A green-bound ledger: oat paper, faint ruled lines, olive ink and a lime tab marking today's page. |
| **Personality** | Grounded, organised, quietly modern. |
| **Feeling we want** | "Everything is accounted for." |
| **Three ingredients** | **Ledger** (faint horizontal ruling and a margin line) · **Olive** (one deep green-olive for action) · **Tab** (a lime badge for what's new) |

## 2. Principles

1. **Oat ground, white leaves.** Pages on warm `oat`; working surfaces are `white` leaves.
2. **Ruled, not boxed.** Faint horizontal ruling and a single margin line organise space.
3. **Olive to act.** Olive pills for actions and links. Nothing else is green.
4. **Lime tabs.** A lime badge marks new or today, with dark text on it.
5. **Soft serif voice.** Fraunces 400 for titles and big numbers; Instrument Sans for everything else.
6. **Still product; the ledger draws itself on the website.** Ruling lines draw in once.
7. **Accessible always.** Text 4.5:1 or better, borders and indicators 3:1, focus always visible.

## 3. Logo

- **Wordmark:** "Sahil Shaikh" in Fraunces 500, `ink`, with a 1px olive margin line 8px to its left.
- **Product mark:** the margin line + product name in Fraunces 500.
- **App icon / avatar:** an `oat` tile, 10px radius, three faint ruled lines, a Fraunces "S" in olive.
- **Clear space:** the cap height. **Minimum size:** wordmark 96px; icon 20px.
- **Never:** use lime for the name, add shadows, put it on dark photography.

## 4. Colour

### Core palette

| Token | Hex | Role |
|---|---|---|
| `oat` | #FAF9F4 | Page ground, sidebar, website background |
| `white` | #FFFFFF | Cards, tables, inputs, modals |
| `barley` | #F1EFE6 | Table headers, ledger fills, hover |
| `rule` | #E5E2D6 | Dividers and borders |
| `rule-strong` | #8C8878 | Input borders, strong dividers |
| `ink` | #1E2016 | Headings, primary text |
| `ink-secondary` | #3A3D2E | Labels, nav, table text |
| `moss` | #63664F | Secondary text, labels |
| `placeholder` | #6A6C58 | Placeholders, disabled text |
| `olive` | #4E5A1C | Primary pills, links, focus, accent word |
| `olive-hover` | #3F4916 | Hover/pressed olive |
| `olive-soft` / `olive-text` | #EEF1DD / #435017 | Selected, active, success |
| `lime` | #D4F05A | "New" and "today" tabs (with dark text) |
| `lime-soft` / `lime-text` | #F6FCDD / #4D5E00 | Soft lime badges |
| `warning` / `warning-soft` | #8A5A00 / #FFF4DC | Needs attention |
| `danger` / `danger-soft` | #B42318 / #FDECEB | Errors, destructive |

### Charts

`chart-1` olive #4E5A1C, `chart-2` #A3AE6F, `chart-3` #CFCBBE, and `chart-highlight` lime #D4F05A for the one value that matters. Gridlines use `rule`, axis labels use `ui-meta` in `moss`.

### Proportions

About 60% oat, 26% white, 10% type and ruling, 3% olive, 1% lime.

### Rules

- Olive is the only colour on buttons and links. One filled olive pill per view.
- Lime is always a background with `lime-text` or `ink` on it. Never lime text.
- Status always has a word.
- No gradients.
- Never use `ink` or `moss` as a background.

## 5. Typography

Three roles, all free on Google Fonts:

`https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;1,9..144,400&family=Instrument+Sans:wght@400;500;600&family=Spline+Sans+Mono:wght@400;500&display=swap`

| Family | Role | Use | Weights |
|---|---|---|---|
| **Fraunces** | **The voice** | Page titles, big numbers, website headlines, the italic accent word | 400, 500, 400 italic |
| **Instrument Sans** | **The clarity** | All UI and body text | 400, 500, 600 |
| **Spline Sans Mono** | **The precision** | Amounts in ledgers, dates, IDs, column headers | 400, 500 |

- **Accent word:** one word per headline in Fraunces *italic*, `olive`.
- Use Fraunces at optical size 72+ for headlines (soft, round) and 9–14 for small numbers.
- Ledger amounts in Spline Sans Mono, right-aligned.
- Sentence case. No ALL CAPS.
- Full scales are in Part 2 (platform) and Part 3 (website).

## 6. Layout and spacing

- **4px grid:** 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 96, 128.
- **Platform:** sidebar on `oat`, content on `white`, 24px page padding, max 1200px.
- **Website:** 1120px max width, 96px between sections.
- Align to a left edge in the product. Centre only short single lines (an empty state).

## 7. Shape and depth

| Token | Value | Use |
|---|---|---|
| `radius-xs` | 4px | Badges, checkboxes |
| `radius-sm` | 8px | Inputs, nav items |
| `radius-md` | 12px | Cards, tables, menus |
| `radius-lg` | 16px | Modals, website leaves |
| `radius-full` | 9999px | All buttons, tabs, toggles |

- **Ledger ruling** (signature): faint 1px `rule` lines every 28px with a 1px olive margin line at 48px. Hero, empty states and notes pages only.
- **Lime tab** (signature): a `lime` pill badge with dark text for New / Today. At most two per screen.
- Shadows only on menus and modals.

## 8. Iconography

- Phosphor-style via Lucide, 1.5px stroke, rounded. 16px in controls. `moss` default, `olive` active.
- Icon-only buttons always have an accessible label.

## 9. Imagery

- Screenshots on `oat` inside a white leaf with `radius-lg` and 1px `rule`.
- Diagrams as ledger rows: label, line, value. Olive for the main path, lime for the one thing new.
- Portrait: warm natural light, plant or wood tones welcome.

## 10. Voice and writing

- Grounded and plain-spoken: "Here's where things stand."
- Lead with what something does: "Agents plan, build and review work together."
- Buttons are verbs: "New project", "Save changes". Confirmations say what happened: "Project created."
- Errors say what went wrong and how to fix it: "Name is required. Add a project name to continue."
- Numbers: "AED 1,250.00", dates "21 Oct 2026", times "14:32".
- No buzzwords, no exclamation marks, no emoji in UI.

## 11. Accessibility

- Every text colour pair passes WCAG AA (4.5:1). Borders, focus rings and indicators pass 3:1.
- Focus ring: 2px white gap + 2px `olive`, on every interactive element.
- Never rely on colour alone; pair it with a word, icon or position.
- Hit targets at least 28px (34px default).
- The website respects `prefers-reduced-motion`: all motion off, content visible immediately.

Measured contrast for this palette:

| Pair | Ratio | Needed |
|---|---|---|
| Body text `ink` on `white` | 16.49:1 | 4.5:1 |
| `moss` on `oat` | 5.62:1 | 4.5:1 |
| `moss` on `barley` | 5.14:1 | 4.5:1 |
| White on `olive` (primary button) | 7.49:1 | 4.5:1 |
| `olive` links on `white` | 7.49:1 | 4.5:1 |
| `olive-text` on `olive-soft` | 7.61:1 | 4.5:1 |
| `lime-text` on `lime-soft` | 6.82:1 | 4.5:1 |
| `placeholder` on `white` | 5.39:1 | 4.5:1 |
| `rule-strong` borders on `white` | 3.55:1 | 3:1 |
| `ink` on `lime` (mark used as a fill) | 12.89:1 | 4.5:1 |

## 12. Do and don't

| Do | Don't |
|---|---|
| Oat ground, white leaves | Dark backgrounds or dark mode |
| Olive pills for actions | Other coloured buttons |
| Lime tabs with dark text | Lime text |
| Fraunces for titles | Fraunces in forms or tables |
| Ruling in empty areas | Ruling behind dense UI |
| One italic olive word | Several italic words |
| Amounts in mono, right-aligned | Centred numbers |
| Ledger draw-in on the website | Animation in the platform |


---

# Part 2 · Platform UI guideline

Rules for any platform, app, dashboard, admin or internal tool built in the Sage Ledger brand. It is generic: it works for projects, CRM, analytics, payments, AI agents or anything else.

**The platform never animates.** State changes are instant. Every rule here assumes light only.

---

## 1. Foundations for the platform

- **Ground:** `oat` for the app canvas and sidebar. `white` for every working panel (cards, tables, forms, modals).
- **Text:** `ink` for headings and values, `ink-secondary` for labels and nav, `moss` for help text and metadata.
- **Action colour:** `olive`. **Mark:** `lime` (small).
- **Density:** 14px text, 34px controls, 44px rows, 4px grid.

## 2. Type scale

| Style | Size / line | Weight | Family | Use |
|---|---|---|---|---|
| `ui-page-title` | 32 / 36 | 400 | Fraunces | Page title, one per screen |
| `ui-numeric` | 36 / 40 | 400 | Fraunces | KPI values, big totals |
| `ui-heading` | 16 / 24 | 600 | Instrument Sans | Card, section, modal headings |
| `ui-subheading` | 14 / 20 | 600 | Instrument Sans | Form group titles |
| `ui-body` | **14 / 20** | 400 | Instrument Sans | **Default text** |
| `ui-body-lg` | 16 / 24 | 400 | Instrument Sans | Empty states, onboarding |
| `ui-label` | 13 / 18 | 500 | Instrument Sans | Labels, nav items, buttons |
| `ui-small` | 12 / 16 | 400 | Instrument Sans | Help text, captions |
| `ui-meta` | 11 / 16 | 400 | Spline Sans Mono | IDs, timestamps, column headers |

Rules:

- Fraunces only for `ui-page-title`, `ui-numeric` and modal titles. Never in buttons, tables, forms, nav or badges.
- Numbers in tables use `font-variant-numeric: tabular-nums` and align right.
- Never below 11px (mono) or 12px (UI).

## 3. App layout

- **Sidebar:** 232px (60px collapsed), `oat`, 1px `rule` right border, 16px top padding. Product mark at top. Groups titled with `ui-meta`.
- **Top bar:** 56px, `white`, 1px `rule` bottom border. Search left (320px max), actions right.
- **Page header:** breadcrumb in `ui-meta`, then `ui-page-title`, optional one-line description in `moss`. Actions on the right, aligned to the title's baseline.
- **Content:** 24px padding, max width 1200px, 24px gap between blocks, 32px between page sections.
- **Breakpoints:** 640, 768, 1024, 1280. Below 1024 the sidebar becomes a drawer.

## 4. Components

### Buttons

| Variant | Look | Use |
|---|---|---|
| Primary | `olive` fill, `on-olive` text | The one main action per view |
| Secondary | `white` fill, 1px `rule-strong` border, `ink` text | Every other action |
| Ghost | No fill or border, `ink-secondary` text | Toolbars, cancel, low emphasis |
| Danger | `danger` fill, white text | Destructive confirmations only |

- Sizes: 28px (sm), **34px (default)**, 40px (lg). `radius-sm`. `ui-label` 13/500.
- States: hover = instant background change (`olive-hover`, `barley`); focus = `focus-ring`; disabled = `opacity-disabled`.
- Labels are verbs in sentence case: "New project", "Export CSV".

### Text inputs, selects, textareas

- 34px tall, 12px horizontal padding, `radius-sm`, `white` fill, 1px `rule-strong` border, `placeholder` colour for placeholders.
- Label above (`ui-label`, `ink-secondary`), help or error below (`ui-small`), 6px gaps.
- Focus: `olive` border + `focus-ring`. Error: `danger` border and a message saying how to fix it.

### Checkbox, radio, toggle

- Checkbox 16px, `radius-xs`; checked = `olive` fill with white tick. Radio: 8px `olive` dot. Toggle 32 × 18px; on = `olive`.
- The label is always clickable and sits 10px to the right.

### Badges

- 22px tall, 8px padding, `radius-xs`, 12/500.
- Done (`olive-soft`/`olive-text`), Live or new (`lime-soft`/`lime-text`), Needs review (`warning-soft`/`warning`), Failed (`danger-soft`/`danger`), Draft (`barley`/`moss`).

### Tabs and segmented controls

- **Tabs:** Instrument Sans 13/500 pills on a `barley` track; active = white pill.
- **Segmented control:** `barley` track, 3px padding; active segment = `white` with 1px `rule`.

### Tables

- `white` panel, 1px `rule`, `radius-md`, horizontal scroll on narrow screens.
- Header 36px, `barley`, `ui-meta` labels in `moss`. Rows 44px, 1px `rule` between rows. Hover = `oat`. Selected = `olive-soft` with a 2px `olive` left edge.
- IDs in `ui-meta`. Amounts right-aligned, tabular. Status as badges.

### Cards and KPIs

- `white`, 1px `rule`, `radius-md`, 20px padding, no shadow. KPI: `ui-meta` label, value in `ui-numeric`, delta in `ui-small`.
- Signature detail (Ledger ruling) on one group per screen at most.

### Navigation

- Sidebar items: 30px, `radius-sm`, `ui-label`, 16px icon in `moss`.
- Active: `olive-soft` background + `olive-text`.
- Breadcrumbs in `ui-meta` separated by " / ".

### Modals and side sheets

- Widths 440 / 600 / 800px; `white`, `radius-lg`, `shadow-modal`. Backdrop `ink` at 20%.
- Title in Fraunces 24/30; footer buttons right-aligned, primary last. Escape closes; focus returns to the trigger.

### Toasts, banners, empty, loading and error states

- Toast: bottom-right, `white`, `radius-lg`, `shadow-pop`, one line + optional "Undo". No animation.
- Empty: centred, 20px icon in `moss`, `ui-heading`, one line of `ui-body`, one primary button.
- Loading: static `barley` skeleton blocks + a `ui-meta` "loading…" label. No spinners or shimmer.
- Error: danger banner with what failed and a "Try again" button.

### Data visualisation

- `chart-1` main series, `chart-2` comparison, `chart-3` other, `chart-highlight` for one value. Gridlines `rule`, axis labels `ui-meta`. No animation, no 3D, no gradients.

## 5. Patterns

- **Forms:** one column, max 560px. Labels above fields. Actions bottom-right, primary last.
- **List to detail:** clicking a row opens a side sheet for quick edits.
- **Destructive actions:** confirm in a modal that names the thing, with a danger button.
- **Settings:** left sub-nav (200px) + one form card per section.

## 6. No-motion rules

- Everything inside `.sl-app` has `transition: none; animation: none`.
- Hover, focus, open and close are instant. Progress is static text or a stepped bar.

## 7. Checklist for every screen

- [ ] `oat` canvas, white panels, no dark areas
- [ ] One Fraunces page title; all other text Instrument Sans or mono
- [ ] One filled `olive` button
- [ ] `lime` only as a small mark
- [ ] 14px body, 34px controls, 44px rows, 4px grid
- [ ] Lines, not shadows (shadows only on floating things)
- [ ] Focus visible on every control
- [ ] Status has a word, not just colour
- [ ] Nothing animates


---

# Part 3 · Website guideline

How the Sage Ledger brand looks and moves on Sahil's website, landing pages and portfolio. Same palette and families as the platform, with bigger type, more air, and a defined motion system.

Light only: no dark bands, dark footers or dark cards.

---

## 1. Layout

- Max width 1120px, side padding 24px (16px on phones).
- 96px between sections (64px on phones); hero top spacing 128px (64px on phones).
- Text blocks max 60 characters wide.

## 2. Type scale

| Style | Size / line | Weight | Family | Use |
|---|---|---|---|---|
| `web-display` | 88 / 88 (48 / 50 on phones) | 400 | Fraunces | Hero headline |
| `web-h1` | 56 / 60 (36 on phones) | 400 | Fraunces | Section titles |
| `web-h2` | 40 / 46 (30 on phones) | 400 | Fraunces | Sub-sections, contact |
| `web-h3` | 20 / 28 | 600 | Instrument Sans | Card titles |
| `web-lead` | 19 / 30 | 400 | Instrument Sans | Intro paragraphs |
| `web-body` | 17 / 28 | 400 | Instrument Sans | Running text |
| `web-eyebrow` | 12 / 16 | 400 | Spline Sans Mono | Line above a headline |

- Accent: One italic Fraunces word in `olive`.
- Eyebrow: Spline Sans Mono 12px `moss` or a lime tab: `[new] full stack ai engineer`.

## 3. Page anatomy

### Navigation

- 68px, `oat`. Left: wordmark with margin line. Right: links Instrument Sans 14/500 `moss`, and an olive pill "Get in touch".

### Hero

- `oat` with ledger ruling across the hero and the olive margin line. A lime "New" tab above a Fraunces headline (80px) with one italic olive word, lead, olive pill + white pill.

### Section header

- Lime tab or mono eyebrow, `web-h1` in Fraunces, description in `moss`.

### Work cards

- White leaves, `radius-lg`, 1px `rule`, 24px padding, mono meta, Instrument Sans 20/600 title. Hover: title olive, arrow nudges.

### Notes / writing list

- A ledger: date | title | reading time, ruled rows 56px tall. Hover: row turns `barley`.

### Contact

- A white leaf with ruling, Fraunces headline, the email with Copy, olive pill.

### Footer

- `oat`, 1px `rule`, mono copyright, links.

## 4. Motion system

The website has **one orchestrated moment per page** (the hero) plus small responses to the user. Nothing else moves.

### Tokens

| Token | Value | Use |
|---|---|---|
| `duration-fast` | 150ms | Hover colour changes |
| `duration-base` | 220ms | Menus, accordions |
| `duration-reveal` | 700ms | Section fade-up |
| `duration-hero` | 900ms | Hero layers |
| `stagger` | 60ms | Delay between headline parts |
| Easing | `cubic-bezier(.2, .7, 0, 1)` | All reveals |

### The hero sequence (in order)

| Time | What happens | Spec |
|---|---|---|
| 0ms | Ruling draws | Ruled lines draw left to right, 60ms apart, 700ms each |
| 300ms | Margin line | The olive margin line draws top to bottom, 800ms |
| 200ms | Headline rises | Each word: opacity 0 → 1, translateY .35em → 0, 700ms, 60ms apart |
| 1000ms | Tab pops | The lime tab scales .8 → 1, 300ms |
| ~1300ms | Done | Everything readable from the first frame |

### Responses to the user

- **Links and buttons:** colour change over 150ms; arrows nudge 3px right.
- **Cards:** see Work cards above. Cards never tilt or scale more than 2px.
- **Sections:** the section title fades up 12px once when it first enters the viewport. Body text does not animate.

### Never

- Parallax on text, scroll-jacking, animating every section, typing effects on long text.
- Hiding content until it animates. Every element is readable in the first frame.
- Animation in the product UI.

### Reduced motion

With `prefers-reduced-motion: reduce`, everything above is off: the hero is simply there.

### Reference CSS

The complete hero CSS is in `motion.css` (Part 4). Hero markup:

```html
<header class="slw-hero"><div class="slw-lines"></div><div class="slw-margin"></div><div class="in"><span class="sl-tab">New</span>…<h1 class="slw-display">Systems that keep <em>everything</em> in order.</h1>…</div></header>
```

## 5. Checklist for every page

- [ ] Light only, no dark bands
- [ ] Headlines follow the accent rule (One italic Fraunces word in `olive`)
- [ ] Eyebrow above key headlines
- [ ] Signature details only where Part 1 allows them
- [ ] One hero motion sequence; everything readable before it plays
- [ ] Hover responses at 150ms
- [ ] Reduced motion respected
- [ ] One primary button per section


---

# Part 4 · Code

Copy each block into its own file, exactly as written. Component classes use the `.sl-` prefix (platform) and `.slw-` (website).

## tokens.css

```css
/* Sage Ledger tokens · Sahil Shaikh. Light only: there is no dark theme. */
:root {
  color-scheme: light;
  --oat: #faf9f4;
  --white: #ffffff;
  --barley: #f1efe6;
  --rule: #e5e2d6;
  --rule-strong: #8c8878;
  --ink: #1e2016;
  --ink-secondary: #3a3d2e;
  --moss: #63664f;
  --placeholder: #6a6c58;
  --olive: #4e5a1c;
  --olive-hover: #3f4916;
  --olive-soft: #eef1dd;
  --olive-text: #435017;
  --on-olive: #ffffff;
  --lime: #d4f05a;
  --lime-soft: #f6fcdd;
  --lime-text: #4d5e00;
  --success: var(--olive-text);
  --success-soft: var(--olive-soft);
  --warning: #8a5a00;
  --warning-soft: #fff4dc;
  --danger: #b42318;
  --danger-soft: #fdeceb;
  --chart-1: #4e5a1c;
  --chart-2: #a3ae6f;
  --chart-3: #cfcbbe;
  --chart-highlight: #d4f05a;
  --shadow-pop: 0 4px 12px -2px #1e201614, 0 2px 4px -2px #1e20160f;
  --shadow-modal: 0 20px 48px -12px #1e20162e, 0 4px 8px -4px #1e201614;
  --focus-ring: 0 0 0 2px #ffffff, 0 0 0 4px #4e5a1c;
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;
  --space-12: 48px;
  --space-16: 64px;
  --space-24: 96px;
  --space-32: 128px;
  --radius-xs: 4px;
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-full: 9999px;
  --control-sm: 28px;
  --control-md: 34px;
  --control-lg: 40px;
  --row-height: 44px;
  --topbar-height: 56px;
  --sidebar-width: 232px;
  --content-max: 1200px;
  --site-max: 1120px;
  --mark-size: 8px;
  --icon-md: 16px;
  --icon-lg: 20px;
  --duration-fast: 150ms;
  --duration-base: 220ms;
  --duration-reveal: 700ms;
  --duration-hero: 900ms;
  --stagger: 60ms;
  --opacity-disabled: 0.45;
  --ease-reveal: cubic-bezier(.2, .7, 0, 1);
  --font-display: Fraunces, "Iowan Old Style", Georgia, serif;
  --font-ui: "Instrument Sans", "Segoe UI", system-ui, sans-serif;
  --font-mono: "Spline Sans Mono", ui-monospace, Menlo, monospace;
}
.ui-page-title { font-family: var(--font-display); font-size: 32px; line-height: 36px; font-weight: 400; letter-spacing: -0.02em;  }
.ui-numeric { font-family: var(--font-display); font-size: 36px; line-height: 40px; font-weight: 400; letter-spacing: -0.02em; font-variant-numeric: tabular-nums;  }
.ui-heading { font-family: var(--font-ui); font-size: 16px; line-height: 24px; font-weight: 600; letter-spacing: -0.01em; }
.ui-subheading { font-family: var(--font-ui); font-size: 14px; line-height: 20px; font-weight: 600; }
.ui-body { font-family: var(--font-ui); font-size: 14px; line-height: 20px; font-weight: 400; }
.ui-body-lg { font-family: var(--font-ui); font-size: 16px; line-height: 24px; font-weight: 400; }
.ui-label { font-family: var(--font-ui); font-size: 13px; line-height: 18px; font-weight: 500; }
.ui-small { font-family: var(--font-ui); font-size: 12px; line-height: 16px; font-weight: 400; }
.ui-meta { font-family: var(--font-mono); font-size: 11px; line-height: 16px; font-weight: 400; }
.web-display { font-family: var(--font-display); font-size: 88px; line-height: 88px; font-weight: 400; letter-spacing: -0.02em;  }
.web-h1 { font-family: var(--font-display); font-size: 56px; line-height: 60px; font-weight: 400; letter-spacing: -0.02em;  }
.web-h2 { font-family: var(--font-display); font-size: 40px; line-height: 46px; font-weight: 400; letter-spacing: -0.02em;  }
.web-h3 { font-family: var(--font-ui); font-size: 20px; line-height: 28px; font-weight: 600; letter-spacing: -0.01em; }
.web-lead { font-family: var(--font-ui); font-size: 19px; line-height: 30px; font-weight: 400; }
.web-body { font-family: var(--font-ui); font-size: 17px; line-height: 28px; font-weight: 400; }
.web-eyebrow { font-family: var(--font-mono); font-size: 12px; line-height: 16px; font-weight: 400; }
/* Platform UI never animates: wrap the app in .sl-app */
.sl-app, .sl-app * { transition: none !important; animation: none !important; }
@media (max-width: 760px) { .web-display { font-size: 48px; line-height: 50px; } .web-h1 { font-size: 36px; line-height: 40px; } .web-h2 { font-size: 30px; line-height: 34px; } }
```

## components.css

```css
/* Sage Ledger · components.css — reference styles for every component (.sl-* platform, shared by the website). Requires tokens.css. */
@import url("https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;1,9..144,400&family=Instrument+Sans:wght@400;500;600&family=Spline+Sans+Mono:wght@400;500&display=swap");
/* Sage Ledger components. .sl-* = platform UI (no motion). .slw-* = website (motion allowed). */
body { margin: 0; font-family: var(--font-ui); font-size: 14px; line-height: 20px; color: var(--ink); background: var(--oat); -webkit-font-smoothing: antialiased; }
.sl-pad { padding: var(--space-5); }
.sl-row { display: flex; flex-wrap: wrap; align-items: center; gap: var(--space-3); }
.sl-col { display: grid; gap: var(--space-4); }
.sl-grid { display: grid; gap: var(--space-4); grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); }
.sl-meta { font-family: var(--font-mono); font-size: 11px; line-height: 16px; color: var(--moss); }
.sl-eyebrow { display: inline-flex; align-items: center; gap: var(--space-2); font-family: var(--font-mono); font-size: 11px; line-height: 16px; color: var(--moss); }
.sl-num { font-variant-numeric: tabular-nums; }
.sl-app, .sl-app * { transition: none !important; animation: none !important; }
:where(.sl-btn, .sl-input, .sl-select, .sl-textarea, .sl-tab, .sl-seg button, .sl-nav a, .sl-check input, .sl-toggle input):focus-visible { outline: 2px solid transparent; box-shadow: var(--focus-ring); }


/* Buttons */
.sl-btn { font: inherit; font-size: 13px; line-height: 18px; font-weight: 500; height: var(--control-md); padding: 0 var(--space-3); display: inline-flex; align-items: center; justify-content: center; gap: 6px; border-radius: var(--radius-sm); border: 1px solid transparent; cursor: pointer; white-space: nowrap; text-decoration: none; background: transparent; color: var(--ink); }
.sl-btn svg { width: var(--icon-md); height: var(--icon-md); }
.sl-btn-sm { height: var(--control-sm); padding: 0 10px; font-size: 12px; }
.sl-btn-lg { height: var(--control-lg); padding: 0 var(--space-4); font-size: 14px; }
.sl-btn-primary { background: var(--olive); color: var(--on-olive); }
.sl-btn-primary:hover { background: var(--olive-hover); }
.sl-btn-secondary { background: var(--white); border-color: var(--rule-strong); }
.sl-btn-secondary:hover { background: var(--barley); }
.sl-btn-ghost { color: var(--ink-secondary); }
.sl-btn-ghost:hover { background: var(--barley); color: var(--ink); }
.sl-btn-danger { background: var(--danger); color: #ffffff; }
.sl-btn[disabled] { opacity: var(--opacity-disabled); cursor: not-allowed; }
.sl-icon { fill: none; stroke: currentColor; stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; width: var(--icon-md); height: var(--icon-md); flex: none; }

/* Fields */
.sl-field { display: grid; gap: 6px; min-width: 0; }
.sl-label { font-size: 13px; line-height: 18px; font-weight: 500; color: var(--ink-secondary); }
.sl-input, .sl-select, .sl-textarea { font: inherit; font-size: 14px; width: 100%; box-sizing: border-box; height: var(--control-md); padding: 0 var(--space-3); border-radius: var(--radius-sm); border: 1px solid var(--rule-strong); background: var(--white); color: var(--ink); }
.sl-textarea { height: 88px; padding-block: 8px; resize: vertical; }
.sl-select { appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='none' stroke='%2363664f' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m4 6 4 4 4-4'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 10px center; padding-right: 34px; }
.sl-input::placeholder, .sl-textarea::placeholder { color: var(--placeholder); }
.sl-input:focus, .sl-select:focus, .sl-textarea:focus, .sl-input.is-focus { outline: none; border-color: var(--olive); box-shadow: var(--focus-ring); }
.sl-input.is-error { border-color: var(--danger); }
.sl-help { margin: 0; font-size: 12px; line-height: 16px; color: var(--moss); }
.sl-help.is-error { color: var(--danger); }
.sl-check { display: inline-flex; align-items: center; gap: 10px; font-size: 14px; color: var(--ink-secondary); cursor: pointer; }
.sl-check input { appearance: none; margin: 0; width: 16px; height: 16px; border: 1px solid var(--rule-strong); border-radius: var(--radius-xs); background: var(--white); display: grid; place-items: center; cursor: pointer; }
.sl-check input:checked { background: var(--olive); border-color: var(--olive); }
.sl-check input:checked::after { content: ""; width: 4px; height: 8px; border: solid #ffffff; border-width: 0 2px 2px 0; transform: translateY(-1px) rotate(45deg); }
.sl-check input[type="radio"] { border-radius: 50%; }
.sl-check input[type="radio"]:checked { background: var(--white); border-color: var(--olive); }
.sl-check input[type="radio"]:checked::after { width: 8px; height: 8px; border: 0; border-radius: 50%; background: var(--olive); transform: none; }
.sl-toggle { display: inline-flex; align-items: center; gap: 10px; font-size: 14px; color: var(--ink-secondary); cursor: pointer; }
.sl-toggle input { appearance: none; margin: 0; width: 32px; height: 18px; border-radius: var(--radius-full); background: var(--rule-strong); position: relative; cursor: pointer; }
.sl-toggle input::after { content: ""; position: absolute; top: 2px; left: 2px; width: 14px; height: 14px; border-radius: 50%; background: #ffffff; }
.sl-toggle input:checked { background: var(--olive); }
.sl-toggle input:checked::after { left: 16px; }

/* Badges */
.sl-badge { display: inline-flex; align-items: center; gap: 6px; height: 22px; padding: 0 var(--space-2); border-radius: var(--radius-xs); font-size: 12px; line-height: 16px; font-weight: 500; background: var(--barley); color: var(--moss); white-space: nowrap; }
.sl-badge.dot::before { content: ""; width: 6px; height: 6px; background: currentColor; }
.sl-badge-done { background: var(--success-soft); color: var(--success); }
.sl-badge-live { background: var(--lime-soft); color: var(--lime-text); }
.sl-badge-warn { background: var(--warning-soft); color: var(--warning); }
.sl-badge-fail { background: var(--danger-soft); color: var(--danger); }
.sl-badge-mono { font-family: var(--font-mono); font-size: 11px; font-weight: 400; background: var(--white); border: 1px solid var(--rule); color: var(--ink-secondary); }

/* Tabs and segmented */
.sl-tabs { display: flex; gap: var(--space-5); border-bottom: 1px solid var(--rule); }
.sl-tab { font: inherit; background: none; border: 0; padding: 0; height: 36px; font-family: var(--font-mono); font-size: 11px; color: var(--moss); border-bottom: 2px solid transparent; margin-bottom: -1px; cursor: pointer; }
.sl-tab:hover { color: var(--ink); }
.sl-tab[aria-selected="true"] { color: var(--ink); border-bottom-color: var(--ink); }
.sl-seg { display: inline-flex; gap: 2px; padding: 3px; background: var(--barley); border-radius: var(--radius-sm); }
.sl-seg button { font: inherit; font-size: 13px; font-weight: 500; border: 1px solid transparent; background: none; color: var(--moss); height: 28px; padding: 0 12px; border-radius: 4px; cursor: pointer; }
.sl-seg button[aria-pressed="true"] { background: var(--white); color: var(--ink); border-color: var(--rule); }

/* Cards and KPIs */
.sl-card { background: var(--white); border: 1px solid var(--rule); border-radius: var(--radius-md); padding: var(--space-5); min-width: 0; }
.sl-card-head { display: flex; justify-content: space-between; align-items: center; gap: var(--space-3); margin-bottom: var(--space-4); }
.sl-card-title { margin: 0; font-size: 16px; line-height: 24px; font-weight: 600; letter-spacing: -.01em; }
.sl-kpi-value { font-family: var(--font-display); font-size: 36px; line-height: 40px; font-weight: 400; letter-spacing: -0.02em; font-variant-numeric: tabular-nums; margin-top: var(--space-2); }
.sl-delta { font-size: 12px; line-height: 16px; font-weight: 500; color: var(--success); margin-top: var(--space-1); }
.sl-delta.warn { color: var(--warning); } .sl-delta.down { color: var(--danger); }

/* Table */
.sl-table-wrap { background: var(--white); border: 1px solid var(--rule); border-radius: var(--radius-md); overflow-x: auto; }
.sl-table { width: 100%; border-collapse: collapse; font-size: 14px; }
.sl-table th { height: 36px; padding: 0 var(--space-3); text-align: left; background: var(--barley); border-bottom: 1px solid var(--rule); font-family: var(--font-mono); font-size: 11px; font-weight: 400; color: var(--moss); white-space: nowrap; }
.sl-table td { height: var(--row-height); padding: 0 var(--space-3); border-bottom: 1px solid var(--rule); color: var(--ink-secondary); white-space: nowrap; }
.sl-table tbody tr:last-child td { border-bottom: 0; }
.sl-table tbody tr { cursor: pointer; }
.sl-table tbody tr:hover td { background: var(--oat); }
.sl-table tbody tr[aria-selected="true"] td { background: var(--olive-soft); }
.sl-table tbody tr[aria-selected="true"] td:first-child { box-shadow: inset 2px 0 0 var(--olive); }
.sl-table .r { text-align: right; font-variant-numeric: tabular-nums; }
.sl-table .strong { color: var(--ink); font-weight: 500; }
.sl-table .id { font-family: var(--font-mono); font-size: 11px; color: var(--moss); }
.sl-table-foot { display: flex; justify-content: space-between; gap: var(--space-3); padding: 10px var(--space-3); border-top: 1px solid var(--rule); font-size: 12px; color: var(--moss); }

/* App shell */
.sl-app { display: grid; grid-template-columns: var(--sidebar-width) minmax(0, 1fr); min-height: 640px; background: var(--white); font-size: 14px; }
.sl-side { background: var(--oat); border-right: 1px solid var(--rule); padding: var(--space-4) 10px; display: flex; flex-direction: column; gap: var(--space-5); }
.sl-brand { display: flex; align-items: center; gap: var(--space-2); padding: 0 6px; font-family: var(--font-display); font-size: 20px; line-height: 24px; color: var(--ink); }
.sl-nav { display: grid; gap: 2px; }
.sl-nav .sl-meta { padding: 0 8px 6px; }
.sl-nav a { display: flex; align-items: center; gap: 10px; height: 30px; padding: 0 8px; border-radius: var(--radius-sm); font-size: 13px; font-weight: 500; color: var(--ink-secondary); text-decoration: none; cursor: pointer; }
.sl-nav a .sl-icon { color: var(--moss); }
.sl-nav a:hover { background: var(--white); color: var(--ink); }
.sl-nav a[aria-current="page"] { background: var(--olive-soft); color: var(--olive-text); }
.sl-nav a[aria-current="page"] .sl-icon { color: var(--olive-text); }
.sl-nav .count { margin-left: auto; font-family: var(--font-mono); font-size: 10px; color: var(--moss); }
.sl-main { min-width: 0; display: flex; flex-direction: column; }
.sl-top { height: var(--topbar-height); border-bottom: 1px solid var(--rule); display: flex; align-items: center; gap: var(--space-3); padding: 0 var(--space-6); }
.sl-top .sl-input { max-width: 320px; }
.sl-top .right { margin-left: auto; display: flex; gap: var(--space-2); align-items: center; }
.sl-avatar { width: 30px; height: 30px; border-radius: 50%; background: var(--oat); border: 1px solid var(--rule); display: grid; place-items: center; font-size: 11px; font-weight: 600; color: var(--ink-secondary); }
.sl-page { padding: var(--space-6); display: grid; gap: var(--space-6); max-width: var(--content-max); }
.sl-page-head { display: flex; justify-content: space-between; align-items: flex-end; gap: var(--space-4); flex-wrap: wrap; }
.sl-page-title { margin: 2px 0 0; font-family: var(--font-display); font-size: 32px; line-height: 36px; font-weight: 400; letter-spacing: -0.02em; }
.sl-page-sub { margin: var(--space-1) 0 0; color: var(--moss); }

/* Modal, toast, banner, empty */
.sl-backdrop { background: rgba(30, 32, 22, .2); padding: var(--space-6); display: grid; place-items: center; }
.sl-modal { width: 100%; max-width: 440px; background: var(--white); border: 1px solid var(--rule); border-radius: var(--radius-lg); box-shadow: var(--shadow-modal); }
.sl-modal-head { display: flex; justify-content: space-between; gap: var(--space-3); padding: var(--space-5) var(--space-5) 0; }
.sl-modal-title { margin: 0; font-family: var(--font-display); font-size: 24px; line-height: 30px; font-weight: 400; }
.sl-modal-body { padding: var(--space-5); display: grid; gap: var(--space-4); }
.sl-modal-foot { display: flex; justify-content: flex-end; gap: var(--space-2); padding: var(--space-4) var(--space-5); border-top: 1px solid var(--rule); }
.sl-toast { display: inline-flex; align-items: center; gap: var(--space-3); padding: 12px var(--space-4); background: var(--white); border: 1px solid var(--rule); border-radius: var(--radius-lg); box-shadow: var(--shadow-pop); font-weight: 500; }
.sl-toast .sl-icon { color: var(--olive); }
.sl-banner { display: flex; align-items: center; gap: var(--space-3); padding: 12px var(--space-4); border-radius: var(--radius-md); font-size: 14px; }
.sl-banner .grow { flex: 1; }
.sl-banner-warn { background: var(--warning-soft); color: var(--warning); }
.sl-banner-fail { background: var(--danger-soft); color: var(--danger); }
.sl-banner-info { background: var(--olive-soft); color: var(--olive-text); }
.sl-empty { position: relative; overflow: hidden; text-align: center; padding: var(--space-12) var(--space-6); background: var(--white); border: 1px solid var(--rule); border-radius: var(--radius-md); }
.sl-empty > * { position: relative; }
.sl-empty .sl-icon { width: 20px; height: 20px; color: var(--moss); }
.sl-empty h3 { margin: var(--space-3) 0 var(--space-1); font-size: 16px; line-height: 24px; font-weight: 600; }
.sl-empty p { margin: 0 auto var(--space-4); max-width: 40ch; color: var(--moss); }
.sl-skel { background: var(--barley); border-radius: 4px; height: 12px; }

/* Signature details */
.sl-mark { display: inline-block; width: 1px; height: 18px; background: var(--olive); flex: none; }
.sl-eyebrow::before { content: ""; width: 1px; height: 14px; background: var(--olive); }
.sl-accent { font-family: var(--font-display); font-style: italic; font-weight: 400; color: var(--olive); }
.sl-empty::before { content: ""; position: absolute; inset: 0; background-image: repeating-linear-gradient(transparent 0 27px, var(--rule) 27px 28px); opacity: .7; -webkit-mask-image: linear-gradient(transparent, #000 30%, #000 70%, transparent); mask-image: linear-gradient(transparent, #000 30%, #000 70%, transparent); }
/* Ledger ruling and lime tab (signature) */
.sl-ruled { background-image: linear-gradient(90deg, transparent 47px, var(--olive) 47px, var(--olive) 48px, transparent 48px), repeating-linear-gradient(transparent 0 27px, var(--rule) 27px 28px); }
.sl-tab { display: inline-flex; align-items: center; height: 22px; padding: 0 10px; border-radius: var(--radius-full); background: var(--lime); color: var(--ink); font-size: 12px; font-weight: 600; }
```

## motion.css (website only)

```css
/* Sage Ledger · motion.css — WEBSITE ONLY. Never load inside the platform UI. Requires tokens.css. */
/* ---------------- Website ---------------- */
.fw { font-size: 17px; line-height: 28px; background: var(--oat); }
.slw-wrap { max-width: var(--site-max); margin: 0 auto; padding: 0 var(--space-6); }
.slw-nav { display: flex; align-items: center; justify-content: space-between; height: 72px; }
.slw-logo { display: flex; align-items: center; gap: var(--space-2); font-family: var(--font-display); font-size: 22px; line-height: 28px; color: var(--ink); text-decoration: none; }
.slw-links { display: flex; align-items: center; gap: var(--space-6); font-size: 14px; font-weight: 500; color: var(--moss); }
.slw-links a { color: inherit; text-decoration: none; transition: color 150ms ease-out; }
.slw-links a:hover { color: var(--ink); }
.slw-links a[aria-current="page"] { color: var(--ink); text-decoration: underline; text-underline-offset: 6px; text-decoration-thickness: 1px; }
.fw .sl-btn { transition: background-color 150ms ease-out; }
.fw .sl-btn .arr { display: inline-block; transition: transform 150ms ease-out; }
.fw .sl-btn:hover .arr, .slw-card:hover .arr { transform: translateX(3px); }
.slw-display { margin: 0; font-family: var(--font-display); font-weight: 400; font-size: 88px; line-height: 84px; letter-spacing: -0.02em; max-width: 13ch; color: var(--ink); }
.slw-display .w { display: inline-block; }
.slw-lead { margin: var(--space-5) 0 var(--space-8); max-width: 44ch; font-size: 19px; line-height: 30px; color: var(--moss); }
.slw-cta { display: flex; gap: var(--space-3); flex-wrap: wrap; }
.slw-sec-head { display: flex; justify-content: space-between; align-items: flex-end; gap: var(--space-4); flex-wrap: wrap; margin-bottom: var(--space-8); }
.slw-h1 { margin: var(--space-3) 0 0; font-family: var(--font-display); font-weight: 400; font-size: 56px; line-height: 58px; letter-spacing: -0.02em; }
.slw-h2 { margin: 0; font-family: var(--font-display); font-weight: 400; font-size: 40px; line-height: 44px; letter-spacing: -0.02em; }
.slw-cards { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: var(--space-6); }
.slw-card { display: flex; flex-direction: column; gap: var(--space-2); padding: var(--space-6); background: var(--white); border: 1px solid var(--rule); border-radius: var(--radius-md); text-decoration: none; color: var(--ink); min-width: 0; }
.slw-shot { aspect-ratio: 16/10; border-radius: var(--radius-sm); background: var(--oat); border: 1px solid var(--rule); margin-bottom: var(--space-3); padding: 12px; display: grid; gap: 8px; align-content: start; }
.slw-shot span { height: 8px; border-radius: 4px; background: var(--barley); }
.slw-card h3 { margin: 0; font-size: 20px; line-height: 28px; font-weight: 600; letter-spacing: -.01em; display: flex; justify-content: space-between; transition: color 150ms ease-out; }
.slw-card:hover h3 { color: var(--olive); }
.slw-card p { margin: 0; font-size: 15px; line-height: 24px; color: var(--moss); }
.slw-card .tags { display: flex; gap: var(--space-2); flex-wrap: wrap; margin-top: var(--space-3); }
.slw-notes { display: grid; }
.slw-note { display: grid; grid-template-columns: 120px minmax(0, 1fr); gap: var(--space-4); padding: var(--space-5) 0; border-bottom: 1px solid var(--rule); text-decoration: none; color: var(--ink); }
.slw-note b { display: block; font-family: var(--font-display); font-weight: 400; font-size: 24px; line-height: 30px; transition: color 150ms ease-out; }
.slw-note:hover b { color: var(--olive); }
.slw-note span { color: var(--moss); font-size: 15px; }
@media (max-width: 760px) {
  .slw-display { font-size: 48px; line-height: 48px; } .slw-h1 { font-size: 36px; line-height: 40px; } .slw-h2 { font-size: 30px; line-height: 34px; }
  .slw-cards { grid-template-columns: 1fr; } .slw-links { display: none; } .slw-hero { padding: var(--space-5) var(--space-5) var(--space-10); }
  .slw-note { grid-template-columns: 1fr; gap: var(--space-1); }
  .sl-app { grid-template-columns: 1fr; } .sl-side { display: none; }
}

/* Accent word */
.slw-display em, .slw-h1 em, .slw-h2 em { font-style: italic; color: var(--olive); }

/* Hero (signature) */
.slw-hero { position: relative; overflow: hidden; padding: var(--space-24) 0 var(--space-16) 72px; }
.slw-lines { position: absolute; inset: 0; background-image: repeating-linear-gradient(transparent 0 27px, var(--rule) 27px 28px); -webkit-mask-image: linear-gradient(#000, transparent 90%); mask-image: linear-gradient(#000, transparent 90%); }
.slw-margin { position: absolute; left: 48px; top: 0; bottom: 0; width: 1px; background: var(--olive); opacity: .5; transform-origin: top; }
.slw-hero > .in { position: relative; }

@media (prefers-reduced-motion: no-preference) {
  .slw-play .slw-lines { animation: slw-rule 900ms ease-out both; }
  @keyframes slw-rule { from { clip-path: inset(0 100% 0 0); } to { clip-path: inset(0 0 0 0); } }
  .slw-play .slw-margin { animation: slw-margin 800ms var(--ease-reveal) 300ms both; }
  @keyframes slw-margin { from { transform: scaleY(0); } to { transform: none; } }
  .slw-play .slw-display .w { animation: slw-rise 700ms var(--ease-reveal) both; animation-delay: calc(200ms + var(--i) * var(--stagger)); }
  @keyframes slw-rise { from { opacity: 0; transform: translateY(.35em); } to { opacity: 1; transform: none; } }
  .slw-play .sl-tab { animation: slw-pop 300ms var(--ease-reveal) 1000ms both; }
  @keyframes slw-pop { from { transform: scale(.8); opacity: 0; } to { transform: none; opacity: 1; } }
  .slw-fade.slw-in { animation: slw-up var(--duration-reveal) var(--ease-reveal) both; }
  @keyframes slw-up { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }
}

/* Usage
   1. Hero markup: <header class="slw-hero"><div class="slw-lines"></div><div class="slw-margin"></div><div class="in"><span class="sl-tab">New</span>…<h1 class="slw-display">Systems that keep <em>everything</em> in order.</h1>…</div></header>
   2. Split the headline into <span class="w" style="--i:N"> words (or lines), then add .slw-play to the hero once it is in view.
   3. Section titles: add .slw-fade; add .slw-in when they first enter the viewport.
   Everything is visible before and without the script; prefers-reduced-motion turns all of it off. */
```

## tailwind-theme.css (only if the project uses Tailwind v4)

```css
@import "tailwindcss";
/* Sage Ledger · Tailwind v4 theme. Load tokens.css first. Light only. */
@theme inline {
  --color-oat: var(--oat);
  --color-white: var(--white);
  --color-barley: var(--barley);
  --color-rule: var(--rule);
  --color-rule-strong: var(--rule-strong);
  --color-ink: var(--ink);
  --color-ink-secondary: var(--ink-secondary);
  --color-moss: var(--moss);
  --color-placeholder: var(--placeholder);
  --color-olive: var(--olive);
  --color-olive-hover: var(--olive-hover);
  --color-olive-soft: var(--olive-soft);
  --color-olive-text: var(--olive-text);
  --color-on-olive: var(--on-olive);
  --color-lime: var(--lime);
  --color-lime-soft: var(--lime-soft);
  --color-lime-text: var(--lime-text);
  --color-success: var(--success);
  --color-success-soft: var(--success-soft);
  --color-warning: var(--warning);
  --color-warning-soft: var(--warning-soft);
  --color-danger: var(--danger);
  --color-danger-soft: var(--danger-soft);
  --color-chart-1: var(--chart-1);
  --color-chart-2: var(--chart-2);
  --color-chart-3: var(--chart-3);
  --color-chart-highlight: var(--chart-highlight);
  --font-display: var(--font-display);
  --font-ui: var(--font-ui);
  --font-mono: var(--font-mono);
  --radius-xs: var(--radius-xs);
  --radius-sm: var(--radius-sm);
  --radius-md: var(--radius-md);
  --radius-lg: var(--radius-lg);
  --radius-full: var(--radius-full);
  --shadow-pop: var(--shadow-pop);
  --shadow-modal: var(--shadow-modal);
  --shadow-focus-ring: var(--focus-ring);
  --spacing: 4px;
}
```

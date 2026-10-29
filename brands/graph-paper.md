# GRAPH-PAPER.md · Sahil Shaikh brand (all-in-one)

**For Claude Code:** this single file contains the whole Graph Paper system: brand rules, platform UI rules (no animation), website rules (with motion), and the complete CSS. Put it in the project root and add this line to `CLAUDE.md`:

```
All UI follows GRAPH-PAPER.md. Before writing UI, create tokens.css, components.css (and motion.css for website pages) from Part 4 if they don't exist, then use only their variables and classes. Light only, never dark. Platform UI has no animation.
```

## How Claude Code should use this file

1. Decide the surface: **Platform UI** (app, dashboard, admin, settings) or **Website** (marketing, portfolio, landing). If unclear, assume Platform UI.
2. If `tokens.css` and `components.css` don't exist in the project, create them by copying the code blocks in Part 4 exactly. For website pages also create `motion.css`. With Tailwind v4 also create `tailwind-theme.css`.
3. Load the Google Fonts in Part 1, section 5.
4. Never hard-code colours, font sizes or fonts. Never add dark mode or dark sections.
5. Platform UI: wrap the app in `class="gp-app"` (kills all motion). Website: follow Part 3, section 4.
6. Finish by running the checklist at the end of Part 2 or Part 3.

---

Sahil Shaikh's brand and design system, **Graph Paper**. Part 1 is the brand foundations, Part 2 the platform UI rules (no animation), Part 3 the website rules (with motion), Part 4 the code.

*Researched from: Cal.com, Vercel's light docs, Attio's framed layout. Inspired by, not copied from: no logos, fonts or assets of those products are used.*

---

# Part 1 · Brand foundations

The brand of Sahil Shaikh, Full Stack AI Engineer. **Graph Paper**: a scheduling board on graph paper: chalk grey ground, white console, black pills, one lime highlighter. It covers every platform Sahil designs and his website.

This system has three parts:

1. **Brand foundations** (Part 1): idea, logo, colour, type, layout, shape, icons, imagery, voice and accessibility.
2. **Platform UI** (Part 2): rules for any app, dashboard or tool. **No animation.**
3. **Website** (Part 3): the same brand with larger type and a defined motion system.

Light only. There is no dark theme, and no dark sections, panels or backgrounds anywhere.

---

## 1. The idea

| | |
|---|---|
| **Metaphor** | A scheduling board on graph paper: chalk grey ground, white console, black pills, one lime highlighter. |
| **Personality** | Practical, friendly, energetic. A tool you want to use every day. |
| **Feeling we want** | "This just works, and it was built by someone who ships." |
| **Three ingredients** | **Console** (a white framed panel on chalk) · **Cells** (an 8px grid and slot-like cells) · **Pills** (black pill buttons and a lime highlight) |

## 2. Principles

1. **Chalk ground, white console.** The page is `chalk`; the working area is one big `white` console with a 1px border.
2. **Black to act.** Primary actions are `carbon` pills. Colour is reserved for the lime highlight.
3. **Lime is a highlighter.** It marks one thing: today, the selected slot, the accent word's underline.
4. **Cells and grids.** Information sits in tidy cells; empty areas show a faint 8px grid.
5. **Bold, friendly display.** Bricolage Grotesque 700 for titles; Figtree for everything you read.
6. **Product still, website clicks into place.** The hero grid fills like booked slots, once.
7. **Accessible always.** Text 4.5:1 or better, borders and indicators 3:1, focus always visible.

## 3. Logo

- **Wordmark:** "sahil" in Bricolage Grotesque 700 lowercase, `carbon`, followed by a 7px lime square. Tracking -0.03em.
- **Product mark:** the lime square + product name in Bricolage 700 lowercase.
- **App icon / avatar:** a `carbon` pill-square (30% radius) with a white "s" and the lime square in the corner.
- **Clear space:** the x-height on every side. **Minimum size:** wordmark 64px; icon 20px.
- **Never:** set lime text on white, outline the wordmark, or use it on a dark photo.

## 4. Colour

### Core palette

| Token | Hex | Role |
|---|---|---|
| `chalk` | #F2F2F0 | Page ground, website background |
| `white` | #FFFFFF | Cards, tables, inputs, modals |
| `fog` | #EAEAE7 | Hover cells, table headers, unselected slots |
| `rule` | #E0E0DC | Dividers and borders |
| `rule-strong` | #8B8B85 | Input borders, strong dividers |
| `ink` | #111111 | Headings, primary text |
| `ink-secondary` | #2E2E2C | Labels, nav, table text |
| `lead` | #5E5E59 | Secondary text, labels |
| `placeholder` | #6E6E69 | Placeholders, disabled text |
| `carbon` | #141414 | Primary pill buttons, active states, focus |
| `carbon-hover` | #2E2E2C | Hover/pressed carbon |
| `carbon-soft` / `carbon-text` | #ECECE9 / #141414 | Selected, active, success |
| `lime` | #C8F03C | Highlighter: today, selected slot, accent underline |
| `lime-soft` / `lime-text` | #F3FCD9 / #4A6100 | Soft lime badges |
| `warning` / `warning-soft` | #8A5A00 / #FFF4DC | Needs attention |
| `danger` / `danger-soft` | #B42318 / #FDECEB | Errors, destructive |

### Charts

`chart-1` carbon #141414, `chart-2` #9C9C96, `chart-3` #CFCFCA, and `chart-highlight` lime #C8F03C for the one value that matters. Gridlines use `rule`, axis labels use `ui-meta` in `lead`.

### Proportions

About 55% chalk, 32% white, 10% black type and lines, 3% lime.

### Rules

- Carbon is the action colour. One filled carbon pill per view; secondary buttons are white pills.
- Lime is never text and never a button fill. It is a highlight under or behind something.
- Links are `ink` with a 1px underline; on hover the underline becomes a 3px lime bar.
- No gradients.
- Status always has a word.

## 5. Typography

Three roles, all free on Google Fonts:

`https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,700&family=Figtree:wght@400;500;600&family=DM+Mono:wght@400;500&display=swap`

| Family | Role | Use | Weights |
|---|---|---|---|
| **Bricolage Grotesque** | **The voice** | Page titles, big numbers, website headlines | 500, 700 |
| **Figtree** | **The clarity** | All UI and body text | 400, 500, 600 |
| **DM Mono** | **The precision** | Times, dates, IDs, column headers | 400, 500 |

- **Accent word:** one word per headline gets a lime highlighter bar behind its lower half.
- Times always in DM Mono: `09:30`, `14:00–15:00`.
- Wordmark and product names are lowercase; everything else sentence case.
- Figtree never above 600.
- Full scales are in Part 2 (platform) and Part 3 (website).

## 6. Layout and spacing

- **4px grid:** 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 96, 128.
- **Platform:** sidebar on `chalk`, content on `white`, 24px page padding, max 1200px.
- **Website:** 1200px max width, 96px between sections.
- Align to a left edge in the product. Centre only short single lines (an empty state).

## 7. Shape and depth

| Token | Value | Use |
|---|---|---|
| `radius-xs` | 6px | Badges, slots |
| `radius-sm` | 10px | Inputs, nav items |
| `radius-md` | 14px | Cards, tables |
| `radius-lg` | 20px | Console panel, modals |
| `radius-full` | 9999px | All buttons, toggles, tags |

- **Console frame** (signature): the main work area is one `white` panel with `radius-lg`, inset 8px from the chalk edges.
- **Slot cells** (signature): selectable items are 40px cells in `fog`; selected = `white` + 1px `carbon` + a lime corner dot.
- **8px grid** in `rule` behind empty states and the website hero, faded with a mask.
- Shadows only on menus and modals.

## 8. Iconography

- Lucide, 1.75px stroke (a touch bolder to match Bricolage). 16px in controls. `lead` default, `carbon` active.
- Icon-only buttons always have an accessible label.

## 9. Imagery

- Real UI on the white console. Cropped tight, no device frames.
- Diagrams as cells and arrows in black lines, one lime cell for the point.
- Portrait: bright, simple background, rounded 20px.

## 10. Voice and writing

- Friendly and direct, a bit playful: "Pick a slot", "You're all set".
- Lead with what something does: "Agents plan, build and review work together."
- Buttons are verbs: "New project", "Save changes". Confirmations say what happened: "Project created."
- Errors say what went wrong and how to fix it: "Name is required. Add a project name to continue."
- Numbers: "AED 1,250.00", dates "21 Oct 2026", times "14:32".
- No buzzwords, no exclamation marks, no emoji in UI.

## 11. Accessibility

- Every text colour pair passes WCAG AA (4.5:1). Borders, focus rings and indicators pass 3:1.
- Focus ring: 2px white gap + 2px `carbon`, on every interactive element.
- Never rely on colour alone; pair it with a word, icon or position.
- Hit targets at least 28px (34px default).
- The website respects `prefers-reduced-motion`: all motion off, content visible immediately.

Measured contrast for this palette:

| Pair | Ratio | Needed |
|---|---|---|
| Body text `ink` on `white` | 18.88:1 | 4.5:1 |
| `lead` on `chalk` | 5.82:1 | 4.5:1 |
| `lead` on `fog` | 5.41:1 | 4.5:1 |
| White on `carbon` (primary button) | 18.42:1 | 4.5:1 |
| `carbon` links on `white` | 18.42:1 | 4.5:1 |
| `carbon-text` on `carbon-soft` | 15.56:1 | 4.5:1 |
| `lime-text` on `lime-soft` | 6.58:1 | 4.5:1 |
| `placeholder` on `white` | 5.13:1 | 4.5:1 |
| `rule-strong` borders on `white` | 3.43:1 | 3:1 |
| `ink` on `lime` (mark used as a fill) | 14.37:1 | 4.5:1 |

## 12. Do and don't

| Do | Don't |
|---|---|
| Chalk ground, white console | Dark backgrounds or dark mode |
| Black pill buttons | Coloured buttons |
| Lime as a highlighter | Lime text or lime buttons |
| Bricolage for titles | Bricolage in tables or forms |
| Times in DM Mono | Proportional times that jump |
| Cells for choices | Long dropdowns for small sets |
| Grid only in empty areas | Grid behind text |
| One slot-fill moment on the website | Animation in the platform |


---

# Part 2 · Platform UI guideline

Rules for any platform, app, dashboard, admin or internal tool built in the Graph Paper brand. It is generic: it works for projects, CRM, analytics, payments, AI agents or anything else.

**The platform never animates.** State changes are instant. Every rule here assumes light only.

---

## 1. Foundations for the platform

- **Ground:** `chalk` for the app canvas and sidebar. `white` for every working panel (cards, tables, forms, modals).
- **Text:** `ink` for headings and values, `ink-secondary` for labels and nav, `lead` for help text and metadata.
- **Action colour:** `carbon`. **Mark:** `lime` (small).
- **Density:** 14px text, 34px controls, 44px rows, 4px grid.

## 2. Type scale

| Style | Size / line | Weight | Family | Use |
|---|---|---|---|---|
| `ui-page-title` | 32 / 36 | 700 | Bricolage Grotesque | Page title, one per screen |
| `ui-numeric` | 36 / 40 | 700 | Bricolage Grotesque | KPI values, big totals |
| `ui-heading` | 16 / 24 | 600 | Figtree | Card, section, modal headings |
| `ui-subheading` | 14 / 20 | 600 | Figtree | Form group titles |
| `ui-body` | **14 / 20** | 400 | Figtree | **Default text** |
| `ui-body-lg` | 16 / 24 | 400 | Figtree | Empty states, onboarding |
| `ui-label` | 13 / 18 | 500 | Figtree | Labels, nav items, buttons |
| `ui-small` | 12 / 16 | 400 | Figtree | Help text, captions |
| `ui-meta` | 11 / 16 | 400 | DM Mono | IDs, timestamps, column headers |

Rules:

- Bricolage Grotesque only for `ui-page-title`, `ui-numeric` and modal titles. Never in buttons, tables, forms, nav or badges.
- Numbers in tables use `font-variant-numeric: tabular-nums` and align right.
- Never below 11px (mono) or 12px (UI).

## 3. App layout

- **Sidebar:** 232px (60px collapsed), `chalk`, 1px `rule` right border, 16px top padding. Product mark at top. Groups titled with `ui-meta`.
- **Top bar:** 56px, `white`, 1px `rule` bottom border. Search left (320px max), actions right.
- **Page header:** breadcrumb in `ui-meta`, then `ui-page-title`, optional one-line description in `lead`. Actions on the right, aligned to the title's baseline.
- **Content:** 24px padding, max width 1200px, 24px gap between blocks, 32px between page sections.
- **Breakpoints:** 640, 768, 1024, 1280. Below 1024 the sidebar becomes a drawer.

## 4. Components

### Buttons

| Variant | Look | Use |
|---|---|---|
| Primary | `carbon` fill, `on-carbon` text | The one main action per view |
| Secondary | `white` fill, 1px `rule-strong` border, `ink` text | Every other action |
| Ghost | No fill or border, `ink-secondary` text | Toolbars, cancel, low emphasis |
| Danger | `danger` fill, white text | Destructive confirmations only |

- Sizes: 28px (sm), **34px (default)**, 40px (lg). `radius-sm`. `ui-label` 13/500.
- States: hover = instant background change (`carbon-hover`, `fog`); focus = `focus-ring`; disabled = `opacity-disabled`.
- Labels are verbs in sentence case: "New project", "Export CSV".

### Text inputs, selects, textareas

- 34px tall, 12px horizontal padding, `radius-sm`, `white` fill, 1px `rule-strong` border, `placeholder` colour for placeholders.
- Label above (`ui-label`, `ink-secondary`), help or error below (`ui-small`), 6px gaps.
- Focus: `carbon` border + `focus-ring`. Error: `danger` border and a message saying how to fix it.

### Checkbox, radio, toggle

- Checkbox 16px, `radius-xs`; checked = `carbon` fill with white tick. Radio: 8px `carbon` dot. Toggle 32 × 18px; on = `carbon`.
- The label is always clickable and sits 10px to the right.

### Badges

- 22px tall, 8px padding, `radius-xs`, 12/500.
- Done (`carbon-soft`/`carbon-text`), Live or new (`lime-soft`/`lime-text`), Needs review (`warning-soft`/`warning`), Failed (`danger-soft`/`danger`), Draft (`fog`/`lead`).

### Tabs and segmented controls

- **Tabs:** Pill segmented tabs on a `fog` track; active = white pill with 1px `rule`.
- **Segmented control:** `fog` track, 3px padding; active segment = `white` with 1px `rule`.

### Tables

- `white` panel, 1px `rule`, `radius-md`, horizontal scroll on narrow screens.
- Header 36px, `fog`, `ui-meta` labels in `lead`. Rows 44px, 1px `rule` between rows. Hover = `chalk`. Selected = `carbon-soft` with a 2px `carbon` left edge.
- IDs in `ui-meta`. Amounts right-aligned, tabular. Status as badges.

### Cards and KPIs

- `white`, 1px `rule`, `radius-md`, 20px padding, no shadow. KPI: `ui-meta` label, value in `ui-numeric`, delta in `ui-small`.
- Signature detail (Console frame) on one group per screen at most.

### Navigation

- Sidebar items: 30px, `radius-sm`, `ui-label`, 16px icon in `lead`.
- Active: `white` background + `ink` text + 1px `rule`, in a `fog` track.
- Breadcrumbs in `ui-meta` separated by " / ".

### Modals and side sheets

- Widths 440 / 600 / 800px; `white`, `radius-lg`, `shadow-modal`. Backdrop `ink` at 20%.
- Title in Bricolage Grotesque 24/30; footer buttons right-aligned, primary last. Escape closes; focus returns to the trigger.

### Toasts, banners, empty, loading and error states

- Toast: bottom-right, `white`, `radius-lg`, `shadow-pop`, one line + optional "Undo". No animation.
- Empty: centred, 20px icon in `lead`, `ui-heading`, one line of `ui-body`, one primary button.
- Loading: static `fog` skeleton blocks + a `ui-meta` "loading…" label. No spinners or shimmer.
- Error: danger banner with what failed and a "Try again" button.

### Data visualisation

- `chart-1` main series, `chart-2` comparison, `chart-3` other, `chart-highlight` for one value. Gridlines `rule`, axis labels `ui-meta`. No animation, no 3D, no gradients.

## 5. Patterns

- **Forms:** one column, max 560px. Labels above fields. Actions bottom-right, primary last.
- **List to detail:** clicking a row opens a side sheet for quick edits.
- **Destructive actions:** confirm in a modal that names the thing, with a danger button.
- **Settings:** left sub-nav (200px) + one form card per section.

## 6. No-motion rules

- Everything inside `.gp-app` has `transition: none; animation: none`.
- Hover, focus, open and close are instant. Progress is static text or a stepped bar.

## 7. Checklist for every screen

- [ ] `chalk` canvas, white panels, no dark areas
- [ ] One Bricolage Grotesque page title; all other text Figtree or mono
- [ ] One filled `carbon` button
- [ ] `lime` only as a small mark
- [ ] 14px body, 34px controls, 44px rows, 4px grid
- [ ] Lines, not shadows (shadows only on floating things)
- [ ] Focus visible on every control
- [ ] Status has a word, not just colour
- [ ] Nothing animates


---

# Part 3 · Website guideline

How the Graph Paper brand looks and moves on Sahil's website, landing pages and portfolio. Same palette and families as the platform, with bigger type, more air, and a defined motion system.

Light only: no dark bands, dark footers or dark cards.

---

## 1. Layout

- Max width 1200px, side padding 24px (16px on phones).
- 96px between sections (64px on phones); hero top spacing 128px (64px on phones).
- Text blocks max 60 characters wide.

## 2. Type scale

| Style | Size / line | Weight | Family | Use |
|---|---|---|---|---|
| `web-display` | 88 / 88 (48 / 50 on phones) | 700 | Bricolage Grotesque | Hero headline |
| `web-h1` | 56 / 60 (36 on phones) | 700 | Bricolage Grotesque | Section titles |
| `web-h2` | 40 / 46 (30 on phones) | 700 | Bricolage Grotesque | Sub-sections, contact |
| `web-h3` | 20 / 28 | 600 | Figtree | Card titles |
| `web-lead` | 19 / 30 | 400 | Figtree | Intro paragraphs |
| `web-body` | 17 / 28 | 400 | Figtree | Running text |
| `web-eyebrow` | 12 / 16 | 400 | DM Mono | Line above a headline |

- Accent: One word per headline with a lime highlighter bar.
- Eyebrow: DM Mono 12px `lead` in a white pill with 1px `rule`: `[● open to chat]`.

## 3. Page anatomy

### Navigation

- 64px, `chalk`. Left: wordmark. Centre: links in Figtree 14/500 `lead`. Right: "Sign in" ghost and a carbon pill "Get in touch".

### Hero

- A white console (radius 20px) inset on chalk. Left: headline, lead, carbon pill + white pill. Right: a grid of slot cells (a week of availability) with today highlighted in lime.

### Section header

- Small mono eyebrow, `web-h1` in Bricolage, description in `lead` underneath.

### Work cards

- White cells, `radius-md`, 1px `rule`, 20px padding, a mono meta line, Figtree 20/600 title. Hover: border turns `carbon`, a lime dot appears top-right.

### Notes / writing list

- Rows as cells: date pill in mono, title, arrow. Hover: lime bar under the title.

### Contact

- A white console with a slot picker ("Pick a time"), the email shown with Copy, and a carbon pill.

### Footer

- `chalk`, wordmark left, links centre, mono copyright right.

## 4. Motion system

The website has **one orchestrated moment per page** (the hero) plus small responses to the user. Nothing else moves.

### Tokens

| Token | Value | Use |
|---|---|---|
| `duration-fast` | 150ms | Hover colour changes |
| `duration-base` | 220ms | Menus, accordions |
| `duration-reveal` | 700ms | Section fade-up |
| `duration-hero` | 900ms | Hero layers |
| `stagger` | 40ms | Delay between headline parts |
| Easing | `cubic-bezier(.2, .7, 0, 1)` | All reveals |

### The hero sequence (in order)

| Time | What happens | Spec |
|---|---|---|
| 0ms | Console fades in | Opacity 0 → 1, scale .99 → 1, 600ms |
| 200ms | Slots fill | Cells fade from `fog` to `white`, 40ms apart, left to right, top to bottom |
| 900ms | Today lights up | The lime cell pops: scale .9 → 1, 300ms |
| 1000ms | Highlighter | The lime bar under the accent word grows from 0 to 100% width, 500ms |
| ~1500ms | Done | Headline and buttons visible from the first frame |

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
<header class="gpw-hero"><div>…<h1 class="gpw-display">Backend systems that <em>just</em> work.</h1>…</div><div class="gpw-slots"><span class="gp-slot" style="--i:0">09:00</span>…</div></header>
```

## 5. Checklist for every page

- [ ] Light only, no dark bands
- [ ] Headlines follow the accent rule (One word per headline with a lime highlighter bar)
- [ ] Eyebrow above key headlines
- [ ] Signature details only where Part 1 allows them
- [ ] One hero motion sequence; everything readable before it plays
- [ ] Hover responses at 150ms
- [ ] Reduced motion respected
- [ ] One primary button per section


---

# Part 4 · Code

Copy each block into its own file, exactly as written. Component classes use the `.gp-` prefix (platform) and `.gpw-` (website).

## tokens.css

```css
/* Graph Paper tokens · Sahil Shaikh. Light only: there is no dark theme. */
:root {
  color-scheme: light;
  --chalk: #f2f2f0;
  --white: #ffffff;
  --fog: #eaeae7;
  --rule: #e0e0dc;
  --rule-strong: #8b8b85;
  --ink: #111111;
  --ink-secondary: #2e2e2c;
  --lead: #5e5e59;
  --placeholder: #6e6e69;
  --carbon: #141414;
  --carbon-hover: #2e2e2c;
  --carbon-soft: #ecece9;
  --carbon-text: #141414;
  --on-carbon: #ffffff;
  --lime: #c8f03c;
  --lime-soft: #f3fcd9;
  --lime-text: #4a6100;
  --success: var(--carbon-text);
  --success-soft: var(--carbon-soft);
  --warning: #8a5a00;
  --warning-soft: #fff4dc;
  --danger: #b42318;
  --danger-soft: #fdeceb;
  --chart-1: #141414;
  --chart-2: #9c9c96;
  --chart-3: #cfcfca;
  --chart-highlight: #c8f03c;
  --shadow-pop: 0 4px 12px -2px #11111114, 0 2px 4px -2px #1111110f;
  --shadow-modal: 0 20px 48px -12px #1111112e, 0 4px 8px -4px #11111114;
  --focus-ring: 0 0 0 2px #ffffff, 0 0 0 4px #141414;
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
  --radius-xs: 6px;
  --radius-sm: 10px;
  --radius-md: 14px;
  --radius-lg: 20px;
  --radius-full: 9999px;
  --control-sm: 28px;
  --control-md: 34px;
  --control-lg: 40px;
  --row-height: 44px;
  --topbar-height: 56px;
  --sidebar-width: 232px;
  --content-max: 1200px;
  --site-max: 1200px;
  --mark-size: 8px;
  --icon-md: 16px;
  --icon-lg: 20px;
  --duration-fast: 150ms;
  --duration-base: 220ms;
  --duration-reveal: 700ms;
  --duration-hero: 900ms;
  --stagger: 40ms;
  --opacity-disabled: 0.45;
  --ease-reveal: cubic-bezier(.2, .7, 0, 1);
  --font-display: "Bricolage Grotesque", "Arial Rounded MT Bold", system-ui, sans-serif;
  --font-ui: Figtree, "Segoe UI", system-ui, sans-serif;
  --font-mono: "DM Mono", ui-monospace, Menlo, monospace;
}
.ui-page-title { font-family: var(--font-display); font-size: 32px; line-height: 36px; font-weight: 700; letter-spacing: -0.03em;  }
.ui-numeric { font-family: var(--font-display); font-size: 36px; line-height: 40px; font-weight: 700; letter-spacing: -0.03em; font-variant-numeric: tabular-nums;  }
.ui-heading { font-family: var(--font-ui); font-size: 16px; line-height: 24px; font-weight: 600; letter-spacing: -0.01em; }
.ui-subheading { font-family: var(--font-ui); font-size: 14px; line-height: 20px; font-weight: 600; }
.ui-body { font-family: var(--font-ui); font-size: 14px; line-height: 20px; font-weight: 400; }
.ui-body-lg { font-family: var(--font-ui); font-size: 16px; line-height: 24px; font-weight: 400; }
.ui-label { font-family: var(--font-ui); font-size: 13px; line-height: 18px; font-weight: 500; }
.ui-small { font-family: var(--font-ui); font-size: 12px; line-height: 16px; font-weight: 400; }
.ui-meta { font-family: var(--font-mono); font-size: 11px; line-height: 16px; font-weight: 400; }
.web-display { font-family: var(--font-display); font-size: 88px; line-height: 88px; font-weight: 700; letter-spacing: -0.03em;  }
.web-h1 { font-family: var(--font-display); font-size: 56px; line-height: 60px; font-weight: 700; letter-spacing: -0.03em;  }
.web-h2 { font-family: var(--font-display); font-size: 40px; line-height: 46px; font-weight: 700; letter-spacing: -0.03em;  }
.web-h3 { font-family: var(--font-ui); font-size: 20px; line-height: 28px; font-weight: 600; letter-spacing: -0.01em; }
.web-lead { font-family: var(--font-ui); font-size: 19px; line-height: 30px; font-weight: 400; }
.web-body { font-family: var(--font-ui); font-size: 17px; line-height: 28px; font-weight: 400; }
.web-eyebrow { font-family: var(--font-mono); font-size: 12px; line-height: 16px; font-weight: 400; }
/* Platform UI never animates: wrap the app in .gp-app */
.gp-app, .gp-app * { transition: none !important; animation: none !important; }
@media (max-width: 760px) { .web-display { font-size: 48px; line-height: 50px; } .web-h1 { font-size: 36px; line-height: 40px; } .web-h2 { font-size: 30px; line-height: 34px; } }
```

## components.css

```css
/* Graph Paper · components.css — reference styles for every component (.gp-* platform, shared by the website). Requires tokens.css. */
@import url("https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,700&family=Figtree:wght@400;500;600&family=DM+Mono:wght@400;500&display=swap");
/* Graph Paper components. .gp-* = platform UI (no motion). .gpw-* = website (motion allowed). */
body { margin: 0; font-family: var(--font-ui); font-size: 14px; line-height: 20px; color: var(--ink); background: var(--chalk); -webkit-font-smoothing: antialiased; }
.gp-pad { padding: var(--space-5); }
.gp-row { display: flex; flex-wrap: wrap; align-items: center; gap: var(--space-3); }
.gp-col { display: grid; gap: var(--space-4); }
.gp-grid { display: grid; gap: var(--space-4); grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); }
.gp-meta { font-family: var(--font-mono); font-size: 11px; line-height: 16px; color: var(--lead); }
.gp-eyebrow { display: inline-flex; align-items: center; gap: var(--space-2); font-family: var(--font-mono); font-size: 11px; line-height: 16px; color: var(--lead); }
.gp-num { font-variant-numeric: tabular-nums; }
.gp-app, .gp-app * { transition: none !important; animation: none !important; }
:where(.gp-btn, .gp-input, .gp-select, .gp-textarea, .gp-tab, .gp-seg button, .gp-nav a, .gp-check input, .gp-toggle input):focus-visible { outline: 2px solid transparent; box-shadow: var(--focus-ring); }


/* Buttons */
.gp-btn { font: inherit; font-size: 13px; line-height: 18px; font-weight: 500; height: var(--control-md); padding: 0 var(--space-3); display: inline-flex; align-items: center; justify-content: center; gap: 6px; border-radius: var(--radius-sm); border: 1px solid transparent; cursor: pointer; white-space: nowrap; text-decoration: none; background: transparent; color: var(--ink); }
.gp-btn svg { width: var(--icon-md); height: var(--icon-md); }
.gp-btn-sm { height: var(--control-sm); padding: 0 10px; font-size: 12px; }
.gp-btn-lg { height: var(--control-lg); padding: 0 var(--space-4); font-size: 14px; }
.gp-btn-primary { background: var(--carbon); color: var(--on-carbon); }
.gp-btn-primary:hover { background: var(--carbon-hover); }
.gp-btn-secondary { background: var(--white); border-color: var(--rule-strong); }
.gp-btn-secondary:hover { background: var(--fog); }
.gp-btn-ghost { color: var(--ink-secondary); }
.gp-btn-ghost:hover { background: var(--fog); color: var(--ink); }
.gp-btn-danger { background: var(--danger); color: #ffffff; }
.gp-btn[disabled] { opacity: var(--opacity-disabled); cursor: not-allowed; }
.gp-icon { fill: none; stroke: currentColor; stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; width: var(--icon-md); height: var(--icon-md); flex: none; }

/* Fields */
.gp-field { display: grid; gap: 6px; min-width: 0; }
.gp-label { font-size: 13px; line-height: 18px; font-weight: 500; color: var(--ink-secondary); }
.gp-input, .gp-select, .gp-textarea { font: inherit; font-size: 14px; width: 100%; box-sizing: border-box; height: var(--control-md); padding: 0 var(--space-3); border-radius: var(--radius-sm); border: 1px solid var(--rule-strong); background: var(--white); color: var(--ink); }
.gp-textarea { height: 88px; padding-block: 8px; resize: vertical; }
.gp-select { appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='none' stroke='%235e5e59' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m4 6 4 4 4-4'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 10px center; padding-right: 34px; }
.gp-input::placeholder, .gp-textarea::placeholder { color: var(--placeholder); }
.gp-input:focus, .gp-select:focus, .gp-textarea:focus, .gp-input.is-focus { outline: none; border-color: var(--carbon); box-shadow: var(--focus-ring); }
.gp-input.is-error { border-color: var(--danger); }
.gp-help { margin: 0; font-size: 12px; line-height: 16px; color: var(--lead); }
.gp-help.is-error { color: var(--danger); }
.gp-check { display: inline-flex; align-items: center; gap: 10px; font-size: 14px; color: var(--ink-secondary); cursor: pointer; }
.gp-check input { appearance: none; margin: 0; width: 16px; height: 16px; border: 1px solid var(--rule-strong); border-radius: var(--radius-xs); background: var(--white); display: grid; place-items: center; cursor: pointer; }
.gp-check input:checked { background: var(--carbon); border-color: var(--carbon); }
.gp-check input:checked::after { content: ""; width: 4px; height: 8px; border: solid #ffffff; border-width: 0 2px 2px 0; transform: translateY(-1px) rotate(45deg); }
.gp-check input[type="radio"] { border-radius: 50%; }
.gp-check input[type="radio"]:checked { background: var(--white); border-color: var(--carbon); }
.gp-check input[type="radio"]:checked::after { width: 8px; height: 8px; border: 0; border-radius: 50%; background: var(--carbon); transform: none; }
.gp-toggle { display: inline-flex; align-items: center; gap: 10px; font-size: 14px; color: var(--ink-secondary); cursor: pointer; }
.gp-toggle input { appearance: none; margin: 0; width: 32px; height: 18px; border-radius: var(--radius-full); background: var(--rule-strong); position: relative; cursor: pointer; }
.gp-toggle input::after { content: ""; position: absolute; top: 2px; left: 2px; width: 14px; height: 14px; border-radius: 50%; background: #ffffff; }
.gp-toggle input:checked { background: var(--carbon); }
.gp-toggle input:checked::after { left: 16px; }

/* Badges */
.gp-badge { display: inline-flex; align-items: center; gap: 6px; height: 22px; padding: 0 var(--space-2); border-radius: var(--radius-xs); font-size: 12px; line-height: 16px; font-weight: 500; background: var(--fog); color: var(--lead); white-space: nowrap; }
.gp-badge.dot::before { content: ""; width: 6px; height: 6px; background: currentColor; }
.gp-badge-done { background: var(--success-soft); color: var(--success); }
.gp-badge-live { background: var(--lime-soft); color: var(--lime-text); }
.gp-badge-warn { background: var(--warning-soft); color: var(--warning); }
.gp-badge-fail { background: var(--danger-soft); color: var(--danger); }
.gp-badge-mono { font-family: var(--font-mono); font-size: 11px; font-weight: 400; background: var(--white); border: 1px solid var(--rule); color: var(--ink-secondary); }

/* Tabs and segmented */
.gp-tabs { display: flex; gap: var(--space-5); border-bottom: 1px solid var(--rule); }
.gp-tab { font: inherit; background: none; border: 0; padding: 0; height: 36px; font-family: var(--font-mono); font-size: 11px; color: var(--lead); border-bottom: 2px solid transparent; margin-bottom: -1px; cursor: pointer; }
.gp-tab:hover { color: var(--ink); }
.gp-tab[aria-selected="true"] { color: var(--ink); border-bottom-color: var(--ink); }
.gp-seg { display: inline-flex; gap: 2px; padding: 3px; background: var(--fog); border-radius: var(--radius-sm); }
.gp-seg button { font: inherit; font-size: 13px; font-weight: 500; border: 1px solid transparent; background: none; color: var(--lead); height: 28px; padding: 0 12px; border-radius: 4px; cursor: pointer; }
.gp-seg button[aria-pressed="true"] { background: var(--white); color: var(--ink); border-color: var(--rule); }

/* Cards and KPIs */
.gp-card { background: var(--white); border: 1px solid var(--rule); border-radius: var(--radius-md); padding: var(--space-5); min-width: 0; }
.gp-card-head { display: flex; justify-content: space-between; align-items: center; gap: var(--space-3); margin-bottom: var(--space-4); }
.gp-card-title { margin: 0; font-size: 16px; line-height: 24px; font-weight: 600; letter-spacing: -.01em; }
.gp-kpi-value { font-family: var(--font-display); font-size: 36px; line-height: 40px; font-weight: 700; letter-spacing: -0.03em; font-variant-numeric: tabular-nums; margin-top: var(--space-2); }
.gp-delta { font-size: 12px; line-height: 16px; font-weight: 500; color: var(--success); margin-top: var(--space-1); }
.gp-delta.warn { color: var(--warning); } .gp-delta.down { color: var(--danger); }

/* Table */
.gp-table-wrap { background: var(--white); border: 1px solid var(--rule); border-radius: var(--radius-md); overflow-x: auto; }
.gp-table { width: 100%; border-collapse: collapse; font-size: 14px; }
.gp-table th { height: 36px; padding: 0 var(--space-3); text-align: left; background: var(--fog); border-bottom: 1px solid var(--rule); font-family: var(--font-mono); font-size: 11px; font-weight: 400; color: var(--lead); white-space: nowrap; }
.gp-table td { height: var(--row-height); padding: 0 var(--space-3); border-bottom: 1px solid var(--rule); color: var(--ink-secondary); white-space: nowrap; }
.gp-table tbody tr:last-child td { border-bottom: 0; }
.gp-table tbody tr { cursor: pointer; }
.gp-table tbody tr:hover td { background: var(--chalk); }
.gp-table tbody tr[aria-selected="true"] td { background: var(--carbon-soft); }
.gp-table tbody tr[aria-selected="true"] td:first-child { box-shadow: inset 2px 0 0 var(--carbon); }
.gp-table .r { text-align: right; font-variant-numeric: tabular-nums; }
.gp-table .strong { color: var(--ink); font-weight: 500; }
.gp-table .id { font-family: var(--font-mono); font-size: 11px; color: var(--lead); }
.gp-table-foot { display: flex; justify-content: space-between; gap: var(--space-3); padding: 10px var(--space-3); border-top: 1px solid var(--rule); font-size: 12px; color: var(--lead); }

/* App shell */
.gp-app { display: grid; grid-template-columns: var(--sidebar-width) minmax(0, 1fr); min-height: 640px; background: var(--white); font-size: 14px; }
.gp-side { background: var(--chalk); border-right: 1px solid var(--rule); padding: var(--space-4) 10px; display: flex; flex-direction: column; gap: var(--space-5); }
.gp-brand { display: flex; align-items: center; gap: var(--space-2); padding: 0 6px; font-family: var(--font-display); font-size: 20px; line-height: 24px; color: var(--ink); }
.gp-nav { display: grid; gap: 2px; }
.gp-nav .gp-meta { padding: 0 8px 6px; }
.gp-nav a { display: flex; align-items: center; gap: 10px; height: 30px; padding: 0 8px; border-radius: var(--radius-sm); font-size: 13px; font-weight: 500; color: var(--ink-secondary); text-decoration: none; cursor: pointer; }
.gp-nav a .gp-icon { color: var(--lead); }
.gp-nav a:hover { background: var(--white); color: var(--ink); }
.gp-nav a[aria-current="page"] { background: var(--carbon-soft); color: var(--carbon-text); }
.gp-nav a[aria-current="page"] .gp-icon { color: var(--carbon-text); }
.gp-nav .count { margin-left: auto; font-family: var(--font-mono); font-size: 10px; color: var(--lead); }
.gp-main { min-width: 0; display: flex; flex-direction: column; }
.gp-top { height: var(--topbar-height); border-bottom: 1px solid var(--rule); display: flex; align-items: center; gap: var(--space-3); padding: 0 var(--space-6); }
.gp-top .gp-input { max-width: 320px; }
.gp-top .right { margin-left: auto; display: flex; gap: var(--space-2); align-items: center; }
.gp-avatar { width: 30px; height: 30px; border-radius: 50%; background: var(--chalk); border: 1px solid var(--rule); display: grid; place-items: center; font-size: 11px; font-weight: 600; color: var(--ink-secondary); }
.gp-page { padding: var(--space-6); display: grid; gap: var(--space-6); max-width: var(--content-max); }
.gp-page-head { display: flex; justify-content: space-between; align-items: flex-end; gap: var(--space-4); flex-wrap: wrap; }
.gp-page-title { margin: 2px 0 0; font-family: var(--font-display); font-size: 32px; line-height: 36px; font-weight: 700; letter-spacing: -0.03em; }
.gp-page-sub { margin: var(--space-1) 0 0; color: var(--lead); }

/* Modal, toast, banner, empty */
.gp-backdrop { background: rgba(17, 17, 17, .2); padding: var(--space-6); display: grid; place-items: center; }
.gp-modal { width: 100%; max-width: 440px; background: var(--white); border: 1px solid var(--rule); border-radius: var(--radius-lg); box-shadow: var(--shadow-modal); }
.gp-modal-head { display: flex; justify-content: space-between; gap: var(--space-3); padding: var(--space-5) var(--space-5) 0; }
.gp-modal-title { margin: 0; font-family: var(--font-display); font-size: 24px; line-height: 30px; font-weight: 700; }
.gp-modal-body { padding: var(--space-5); display: grid; gap: var(--space-4); }
.gp-modal-foot { display: flex; justify-content: flex-end; gap: var(--space-2); padding: var(--space-4) var(--space-5); border-top: 1px solid var(--rule); }
.gp-toast { display: inline-flex; align-items: center; gap: var(--space-3); padding: 12px var(--space-4); background: var(--white); border: 1px solid var(--rule); border-radius: var(--radius-lg); box-shadow: var(--shadow-pop); font-weight: 500; }
.gp-toast .gp-icon { color: var(--carbon); }
.gp-banner { display: flex; align-items: center; gap: var(--space-3); padding: 12px var(--space-4); border-radius: var(--radius-md); font-size: 14px; }
.gp-banner .grow { flex: 1; }
.gp-banner-warn { background: var(--warning-soft); color: var(--warning); }
.gp-banner-fail { background: var(--danger-soft); color: var(--danger); }
.gp-banner-info { background: var(--carbon-soft); color: var(--carbon-text); }
.gp-empty { position: relative; overflow: hidden; text-align: center; padding: var(--space-12) var(--space-6); background: var(--white); border: 1px solid var(--rule); border-radius: var(--radius-md); }
.gp-empty > * { position: relative; }
.gp-empty .gp-icon { width: 20px; height: 20px; color: var(--lead); }
.gp-empty h3 { margin: var(--space-3) 0 var(--space-1); font-size: 16px; line-height: 24px; font-weight: 600; }
.gp-empty p { margin: 0 auto var(--space-4); max-width: 40ch; color: var(--lead); }
.gp-skel { background: var(--fog); border-radius: 4px; height: 12px; }

/* Signature details */
.gp-mark { display: inline-block; width: 7px; height: 7px; background: var(--lime); flex: none; }
.gp-eyebrow::before { content: ""; width: 6px; height: 6px; border-radius: 50%; background: var(--lime); box-shadow: 0 0 0 1px var(--lime-text); }
.gp-accent { background: linear-gradient(transparent 58%, var(--lime) 58%, var(--lime) 92%, transparent 92%); padding: 0 .08em; }
.gp-empty::before { content: ""; position: absolute; inset: 0; background-image: linear-gradient(var(--rule) 1px, transparent 1px), linear-gradient(90deg, var(--rule) 1px, transparent 1px); background-size: 8px 8px; opacity: .6; -webkit-mask-image: radial-gradient(circle, #000, transparent 70%); mask-image: radial-gradient(circle, #000, transparent 70%); }
/* Console frame and slot cells (signature) */
.gp-console { background: var(--white); border: 1px solid var(--rule); border-radius: var(--radius-lg); }
.gp-slot { height: 40px; border-radius: var(--radius-xs); background: var(--fog); border: 1px solid transparent; display: grid; place-items: center; font-family: var(--font-mono); font-size: 12px; color: var(--ink-secondary); position: relative; }
.gp-slot[aria-selected="true"] { background: var(--white); border-color: var(--carbon); }
.gp-slot[aria-selected="true"]::after { content: ""; position: absolute; top: 4px; right: 4px; width: 6px; height: 6px; border-radius: 50%; background: var(--lime); }
```

## motion.css (website only)

```css
/* Graph Paper · motion.css — WEBSITE ONLY. Never load inside the platform UI. Requires tokens.css. */
/* ---------------- Website ---------------- */
.fw { font-size: 17px; line-height: 28px; background: var(--chalk); }
.gpw-wrap { max-width: var(--site-max); margin: 0 auto; padding: 0 var(--space-6); }
.gpw-nav { display: flex; align-items: center; justify-content: space-between; height: 72px; }
.gpw-logo { display: flex; align-items: center; gap: var(--space-2); font-family: var(--font-display); font-size: 22px; line-height: 28px; color: var(--ink); text-decoration: none; }
.gpw-links { display: flex; align-items: center; gap: var(--space-6); font-size: 14px; font-weight: 500; color: var(--lead); }
.gpw-links a { color: inherit; text-decoration: none; transition: color 150ms ease-out; }
.gpw-links a:hover { color: var(--ink); }
.gpw-links a[aria-current="page"] { color: var(--ink); text-decoration: underline; text-underline-offset: 6px; text-decoration-thickness: 1px; }
.fw .gp-btn { transition: background-color 150ms ease-out; }
.fw .gp-btn .arr { display: inline-block; transition: transform 150ms ease-out; }
.fw .gp-btn:hover .arr, .gpw-card:hover .arr { transform: translateX(3px); }
.gpw-display { margin: 0; font-family: var(--font-display); font-weight: 700; font-size: 88px; line-height: 84px; letter-spacing: -0.03em; max-width: 13ch; color: var(--ink); }
.gpw-display .w { display: inline-block; }
.gpw-lead { margin: var(--space-5) 0 var(--space-8); max-width: 44ch; font-size: 19px; line-height: 30px; color: var(--lead); }
.gpw-cta { display: flex; gap: var(--space-3); flex-wrap: wrap; }
.gpw-sec-head { display: flex; justify-content: space-between; align-items: flex-end; gap: var(--space-4); flex-wrap: wrap; margin-bottom: var(--space-8); }
.gpw-h1 { margin: var(--space-3) 0 0; font-family: var(--font-display); font-weight: 700; font-size: 56px; line-height: 58px; letter-spacing: -0.03em; }
.gpw-h2 { margin: 0; font-family: var(--font-display); font-weight: 700; font-size: 40px; line-height: 44px; letter-spacing: -0.03em; }
.gpw-cards { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: var(--space-6); }
.gpw-card { display: flex; flex-direction: column; gap: var(--space-2); padding: var(--space-6); background: var(--white); border: 1px solid var(--rule); border-radius: var(--radius-md); text-decoration: none; color: var(--ink); min-width: 0; }
.gpw-shot { aspect-ratio: 16/10; border-radius: var(--radius-sm); background: var(--chalk); border: 1px solid var(--rule); margin-bottom: var(--space-3); padding: 12px; display: grid; gap: 8px; align-content: start; }
.gpw-shot span { height: 8px; border-radius: 4px; background: var(--fog); }
.gpw-card h3 { margin: 0; font-size: 20px; line-height: 28px; font-weight: 600; letter-spacing: -.01em; display: flex; justify-content: space-between; transition: color 150ms ease-out; }
.gpw-card:hover h3 { color: var(--carbon); }
.gpw-card p { margin: 0; font-size: 15px; line-height: 24px; color: var(--lead); }
.gpw-card .tags { display: flex; gap: var(--space-2); flex-wrap: wrap; margin-top: var(--space-3); }
.gpw-notes { display: grid; }
.gpw-note { display: grid; grid-template-columns: 120px minmax(0, 1fr); gap: var(--space-4); padding: var(--space-5) 0; border-bottom: 1px solid var(--rule); text-decoration: none; color: var(--ink); }
.gpw-note b { display: block; font-family: var(--font-display); font-weight: 700; font-size: 24px; line-height: 30px; transition: color 150ms ease-out; }
.gpw-note:hover b { color: var(--carbon); }
.gpw-note span { color: var(--lead); font-size: 15px; }
@media (max-width: 760px) {
  .gpw-display { font-size: 48px; line-height: 48px; } .gpw-h1 { font-size: 36px; line-height: 40px; } .gpw-h2 { font-size: 30px; line-height: 34px; }
  .gpw-cards { grid-template-columns: 1fr; } .gpw-links { display: none; } .gpw-hero { padding: var(--space-5) var(--space-5) var(--space-10); }
  .gpw-note { grid-template-columns: 1fr; gap: var(--space-1); }
  .gp-app { grid-template-columns: 1fr; } .gp-side { display: none; }
}

/* Accent word */
.gpw-display em, .gpw-h1 em, .gpw-h2 em { font-style: normal; background: linear-gradient(transparent 58%, var(--lime) 58%, var(--lime) 92%, transparent 92%); padding: 0 .06em; }

/* Hero (signature) */
.gpw-hero { margin: var(--space-2); background: var(--white); border: 1px solid var(--rule); border-radius: var(--radius-lg); padding: var(--space-12); display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: var(--space-10); }
.gpw-slots { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 6px; }
.gpw-slots .gp-slot { background: var(--fog); }
@media (max-width: 760px) { .gpw-hero { grid-template-columns: 1fr; padding: var(--space-6); } }

@media (prefers-reduced-motion: no-preference) {
  .gpw-play { animation: gpw-in 600ms var(--ease-reveal) both; }
  @keyframes gpw-in { from { opacity: 0; transform: scale(.99); } to { opacity: 1; transform: none; } }
  .gpw-play .gpw-slots .gp-slot { animation: gpw-fill 300ms ease-out both; animation-delay: calc(200ms + var(--i) * 40ms); }
  @keyframes gpw-fill { from { background: var(--fog); } to { background: var(--white); } }
  .gpw-play .gp-slot[aria-selected="true"] { animation: gpw-pop 300ms var(--ease-reveal) 900ms both; }
  @keyframes gpw-pop { from { transform: scale(.9); } to { transform: none; } }
  .gpw-play .gpw-display em { background-size: 0% 100%; background-repeat: no-repeat; animation: gpw-hl 500ms ease-out 1000ms both; }
  @keyframes gpw-hl { to { background-size: 100% 100%; } }
  .gpw-fade.gpw-in { animation: gpw-up var(--duration-reveal) var(--ease-reveal) both; }
  @keyframes gpw-up { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }
}

/* Usage
   1. Hero markup: <header class="gpw-hero"><div>…<h1 class="gpw-display">Backend systems that <em>just</em> work.</h1>…</div><div class="gpw-slots"><span class="gp-slot" style="--i:0">09:00</span>…</div></header>
   2. Split the headline into <span class="w" style="--i:N"> words (or lines), then add .gpw-play to the hero once it is in view.
   3. Section titles: add .gpw-fade; add .gpw-in when they first enter the viewport.
   Everything is visible before and without the script; prefers-reduced-motion turns all of it off. */
```

## tailwind-theme.css (only if the project uses Tailwind v4)

```css
@import "tailwindcss";
/* Graph Paper · Tailwind v4 theme. Load tokens.css first. Light only. */
@theme inline {
  --color-chalk: var(--chalk);
  --color-white: var(--white);
  --color-fog: var(--fog);
  --color-rule: var(--rule);
  --color-rule-strong: var(--rule-strong);
  --color-ink: var(--ink);
  --color-ink-secondary: var(--ink-secondary);
  --color-lead: var(--lead);
  --color-placeholder: var(--placeholder);
  --color-carbon: var(--carbon);
  --color-carbon-hover: var(--carbon-hover);
  --color-carbon-soft: var(--carbon-soft);
  --color-carbon-text: var(--carbon-text);
  --color-on-carbon: var(--on-carbon);
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

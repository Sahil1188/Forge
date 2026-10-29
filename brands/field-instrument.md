# FIELD-INSTRUMENT.md · Sahil Shaikh brand (all-in-one)

**For Claude Code:** this single file contains the whole Field Instrument system: brand rules, platform UI rules (no animation), website rules (with motion), and the complete CSS. Put it in the project root and add this line to `CLAUDE.md`:

```
All UI follows FIELD-INSTRUMENT.md. Before writing UI, create tokens.css, components.css (and motion.css for website pages) from Part 4 if they don't exist, then use only their variables and classes. Light only, never dark. Platform UI has no animation.
```

## How Claude Code should use this file

1. Decide the surface: **Platform UI** (app, dashboard, admin, settings) or **Website** (marketing, portfolio, landing). If unclear, assume Platform UI.
2. If `tokens.css` and `components.css` don't exist in the project, create them by copying the code blocks in Part 4 exactly. For website pages also create `motion.css`. With Tailwind v4 also create `tailwind-theme.css`.
3. Load the Google Fonts in Part 1, section 5.
4. Never hard-code colours, font sizes or fonts. Never add dark mode or dark sections.
5. Platform UI: wrap the app in `class="fi-app"` (kills all motion). Website: follow Part 3, section 4.
6. Finish by running the checklist at the end of Part 2 or Part 3.

---

Sahil Shaikh's brand and design system, **Field Instrument**. Part 1 is the brand foundations, Part 2 the platform UI rules (no animation), Part 3 the website rules (with motion), Part 4 the code.

*Researched from: Teenage Engineering, Braun product design, lab equipment panels. Inspired by, not copied from: no logos, fonts or assets of those products are used.*

---

# Part 1 · Brand foundations

The brand of Sahil Shaikh, Full Stack AI Engineer. **Field Instrument**: a precision instrument panel: brushed aluminium, white modules, thin engraved labels, one safety-orange control. It covers every platform Sahil designs and his website.

This system has three parts:

1. **Brand foundations** (Part 1): idea, logo, colour, type, layout, shape, icons, imagery, voice and accessibility.
2. **Platform UI** (Part 2): rules for any app, dashboard or tool. **No animation.**
3. **Website** (Part 3): the same brand with larger type and a defined motion system.

Light only. There is no dark theme, and no dark sections, panels or backgrounds anywhere.

---

## 1. The idea

| | |
|---|---|
| **Metaphor** | A precision instrument panel: brushed aluminium, white modules, thin engraved labels, one safety-orange control. |
| **Personality** | Engineered, playful in the details, unmistakably technical. |
| **Feeling we want** | "Every detail was designed on purpose." |
| **Three ingredients** | **Modules** (numbered white panels with small screws) · **Engraving** (Azeret Mono labels, thin line icons) · **Safety orange** (one control colour) and a green LED for live |

## 2. Principles

1. **Aluminium ground, white modules.** The page is `aluminium`; every working area is a numbered `white` module.
2. **Number everything.** Modules carry a mono index (`01`, `02`) and a short label, like a hardware panel.
3. **Orange is the control.** Safety orange marks the main action and the active state. Nothing else is warm.
4. **LED for live.** A small green LED dot means running or online.
5. **Condensed display, mono labels.** Archivo condensed 600 for titles; Azeret Mono for labels and values.
6. **Still product; the website powers on.** LEDs light in sequence and a dial sweeps, once.
7. **Accessible always.** Text 4.5:1 or better, borders and indicators 3:1, focus always visible.

## 3. Logo

- **Wordmark:** "sahil/shaikh" in Azeret Mono 500 lowercase, `ink`, with a 6px safety-orange square before it.
- **Product mark:** the orange square + `01` + product name in Azeret Mono.
- **App icon / avatar:** a white module, 4px radius, 1px `rule`, four 3px screw dots in the corners, an orange square in the centre.
- **Clear space:** one module grid unit (8px) × 2. **Minimum size:** wordmark 88px; icon 20px.
- **Never:** use orange for text, set the wordmark in caps, place it on dark aluminium photography.

## 4. Colour

### Core palette

| Token | Hex | Role |
|---|---|---|
| `aluminium` | #EDEDEA | Page ground, sidebar, website background |
| `white` | #FFFFFF | Cards, tables, inputs, modals |
| `brushed` | #E4E4E0 | Table headers, inset wells, hover |
| `rule` | #D9D9D4 | Dividers and borders |
| `rule-strong` | #85857F | Input borders, strong dividers |
| `ink` | #0E0E0D | Headings, primary text |
| `ink-secondary` | #2C2C2A | Labels, nav, table text |
| `gunmetal` | #5A5A56 | Labels, secondary text, engraving |
| `placeholder` | #62625E | Placeholders, disabled text |
| `safety` | #C93A00 | Primary action, active state, focus, dials |
| `safety-hover` | #A83000 | Hover/pressed safety |
| `safety-soft` / `safety-text` | #FCE8DE / #9E2E00 | Selected, active, success |
| `led` | #1FA44E | LED: live, running, online |
| `led-soft` / `led-text` | #E3F5E9 / #13703A | Soft led badges |
| `warning` / `warning-soft` | #8A5A00 / #FFF4DC | Needs attention |
| `danger` / `danger-soft` | #B42318 / #FDECEB | Errors, destructive |

### Charts

`chart-1` safety #C93A00, `chart-2` #8E8E88, `chart-3` #C5C5BF, and `chart-highlight` led #1FA44E for the one value that matters. Gridlines use `rule`, axis labels use `ui-meta` in `gunmetal`.

### Proportions

About 55% aluminium, 34% white, 9% type and lines, 1.5% orange, 0.5% LED.

### Rules

- Safety orange is the only action colour. One orange control per view.
- Orange is never body text; links are `ink` with an underline.
- The LED green is only a dot. Status still has a word.
- No gradients except a subtle brushed texture on the website ground.
- Never use `ink` as a background.

## 5. Typography

Three roles, all free on Google Fonts:

`https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,400;62..125,500;62..125,600&family=Azeret+Mono:wght@400;500&display=swap`

| Family | Role | Use | Weights |
|---|---|---|---|
| **Archivo (condensed, wdth 75)** | **The voice** | Page titles, numbers, website headlines | 600 |
| **Archivo (normal width)** | **The clarity** | All UI and body text | 400, 500, 600 |
| **Azeret Mono** | **The precision** | Module indexes, labels, values, column headers | 400, 500 |

- **Accent word:** none. Instead, headlines may carry a mono index before them (`01 —`).
- Labels are lowercase Azeret Mono 11px with a leading index: `02 · throughput`.
- Values in Azeret Mono with units in `gunmetal`: `148 ms`.
- Sentence case; never ALL CAPS.
- Full scales are in Part 2 (platform) and Part 3 (website).

## 6. Layout and spacing

- **4px grid:** 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 96, 128.
- **Platform:** sidebar on `aluminium`, content on `white`, 24px page padding, max 1200px.
- **Website:** 1200px max width, 96px between sections.
- Align to a left edge in the product. Centre only short single lines (an empty state).

## 7. Shape and depth

| Token | Value | Use |
|---|---|---|
| `radius-xs` | 2px | Badges, checkboxes |
| `radius-sm` | 3px | Buttons, inputs |
| `radius-md` | 4px | Modules, tables, menus |
| `radius-lg` | 6px | Modals, website panels |
| `radius-full` | 9999px | LEDs, dials, toggles |

- **Screws** (signature): feature modules show four 3px `rule-strong` dots, inset 6px in each corner. One group per screen.
- **Module index** (signature): every card starts with a mono index and label row, separated by a 1px `rule`.
- **Dial** (website and empty states): a 1px circle with tick marks and an orange needle.
- Shadows only on menus and modals; modules are flat.

## 8. Iconography

- Thin line icons (Lucide at 1.25px), 16px, `gunmetal` default, `ink` active. Never filled.
- Icon-only buttons always have an accessible label.

## 9. Imagery

- Screenshots set into a white module with screws, like a display in a panel.
- Diagrams as schematics: 1px lines, right angles, orange for the signal path, mono labels.
- Portrait: even studio light on a light grey background.

## 10. Voice and writing

- Terse and technical, like labels on equipment: "Deploy", "Logs", "Latency · p95".
- Lead with what something does: "Agents plan, build and review work together."
- Buttons are verbs: "New project", "Save changes". Confirmations say what happened: "Project created."
- Errors say what went wrong and how to fix it: "Name is required. Add a project name to continue."
- Numbers: "AED 1,250.00", dates "21 Oct 2026", times "14:32".
- No buzzwords, no exclamation marks, no emoji in UI.

## 11. Accessibility

- Every text colour pair passes WCAG AA (4.5:1). Borders, focus rings and indicators pass 3:1.
- Focus ring: 2px white gap + 2px `safety`, on every interactive element.
- Never rely on colour alone; pair it with a word, icon or position.
- Hit targets at least 28px (34px default).
- The website respects `prefers-reduced-motion`: all motion off, content visible immediately.

Measured contrast for this palette:

| Pair | Ratio | Needed |
|---|---|---|
| Body text `ink` on `white` | 19.31:1 | 4.5:1 |
| `gunmetal` on `aluminium` | 5.91:1 | 4.5:1 |
| `gunmetal` on `brushed` | 5.43:1 | 4.5:1 |
| White on `safety` (primary button) | 5.14:1 | 4.5:1 |
| `safety` links on `white` | 5.14:1 | 4.5:1 |
| `safety-text` on `safety-soft` | 6.24:1 | 4.5:1 |
| `led-text` on `led-soft` | 5.43:1 | 4.5:1 |
| `placeholder` on `white` | 6.13:1 | 4.5:1 |
| `rule-strong` borders on `white` | 3.71:1 | 3:1 |
| `ink` on `led` (mark used as a fill) | 5.96:1 | 4.5:1 |

## 12. Do and don't

| Do | Don't |
|---|---|
| Aluminium ground, white modules | Dark backgrounds or dark mode |
| Numbered modules | Unlabelled boxes |
| One orange control | Orange text or several orange buttons |
| LED dot for live | Green text for status |
| Mono labels and values | Mono for paragraphs |
| Screws on one module group | Screws on everything |
| Thin line icons | Filled or coloured icons |
| Power-on sequence on the website | Animation in the platform |


---

# Part 2 · Platform UI guideline

Rules for any platform, app, dashboard, admin or internal tool built in the Field Instrument brand. It is generic: it works for projects, CRM, analytics, payments, AI agents or anything else.

**The platform never animates.** State changes are instant. Every rule here assumes light only.

---

## 1. Foundations for the platform

- **Ground:** `aluminium` for the app canvas and sidebar. `white` for every working panel (cards, tables, forms, modals).
- **Text:** `ink` for headings and values, `ink-secondary` for labels and nav, `gunmetal` for help text and metadata.
- **Action colour:** `safety`. **Mark:** `led` (small).
- **Density:** 14px text, 34px controls, 44px rows, 4px grid.

## 2. Type scale

| Style | Size / line | Weight | Family | Use |
|---|---|---|---|---|
| `ui-page-title` | 32 / 36 | 600 | Archivo | Page title, one per screen |
| `ui-numeric` | 36 / 40 | 600 | Archivo | KPI values, big totals |
| `ui-heading` | 16 / 24 | 600 | Archivo | Card, section, modal headings |
| `ui-subheading` | 14 / 20 | 600 | Archivo | Form group titles |
| `ui-body` | **14 / 20** | 400 | Archivo | **Default text** |
| `ui-body-lg` | 16 / 24 | 400 | Archivo | Empty states, onboarding |
| `ui-label` | 13 / 18 | 500 | Archivo | Labels, nav items, buttons |
| `ui-small` | 12 / 16 | 400 | Archivo | Help text, captions |
| `ui-meta` | 11 / 16 | 400 | Azeret Mono | IDs, timestamps, column headers |

Rules:

- Archivo only for `ui-page-title`, `ui-numeric` and modal titles. Never in buttons, tables, forms, nav or badges.
- Numbers in tables use `font-variant-numeric: tabular-nums` and align right.
- Never below 11px (mono) or 12px (UI).

## 3. App layout

- **Sidebar:** 232px (60px collapsed), `aluminium`, 1px `rule` right border, 16px top padding. Product mark at top. Groups titled with `ui-meta`.
- **Top bar:** 56px, `white`, 1px `rule` bottom border. Search left (320px max), actions right.
- **Page header:** breadcrumb in `ui-meta`, then `ui-page-title`, optional one-line description in `gunmetal`. Actions on the right, aligned to the title's baseline.
- **Content:** 24px padding, max width 1200px, 24px gap between blocks, 32px between page sections.
- **Breakpoints:** 640, 768, 1024, 1280. Below 1024 the sidebar becomes a drawer.

## 4. Components

### Buttons

| Variant | Look | Use |
|---|---|---|
| Primary | `safety` fill, `on-safety` text | The one main action per view |
| Secondary | `white` fill, 1px `rule-strong` border, `ink` text | Every other action |
| Ghost | No fill or border, `ink-secondary` text | Toolbars, cancel, low emphasis |
| Danger | `danger` fill, white text | Destructive confirmations only |

- Sizes: 28px (sm), **34px (default)**, 40px (lg). `radius-sm`. `ui-label` 13/500.
- States: hover = instant background change (`safety-hover`, `brushed`); focus = `focus-ring`; disabled = `opacity-disabled`.
- Labels are verbs in sentence case: "New project", "Export CSV".

### Text inputs, selects, textareas

- 34px tall, 12px horizontal padding, `radius-sm`, `white` fill, 1px `rule-strong` border, `placeholder` colour for placeholders.
- Label above (`ui-label`, `ink-secondary`), help or error below (`ui-small`), 6px gaps.
- Focus: `safety` border + `focus-ring`. Error: `danger` border and a message saying how to fix it.

### Checkbox, radio, toggle

- Checkbox 16px, `radius-xs`; checked = `safety` fill with white tick. Radio: 8px `safety` dot. Toggle 32 × 18px; on = `safety`.
- The label is always clickable and sits 10px to the right.

### Badges

- 22px tall, 8px padding, `radius-xs`, 12/500.
- Done (`led-soft`/`led-text`), Live or new (`led-soft`/`led-text`), Needs review (`warning-soft`/`warning`), Failed (`danger-soft`/`danger`), Draft (`brushed`/`gunmetal`).

### Tabs and segmented controls

- **Tabs:** Azeret Mono 11/500 lowercase with index (`01 overview`), 36px. Active = `ink` + 2px `safety` underline.
- **Segmented control:** `brushed` track, 3px padding; active segment = `white` with 1px `rule`.

### Tables

- `white` panel, 1px `rule`, `radius-md`, horizontal scroll on narrow screens.
- Header 36px, `brushed`, `ui-meta` labels in `gunmetal`. Rows 44px, 1px `rule` between rows. Hover = `aluminium`. Selected = `safety-soft` with a 2px `safety` left edge.
- IDs in `ui-meta`. Amounts right-aligned, tabular. Status as badges.

### Cards and KPIs

- `white`, 1px `rule`, `radius-md`, 20px padding, no shadow. KPI: `ui-meta` label, value in `ui-numeric`, delta in `ui-small`.
- Signature detail (Screws) on one group per screen at most.

### Navigation

- Sidebar items: 30px, `radius-sm`, `ui-label`, 16px icon in `gunmetal`.
- Active: `white` background, 1px `rule`, a 2px `safety` left edge.
- Breadcrumbs in `ui-meta` separated by " / ".

### Modals and side sheets

- Widths 440 / 600 / 800px; `white`, `radius-lg`, `shadow-modal`. Backdrop `ink` at 20%.
- Title in Archivo 24/30; footer buttons right-aligned, primary last. Escape closes; focus returns to the trigger.

### Toasts, banners, empty, loading and error states

- Toast: bottom-right, `white`, `radius-lg`, `shadow-pop`, one line + optional "Undo". No animation.
- Empty: centred, 20px icon in `gunmetal`, `ui-heading`, one line of `ui-body`, one primary button.
- Loading: static `brushed` skeleton blocks + a `ui-meta` "loading…" label. No spinners or shimmer.
- Error: danger banner with what failed and a "Try again" button.

### Data visualisation

- `chart-1` main series, `chart-2` comparison, `chart-3` other, `chart-highlight` for one value. Gridlines `rule`, axis labels `ui-meta`. No animation, no 3D, no gradients.

## 5. Patterns

- **Forms:** one column, max 560px. Labels above fields. Actions bottom-right, primary last.
- **List to detail:** clicking a row opens a side sheet for quick edits.
- **Destructive actions:** confirm in a modal that names the thing, with a danger button.
- **Settings:** left sub-nav (200px) + one form card per section.

## 6. No-motion rules

- Everything inside `.fi-app` has `transition: none; animation: none`.
- Hover, focus, open and close are instant. Progress is static text or a stepped bar.

## 7. Checklist for every screen

- [ ] `aluminium` canvas, white panels, no dark areas
- [ ] One Archivo page title; all other text Archivo or mono
- [ ] One filled `safety` button
- [ ] `led` only as a small mark
- [ ] 14px body, 34px controls, 44px rows, 4px grid
- [ ] Lines, not shadows (shadows only on floating things)
- [ ] Focus visible on every control
- [ ] Status has a word, not just colour
- [ ] Nothing animates


---

# Part 3 · Website guideline

How the Field Instrument brand looks and moves on Sahil's website, landing pages and portfolio. Same palette and families as the platform, with bigger type, more air, and a defined motion system.

Light only: no dark bands, dark footers or dark cards.

---

## 1. Layout

- Max width 1200px, side padding 24px (16px on phones).
- 96px between sections (64px on phones); hero top spacing 128px (64px on phones).
- Text blocks max 60 characters wide.

## 2. Type scale

| Style | Size / line | Weight | Family | Use |
|---|---|---|---|---|
| `web-display` | 88 / 88 (48 / 50 on phones) | 600 | Archivo | Hero headline |
| `web-h1` | 56 / 60 (36 on phones) | 600 | Archivo | Section titles |
| `web-h2` | 40 / 46 (30 on phones) | 600 | Archivo | Sub-sections, contact |
| `web-h3` | 20 / 28 | 600 | Archivo | Card titles |
| `web-lead` | 19 / 30 | 400 | Archivo | Intro paragraphs |
| `web-body` | 17 / 28 | 400 | Archivo | Running text |
| `web-eyebrow` | 12 / 16 | 400 | Azeret Mono | Line above a headline |

- Accent: No accent word; the headline is preceded by a mono index.
- Eyebrow: Azeret Mono 11px `gunmetal` with an index: `00 · full stack ai engineer`.

## 3. Page anatomy

### Navigation

- 56px, `aluminium`, 1px `rule` bottom. Left: wordmark. Links in Azeret Mono 12 lowercase with indexes (`01 work`, `02 stack`). Right: an orange button "contact".

### Hero

- A row of white modules on aluminium: the big headline module (Archivo condensed 96px), a dial module showing a metric, and an LED strip module with four labelled LEDs (api · data · ai · cloud).

### Section header

- Mono index + label (`03 · projects`), then the `web-h1` condensed headline.

### Work cards

- White modules with screws, mono index row, Archivo 20/600 title, gunmetal text, a mono spec line. Hover: the index turns orange.

### Notes / writing list

- A spec table: index, date, title, read time, in mono with 1px rules. Hover: row `brushed`.

### Contact

- A module with an LED that is green ("accepting messages"), the email in mono with Copy, orange button.

### Footer

- `aluminium`, 1px `rule`, mono serial-number style copyright (`sn 2026-001 · dubai`).

## 4. Motion system

The website has **one orchestrated moment per page** (the hero) plus small responses to the user. Nothing else moves.

### Tokens

| Token | Value | Use |
|---|---|---|
| `duration-fast` | 150ms | Hover colour changes |
| `duration-base` | 220ms | Menus, accordions |
| `duration-reveal` | 700ms | Section fade-up |
| `duration-hero` | 900ms | Hero layers |
| `stagger` | 80ms | Delay between headline parts |
| Easing | `cubic-bezier(.2, .7, 0, 1)` | All reveals |

### The hero sequence (in order)

| Time | What happens | Spec |
|---|---|---|
| 0ms | Modules slot in | Each module: opacity 0 → 1, translateY 8px → 0, 400ms, 80ms apart |
| 400ms | LEDs power on | LEDs light green one by one, 120ms apart |
| 500ms | Dial sweeps | The orange needle sweeps from 0 to its value, 900ms, with a small overshoot |
| 200ms | Headline | Fades in, 500ms (no word split) |
| ~1400ms | Done | Everything readable from the first frame |

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
<header class="fiw-hero"><div class="fiw-module fi-screwed" style="--i:0"><div class="fi-index">00 · full stack ai engineer</div><h1 class="fiw-display">Systems built like instruments.</h1></div><div class="fiw-module" style="--i:1"><div class="fiw-dial"><i class="fiw-needle" style="--deg:48deg"></i></div></div></header>
```

## 5. Checklist for every page

- [ ] Light only, no dark bands
- [ ] Headlines follow the accent rule (No accent word; the headline is preceded by a mono index)
- [ ] Eyebrow above key headlines
- [ ] Signature details only where Part 1 allows them
- [ ] One hero motion sequence; everything readable before it plays
- [ ] Hover responses at 150ms
- [ ] Reduced motion respected
- [ ] One primary button per section


---

# Part 4 · Code

Copy each block into its own file, exactly as written. Component classes use the `.fi-` prefix (platform) and `.fiw-` (website).

## tokens.css

```css
/* Field Instrument tokens · Sahil Shaikh. Light only: there is no dark theme. */
:root {
  color-scheme: light;
  --aluminium: #ededea;
  --white: #ffffff;
  --brushed: #e4e4e0;
  --rule: #d9d9d4;
  --rule-strong: #85857f;
  --ink: #0e0e0d;
  --ink-secondary: #2c2c2a;
  --gunmetal: #5a5a56;
  --placeholder: #62625e;
  --safety: #c93a00;
  --safety-hover: #a83000;
  --safety-soft: #fce8de;
  --safety-text: #9e2e00;
  --on-safety: #ffffff;
  --led: #1fa44e;
  --led-soft: #e3f5e9;
  --led-text: #13703a;
  --success: var(--led-text);
  --success-soft: var(--led-soft);
  --warning: #8a5a00;
  --warning-soft: #fff4dc;
  --danger: #b42318;
  --danger-soft: #fdeceb;
  --chart-1: #c93a00;
  --chart-2: #8e8e88;
  --chart-3: #c5c5bf;
  --chart-highlight: #1fa44e;
  --shadow-pop: 0 4px 12px -2px #0e0e0d14, 0 2px 4px -2px #0e0e0d0f;
  --shadow-modal: 0 20px 48px -12px #0e0e0d2e, 0 4px 8px -4px #0e0e0d14;
  --focus-ring: 0 0 0 2px #ffffff, 0 0 0 4px #c93a00;
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
  --radius-xs: 2px;
  --radius-sm: 3px;
  --radius-md: 4px;
  --radius-lg: 6px;
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
  --stagger: 80ms;
  --opacity-disabled: 0.45;
  --ease-reveal: cubic-bezier(.2, .7, 0, 1);
  --font-display: Archivo, "Arial Narrow", system-ui, sans-serif;
  --font-ui: Archivo, "Segoe UI", system-ui, sans-serif;
  --font-mono: "Azeret Mono", ui-monospace, Menlo, monospace;
}
.ui-page-title { font-family: var(--font-display); font-size: 32px; line-height: 36px; font-weight: 600; letter-spacing: -0.01em; font-stretch: 75%; }
.ui-numeric { font-family: var(--font-display); font-size: 36px; line-height: 40px; font-weight: 600; letter-spacing: -0.01em; font-variant-numeric: tabular-nums; font-stretch: 75%; }
.ui-heading { font-family: var(--font-ui); font-size: 16px; line-height: 24px; font-weight: 600; letter-spacing: -0.01em; }
.ui-subheading { font-family: var(--font-ui); font-size: 14px; line-height: 20px; font-weight: 600; }
.ui-body { font-family: var(--font-ui); font-size: 14px; line-height: 20px; font-weight: 400; }
.ui-body-lg { font-family: var(--font-ui); font-size: 16px; line-height: 24px; font-weight: 400; }
.ui-label { font-family: var(--font-ui); font-size: 13px; line-height: 18px; font-weight: 500; }
.ui-small { font-family: var(--font-ui); font-size: 12px; line-height: 16px; font-weight: 400; }
.ui-meta { font-family: var(--font-mono); font-size: 11px; line-height: 16px; font-weight: 400; }
.web-display { font-family: var(--font-display); font-size: 88px; line-height: 88px; font-weight: 600; letter-spacing: -0.01em; font-stretch: 75%; }
.web-h1 { font-family: var(--font-display); font-size: 56px; line-height: 60px; font-weight: 600; letter-spacing: -0.01em; font-stretch: 75%; }
.web-h2 { font-family: var(--font-display); font-size: 40px; line-height: 46px; font-weight: 600; letter-spacing: -0.01em; font-stretch: 75%; }
.web-h3 { font-family: var(--font-ui); font-size: 20px; line-height: 28px; font-weight: 600; letter-spacing: -0.01em; }
.web-lead { font-family: var(--font-ui); font-size: 19px; line-height: 30px; font-weight: 400; }
.web-body { font-family: var(--font-ui); font-size: 17px; line-height: 28px; font-weight: 400; }
.web-eyebrow { font-family: var(--font-mono); font-size: 12px; line-height: 16px; font-weight: 400; }
/* Platform UI never animates: wrap the app in .fi-app */
.fi-app, .fi-app * { transition: none !important; animation: none !important; }
@media (max-width: 760px) { .web-display { font-size: 48px; line-height: 50px; } .web-h1 { font-size: 36px; line-height: 40px; } .web-h2 { font-size: 30px; line-height: 34px; } }
```

## components.css

```css
/* Field Instrument · components.css — reference styles for every component (.fi-* platform, shared by the website). Requires tokens.css. */
@import url("https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,400;62..125,500;62..125,600&family=Azeret+Mono:wght@400;500&display=swap");
/* Field Instrument components. .fi-* = platform UI (no motion). .fiw-* = website (motion allowed). */
body { margin: 0; font-family: var(--font-ui); font-size: 14px; line-height: 20px; color: var(--ink); background: var(--aluminium); -webkit-font-smoothing: antialiased; }
.fi-pad { padding: var(--space-5); }
.fi-row { display: flex; flex-wrap: wrap; align-items: center; gap: var(--space-3); }
.fi-col { display: grid; gap: var(--space-4); }
.fi-grid { display: grid; gap: var(--space-4); grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); }
.fi-meta { font-family: var(--font-mono); font-size: 11px; line-height: 16px; color: var(--gunmetal); }
.fi-eyebrow { display: inline-flex; align-items: center; gap: var(--space-2); font-family: var(--font-mono); font-size: 11px; line-height: 16px; color: var(--gunmetal); }
.fi-num { font-variant-numeric: tabular-nums; }
.fi-app, .fi-app * { transition: none !important; animation: none !important; }
:where(.fi-btn, .fi-input, .fi-select, .fi-textarea, .fi-tab, .fi-seg button, .fi-nav a, .fi-check input, .fi-toggle input):focus-visible { outline: 2px solid transparent; box-shadow: var(--focus-ring); }


/* Buttons */
.fi-btn { font: inherit; font-size: 13px; line-height: 18px; font-weight: 500; height: var(--control-md); padding: 0 var(--space-3); display: inline-flex; align-items: center; justify-content: center; gap: 6px; border-radius: var(--radius-sm); border: 1px solid transparent; cursor: pointer; white-space: nowrap; text-decoration: none; background: transparent; color: var(--ink); }
.fi-btn svg { width: var(--icon-md); height: var(--icon-md); }
.fi-btn-sm { height: var(--control-sm); padding: 0 10px; font-size: 12px; }
.fi-btn-lg { height: var(--control-lg); padding: 0 var(--space-4); font-size: 14px; }
.fi-btn-primary { background: var(--safety); color: var(--on-safety); }
.fi-btn-primary:hover { background: var(--safety-hover); }
.fi-btn-secondary { background: var(--white); border-color: var(--rule-strong); }
.fi-btn-secondary:hover { background: var(--brushed); }
.fi-btn-ghost { color: var(--ink-secondary); }
.fi-btn-ghost:hover { background: var(--brushed); color: var(--ink); }
.fi-btn-danger { background: var(--danger); color: #ffffff; }
.fi-btn[disabled] { opacity: var(--opacity-disabled); cursor: not-allowed; }
.fi-icon { fill: none; stroke: currentColor; stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; width: var(--icon-md); height: var(--icon-md); flex: none; }

/* Fields */
.fi-field { display: grid; gap: 6px; min-width: 0; }
.fi-label { font-size: 13px; line-height: 18px; font-weight: 500; color: var(--ink-secondary); }
.fi-input, .fi-select, .fi-textarea { font: inherit; font-size: 14px; width: 100%; box-sizing: border-box; height: var(--control-md); padding: 0 var(--space-3); border-radius: var(--radius-sm); border: 1px solid var(--rule-strong); background: var(--white); color: var(--ink); }
.fi-textarea { height: 88px; padding-block: 8px; resize: vertical; }
.fi-select { appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='none' stroke='%235a5a56' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m4 6 4 4 4-4'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 10px center; padding-right: 34px; }
.fi-input::placeholder, .fi-textarea::placeholder { color: var(--placeholder); }
.fi-input:focus, .fi-select:focus, .fi-textarea:focus, .fi-input.is-focus { outline: none; border-color: var(--safety); box-shadow: var(--focus-ring); }
.fi-input.is-error { border-color: var(--danger); }
.fi-help { margin: 0; font-size: 12px; line-height: 16px; color: var(--gunmetal); }
.fi-help.is-error { color: var(--danger); }
.fi-check { display: inline-flex; align-items: center; gap: 10px; font-size: 14px; color: var(--ink-secondary); cursor: pointer; }
.fi-check input { appearance: none; margin: 0; width: 16px; height: 16px; border: 1px solid var(--rule-strong); border-radius: var(--radius-xs); background: var(--white); display: grid; place-items: center; cursor: pointer; }
.fi-check input:checked { background: var(--safety); border-color: var(--safety); }
.fi-check input:checked::after { content: ""; width: 4px; height: 8px; border: solid #ffffff; border-width: 0 2px 2px 0; transform: translateY(-1px) rotate(45deg); }
.fi-check input[type="radio"] { border-radius: 50%; }
.fi-check input[type="radio"]:checked { background: var(--white); border-color: var(--safety); }
.fi-check input[type="radio"]:checked::after { width: 8px; height: 8px; border: 0; border-radius: 50%; background: var(--safety); transform: none; }
.fi-toggle { display: inline-flex; align-items: center; gap: 10px; font-size: 14px; color: var(--ink-secondary); cursor: pointer; }
.fi-toggle input { appearance: none; margin: 0; width: 32px; height: 18px; border-radius: var(--radius-full); background: var(--rule-strong); position: relative; cursor: pointer; }
.fi-toggle input::after { content: ""; position: absolute; top: 2px; left: 2px; width: 14px; height: 14px; border-radius: 50%; background: #ffffff; }
.fi-toggle input:checked { background: var(--safety); }
.fi-toggle input:checked::after { left: 16px; }

/* Badges */
.fi-badge { display: inline-flex; align-items: center; gap: 6px; height: 22px; padding: 0 var(--space-2); border-radius: var(--radius-xs); font-size: 12px; line-height: 16px; font-weight: 500; background: var(--brushed); color: var(--gunmetal); white-space: nowrap; }
.fi-badge.dot::before { content: ""; width: 6px; height: 6px; background: currentColor; }
.fi-badge-done { background: var(--success-soft); color: var(--success); }
.fi-badge-live { background: var(--led-soft); color: var(--led-text); }
.fi-badge-warn { background: var(--warning-soft); color: var(--warning); }
.fi-badge-fail { background: var(--danger-soft); color: var(--danger); }
.fi-badge-mono { font-family: var(--font-mono); font-size: 11px; font-weight: 400; background: var(--white); border: 1px solid var(--rule); color: var(--ink-secondary); }

/* Tabs and segmented */
.fi-tabs { display: flex; gap: var(--space-5); border-bottom: 1px solid var(--rule); }
.fi-tab { font: inherit; background: none; border: 0; padding: 0; height: 36px; font-family: var(--font-mono); font-size: 11px; color: var(--gunmetal); border-bottom: 2px solid transparent; margin-bottom: -1px; cursor: pointer; }
.fi-tab:hover { color: var(--ink); }
.fi-tab[aria-selected="true"] { color: var(--ink); border-bottom-color: var(--ink); }
.fi-seg { display: inline-flex; gap: 2px; padding: 3px; background: var(--brushed); border-radius: var(--radius-sm); }
.fi-seg button { font: inherit; font-size: 13px; font-weight: 500; border: 1px solid transparent; background: none; color: var(--gunmetal); height: 28px; padding: 0 12px; border-radius: 4px; cursor: pointer; }
.fi-seg button[aria-pressed="true"] { background: var(--white); color: var(--ink); border-color: var(--rule); }

/* Cards and KPIs */
.fi-card { background: var(--white); border: 1px solid var(--rule); border-radius: var(--radius-md); padding: var(--space-5); min-width: 0; }
.fi-card-head { display: flex; justify-content: space-between; align-items: center; gap: var(--space-3); margin-bottom: var(--space-4); }
.fi-card-title { margin: 0; font-size: 16px; line-height: 24px; font-weight: 600; letter-spacing: -.01em; }
.fi-kpi-value { font-family: var(--font-display); font-size: 36px; line-height: 40px; font-weight: 600; letter-spacing: -0.01em; font-variant-numeric: tabular-nums; margin-top: var(--space-2); }
.fi-delta { font-size: 12px; line-height: 16px; font-weight: 500; color: var(--success); margin-top: var(--space-1); }
.fi-delta.warn { color: var(--warning); } .fi-delta.down { color: var(--danger); }

/* Table */
.fi-table-wrap { background: var(--white); border: 1px solid var(--rule); border-radius: var(--radius-md); overflow-x: auto; }
.fi-table { width: 100%; border-collapse: collapse; font-size: 14px; }
.fi-table th { height: 36px; padding: 0 var(--space-3); text-align: left; background: var(--brushed); border-bottom: 1px solid var(--rule); font-family: var(--font-mono); font-size: 11px; font-weight: 400; color: var(--gunmetal); white-space: nowrap; }
.fi-table td { height: var(--row-height); padding: 0 var(--space-3); border-bottom: 1px solid var(--rule); color: var(--ink-secondary); white-space: nowrap; }
.fi-table tbody tr:last-child td { border-bottom: 0; }
.fi-table tbody tr { cursor: pointer; }
.fi-table tbody tr:hover td { background: var(--aluminium); }
.fi-table tbody tr[aria-selected="true"] td { background: var(--safety-soft); }
.fi-table tbody tr[aria-selected="true"] td:first-child { box-shadow: inset 2px 0 0 var(--safety); }
.fi-table .r { text-align: right; font-variant-numeric: tabular-nums; }
.fi-table .strong { color: var(--ink); font-weight: 500; }
.fi-table .id { font-family: var(--font-mono); font-size: 11px; color: var(--gunmetal); }
.fi-table-foot { display: flex; justify-content: space-between; gap: var(--space-3); padding: 10px var(--space-3); border-top: 1px solid var(--rule); font-size: 12px; color: var(--gunmetal); }

/* App shell */
.fi-app { display: grid; grid-template-columns: var(--sidebar-width) minmax(0, 1fr); min-height: 640px; background: var(--white); font-size: 14px; }
.fi-side { background: var(--aluminium); border-right: 1px solid var(--rule); padding: var(--space-4) 10px; display: flex; flex-direction: column; gap: var(--space-5); }
.fi-brand { display: flex; align-items: center; gap: var(--space-2); padding: 0 6px; font-family: var(--font-display); font-size: 20px; line-height: 24px; color: var(--ink); }
.fi-nav { display: grid; gap: 2px; }
.fi-nav .fi-meta { padding: 0 8px 6px; }
.fi-nav a { display: flex; align-items: center; gap: 10px; height: 30px; padding: 0 8px; border-radius: var(--radius-sm); font-size: 13px; font-weight: 500; color: var(--ink-secondary); text-decoration: none; cursor: pointer; }
.fi-nav a .fi-icon { color: var(--gunmetal); }
.fi-nav a:hover { background: var(--white); color: var(--ink); }
.fi-nav a[aria-current="page"] { background: var(--safety-soft); color: var(--safety-text); }
.fi-nav a[aria-current="page"] .fi-icon { color: var(--safety-text); }
.fi-nav .count { margin-left: auto; font-family: var(--font-mono); font-size: 10px; color: var(--gunmetal); }
.fi-main { min-width: 0; display: flex; flex-direction: column; }
.fi-top { height: var(--topbar-height); border-bottom: 1px solid var(--rule); display: flex; align-items: center; gap: var(--space-3); padding: 0 var(--space-6); }
.fi-top .fi-input { max-width: 320px; }
.fi-top .right { margin-left: auto; display: flex; gap: var(--space-2); align-items: center; }
.fi-avatar { width: 30px; height: 30px; border-radius: 50%; background: var(--aluminium); border: 1px solid var(--rule); display: grid; place-items: center; font-size: 11px; font-weight: 600; color: var(--ink-secondary); }
.fi-page { padding: var(--space-6); display: grid; gap: var(--space-6); max-width: var(--content-max); }
.fi-page-head { display: flex; justify-content: space-between; align-items: flex-end; gap: var(--space-4); flex-wrap: wrap; }
.fi-page-title { margin: 2px 0 0; font-family: var(--font-display); font-size: 32px; line-height: 36px; font-weight: 600; letter-spacing: -0.01em; }
.fi-page-sub { margin: var(--space-1) 0 0; color: var(--gunmetal); }

/* Modal, toast, banner, empty */
.fi-backdrop { background: rgba(14, 14, 13, .2); padding: var(--space-6); display: grid; place-items: center; }
.fi-modal { width: 100%; max-width: 440px; background: var(--white); border: 1px solid var(--rule); border-radius: var(--radius-lg); box-shadow: var(--shadow-modal); }
.fi-modal-head { display: flex; justify-content: space-between; gap: var(--space-3); padding: var(--space-5) var(--space-5) 0; }
.fi-modal-title { margin: 0; font-family: var(--font-display); font-size: 24px; line-height: 30px; font-weight: 600; }
.fi-modal-body { padding: var(--space-5); display: grid; gap: var(--space-4); }
.fi-modal-foot { display: flex; justify-content: flex-end; gap: var(--space-2); padding: var(--space-4) var(--space-5); border-top: 1px solid var(--rule); }
.fi-toast { display: inline-flex; align-items: center; gap: var(--space-3); padding: 12px var(--space-4); background: var(--white); border: 1px solid var(--rule); border-radius: var(--radius-lg); box-shadow: var(--shadow-pop); font-weight: 500; }
.fi-toast .fi-icon { color: var(--safety); }
.fi-banner { display: flex; align-items: center; gap: var(--space-3); padding: 12px var(--space-4); border-radius: var(--radius-md); font-size: 14px; }
.fi-banner .grow { flex: 1; }
.fi-banner-warn { background: var(--warning-soft); color: var(--warning); }
.fi-banner-fail { background: var(--danger-soft); color: var(--danger); }
.fi-banner-info { background: var(--safety-soft); color: var(--safety-text); }
.fi-empty { position: relative; overflow: hidden; text-align: center; padding: var(--space-12) var(--space-6); background: var(--white); border: 1px solid var(--rule); border-radius: var(--radius-md); }
.fi-empty > * { position: relative; }
.fi-empty .fi-icon { width: 20px; height: 20px; color: var(--gunmetal); }
.fi-empty h3 { margin: var(--space-3) 0 var(--space-1); font-size: 16px; line-height: 24px; font-weight: 600; }
.fi-empty p { margin: 0 auto var(--space-4); max-width: 40ch; color: var(--gunmetal); }
.fi-skel { background: var(--brushed); border-radius: 4px; height: 12px; }

/* Signature details */
.fi-mark { display: inline-block; width: 6px; height: 6px; background: var(--safety); flex: none; }
.fi-eyebrow::before { content: ""; width: 6px; height: 6px; background: var(--safety); }
.fi-accent { color: inherit; }
.fi-empty::before { content: ""; position: absolute; left: 50%; top: 28px; width: 72px; height: 72px; margin-left: -36px; border-radius: 50%; border: 1px solid var(--rule); }
/* Screws, module index, dial (signature) */
.fi-screwed { position: relative; }
.fi-screwed::before { content: ""; position: absolute; inset: 6px; pointer-events: none; background: radial-gradient(circle, var(--rule-strong) 1.5px, transparent 2px) 0 0 / 6px 6px no-repeat, radial-gradient(circle, var(--rule-strong) 1.5px, transparent 2px) 100% 0 / 6px 6px no-repeat, radial-gradient(circle, var(--rule-strong) 1.5px, transparent 2px) 0 100% / 6px 6px no-repeat, radial-gradient(circle, var(--rule-strong) 1.5px, transparent 2px) 100% 100% / 6px 6px no-repeat; }
.fi-index { display: flex; gap: var(--space-2); font-family: var(--font-mono); font-size: 11px; color: var(--gunmetal); padding-bottom: var(--space-2); border-bottom: 1px solid var(--rule); margin-bottom: var(--space-3); }
.fi-led { width: 7px; height: 7px; border-radius: 50%; background: var(--led); box-shadow: 0 0 0 2px var(--led-soft); }
```

## motion.css (website only)

```css
/* Field Instrument · motion.css — WEBSITE ONLY. Never load inside the platform UI. Requires tokens.css. */
/* ---------------- Website ---------------- */
.fw { font-size: 17px; line-height: 28px; background: var(--aluminium); }
.fiw-wrap { max-width: var(--site-max); margin: 0 auto; padding: 0 var(--space-6); }
.fiw-nav { display: flex; align-items: center; justify-content: space-between; height: 72px; }
.fiw-logo { display: flex; align-items: center; gap: var(--space-2); font-family: var(--font-display); font-size: 22px; line-height: 28px; color: var(--ink); text-decoration: none; }
.fiw-links { display: flex; align-items: center; gap: var(--space-6); font-size: 14px; font-weight: 500; color: var(--gunmetal); }
.fiw-links a { color: inherit; text-decoration: none; transition: color 150ms ease-out; }
.fiw-links a:hover { color: var(--ink); }
.fiw-links a[aria-current="page"] { color: var(--ink); text-decoration: underline; text-underline-offset: 6px; text-decoration-thickness: 1px; }
.fw .fi-btn { transition: background-color 150ms ease-out; }
.fw .fi-btn .arr { display: inline-block; transition: transform 150ms ease-out; }
.fw .fi-btn:hover .arr, .fiw-card:hover .arr { transform: translateX(3px); }
.fiw-display { margin: 0; font-family: var(--font-display); font-weight: 600; font-size: 88px; line-height: 84px; letter-spacing: -0.01em; max-width: 13ch; color: var(--ink); }
.fiw-display .w { display: inline-block; }
.fiw-lead { margin: var(--space-5) 0 var(--space-8); max-width: 44ch; font-size: 19px; line-height: 30px; color: var(--gunmetal); }
.fiw-cta { display: flex; gap: var(--space-3); flex-wrap: wrap; }
.fiw-sec-head { display: flex; justify-content: space-between; align-items: flex-end; gap: var(--space-4); flex-wrap: wrap; margin-bottom: var(--space-8); }
.fiw-h1 { margin: var(--space-3) 0 0; font-family: var(--font-display); font-weight: 600; font-size: 56px; line-height: 58px; letter-spacing: -0.01em; }
.fiw-h2 { margin: 0; font-family: var(--font-display); font-weight: 600; font-size: 40px; line-height: 44px; letter-spacing: -0.01em; }
.fiw-cards { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: var(--space-6); }
.fiw-card { display: flex; flex-direction: column; gap: var(--space-2); padding: var(--space-6); background: var(--white); border: 1px solid var(--rule); border-radius: var(--radius-md); text-decoration: none; color: var(--ink); min-width: 0; }
.fiw-shot { aspect-ratio: 16/10; border-radius: var(--radius-sm); background: var(--aluminium); border: 1px solid var(--rule); margin-bottom: var(--space-3); padding: 12px; display: grid; gap: 8px; align-content: start; }
.fiw-shot span { height: 8px; border-radius: 4px; background: var(--brushed); }
.fiw-card h3 { margin: 0; font-size: 20px; line-height: 28px; font-weight: 600; letter-spacing: -.01em; display: flex; justify-content: space-between; transition: color 150ms ease-out; }
.fiw-card:hover h3 { color: var(--safety); }
.fiw-card p { margin: 0; font-size: 15px; line-height: 24px; color: var(--gunmetal); }
.fiw-card .tags { display: flex; gap: var(--space-2); flex-wrap: wrap; margin-top: var(--space-3); }
.fiw-notes { display: grid; }
.fiw-note { display: grid; grid-template-columns: 120px minmax(0, 1fr); gap: var(--space-4); padding: var(--space-5) 0; border-bottom: 1px solid var(--rule); text-decoration: none; color: var(--ink); }
.fiw-note b { display: block; font-family: var(--font-display); font-weight: 600; font-size: 24px; line-height: 30px; transition: color 150ms ease-out; }
.fiw-note:hover b { color: var(--safety); }
.fiw-note span { color: var(--gunmetal); font-size: 15px; }
@media (max-width: 760px) {
  .fiw-display { font-size: 48px; line-height: 48px; } .fiw-h1 { font-size: 36px; line-height: 40px; } .fiw-h2 { font-size: 30px; line-height: 34px; }
  .fiw-cards { grid-template-columns: 1fr; } .fiw-links { display: none; } .fiw-hero { padding: var(--space-5) var(--space-5) var(--space-10); }
  .fiw-note { grid-template-columns: 1fr; gap: var(--space-1); }
  .fi-app { grid-template-columns: 1fr; } .fi-side { display: none; }
}

/* Accent word */
.fiw-display em, .fiw-h1 em, .fiw-h2 em { font-style: normal; }

/* Hero (signature) */
.fiw-hero { display: grid; grid-template-columns: 2fr 1fr; gap: var(--space-2); padding: var(--space-8) 0; }
.fiw-module { background: var(--white); border: 1px solid var(--rule); border-radius: var(--radius-md); padding: var(--space-6); position: relative; }
.fiw-dial { width: 160px; aspect-ratio: 1; border-radius: 50%; border: 1px solid var(--rule-strong); position: relative; margin: 0 auto; }
.fiw-needle { position: absolute; left: 50%; bottom: 50%; width: 2px; height: 44%; background: var(--safety); transform-origin: bottom; transform: rotate(var(--deg, 40deg)); }
.fiw-display { font-stretch: 75%; }
@media (max-width: 760px) { .fiw-hero { grid-template-columns: 1fr; } }

@media (prefers-reduced-motion: no-preference) {
  .fiw-play .fiw-module { animation: fiw-slot 400ms var(--ease-reveal) both; animation-delay: calc(var(--i) * 80ms); }
  @keyframes fiw-slot { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
  .fiw-play .fi-led { animation: fiw-led 200ms steps(1) both; animation-delay: calc(400ms + var(--i) * 120ms); }
  @keyframes fiw-led { from { background: var(--rule); box-shadow: none; } }
  .fiw-play .fiw-needle { animation: fiw-sweep 900ms cubic-bezier(.3, 1.3, .5, 1) 500ms both; }
  @keyframes fiw-sweep { from { transform: rotate(-120deg); } to { transform: rotate(var(--deg, 40deg)); } }
  .fiw-play .fiw-display { animation: fiw-in 500ms ease-out 200ms both; }
  @keyframes fiw-in { from { opacity: 0; } to { opacity: 1; } }
  .fiw-fade.fiw-in { animation: fiw-up var(--duration-reveal) var(--ease-reveal) both; }
  @keyframes fiw-up { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
}

/* Usage
   1. Hero markup: <header class="fiw-hero"><div class="fiw-module fi-screwed" style="--i:0"><div class="fi-index">00 · full stack ai engineer</div><h1 class="fiw-display">Systems built like instruments.</h1></div><div class="fiw-module" style="--i:1"><div class="fiw-dial"><i class="fiw-needle" style="--deg:48deg"></i></div></div></header>
   2. Split the headline into <span class="w" style="--i:N"> words (or lines), then add .fiw-play to the hero once it is in view.
   3. Section titles: add .fiw-fade; add .fiw-in when they first enter the viewport.
   Everything is visible before and without the script; prefers-reduced-motion turns all of it off. */
```

## tailwind-theme.css (only if the project uses Tailwind v4)

```css
@import "tailwindcss";
/* Field Instrument · Tailwind v4 theme. Load tokens.css first. Light only. */
@theme inline {
  --color-aluminium: var(--aluminium);
  --color-white: var(--white);
  --color-brushed: var(--brushed);
  --color-rule: var(--rule);
  --color-rule-strong: var(--rule-strong);
  --color-ink: var(--ink);
  --color-ink-secondary: var(--ink-secondary);
  --color-gunmetal: var(--gunmetal);
  --color-placeholder: var(--placeholder);
  --color-safety: var(--safety);
  --color-safety-hover: var(--safety-hover);
  --color-safety-soft: var(--safety-soft);
  --color-safety-text: var(--safety-text);
  --color-on-safety: var(--on-safety);
  --color-led: var(--led);
  --color-led-soft: var(--led-soft);
  --color-led-text: var(--led-text);
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

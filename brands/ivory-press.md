# IVORY-PRESS.md · Sahil Shaikh brand (all-in-one)

**For Claude Code:** this single file contains the whole Ivory Press system: brand rules, platform UI rules (no animation), website rules (with motion), and the complete CSS. Put it in the project root and add this line to `CLAUDE.md`:

```
All UI follows IVORY-PRESS.md. Before writing UI, create tokens.css, components.css (and motion.css for website pages) from Part 4 if they don't exist, then use only their variables and classes. Light only, never dark. Platform UI has no animation.
```

## How Claude Code should use this file

1. Decide the surface: **Platform UI** (app, dashboard, admin, settings) or **Website** (marketing, portfolio, landing). If unclear, assume Platform UI.
2. If `tokens.css` and `components.css` don't exist in the project, create them by copying the code blocks in Part 4 exactly. For website pages also create `motion.css`. With Tailwind v4 also create `tailwind-theme.css`.
3. Load the Google Fonts in Part 1, section 5.
4. Never hard-code colours, font sizes or fonts. Never add dark mode or dark sections.
5. Platform UI: wrap the app in `class="ip-app"` (kills all motion). Website: follow Part 3, section 4.
6. Finish by running the checklist at the end of Part 2 or Part 3.

---

Sahil Shaikh's brand and design system, **Ivory Press**. Part 1 is the brand foundations, Part 2 the platform UI rules (no animation), Part 3 the website rules (with motion), Part 4 the code.

*Researched from: Anthropic, Granola, Craft, printed annual reports. Inspired by, not copied from: no logos, fonts or assets of those products are used.*

---

# Part 1 · Brand foundations

The brand of Sahil Shaikh, Full Stack AI Engineer. **Ivory Press**: a small private press: ivory stock, black ink, an oxblood rule and brass section marks. It covers every platform Sahil designs and his website.

This system has three parts:

1. **Brand foundations** (Part 1): idea, logo, colour, type, layout, shape, icons, imagery, voice and accessibility.
2. **Platform UI** (Part 2): rules for any app, dashboard or tool. **No animation.**
3. **Website** (Part 3): the same brand with larger type and a defined motion system.

Light only. There is no dark theme, and no dark sections, panels or backgrounds anywhere.

---

## 1. The idea

| | |
|---|---|
| **Metaphor** | A small private press: ivory stock, black ink, an oxblood rule and brass section marks. |
| **Personality** | Considered, literate, trustworthy. Reads like a well-set essay. |
| **Feeling we want** | "This person thinks before they build." |
| **Three ingredients** | **Type** (Newsreader headlines in two tones) · **Rules** (hairline double rules and § section marks) · **Restraint** (one oxblood action colour, generous margins) |

## 2. Principles

1. **Ivory stock.** Pages sit on `ivory`; working surfaces are `white` sheets with hairline borders.
2. **Two-tone headlines.** The first clause in `ink`, the rest in `sepia`, set in Newsreader.
3. **Rules, not boxes.** Hairline and double rules separate content; fills are rare.
4. **Oxblood to act.** One deep red for actions and links. Brass for section marks only.
5. **Set it like print.** Measure 60–68 characters, old-style numerals in prose, generous leading.
6. **Still product, one print moment on the website.** The headline sets in like ink; nothing else performs.
7. **Accessible always.** Text 4.5:1 or better, borders and indicators 3:1, focus always visible.

## 3. Logo

- **Wordmark:** "Sahil Shaikh" in Newsreader 500, `ink`, followed by a brass "§". Tracking -0.01em.
- **Product mark:** "§" in brass + product name in Newsreader 500.
- **App icon / avatar:** a `white` square, 1px `rule`, 6px radius, a Newsreader "S" with a short oxblood rule beneath it.
- **Clear space:** the height of the S on every side. **Minimum size:** wordmark 96px; icon 20px.
- **Never:** set the name in a sans, add effects, use brass for the name, place it on a dark ground.

## 4. Colour

### Core palette

| Token | Hex | Role |
|---|---|---|
| `ivory` | #FAF8F3 | Page ground, sidebar, website background |
| `white` | #FFFFFF | Cards, tables, inputs, modals |
| `vellum` | #F2EEE5 | Table headers, quotes, soft fills |
| `rule` | #E7E1D6 | Dividers and borders |
| `rule-strong` | #8F8778 | Input borders, strong dividers |
| `ink` | #1B1A17 | Headings, primary text |
| `ink-secondary` | #3B3832 | Labels, nav, table text |
| `sepia` | #6A6359 | Second tone of headlines, secondary text |
| `placeholder` | #706960 | Placeholders, disabled text |
| `oxblood` | #8C2F2B | Primary action, links, focus |
| `oxblood-hover` | #73241F | Hover/pressed oxblood |
| `oxblood-soft` / `oxblood-text` | #F7E7E4 / #7A2723 | Selected, active, success |
| `brass` | #B88A1E | § section marks, the wordmark mark, drop numerals |
| `brass-soft` / `brass-text` | #FBF1D9 / #7A5A0E | Soft brass badges |
| `warning` / `warning-soft` | #8A5A00 / #FFF4DC | Needs attention |
| `danger` / `danger-soft` | #B42318 / #FDECEB | Errors, destructive |

### Charts

`chart-1` oxblood #8C2F2B, `chart-2` #C98E89, `chart-3` #C9C2B4, and `chart-highlight` brass #B88A1E for the one value that matters. Gridlines use `rule`, axis labels use `ui-meta` in `sepia`.

### Proportions

About 60% ivory, 25% white, 11% type and rules, 3% oxblood, 1% brass.

### Rules

- Oxblood is the only colour on buttons and links. One filled oxblood button per view.
- Brass is ornament: § marks, numerals, the logo mark. Never body text, never a button.
- Status always has a word. Danger red and oxblood never appear side by side.
- No gradients, anywhere.
- Never use `ink` or `sepia` as a background.

## 5. Typography

Three roles, all free on Google Fonts:

`https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;1,6..72,400&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap`

| Family | Role | Use | Weights |
|---|---|---|---|
| **Newsreader** | **The voice** | Page titles, big numbers, website headlines, pull quotes | 400, 500, 400 italic |
| **IBM Plex Sans** | **The clarity** | All UI and body text | 400, 500, 600 |
| **IBM Plex Mono** | **The precision** | IDs, dates, column headers, citations | 400, 500 |

- **Two-tone rule:** headlines start in `ink`; after the first full stop or comma they continue in `sepia`.
- Pull quotes and the occasional emphasis may use Newsreader *italic*; never in UI controls.
- Section numbers use a brass § and old-style figures: `§ 03`.
- Sentence case. No ALL CAPS, no letter-spaced labels.
- Full scales are in Part 2 (platform) and Part 3 (website).

## 6. Layout and spacing

- **4px grid:** 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 96, 128.
- **Platform:** sidebar on `ivory`, content on `white`, 24px page padding, max 1200px.
- **Website:** 1040px max width, 96px between sections.
- Align to a left edge in the product. Centre only short single lines (an empty state).

## 7. Shape and depth

| Token | Value | Use |
|---|---|---|
| `radius-xs` | 2px | Badges, checkboxes |
| `radius-sm` | 4px | Buttons, inputs |
| `radius-md` | 6px | Cards, tables, menus |
| `radius-lg` | 8px | Modals, website sheets |
| `radius-full` | 9999px | Toggles, dots |

- **Double rule** (signature): page titles and website sections are underlined by two 1px `rule-strong` lines 3px apart.
- **§ marks** (signature): section labels start with a brass §. Use on section headers only.
- Crisp corners (2–8px). Shadows only for menus and modals.

## 8. Iconography

- Lucide, 1.25px stroke (lighter than usual, to sit with the serif). 16px in controls. `sepia` default, `oxblood` active.
- Icon-only buttons always have an accessible label.

## 9. Imagery

- Screenshots framed like plates: white sheet, 1px `rule`, a Plex Mono caption below (`fig. 2 · billing engine`).
- Diagrams in thin `ink` lines with one oxblood path. No colour fills.
- Portraits: black and white or warm daylight, on ivory, 4:5.

## 10. Voice and writing

- Measured and literate. Full sentences, precise verbs, no hype.
- Lead with what something does: "Agents plan, build and review work together."
- Buttons are verbs: "New project", "Save changes". Confirmations say what happened: "Project created."
- Errors say what went wrong and how to fix it: "Name is required. Add a project name to continue."
- Numbers: "AED 1,250.00", dates "21 Oct 2026", times "14:32".
- No buzzwords, no exclamation marks, no emoji in UI.

## 11. Accessibility

- Every text colour pair passes WCAG AA (4.5:1). Borders, focus rings and indicators pass 3:1.
- Focus ring: 2px white gap + 2px `oxblood`, on every interactive element.
- Never rely on colour alone; pair it with a word, icon or position.
- Hit targets at least 28px (34px default).
- The website respects `prefers-reduced-motion`: all motion off, content visible immediately.

Measured contrast for this palette:

| Pair | Ratio | Needed |
|---|---|---|
| Body text `ink` on `white` | 17.4:1 | 4.5:1 |
| `sepia` on `ivory` | 5.59:1 | 4.5:1 |
| `sepia` on `vellum` | 5.12:1 | 4.5:1 |
| White on `oxblood` (primary button) | 8.21:1 | 4.5:1 |
| `oxblood` links on `white` | 8.21:1 | 4.5:1 |
| `oxblood-text` on `oxblood-soft` | 8.17:1 | 4.5:1 |
| `brass-text` on `brass-soft` | 5.67:1 | 4.5:1 |
| `placeholder` on `white` | 5.41:1 | 4.5:1 |
| `rule-strong` borders on `white` | 3.56:1 | 3:1 |
| `ink` on `brass` (mark used as a fill) | 5.55:1 | 4.5:1 |

## 12. Do and don't

| Do | Don't |
|---|---|
| Ivory ground, white sheets | Dark backgrounds or dark mode |
| Two-tone Newsreader headlines | Bold or condensed headline faces |
| Hairline and double rules | Thick borders or filled boxes everywhere |
| Brass § marks on section headers | Brass text or brass buttons |
| Oxblood for actions | Oxblood next to danger red |
| Captions on images | Uncaptioned decorative images |
| Old-style figures in prose | Tabular figures in running text |
| One ink-set headline on the website | Animation in the platform |


---

# Part 2 · Platform UI guideline

Rules for any platform, app, dashboard, admin or internal tool built in the Ivory Press brand. It is generic: it works for projects, CRM, analytics, payments, AI agents or anything else.

**The platform never animates.** State changes are instant. Every rule here assumes light only.

---

## 1. Foundations for the platform

- **Ground:** `ivory` for the app canvas and sidebar. `white` for every working panel (cards, tables, forms, modals).
- **Text:** `ink` for headings and values, `ink-secondary` for labels and nav, `sepia` for help text and metadata.
- **Action colour:** `oxblood`. **Mark:** `brass` (small).
- **Density:** 14px text, 34px controls, 44px rows, 4px grid.

## 2. Type scale

| Style | Size / line | Weight | Family | Use |
|---|---|---|---|---|
| `ui-page-title` | 32 / 36 | 400 | Newsreader | Page title, one per screen |
| `ui-numeric` | 36 / 40 | 400 | Newsreader | KPI values, big totals |
| `ui-heading` | 16 / 24 | 600 | IBM Plex Sans | Card, section, modal headings |
| `ui-subheading` | 14 / 20 | 600 | IBM Plex Sans | Form group titles |
| `ui-body` | **14 / 20** | 400 | IBM Plex Sans | **Default text** |
| `ui-body-lg` | 16 / 24 | 400 | IBM Plex Sans | Empty states, onboarding |
| `ui-label` | 13 / 18 | 500 | IBM Plex Sans | Labels, nav items, buttons |
| `ui-small` | 12 / 16 | 400 | IBM Plex Sans | Help text, captions |
| `ui-meta` | 11 / 16 | 400 | IBM Plex Mono | IDs, timestamps, column headers |

Rules:

- Newsreader only for `ui-page-title`, `ui-numeric` and modal titles. Never in buttons, tables, forms, nav or badges.
- Numbers in tables use `font-variant-numeric: tabular-nums` and align right.
- Never below 11px (mono) or 12px (UI).

## 3. App layout

- **Sidebar:** 232px (60px collapsed), `ivory`, 1px `rule` right border, 16px top padding. Product mark at top. Groups titled with `ui-meta`.
- **Top bar:** 56px, `white`, 1px `rule` bottom border. Search left (320px max), actions right.
- **Page header:** breadcrumb in `ui-meta`, then `ui-page-title`, optional one-line description in `sepia`. Actions on the right, aligned to the title's baseline.
- **Content:** 24px padding, max width 1200px, 24px gap between blocks, 32px between page sections.
- **Breakpoints:** 640, 768, 1024, 1280. Below 1024 the sidebar becomes a drawer.

## 4. Components

### Buttons

| Variant | Look | Use |
|---|---|---|
| Primary | `oxblood` fill, `on-oxblood` text | The one main action per view |
| Secondary | `white` fill, 1px `rule-strong` border, `ink` text | Every other action |
| Ghost | No fill or border, `ink-secondary` text | Toolbars, cancel, low emphasis |
| Danger | `danger` fill, white text | Destructive confirmations only |

- Sizes: 28px (sm), **34px (default)**, 40px (lg). `radius-sm`. `ui-label` 13/500.
- States: hover = instant background change (`oxblood-hover`, `vellum`); focus = `focus-ring`; disabled = `opacity-disabled`.
- Labels are verbs in sentence case: "New project", "Export CSV".

### Text inputs, selects, textareas

- 34px tall, 12px horizontal padding, `radius-sm`, `white` fill, 1px `rule-strong` border, `placeholder` colour for placeholders.
- Label above (`ui-label`, `ink-secondary`), help or error below (`ui-small`), 6px gaps.
- Focus: `oxblood` border + `focus-ring`. Error: `danger` border and a message saying how to fix it.

### Checkbox, radio, toggle

- Checkbox 16px, `radius-xs`; checked = `oxblood` fill with white tick. Radio: 8px `oxblood` dot. Toggle 32 × 18px; on = `oxblood`.
- The label is always clickable and sits 10px to the right.

### Badges

- 22px tall, 8px padding, `radius-xs`, 12/500.
- Done (`oxblood-soft`/`oxblood-text`), Live or new (`brass-soft`/`brass-text`), Needs review (`warning-soft`/`warning`), Failed (`danger-soft`/`danger`), Draft (`vellum`/`sepia`).

### Tabs and segmented controls

- **Tabs:** Plex Sans 13/500, 36px tall. Active = `ink` text + 1px `ink` underline.
- **Segmented control:** `vellum` track, 3px padding; active segment = `white` with 1px `rule`.

### Tables

- `white` panel, 1px `rule`, `radius-md`, horizontal scroll on narrow screens.
- Header 36px, `vellum`, `ui-meta` labels in `sepia`. Rows 44px, 1px `rule` between rows. Hover = `ivory`. Selected = `oxblood-soft` with a 2px `oxblood` left edge.
- IDs in `ui-meta`. Amounts right-aligned, tabular. Status as badges.

### Cards and KPIs

- `white`, 1px `rule`, `radius-md`, 20px padding, no shadow. KPI: `ui-meta` label, value in `ui-numeric`, delta in `ui-small`.
- Signature detail (Double rule) on one group per screen at most.

### Navigation

- Sidebar items: 30px, `radius-sm`, `ui-label`, 16px icon in `sepia`.
- Active: `vellum` background + `ink` text + 2px `oxblood` left rule.
- Breadcrumbs in `ui-meta` separated by " / ".

### Modals and side sheets

- Widths 440 / 600 / 800px; `white`, `radius-lg`, `shadow-modal`. Backdrop `ink` at 20%.
- Title in Newsreader 24/30; footer buttons right-aligned, primary last. Escape closes; focus returns to the trigger.

### Toasts, banners, empty, loading and error states

- Toast: bottom-right, `white`, `radius-lg`, `shadow-pop`, one line + optional "Undo". No animation.
- Empty: centred, 20px icon in `sepia`, `ui-heading`, one line of `ui-body`, one primary button.
- Loading: static `vellum` skeleton blocks + a `ui-meta` "loading…" label. No spinners or shimmer.
- Error: danger banner with what failed and a "Try again" button.

### Data visualisation

- `chart-1` main series, `chart-2` comparison, `chart-3` other, `chart-highlight` for one value. Gridlines `rule`, axis labels `ui-meta`. No animation, no 3D, no gradients.

## 5. Patterns

- **Forms:** one column, max 560px. Labels above fields. Actions bottom-right, primary last.
- **List to detail:** clicking a row opens a side sheet for quick edits.
- **Destructive actions:** confirm in a modal that names the thing, with a danger button.
- **Settings:** left sub-nav (200px) + one form card per section.

## 6. No-motion rules

- Everything inside `.ip-app` has `transition: none; animation: none`.
- Hover, focus, open and close are instant. Progress is static text or a stepped bar.

## 7. Checklist for every screen

- [ ] `ivory` canvas, white panels, no dark areas
- [ ] One Newsreader page title; all other text IBM Plex Sans or mono
- [ ] One filled `oxblood` button
- [ ] `brass` only as a small mark
- [ ] 14px body, 34px controls, 44px rows, 4px grid
- [ ] Lines, not shadows (shadows only on floating things)
- [ ] Focus visible on every control
- [ ] Status has a word, not just colour
- [ ] Nothing animates


---

# Part 3 · Website guideline

How the Ivory Press brand looks and moves on Sahil's website, landing pages and portfolio. Same palette and families as the platform, with bigger type, more air, and a defined motion system.

Light only: no dark bands, dark footers or dark cards.

---

## 1. Layout

- Max width 1040px, side padding 24px (16px on phones).
- 96px between sections (64px on phones); hero top spacing 128px (64px on phones).
- Text blocks max 60 characters wide.

## 2. Type scale

| Style | Size / line | Weight | Family | Use |
|---|---|---|---|---|
| `web-display` | 88 / 88 (48 / 50 on phones) | 400 | Newsreader | Hero headline |
| `web-h1` | 56 / 60 (36 on phones) | 400 | Newsreader | Section titles |
| `web-h2` | 40 / 46 (30 on phones) | 400 | Newsreader | Sub-sections, contact |
| `web-h3` | 20 / 28 | 600 | IBM Plex Sans | Card titles |
| `web-lead` | 19 / 30 | 400 | IBM Plex Sans | Intro paragraphs |
| `web-body` | 17 / 28 | 400 | IBM Plex Sans | Running text |
| `web-eyebrow` | 12 / 16 | 400 | IBM Plex Mono | Line above a headline |

- Accent: No coloured words: the second clause turns `sepia` instead.
- Eyebrow: Plex Mono 12px `sepia`, led by a brass §: `§ full stack ai engineer · dubai`.

## 3. Page anatomy

### Navigation

- 72px, `ivory`, 1px `rule` bottom. Left: wordmark. Right: links in Plex Sans 14 `sepia` and a text link "Write to me →" in oxblood (no filled button in the nav).

### Hero

- Full-bleed `ivory`. A brass § eyebrow, then a two-tone Newsreader headline across 10 columns, a lead paragraph at 62 characters, a double rule, and one primary button.

### Section header

- `§ 02` in brass + `web-h1` two-tone headline, then a double rule across the full width.

### Work cards

- No boxed cards: work is listed as plates in two columns, each with a framed screenshot, a Plex Mono caption, a Newsreader 26px title and two lines of `sepia`. Hover: title turns `oxblood`.

### Notes / writing list

- An index: date in Plex Mono, Newsreader 24px title, 1px rules between rows. Hover: title oxblood.

### Contact

- Ivory section with a double rule above, `web-h2` headline, the email set large in Newsreader as selectable text, and a Copy button.

### Footer

- `ivory`, double rule on top, colophon line in Plex Mono (`set in newsreader & plex · dubai`).

## 4. Motion system

The website has **one orchestrated moment per page** (the hero) plus small responses to the user. Nothing else moves.

### Tokens

| Token | Value | Use |
|---|---|---|
| `duration-fast` | 150ms | Hover colour changes |
| `duration-base` | 220ms | Menus, accordions |
| `duration-reveal` | 700ms | Section fade-up |
| `duration-hero` | 900ms | Hero layers |
| `stagger` | 120ms | Delay between headline parts |
| Easing | `cubic-bezier(.2, .7, 0, 1)` | All reveals |

### The hero sequence (in order)

| Time | What happens | Spec |
|---|---|---|
| 0ms | Rule draws | The double rule draws from left to right, 900ms |
| 100ms | Headline sets | Lines fade in from 0 → 1 with letter-spacing .02em → -0.01em, 700ms, 120ms per line |
| 800ms | Sepia settles | The second clause turns from `ink` to `sepia` over 600ms |
| ~1200ms | Done | Lead and button were visible from the first frame |

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
<header class="ipw-hero"><p class="ip-eyebrow">full stack ai engineer · dubai</p><h1 class="ipw-display"><span class="line" style="--i:0">Backend systems, built with care.</span> <em class="line" style="--i:1">And AI where it actually helps.</em></h1><div class="ipw-rule"></div>…</header>
```

## 5. Checklist for every page

- [ ] Light only, no dark bands
- [ ] Headlines follow the accent rule (No coloured words: the second clause turns `sepia` instead)
- [ ] Eyebrow above key headlines
- [ ] Signature details only where Part 1 allows them
- [ ] One hero motion sequence; everything readable before it plays
- [ ] Hover responses at 150ms
- [ ] Reduced motion respected
- [ ] One primary button per section


---

# Part 4 · Code

Copy each block into its own file, exactly as written. Component classes use the `.ip-` prefix (platform) and `.ipw-` (website).

## tokens.css

```css
/* Ivory Press tokens · Sahil Shaikh. Light only: there is no dark theme. */
:root {
  color-scheme: light;
  --ivory: #faf8f3;
  --white: #ffffff;
  --vellum: #f2eee5;
  --rule: #e7e1d6;
  --rule-strong: #8f8778;
  --ink: #1b1a17;
  --ink-secondary: #3b3832;
  --sepia: #6a6359;
  --placeholder: #706960;
  --oxblood: #8c2f2b;
  --oxblood-hover: #73241f;
  --oxblood-soft: #f7e7e4;
  --oxblood-text: #7a2723;
  --on-oxblood: #ffffff;
  --brass: #b88a1e;
  --brass-soft: #fbf1d9;
  --brass-text: #7a5a0e;
  --success: var(--oxblood-text);
  --success-soft: var(--oxblood-soft);
  --warning: #8a5a00;
  --warning-soft: #fff4dc;
  --danger: #b42318;
  --danger-soft: #fdeceb;
  --chart-1: #8c2f2b;
  --chart-2: #c98e89;
  --chart-3: #c9c2b4;
  --chart-highlight: #b88a1e;
  --shadow-pop: 0 4px 12px -2px #1b1a1714, 0 2px 4px -2px #1b1a170f;
  --shadow-modal: 0 20px 48px -12px #1b1a172e, 0 4px 8px -4px #1b1a1714;
  --focus-ring: 0 0 0 2px #ffffff, 0 0 0 4px #8c2f2b;
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
  --radius-sm: 4px;
  --radius-md: 6px;
  --radius-lg: 8px;
  --radius-full: 9999px;
  --control-sm: 28px;
  --control-md: 34px;
  --control-lg: 40px;
  --row-height: 44px;
  --topbar-height: 56px;
  --sidebar-width: 232px;
  --content-max: 1200px;
  --site-max: 1040px;
  --mark-size: 8px;
  --icon-md: 16px;
  --icon-lg: 20px;
  --duration-fast: 150ms;
  --duration-base: 220ms;
  --duration-reveal: 700ms;
  --duration-hero: 900ms;
  --stagger: 120ms;
  --opacity-disabled: 0.45;
  --ease-reveal: cubic-bezier(.2, .7, 0, 1);
  --font-display: Newsreader, "Iowan Old Style", Georgia, serif;
  --font-ui: "IBM Plex Sans", "Segoe UI", system-ui, sans-serif;
  --font-mono: "IBM Plex Mono", ui-monospace, Menlo, monospace;
}
.ui-page-title { font-family: var(--font-display); font-size: 32px; line-height: 36px; font-weight: 400; letter-spacing: -0.01em;  }
.ui-numeric { font-family: var(--font-display); font-size: 36px; line-height: 40px; font-weight: 400; letter-spacing: -0.01em; font-variant-numeric: tabular-nums;  }
.ui-heading { font-family: var(--font-ui); font-size: 16px; line-height: 24px; font-weight: 600; letter-spacing: -0.01em; }
.ui-subheading { font-family: var(--font-ui); font-size: 14px; line-height: 20px; font-weight: 600; }
.ui-body { font-family: var(--font-ui); font-size: 14px; line-height: 20px; font-weight: 400; }
.ui-body-lg { font-family: var(--font-ui); font-size: 16px; line-height: 24px; font-weight: 400; }
.ui-label { font-family: var(--font-ui); font-size: 13px; line-height: 18px; font-weight: 500; }
.ui-small { font-family: var(--font-ui); font-size: 12px; line-height: 16px; font-weight: 400; }
.ui-meta { font-family: var(--font-mono); font-size: 11px; line-height: 16px; font-weight: 400; }
.web-display { font-family: var(--font-display); font-size: 88px; line-height: 88px; font-weight: 400; letter-spacing: -0.01em;  }
.web-h1 { font-family: var(--font-display); font-size: 56px; line-height: 60px; font-weight: 400; letter-spacing: -0.01em;  }
.web-h2 { font-family: var(--font-display); font-size: 40px; line-height: 46px; font-weight: 400; letter-spacing: -0.01em;  }
.web-h3 { font-family: var(--font-ui); font-size: 20px; line-height: 28px; font-weight: 600; letter-spacing: -0.01em; }
.web-lead { font-family: var(--font-ui); font-size: 19px; line-height: 30px; font-weight: 400; }
.web-body { font-family: var(--font-ui); font-size: 17px; line-height: 28px; font-weight: 400; }
.web-eyebrow { font-family: var(--font-mono); font-size: 12px; line-height: 16px; font-weight: 400; }
/* Platform UI never animates: wrap the app in .ip-app */
.ip-app, .ip-app * { transition: none !important; animation: none !important; }
@media (max-width: 760px) { .web-display { font-size: 48px; line-height: 50px; } .web-h1 { font-size: 36px; line-height: 40px; } .web-h2 { font-size: 30px; line-height: 34px; } }
```

## components.css

```css
/* Ivory Press · components.css — reference styles for every component (.ip-* platform, shared by the website). Requires tokens.css. */
@import url("https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;1,6..72,400&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap");
/* Ivory Press components. .ip-* = platform UI (no motion). .ipw-* = website (motion allowed). */
body { margin: 0; font-family: var(--font-ui); font-size: 14px; line-height: 20px; color: var(--ink); background: var(--ivory); -webkit-font-smoothing: antialiased; }
.ip-pad { padding: var(--space-5); }
.ip-row { display: flex; flex-wrap: wrap; align-items: center; gap: var(--space-3); }
.ip-col { display: grid; gap: var(--space-4); }
.ip-grid { display: grid; gap: var(--space-4); grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); }
.ip-meta { font-family: var(--font-mono); font-size: 11px; line-height: 16px; color: var(--sepia); }
.ip-eyebrow { display: inline-flex; align-items: center; gap: var(--space-2); font-family: var(--font-mono); font-size: 11px; line-height: 16px; color: var(--sepia); }
.ip-num { font-variant-numeric: tabular-nums; }
.ip-app, .ip-app * { transition: none !important; animation: none !important; }
:where(.ip-btn, .ip-input, .ip-select, .ip-textarea, .ip-tab, .ip-seg button, .ip-nav a, .ip-check input, .ip-toggle input):focus-visible { outline: 2px solid transparent; box-shadow: var(--focus-ring); }


/* Buttons */
.ip-btn { font: inherit; font-size: 13px; line-height: 18px; font-weight: 500; height: var(--control-md); padding: 0 var(--space-3); display: inline-flex; align-items: center; justify-content: center; gap: 6px; border-radius: var(--radius-sm); border: 1px solid transparent; cursor: pointer; white-space: nowrap; text-decoration: none; background: transparent; color: var(--ink); }
.ip-btn svg { width: var(--icon-md); height: var(--icon-md); }
.ip-btn-sm { height: var(--control-sm); padding: 0 10px; font-size: 12px; }
.ip-btn-lg { height: var(--control-lg); padding: 0 var(--space-4); font-size: 14px; }
.ip-btn-primary { background: var(--oxblood); color: var(--on-oxblood); }
.ip-btn-primary:hover { background: var(--oxblood-hover); }
.ip-btn-secondary { background: var(--white); border-color: var(--rule-strong); }
.ip-btn-secondary:hover { background: var(--vellum); }
.ip-btn-ghost { color: var(--ink-secondary); }
.ip-btn-ghost:hover { background: var(--vellum); color: var(--ink); }
.ip-btn-danger { background: var(--danger); color: #ffffff; }
.ip-btn[disabled] { opacity: var(--opacity-disabled); cursor: not-allowed; }
.ip-icon { fill: none; stroke: currentColor; stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; width: var(--icon-md); height: var(--icon-md); flex: none; }

/* Fields */
.ip-field { display: grid; gap: 6px; min-width: 0; }
.ip-label { font-size: 13px; line-height: 18px; font-weight: 500; color: var(--ink-secondary); }
.ip-input, .ip-select, .ip-textarea { font: inherit; font-size: 14px; width: 100%; box-sizing: border-box; height: var(--control-md); padding: 0 var(--space-3); border-radius: var(--radius-sm); border: 1px solid var(--rule-strong); background: var(--white); color: var(--ink); }
.ip-textarea { height: 88px; padding-block: 8px; resize: vertical; }
.ip-select { appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='none' stroke='%236a6359' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m4 6 4 4 4-4'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 10px center; padding-right: 34px; }
.ip-input::placeholder, .ip-textarea::placeholder { color: var(--placeholder); }
.ip-input:focus, .ip-select:focus, .ip-textarea:focus, .ip-input.is-focus { outline: none; border-color: var(--oxblood); box-shadow: var(--focus-ring); }
.ip-input.is-error { border-color: var(--danger); }
.ip-help { margin: 0; font-size: 12px; line-height: 16px; color: var(--sepia); }
.ip-help.is-error { color: var(--danger); }
.ip-check { display: inline-flex; align-items: center; gap: 10px; font-size: 14px; color: var(--ink-secondary); cursor: pointer; }
.ip-check input { appearance: none; margin: 0; width: 16px; height: 16px; border: 1px solid var(--rule-strong); border-radius: var(--radius-xs); background: var(--white); display: grid; place-items: center; cursor: pointer; }
.ip-check input:checked { background: var(--oxblood); border-color: var(--oxblood); }
.ip-check input:checked::after { content: ""; width: 4px; height: 8px; border: solid #ffffff; border-width: 0 2px 2px 0; transform: translateY(-1px) rotate(45deg); }
.ip-check input[type="radio"] { border-radius: 50%; }
.ip-check input[type="radio"]:checked { background: var(--white); border-color: var(--oxblood); }
.ip-check input[type="radio"]:checked::after { width: 8px; height: 8px; border: 0; border-radius: 50%; background: var(--oxblood); transform: none; }
.ip-toggle { display: inline-flex; align-items: center; gap: 10px; font-size: 14px; color: var(--ink-secondary); cursor: pointer; }
.ip-toggle input { appearance: none; margin: 0; width: 32px; height: 18px; border-radius: var(--radius-full); background: var(--rule-strong); position: relative; cursor: pointer; }
.ip-toggle input::after { content: ""; position: absolute; top: 2px; left: 2px; width: 14px; height: 14px; border-radius: 50%; background: #ffffff; }
.ip-toggle input:checked { background: var(--oxblood); }
.ip-toggle input:checked::after { left: 16px; }

/* Badges */
.ip-badge { display: inline-flex; align-items: center; gap: 6px; height: 22px; padding: 0 var(--space-2); border-radius: var(--radius-xs); font-size: 12px; line-height: 16px; font-weight: 500; background: var(--vellum); color: var(--sepia); white-space: nowrap; }
.ip-badge.dot::before { content: ""; width: 6px; height: 6px; background: currentColor; }
.ip-badge-done { background: var(--success-soft); color: var(--success); }
.ip-badge-live { background: var(--brass-soft); color: var(--brass-text); }
.ip-badge-warn { background: var(--warning-soft); color: var(--warning); }
.ip-badge-fail { background: var(--danger-soft); color: var(--danger); }
.ip-badge-mono { font-family: var(--font-mono); font-size: 11px; font-weight: 400; background: var(--white); border: 1px solid var(--rule); color: var(--ink-secondary); }

/* Tabs and segmented */
.ip-tabs { display: flex; gap: var(--space-5); border-bottom: 1px solid var(--rule); }
.ip-tab { font: inherit; background: none; border: 0; padding: 0; height: 36px; font-family: var(--font-mono); font-size: 11px; color: var(--sepia); border-bottom: 2px solid transparent; margin-bottom: -1px; cursor: pointer; }
.ip-tab:hover { color: var(--ink); }
.ip-tab[aria-selected="true"] { color: var(--ink); border-bottom-color: var(--ink); }
.ip-seg { display: inline-flex; gap: 2px; padding: 3px; background: var(--vellum); border-radius: var(--radius-sm); }
.ip-seg button { font: inherit; font-size: 13px; font-weight: 500; border: 1px solid transparent; background: none; color: var(--sepia); height: 28px; padding: 0 12px; border-radius: 4px; cursor: pointer; }
.ip-seg button[aria-pressed="true"] { background: var(--white); color: var(--ink); border-color: var(--rule); }

/* Cards and KPIs */
.ip-card { background: var(--white); border: 1px solid var(--rule); border-radius: var(--radius-md); padding: var(--space-5); min-width: 0; }
.ip-card-head { display: flex; justify-content: space-between; align-items: center; gap: var(--space-3); margin-bottom: var(--space-4); }
.ip-card-title { margin: 0; font-size: 16px; line-height: 24px; font-weight: 600; letter-spacing: -.01em; }
.ip-kpi-value { font-family: var(--font-display); font-size: 36px; line-height: 40px; font-weight: 400; letter-spacing: -0.01em; font-variant-numeric: tabular-nums; margin-top: var(--space-2); }
.ip-delta { font-size: 12px; line-height: 16px; font-weight: 500; color: var(--success); margin-top: var(--space-1); }
.ip-delta.warn { color: var(--warning); } .ip-delta.down { color: var(--danger); }

/* Table */
.ip-table-wrap { background: var(--white); border: 1px solid var(--rule); border-radius: var(--radius-md); overflow-x: auto; }
.ip-table { width: 100%; border-collapse: collapse; font-size: 14px; }
.ip-table th { height: 36px; padding: 0 var(--space-3); text-align: left; background: var(--vellum); border-bottom: 1px solid var(--rule); font-family: var(--font-mono); font-size: 11px; font-weight: 400; color: var(--sepia); white-space: nowrap; }
.ip-table td { height: var(--row-height); padding: 0 var(--space-3); border-bottom: 1px solid var(--rule); color: var(--ink-secondary); white-space: nowrap; }
.ip-table tbody tr:last-child td { border-bottom: 0; }
.ip-table tbody tr { cursor: pointer; }
.ip-table tbody tr:hover td { background: var(--ivory); }
.ip-table tbody tr[aria-selected="true"] td { background: var(--oxblood-soft); }
.ip-table tbody tr[aria-selected="true"] td:first-child { box-shadow: inset 2px 0 0 var(--oxblood); }
.ip-table .r { text-align: right; font-variant-numeric: tabular-nums; }
.ip-table .strong { color: var(--ink); font-weight: 500; }
.ip-table .id { font-family: var(--font-mono); font-size: 11px; color: var(--sepia); }
.ip-table-foot { display: flex; justify-content: space-between; gap: var(--space-3); padding: 10px var(--space-3); border-top: 1px solid var(--rule); font-size: 12px; color: var(--sepia); }

/* App shell */
.ip-app { display: grid; grid-template-columns: var(--sidebar-width) minmax(0, 1fr); min-height: 640px; background: var(--white); font-size: 14px; }
.ip-side { background: var(--ivory); border-right: 1px solid var(--rule); padding: var(--space-4) 10px; display: flex; flex-direction: column; gap: var(--space-5); }
.ip-brand { display: flex; align-items: center; gap: var(--space-2); padding: 0 6px; font-family: var(--font-display); font-size: 20px; line-height: 24px; color: var(--ink); }
.ip-nav { display: grid; gap: 2px; }
.ip-nav .ip-meta { padding: 0 8px 6px; }
.ip-nav a { display: flex; align-items: center; gap: 10px; height: 30px; padding: 0 8px; border-radius: var(--radius-sm); font-size: 13px; font-weight: 500; color: var(--ink-secondary); text-decoration: none; cursor: pointer; }
.ip-nav a .ip-icon { color: var(--sepia); }
.ip-nav a:hover { background: var(--white); color: var(--ink); }
.ip-nav a[aria-current="page"] { background: var(--oxblood-soft); color: var(--oxblood-text); }
.ip-nav a[aria-current="page"] .ip-icon { color: var(--oxblood-text); }
.ip-nav .count { margin-left: auto; font-family: var(--font-mono); font-size: 10px; color: var(--sepia); }
.ip-main { min-width: 0; display: flex; flex-direction: column; }
.ip-top { height: var(--topbar-height); border-bottom: 1px solid var(--rule); display: flex; align-items: center; gap: var(--space-3); padding: 0 var(--space-6); }
.ip-top .ip-input { max-width: 320px; }
.ip-top .right { margin-left: auto; display: flex; gap: var(--space-2); align-items: center; }
.ip-avatar { width: 30px; height: 30px; border-radius: 50%; background: var(--ivory); border: 1px solid var(--rule); display: grid; place-items: center; font-size: 11px; font-weight: 600; color: var(--ink-secondary); }
.ip-page { padding: var(--space-6); display: grid; gap: var(--space-6); max-width: var(--content-max); }
.ip-page-head { display: flex; justify-content: space-between; align-items: flex-end; gap: var(--space-4); flex-wrap: wrap; }
.ip-page-title { margin: 2px 0 0; font-family: var(--font-display); font-size: 32px; line-height: 36px; font-weight: 400; letter-spacing: -0.01em; }
.ip-page-sub { margin: var(--space-1) 0 0; color: var(--sepia); }

/* Modal, toast, banner, empty */
.ip-backdrop { background: rgba(27, 26, 23, .2); padding: var(--space-6); display: grid; place-items: center; }
.ip-modal { width: 100%; max-width: 440px; background: var(--white); border: 1px solid var(--rule); border-radius: var(--radius-lg); box-shadow: var(--shadow-modal); }
.ip-modal-head { display: flex; justify-content: space-between; gap: var(--space-3); padding: var(--space-5) var(--space-5) 0; }
.ip-modal-title { margin: 0; font-family: var(--font-display); font-size: 24px; line-height: 30px; font-weight: 400; }
.ip-modal-body { padding: var(--space-5); display: grid; gap: var(--space-4); }
.ip-modal-foot { display: flex; justify-content: flex-end; gap: var(--space-2); padding: var(--space-4) var(--space-5); border-top: 1px solid var(--rule); }
.ip-toast { display: inline-flex; align-items: center; gap: var(--space-3); padding: 12px var(--space-4); background: var(--white); border: 1px solid var(--rule); border-radius: var(--radius-lg); box-shadow: var(--shadow-pop); font-weight: 500; }
.ip-toast .ip-icon { color: var(--oxblood); }
.ip-banner { display: flex; align-items: center; gap: var(--space-3); padding: 12px var(--space-4); border-radius: var(--radius-md); font-size: 14px; }
.ip-banner .grow { flex: 1; }
.ip-banner-warn { background: var(--warning-soft); color: var(--warning); }
.ip-banner-fail { background: var(--danger-soft); color: var(--danger); }
.ip-banner-info { background: var(--oxblood-soft); color: var(--oxblood-text); }
.ip-empty { position: relative; overflow: hidden; text-align: center; padding: var(--space-12) var(--space-6); background: var(--white); border: 1px solid var(--rule); border-radius: var(--radius-md); }
.ip-empty > * { position: relative; }
.ip-empty .ip-icon { width: 20px; height: 20px; color: var(--sepia); }
.ip-empty h3 { margin: var(--space-3) 0 var(--space-1); font-size: 16px; line-height: 24px; font-weight: 600; }
.ip-empty p { margin: 0 auto var(--space-4); max-width: 40ch; color: var(--sepia); }
.ip-skel { background: var(--vellum); border-radius: 4px; height: 12px; }

/* Signature details */
.ip-mark { display: inline-block; color: var(--brass); font-family: var(--font-display); flex: none; }
.ip-eyebrow::before { content: "§"; color: var(--brass); font-family: var(--font-display); font-size: 14px; }
.ip-accent { color: var(--sepia); }
.ip-empty::before { content: ""; position: absolute; left: 10%; right: 10%; top: 24px; height: 5px; border-top: 1px solid var(--rule); border-bottom: 1px solid var(--rule); }
/* Double rule and section marks (signature) */
.ip-double { border: 0; height: 5px; border-top: 1px solid var(--rule-strong); border-bottom: 1px solid var(--rule-strong); margin: var(--space-4) 0; }
.ip-section::before { content: "§ "; color: var(--brass); }
.ip-two { color: var(--ink); } .ip-two span { color: var(--sepia); }
```

## motion.css (website only)

```css
/* Ivory Press · motion.css — WEBSITE ONLY. Never load inside the platform UI. Requires tokens.css. */
/* ---------------- Website ---------------- */
.fw { font-size: 17px; line-height: 28px; background: var(--ivory); }
.ipw-wrap { max-width: var(--site-max); margin: 0 auto; padding: 0 var(--space-6); }
.ipw-nav { display: flex; align-items: center; justify-content: space-between; height: 72px; }
.ipw-logo { display: flex; align-items: center; gap: var(--space-2); font-family: var(--font-display); font-size: 22px; line-height: 28px; color: var(--ink); text-decoration: none; }
.ipw-links { display: flex; align-items: center; gap: var(--space-6); font-size: 14px; font-weight: 500; color: var(--sepia); }
.ipw-links a { color: inherit; text-decoration: none; transition: color 150ms ease-out; }
.ipw-links a:hover { color: var(--ink); }
.ipw-links a[aria-current="page"] { color: var(--ink); text-decoration: underline; text-underline-offset: 6px; text-decoration-thickness: 1px; }
.fw .ip-btn { transition: background-color 150ms ease-out; }
.fw .ip-btn .arr { display: inline-block; transition: transform 150ms ease-out; }
.fw .ip-btn:hover .arr, .ipw-card:hover .arr { transform: translateX(3px); }
.ipw-display { margin: 0; font-family: var(--font-display); font-weight: 400; font-size: 88px; line-height: 84px; letter-spacing: -0.01em; max-width: 13ch; color: var(--ink); }
.ipw-display .w { display: inline-block; }
.ipw-lead { margin: var(--space-5) 0 var(--space-8); max-width: 44ch; font-size: 19px; line-height: 30px; color: var(--sepia); }
.ipw-cta { display: flex; gap: var(--space-3); flex-wrap: wrap; }
.ipw-sec-head { display: flex; justify-content: space-between; align-items: flex-end; gap: var(--space-4); flex-wrap: wrap; margin-bottom: var(--space-8); }
.ipw-h1 { margin: var(--space-3) 0 0; font-family: var(--font-display); font-weight: 400; font-size: 56px; line-height: 58px; letter-spacing: -0.01em; }
.ipw-h2 { margin: 0; font-family: var(--font-display); font-weight: 400; font-size: 40px; line-height: 44px; letter-spacing: -0.01em; }
.ipw-cards { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: var(--space-6); }
.ipw-card { display: flex; flex-direction: column; gap: var(--space-2); padding: var(--space-6); background: var(--white); border: 1px solid var(--rule); border-radius: var(--radius-md); text-decoration: none; color: var(--ink); min-width: 0; }
.ipw-shot { aspect-ratio: 16/10; border-radius: var(--radius-sm); background: var(--ivory); border: 1px solid var(--rule); margin-bottom: var(--space-3); padding: 12px; display: grid; gap: 8px; align-content: start; }
.ipw-shot span { height: 8px; border-radius: 4px; background: var(--vellum); }
.ipw-card h3 { margin: 0; font-size: 20px; line-height: 28px; font-weight: 600; letter-spacing: -.01em; display: flex; justify-content: space-between; transition: color 150ms ease-out; }
.ipw-card:hover h3 { color: var(--oxblood); }
.ipw-card p { margin: 0; font-size: 15px; line-height: 24px; color: var(--sepia); }
.ipw-card .tags { display: flex; gap: var(--space-2); flex-wrap: wrap; margin-top: var(--space-3); }
.ipw-notes { display: grid; }
.ipw-note { display: grid; grid-template-columns: 120px minmax(0, 1fr); gap: var(--space-4); padding: var(--space-5) 0; border-bottom: 1px solid var(--rule); text-decoration: none; color: var(--ink); }
.ipw-note b { display: block; font-family: var(--font-display); font-weight: 400; font-size: 24px; line-height: 30px; transition: color 150ms ease-out; }
.ipw-note:hover b { color: var(--oxblood); }
.ipw-note span { color: var(--sepia); font-size: 15px; }
@media (max-width: 760px) {
  .ipw-display { font-size: 48px; line-height: 48px; } .ipw-h1 { font-size: 36px; line-height: 40px; } .ipw-h2 { font-size: 30px; line-height: 34px; }
  .ipw-cards { grid-template-columns: 1fr; } .ipw-links { display: none; } .ipw-hero { padding: var(--space-5) var(--space-5) var(--space-10); }
  .ipw-note { grid-template-columns: 1fr; gap: var(--space-1); }
  .ip-app { grid-template-columns: 1fr; } .ip-side { display: none; }
}

/* Accent word */
.ipw-display em, .ipw-h1 em, .ipw-h2 em { font-style: normal; color: var(--sepia); }

/* Hero (signature) */
.ipw-hero { padding: var(--space-24) 0 var(--space-16); }
.ipw-rule { height: 5px; border-top: 1px solid var(--rule-strong); border-bottom: 1px solid var(--rule-strong); margin: var(--space-8) 0; transform-origin: left; }
.ipw-display .line { display: block; }

@media (prefers-reduced-motion: no-preference) {
  .ipw-play .ipw-rule { animation: ipw-draw 900ms var(--ease-reveal) both; }
  @keyframes ipw-draw { from { transform: scaleX(0); } to { transform: none; } }
  .ipw-play .ipw-display .line { animation: ipw-set 700ms var(--ease-reveal) both; animation-delay: calc(100ms + var(--i) * 120ms); }
  @keyframes ipw-set { from { opacity: 0; letter-spacing: .02em; } to { opacity: 1; letter-spacing: -0.01em; } }
  .ipw-play .ipw-display em { animation: ipw-tone 600ms ease-out 800ms both; }
  @keyframes ipw-tone { from { color: var(--ink); } to { color: var(--sepia); } }
  .ipw-fade.ipw-in { animation: ipw-up var(--duration-reveal) var(--ease-reveal) both; }
  @keyframes ipw-up { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
}

/* Usage
   1. Hero markup: <header class="ipw-hero"><p class="ip-eyebrow">full stack ai engineer · dubai</p><h1 class="ipw-display"><span class="line" style="--i:0">Backend systems, built with care.</span> <em class="line" style="--i:1">And AI where it actually helps.</em></h1><div class="ipw-rule"></div>…</header>
   2. Split the headline into <span class="w" style="--i:N"> words (or lines), then add .ipw-play to the hero once it is in view.
   3. Section titles: add .ipw-fade; add .ipw-in when they first enter the viewport.
   Everything is visible before and without the script; prefers-reduced-motion turns all of it off. */
```

## tailwind-theme.css (only if the project uses Tailwind v4)

```css
@import "tailwindcss";
/* Ivory Press · Tailwind v4 theme. Load tokens.css first. Light only. */
@theme inline {
  --color-ivory: var(--ivory);
  --color-white: var(--white);
  --color-vellum: var(--vellum);
  --color-rule: var(--rule);
  --color-rule-strong: var(--rule-strong);
  --color-ink: var(--ink);
  --color-ink-secondary: var(--ink-secondary);
  --color-sepia: var(--sepia);
  --color-placeholder: var(--placeholder);
  --color-oxblood: var(--oxblood);
  --color-oxblood-hover: var(--oxblood-hover);
  --color-oxblood-soft: var(--oxblood-soft);
  --color-oxblood-text: var(--oxblood-text);
  --color-on-oxblood: var(--on-oxblood);
  --color-brass: var(--brass);
  --color-brass-soft: var(--brass-soft);
  --color-brass-text: var(--brass-text);
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

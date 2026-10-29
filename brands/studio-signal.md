# STUDIO-SIGNAL.md · Sahil Shaikh brand (all-in-one)

**For Claude Code:** this single file contains the whole Studio Signal system: brand rules, platform UI rules (no animation), website rules (with motion), and the complete CSS. Put it in the project root and add this line to `CLAUDE.md`:

```
All UI follows STUDIO-SIGNAL.md. Before writing UI, create tokens.css, components.css (and motion.css for website pages) from Part 4 if they don't exist, then use only their variables and classes. Light only, never dark. Platform UI has no animation.
```

## How Claude Code should use this file

1. Decide the surface: **Platform UI** (app, dashboard, admin, settings) or **Website** (marketing, portfolio, landing). If unclear, assume Platform UI.
2. If `tokens.css` and `components.css` don't exist in the project, create them by copying the code blocks in Part 4 exactly. For website pages also create `motion.css`. With Tailwind v4 also create `tailwind-theme.css`.
3. Load the Google Fonts in Part 1, section 5.
4. Never hard-code colours, font sizes or fonts. Never add dark mode or dark sections.
5. Platform UI: wrap the app in `class="ss-app"` (kills all motion). Website: follow Part 3, section 4.
6. Finish by running the checklist at the end of Part 2 or Part 3.

---

Sahil Shaikh's brand and design system, **Studio Signal**. Part 1 is the brand foundations, Part 2 the platform UI rules (no animation), Part 3 the website rules (with motion), Part 4 the code.

*Researched from: Stripe, Mercury, Linear's marketing type. Inspired by, not copied from: no logos, fonts or assets of those products are used.*

---

# Part 1 · Brand foundations

The brand of Sahil Shaikh, Full Stack AI Engineer. **Studio Signal**: a financial studio's signal: light, precise type, an iris line, and one coral flare. It covers every platform Sahil designs and his website.

This system has three parts:

1. **Brand foundations** (Part 1): idea, logo, colour, type, layout, shape, icons, imagery, voice and accessibility.
2. **Platform UI** (Part 2): rules for any app, dashboard or tool. **No animation.**
3. **Website** (Part 3): the same brand with larger type and a defined motion system.

Light only. There is no dark theme, and no dark sections, panels or backgrounds anywhere.

---

## 1. The idea

| | |
|---|---|
| **Metaphor** | A financial studio's signal: light, precise type, an iris line, and one coral flare. |
| **Personality** | Sophisticated, technical, confident without shouting. |
| **Feeling we want** | "This is infrastructure-grade work." |
| **Three ingredients** | **Light type** (Manrope 300 headlines in two tones) · **Iris** (one violet-blue for action) · **Ribbon** (a single iris-to-flare band on the website) |

## 2. Principles

1. **Canvas and white.** Pages on cool `canvas`, panels `white`, hairline `rule` borders.
2. **Light headlines.** Manrope 300 at large sizes; weight carries no drama, the words do.
3. **Two tones.** Headline starts in `ink`, continues in `steel`.
4. **Iris acts, flare signals.** Iris for actions and focus; coral flare only for live or new.
5. **Precision details.** 4px radii, tabular numbers, aligned decimals, mono for codes.
6. **One ribbon.** The website hero has one diagonal iris-to-flare ribbon. The product has none.
7. **Accessible always.** Text 4.5:1 or better, borders and indicators 3:1, focus always visible.

## 3. Logo

- **Wordmark:** "sahil shaikh" in Manrope 500 lowercase, `ink`, with a 2px × 14px iris bar before it.
- **Product mark:** the iris bar + product name in Manrope 500.
- **App icon / avatar:** a `white` square, 6px radius, 1px `rule`, a Manrope 300 "s" and a short iris bar.
- **Clear space:** the cap height. **Minimum size:** wordmark 96px; icon 20px.
- **Never:** bold the wordmark, put it on the ribbon, recolour the bar.

## 4. Colour

### Core palette

| Token | Hex | Role |
|---|---|---|
| `canvas` | #F7F8FB | Page ground, sidebar, website background |
| `white` | #FFFFFF | Cards, tables, inputs, modals |
| `haze` | #EEF0F6 | Hover rows, table headers, code blocks |
| `rule` | #E3E6EE | Dividers and borders |
| `rule-strong` | #8890A3 | Input borders, strong dividers |
| `ink` | #0F1222 | Headings, primary text |
| `ink-secondary` | #2E3346 | Labels, nav, table text |
| `steel` | #565E78 | Second headline tone, secondary text |
| `placeholder` | #646C84 | Placeholders, disabled text |
| `iris` | #4F3CF7 | Primary action, links, focus, charts |
| `iris-hover` | #3F2EDB | Hover/pressed iris |
| `iris-soft` / `iris-text` | #ECEAFE / #3A2BC4 | Selected, active, success |
| `flare` | #FF6B4A | Live, new, the ribbon's warm end |
| `flare-soft` / `flare-text` | #FFEDE8 / #A63A1F | Soft flare badges |
| `warning` / `warning-soft` | #8A5A00 / #FFF4DC | Needs attention |
| `danger` / `danger-soft` | #B42318 / #FDECEB | Errors, destructive |

### Charts

`chart-1` iris #4F3CF7, `chart-2` #A99EFB, `chart-3` #C4C9D6, and `chart-highlight` flare #FF6B4A for the one value that matters. Gridlines use `rule`, axis labels use `ui-meta` in `steel`.

### Proportions

About 58% canvas, 30% white, 8% type and lines, 3% iris, 1% flare.

### Rules

- Iris is the only colour on buttons and links. One filled iris button per view.
- Flare is a signal: live dots, "New" badges, the ribbon end. Never body text on white.
- One gradient in the whole system: the website ribbon (iris → flare). None in the product.
- Numbers in tables are `ink`, never coloured; deltas use words and arrows.
- Never use `ink` or `steel` as a background.

## 5. Typography

Three roles, all free on Google Fonts:

`https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap`

| Family | Role | Use | Weights |
|---|---|---|---|
| **Manrope** | **The voice** | Page titles, big numbers, website headlines (300) | 300, 500 |
| **Manrope** | **The clarity** | All UI and body text | 400, 500, 600 |
| **JetBrains Mono** | **The precision** | Codes, IDs, API paths, column headers | 400, 500 |

- **Two-tone rule:** headlines begin in `ink` and continue in `steel` after the first full stop.
- Display weight is always 300; UI headings 600. Nothing in between for titles.
- Amounts: tabular, right-aligned, currency code before (`AED 1,250.00`).
- Sentence case. No ALL CAPS.
- Full scales are in Part 2 (platform) and Part 3 (website).

## 6. Layout and spacing

- **4px grid:** 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 96, 128.
- **Platform:** sidebar on `canvas`, content on `white`, 24px page padding, max 1200px.
- **Website:** 1160px max width, 96px between sections.
- Align to a left edge in the product. Centre only short single lines (an empty state).

## 7. Shape and depth

| Token | Value | Use |
|---|---|---|
| `radius-xs` | 3px | Badges, checkboxes |
| `radius-sm` | 4px | Buttons, inputs |
| `radius-md` | 6px | Cards, tables, menus |
| `radius-lg` | 10px | Modals, website panels |
| `radius-full` | 9999px | Toggles, dots |

- **Iris line** (signature): the active card or panel gets a 2px iris top border. One per screen.
- **Ribbon** (signature, website hero only): a wide diagonal band from iris to flare, 24° angle, softened with a blur.
- Shadows: soft and cool (`shadow-pop`, `shadow-modal`), only for floating things.

## 8. Iconography

- Lucide, 1.5px stroke. 16px in controls. `steel` default, `iris` active.
- Icon-only buttons always have an accessible label.

## 9. Imagery

- Screenshots on white with a 1px `rule` and `radius-lg`, sometimes overlapping the ribbon.
- Diagrams: thin `steel` lines, iris path, one flare node.
- Portrait: neutral background, cool light.

## 10. Voice and writing

- Precise and confident. Numbers over adjectives.
- Lead with what something does: "Agents plan, build and review work together."
- Buttons are verbs: "New project", "Save changes". Confirmations say what happened: "Project created."
- Errors say what went wrong and how to fix it: "Name is required. Add a project name to continue."
- Numbers: "AED 1,250.00", dates "21 Oct 2026", times "14:32".
- No buzzwords, no exclamation marks, no emoji in UI.

## 11. Accessibility

- Every text colour pair passes WCAG AA (4.5:1). Borders, focus rings and indicators pass 3:1.
- Focus ring: 2px white gap + 2px `iris`, on every interactive element.
- Never rely on colour alone; pair it with a word, icon or position.
- Hit targets at least 28px (34px default).
- The website respects `prefers-reduced-motion`: all motion off, content visible immediately.

Measured contrast for this palette:

| Pair | Ratio | Needed |
|---|---|---|
| Body text `ink` on `white` | 18.59:1 | 4.5:1 |
| `steel` on `canvas` | 6.05:1 | 4.5:1 |
| `steel` on `haze` | 5.64:1 | 4.5:1 |
| White on `iris` (primary button) | 6.32:1 | 4.5:1 |
| `iris` links on `white` | 6.32:1 | 4.5:1 |
| `iris-text` on `iris-soft` | 7.65:1 | 4.5:1 |
| `flare-text` on `flare-soft` | 5.71:1 | 4.5:1 |
| `placeholder` on `white` | 5.22:1 | 4.5:1 |
| `rule-strong` borders on `white` | 3.2:1 | 3:1 |
| `ink` on `flare` (mark used as a fill) | 6.6:1 | 4.5:1 |

## 12. Do and don't

| Do | Don't |
|---|---|
| Canvas ground, white panels | Dark backgrounds or dark mode |
| Manrope 300 headlines in two tones | Bold display headlines |
| Iris for action | Iris for decoration |
| Flare as a signal | Flare text or buttons |
| One ribbon on the website | Gradients in the product |
| Iris line on one panel | Coloured borders everywhere |
| Tabular, aligned numbers | Coloured numbers |
| Motion on the website only | Animation in the platform |


---

# Part 2 · Platform UI guideline

Rules for any platform, app, dashboard, admin or internal tool built in the Studio Signal brand. It is generic: it works for projects, CRM, analytics, payments, AI agents or anything else.

**The platform never animates.** State changes are instant. Every rule here assumes light only.

---

## 1. Foundations for the platform

- **Ground:** `canvas` for the app canvas and sidebar. `white` for every working panel (cards, tables, forms, modals).
- **Text:** `ink` for headings and values, `ink-secondary` for labels and nav, `steel` for help text and metadata.
- **Action colour:** `iris`. **Mark:** `flare` (small).
- **Density:** 14px text, 34px controls, 44px rows, 4px grid.

## 2. Type scale

| Style | Size / line | Weight | Family | Use |
|---|---|---|---|---|
| `ui-page-title` | 32 / 36 | 300 | Manrope | Page title, one per screen |
| `ui-numeric` | 36 / 40 | 300 | Manrope | KPI values, big totals |
| `ui-heading` | 16 / 24 | 600 | Manrope | Card, section, modal headings |
| `ui-subheading` | 14 / 20 | 600 | Manrope | Form group titles |
| `ui-body` | **14 / 20** | 400 | Manrope | **Default text** |
| `ui-body-lg` | 16 / 24 | 400 | Manrope | Empty states, onboarding |
| `ui-label` | 13 / 18 | 500 | Manrope | Labels, nav items, buttons |
| `ui-small` | 12 / 16 | 400 | Manrope | Help text, captions |
| `ui-meta` | 11 / 16 | 400 | JetBrains Mono | IDs, timestamps, column headers |

Rules:

- Manrope only for `ui-page-title`, `ui-numeric` and modal titles. Never in buttons, tables, forms, nav or badges.
- Numbers in tables use `font-variant-numeric: tabular-nums` and align right.
- Never below 11px (mono) or 12px (UI).

## 3. App layout

- **Sidebar:** 232px (60px collapsed), `canvas`, 1px `rule` right border, 16px top padding. Product mark at top. Groups titled with `ui-meta`.
- **Top bar:** 56px, `white`, 1px `rule` bottom border. Search left (320px max), actions right.
- **Page header:** breadcrumb in `ui-meta`, then `ui-page-title`, optional one-line description in `steel`. Actions on the right, aligned to the title's baseline.
- **Content:** 24px padding, max width 1200px, 24px gap between blocks, 32px between page sections.
- **Breakpoints:** 640, 768, 1024, 1280. Below 1024 the sidebar becomes a drawer.

## 4. Components

### Buttons

| Variant | Look | Use |
|---|---|---|
| Primary | `iris` fill, `on-iris` text | The one main action per view |
| Secondary | `white` fill, 1px `rule-strong` border, `ink` text | Every other action |
| Ghost | No fill or border, `ink-secondary` text | Toolbars, cancel, low emphasis |
| Danger | `danger` fill, white text | Destructive confirmations only |

- Sizes: 28px (sm), **34px (default)**, 40px (lg). `radius-sm`. `ui-label` 13/500.
- States: hover = instant background change (`iris-hover`, `haze`); focus = `focus-ring`; disabled = `opacity-disabled`.
- Labels are verbs in sentence case: "New project", "Export CSV".

### Text inputs, selects, textareas

- 34px tall, 12px horizontal padding, `radius-sm`, `white` fill, 1px `rule-strong` border, `placeholder` colour for placeholders.
- Label above (`ui-label`, `ink-secondary`), help or error below (`ui-small`), 6px gaps.
- Focus: `iris` border + `focus-ring`. Error: `danger` border and a message saying how to fix it.

### Checkbox, radio, toggle

- Checkbox 16px, `radius-xs`; checked = `iris` fill with white tick. Radio: 8px `iris` dot. Toggle 32 × 18px; on = `iris`.
- The label is always clickable and sits 10px to the right.

### Badges

- 22px tall, 8px padding, `radius-xs`, 12/500.
- Done (`iris-soft`/`iris-text`), Live or new (`flare-soft`/`flare-text`), Needs review (`warning-soft`/`warning`), Failed (`danger-soft`/`danger`), Draft (`haze`/`steel`).

### Tabs and segmented controls

- **Tabs:** Manrope 13/500, 36px tall. Active = `ink` + 2px `iris` underline.
- **Segmented control:** `haze` track, 3px padding; active segment = `white` with 1px `rule`.

### Tables

- `white` panel, 1px `rule`, `radius-md`, horizontal scroll on narrow screens.
- Header 36px, `haze`, `ui-meta` labels in `steel`. Rows 44px, 1px `rule` between rows. Hover = `canvas`. Selected = `iris-soft` with a 2px `iris` left edge.
- IDs in `ui-meta`. Amounts right-aligned, tabular. Status as badges.

### Cards and KPIs

- `white`, 1px `rule`, `radius-md`, 20px padding, no shadow. KPI: `ui-meta` label, value in `ui-numeric`, delta in `ui-small`.
- Signature detail (Iris line) on one group per screen at most.

### Navigation

- Sidebar items: 30px, `radius-sm`, `ui-label`, 16px icon in `steel`.
- Active: `iris-soft` background + `iris-text`.
- Breadcrumbs in `ui-meta` separated by " / ".

### Modals and side sheets

- Widths 440 / 600 / 800px; `white`, `radius-lg`, `shadow-modal`. Backdrop `ink` at 20%.
- Title in Manrope 24/30; footer buttons right-aligned, primary last. Escape closes; focus returns to the trigger.

### Toasts, banners, empty, loading and error states

- Toast: bottom-right, `white`, `radius-lg`, `shadow-pop`, one line + optional "Undo". No animation.
- Empty: centred, 20px icon in `steel`, `ui-heading`, one line of `ui-body`, one primary button.
- Loading: static `haze` skeleton blocks + a `ui-meta` "loading…" label. No spinners or shimmer.
- Error: danger banner with what failed and a "Try again" button.

### Data visualisation

- `chart-1` main series, `chart-2` comparison, `chart-3` other, `chart-highlight` for one value. Gridlines `rule`, axis labels `ui-meta`. No animation, no 3D, no gradients.

## 5. Patterns

- **Forms:** one column, max 560px. Labels above fields. Actions bottom-right, primary last.
- **List to detail:** clicking a row opens a side sheet for quick edits.
- **Destructive actions:** confirm in a modal that names the thing, with a danger button.
- **Settings:** left sub-nav (200px) + one form card per section.

## 6. No-motion rules

- Everything inside `.ss-app` has `transition: none; animation: none`.
- Hover, focus, open and close are instant. Progress is static text or a stepped bar.

## 7. Checklist for every screen

- [ ] `canvas` canvas, white panels, no dark areas
- [ ] One Manrope page title; all other text Manrope or mono
- [ ] One filled `iris` button
- [ ] `flare` only as a small mark
- [ ] 14px body, 34px controls, 44px rows, 4px grid
- [ ] Lines, not shadows (shadows only on floating things)
- [ ] Focus visible on every control
- [ ] Status has a word, not just colour
- [ ] Nothing animates


---

# Part 3 · Website guideline

How the Studio Signal brand looks and moves on Sahil's website, landing pages and portfolio. Same palette and families as the platform, with bigger type, more air, and a defined motion system.

Light only: no dark bands, dark footers or dark cards.

---

## 1. Layout

- Max width 1160px, side padding 24px (16px on phones).
- 96px between sections (64px on phones); hero top spacing 128px (64px on phones).
- Text blocks max 60 characters wide.

## 2. Type scale

| Style | Size / line | Weight | Family | Use |
|---|---|---|---|---|
| `web-display` | 88 / 88 (48 / 50 on phones) | 300 | Manrope | Hero headline |
| `web-h1` | 56 / 60 (36 on phones) | 300 | Manrope | Section titles |
| `web-h2` | 40 / 46 (30 on phones) | 300 | Manrope | Sub-sections, contact |
| `web-h3` | 20 / 28 | 600 | Manrope | Card titles |
| `web-lead` | 19 / 30 | 400 | Manrope | Intro paragraphs |
| `web-body` | 17 / 28 | 400 | Manrope | Running text |
| `web-eyebrow` | 12 / 16 | 400 | JetBrains Mono | Line above a headline |

- Accent: No coloured words: the continuation turns `steel`.
- Eyebrow: JetBrains Mono 12px `steel`, led by a 6px flare dot.

## 3. Page anatomy

### Navigation

- 64px, white at 90% with blur. Left: wordmark. Links Manrope 14/500 `steel`. Right: ghost "Resume" and an iris button "Contact".

### Hero

- White page, the ribbon entering from the top-right behind the content. Left: mono eyebrow, a two-tone Manrope 300 headline at 72px, lead, iris button. Screenshot panel overlapping the ribbon.

### Section header

- Mono eyebrow, two-tone `web-h1`, description below at 60 characters.

### Work cards

- White, `radius-md`, 1px `rule`, 24px padding. The first card in a row may carry the iris line. Hover: border turns `rule-strong`, arrow nudges.

### Notes / writing list

- Rows with mono date, Manrope 20/500 title, `steel` summary. Hover: title `iris`.

### Contact

- White panel with the iris line, two-tone headline, the email with Copy, an iris button.

### Footer

- `canvas`, 1px `rule`, mono copyright, links.

## 4. Motion system

The website has **one orchestrated moment per page** (the hero) plus small responses to the user. Nothing else moves.

### Tokens

| Token | Value | Use |
|---|---|---|
| `duration-fast` | 150ms | Hover colour changes |
| `duration-base` | 220ms | Menus, accordions |
| `duration-reveal` | 700ms | Section fade-up |
| `duration-hero` | 900ms | Hero layers |
| `stagger` | 90ms | Delay between headline parts |
| Easing | `cubic-bezier(.2, .7, 0, 1)` | All reveals |

### The hero sequence (in order)

| Time | What happens | Spec |
|---|---|---|
| 0ms | Ribbon flows in | The ribbon slides 8% along its angle and fades 0 → 1, 1400ms |
| 200ms | Headline rises | Lines: opacity 0 → 1, translateY 12px → 0, 700ms, 90ms apart |
| 900ms | Steel settles | The continuation shifts from `ink` to `steel`, 600ms |
| 1000ms | Flare dot | Pulses twice, then stops |
| ~1500ms | Done | Everything readable from the first frame |

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
<header class="ssw-hero"><div class="ssw-ribbon"></div><div class="in">…<h1 class="ssw-display"><span class="line" style="--i:0">Infrastructure for products.</span> <em class="line" style="--i:1">From first API to production.</em></h1>…</div></header>
```

## 5. Checklist for every page

- [ ] Light only, no dark bands
- [ ] Headlines follow the accent rule (No coloured words: the continuation turns `steel`)
- [ ] Eyebrow above key headlines
- [ ] Signature details only where Part 1 allows them
- [ ] One hero motion sequence; everything readable before it plays
- [ ] Hover responses at 150ms
- [ ] Reduced motion respected
- [ ] One primary button per section


---

# Part 4 · Code

Copy each block into its own file, exactly as written. Component classes use the `.ss-` prefix (platform) and `.ssw-` (website).

## tokens.css

```css
/* Studio Signal tokens · Sahil Shaikh. Light only: there is no dark theme. */
:root {
  color-scheme: light;
  --canvas: #f7f8fb;
  --white: #ffffff;
  --haze: #eef0f6;
  --rule: #e3e6ee;
  --rule-strong: #8890a3;
  --ink: #0f1222;
  --ink-secondary: #2e3346;
  --steel: #565e78;
  --placeholder: #646c84;
  --iris: #4f3cf7;
  --iris-hover: #3f2edb;
  --iris-soft: #eceafe;
  --iris-text: #3a2bc4;
  --on-iris: #ffffff;
  --flare: #ff6b4a;
  --flare-soft: #ffede8;
  --flare-text: #a63a1f;
  --success: var(--iris-text);
  --success-soft: var(--iris-soft);
  --warning: #8a5a00;
  --warning-soft: #fff4dc;
  --danger: #b42318;
  --danger-soft: #fdeceb;
  --chart-1: #4f3cf7;
  --chart-2: #a99efb;
  --chart-3: #c4c9d6;
  --chart-highlight: #ff6b4a;
  --shadow-pop: 0 4px 12px -2px #0f122214, 0 2px 4px -2px #0f12220f;
  --shadow-modal: 0 20px 48px -12px #0f12222e, 0 4px 8px -4px #0f122214;
  --focus-ring: 0 0 0 2px #ffffff, 0 0 0 4px #4f3cf7;
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
  --radius-xs: 3px;
  --radius-sm: 4px;
  --radius-md: 6px;
  --radius-lg: 10px;
  --radius-full: 9999px;
  --control-sm: 28px;
  --control-md: 34px;
  --control-lg: 40px;
  --row-height: 44px;
  --topbar-height: 56px;
  --sidebar-width: 232px;
  --content-max: 1200px;
  --site-max: 1160px;
  --mark-size: 8px;
  --icon-md: 16px;
  --icon-lg: 20px;
  --duration-fast: 150ms;
  --duration-base: 220ms;
  --duration-reveal: 700ms;
  --duration-hero: 900ms;
  --stagger: 90ms;
  --opacity-disabled: 0.45;
  --ease-reveal: cubic-bezier(.2, .7, 0, 1);
  --font-display: Manrope, "SF Pro Display", system-ui, sans-serif;
  --font-ui: Manrope, "SF Pro Text", system-ui, sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, Menlo, monospace;
}
.ui-page-title { font-family: var(--font-display); font-size: 32px; line-height: 36px; font-weight: 300; letter-spacing: -0.02em;  }
.ui-numeric { font-family: var(--font-display); font-size: 36px; line-height: 40px; font-weight: 300; letter-spacing: -0.02em; font-variant-numeric: tabular-nums;  }
.ui-heading { font-family: var(--font-ui); font-size: 16px; line-height: 24px; font-weight: 600; letter-spacing: -0.01em; }
.ui-subheading { font-family: var(--font-ui); font-size: 14px; line-height: 20px; font-weight: 600; }
.ui-body { font-family: var(--font-ui); font-size: 14px; line-height: 20px; font-weight: 400; }
.ui-body-lg { font-family: var(--font-ui); font-size: 16px; line-height: 24px; font-weight: 400; }
.ui-label { font-family: var(--font-ui); font-size: 13px; line-height: 18px; font-weight: 500; }
.ui-small { font-family: var(--font-ui); font-size: 12px; line-height: 16px; font-weight: 400; }
.ui-meta { font-family: var(--font-mono); font-size: 11px; line-height: 16px; font-weight: 400; }
.web-display { font-family: var(--font-display); font-size: 88px; line-height: 88px; font-weight: 300; letter-spacing: -0.02em;  }
.web-h1 { font-family: var(--font-display); font-size: 56px; line-height: 60px; font-weight: 300; letter-spacing: -0.02em;  }
.web-h2 { font-family: var(--font-display); font-size: 40px; line-height: 46px; font-weight: 300; letter-spacing: -0.02em;  }
.web-h3 { font-family: var(--font-ui); font-size: 20px; line-height: 28px; font-weight: 600; letter-spacing: -0.01em; }
.web-lead { font-family: var(--font-ui); font-size: 19px; line-height: 30px; font-weight: 400; }
.web-body { font-family: var(--font-ui); font-size: 17px; line-height: 28px; font-weight: 400; }
.web-eyebrow { font-family: var(--font-mono); font-size: 12px; line-height: 16px; font-weight: 400; }
/* Platform UI never animates: wrap the app in .ss-app */
.ss-app, .ss-app * { transition: none !important; animation: none !important; }
@media (max-width: 760px) { .web-display { font-size: 48px; line-height: 50px; } .web-h1 { font-size: 36px; line-height: 40px; } .web-h2 { font-size: 30px; line-height: 34px; } }
```

## components.css

```css
/* Studio Signal · components.css — reference styles for every component (.ss-* platform, shared by the website). Requires tokens.css. */
@import url("https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap");
/* Studio Signal components. .ss-* = platform UI (no motion). .ssw-* = website (motion allowed). */
body { margin: 0; font-family: var(--font-ui); font-size: 14px; line-height: 20px; color: var(--ink); background: var(--canvas); -webkit-font-smoothing: antialiased; }
.ss-pad { padding: var(--space-5); }
.ss-row { display: flex; flex-wrap: wrap; align-items: center; gap: var(--space-3); }
.ss-col { display: grid; gap: var(--space-4); }
.ss-grid { display: grid; gap: var(--space-4); grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); }
.ss-meta { font-family: var(--font-mono); font-size: 11px; line-height: 16px; color: var(--steel); }
.ss-eyebrow { display: inline-flex; align-items: center; gap: var(--space-2); font-family: var(--font-mono); font-size: 11px; line-height: 16px; color: var(--steel); }
.ss-num { font-variant-numeric: tabular-nums; }
.ss-app, .ss-app * { transition: none !important; animation: none !important; }
:where(.ss-btn, .ss-input, .ss-select, .ss-textarea, .ss-tab, .ss-seg button, .ss-nav a, .ss-check input, .ss-toggle input):focus-visible { outline: 2px solid transparent; box-shadow: var(--focus-ring); }


/* Buttons */
.ss-btn { font: inherit; font-size: 13px; line-height: 18px; font-weight: 500; height: var(--control-md); padding: 0 var(--space-3); display: inline-flex; align-items: center; justify-content: center; gap: 6px; border-radius: var(--radius-sm); border: 1px solid transparent; cursor: pointer; white-space: nowrap; text-decoration: none; background: transparent; color: var(--ink); }
.ss-btn svg { width: var(--icon-md); height: var(--icon-md); }
.ss-btn-sm { height: var(--control-sm); padding: 0 10px; font-size: 12px; }
.ss-btn-lg { height: var(--control-lg); padding: 0 var(--space-4); font-size: 14px; }
.ss-btn-primary { background: var(--iris); color: var(--on-iris); }
.ss-btn-primary:hover { background: var(--iris-hover); }
.ss-btn-secondary { background: var(--white); border-color: var(--rule-strong); }
.ss-btn-secondary:hover { background: var(--haze); }
.ss-btn-ghost { color: var(--ink-secondary); }
.ss-btn-ghost:hover { background: var(--haze); color: var(--ink); }
.ss-btn-danger { background: var(--danger); color: #ffffff; }
.ss-btn[disabled] { opacity: var(--opacity-disabled); cursor: not-allowed; }
.ss-icon { fill: none; stroke: currentColor; stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; width: var(--icon-md); height: var(--icon-md); flex: none; }

/* Fields */
.ss-field { display: grid; gap: 6px; min-width: 0; }
.ss-label { font-size: 13px; line-height: 18px; font-weight: 500; color: var(--ink-secondary); }
.ss-input, .ss-select, .ss-textarea { font: inherit; font-size: 14px; width: 100%; box-sizing: border-box; height: var(--control-md); padding: 0 var(--space-3); border-radius: var(--radius-sm); border: 1px solid var(--rule-strong); background: var(--white); color: var(--ink); }
.ss-textarea { height: 88px; padding-block: 8px; resize: vertical; }
.ss-select { appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='none' stroke='%23565e78' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m4 6 4 4 4-4'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 10px center; padding-right: 34px; }
.ss-input::placeholder, .ss-textarea::placeholder { color: var(--placeholder); }
.ss-input:focus, .ss-select:focus, .ss-textarea:focus, .ss-input.is-focus { outline: none; border-color: var(--iris); box-shadow: var(--focus-ring); }
.ss-input.is-error { border-color: var(--danger); }
.ss-help { margin: 0; font-size: 12px; line-height: 16px; color: var(--steel); }
.ss-help.is-error { color: var(--danger); }
.ss-check { display: inline-flex; align-items: center; gap: 10px; font-size: 14px; color: var(--ink-secondary); cursor: pointer; }
.ss-check input { appearance: none; margin: 0; width: 16px; height: 16px; border: 1px solid var(--rule-strong); border-radius: var(--radius-xs); background: var(--white); display: grid; place-items: center; cursor: pointer; }
.ss-check input:checked { background: var(--iris); border-color: var(--iris); }
.ss-check input:checked::after { content: ""; width: 4px; height: 8px; border: solid #ffffff; border-width: 0 2px 2px 0; transform: translateY(-1px) rotate(45deg); }
.ss-check input[type="radio"] { border-radius: 50%; }
.ss-check input[type="radio"]:checked { background: var(--white); border-color: var(--iris); }
.ss-check input[type="radio"]:checked::after { width: 8px; height: 8px; border: 0; border-radius: 50%; background: var(--iris); transform: none; }
.ss-toggle { display: inline-flex; align-items: center; gap: 10px; font-size: 14px; color: var(--ink-secondary); cursor: pointer; }
.ss-toggle input { appearance: none; margin: 0; width: 32px; height: 18px; border-radius: var(--radius-full); background: var(--rule-strong); position: relative; cursor: pointer; }
.ss-toggle input::after { content: ""; position: absolute; top: 2px; left: 2px; width: 14px; height: 14px; border-radius: 50%; background: #ffffff; }
.ss-toggle input:checked { background: var(--iris); }
.ss-toggle input:checked::after { left: 16px; }

/* Badges */
.ss-badge { display: inline-flex; align-items: center; gap: 6px; height: 22px; padding: 0 var(--space-2); border-radius: var(--radius-xs); font-size: 12px; line-height: 16px; font-weight: 500; background: var(--haze); color: var(--steel); white-space: nowrap; }
.ss-badge.dot::before { content: ""; width: 6px; height: 6px; background: currentColor; }
.ss-badge-done { background: var(--success-soft); color: var(--success); }
.ss-badge-live { background: var(--flare-soft); color: var(--flare-text); }
.ss-badge-warn { background: var(--warning-soft); color: var(--warning); }
.ss-badge-fail { background: var(--danger-soft); color: var(--danger); }
.ss-badge-mono { font-family: var(--font-mono); font-size: 11px; font-weight: 400; background: var(--white); border: 1px solid var(--rule); color: var(--ink-secondary); }

/* Tabs and segmented */
.ss-tabs { display: flex; gap: var(--space-5); border-bottom: 1px solid var(--rule); }
.ss-tab { font: inherit; background: none; border: 0; padding: 0; height: 36px; font-family: var(--font-mono); font-size: 11px; color: var(--steel); border-bottom: 2px solid transparent; margin-bottom: -1px; cursor: pointer; }
.ss-tab:hover { color: var(--ink); }
.ss-tab[aria-selected="true"] { color: var(--ink); border-bottom-color: var(--ink); }
.ss-seg { display: inline-flex; gap: 2px; padding: 3px; background: var(--haze); border-radius: var(--radius-sm); }
.ss-seg button { font: inherit; font-size: 13px; font-weight: 500; border: 1px solid transparent; background: none; color: var(--steel); height: 28px; padding: 0 12px; border-radius: 4px; cursor: pointer; }
.ss-seg button[aria-pressed="true"] { background: var(--white); color: var(--ink); border-color: var(--rule); }

/* Cards and KPIs */
.ss-card { background: var(--white); border: 1px solid var(--rule); border-radius: var(--radius-md); padding: var(--space-5); min-width: 0; }
.ss-card-head { display: flex; justify-content: space-between; align-items: center; gap: var(--space-3); margin-bottom: var(--space-4); }
.ss-card-title { margin: 0; font-size: 16px; line-height: 24px; font-weight: 600; letter-spacing: -.01em; }
.ss-kpi-value { font-family: var(--font-display); font-size: 36px; line-height: 40px; font-weight: 300; letter-spacing: -0.02em; font-variant-numeric: tabular-nums; margin-top: var(--space-2); }
.ss-delta { font-size: 12px; line-height: 16px; font-weight: 500; color: var(--success); margin-top: var(--space-1); }
.ss-delta.warn { color: var(--warning); } .ss-delta.down { color: var(--danger); }

/* Table */
.ss-table-wrap { background: var(--white); border: 1px solid var(--rule); border-radius: var(--radius-md); overflow-x: auto; }
.ss-table { width: 100%; border-collapse: collapse; font-size: 14px; }
.ss-table th { height: 36px; padding: 0 var(--space-3); text-align: left; background: var(--haze); border-bottom: 1px solid var(--rule); font-family: var(--font-mono); font-size: 11px; font-weight: 400; color: var(--steel); white-space: nowrap; }
.ss-table td { height: var(--row-height); padding: 0 var(--space-3); border-bottom: 1px solid var(--rule); color: var(--ink-secondary); white-space: nowrap; }
.ss-table tbody tr:last-child td { border-bottom: 0; }
.ss-table tbody tr { cursor: pointer; }
.ss-table tbody tr:hover td { background: var(--canvas); }
.ss-table tbody tr[aria-selected="true"] td { background: var(--iris-soft); }
.ss-table tbody tr[aria-selected="true"] td:first-child { box-shadow: inset 2px 0 0 var(--iris); }
.ss-table .r { text-align: right; font-variant-numeric: tabular-nums; }
.ss-table .strong { color: var(--ink); font-weight: 500; }
.ss-table .id { font-family: var(--font-mono); font-size: 11px; color: var(--steel); }
.ss-table-foot { display: flex; justify-content: space-between; gap: var(--space-3); padding: 10px var(--space-3); border-top: 1px solid var(--rule); font-size: 12px; color: var(--steel); }

/* App shell */
.ss-app { display: grid; grid-template-columns: var(--sidebar-width) minmax(0, 1fr); min-height: 640px; background: var(--white); font-size: 14px; }
.ss-side { background: var(--canvas); border-right: 1px solid var(--rule); padding: var(--space-4) 10px; display: flex; flex-direction: column; gap: var(--space-5); }
.ss-brand { display: flex; align-items: center; gap: var(--space-2); padding: 0 6px; font-family: var(--font-display); font-size: 20px; line-height: 24px; color: var(--ink); }
.ss-nav { display: grid; gap: 2px; }
.ss-nav .ss-meta { padding: 0 8px 6px; }
.ss-nav a { display: flex; align-items: center; gap: 10px; height: 30px; padding: 0 8px; border-radius: var(--radius-sm); font-size: 13px; font-weight: 500; color: var(--ink-secondary); text-decoration: none; cursor: pointer; }
.ss-nav a .ss-icon { color: var(--steel); }
.ss-nav a:hover { background: var(--white); color: var(--ink); }
.ss-nav a[aria-current="page"] { background: var(--iris-soft); color: var(--iris-text); }
.ss-nav a[aria-current="page"] .ss-icon { color: var(--iris-text); }
.ss-nav .count { margin-left: auto; font-family: var(--font-mono); font-size: 10px; color: var(--steel); }
.ss-main { min-width: 0; display: flex; flex-direction: column; }
.ss-top { height: var(--topbar-height); border-bottom: 1px solid var(--rule); display: flex; align-items: center; gap: var(--space-3); padding: 0 var(--space-6); }
.ss-top .ss-input { max-width: 320px; }
.ss-top .right { margin-left: auto; display: flex; gap: var(--space-2); align-items: center; }
.ss-avatar { width: 30px; height: 30px; border-radius: 50%; background: var(--canvas); border: 1px solid var(--rule); display: grid; place-items: center; font-size: 11px; font-weight: 600; color: var(--ink-secondary); }
.ss-page { padding: var(--space-6); display: grid; gap: var(--space-6); max-width: var(--content-max); }
.ss-page-head { display: flex; justify-content: space-between; align-items: flex-end; gap: var(--space-4); flex-wrap: wrap; }
.ss-page-title { margin: 2px 0 0; font-family: var(--font-display); font-size: 32px; line-height: 36px; font-weight: 300; letter-spacing: -0.02em; }
.ss-page-sub { margin: var(--space-1) 0 0; color: var(--steel); }

/* Modal, toast, banner, empty */
.ss-backdrop { background: rgba(15, 18, 34, .2); padding: var(--space-6); display: grid; place-items: center; }
.ss-modal { width: 100%; max-width: 440px; background: var(--white); border: 1px solid var(--rule); border-radius: var(--radius-lg); box-shadow: var(--shadow-modal); }
.ss-modal-head { display: flex; justify-content: space-between; gap: var(--space-3); padding: var(--space-5) var(--space-5) 0; }
.ss-modal-title { margin: 0; font-family: var(--font-display); font-size: 24px; line-height: 30px; font-weight: 300; }
.ss-modal-body { padding: var(--space-5); display: grid; gap: var(--space-4); }
.ss-modal-foot { display: flex; justify-content: flex-end; gap: var(--space-2); padding: var(--space-4) var(--space-5); border-top: 1px solid var(--rule); }
.ss-toast { display: inline-flex; align-items: center; gap: var(--space-3); padding: 12px var(--space-4); background: var(--white); border: 1px solid var(--rule); border-radius: var(--radius-lg); box-shadow: var(--shadow-pop); font-weight: 500; }
.ss-toast .ss-icon { color: var(--iris); }
.ss-banner { display: flex; align-items: center; gap: var(--space-3); padding: 12px var(--space-4); border-radius: var(--radius-md); font-size: 14px; }
.ss-banner .grow { flex: 1; }
.ss-banner-warn { background: var(--warning-soft); color: var(--warning); }
.ss-banner-fail { background: var(--danger-soft); color: var(--danger); }
.ss-banner-info { background: var(--iris-soft); color: var(--iris-text); }
.ss-empty { position: relative; overflow: hidden; text-align: center; padding: var(--space-12) var(--space-6); background: var(--white); border: 1px solid var(--rule); border-radius: var(--radius-md); }
.ss-empty > * { position: relative; }
.ss-empty .ss-icon { width: 20px; height: 20px; color: var(--steel); }
.ss-empty h3 { margin: var(--space-3) 0 var(--space-1); font-size: 16px; line-height: 24px; font-weight: 600; }
.ss-empty p { margin: 0 auto var(--space-4); max-width: 40ch; color: var(--steel); }
.ss-skel { background: var(--haze); border-radius: 4px; height: 12px; }

/* Signature details */
.ss-mark { display: inline-block; width: 2px; height: 14px; background: var(--iris); flex: none; }
.ss-eyebrow::before { content: ""; width: 6px; height: 6px; border-radius: 50%; background: var(--flare); }
.ss-accent { color: var(--steel); }
.ss-empty::before { content: ""; position: absolute; inset: 0; background: radial-gradient(ellipse at 50% 120%, var(--iris-soft), transparent 60%); }
/* Iris line (signature) */
.ss-lined { box-shadow: inset 0 2px 0 var(--iris); }
```

## motion.css (website only)

```css
/* Studio Signal · motion.css — WEBSITE ONLY. Never load inside the platform UI. Requires tokens.css. */
/* ---------------- Website ---------------- */
.fw { font-size: 17px; line-height: 28px; background: var(--canvas); }
.ssw-wrap { max-width: var(--site-max); margin: 0 auto; padding: 0 var(--space-6); }
.ssw-nav { display: flex; align-items: center; justify-content: space-between; height: 72px; }
.ssw-logo { display: flex; align-items: center; gap: var(--space-2); font-family: var(--font-display); font-size: 22px; line-height: 28px; color: var(--ink); text-decoration: none; }
.ssw-links { display: flex; align-items: center; gap: var(--space-6); font-size: 14px; font-weight: 500; color: var(--steel); }
.ssw-links a { color: inherit; text-decoration: none; transition: color 150ms ease-out; }
.ssw-links a:hover { color: var(--ink); }
.ssw-links a[aria-current="page"] { color: var(--ink); text-decoration: underline; text-underline-offset: 6px; text-decoration-thickness: 1px; }
.fw .ss-btn { transition: background-color 150ms ease-out; }
.fw .ss-btn .arr { display: inline-block; transition: transform 150ms ease-out; }
.fw .ss-btn:hover .arr, .ssw-card:hover .arr { transform: translateX(3px); }
.ssw-display { margin: 0; font-family: var(--font-display); font-weight: 300; font-size: 88px; line-height: 84px; letter-spacing: -0.02em; max-width: 13ch; color: var(--ink); }
.ssw-display .w { display: inline-block; }
.ssw-lead { margin: var(--space-5) 0 var(--space-8); max-width: 44ch; font-size: 19px; line-height: 30px; color: var(--steel); }
.ssw-cta { display: flex; gap: var(--space-3); flex-wrap: wrap; }
.ssw-sec-head { display: flex; justify-content: space-between; align-items: flex-end; gap: var(--space-4); flex-wrap: wrap; margin-bottom: var(--space-8); }
.ssw-h1 { margin: var(--space-3) 0 0; font-family: var(--font-display); font-weight: 300; font-size: 56px; line-height: 58px; letter-spacing: -0.02em; }
.ssw-h2 { margin: 0; font-family: var(--font-display); font-weight: 300; font-size: 40px; line-height: 44px; letter-spacing: -0.02em; }
.ssw-cards { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: var(--space-6); }
.ssw-card { display: flex; flex-direction: column; gap: var(--space-2); padding: var(--space-6); background: var(--white); border: 1px solid var(--rule); border-radius: var(--radius-md); text-decoration: none; color: var(--ink); min-width: 0; }
.ssw-shot { aspect-ratio: 16/10; border-radius: var(--radius-sm); background: var(--canvas); border: 1px solid var(--rule); margin-bottom: var(--space-3); padding: 12px; display: grid; gap: 8px; align-content: start; }
.ssw-shot span { height: 8px; border-radius: 4px; background: var(--haze); }
.ssw-card h3 { margin: 0; font-size: 20px; line-height: 28px; font-weight: 600; letter-spacing: -.01em; display: flex; justify-content: space-between; transition: color 150ms ease-out; }
.ssw-card:hover h3 { color: var(--iris); }
.ssw-card p { margin: 0; font-size: 15px; line-height: 24px; color: var(--steel); }
.ssw-card .tags { display: flex; gap: var(--space-2); flex-wrap: wrap; margin-top: var(--space-3); }
.ssw-notes { display: grid; }
.ssw-note { display: grid; grid-template-columns: 120px minmax(0, 1fr); gap: var(--space-4); padding: var(--space-5) 0; border-bottom: 1px solid var(--rule); text-decoration: none; color: var(--ink); }
.ssw-note b { display: block; font-family: var(--font-display); font-weight: 300; font-size: 24px; line-height: 30px; transition: color 150ms ease-out; }
.ssw-note:hover b { color: var(--iris); }
.ssw-note span { color: var(--steel); font-size: 15px; }
@media (max-width: 760px) {
  .ssw-display { font-size: 48px; line-height: 48px; } .ssw-h1 { font-size: 36px; line-height: 40px; } .ssw-h2 { font-size: 30px; line-height: 34px; }
  .ssw-cards { grid-template-columns: 1fr; } .ssw-links { display: none; } .ssw-hero { padding: var(--space-5) var(--space-5) var(--space-10); }
  .ssw-note { grid-template-columns: 1fr; gap: var(--space-1); }
  .ss-app { grid-template-columns: 1fr; } .ss-side { display: none; }
}

/* Accent word */
.ssw-display em, .ssw-h1 em, .ssw-h2 em { font-style: normal; color: var(--steel); }

/* Hero (signature) */
.ssw-hero { position: relative; overflow: hidden; padding: var(--space-24) 0 var(--space-16); }
.ssw-ribbon { position: absolute; right: -20%; top: -40%; width: 80%; height: 140%; transform: rotate(24deg); background: linear-gradient(90deg, var(--iris), #A78BFA 45%, var(--flare)); filter: blur(40px); opacity: .55; pointer-events: none; }
.ssw-hero > .in { position: relative; max-width: 640px; }

@media (prefers-reduced-motion: no-preference) {
  .ssw-play .ssw-ribbon { animation: ssw-flow 1400ms var(--ease-reveal) both; }
  @keyframes ssw-flow { from { opacity: 0; transform: rotate(24deg) translateX(-8%); } to { opacity: .55; transform: rotate(24deg); } }
  .ssw-play .ssw-display .line { display: block; animation: ssw-rise 700ms var(--ease-reveal) both; animation-delay: calc(200ms + var(--i) * 90ms); }
  @keyframes ssw-rise { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }
  .ssw-play .ssw-display em { animation: ssw-tone 600ms ease-out 900ms both; }
  @keyframes ssw-tone { from { color: var(--ink); } to { color: var(--steel); } }
  .ssw-play .ss-eyebrow::before { animation: ssw-pulse 1.1s ease-out 2 1000ms; }
  @keyframes ssw-pulse { 50% { box-shadow: 0 0 0 6px rgba(255, 107, 74, .22); } }
  .ssw-fade.ssw-in { animation: ssw-up var(--duration-reveal) var(--ease-reveal) both; }
  @keyframes ssw-up { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }
}

/* Usage
   1. Hero markup: <header class="ssw-hero"><div class="ssw-ribbon"></div><div class="in">…<h1 class="ssw-display"><span class="line" style="--i:0">Infrastructure for products.</span> <em class="line" style="--i:1">From first API to production.</em></h1>…</div></header>
   2. Split the headline into <span class="w" style="--i:N"> words (or lines), then add .ssw-play to the hero once it is in view.
   3. Section titles: add .ssw-fade; add .ssw-in when they first enter the viewport.
   Everything is visible before and without the script; prefers-reduced-motion turns all of it off. */
```

## tailwind-theme.css (only if the project uses Tailwind v4)

```css
@import "tailwindcss";
/* Studio Signal · Tailwind v4 theme. Load tokens.css first. Light only. */
@theme inline {
  --color-canvas: var(--canvas);
  --color-white: var(--white);
  --color-haze: var(--haze);
  --color-rule: var(--rule);
  --color-rule-strong: var(--rule-strong);
  --color-ink: var(--ink);
  --color-ink-secondary: var(--ink-secondary);
  --color-steel: var(--steel);
  --color-placeholder: var(--placeholder);
  --color-iris: var(--iris);
  --color-iris-hover: var(--iris-hover);
  --color-iris-soft: var(--iris-soft);
  --color-iris-text: var(--iris-text);
  --color-on-iris: var(--on-iris);
  --color-flare: var(--flare);
  --color-flare-soft: var(--flare-soft);
  --color-flare-text: var(--flare-text);
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

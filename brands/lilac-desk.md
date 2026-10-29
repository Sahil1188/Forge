# LILAC-DESK.md · Sahil Shaikh brand (all-in-one)

**For Claude Code:** this single file contains the whole Lilac Desk system: brand rules, platform UI rules (no animation), website rules (with motion), and the complete CSS. Put it in the project root and add this line to `CLAUDE.md`:

```
All UI follows LILAC-DESK.md. Before writing UI, create tokens.css, components.css (and motion.css for website pages) from Part 4 if they don't exist, then use only their variables and classes. Light only, never dark. Platform UI has no animation.
```

## How Claude Code should use this file

1. Decide the surface: **Platform UI** (app, dashboard, admin, settings) or **Website** (marketing, portfolio, landing). If unclear, assume Platform UI.
2. If `tokens.css` and `components.css` don't exist in the project, create them by copying the code blocks in Part 4 exactly. For website pages also create `motion.css`. With Tailwind v4 also create `tailwind-theme.css`.
3. Load the Google Fonts in Part 1, section 5.
4. Never hard-code colours, font sizes or fonts. Never add dark mode or dark sections.
5. Platform UI: wrap the app in `class="ld-app"` (kills all motion). Website: follow Part 3, section 4.
6. Finish by running the checklist at the end of Part 2 or Part 3.

---

Sahil Shaikh's brand and design system, **Lilac Desk**. Part 1 is the brand foundations, Part 2 the platform UI rules (no animation), Part 3 the website rules (with motion), Part 4 the code.

*Researched from: Superhuman, Linear's light theme, Raycast's command palette. Inspired by, not copied from: no logos, fonts or assets of those products are used.*

---

# Part 1 · Brand foundations

The brand of Sahil Shaikh, Full Stack AI Engineer. **Lilac Desk**: a keyboard-first desk in soft lilac light: keycaps, a command palette and a violet cursor. It covers every platform Sahil designs and his website.

This system has three parts:

1. **Brand foundations** (Part 1): idea, logo, colour, type, layout, shape, icons, imagery, voice and accessibility.
2. **Platform UI** (Part 2): rules for any app, dashboard or tool. **No animation.**
3. **Website** (Part 3): the same brand with larger type and a defined motion system.

Light only. There is no dark theme, and no dark sections, panels or backgrounds anywhere.

---

## 1. The idea

| | |
|---|---|
| **Metaphor** | A keyboard-first desk in soft lilac light: keycaps, a command palette and a violet cursor. |
| **Personality** | Fast, focused, a little futuristic, still friendly. |
| **Feeling we want** | "I can do everything from the keyboard." |
| **Three ingredients** | **Keycaps** (shortcut chips with a raised bottom edge) · **Command** (the ⌘K palette as a design motif) · **Violet** (one bright violet for action, peach for highlights) |

## 2. Principles

1. **Lavender ground, white panels.** Pages on soft `lavender`; panels `white`.
2. **Keyboard first.** Every main action shows its shortcut as a keycap.
3. **Violet to act.** Violet for actions, links and focus; peach for small highlights.
4. **Command palette everywhere.** Search, create and navigate through one ⌘K palette.
5. **Crisp sans.** Plus Jakarta Sans 700 for titles, 400–600 for UI. Fira Code for keys and code.
6. **Still product; the palette types itself on the website.** One typed query, then rest.
7. **Accessible always.** Text 4.5:1 or better, borders and indicators 3:1, focus always visible.

## 3. Logo

- **Wordmark:** "sahil" in Plus Jakarta Sans 700, `ink`, followed by a violet text cursor bar (2px × 0.9em).
- **Product mark:** a ⌘ keycap (16px) + product name in Plus Jakarta Sans 700.
- **App icon / avatar:** a white keycap: 10px radius, 1px `rule`, 3px darker bottom edge, a violet "S".
- **Clear space:** the cap height. **Minimum size:** wordmark 64px; icon 20px.
- **Never:** animate the cursor in the product, put it on a dark ground, use peach in the logo.

## 4. Colour

### Core palette

| Token | Hex | Role |
|---|---|---|
| `lavender` | #F7F6FC | Page ground, sidebar, website background |
| `white` | #FFFFFF | Cards, tables, inputs, modals |
| `lilac` | #EFEDF9 | Hover rows, keycaps, table headers |
| `rule` | #E4E1F2 | Dividers and borders |
| `rule-strong` | #8B86A3 | Input borders, strong dividers |
| `ink` | #16141F | Headings, primary text |
| `ink-secondary` | #322F40 | Labels, nav, table text |
| `dusk` | #5E5A70 | Secondary text, hints |
| `placeholder` | #67637A | Placeholders, disabled text |
| `violet` | #6A4FD8 | Primary action, links, focus, cursor |
| `violet-hover` | #573DC0 | Hover/pressed violet |
| `violet-soft` / `violet-text` | #EEEAFD / #5338BD | Selected, active, success |
| `peach` | #FF9F7A | Small highlights: new, unread, the website glow |
| `peach-soft` / `peach-text` | #FFEEE6 / #A2441F | Soft peach badges |
| `warning` / `warning-soft` | #8A5A00 / #FFF4DC | Needs attention |
| `danger` / `danger-soft` | #B42318 / #FDECEB | Errors, destructive |

### Charts

`chart-1` violet #6A4FD8, `chart-2` #B3A5F0, `chart-3` #CBC8DA, and `chart-highlight` peach #FF9F7A for the one value that matters. Gridlines use `rule`, axis labels use `ui-meta` in `dusk`.

### Proportions

About 60% lavender, 28% white, 8% type and lines, 3% violet, 1% peach.

### Rules

- Violet is the only colour on buttons and links. One filled violet button per view.
- Peach is a highlight: unread dots, "New", one glow. Never text on white.
- Status always has a word.
- No gradients in the product. One soft violet-to-peach glow behind the website palette.
- Never use `ink` or `dusk` as a background.

## 5. Typography

Three roles, all free on Google Fonts:

`https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Fira+Code:wght@400;500&display=swap`

| Family | Role | Use | Weights |
|---|---|---|---|
| **Plus Jakarta Sans** | **The voice** | Page titles, numbers, website headlines | 700 |
| **Plus Jakarta Sans** | **The clarity** | All UI and body text | 400, 500, 600 |
| **Fira Code** | **The precision** | Keycaps, code, IDs, column headers | 400, 500 |

- **Accent word:** one word per headline in `violet`, followed by the cursor bar on the website.
- Shortcuts always as keycaps: `⌘` `K`, never written out ("Cmd+K").
- Plus Jakarta Sans never above 700; UI never above 600.
- Sentence case. No ALL CAPS.
- Full scales are in Part 2 (platform) and Part 3 (website).

## 6. Layout and spacing

- **4px grid:** 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 96, 128.
- **Platform:** sidebar on `lavender`, content on `white`, 24px page padding, max 1200px.
- **Website:** 1120px max width, 96px between sections.
- Align to a left edge in the product. Centre only short single lines (an empty state).

## 7. Shape and depth

| Token | Value | Use |
|---|---|---|
| `radius-xs` | 5px | Badges, keycaps |
| `radius-sm` | 8px | Buttons, inputs, nav |
| `radius-md` | 12px | Cards, tables, menus |
| `radius-lg` | 16px | Command palette, modals |
| `radius-full` | 9999px | Toggles, dots |

- **Keycaps** (signature): `lilac` fill, 1px `rule`, 2px darker bottom border, Fira Code 11px, min 20px wide.
- **Command palette** (signature): a white panel, `radius-lg`, `shadow-modal`, a 48px search row and grouped results with keycaps on the right.
- Shadows for floating things only (menus, palette, toasts, modals).

## 8. Iconography

- Lucide, 1.5px stroke. 16px. `dusk` default, `violet` active.
- Icon-only buttons always have an accessible label.

## 9. Imagery

- Screenshots on lavender inside a white panel with `radius-lg`; the command palette often floats over them.
- Diagrams: rounded nodes, violet edges, a peach highlight.
- Portrait: soft, cool light; lavender-tinted background welcome.

## 10. Voice and writing

- Fast and confident: short commands ("Search", "Jump to…", "Create issue").
- Lead with what something does: "Agents plan, build and review work together."
- Buttons are verbs: "New project", "Save changes". Confirmations say what happened: "Project created."
- Errors say what went wrong and how to fix it: "Name is required. Add a project name to continue."
- Numbers: "AED 1,250.00", dates "21 Oct 2026", times "14:32".
- No buzzwords, no exclamation marks, no emoji in UI.

## 11. Accessibility

- Every text colour pair passes WCAG AA (4.5:1). Borders, focus rings and indicators pass 3:1.
- Focus ring: 2px white gap + 2px `violet`, on every interactive element.
- Never rely on colour alone; pair it with a word, icon or position.
- Hit targets at least 28px (34px default).
- The website respects `prefers-reduced-motion`: all motion off, content visible immediately.

Measured contrast for this palette:

| Pair | Ratio | Needed |
|---|---|---|
| Body text `ink` on `white` | 18.2:1 | 4.5:1 |
| `dusk` on `lavender` | 6.16:1 | 4.5:1 |
| `dusk` on `lilac` | 5.72:1 | 4.5:1 |
| White on `violet` (primary button) | 5.64:1 | 4.5:1 |
| `violet` links on `white` | 5.64:1 | 4.5:1 |
| `violet-text` on `violet-soft` | 6.68:1 | 4.5:1 |
| `peach-text` on `peach-soft` | 5.51:1 | 4.5:1 |
| `placeholder` on `white` | 5.77:1 | 4.5:1 |
| `rule-strong` borders on `white` | 3.48:1 | 3:1 |
| `ink` on `peach` (mark used as a fill) | 9.09:1 | 4.5:1 |

## 12. Do and don't

| Do | Don't |
|---|---|
| Lavender ground, white panels | Dark backgrounds or dark mode |
| Keycaps for every shortcut | Spelled-out shortcuts |
| Violet for action | Several accent colours |
| Peach as a small highlight | Peach text or buttons |
| One ⌘K palette | Multiple search boxes |
| Shadows only when floating | Shadows on cards |
| Cursor bar on the website | Blinking cursor in the product |
| Palette types once on the website | Animation in the platform |


---

# Part 2 · Platform UI guideline

Rules for any platform, app, dashboard, admin or internal tool built in the Lilac Desk brand. It is generic: it works for projects, CRM, analytics, payments, AI agents or anything else.

**The platform never animates.** State changes are instant. Every rule here assumes light only.

---

## 1. Foundations for the platform

- **Ground:** `lavender` for the app canvas and sidebar. `white` for every working panel (cards, tables, forms, modals).
- **Text:** `ink` for headings and values, `ink-secondary` for labels and nav, `dusk` for help text and metadata.
- **Action colour:** `violet`. **Mark:** `peach` (small).
- **Density:** 14px text, 34px controls, 44px rows, 4px grid.

## 2. Type scale

| Style | Size / line | Weight | Family | Use |
|---|---|---|---|---|
| `ui-page-title` | 32 / 36 | 700 | Plus Jakarta Sans | Page title, one per screen |
| `ui-numeric` | 36 / 40 | 700 | Plus Jakarta Sans | KPI values, big totals |
| `ui-heading` | 16 / 24 | 600 | Plus Jakarta Sans | Card, section, modal headings |
| `ui-subheading` | 14 / 20 | 600 | Plus Jakarta Sans | Form group titles |
| `ui-body` | **14 / 20** | 400 | Plus Jakarta Sans | **Default text** |
| `ui-body-lg` | 16 / 24 | 400 | Plus Jakarta Sans | Empty states, onboarding |
| `ui-label` | 13 / 18 | 500 | Plus Jakarta Sans | Labels, nav items, buttons |
| `ui-small` | 12 / 16 | 400 | Plus Jakarta Sans | Help text, captions |
| `ui-meta` | 11 / 16 | 400 | Fira Code | IDs, timestamps, column headers |

Rules:

- Plus Jakarta Sans only for `ui-page-title`, `ui-numeric` and modal titles. Never in buttons, tables, forms, nav or badges.
- Numbers in tables use `font-variant-numeric: tabular-nums` and align right.
- Never below 11px (mono) or 12px (UI).

## 3. App layout

- **Sidebar:** 232px (60px collapsed), `lavender`, 1px `rule` right border, 16px top padding. Product mark at top. Groups titled with `ui-meta`.
- **Top bar:** 56px, `white`, 1px `rule` bottom border. Search left (320px max), actions right.
- **Page header:** breadcrumb in `ui-meta`, then `ui-page-title`, optional one-line description in `dusk`. Actions on the right, aligned to the title's baseline.
- **Content:** 24px padding, max width 1200px, 24px gap between blocks, 32px between page sections.
- **Breakpoints:** 640, 768, 1024, 1280. Below 1024 the sidebar becomes a drawer.

## 4. Components

### Buttons

| Variant | Look | Use |
|---|---|---|
| Primary | `violet` fill, `on-violet` text | The one main action per view |
| Secondary | `white` fill, 1px `rule-strong` border, `ink` text | Every other action |
| Ghost | No fill or border, `ink-secondary` text | Toolbars, cancel, low emphasis |
| Danger | `danger` fill, white text | Destructive confirmations only |

- Sizes: 28px (sm), **34px (default)**, 40px (lg). `radius-sm`. `ui-label` 13/500.
- States: hover = instant background change (`violet-hover`, `lilac`); focus = `focus-ring`; disabled = `opacity-disabled`.
- Labels are verbs in sentence case: "New project", "Export CSV".

### Text inputs, selects, textareas

- 34px tall, 12px horizontal padding, `radius-sm`, `white` fill, 1px `rule-strong` border, `placeholder` colour for placeholders.
- Label above (`ui-label`, `ink-secondary`), help or error below (`ui-small`), 6px gaps.
- Focus: `violet` border + `focus-ring`. Error: `danger` border and a message saying how to fix it.

### Checkbox, radio, toggle

- Checkbox 16px, `radius-xs`; checked = `violet` fill with white tick. Radio: 8px `violet` dot. Toggle 32 × 18px; on = `violet`.
- The label is always clickable and sits 10px to the right.

### Badges

- 22px tall, 8px padding, `radius-xs`, 12/500.
- Done (`violet-soft`/`violet-text`), Live or new (`peach-soft`/`peach-text`), Needs review (`warning-soft`/`warning`), Failed (`danger-soft`/`danger`), Draft (`lilac`/`dusk`).

### Tabs and segmented controls

- **Tabs:** Plus Jakarta Sans 13/500, 36px. Active = `ink` + 2px `violet` underline.
- **Segmented control:** `lilac` track, 3px padding; active segment = `white` with 1px `rule`.

### Tables

- `white` panel, 1px `rule`, `radius-md`, horizontal scroll on narrow screens.
- Header 36px, `lilac`, `ui-meta` labels in `dusk`. Rows 44px, 1px `rule` between rows. Hover = `lavender`. Selected = `violet-soft` with a 2px `violet` left edge.
- IDs in `ui-meta`. Amounts right-aligned, tabular. Status as badges.

### Cards and KPIs

- `white`, 1px `rule`, `radius-md`, 20px padding, no shadow. KPI: `ui-meta` label, value in `ui-numeric`, delta in `ui-small`.
- Signature detail (Keycaps) on one group per screen at most.

### Navigation

- Sidebar items: 30px, `radius-sm`, `ui-label`, 16px icon in `dusk`.
- Active: `violet-soft` background + `violet-text`, shortcut keycap on the right.
- Breadcrumbs in `ui-meta` separated by " / ".

### Modals and side sheets

- Widths 440 / 600 / 800px; `white`, `radius-lg`, `shadow-modal`. Backdrop `ink` at 20%.
- Title in Plus Jakarta Sans 24/30; footer buttons right-aligned, primary last. Escape closes; focus returns to the trigger.

### Toasts, banners, empty, loading and error states

- Toast: bottom-right, `white`, `radius-lg`, `shadow-pop`, one line + optional "Undo". No animation.
- Empty: centred, 20px icon in `dusk`, `ui-heading`, one line of `ui-body`, one primary button.
- Loading: static `lilac` skeleton blocks + a `ui-meta` "loading…" label. No spinners or shimmer.
- Error: danger banner with what failed and a "Try again" button.

### Data visualisation

- `chart-1` main series, `chart-2` comparison, `chart-3` other, `chart-highlight` for one value. Gridlines `rule`, axis labels `ui-meta`. No animation, no 3D, no gradients.

## 5. Patterns

- **Forms:** one column, max 560px. Labels above fields. Actions bottom-right, primary last.
- **List to detail:** clicking a row opens a side sheet for quick edits.
- **Destructive actions:** confirm in a modal that names the thing, with a danger button.
- **Settings:** left sub-nav (200px) + one form card per section.

## 6. No-motion rules

- Everything inside `.ld-app` has `transition: none; animation: none`.
- Hover, focus, open and close are instant. Progress is static text or a stepped bar.

## 7. Checklist for every screen

- [ ] `lavender` canvas, white panels, no dark areas
- [ ] One Plus Jakarta Sans page title; all other text Plus Jakarta Sans or mono
- [ ] One filled `violet` button
- [ ] `peach` only as a small mark
- [ ] 14px body, 34px controls, 44px rows, 4px grid
- [ ] Lines, not shadows (shadows only on floating things)
- [ ] Focus visible on every control
- [ ] Status has a word, not just colour
- [ ] Nothing animates


---

# Part 3 · Website guideline

How the Lilac Desk brand looks and moves on Sahil's website, landing pages and portfolio. Same palette and families as the platform, with bigger type, more air, and a defined motion system.

Light only: no dark bands, dark footers or dark cards.

---

## 1. Layout

- Max width 1120px, side padding 24px (16px on phones).
- 96px between sections (64px on phones); hero top spacing 128px (64px on phones).
- Text blocks max 60 characters wide.

## 2. Type scale

| Style | Size / line | Weight | Family | Use |
|---|---|---|---|---|
| `web-display` | 88 / 88 (48 / 50 on phones) | 700 | Plus Jakarta Sans | Hero headline |
| `web-h1` | 56 / 60 (36 on phones) | 700 | Plus Jakarta Sans | Section titles |
| `web-h2` | 40 / 46 (30 on phones) | 700 | Plus Jakarta Sans | Sub-sections, contact |
| `web-h3` | 20 / 28 | 600 | Plus Jakarta Sans | Card titles |
| `web-lead` | 19 / 30 | 400 | Plus Jakarta Sans | Intro paragraphs |
| `web-body` | 17 / 28 | 400 | Plus Jakarta Sans | Running text |
| `web-eyebrow` | 12 / 16 | 400 | Fira Code | Line above a headline |

- Accent: One violet word per headline, then the cursor bar (website only).
- Eyebrow: A keycap `⌘` plus Fira Code 12px `dusk`: `⌘ full stack ai engineer`.

## 3. Page anatomy

### Navigation

- 64px, `lavender` at 85% with blur. Left: wordmark. Centre: links. Right: a "⌘ K" keycap button that opens a site palette, and a violet button "Contact".

### Hero

- `lavender`. Centred headline (80px) with one violet word and the cursor bar, lead, violet button with a `↵` keycap. Below, a floating command palette over a soft violet-peach glow, with results that are real links (projects, writing, contact).

### Section header

- Fira Code eyebrow in a keycap, `web-h1`, description in `dusk`.

### Work cards

- White, `radius-md`, 1px `rule`, 24px padding, a keycap number (`1`, `2`, `3` jump to each card), Jakarta 20/600 title. Hover: border `violet`.

### Notes / writing list

- Rows like palette results: icon, title, date keycap on the right. Hover: `lilac` background.

### Contact

- A command palette with the query `contact sahil` and results: Email (Copy), LinkedIn, GitHub.

### Footer

- `lavender`, 1px `rule`, mono copyright, "Press ⌘K anywhere" hint.

## 4. Motion system

The website has **one orchestrated moment per page** (the hero) plus small responses to the user. Nothing else moves.

### Tokens

| Token | Value | Use |
|---|---|---|
| `duration-fast` | 150ms | Hover colour changes |
| `duration-base` | 220ms | Menus, accordions |
| `duration-reveal` | 700ms | Section fade-up |
| `duration-hero` | 900ms | Hero layers |
| `stagger` | 50ms | Delay between headline parts |
| Easing | `cubic-bezier(.2, .7, 0, 1)` | All reveals |

### The hero sequence (in order)

| Time | What happens | Spec |
|---|---|---|
| 0ms | Glow appears | Violet-peach glow fades in, 1200ms |
| 100ms | Headline rises | Words fade up, 600ms, 50ms apart |
| 600ms | Palette opens | The palette scales .97 → 1 and fades in, 300ms |
| 900ms | Query types | "projects" types in, 45ms per character |
| 1300ms | Results | Results fade in top to bottom, 40ms apart; the first is selected |
| ~1700ms | Done | The cursor blinks 3 times, then stays solid |

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
<header class="ldw-hero"><div class="ldw-glow"></div><h1 class="ldw-display">Build faster with <em>agents</em><span class="ldw-cursor"></span></h1>…<div class="ld-palette">…</div></header>
```

## 5. Checklist for every page

- [ ] Light only, no dark bands
- [ ] Headlines follow the accent rule (One violet word per headline, then the cursor bar (website only))
- [ ] Eyebrow above key headlines
- [ ] Signature details only where Part 1 allows them
- [ ] One hero motion sequence; everything readable before it plays
- [ ] Hover responses at 150ms
- [ ] Reduced motion respected
- [ ] One primary button per section


---

# Part 4 · Code

Copy each block into its own file, exactly as written. Component classes use the `.ld-` prefix (platform) and `.ldw-` (website).

## tokens.css

```css
/* Lilac Desk tokens · Sahil Shaikh. Light only: there is no dark theme. */
:root {
  color-scheme: light;
  --lavender: #f7f6fc;
  --white: #ffffff;
  --lilac: #efedf9;
  --rule: #e4e1f2;
  --rule-strong: #8b86a3;
  --ink: #16141f;
  --ink-secondary: #322f40;
  --dusk: #5e5a70;
  --placeholder: #67637a;
  --violet: #6a4fd8;
  --violet-hover: #573dc0;
  --violet-soft: #eeeafd;
  --violet-text: #5338bd;
  --on-violet: #ffffff;
  --peach: #ff9f7a;
  --peach-soft: #ffeee6;
  --peach-text: #a2441f;
  --success: var(--violet-text);
  --success-soft: var(--violet-soft);
  --warning: #8a5a00;
  --warning-soft: #fff4dc;
  --danger: #b42318;
  --danger-soft: #fdeceb;
  --chart-1: #6a4fd8;
  --chart-2: #b3a5f0;
  --chart-3: #cbc8da;
  --chart-highlight: #ff9f7a;
  --shadow-pop: 0 4px 12px -2px #16141f14, 0 2px 4px -2px #16141f0f;
  --shadow-modal: 0 20px 48px -12px #16141f2e, 0 4px 8px -4px #16141f14;
  --focus-ring: 0 0 0 2px #ffffff, 0 0 0 4px #6a4fd8;
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
  --radius-xs: 5px;
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
  --stagger: 50ms;
  --opacity-disabled: 0.45;
  --ease-reveal: cubic-bezier(.2, .7, 0, 1);
  --font-display: "Plus Jakarta Sans", system-ui, sans-serif;
  --font-ui: "Plus Jakarta Sans", system-ui, sans-serif;
  --font-mono: "Fira Code", ui-monospace, Menlo, monospace;
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
/* Platform UI never animates: wrap the app in .ld-app */
.ld-app, .ld-app * { transition: none !important; animation: none !important; }
@media (max-width: 760px) { .web-display { font-size: 48px; line-height: 50px; } .web-h1 { font-size: 36px; line-height: 40px; } .web-h2 { font-size: 30px; line-height: 34px; } }
```

## components.css

```css
/* Lilac Desk · components.css — reference styles for every component (.ld-* platform, shared by the website). Requires tokens.css. */
@import url("https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Fira+Code:wght@400;500&display=swap");
/* Lilac Desk components. .ld-* = platform UI (no motion). .ldw-* = website (motion allowed). */
body { margin: 0; font-family: var(--font-ui); font-size: 14px; line-height: 20px; color: var(--ink); background: var(--lavender); -webkit-font-smoothing: antialiased; }
.ld-pad { padding: var(--space-5); }
.ld-row { display: flex; flex-wrap: wrap; align-items: center; gap: var(--space-3); }
.ld-col { display: grid; gap: var(--space-4); }
.ld-grid { display: grid; gap: var(--space-4); grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); }
.ld-meta { font-family: var(--font-mono); font-size: 11px; line-height: 16px; color: var(--dusk); }
.ld-eyebrow { display: inline-flex; align-items: center; gap: var(--space-2); font-family: var(--font-mono); font-size: 11px; line-height: 16px; color: var(--dusk); }
.ld-num { font-variant-numeric: tabular-nums; }
.ld-app, .ld-app * { transition: none !important; animation: none !important; }
:where(.ld-btn, .ld-input, .ld-select, .ld-textarea, .ld-tab, .ld-seg button, .ld-nav a, .ld-check input, .ld-toggle input):focus-visible { outline: 2px solid transparent; box-shadow: var(--focus-ring); }


/* Buttons */
.ld-btn { font: inherit; font-size: 13px; line-height: 18px; font-weight: 500; height: var(--control-md); padding: 0 var(--space-3); display: inline-flex; align-items: center; justify-content: center; gap: 6px; border-radius: var(--radius-sm); border: 1px solid transparent; cursor: pointer; white-space: nowrap; text-decoration: none; background: transparent; color: var(--ink); }
.ld-btn svg { width: var(--icon-md); height: var(--icon-md); }
.ld-btn-sm { height: var(--control-sm); padding: 0 10px; font-size: 12px; }
.ld-btn-lg { height: var(--control-lg); padding: 0 var(--space-4); font-size: 14px; }
.ld-btn-primary { background: var(--violet); color: var(--on-violet); }
.ld-btn-primary:hover { background: var(--violet-hover); }
.ld-btn-secondary { background: var(--white); border-color: var(--rule-strong); }
.ld-btn-secondary:hover { background: var(--lilac); }
.ld-btn-ghost { color: var(--ink-secondary); }
.ld-btn-ghost:hover { background: var(--lilac); color: var(--ink); }
.ld-btn-danger { background: var(--danger); color: #ffffff; }
.ld-btn[disabled] { opacity: var(--opacity-disabled); cursor: not-allowed; }
.ld-icon { fill: none; stroke: currentColor; stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; width: var(--icon-md); height: var(--icon-md); flex: none; }

/* Fields */
.ld-field { display: grid; gap: 6px; min-width: 0; }
.ld-label { font-size: 13px; line-height: 18px; font-weight: 500; color: var(--ink-secondary); }
.ld-input, .ld-select, .ld-textarea { font: inherit; font-size: 14px; width: 100%; box-sizing: border-box; height: var(--control-md); padding: 0 var(--space-3); border-radius: var(--radius-sm); border: 1px solid var(--rule-strong); background: var(--white); color: var(--ink); }
.ld-textarea { height: 88px; padding-block: 8px; resize: vertical; }
.ld-select { appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='none' stroke='%235e5a70' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m4 6 4 4 4-4'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 10px center; padding-right: 34px; }
.ld-input::placeholder, .ld-textarea::placeholder { color: var(--placeholder); }
.ld-input:focus, .ld-select:focus, .ld-textarea:focus, .ld-input.is-focus { outline: none; border-color: var(--violet); box-shadow: var(--focus-ring); }
.ld-input.is-error { border-color: var(--danger); }
.ld-help { margin: 0; font-size: 12px; line-height: 16px; color: var(--dusk); }
.ld-help.is-error { color: var(--danger); }
.ld-check { display: inline-flex; align-items: center; gap: 10px; font-size: 14px; color: var(--ink-secondary); cursor: pointer; }
.ld-check input { appearance: none; margin: 0; width: 16px; height: 16px; border: 1px solid var(--rule-strong); border-radius: var(--radius-xs); background: var(--white); display: grid; place-items: center; cursor: pointer; }
.ld-check input:checked { background: var(--violet); border-color: var(--violet); }
.ld-check input:checked::after { content: ""; width: 4px; height: 8px; border: solid #ffffff; border-width: 0 2px 2px 0; transform: translateY(-1px) rotate(45deg); }
.ld-check input[type="radio"] { border-radius: 50%; }
.ld-check input[type="radio"]:checked { background: var(--white); border-color: var(--violet); }
.ld-check input[type="radio"]:checked::after { width: 8px; height: 8px; border: 0; border-radius: 50%; background: var(--violet); transform: none; }
.ld-toggle { display: inline-flex; align-items: center; gap: 10px; font-size: 14px; color: var(--ink-secondary); cursor: pointer; }
.ld-toggle input { appearance: none; margin: 0; width: 32px; height: 18px; border-radius: var(--radius-full); background: var(--rule-strong); position: relative; cursor: pointer; }
.ld-toggle input::after { content: ""; position: absolute; top: 2px; left: 2px; width: 14px; height: 14px; border-radius: 50%; background: #ffffff; }
.ld-toggle input:checked { background: var(--violet); }
.ld-toggle input:checked::after { left: 16px; }

/* Badges */
.ld-badge { display: inline-flex; align-items: center; gap: 6px; height: 22px; padding: 0 var(--space-2); border-radius: var(--radius-xs); font-size: 12px; line-height: 16px; font-weight: 500; background: var(--lilac); color: var(--dusk); white-space: nowrap; }
.ld-badge.dot::before { content: ""; width: 6px; height: 6px; background: currentColor; }
.ld-badge-done { background: var(--success-soft); color: var(--success); }
.ld-badge-live { background: var(--peach-soft); color: var(--peach-text); }
.ld-badge-warn { background: var(--warning-soft); color: var(--warning); }
.ld-badge-fail { background: var(--danger-soft); color: var(--danger); }
.ld-badge-mono { font-family: var(--font-mono); font-size: 11px; font-weight: 400; background: var(--white); border: 1px solid var(--rule); color: var(--ink-secondary); }

/* Tabs and segmented */
.ld-tabs { display: flex; gap: var(--space-5); border-bottom: 1px solid var(--rule); }
.ld-tab { font: inherit; background: none; border: 0; padding: 0; height: 36px; font-family: var(--font-mono); font-size: 11px; color: var(--dusk); border-bottom: 2px solid transparent; margin-bottom: -1px; cursor: pointer; }
.ld-tab:hover { color: var(--ink); }
.ld-tab[aria-selected="true"] { color: var(--ink); border-bottom-color: var(--ink); }
.ld-seg { display: inline-flex; gap: 2px; padding: 3px; background: var(--lilac); border-radius: var(--radius-sm); }
.ld-seg button { font: inherit; font-size: 13px; font-weight: 500; border: 1px solid transparent; background: none; color: var(--dusk); height: 28px; padding: 0 12px; border-radius: 4px; cursor: pointer; }
.ld-seg button[aria-pressed="true"] { background: var(--white); color: var(--ink); border-color: var(--rule); }

/* Cards and KPIs */
.ld-card { background: var(--white); border: 1px solid var(--rule); border-radius: var(--radius-md); padding: var(--space-5); min-width: 0; }
.ld-card-head { display: flex; justify-content: space-between; align-items: center; gap: var(--space-3); margin-bottom: var(--space-4); }
.ld-card-title { margin: 0; font-size: 16px; line-height: 24px; font-weight: 600; letter-spacing: -.01em; }
.ld-kpi-value { font-family: var(--font-display); font-size: 36px; line-height: 40px; font-weight: 700; letter-spacing: -0.03em; font-variant-numeric: tabular-nums; margin-top: var(--space-2); }
.ld-delta { font-size: 12px; line-height: 16px; font-weight: 500; color: var(--success); margin-top: var(--space-1); }
.ld-delta.warn { color: var(--warning); } .ld-delta.down { color: var(--danger); }

/* Table */
.ld-table-wrap { background: var(--white); border: 1px solid var(--rule); border-radius: var(--radius-md); overflow-x: auto; }
.ld-table { width: 100%; border-collapse: collapse; font-size: 14px; }
.ld-table th { height: 36px; padding: 0 var(--space-3); text-align: left; background: var(--lilac); border-bottom: 1px solid var(--rule); font-family: var(--font-mono); font-size: 11px; font-weight: 400; color: var(--dusk); white-space: nowrap; }
.ld-table td { height: var(--row-height); padding: 0 var(--space-3); border-bottom: 1px solid var(--rule); color: var(--ink-secondary); white-space: nowrap; }
.ld-table tbody tr:last-child td { border-bottom: 0; }
.ld-table tbody tr { cursor: pointer; }
.ld-table tbody tr:hover td { background: var(--lavender); }
.ld-table tbody tr[aria-selected="true"] td { background: var(--violet-soft); }
.ld-table tbody tr[aria-selected="true"] td:first-child { box-shadow: inset 2px 0 0 var(--violet); }
.ld-table .r { text-align: right; font-variant-numeric: tabular-nums; }
.ld-table .strong { color: var(--ink); font-weight: 500; }
.ld-table .id { font-family: var(--font-mono); font-size: 11px; color: var(--dusk); }
.ld-table-foot { display: flex; justify-content: space-between; gap: var(--space-3); padding: 10px var(--space-3); border-top: 1px solid var(--rule); font-size: 12px; color: var(--dusk); }

/* App shell */
.ld-app { display: grid; grid-template-columns: var(--sidebar-width) minmax(0, 1fr); min-height: 640px; background: var(--white); font-size: 14px; }
.ld-side { background: var(--lavender); border-right: 1px solid var(--rule); padding: var(--space-4) 10px; display: flex; flex-direction: column; gap: var(--space-5); }
.ld-brand { display: flex; align-items: center; gap: var(--space-2); padding: 0 6px; font-family: var(--font-display); font-size: 20px; line-height: 24px; color: var(--ink); }
.ld-nav { display: grid; gap: 2px; }
.ld-nav .ld-meta { padding: 0 8px 6px; }
.ld-nav a { display: flex; align-items: center; gap: 10px; height: 30px; padding: 0 8px; border-radius: var(--radius-sm); font-size: 13px; font-weight: 500; color: var(--ink-secondary); text-decoration: none; cursor: pointer; }
.ld-nav a .ld-icon { color: var(--dusk); }
.ld-nav a:hover { background: var(--white); color: var(--ink); }
.ld-nav a[aria-current="page"] { background: var(--violet-soft); color: var(--violet-text); }
.ld-nav a[aria-current="page"] .ld-icon { color: var(--violet-text); }
.ld-nav .count { margin-left: auto; font-family: var(--font-mono); font-size: 10px; color: var(--dusk); }
.ld-main { min-width: 0; display: flex; flex-direction: column; }
.ld-top { height: var(--topbar-height); border-bottom: 1px solid var(--rule); display: flex; align-items: center; gap: var(--space-3); padding: 0 var(--space-6); }
.ld-top .ld-input { max-width: 320px; }
.ld-top .right { margin-left: auto; display: flex; gap: var(--space-2); align-items: center; }
.ld-avatar { width: 30px; height: 30px; border-radius: 50%; background: var(--lavender); border: 1px solid var(--rule); display: grid; place-items: center; font-size: 11px; font-weight: 600; color: var(--ink-secondary); }
.ld-page { padding: var(--space-6); display: grid; gap: var(--space-6); max-width: var(--content-max); }
.ld-page-head { display: flex; justify-content: space-between; align-items: flex-end; gap: var(--space-4); flex-wrap: wrap; }
.ld-page-title { margin: 2px 0 0; font-family: var(--font-display); font-size: 32px; line-height: 36px; font-weight: 700; letter-spacing: -0.03em; }
.ld-page-sub { margin: var(--space-1) 0 0; color: var(--dusk); }

/* Modal, toast, banner, empty */
.ld-backdrop { background: rgba(22, 20, 31, .2); padding: var(--space-6); display: grid; place-items: center; }
.ld-modal { width: 100%; max-width: 440px; background: var(--white); border: 1px solid var(--rule); border-radius: var(--radius-lg); box-shadow: var(--shadow-modal); }
.ld-modal-head { display: flex; justify-content: space-between; gap: var(--space-3); padding: var(--space-5) var(--space-5) 0; }
.ld-modal-title { margin: 0; font-family: var(--font-display); font-size: 24px; line-height: 30px; font-weight: 700; }
.ld-modal-body { padding: var(--space-5); display: grid; gap: var(--space-4); }
.ld-modal-foot { display: flex; justify-content: flex-end; gap: var(--space-2); padding: var(--space-4) var(--space-5); border-top: 1px solid var(--rule); }
.ld-toast { display: inline-flex; align-items: center; gap: var(--space-3); padding: 12px var(--space-4); background: var(--white); border: 1px solid var(--rule); border-radius: var(--radius-lg); box-shadow: var(--shadow-pop); font-weight: 500; }
.ld-toast .ld-icon { color: var(--violet); }
.ld-banner { display: flex; align-items: center; gap: var(--space-3); padding: 12px var(--space-4); border-radius: var(--radius-md); font-size: 14px; }
.ld-banner .grow { flex: 1; }
.ld-banner-warn { background: var(--warning-soft); color: var(--warning); }
.ld-banner-fail { background: var(--danger-soft); color: var(--danger); }
.ld-banner-info { background: var(--violet-soft); color: var(--violet-text); }
.ld-empty { position: relative; overflow: hidden; text-align: center; padding: var(--space-12) var(--space-6); background: var(--white); border: 1px solid var(--rule); border-radius: var(--radius-md); }
.ld-empty > * { position: relative; }
.ld-empty .ld-icon { width: 20px; height: 20px; color: var(--dusk); }
.ld-empty h3 { margin: var(--space-3) 0 var(--space-1); font-size: 16px; line-height: 24px; font-weight: 600; }
.ld-empty p { margin: 0 auto var(--space-4); max-width: 40ch; color: var(--dusk); }
.ld-skel { background: var(--lilac); border-radius: 4px; height: 12px; }

/* Signature details */
.ld-mark { display: inline-block; width: 2px; height: .9em; background: var(--violet); flex: none; }
.ld-eyebrow::before { content: "⌘"; display: inline-grid; place-items: center; width: 18px; height: 18px; border-radius: 4px; background: var(--lilac); border: 1px solid var(--rule); border-bottom-width: 2px; font-size: 10px; }
.ld-accent { color: var(--violet); }
.ld-empty::before { content: none; }
/* Keycaps and command palette (signature) */
.ld-key { display: inline-grid; place-items: center; min-width: 20px; height: 20px; padding: 0 5px; border-radius: var(--radius-xs); background: var(--lilac); border: 1px solid var(--rule); border-bottom-width: 2px; font-family: var(--font-mono); font-size: 11px; color: var(--ink-secondary); }
.ld-palette { background: var(--white); border: 1px solid var(--rule); border-radius: var(--radius-lg); box-shadow: var(--shadow-modal); overflow: hidden; }
.ld-palette-search { height: 48px; display: flex; align-items: center; gap: var(--space-3); padding: 0 var(--space-4); border-bottom: 1px solid var(--rule); }
.ld-palette-item { display: flex; align-items: center; gap: var(--space-3); height: 40px; padding: 0 var(--space-4); }
.ld-palette-item[aria-selected="true"] { background: var(--violet-soft); color: var(--violet-text); }
```

## motion.css (website only)

```css
/* Lilac Desk · motion.css — WEBSITE ONLY. Never load inside the platform UI. Requires tokens.css. */
/* ---------------- Website ---------------- */
.fw { font-size: 17px; line-height: 28px; background: var(--lavender); }
.ldw-wrap { max-width: var(--site-max); margin: 0 auto; padding: 0 var(--space-6); }
.ldw-nav { display: flex; align-items: center; justify-content: space-between; height: 72px; }
.ldw-logo { display: flex; align-items: center; gap: var(--space-2); font-family: var(--font-display); font-size: 22px; line-height: 28px; color: var(--ink); text-decoration: none; }
.ldw-links { display: flex; align-items: center; gap: var(--space-6); font-size: 14px; font-weight: 500; color: var(--dusk); }
.ldw-links a { color: inherit; text-decoration: none; transition: color 150ms ease-out; }
.ldw-links a:hover { color: var(--ink); }
.ldw-links a[aria-current="page"] { color: var(--ink); text-decoration: underline; text-underline-offset: 6px; text-decoration-thickness: 1px; }
.fw .ld-btn { transition: background-color 150ms ease-out; }
.fw .ld-btn .arr { display: inline-block; transition: transform 150ms ease-out; }
.fw .ld-btn:hover .arr, .ldw-card:hover .arr { transform: translateX(3px); }
.ldw-display { margin: 0; font-family: var(--font-display); font-weight: 700; font-size: 88px; line-height: 84px; letter-spacing: -0.03em; max-width: 13ch; color: var(--ink); }
.ldw-display .w { display: inline-block; }
.ldw-lead { margin: var(--space-5) 0 var(--space-8); max-width: 44ch; font-size: 19px; line-height: 30px; color: var(--dusk); }
.ldw-cta { display: flex; gap: var(--space-3); flex-wrap: wrap; }
.ldw-sec-head { display: flex; justify-content: space-between; align-items: flex-end; gap: var(--space-4); flex-wrap: wrap; margin-bottom: var(--space-8); }
.ldw-h1 { margin: var(--space-3) 0 0; font-family: var(--font-display); font-weight: 700; font-size: 56px; line-height: 58px; letter-spacing: -0.03em; }
.ldw-h2 { margin: 0; font-family: var(--font-display); font-weight: 700; font-size: 40px; line-height: 44px; letter-spacing: -0.03em; }
.ldw-cards { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: var(--space-6); }
.ldw-card { display: flex; flex-direction: column; gap: var(--space-2); padding: var(--space-6); background: var(--white); border: 1px solid var(--rule); border-radius: var(--radius-md); text-decoration: none; color: var(--ink); min-width: 0; }
.ldw-shot { aspect-ratio: 16/10; border-radius: var(--radius-sm); background: var(--lavender); border: 1px solid var(--rule); margin-bottom: var(--space-3); padding: 12px; display: grid; gap: 8px; align-content: start; }
.ldw-shot span { height: 8px; border-radius: 4px; background: var(--lilac); }
.ldw-card h3 { margin: 0; font-size: 20px; line-height: 28px; font-weight: 600; letter-spacing: -.01em; display: flex; justify-content: space-between; transition: color 150ms ease-out; }
.ldw-card:hover h3 { color: var(--violet); }
.ldw-card p { margin: 0; font-size: 15px; line-height: 24px; color: var(--dusk); }
.ldw-card .tags { display: flex; gap: var(--space-2); flex-wrap: wrap; margin-top: var(--space-3); }
.ldw-notes { display: grid; }
.ldw-note { display: grid; grid-template-columns: 120px minmax(0, 1fr); gap: var(--space-4); padding: var(--space-5) 0; border-bottom: 1px solid var(--rule); text-decoration: none; color: var(--ink); }
.ldw-note b { display: block; font-family: var(--font-display); font-weight: 700; font-size: 24px; line-height: 30px; transition: color 150ms ease-out; }
.ldw-note:hover b { color: var(--violet); }
.ldw-note span { color: var(--dusk); font-size: 15px; }
@media (max-width: 760px) {
  .ldw-display { font-size: 48px; line-height: 48px; } .ldw-h1 { font-size: 36px; line-height: 40px; } .ldw-h2 { font-size: 30px; line-height: 34px; }
  .ldw-cards { grid-template-columns: 1fr; } .ldw-links { display: none; } .ldw-hero { padding: var(--space-5) var(--space-5) var(--space-10); }
  .ldw-note { grid-template-columns: 1fr; gap: var(--space-1); }
  .ld-app { grid-template-columns: 1fr; } .ld-side { display: none; }
}

/* Accent word */
.ldw-display em, .ldw-h1 em, .ldw-h2 em { font-style: normal; color: var(--violet); }
.ldw-cursor { display: inline-block; width: .06em; height: .9em; margin-left: .06em; background: var(--violet); vertical-align: -.08em; }

/* Hero (signature) */
.ldw-hero { text-align: center; padding: var(--space-24) 0 var(--space-16); position: relative; }
.ldw-glow { position: absolute; left: 50%; bottom: 0; width: 70%; height: 60%; transform: translateX(-50%); border-radius: 50%; background: radial-gradient(closest-side, rgba(106, 79, 216, .22), rgba(255, 159, 122, .14), transparent); filter: blur(20px); pointer-events: none; }
.ldw-hero .ld-palette { position: relative; max-width: 620px; margin: var(--space-12) auto 0; text-align: left; }

@media (prefers-reduced-motion: no-preference) {
  .ldw-play .ldw-glow { animation: ldw-glow 1200ms ease-out both; }
  @keyframes ldw-glow { from { opacity: 0; } to { opacity: 1; } }
  .ldw-play .ldw-display .w { animation: ldw-rise 600ms var(--ease-reveal) both; animation-delay: calc(100ms + var(--i) * var(--stagger)); }
  @keyframes ldw-rise { from { opacity: 0; transform: translateY(.3em); } to { opacity: 1; transform: none; } }
  .ldw-play .ld-palette { animation: ldw-open 300ms var(--ease-reveal) 600ms both; }
  @keyframes ldw-open { from { opacity: 0; transform: scale(.97); } to { opacity: 1; transform: none; } }
  .ldw-play .ld-palette-item { animation: ldw-item 250ms ease-out both; animation-delay: calc(1300ms + var(--i) * 40ms); }
  @keyframes ldw-item { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: none; } }
  .ldw-play .ldw-cursor { animation: ldw-blink 1s steps(1) 3 1700ms; }
  @keyframes ldw-blink { 50% { opacity: 0; } }
  .ldw-fade.ldw-in { animation: ldw-up var(--duration-reveal) var(--ease-reveal) both; }
  @keyframes ldw-up { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }
}

/* Usage
   1. Hero markup: <header class="ldw-hero"><div class="ldw-glow"></div><h1 class="ldw-display">Build faster with <em>agents</em><span class="ldw-cursor"></span></h1>…<div class="ld-palette">…</div></header>
   2. Split the headline into <span class="w" style="--i:N"> words (or lines), then add .ldw-play to the hero once it is in view.
   3. Section titles: add .ldw-fade; add .ldw-in when they first enter the viewport.
   Everything is visible before and without the script; prefers-reduced-motion turns all of it off. */
```

## tailwind-theme.css (only if the project uses Tailwind v4)

```css
@import "tailwindcss";
/* Lilac Desk · Tailwind v4 theme. Load tokens.css first. Light only. */
@theme inline {
  --color-lavender: var(--lavender);
  --color-white: var(--white);
  --color-lilac: var(--lilac);
  --color-rule: var(--rule);
  --color-rule-strong: var(--rule-strong);
  --color-ink: var(--ink);
  --color-ink-secondary: var(--ink-secondary);
  --color-dusk: var(--dusk);
  --color-placeholder: var(--placeholder);
  --color-violet: var(--violet);
  --color-violet-hover: var(--violet-hover);
  --color-violet-soft: var(--violet-soft);
  --color-violet-text: var(--violet-text);
  --color-on-violet: var(--on-violet);
  --color-peach: var(--peach);
  --color-peach-soft: var(--peach-soft);
  --color-peach-text: var(--peach-text);
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

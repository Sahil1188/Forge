# PORCELAIN.md · Sahil Shaikh brand (all-in-one)

**For Claude Code:** this single file contains the whole Porcelain system: brand rules, platform UI rules (no animation), website rules (with motion), and the complete CSS. Put it in the project root and add this line to `CLAUDE.md`:

```
All UI follows PORCELAIN.md. Before writing UI, create tokens.css, components.css (and motion.css for website pages) from Part 4 if they don't exist, then use only their variables and classes. Light only, never dark. Platform UI has no animation.
```

## How Claude Code should use this file

1. Decide the surface: **Platform UI** (app, dashboard, admin, settings) or **Website** (marketing, portfolio, landing). If unclear, assume Platform UI.
2. If `tokens.css` and `components.css` don't exist in the project, create them by copying the code blocks in Part 4 exactly. For website pages also create `motion.css`. With Tailwind v4 also create `tailwind-theme.css`.
3. Load the Google Fonts in Part 1, section 5.
4. Never hard-code colours, font sizes or fonts. Never add dark mode or dark sections.
5. Platform UI: wrap the app in `class="pc-app"` (kills all motion). Website: follow Part 3, section 4.
6. Finish by running the checklist at the end of Part 2 or Part 3.

---

Sahil Shaikh's brand and design system, **Porcelain**. Part 1 is the brand foundations, Part 2 the platform UI rules (no animation), Part 3 the website rules (with motion), Part 4 the code.

*Researched from: Things (Cultured Code), Apple product pages, Linear's settings screens. Inspired by, not copied from: no logos, fonts or assets of those products are used.*

---

# Part 1 · Brand foundations

The brand of Sahil Shaikh, Full Stack AI Engineer. **Porcelain**: a glazed porcelain tile: cool, smooth, precise, with a single cobalt brushstroke. It covers every platform Sahil designs and his website.

This system has three parts:

1. **Brand foundations** (Part 1): idea, logo, colour, type, layout, shape, icons, imagery, voice and accessibility.
2. **Platform UI** (Part 2): rules for any app, dashboard or tool. **No animation.**
3. **Website** (Part 3): the same brand with larger type and a defined motion system.

Light only. There is no dark theme, and no dark sections, panels or backgrounds anywhere.

---

## 1. The idea

| | |
|---|---|
| **Metaphor** | A glazed porcelain tile: cool, smooth, precise, with a single cobalt brushstroke. |
| **Personality** | Quiet, exact, premium. Feels like a well-made native app. |
| **Feeling we want** | "Everything here is where I expect it to be." |
| **Three ingredients** | **Glaze** (cool porcelain ground, white tiles with a light top edge) · **Cobalt** (one confident blue) · **Tile** (rounded-square icons and avatars) |

## 2. Principles

1. **Porcelain ground, white tiles.** Pages sit on cool `porcelain`; every working surface is a `white` tile.
2. **One cobalt stroke.** Cobalt marks the thing to do next. Nothing else is saturated.
3. **The glaze edge.** Feature tiles carry a 1px white highlight on their top edge, like light on glaze.
4. **Native calm.** Geist everywhere, tight headings, generous padding, no decoration that isn't functional.
5. **Tiles, not circles.** Icons and avatars are rounded squares (22% radius), never circles.
6. **Quiet product, one sheen on the website.** The platform never moves; the website hero has one light sweep.
7. **Accessible always.** Text 4.5:1 or better, borders and indicators 3:1, focus always visible.

## 3. Logo

- **Wordmark:** a 14px cobalt tile (22% radius) holding a white "S", followed by "Sahil Shaikh" in Geist 600, `ink`, tracking -0.02em.
- **Product mark:** the tile + product name in Geist 600 ("Workspace").
- **App icon / avatar:** a `white` tile, 1px `rule` border, 22% radius, the glaze highlight on the top edge, a Geist 600 "S" in `cobalt`.
- **Clear space:** half the tile size on every side. **Minimum size:** wordmark 88px wide; icon 20px.
- **Never:** use a circle, add gradients or drop shadows, put the logo on a dark ground, recolour the tile.

## 4. Colour

### Core palette

| Token | Hex | Role |
|---|---|---|
| `porcelain` | #F3F5F8 | Page ground, sidebar, website background |
| `white` | #FFFFFF | Cards, tables, inputs, modals |
| `mist` | #EAEEF3 | Hover rows, table headers, segmented track |
| `rule` | #DFE4EA | Dividers and borders |
| `rule-strong` | #8A94A3 | Input borders, strong dividers |
| `ink` | #15181D | Headings, primary text |
| `ink-secondary` | #343A44 | Labels, nav, table text |
| `slate` | #5B6472 | Secondary text, meta labels |
| `placeholder` | #6B7482 | Placeholders, disabled text |
| `cobalt` | #2557D6 | Primary action, links, focus, accent word |
| `cobalt-hover` | #1D47B3 | Hover/pressed cobalt |
| `cobalt-soft` / `cobalt-text` | #E6EDFC / #1C47B0 | Selected, active, success |
| `glaze` | #3FA7F5 | Live dots, the sheen, "syncing" states |
| `glaze-soft` / `glaze-text` | #E4F3FE / #0B5F99 | Soft glaze badges |
| `warning` / `warning-soft` | #8A5A00 / #FFF4DC | Needs attention |
| `danger` / `danger-soft` | #B42318 / #FDECEB | Errors, destructive |

### Charts

`chart-1` cobalt #2557D6, `chart-2` #8FA8E8, `chart-3` #B9C1CC, and `chart-highlight` glaze #3FA7F5 for the one value that matters. Gridlines use `rule`, axis labels use `ui-meta` in `slate`.

### Proportions

About 62% porcelain, 26% white, 8% lines and text, 3% cobalt, 1% glaze.

### Rules

- Cobalt is the only colour on buttons and links. One filled cobalt button per view.
- Glaze blue is a light, never text on white and never a button: live dots, the hero sheen, sync states.
- Status always has a word, never colour alone.
- No gradients in the product. On the website, one light sheen sweeps across the hero once.
- Never use `ink` or `slate` as a background.

## 5. Typography

Three roles, all free on Google Fonts:

`https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600&family=Geist+Mono:wght@400;500&display=swap`

| Family | Role | Use | Weights |
|---|---|---|---|
| **Geist** | **The voice** | Page titles, big numbers, website headlines (600, tight) | 600 |
| **Geist** | **The clarity** | All UI and body text | 400, 500, 600 |
| **Geist Mono** | **The precision** | IDs, timestamps, keyboard hints, column headers | 400, 500 |

- **Accent word:** one word per headline may be `cobalt`, same weight. Never more than one.
- Headlines are tight (-0.035em) and short; body text is never below 14px in the product.
- Mono is for data only: IDs, times, shortcuts. Labels stay in Geist.
- Sentence case everywhere. No ALL CAPS.
- Full scales are in Part 2 (platform) and Part 3 (website).

## 6. Layout and spacing

- **4px grid:** 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 96, 128.
- **Platform:** sidebar on `porcelain`, content on `white`, 24px page padding, max 1200px.
- **Website:** 1120px max width, 96px between sections.
- Align to a left edge in the product. Centre only short single lines (an empty state).

## 7. Shape and depth

| Token | Value | Use |
|---|---|---|
| `radius-xs` | 4px | Badges, checkboxes |
| `radius-sm` | 8px | Buttons, inputs, nav items |
| `radius-md` | 12px | Cards, tables, menus |
| `radius-lg` | 18px | Modals, website tiles |
| `radius-full` | 9999px | Toggles, dots |

- **Glaze edge** (signature): feature tiles get `box-shadow: inset 0 1px 0 #fff` plus a 1px `rule` border. Use on one group per screen.
- **Tile icons** (signature): icons in empty states and feature lists sit on 36px `mist` tiles with 22% radius.
- Shadows: `shadow-pop` for menus and toasts, `shadow-modal` for modals. Cards never cast a shadow.

## 8. Iconography

- SF Symbols style via Lucide, 1.5px stroke. 16px in controls, 20px in the sidebar. `slate` by default, `cobalt` when active.
- Icon-only buttons always have an accessible label.

## 9. Imagery

- Product screenshots on a `porcelain` field inside a `radius-lg` white tile with the glaze edge.
- Illustrations are flat tiles and simple shapes in cobalt, glaze and mist. No people illustrations.
- Portraits: soft daylight, light cool background, cropped square with 22% radius.

## 10. Voice and writing

- Calm and exact, like good system copy: short sentences, no exclamation marks.
- Lead with what something does: "Agents plan, build and review work together."
- Buttons are verbs: "New project", "Save changes". Confirmations say what happened: "Project created."
- Errors say what went wrong and how to fix it: "Name is required. Add a project name to continue."
- Numbers: "AED 1,250.00", dates "21 Oct 2026", times "14:32".
- No buzzwords, no exclamation marks, no emoji in UI.

## 11. Accessibility

- Every text colour pair passes WCAG AA (4.5:1). Borders, focus rings and indicators pass 3:1.
- Focus ring: 2px white gap + 2px `cobalt`, on every interactive element.
- Never rely on colour alone; pair it with a word, icon or position.
- Hit targets at least 28px (34px default).
- The website respects `prefers-reduced-motion`: all motion off, content visible immediately.

Measured contrast for this palette:

| Pair | Ratio | Needed |
|---|---|---|
| Body text `ink` on `white` | 17.79:1 | 4.5:1 |
| `slate` on `porcelain` | 5.48:1 | 4.5:1 |
| `slate` on `mist` | 5.13:1 | 4.5:1 |
| White on `cobalt` (primary button) | 6.15:1 | 4.5:1 |
| `cobalt` links on `white` | 6.15:1 | 4.5:1 |
| `cobalt-text` on `cobalt-soft` | 6.94:1 | 4.5:1 |
| `glaze-text` on `glaze-soft` | 5.96:1 | 4.5:1 |
| `placeholder` on `white` | 4.72:1 | 4.5:1 |
| `rule-strong` borders on `white` | 3.07:1 | 3:1 |
| `ink` on `glaze` (mark used as a fill) | 6.83:1 | 4.5:1 |

## 12. Do and don't

| Do | Don't |
|---|---|
| Porcelain ground, white tiles | Dark backgrounds or dark mode |
| Geist for everything | Mixing in a second display face |
| One cobalt word per headline | Several coloured words |
| Glaze blue as a light | Glaze blue text or buttons |
| Rounded-square icons and avatars | Circles for avatars |
| Glaze edge on one feature group | Shadows on every card |
| Mono for data | Mono for labels or buttons |
| One sheen on the website hero | Any animation in the platform |


---

# Part 2 · Platform UI guideline

Rules for any platform, app, dashboard, admin or internal tool built in the Porcelain brand. It is generic: it works for projects, CRM, analytics, payments, AI agents or anything else.

**The platform never animates.** State changes are instant. Every rule here assumes light only.

---

## 1. Foundations for the platform

- **Ground:** `porcelain` for the app canvas and sidebar. `white` for every working panel (cards, tables, forms, modals).
- **Text:** `ink` for headings and values, `ink-secondary` for labels and nav, `slate` for help text and metadata.
- **Action colour:** `cobalt`. **Mark:** `glaze` (small).
- **Density:** 14px text, 34px controls, 44px rows, 4px grid.

## 2. Type scale

| Style | Size / line | Weight | Family | Use |
|---|---|---|---|---|
| `ui-page-title` | 32 / 36 | 600 | Geist | Page title, one per screen |
| `ui-numeric` | 36 / 40 | 600 | Geist | KPI values, big totals |
| `ui-heading` | 16 / 24 | 600 | Geist | Card, section, modal headings |
| `ui-subheading` | 14 / 20 | 600 | Geist | Form group titles |
| `ui-body` | **14 / 20** | 400 | Geist | **Default text** |
| `ui-body-lg` | 16 / 24 | 400 | Geist | Empty states, onboarding |
| `ui-label` | 13 / 18 | 500 | Geist | Labels, nav items, buttons |
| `ui-small` | 12 / 16 | 400 | Geist | Help text, captions |
| `ui-meta` | 11 / 16 | 400 | Geist Mono | IDs, timestamps, column headers |

Rules:

- Geist only for `ui-page-title`, `ui-numeric` and modal titles. Never in buttons, tables, forms, nav or badges.
- Numbers in tables use `font-variant-numeric: tabular-nums` and align right.
- Never below 11px (mono) or 12px (UI).

## 3. App layout

- **Sidebar:** 232px (60px collapsed), `porcelain`, 1px `rule` right border, 16px top padding. Product mark at top. Groups titled with `ui-meta`.
- **Top bar:** 56px, `white`, 1px `rule` bottom border. Search left (320px max), actions right.
- **Page header:** breadcrumb in `ui-meta`, then `ui-page-title`, optional one-line description in `slate`. Actions on the right, aligned to the title's baseline.
- **Content:** 24px padding, max width 1200px, 24px gap between blocks, 32px between page sections.
- **Breakpoints:** 640, 768, 1024, 1280. Below 1024 the sidebar becomes a drawer.

## 4. Components

### Buttons

| Variant | Look | Use |
|---|---|---|
| Primary | `cobalt` fill, `on-cobalt` text | The one main action per view |
| Secondary | `white` fill, 1px `rule-strong` border, `ink` text | Every other action |
| Ghost | No fill or border, `ink-secondary` text | Toolbars, cancel, low emphasis |
| Danger | `danger` fill, white text | Destructive confirmations only |

- Sizes: 28px (sm), **34px (default)**, 40px (lg). `radius-sm`. `ui-label` 13/500.
- States: hover = instant background change (`cobalt-hover`, `mist`); focus = `focus-ring`; disabled = `opacity-disabled`.
- Labels are verbs in sentence case: "New project", "Export CSV".

### Text inputs, selects, textareas

- 34px tall, 12px horizontal padding, `radius-sm`, `white` fill, 1px `rule-strong` border, `placeholder` colour for placeholders.
- Label above (`ui-label`, `ink-secondary`), help or error below (`ui-small`), 6px gaps.
- Focus: `cobalt` border + `focus-ring`. Error: `danger` border and a message saying how to fix it.

### Checkbox, radio, toggle

- Checkbox 16px, `radius-xs`; checked = `cobalt` fill with white tick. Radio: 8px `cobalt` dot. Toggle 32 × 18px; on = `cobalt`.
- The label is always clickable and sits 10px to the right.

### Badges

- 22px tall, 8px padding, `radius-xs`, 12/500.
- Done (`cobalt-soft`/`cobalt-text`), Live or new (`glaze-soft`/`glaze-text`), Needs review (`warning-soft`/`warning`), Failed (`danger-soft`/`danger`), Draft (`mist`/`slate`).

### Tabs and segmented controls

- **Tabs:** Geist 13/500 labels, 36px tall. Active = `ink` text + 2px `cobalt` underline.
- **Segmented control:** `mist` track, 3px padding; active segment = `white` with 1px `rule`.

### Tables

- `white` panel, 1px `rule`, `radius-md`, horizontal scroll on narrow screens.
- Header 36px, `mist`, `ui-meta` labels in `slate`. Rows 44px, 1px `rule` between rows. Hover = `porcelain`. Selected = `cobalt-soft` with a 2px `cobalt` left edge.
- IDs in `ui-meta`. Amounts right-aligned, tabular. Status as badges.

### Cards and KPIs

- `white`, 1px `rule`, `radius-md`, 20px padding, no shadow. KPI: `ui-meta` label, value in `ui-numeric`, delta in `ui-small`.
- Signature detail (Glaze edge) on one group per screen at most.

### Navigation

- Sidebar items: 30px, `radius-sm`, `ui-label`, 16px icon in `slate`.
- Active: `accent-soft` background + `accent-text`.
- Breadcrumbs in `ui-meta` separated by " / ".

### Modals and side sheets

- Widths 440 / 600 / 800px; `white`, `radius-lg`, `shadow-modal`. Backdrop `ink` at 20%.
- Title in Geist 24/30; footer buttons right-aligned, primary last. Escape closes; focus returns to the trigger.

### Toasts, banners, empty, loading and error states

- Toast: bottom-right, `white`, `radius-lg`, `shadow-pop`, one line + optional "Undo". No animation.
- Empty: centred, 20px icon in `slate`, `ui-heading`, one line of `ui-body`, one primary button.
- Loading: static `mist` skeleton blocks + a `ui-meta` "loading…" label. No spinners or shimmer.
- Error: danger banner with what failed and a "Try again" button.

### Data visualisation

- `chart-1` main series, `chart-2` comparison, `chart-3` other, `chart-highlight` for one value. Gridlines `rule`, axis labels `ui-meta`. No animation, no 3D, no gradients.

## 5. Patterns

- **Forms:** one column, max 560px. Labels above fields. Actions bottom-right, primary last.
- **List to detail:** clicking a row opens a side sheet for quick edits.
- **Destructive actions:** confirm in a modal that names the thing, with a danger button.
- **Settings:** left sub-nav (200px) + one form card per section.

## 6. No-motion rules

- Everything inside `.pc-app` has `transition: none; animation: none`.
- Hover, focus, open and close are instant. Progress is static text or a stepped bar.

## 7. Checklist for every screen

- [ ] `porcelain` canvas, white panels, no dark areas
- [ ] One Geist page title; all other text Geist or mono
- [ ] One filled `cobalt` button
- [ ] `glaze` only as a small mark
- [ ] 14px body, 34px controls, 44px rows, 4px grid
- [ ] Lines, not shadows (shadows only on floating things)
- [ ] Focus visible on every control
- [ ] Status has a word, not just colour
- [ ] Nothing animates


---

# Part 3 · Website guideline

How the Porcelain brand looks and moves on Sahil's website, landing pages and portfolio. Same palette and families as the platform, with bigger type, more air, and a defined motion system.

Light only: no dark bands, dark footers or dark cards.

---

## 1. Layout

- Max width 1120px, side padding 24px (16px on phones).
- 96px between sections (64px on phones); hero top spacing 128px (64px on phones).
- Text blocks max 60 characters wide.

## 2. Type scale

| Style | Size / line | Weight | Family | Use |
|---|---|---|---|---|
| `web-display` | 88 / 88 (48 / 50 on phones) | 600 | Geist | Hero headline |
| `web-h1` | 56 / 60 (36 on phones) | 600 | Geist | Section titles |
| `web-h2` | 40 / 46 (30 on phones) | 600 | Geist | Sub-sections, contact |
| `web-h3` | 20 / 28 | 600 | Geist | Card titles |
| `web-lead` | 19 / 30 | 400 | Geist | Intro paragraphs |
| `web-body` | 17 / 28 | 400 | Geist | Running text |
| `web-eyebrow` | 12 / 16 | 400 | Geist Mono | Line above a headline |

- Accent: One word per headline in `cobalt`.
- Eyebrow: Geist Mono 12px `slate`, led by a 6px `glaze` dot: `● full stack ai engineer · dubai`.

## 3. Page anatomy

### Navigation

- 72px, `porcelain` at 85% with a 16px backdrop blur when sticky. Left: wordmark. Right: 3–4 links in Geist 14/500 `slate`, one primary button "Get in touch". Active link: `ink` with a 2px `cobalt` dot underneath.

### Hero

- Full-bleed `porcelain`. Centre-left headline, lead, two buttons. To the right, one large white app tile (radius 28px, glaze edge) showing a real screen. One soft cobalt radial light behind the tile at 10% opacity.

### Section header

- Eyebrow + `web-h1` on the left, a one-line description in `slate` on the right.

### Work cards

- White tiles, `radius-lg`, glaze edge, 24px padding. 36px icon tile, `web-h3` title, two lines of `slate` text. Hover: the tile's border turns `cobalt`; nothing lifts.

### Notes / writing list

- Rows with the date in Geist Mono (left, 120px), title in Geist 20/600, summary in `slate`. Hover: title turns `cobalt`.

### Contact

- A white tile with the glaze edge: `web-h2` headline, the email as selectable text with a Copy button, social links as 36px icon tiles.

### Footer

- `porcelain`, 1px `rule` top, copyright in Geist Mono on the left, links on the right.

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
| 0ms | Tile rises | The app tile: opacity 0 → 1, translateY 24px → 0, scale .98 → 1, 800ms |
| 150ms | Headline settles | Each word: opacity 0 → 1, translateY .3em → 0, 600ms, 50ms apart |
| 700ms | Glaze sheen | A white diagonal sheen crosses the tile once, 1100ms, then never again |
| 900ms | Live dot | The glaze dot in the eyebrow pulses twice, then stops |
| ~1200ms | Done | Lead and buttons were visible from the first frame |

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
<header class="pcw-hero"><div class="pcw-light"></div><div class="in">…<h1 class="pcw-display">Software that feels <em>native</em>.</h1>…</div><div class="pcw-apptile">…screenshot…</div></header>
```

## 5. Checklist for every page

- [ ] Light only, no dark bands
- [ ] Headlines follow the accent rule (One word per headline in `cobalt`)
- [ ] Eyebrow above key headlines
- [ ] Signature details only where Part 1 allows them
- [ ] One hero motion sequence; everything readable before it plays
- [ ] Hover responses at 150ms
- [ ] Reduced motion respected
- [ ] One primary button per section


---

# Part 4 · Code

Copy each block into its own file, exactly as written. Component classes use the `.pc-` prefix (platform) and `.pcw-` (website).

## tokens.css

```css
/* Porcelain tokens · Sahil Shaikh. Light only: there is no dark theme. */
:root {
  color-scheme: light;
  --porcelain: #f3f5f8;
  --white: #ffffff;
  --mist: #eaeef3;
  --rule: #dfe4ea;
  --rule-strong: #8a94a3;
  --ink: #15181d;
  --ink-secondary: #343a44;
  --slate: #5b6472;
  --placeholder: #6b7482;
  --cobalt: #2557d6;
  --cobalt-hover: #1d47b3;
  --cobalt-soft: #e6edfc;
  --cobalt-text: #1c47b0;
  --on-cobalt: #ffffff;
  --glaze: #3fa7f5;
  --glaze-soft: #e4f3fe;
  --glaze-text: #0b5f99;
  --success: var(--cobalt-text);
  --success-soft: var(--cobalt-soft);
  --warning: #8a5a00;
  --warning-soft: #fff4dc;
  --danger: #b42318;
  --danger-soft: #fdeceb;
  --chart-1: #2557d6;
  --chart-2: #8fa8e8;
  --chart-3: #b9c1cc;
  --chart-highlight: #3fa7f5;
  --shadow-pop: 0 4px 12px -2px #15181d14, 0 2px 4px -2px #15181d0f;
  --shadow-modal: 0 20px 48px -12px #15181d2e, 0 4px 8px -4px #15181d14;
  --focus-ring: 0 0 0 2px #ffffff, 0 0 0 4px #2557d6;
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
  --radius-lg: 18px;
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
  --font-display: Geist, "SF Pro Display", system-ui, sans-serif;
  --font-ui: Geist, "SF Pro Text", system-ui, sans-serif;
  --font-mono: "Geist Mono", "SF Mono", ui-monospace, Menlo, monospace;
}
.ui-page-title { font-family: var(--font-display); font-size: 32px; line-height: 36px; font-weight: 600; letter-spacing: -0.035em;  }
.ui-numeric { font-family: var(--font-display); font-size: 36px; line-height: 40px; font-weight: 600; letter-spacing: -0.035em; font-variant-numeric: tabular-nums;  }
.ui-heading { font-family: var(--font-ui); font-size: 16px; line-height: 24px; font-weight: 600; letter-spacing: -0.01em; }
.ui-subheading { font-family: var(--font-ui); font-size: 14px; line-height: 20px; font-weight: 600; }
.ui-body { font-family: var(--font-ui); font-size: 14px; line-height: 20px; font-weight: 400; }
.ui-body-lg { font-family: var(--font-ui); font-size: 16px; line-height: 24px; font-weight: 400; }
.ui-label { font-family: var(--font-ui); font-size: 13px; line-height: 18px; font-weight: 500; }
.ui-small { font-family: var(--font-ui); font-size: 12px; line-height: 16px; font-weight: 400; }
.ui-meta { font-family: var(--font-mono); font-size: 11px; line-height: 16px; font-weight: 400; }
.web-display { font-family: var(--font-display); font-size: 88px; line-height: 88px; font-weight: 600; letter-spacing: -0.035em;  }
.web-h1 { font-family: var(--font-display); font-size: 56px; line-height: 60px; font-weight: 600; letter-spacing: -0.035em;  }
.web-h2 { font-family: var(--font-display); font-size: 40px; line-height: 46px; font-weight: 600; letter-spacing: -0.035em;  }
.web-h3 { font-family: var(--font-ui); font-size: 20px; line-height: 28px; font-weight: 600; letter-spacing: -0.01em; }
.web-lead { font-family: var(--font-ui); font-size: 19px; line-height: 30px; font-weight: 400; }
.web-body { font-family: var(--font-ui); font-size: 17px; line-height: 28px; font-weight: 400; }
.web-eyebrow { font-family: var(--font-mono); font-size: 12px; line-height: 16px; font-weight: 400; }
/* Platform UI never animates: wrap the app in .pc-app */
.pc-app, .pc-app * { transition: none !important; animation: none !important; }
@media (max-width: 760px) { .web-display { font-size: 48px; line-height: 50px; } .web-h1 { font-size: 36px; line-height: 40px; } .web-h2 { font-size: 30px; line-height: 34px; } }
```

## components.css

```css
/* Porcelain · components.css — reference styles for every component (.pc-* platform, shared by the website). Requires tokens.css. */
@import url("https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600&family=Geist+Mono:wght@400;500&display=swap");
/* Porcelain components. .pc-* = platform UI (no motion). .pcw-* = website (motion allowed). */
body { margin: 0; font-family: var(--font-ui); font-size: 14px; line-height: 20px; color: var(--ink); background: var(--porcelain); -webkit-font-smoothing: antialiased; }
.pc-pad { padding: var(--space-5); }
.pc-row { display: flex; flex-wrap: wrap; align-items: center; gap: var(--space-3); }
.pc-col { display: grid; gap: var(--space-4); }
.pc-grid { display: grid; gap: var(--space-4); grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); }
.pc-meta { font-family: var(--font-mono); font-size: 11px; line-height: 16px; color: var(--slate); }
.pc-eyebrow { display: inline-flex; align-items: center; gap: var(--space-2); font-family: var(--font-mono); font-size: 11px; line-height: 16px; color: var(--slate); }
.pc-num { font-variant-numeric: tabular-nums; }
.pc-app, .pc-app * { transition: none !important; animation: none !important; }
:where(.pc-btn, .pc-input, .pc-select, .pc-textarea, .pc-tab, .pc-seg button, .pc-nav a, .pc-check input, .pc-toggle input):focus-visible { outline: 2px solid transparent; box-shadow: var(--focus-ring); }


/* Buttons */
.pc-btn { font: inherit; font-size: 13px; line-height: 18px; font-weight: 500; height: var(--control-md); padding: 0 var(--space-3); display: inline-flex; align-items: center; justify-content: center; gap: 6px; border-radius: var(--radius-sm); border: 1px solid transparent; cursor: pointer; white-space: nowrap; text-decoration: none; background: transparent; color: var(--ink); }
.pc-btn svg { width: var(--icon-md); height: var(--icon-md); }
.pc-btn-sm { height: var(--control-sm); padding: 0 10px; font-size: 12px; }
.pc-btn-lg { height: var(--control-lg); padding: 0 var(--space-4); font-size: 14px; }
.pc-btn-primary { background: var(--cobalt); color: var(--on-cobalt); }
.pc-btn-primary:hover { background: var(--cobalt-hover); }
.pc-btn-secondary { background: var(--white); border-color: var(--rule-strong); }
.pc-btn-secondary:hover { background: var(--mist); }
.pc-btn-ghost { color: var(--ink-secondary); }
.pc-btn-ghost:hover { background: var(--mist); color: var(--ink); }
.pc-btn-danger { background: var(--danger); color: #ffffff; }
.pc-btn[disabled] { opacity: var(--opacity-disabled); cursor: not-allowed; }
.pc-icon { fill: none; stroke: currentColor; stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; width: var(--icon-md); height: var(--icon-md); flex: none; }

/* Fields */
.pc-field { display: grid; gap: 6px; min-width: 0; }
.pc-label { font-size: 13px; line-height: 18px; font-weight: 500; color: var(--ink-secondary); }
.pc-input, .pc-select, .pc-textarea { font: inherit; font-size: 14px; width: 100%; box-sizing: border-box; height: var(--control-md); padding: 0 var(--space-3); border-radius: var(--radius-sm); border: 1px solid var(--rule-strong); background: var(--white); color: var(--ink); }
.pc-textarea { height: 88px; padding-block: 8px; resize: vertical; }
.pc-select { appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='none' stroke='%235b6472' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m4 6 4 4 4-4'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 10px center; padding-right: 34px; }
.pc-input::placeholder, .pc-textarea::placeholder { color: var(--placeholder); }
.pc-input:focus, .pc-select:focus, .pc-textarea:focus, .pc-input.is-focus { outline: none; border-color: var(--cobalt); box-shadow: var(--focus-ring); }
.pc-input.is-error { border-color: var(--danger); }
.pc-help { margin: 0; font-size: 12px; line-height: 16px; color: var(--slate); }
.pc-help.is-error { color: var(--danger); }
.pc-check { display: inline-flex; align-items: center; gap: 10px; font-size: 14px; color: var(--ink-secondary); cursor: pointer; }
.pc-check input { appearance: none; margin: 0; width: 16px; height: 16px; border: 1px solid var(--rule-strong); border-radius: var(--radius-xs); background: var(--white); display: grid; place-items: center; cursor: pointer; }
.pc-check input:checked { background: var(--cobalt); border-color: var(--cobalt); }
.pc-check input:checked::after { content: ""; width: 4px; height: 8px; border: solid #ffffff; border-width: 0 2px 2px 0; transform: translateY(-1px) rotate(45deg); }
.pc-check input[type="radio"] { border-radius: 50%; }
.pc-check input[type="radio"]:checked { background: var(--white); border-color: var(--cobalt); }
.pc-check input[type="radio"]:checked::after { width: 8px; height: 8px; border: 0; border-radius: 50%; background: var(--cobalt); transform: none; }
.pc-toggle { display: inline-flex; align-items: center; gap: 10px; font-size: 14px; color: var(--ink-secondary); cursor: pointer; }
.pc-toggle input { appearance: none; margin: 0; width: 32px; height: 18px; border-radius: var(--radius-full); background: var(--rule-strong); position: relative; cursor: pointer; }
.pc-toggle input::after { content: ""; position: absolute; top: 2px; left: 2px; width: 14px; height: 14px; border-radius: 50%; background: #ffffff; }
.pc-toggle input:checked { background: var(--cobalt); }
.pc-toggle input:checked::after { left: 16px; }

/* Badges */
.pc-badge { display: inline-flex; align-items: center; gap: 6px; height: 22px; padding: 0 var(--space-2); border-radius: var(--radius-xs); font-size: 12px; line-height: 16px; font-weight: 500; background: var(--mist); color: var(--slate); white-space: nowrap; }
.pc-badge.dot::before { content: ""; width: 6px; height: 6px; background: currentColor; }
.pc-badge-done { background: var(--success-soft); color: var(--success); }
.pc-badge-live { background: var(--glaze-soft); color: var(--glaze-text); }
.pc-badge-warn { background: var(--warning-soft); color: var(--warning); }
.pc-badge-fail { background: var(--danger-soft); color: var(--danger); }
.pc-badge-mono { font-family: var(--font-mono); font-size: 11px; font-weight: 400; background: var(--white); border: 1px solid var(--rule); color: var(--ink-secondary); }

/* Tabs and segmented */
.pc-tabs { display: flex; gap: var(--space-5); border-bottom: 1px solid var(--rule); }
.pc-tab { font: inherit; background: none; border: 0; padding: 0; height: 36px; font-family: var(--font-mono); font-size: 11px; color: var(--slate); border-bottom: 2px solid transparent; margin-bottom: -1px; cursor: pointer; }
.pc-tab:hover { color: var(--ink); }
.pc-tab[aria-selected="true"] { color: var(--ink); border-bottom-color: var(--ink); }
.pc-seg { display: inline-flex; gap: 2px; padding: 3px; background: var(--mist); border-radius: var(--radius-sm); }
.pc-seg button { font: inherit; font-size: 13px; font-weight: 500; border: 1px solid transparent; background: none; color: var(--slate); height: 28px; padding: 0 12px; border-radius: 4px; cursor: pointer; }
.pc-seg button[aria-pressed="true"] { background: var(--white); color: var(--ink); border-color: var(--rule); }

/* Cards and KPIs */
.pc-card { background: var(--white); border: 1px solid var(--rule); border-radius: var(--radius-md); padding: var(--space-5); min-width: 0; }
.pc-card-head { display: flex; justify-content: space-between; align-items: center; gap: var(--space-3); margin-bottom: var(--space-4); }
.pc-card-title { margin: 0; font-size: 16px; line-height: 24px; font-weight: 600; letter-spacing: -.01em; }
.pc-kpi-value { font-family: var(--font-display); font-size: 36px; line-height: 40px; font-weight: 600; letter-spacing: -0.035em; font-variant-numeric: tabular-nums; margin-top: var(--space-2); }
.pc-delta { font-size: 12px; line-height: 16px; font-weight: 500; color: var(--success); margin-top: var(--space-1); }
.pc-delta.warn { color: var(--warning); } .pc-delta.down { color: var(--danger); }

/* Table */
.pc-table-wrap { background: var(--white); border: 1px solid var(--rule); border-radius: var(--radius-md); overflow-x: auto; }
.pc-table { width: 100%; border-collapse: collapse; font-size: 14px; }
.pc-table th { height: 36px; padding: 0 var(--space-3); text-align: left; background: var(--mist); border-bottom: 1px solid var(--rule); font-family: var(--font-mono); font-size: 11px; font-weight: 400; color: var(--slate); white-space: nowrap; }
.pc-table td { height: var(--row-height); padding: 0 var(--space-3); border-bottom: 1px solid var(--rule); color: var(--ink-secondary); white-space: nowrap; }
.pc-table tbody tr:last-child td { border-bottom: 0; }
.pc-table tbody tr { cursor: pointer; }
.pc-table tbody tr:hover td { background: var(--porcelain); }
.pc-table tbody tr[aria-selected="true"] td { background: var(--cobalt-soft); }
.pc-table tbody tr[aria-selected="true"] td:first-child { box-shadow: inset 2px 0 0 var(--cobalt); }
.pc-table .r { text-align: right; font-variant-numeric: tabular-nums; }
.pc-table .strong { color: var(--ink); font-weight: 500; }
.pc-table .id { font-family: var(--font-mono); font-size: 11px; color: var(--slate); }
.pc-table-foot { display: flex; justify-content: space-between; gap: var(--space-3); padding: 10px var(--space-3); border-top: 1px solid var(--rule); font-size: 12px; color: var(--slate); }

/* App shell */
.pc-app { display: grid; grid-template-columns: var(--sidebar-width) minmax(0, 1fr); min-height: 640px; background: var(--white); font-size: 14px; }
.pc-side { background: var(--porcelain); border-right: 1px solid var(--rule); padding: var(--space-4) 10px; display: flex; flex-direction: column; gap: var(--space-5); }
.pc-brand { display: flex; align-items: center; gap: var(--space-2); padding: 0 6px; font-family: var(--font-display); font-size: 20px; line-height: 24px; color: var(--ink); }
.pc-nav { display: grid; gap: 2px; }
.pc-nav .pc-meta { padding: 0 8px 6px; }
.pc-nav a { display: flex; align-items: center; gap: 10px; height: 30px; padding: 0 8px; border-radius: var(--radius-sm); font-size: 13px; font-weight: 500; color: var(--ink-secondary); text-decoration: none; cursor: pointer; }
.pc-nav a .pc-icon { color: var(--slate); }
.pc-nav a:hover { background: var(--white); color: var(--ink); }
.pc-nav a[aria-current="page"] { background: var(--cobalt-soft); color: var(--cobalt-text); }
.pc-nav a[aria-current="page"] .pc-icon { color: var(--cobalt-text); }
.pc-nav .count { margin-left: auto; font-family: var(--font-mono); font-size: 10px; color: var(--slate); }
.pc-main { min-width: 0; display: flex; flex-direction: column; }
.pc-top { height: var(--topbar-height); border-bottom: 1px solid var(--rule); display: flex; align-items: center; gap: var(--space-3); padding: 0 var(--space-6); }
.pc-top .pc-input { max-width: 320px; }
.pc-top .right { margin-left: auto; display: flex; gap: var(--space-2); align-items: center; }
.pc-avatar { width: 30px; height: 30px; border-radius: 50%; background: var(--porcelain); border: 1px solid var(--rule); display: grid; place-items: center; font-size: 11px; font-weight: 600; color: var(--ink-secondary); }
.pc-page { padding: var(--space-6); display: grid; gap: var(--space-6); max-width: var(--content-max); }
.pc-page-head { display: flex; justify-content: space-between; align-items: flex-end; gap: var(--space-4); flex-wrap: wrap; }
.pc-page-title { margin: 2px 0 0; font-family: var(--font-display); font-size: 32px; line-height: 36px; font-weight: 600; letter-spacing: -0.035em; }
.pc-page-sub { margin: var(--space-1) 0 0; color: var(--slate); }

/* Modal, toast, banner, empty */
.pc-backdrop { background: rgba(21, 24, 29, .2); padding: var(--space-6); display: grid; place-items: center; }
.pc-modal { width: 100%; max-width: 440px; background: var(--white); border: 1px solid var(--rule); border-radius: var(--radius-lg); box-shadow: var(--shadow-modal); }
.pc-modal-head { display: flex; justify-content: space-between; gap: var(--space-3); padding: var(--space-5) var(--space-5) 0; }
.pc-modal-title { margin: 0; font-family: var(--font-display); font-size: 24px; line-height: 30px; font-weight: 600; }
.pc-modal-body { padding: var(--space-5); display: grid; gap: var(--space-4); }
.pc-modal-foot { display: flex; justify-content: flex-end; gap: var(--space-2); padding: var(--space-4) var(--space-5); border-top: 1px solid var(--rule); }
.pc-toast { display: inline-flex; align-items: center; gap: var(--space-3); padding: 12px var(--space-4); background: var(--white); border: 1px solid var(--rule); border-radius: var(--radius-lg); box-shadow: var(--shadow-pop); font-weight: 500; }
.pc-toast .pc-icon { color: var(--cobalt); }
.pc-banner { display: flex; align-items: center; gap: var(--space-3); padding: 12px var(--space-4); border-radius: var(--radius-md); font-size: 14px; }
.pc-banner .grow { flex: 1; }
.pc-banner-warn { background: var(--warning-soft); color: var(--warning); }
.pc-banner-fail { background: var(--danger-soft); color: var(--danger); }
.pc-banner-info { background: var(--cobalt-soft); color: var(--cobalt-text); }
.pc-empty { position: relative; overflow: hidden; text-align: center; padding: var(--space-12) var(--space-6); background: var(--white); border: 1px solid var(--rule); border-radius: var(--radius-md); }
.pc-empty > * { position: relative; }
.pc-empty .pc-icon { width: 20px; height: 20px; color: var(--slate); }
.pc-empty h3 { margin: var(--space-3) 0 var(--space-1); font-size: 16px; line-height: 24px; font-weight: 600; }
.pc-empty p { margin: 0 auto var(--space-4); max-width: 40ch; color: var(--slate); }
.pc-skel { background: var(--mist); border-radius: 4px; height: 12px; }

/* Signature details */
.pc-mark { display: inline-grid; place-items: center; width: 14px; height: 14px; border-radius: 22%; background: var(--cobalt); color: #fff; font-size: 9px; font-weight: 600; flex: none; }
.pc-eyebrow::before { content: ""; width: 6px; height: 6px; border-radius: 50%; background: var(--glaze); }
.pc-accent { color: var(--cobalt); }
.pc-empty::before { content: ""; position: absolute; inset: 0; background: radial-gradient(circle at 50% 0%, var(--mist), transparent 60%); }
/* Glaze edge (signature) */
.pc-glazed { box-shadow: inset 0 1px 0 #ffffff; border: 1px solid var(--rule); }
.pc-tile { width: 36px; height: 36px; border-radius: 22%; background: var(--mist); display: grid; place-items: center; color: var(--cobalt); }
```

## motion.css (website only)

```css
/* Porcelain · motion.css — WEBSITE ONLY. Never load inside the platform UI. Requires tokens.css. */
/* ---------------- Website ---------------- */
.fw { font-size: 17px; line-height: 28px; background: var(--porcelain); }
.pcw-wrap { max-width: var(--site-max); margin: 0 auto; padding: 0 var(--space-6); }
.pcw-nav { display: flex; align-items: center; justify-content: space-between; height: 72px; }
.pcw-logo { display: flex; align-items: center; gap: var(--space-2); font-family: var(--font-display); font-size: 22px; line-height: 28px; color: var(--ink); text-decoration: none; }
.pcw-links { display: flex; align-items: center; gap: var(--space-6); font-size: 14px; font-weight: 500; color: var(--slate); }
.pcw-links a { color: inherit; text-decoration: none; transition: color 150ms ease-out; }
.pcw-links a:hover { color: var(--ink); }
.pcw-links a[aria-current="page"] { color: var(--ink); text-decoration: underline; text-underline-offset: 6px; text-decoration-thickness: 1px; }
.fw .pc-btn { transition: background-color 150ms ease-out; }
.fw .pc-btn .arr { display: inline-block; transition: transform 150ms ease-out; }
.fw .pc-btn:hover .arr, .pcw-card:hover .arr { transform: translateX(3px); }
.pcw-display { margin: 0; font-family: var(--font-display); font-weight: 600; font-size: 88px; line-height: 84px; letter-spacing: -0.035em; max-width: 13ch; color: var(--ink); }
.pcw-display .w { display: inline-block; }
.pcw-lead { margin: var(--space-5) 0 var(--space-8); max-width: 44ch; font-size: 19px; line-height: 30px; color: var(--slate); }
.pcw-cta { display: flex; gap: var(--space-3); flex-wrap: wrap; }
.pcw-sec-head { display: flex; justify-content: space-between; align-items: flex-end; gap: var(--space-4); flex-wrap: wrap; margin-bottom: var(--space-8); }
.pcw-h1 { margin: var(--space-3) 0 0; font-family: var(--font-display); font-weight: 600; font-size: 56px; line-height: 58px; letter-spacing: -0.035em; }
.pcw-h2 { margin: 0; font-family: var(--font-display); font-weight: 600; font-size: 40px; line-height: 44px; letter-spacing: -0.035em; }
.pcw-cards { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: var(--space-6); }
.pcw-card { display: flex; flex-direction: column; gap: var(--space-2); padding: var(--space-6); background: var(--white); border: 1px solid var(--rule); border-radius: var(--radius-md); text-decoration: none; color: var(--ink); min-width: 0; }
.pcw-shot { aspect-ratio: 16/10; border-radius: var(--radius-sm); background: var(--porcelain); border: 1px solid var(--rule); margin-bottom: var(--space-3); padding: 12px; display: grid; gap: 8px; align-content: start; }
.pcw-shot span { height: 8px; border-radius: 4px; background: var(--mist); }
.pcw-card h3 { margin: 0; font-size: 20px; line-height: 28px; font-weight: 600; letter-spacing: -.01em; display: flex; justify-content: space-between; transition: color 150ms ease-out; }
.pcw-card:hover h3 { color: var(--cobalt); }
.pcw-card p { margin: 0; font-size: 15px; line-height: 24px; color: var(--slate); }
.pcw-card .tags { display: flex; gap: var(--space-2); flex-wrap: wrap; margin-top: var(--space-3); }
.pcw-notes { display: grid; }
.pcw-note { display: grid; grid-template-columns: 120px minmax(0, 1fr); gap: var(--space-4); padding: var(--space-5) 0; border-bottom: 1px solid var(--rule); text-decoration: none; color: var(--ink); }
.pcw-note b { display: block; font-family: var(--font-display); font-weight: 600; font-size: 24px; line-height: 30px; transition: color 150ms ease-out; }
.pcw-note:hover b { color: var(--cobalt); }
.pcw-note span { color: var(--slate); font-size: 15px; }
@media (max-width: 760px) {
  .pcw-display { font-size: 48px; line-height: 48px; } .pcw-h1 { font-size: 36px; line-height: 40px; } .pcw-h2 { font-size: 30px; line-height: 34px; }
  .pcw-cards { grid-template-columns: 1fr; } .pcw-links { display: none; } .pcw-hero { padding: var(--space-5) var(--space-5) var(--space-10); }
  .pcw-note { grid-template-columns: 1fr; gap: var(--space-1); }
  .pc-app { grid-template-columns: 1fr; } .pc-side { display: none; }
}

/* Accent word */
.pcw-display em, .pcw-h1 em, .pcw-h2 em { font-style: normal; color: var(--cobalt); }

/* Hero (signature) */
.pcw-hero { position: relative; overflow: hidden; display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: var(--space-12); align-items: center; padding: var(--space-16) 0; }
.pcw-light { position: absolute; right: 0; top: 10%; width: 50%; aspect-ratio: 1; border-radius: 50%; background: radial-gradient(circle, rgba(37, 87, 214, .10), transparent 65%); pointer-events: none; }
.pcw-apptile { position: relative; overflow: hidden; background: var(--white); border: 1px solid var(--rule); border-radius: 28px; box-shadow: inset 0 1px 0 #fff, var(--shadow-modal); aspect-ratio: 4/3; }
.pcw-apptile::after { content: ""; position: absolute; inset: -50%; background: linear-gradient(115deg, transparent 40%, rgba(255,255,255,.7) 50%, transparent 60%); transform: translateX(-100%); pointer-events: none; }
@media (max-width: 760px) { .pcw-hero { grid-template-columns: 1fr; } }

@media (prefers-reduced-motion: no-preference) {
  .pcw-play .pcw-apptile { animation: pcw-tile 800ms var(--ease-reveal) both; }
  @keyframes pcw-tile { from { opacity: 0; transform: translateY(24px) scale(.98); } to { opacity: 1; transform: none; } }
  .pcw-play .pcw-apptile::after { animation: pcw-sheen 1100ms ease-out 700ms both; }
  @keyframes pcw-sheen { to { transform: translateX(100%); } }
  .pcw-play .pcw-display .w { animation: pcw-rise 600ms var(--ease-reveal) both; animation-delay: calc(150ms + var(--i) * var(--stagger)); }
  @keyframes pcw-rise { from { opacity: 0; transform: translateY(.3em); } to { opacity: 1; transform: none; } }
  .pcw-play .pc-eyebrow::before { animation: pcw-pulse 1.1s ease-out 2 900ms; }
  @keyframes pcw-pulse { 50% { box-shadow: 0 0 0 6px rgba(63, 167, 245, .25); } }
  .pcw-fade.pcw-in { animation: pcw-up var(--duration-reveal) var(--ease-reveal) both; }
  @keyframes pcw-up { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }
}

/* Usage
   1. Hero markup: <header class="pcw-hero"><div class="pcw-light"></div><div class="in">…<h1 class="pcw-display">Software that feels <em>native</em>.</h1>…</div><div class="pcw-apptile">…screenshot…</div></header>
   2. Split the headline into <span class="w" style="--i:N"> words (or lines), then add .pcw-play to the hero once it is in view.
   3. Section titles: add .pcw-fade; add .pcw-in when they first enter the viewport.
   Everything is visible before and without the script; prefers-reduced-motion turns all of it off. */
```

## tailwind-theme.css (only if the project uses Tailwind v4)

```css
@import "tailwindcss";
/* Porcelain · Tailwind v4 theme. Load tokens.css first. Light only. */
@theme inline {
  --color-porcelain: var(--porcelain);
  --color-white: var(--white);
  --color-mist: var(--mist);
  --color-rule: var(--rule);
  --color-rule-strong: var(--rule-strong);
  --color-ink: var(--ink);
  --color-ink-secondary: var(--ink-secondary);
  --color-slate: var(--slate);
  --color-placeholder: var(--placeholder);
  --color-cobalt: var(--cobalt);
  --color-cobalt-hover: var(--cobalt-hover);
  --color-cobalt-soft: var(--cobalt-soft);
  --color-cobalt-text: var(--cobalt-text);
  --color-on-cobalt: var(--on-cobalt);
  --color-glaze: var(--glaze);
  --color-glaze-soft: var(--glaze-soft);
  --color-glaze-text: var(--glaze-text);
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

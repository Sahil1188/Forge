# GLASSHOUSE.md · Sahil Shaikh brand (all-in-one)

**For Claude Code:** this single file contains the whole Glasshouse system: brand rules, platform UI rules (no animation), website rules (with motion), and the complete CSS. Put it in the project root and add this line to `CLAUDE.md`:

```
All UI follows GLASSHOUSE.md. Before writing UI, create tokens.css, components.css (and motion.css for website pages) from Part 4 if they don't exist, then use only their variables and classes. Light only, never dark. Platform UI has no animation.
```

## How Claude Code should use this file

1. Decide the surface: **Platform UI** (app, dashboard, admin, settings) or **Website** (marketing, portfolio, landing). If unclear, assume Platform UI.
2. If `tokens.css` and `components.css` don't exist in the project, create them by copying the code blocks in Part 4 exactly. For website pages also create `motion.css`. With Tailwind v4 also create `tailwind-theme.css`.
3. Load the Google Fonts in Part 1, section 5.
4. Never hard-code colours, font sizes or fonts. Never add dark mode or dark sections.
5. Platform UI: wrap the app in `class="gh-app"` (kills all motion). Website: follow Part 3, section 4.
6. Finish by running the checklist at the end of Part 2 or Part 3.

---

Sahil Shaikh's brand and design system, **Glasshouse**. Part 1 is the brand foundations, Part 2 the platform UI rules (no animation), Part 3 the website rules (with motion), Part 4 the code.

*Researched from: Apple visionOS marketing, Arc, Raycast's light pages, glass greenhouses. Inspired by, not copied from: no logos, fonts or assets of those products are used.*

---

# Part 1 · Brand foundations

The brand of Sahil Shaikh, Full Stack AI Engineer. **Glasshouse**: a glasshouse in morning light: frosted panes, a lagoon-blue frame and one patch of sun. It covers every platform Sahil designs and his website.

This system has three parts:

1. **Brand foundations** (Part 1): idea, logo, colour, type, layout, shape, icons, imagery, voice and accessibility.
2. **Platform UI** (Part 2): rules for any app, dashboard or tool. **No animation.**
3. **Website** (Part 3): the same brand with larger type and a defined motion system.

Light only. There is no dark theme, and no dark sections, panels or backgrounds anywhere.

---

## 1. The idea

| | |
|---|---|
| **Metaphor** | A glasshouse in morning light: frosted panes, a lagoon-blue frame and one patch of sun. |
| **Personality** | Fresh, open, optimistic and calm. |
| **Feeling we want** | "Clear, light, and easy to breathe in." |
| **Three ingredients** | **Frost** (frosted glass panels on the website) · **Lagoon** (one deep teal-blue for action) · **Sun** (a warm yellow mark, used sparingly) |

## 2. Principles

1. **Mist ground, solid white in the product.** The platform uses opaque white panels on `mist`; glass is for the website.
2. **Frosted panes on the website.** Panels are semi-transparent white with blur and a white 1px edge, over a soft mesh.
3. **Lagoon to act.** Lagoon for actions, links and focus. Sun for one warm highlight.
4. **Round and open.** Generous radii (12–24px), generous spacing, airy line-height.
5. **Friendly geometric type.** Urbanist 700 for titles, Nunito Sans for reading.
6. **Still product; the mesh breathes in once on the website.** Blobs drift into place, then rest.
7. **Accessible always.** Text 4.5:1 or better on glass too (glass is at least 72% white), focus always visible.

## 3. Logo

- **Wordmark:** "Sahil Shaikh" in Urbanist 700, `ink`, with a small sun dot (6px) after it.
- **Product mark:** a 16px frosted pane (lagoon border) + product name in Urbanist 700.
- **App icon / avatar:** a white rounded square (26% radius) with a lagoon-to-mist soft fill at the bottom and a sun dot.
- **Clear space:** the cap height. **Minimum size:** wordmark 88px; icon 20px.
- **Never:** place the logo on glass over busy imagery, use sun for text, add hard shadows.

## 4. Colour

### Core palette

| Token | Hex | Role |
|---|---|---|
| `mist` | #F4F7F9 | Page ground, sidebar, website background |
| `white` | #FFFFFF | Cards, tables, inputs, modals |
| `frost` | #EAF0F3 | Hover rows, table headers, inset areas |
| `rule` | #DDE5EA | Dividers and borders |
| `rule-strong` | #84919A | Input borders, strong dividers |
| `ink` | #0F1A20 | Headings, primary text |
| `ink-secondary` | #2B3A42 | Labels, nav, table text |
| `harbor` | #56656E | Secondary text, labels |
| `placeholder` | #5F6D75 | Placeholders, disabled text |
| `lagoon` | #0B6E8C | Primary action, links, focus |
| `lagoon-hover` | #095B74 | Hover/pressed lagoon |
| `lagoon-soft` / `lagoon-text` | #E2F2F6 / #095F79 | Selected, active, success |
| `sun` | #F2B705 | Sun: one warm highlight, new items |
| `sun-soft` / `sun-text` | #FEF6DA / #7A5800 | Soft sun badges |
| `warning` / `warning-soft` | #8A5A00 / #FFF4DC | Needs attention |
| `danger` / `danger-soft` | #B42318 / #FDECEB | Errors, destructive |

### Charts

`chart-1` lagoon #0B6E8C, `chart-2` #7FBCCD, `chart-3` #C3CED4, and `chart-highlight` sun #F2B705 for the one value that matters. Gridlines use `rule`, axis labels use `ui-meta` in `harbor`.

### Proportions

About 60% mist, 28% white or glass, 8% type and lines, 3% lagoon, 1% sun.

### Rules

- Lagoon is the only colour on buttons and links. One filled lagoon button per view.
- Sun is a highlight dot or a soft badge with dark text; never text on white, never a button.
- Glass panels must be at least 72% opaque white so text keeps 4.5:1.
- No gradients in the product. The website mesh (lagoon, mist, sun at low opacity) is the only gradient.
- Never use `ink` as a background.

## 5. Typography

Three roles, all free on Google Fonts:

`https://fonts.googleapis.com/css2?family=Urbanist:wght@500;600;700&family=Nunito+Sans:opsz,wght@6..12,400;6..12,500;6..12,600&family=Red+Hat+Mono:wght@400;500&display=swap`

| Family | Role | Use | Weights |
|---|---|---|---|
| **Urbanist** | **The voice** | Page titles, numbers, website headlines | 600, 700 |
| **Nunito Sans** | **The clarity** | All UI and body text | 400, 500, 600 |
| **Red Hat Mono** | **The precision** | IDs, times, column headers | 400, 500 |

- **Accent word:** one word per headline in `lagoon`.
- Body line-height is generous: 1.6 on the website, 1.45 in the product.
- Numbers in Urbanist 600 for KPIs, tabular.
- Sentence case. No ALL CAPS.
- Full scales are in Part 2 (platform) and Part 3 (website).

## 6. Layout and spacing

- **4px grid:** 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 96, 128.
- **Platform:** sidebar on `mist`, content on `white`, 24px page padding, max 1200px.
- **Website:** 1160px max width, 96px between sections.
- Align to a left edge in the product. Centre only short single lines (an empty state).

## 7. Shape and depth

| Token | Value | Use |
|---|---|---|
| `radius-xs` | 6px | Badges, checkboxes |
| `radius-sm` | 10px | Buttons, inputs, nav |
| `radius-md` | 16px | Cards, tables, menus |
| `radius-lg` | 24px | Modals, glass panels |
| `radius-full` | 9999px | Toggles, dots, avatars |

- **Frosted pane** (signature, website): `rgba(255,255,255,.72)` fill, `backdrop-filter: blur(18px) saturate(1.3)`, 1px white border, `radius-lg`.
- **Mesh** (signature, website): three soft radial blobs (lagoon 18%, sky 16%, sun 14%) behind the hero and contact only.
- In the product, panels are solid white with 1px `rule`; no blur (performance and contrast).
- Shadows: soft and wide (`0 20px 40px -20px rgba(15,26,32,.18)`) on glass and modals only.

## 8. Iconography

- Lucide, 1.75px stroke, rounded. 18px in nav, 16px in controls. `harbor` default, `lagoon` active.
- Icon-only buttons always have an accessible label.

## 9. Imagery

- Screenshots float on glass panes over the mesh, slightly overlapping each other.
- Diagrams: rounded nodes on white, lagoon connectors, a sun dot for the key point.
- Portrait: bright daylight, outdoor or plants, soft background.

## 10. Voice and writing

- Optimistic and clear: "Here's how it works." No jargon on the surface.
- Lead with what something does: "Agents plan, build and review work together."
- Buttons are verbs: "New project", "Save changes". Confirmations say what happened: "Project created."
- Errors say what went wrong and how to fix it: "Name is required. Add a project name to continue."
- Numbers: "AED 1,250.00", dates "21 Oct 2026", times "14:32".
- No buzzwords, no exclamation marks, no emoji in UI.

## 11. Accessibility

- Every text colour pair passes WCAG AA (4.5:1). Borders, focus rings and indicators pass 3:1.
- Focus ring: 2px white gap + 2px `lagoon`, on every interactive element.
- Never rely on colour alone; pair it with a word, icon or position.
- Hit targets at least 28px (34px default).
- The website respects `prefers-reduced-motion`: all motion off, content visible immediately.

Measured contrast for this palette:

| Pair | Ratio | Needed |
|---|---|---|
| Body text `ink` on `white` | 17.66:1 | 4.5:1 |
| `harbor` on `mist` | 5.61:1 | 4.5:1 |
| `harbor` on `frost` | 5.24:1 | 4.5:1 |
| White on `lagoon` (primary button) | 5.8:1 | 4.5:1 |
| `lagoon` links on `white` | 5.8:1 | 4.5:1 |
| `lagoon-text` on `lagoon-soft` | 6.25:1 | 4.5:1 |
| `sun-text` on `sun-soft` | 6.02:1 | 4.5:1 |
| `placeholder` on `white` | 5.34:1 | 4.5:1 |
| `rule-strong` borders on `white` | 3.23:1 | 3:1 |
| `ink` on `sun` (mark used as a fill) | 9.72:1 | 4.5:1 |

## 12. Do and don't

| Do | Don't |
|---|---|
| Mist ground; solid white in the product | Dark backgrounds or dark mode |
| Glass on the website only | Blur in the product |
| Glass ≥ 72% white | See-through panels that hurt contrast |
| Lagoon for action | Several accent colours |
| Sun as one highlight | Sun text or buttons |
| Generous radii and spacing | Sharp corners and tight spacing |
| Mesh behind hero and contact | Mesh everywhere |
| Mesh drifts in once on the website | Animation in the platform |


---

# Part 2 · Platform UI guideline

Rules for any platform, app, dashboard, admin or internal tool built in the Glasshouse brand. It is generic: it works for projects, CRM, analytics, payments, AI agents or anything else.

**The platform never animates.** State changes are instant. Every rule here assumes light only.

---

## 1. Foundations for the platform

- **Ground:** `mist` for the app canvas and sidebar. `white` for every working panel (cards, tables, forms, modals).
- **Text:** `ink` for headings and values, `ink-secondary` for labels and nav, `harbor` for help text and metadata.
- **Action colour:** `lagoon`. **Mark:** `sun` (small).
- **Density:** 14px text, 34px controls, 44px rows, 4px grid.

## 2. Type scale

| Style | Size / line | Weight | Family | Use |
|---|---|---|---|---|
| `ui-page-title` | 32 / 36 | 700 | Urbanist | Page title, one per screen |
| `ui-numeric` | 36 / 40 | 700 | Urbanist | KPI values, big totals |
| `ui-heading` | 16 / 24 | 600 | Nunito Sans | Card, section, modal headings |
| `ui-subheading` | 14 / 20 | 600 | Nunito Sans | Form group titles |
| `ui-body` | **14 / 20** | 400 | Nunito Sans | **Default text** |
| `ui-body-lg` | 16 / 24 | 400 | Nunito Sans | Empty states, onboarding |
| `ui-label` | 13 / 18 | 500 | Nunito Sans | Labels, nav items, buttons |
| `ui-small` | 12 / 16 | 400 | Nunito Sans | Help text, captions |
| `ui-meta` | 11 / 16 | 400 | Red Hat Mono | IDs, timestamps, column headers |

Rules:

- Urbanist only for `ui-page-title`, `ui-numeric` and modal titles. Never in buttons, tables, forms, nav or badges.
- Numbers in tables use `font-variant-numeric: tabular-nums` and align right.
- Never below 11px (mono) or 12px (UI).

## 3. App layout

- **Sidebar:** 232px (60px collapsed), `mist`, 1px `rule` right border, 16px top padding. Product mark at top. Groups titled with `ui-meta`.
- **Top bar:** 56px, `white`, 1px `rule` bottom border. Search left (320px max), actions right.
- **Page header:** breadcrumb in `ui-meta`, then `ui-page-title`, optional one-line description in `harbor`. Actions on the right, aligned to the title's baseline.
- **Content:** 24px padding, max width 1200px, 24px gap between blocks, 32px between page sections.
- **Breakpoints:** 640, 768, 1024, 1280. Below 1024 the sidebar becomes a drawer.

## 4. Components

### Buttons

| Variant | Look | Use |
|---|---|---|
| Primary | `lagoon` fill, `on-lagoon` text | The one main action per view |
| Secondary | `white` fill, 1px `rule-strong` border, `ink` text | Every other action |
| Ghost | No fill or border, `ink-secondary` text | Toolbars, cancel, low emphasis |
| Danger | `danger` fill, white text | Destructive confirmations only |

- Sizes: 28px (sm), **34px (default)**, 40px (lg). `radius-sm`. `ui-label` 13/500.
- States: hover = instant background change (`lagoon-hover`, `frost`); focus = `focus-ring`; disabled = `opacity-disabled`.
- Labels are verbs in sentence case: "New project", "Export CSV".

### Text inputs, selects, textareas

- 34px tall, 12px horizontal padding, `radius-sm`, `white` fill, 1px `rule-strong` border, `placeholder` colour for placeholders.
- Label above (`ui-label`, `ink-secondary`), help or error below (`ui-small`), 6px gaps.
- Focus: `lagoon` border + `focus-ring`. Error: `danger` border and a message saying how to fix it.

### Checkbox, radio, toggle

- Checkbox 16px, `radius-xs`; checked = `lagoon` fill with white tick. Radio: 8px `lagoon` dot. Toggle 32 × 18px; on = `lagoon`.
- The label is always clickable and sits 10px to the right.

### Badges

- 22px tall, 8px padding, `radius-xs`, 12/500.
- Done (`lagoon-soft`/`lagoon-text`), Live or new (`sun-soft`/`sun-text`), Needs review (`warning-soft`/`warning`), Failed (`danger-soft`/`danger`), Draft (`frost`/`harbor`).

### Tabs and segmented controls

- **Tabs:** Nunito Sans 14/600 pills, 34px; active = white pill with soft shadow on a `frost` track.
- **Segmented control:** `frost` track, 3px padding; active segment = `white` with 1px `rule`.

### Tables

- `white` panel, 1px `rule`, `radius-md`, horizontal scroll on narrow screens.
- Header 36px, `frost`, `ui-meta` labels in `harbor`. Rows 44px, 1px `rule` between rows. Hover = `mist`. Selected = `lagoon-soft` with a 2px `lagoon` left edge.
- IDs in `ui-meta`. Amounts right-aligned, tabular. Status as badges.

### Cards and KPIs

- `white`, 1px `rule`, `radius-md`, 20px padding, no shadow. KPI: `ui-meta` label, value in `ui-numeric`, delta in `ui-small`.
- Signature detail (Frosted pane) on one group per screen at most.

### Navigation

- Sidebar items: 30px, `radius-sm`, `ui-label`, 16px icon in `harbor`.
- Active: `lagoon-soft` background + `lagoon-text`.
- Breadcrumbs in `ui-meta` separated by " / ".

### Modals and side sheets

- Widths 440 / 600 / 800px; `white`, `radius-lg`, `shadow-modal`. Backdrop `ink` at 20%.
- Title in Urbanist 24/30; footer buttons right-aligned, primary last. Escape closes; focus returns to the trigger.

### Toasts, banners, empty, loading and error states

- Toast: bottom-right, `white`, `radius-lg`, `shadow-pop`, one line + optional "Undo". No animation.
- Empty: centred, 20px icon in `harbor`, `ui-heading`, one line of `ui-body`, one primary button.
- Loading: static `frost` skeleton blocks + a `ui-meta` "loading…" label. No spinners or shimmer.
- Error: danger banner with what failed and a "Try again" button.

### Data visualisation

- `chart-1` main series, `chart-2` comparison, `chart-3` other, `chart-highlight` for one value. Gridlines `rule`, axis labels `ui-meta`. No animation, no 3D, no gradients.

## 5. Patterns

- **Forms:** one column, max 560px. Labels above fields. Actions bottom-right, primary last.
- **List to detail:** clicking a row opens a side sheet for quick edits.
- **Destructive actions:** confirm in a modal that names the thing, with a danger button.
- **Settings:** left sub-nav (200px) + one form card per section.

## 6. No-motion rules

- Everything inside `.gh-app` has `transition: none; animation: none`.
- Hover, focus, open and close are instant. Progress is static text or a stepped bar.

## 7. Checklist for every screen

- [ ] `mist` canvas, white panels, no dark areas
- [ ] One Urbanist page title; all other text Nunito Sans or mono
- [ ] One filled `lagoon` button
- [ ] `sun` only as a small mark
- [ ] 14px body, 34px controls, 44px rows, 4px grid
- [ ] Lines, not shadows (shadows only on floating things)
- [ ] Focus visible on every control
- [ ] Status has a word, not just colour
- [ ] Nothing animates


---

# Part 3 · Website guideline

How the Glasshouse brand looks and moves on Sahil's website, landing pages and portfolio. Same palette and families as the platform, with bigger type, more air, and a defined motion system.

Light only: no dark bands, dark footers or dark cards.

---

## 1. Layout

- Max width 1160px, side padding 24px (16px on phones).
- 96px between sections (64px on phones); hero top spacing 128px (64px on phones).
- Text blocks max 60 characters wide.

## 2. Type scale

| Style | Size / line | Weight | Family | Use |
|---|---|---|---|---|
| `web-display` | 88 / 88 (48 / 50 on phones) | 700 | Urbanist | Hero headline |
| `web-h1` | 56 / 60 (36 on phones) | 700 | Urbanist | Section titles |
| `web-h2` | 40 / 46 (30 on phones) | 700 | Urbanist | Sub-sections, contact |
| `web-h3` | 20 / 28 | 600 | Nunito Sans | Card titles |
| `web-lead` | 19 / 30 | 400 | Nunito Sans | Intro paragraphs |
| `web-body` | 17 / 28 | 400 | Nunito Sans | Running text |
| `web-eyebrow` | 12 / 16 | 400 | Red Hat Mono | Line above a headline |

- Accent: One lagoon word per headline.
- Eyebrow: Red Hat Mono 12px `harbor` in a glass pill, led by a sun dot.

## 3. Page anatomy

### Navigation

- Floating frosted bar (radius-full) 12px from the top: wordmark left, links centre in Nunito Sans 15/600 `harbor`, lagoon button right.

### Hero

- Mist ground with the mesh. Centred Urbanist headline (88px) with one lagoon word, lead, lagoon button + glass secondary button. Below, two overlapping glass panes with screenshots.

### Section header

- Centred eyebrow pill (glass), `web-h1`, description in `harbor`.

### Work cards

- Glass panes over a faint mesh, `radius-lg`, 28px padding, an 40px icon in a `frost` circle, Urbanist 22/700 title. Hover: pane turns 86% white, arrow nudges.

### Notes / writing list

- Rows in one big glass pane: title Urbanist 20/600, date in mono. Hover: row `frost`.

### Contact

- A large glass pane over the mesh: headline, the email with Copy, lagoon button, social icons in frost circles.

### Footer

- `mist`, 1px `rule`, links, mono copyright.

## 4. Motion system

The website has **one orchestrated moment per page** (the hero) plus small responses to the user. Nothing else moves.

### Tokens

| Token | Value | Use |
|---|---|---|
| `duration-fast` | 150ms | Hover colour changes |
| `duration-base` | 220ms | Menus, accordions |
| `duration-reveal` | 700ms | Section fade-up |
| `duration-hero` | 900ms | Hero layers |
| `stagger` | 55ms | Delay between headline parts |
| Easing | `cubic-bezier(.2, .7, 0, 1)` | All reveals |

### The hero sequence (in order)

| Time | What happens | Spec |
|---|---|---|
| 0ms | Mesh breathes in | Blobs fade in and drift 30px into place, 1600ms |
| 200ms | Headline rises | Words: opacity 0 → 1, translateY .3em → 0, blur 4px → 0, 700ms, 55ms apart |
| 700ms | Panes float up | Glass panes translateY 24px → 0, 800ms, 120ms apart |
| 1100ms | Sun dot | Pulses once |
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
<header class="ghw-hero"><div class="ghw-mesh"><i></i><i></i><i></i></div><div class="in">…<h1 class="ghw-display">Clear systems, built for <em>people</em>.</h1>…<div class="gh-glass" style="--i:0">…</div></div></header>
```

## 5. Checklist for every page

- [ ] Light only, no dark bands
- [ ] Headlines follow the accent rule (One lagoon word per headline)
- [ ] Eyebrow above key headlines
- [ ] Signature details only where Part 1 allows them
- [ ] One hero motion sequence; everything readable before it plays
- [ ] Hover responses at 150ms
- [ ] Reduced motion respected
- [ ] One primary button per section


---

# Part 4 · Code

Copy each block into its own file, exactly as written. Component classes use the `.gh-` prefix (platform) and `.ghw-` (website).

## tokens.css

```css
/* Glasshouse tokens · Sahil Shaikh. Light only: there is no dark theme. */
:root {
  color-scheme: light;
  --mist: #f4f7f9;
  --white: #ffffff;
  --frost: #eaf0f3;
  --rule: #dde5ea;
  --rule-strong: #84919a;
  --ink: #0f1a20;
  --ink-secondary: #2b3a42;
  --harbor: #56656e;
  --placeholder: #5f6d75;
  --lagoon: #0b6e8c;
  --lagoon-hover: #095b74;
  --lagoon-soft: #e2f2f6;
  --lagoon-text: #095f79;
  --on-lagoon: #ffffff;
  --sun: #f2b705;
  --sun-soft: #fef6da;
  --sun-text: #7a5800;
  --success: var(--lagoon-text);
  --success-soft: var(--lagoon-soft);
  --warning: #8a5a00;
  --warning-soft: #fff4dc;
  --danger: #b42318;
  --danger-soft: #fdeceb;
  --chart-1: #0b6e8c;
  --chart-2: #7fbccd;
  --chart-3: #c3ced4;
  --chart-highlight: #f2b705;
  --shadow-pop: 0 4px 12px -2px #0f1a2014, 0 2px 4px -2px #0f1a200f;
  --shadow-modal: 0 20px 48px -12px #0f1a202e, 0 4px 8px -4px #0f1a2014;
  --focus-ring: 0 0 0 2px #ffffff, 0 0 0 4px #0b6e8c;
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
  --radius-md: 16px;
  --radius-lg: 24px;
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
  --stagger: 55ms;
  --opacity-disabled: 0.45;
  --ease-reveal: cubic-bezier(.2, .7, 0, 1);
  --font-display: Urbanist, "Avenir Next", system-ui, sans-serif;
  --font-ui: "Nunito Sans", "Segoe UI", system-ui, sans-serif;
  --font-mono: "Red Hat Mono", ui-monospace, Menlo, monospace;
}
.ui-page-title { font-family: var(--font-display); font-size: 32px; line-height: 36px; font-weight: 700; letter-spacing: -0.02em;  }
.ui-numeric { font-family: var(--font-display); font-size: 36px; line-height: 40px; font-weight: 700; letter-spacing: -0.02em; font-variant-numeric: tabular-nums;  }
.ui-heading { font-family: var(--font-ui); font-size: 16px; line-height: 24px; font-weight: 600; letter-spacing: -0.01em; }
.ui-subheading { font-family: var(--font-ui); font-size: 14px; line-height: 20px; font-weight: 600; }
.ui-body { font-family: var(--font-ui); font-size: 14px; line-height: 20px; font-weight: 400; }
.ui-body-lg { font-family: var(--font-ui); font-size: 16px; line-height: 24px; font-weight: 400; }
.ui-label { font-family: var(--font-ui); font-size: 13px; line-height: 18px; font-weight: 500; }
.ui-small { font-family: var(--font-ui); font-size: 12px; line-height: 16px; font-weight: 400; }
.ui-meta { font-family: var(--font-mono); font-size: 11px; line-height: 16px; font-weight: 400; }
.web-display { font-family: var(--font-display); font-size: 88px; line-height: 88px; font-weight: 700; letter-spacing: -0.02em;  }
.web-h1 { font-family: var(--font-display); font-size: 56px; line-height: 60px; font-weight: 700; letter-spacing: -0.02em;  }
.web-h2 { font-family: var(--font-display); font-size: 40px; line-height: 46px; font-weight: 700; letter-spacing: -0.02em;  }
.web-h3 { font-family: var(--font-ui); font-size: 20px; line-height: 28px; font-weight: 600; letter-spacing: -0.01em; }
.web-lead { font-family: var(--font-ui); font-size: 19px; line-height: 30px; font-weight: 400; }
.web-body { font-family: var(--font-ui); font-size: 17px; line-height: 28px; font-weight: 400; }
.web-eyebrow { font-family: var(--font-mono); font-size: 12px; line-height: 16px; font-weight: 400; }
/* Platform UI never animates: wrap the app in .gh-app */
.gh-app, .gh-app * { transition: none !important; animation: none !important; }
@media (max-width: 760px) { .web-display { font-size: 48px; line-height: 50px; } .web-h1 { font-size: 36px; line-height: 40px; } .web-h2 { font-size: 30px; line-height: 34px; } }
```

## components.css

```css
/* Glasshouse · components.css — reference styles for every component (.gh-* platform, shared by the website). Requires tokens.css. */
@import url("https://fonts.googleapis.com/css2?family=Urbanist:wght@500;600;700&family=Nunito+Sans:opsz,wght@6..12,400;6..12,500;6..12,600&family=Red+Hat+Mono:wght@400;500&display=swap");
/* Glasshouse components. .gh-* = platform UI (no motion). .ghw-* = website (motion allowed). */
body { margin: 0; font-family: var(--font-ui); font-size: 14px; line-height: 20px; color: var(--ink); background: var(--mist); -webkit-font-smoothing: antialiased; }
.gh-pad { padding: var(--space-5); }
.gh-row { display: flex; flex-wrap: wrap; align-items: center; gap: var(--space-3); }
.gh-col { display: grid; gap: var(--space-4); }
.gh-grid { display: grid; gap: var(--space-4); grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); }
.gh-meta { font-family: var(--font-mono); font-size: 11px; line-height: 16px; color: var(--harbor); }
.gh-eyebrow { display: inline-flex; align-items: center; gap: var(--space-2); font-family: var(--font-mono); font-size: 11px; line-height: 16px; color: var(--harbor); }
.gh-num { font-variant-numeric: tabular-nums; }
.gh-app, .gh-app * { transition: none !important; animation: none !important; }
:where(.gh-btn, .gh-input, .gh-select, .gh-textarea, .gh-tab, .gh-seg button, .gh-nav a, .gh-check input, .gh-toggle input):focus-visible { outline: 2px solid transparent; box-shadow: var(--focus-ring); }


/* Buttons */
.gh-btn { font: inherit; font-size: 13px; line-height: 18px; font-weight: 500; height: var(--control-md); padding: 0 var(--space-3); display: inline-flex; align-items: center; justify-content: center; gap: 6px; border-radius: var(--radius-sm); border: 1px solid transparent; cursor: pointer; white-space: nowrap; text-decoration: none; background: transparent; color: var(--ink); }
.gh-btn svg { width: var(--icon-md); height: var(--icon-md); }
.gh-btn-sm { height: var(--control-sm); padding: 0 10px; font-size: 12px; }
.gh-btn-lg { height: var(--control-lg); padding: 0 var(--space-4); font-size: 14px; }
.gh-btn-primary { background: var(--lagoon); color: var(--on-lagoon); }
.gh-btn-primary:hover { background: var(--lagoon-hover); }
.gh-btn-secondary { background: var(--white); border-color: var(--rule-strong); }
.gh-btn-secondary:hover { background: var(--frost); }
.gh-btn-ghost { color: var(--ink-secondary); }
.gh-btn-ghost:hover { background: var(--frost); color: var(--ink); }
.gh-btn-danger { background: var(--danger); color: #ffffff; }
.gh-btn[disabled] { opacity: var(--opacity-disabled); cursor: not-allowed; }
.gh-icon { fill: none; stroke: currentColor; stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; width: var(--icon-md); height: var(--icon-md); flex: none; }

/* Fields */
.gh-field { display: grid; gap: 6px; min-width: 0; }
.gh-label { font-size: 13px; line-height: 18px; font-weight: 500; color: var(--ink-secondary); }
.gh-input, .gh-select, .gh-textarea { font: inherit; font-size: 14px; width: 100%; box-sizing: border-box; height: var(--control-md); padding: 0 var(--space-3); border-radius: var(--radius-sm); border: 1px solid var(--rule-strong); background: var(--white); color: var(--ink); }
.gh-textarea { height: 88px; padding-block: 8px; resize: vertical; }
.gh-select { appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='none' stroke='%2356656e' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m4 6 4 4 4-4'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 10px center; padding-right: 34px; }
.gh-input::placeholder, .gh-textarea::placeholder { color: var(--placeholder); }
.gh-input:focus, .gh-select:focus, .gh-textarea:focus, .gh-input.is-focus { outline: none; border-color: var(--lagoon); box-shadow: var(--focus-ring); }
.gh-input.is-error { border-color: var(--danger); }
.gh-help { margin: 0; font-size: 12px; line-height: 16px; color: var(--harbor); }
.gh-help.is-error { color: var(--danger); }
.gh-check { display: inline-flex; align-items: center; gap: 10px; font-size: 14px; color: var(--ink-secondary); cursor: pointer; }
.gh-check input { appearance: none; margin: 0; width: 16px; height: 16px; border: 1px solid var(--rule-strong); border-radius: var(--radius-xs); background: var(--white); display: grid; place-items: center; cursor: pointer; }
.gh-check input:checked { background: var(--lagoon); border-color: var(--lagoon); }
.gh-check input:checked::after { content: ""; width: 4px; height: 8px; border: solid #ffffff; border-width: 0 2px 2px 0; transform: translateY(-1px) rotate(45deg); }
.gh-check input[type="radio"] { border-radius: 50%; }
.gh-check input[type="radio"]:checked { background: var(--white); border-color: var(--lagoon); }
.gh-check input[type="radio"]:checked::after { width: 8px; height: 8px; border: 0; border-radius: 50%; background: var(--lagoon); transform: none; }
.gh-toggle { display: inline-flex; align-items: center; gap: 10px; font-size: 14px; color: var(--ink-secondary); cursor: pointer; }
.gh-toggle input { appearance: none; margin: 0; width: 32px; height: 18px; border-radius: var(--radius-full); background: var(--rule-strong); position: relative; cursor: pointer; }
.gh-toggle input::after { content: ""; position: absolute; top: 2px; left: 2px; width: 14px; height: 14px; border-radius: 50%; background: #ffffff; }
.gh-toggle input:checked { background: var(--lagoon); }
.gh-toggle input:checked::after { left: 16px; }

/* Badges */
.gh-badge { display: inline-flex; align-items: center; gap: 6px; height: 22px; padding: 0 var(--space-2); border-radius: var(--radius-xs); font-size: 12px; line-height: 16px; font-weight: 500; background: var(--frost); color: var(--harbor); white-space: nowrap; }
.gh-badge.dot::before { content: ""; width: 6px; height: 6px; background: currentColor; }
.gh-badge-done { background: var(--success-soft); color: var(--success); }
.gh-badge-live { background: var(--sun-soft); color: var(--sun-text); }
.gh-badge-warn { background: var(--warning-soft); color: var(--warning); }
.gh-badge-fail { background: var(--danger-soft); color: var(--danger); }
.gh-badge-mono { font-family: var(--font-mono); font-size: 11px; font-weight: 400; background: var(--white); border: 1px solid var(--rule); color: var(--ink-secondary); }

/* Tabs and segmented */
.gh-tabs { display: flex; gap: var(--space-5); border-bottom: 1px solid var(--rule); }
.gh-tab { font: inherit; background: none; border: 0; padding: 0; height: 36px; font-family: var(--font-mono); font-size: 11px; color: var(--harbor); border-bottom: 2px solid transparent; margin-bottom: -1px; cursor: pointer; }
.gh-tab:hover { color: var(--ink); }
.gh-tab[aria-selected="true"] { color: var(--ink); border-bottom-color: var(--ink); }
.gh-seg { display: inline-flex; gap: 2px; padding: 3px; background: var(--frost); border-radius: var(--radius-sm); }
.gh-seg button { font: inherit; font-size: 13px; font-weight: 500; border: 1px solid transparent; background: none; color: var(--harbor); height: 28px; padding: 0 12px; border-radius: 4px; cursor: pointer; }
.gh-seg button[aria-pressed="true"] { background: var(--white); color: var(--ink); border-color: var(--rule); }

/* Cards and KPIs */
.gh-card { background: var(--white); border: 1px solid var(--rule); border-radius: var(--radius-md); padding: var(--space-5); min-width: 0; }
.gh-card-head { display: flex; justify-content: space-between; align-items: center; gap: var(--space-3); margin-bottom: var(--space-4); }
.gh-card-title { margin: 0; font-size: 16px; line-height: 24px; font-weight: 600; letter-spacing: -.01em; }
.gh-kpi-value { font-family: var(--font-display); font-size: 36px; line-height: 40px; font-weight: 700; letter-spacing: -0.02em; font-variant-numeric: tabular-nums; margin-top: var(--space-2); }
.gh-delta { font-size: 12px; line-height: 16px; font-weight: 500; color: var(--success); margin-top: var(--space-1); }
.gh-delta.warn { color: var(--warning); } .gh-delta.down { color: var(--danger); }

/* Table */
.gh-table-wrap { background: var(--white); border: 1px solid var(--rule); border-radius: var(--radius-md); overflow-x: auto; }
.gh-table { width: 100%; border-collapse: collapse; font-size: 14px; }
.gh-table th { height: 36px; padding: 0 var(--space-3); text-align: left; background: var(--frost); border-bottom: 1px solid var(--rule); font-family: var(--font-mono); font-size: 11px; font-weight: 400; color: var(--harbor); white-space: nowrap; }
.gh-table td { height: var(--row-height); padding: 0 var(--space-3); border-bottom: 1px solid var(--rule); color: var(--ink-secondary); white-space: nowrap; }
.gh-table tbody tr:last-child td { border-bottom: 0; }
.gh-table tbody tr { cursor: pointer; }
.gh-table tbody tr:hover td { background: var(--mist); }
.gh-table tbody tr[aria-selected="true"] td { background: var(--lagoon-soft); }
.gh-table tbody tr[aria-selected="true"] td:first-child { box-shadow: inset 2px 0 0 var(--lagoon); }
.gh-table .r { text-align: right; font-variant-numeric: tabular-nums; }
.gh-table .strong { color: var(--ink); font-weight: 500; }
.gh-table .id { font-family: var(--font-mono); font-size: 11px; color: var(--harbor); }
.gh-table-foot { display: flex; justify-content: space-between; gap: var(--space-3); padding: 10px var(--space-3); border-top: 1px solid var(--rule); font-size: 12px; color: var(--harbor); }

/* App shell */
.gh-app { display: grid; grid-template-columns: var(--sidebar-width) minmax(0, 1fr); min-height: 640px; background: var(--white); font-size: 14px; }
.gh-side { background: var(--mist); border-right: 1px solid var(--rule); padding: var(--space-4) 10px; display: flex; flex-direction: column; gap: var(--space-5); }
.gh-brand { display: flex; align-items: center; gap: var(--space-2); padding: 0 6px; font-family: var(--font-display); font-size: 20px; line-height: 24px; color: var(--ink); }
.gh-nav { display: grid; gap: 2px; }
.gh-nav .gh-meta { padding: 0 8px 6px; }
.gh-nav a { display: flex; align-items: center; gap: 10px; height: 30px; padding: 0 8px; border-radius: var(--radius-sm); font-size: 13px; font-weight: 500; color: var(--ink-secondary); text-decoration: none; cursor: pointer; }
.gh-nav a .gh-icon { color: var(--harbor); }
.gh-nav a:hover { background: var(--white); color: var(--ink); }
.gh-nav a[aria-current="page"] { background: var(--lagoon-soft); color: var(--lagoon-text); }
.gh-nav a[aria-current="page"] .gh-icon { color: var(--lagoon-text); }
.gh-nav .count { margin-left: auto; font-family: var(--font-mono); font-size: 10px; color: var(--harbor); }
.gh-main { min-width: 0; display: flex; flex-direction: column; }
.gh-top { height: var(--topbar-height); border-bottom: 1px solid var(--rule); display: flex; align-items: center; gap: var(--space-3); padding: 0 var(--space-6); }
.gh-top .gh-input { max-width: 320px; }
.gh-top .right { margin-left: auto; display: flex; gap: var(--space-2); align-items: center; }
.gh-avatar { width: 30px; height: 30px; border-radius: 50%; background: var(--mist); border: 1px solid var(--rule); display: grid; place-items: center; font-size: 11px; font-weight: 600; color: var(--ink-secondary); }
.gh-page { padding: var(--space-6); display: grid; gap: var(--space-6); max-width: var(--content-max); }
.gh-page-head { display: flex; justify-content: space-between; align-items: flex-end; gap: var(--space-4); flex-wrap: wrap; }
.gh-page-title { margin: 2px 0 0; font-family: var(--font-display); font-size: 32px; line-height: 36px; font-weight: 700; letter-spacing: -0.02em; }
.gh-page-sub { margin: var(--space-1) 0 0; color: var(--harbor); }

/* Modal, toast, banner, empty */
.gh-backdrop { background: rgba(15, 26, 32, .2); padding: var(--space-6); display: grid; place-items: center; }
.gh-modal { width: 100%; max-width: 440px; background: var(--white); border: 1px solid var(--rule); border-radius: var(--radius-lg); box-shadow: var(--shadow-modal); }
.gh-modal-head { display: flex; justify-content: space-between; gap: var(--space-3); padding: var(--space-5) var(--space-5) 0; }
.gh-modal-title { margin: 0; font-family: var(--font-display); font-size: 24px; line-height: 30px; font-weight: 700; }
.gh-modal-body { padding: var(--space-5); display: grid; gap: var(--space-4); }
.gh-modal-foot { display: flex; justify-content: flex-end; gap: var(--space-2); padding: var(--space-4) var(--space-5); border-top: 1px solid var(--rule); }
.gh-toast { display: inline-flex; align-items: center; gap: var(--space-3); padding: 12px var(--space-4); background: var(--white); border: 1px solid var(--rule); border-radius: var(--radius-lg); box-shadow: var(--shadow-pop); font-weight: 500; }
.gh-toast .gh-icon { color: var(--lagoon); }
.gh-banner { display: flex; align-items: center; gap: var(--space-3); padding: 12px var(--space-4); border-radius: var(--radius-md); font-size: 14px; }
.gh-banner .grow { flex: 1; }
.gh-banner-warn { background: var(--warning-soft); color: var(--warning); }
.gh-banner-fail { background: var(--danger-soft); color: var(--danger); }
.gh-banner-info { background: var(--lagoon-soft); color: var(--lagoon-text); }
.gh-empty { position: relative; overflow: hidden; text-align: center; padding: var(--space-12) var(--space-6); background: var(--white); border: 1px solid var(--rule); border-radius: var(--radius-md); }
.gh-empty > * { position: relative; }
.gh-empty .gh-icon { width: 20px; height: 20px; color: var(--harbor); }
.gh-empty h3 { margin: var(--space-3) 0 var(--space-1); font-size: 16px; line-height: 24px; font-weight: 600; }
.gh-empty p { margin: 0 auto var(--space-4); max-width: 40ch; color: var(--harbor); }
.gh-skel { background: var(--frost); border-radius: 4px; height: 12px; }

/* Signature details */
.gh-mark { display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: var(--sun); flex: none; }
.gh-eyebrow::before { content: ""; width: 6px; height: 6px; border-radius: 50%; background: var(--sun); }
.gh-accent { color: var(--lagoon); }
.gh-empty::before { content: ""; position: absolute; inset: 0; background: radial-gradient(circle at 30% 20%, rgba(11, 110, 140, .10), transparent 50%), radial-gradient(circle at 70% 80%, rgba(242, 183, 5, .10), transparent 50%); }
/* Frosted pane and mesh (signature, website) */
.gh-glass { background: rgba(255, 255, 255, .72); -webkit-backdrop-filter: blur(18px) saturate(1.3); backdrop-filter: blur(18px) saturate(1.3); border: 1px solid rgba(255, 255, 255, .9); border-radius: var(--radius-lg); box-shadow: 0 20px 40px -20px rgba(15, 26, 32, .18); }
```

## motion.css (website only)

```css
/* Glasshouse · motion.css — WEBSITE ONLY. Never load inside the platform UI. Requires tokens.css. */
/* ---------------- Website ---------------- */
.fw { font-size: 17px; line-height: 28px; background: var(--mist); }
.ghw-wrap { max-width: var(--site-max); margin: 0 auto; padding: 0 var(--space-6); }
.ghw-nav { display: flex; align-items: center; justify-content: space-between; height: 72px; }
.ghw-logo { display: flex; align-items: center; gap: var(--space-2); font-family: var(--font-display); font-size: 22px; line-height: 28px; color: var(--ink); text-decoration: none; }
.ghw-links { display: flex; align-items: center; gap: var(--space-6); font-size: 14px; font-weight: 500; color: var(--harbor); }
.ghw-links a { color: inherit; text-decoration: none; transition: color 150ms ease-out; }
.ghw-links a:hover { color: var(--ink); }
.ghw-links a[aria-current="page"] { color: var(--ink); text-decoration: underline; text-underline-offset: 6px; text-decoration-thickness: 1px; }
.fw .gh-btn { transition: background-color 150ms ease-out; }
.fw .gh-btn .arr { display: inline-block; transition: transform 150ms ease-out; }
.fw .gh-btn:hover .arr, .ghw-card:hover .arr { transform: translateX(3px); }
.ghw-display { margin: 0; font-family: var(--font-display); font-weight: 700; font-size: 88px; line-height: 84px; letter-spacing: -0.02em; max-width: 13ch; color: var(--ink); }
.ghw-display .w { display: inline-block; }
.ghw-lead { margin: var(--space-5) 0 var(--space-8); max-width: 44ch; font-size: 19px; line-height: 30px; color: var(--harbor); }
.ghw-cta { display: flex; gap: var(--space-3); flex-wrap: wrap; }
.ghw-sec-head { display: flex; justify-content: space-between; align-items: flex-end; gap: var(--space-4); flex-wrap: wrap; margin-bottom: var(--space-8); }
.ghw-h1 { margin: var(--space-3) 0 0; font-family: var(--font-display); font-weight: 700; font-size: 56px; line-height: 58px; letter-spacing: -0.02em; }
.ghw-h2 { margin: 0; font-family: var(--font-display); font-weight: 700; font-size: 40px; line-height: 44px; letter-spacing: -0.02em; }
.ghw-cards { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: var(--space-6); }
.ghw-card { display: flex; flex-direction: column; gap: var(--space-2); padding: var(--space-6); background: var(--white); border: 1px solid var(--rule); border-radius: var(--radius-md); text-decoration: none; color: var(--ink); min-width: 0; }
.ghw-shot { aspect-ratio: 16/10; border-radius: var(--radius-sm); background: var(--mist); border: 1px solid var(--rule); margin-bottom: var(--space-3); padding: 12px; display: grid; gap: 8px; align-content: start; }
.ghw-shot span { height: 8px; border-radius: 4px; background: var(--frost); }
.ghw-card h3 { margin: 0; font-size: 20px; line-height: 28px; font-weight: 600; letter-spacing: -.01em; display: flex; justify-content: space-between; transition: color 150ms ease-out; }
.ghw-card:hover h3 { color: var(--lagoon); }
.ghw-card p { margin: 0; font-size: 15px; line-height: 24px; color: var(--harbor); }
.ghw-card .tags { display: flex; gap: var(--space-2); flex-wrap: wrap; margin-top: var(--space-3); }
.ghw-notes { display: grid; }
.ghw-note { display: grid; grid-template-columns: 120px minmax(0, 1fr); gap: var(--space-4); padding: var(--space-5) 0; border-bottom: 1px solid var(--rule); text-decoration: none; color: var(--ink); }
.ghw-note b { display: block; font-family: var(--font-display); font-weight: 700; font-size: 24px; line-height: 30px; transition: color 150ms ease-out; }
.ghw-note:hover b { color: var(--lagoon); }
.ghw-note span { color: var(--harbor); font-size: 15px; }
@media (max-width: 760px) {
  .ghw-display { font-size: 48px; line-height: 48px; } .ghw-h1 { font-size: 36px; line-height: 40px; } .ghw-h2 { font-size: 30px; line-height: 34px; }
  .ghw-cards { grid-template-columns: 1fr; } .ghw-links { display: none; } .ghw-hero { padding: var(--space-5) var(--space-5) var(--space-10); }
  .ghw-note { grid-template-columns: 1fr; gap: var(--space-1); }
  .gh-app { grid-template-columns: 1fr; } .gh-side { display: none; }
}

/* Accent word */
.ghw-display em, .ghw-h1 em, .ghw-h2 em { font-style: normal; color: var(--lagoon); }

/* Hero (signature) */
.ghw-hero { position: relative; overflow: hidden; text-align: center; padding: var(--space-24) 0 var(--space-16); }
.ghw-mesh i { position: absolute; width: 46vw; aspect-ratio: 1; border-radius: 50%; filter: blur(60px); pointer-events: none; }
.ghw-mesh i:nth-child(1) { left: -10%; top: -20%; background: rgba(11, 110, 140, .18); }
.ghw-mesh i:nth-child(2) { right: -10%; top: 0; background: rgba(125, 200, 230, .16); }
.ghw-mesh i:nth-child(3) { left: 30%; bottom: -30%; background: rgba(242, 183, 5, .14); }
.ghw-hero > .in { position: relative; }

@media (prefers-reduced-motion: no-preference) {
  .ghw-play .ghw-mesh i { animation: ghw-drift 1600ms var(--ease-reveal) both; }
  @keyframes ghw-drift { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: none; } }
  .ghw-play .ghw-display .w { animation: ghw-rise 700ms var(--ease-reveal) both; animation-delay: calc(200ms + var(--i) * var(--stagger)); }
  @keyframes ghw-rise { from { opacity: 0; transform: translateY(.3em); filter: blur(4px); } to { opacity: 1; transform: none; filter: none; } }
  .ghw-play .gh-glass { animation: ghw-float 800ms var(--ease-reveal) both; animation-delay: calc(700ms + var(--i) * 120ms); }
  @keyframes ghw-float { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: none; } }
  .ghw-play .gh-eyebrow::before { animation: ghw-pulse 1.2s ease-out 1 1100ms; }
  @keyframes ghw-pulse { 50% { box-shadow: 0 0 0 6px rgba(242, 183, 5, .3); } }
  .ghw-fade.ghw-in { animation: ghw-up var(--duration-reveal) var(--ease-reveal) both; }
  @keyframes ghw-up { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }
}

/* Usage
   1. Hero markup: <header class="ghw-hero"><div class="ghw-mesh"><i></i><i></i><i></i></div><div class="in">…<h1 class="ghw-display">Clear systems, built for <em>people</em>.</h1>…<div class="gh-glass" style="--i:0">…</div></div></header>
   2. Split the headline into <span class="w" style="--i:N"> words (or lines), then add .ghw-play to the hero once it is in view.
   3. Section titles: add .ghw-fade; add .ghw-in when they first enter the viewport.
   Everything is visible before and without the script; prefers-reduced-motion turns all of it off. */
```

## tailwind-theme.css (only if the project uses Tailwind v4)

```css
@import "tailwindcss";
/* Glasshouse · Tailwind v4 theme. Load tokens.css first. Light only. */
@theme inline {
  --color-mist: var(--mist);
  --color-white: var(--white);
  --color-frost: var(--frost);
  --color-rule: var(--rule);
  --color-rule-strong: var(--rule-strong);
  --color-ink: var(--ink);
  --color-ink-secondary: var(--ink-secondary);
  --color-harbor: var(--harbor);
  --color-placeholder: var(--placeholder);
  --color-lagoon: var(--lagoon);
  --color-lagoon-hover: var(--lagoon-hover);
  --color-lagoon-soft: var(--lagoon-soft);
  --color-lagoon-text: var(--lagoon-text);
  --color-on-lagoon: var(--on-lagoon);
  --color-sun: var(--sun);
  --color-sun-soft: var(--sun-soft);
  --color-sun-text: var(--sun-text);
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

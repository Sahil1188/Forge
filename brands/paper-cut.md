# PAPER-CUT.md · Sahil Shaikh brand (all-in-one)

**For Claude Code:** this single file contains the whole Paper Cut system: brand rules, platform UI rules (no animation), website rules (with motion), and the complete CSS. Put it in the project root and add this line to `CLAUDE.md`:

```
All UI follows PAPER-CUT.md. Before writing UI, create tokens.css, components.css (and motion.css for website pages) from Part 4 if they don't exist, then use only their variables and classes. Light only, never dark. Platform UI has no animation.
```

## How Claude Code should use this file

1. Decide the surface: **Platform UI** (app, dashboard, admin, settings) or **Website** (marketing, portfolio, landing). If unclear, assume Platform UI.
2. If `tokens.css` and `components.css` don't exist in the project, create them by copying the code blocks in Part 4 exactly. For website pages also create `motion.css`. With Tailwind v4 also create `tailwind-theme.css`.
3. Load the Google Fonts in Part 1, section 5.
4. Never hard-code colours, font sizes or fonts. Never add dark mode or dark sections.
5. Platform UI: wrap the app in `class="pp-app"` (kills all motion). Website: follow Part 3, section 4.
6. Finish by running the checklist at the end of Part 2 or Part 3.

---

Sahil Shaikh's brand and design system, **Paper Cut**. Part 1 is the brand foundations, Part 2 the platform UI rules (no animation), Part 3 the website rules (with motion), Part 4 the code.

*Researched from: Craft, Granola's notes, physical sticky notes and paper collage. Inspired by, not copied from: no logos, fonts or assets of those products are used.*

---

# Part 1 · Brand foundations

The brand of Sahil Shaikh, Full Stack AI Engineer. **Paper Cut**: a desk of cut paper: cream sheets, pastel sticky notes with coloured edges, a black marker and a tomato pin. It covers every platform Sahil designs and his website.

This system has three parts:

1. **Brand foundations** (Part 1): idea, logo, colour, type, layout, shape, icons, imagery, voice and accessibility.
2. **Platform UI** (Part 2): rules for any app, dashboard or tool. **No animation.**
3. **Website** (Part 3): the same brand with larger type and a defined motion system.

Light only. There is no dark theme, and no dark sections, panels or backgrounds anywhere.

---

## 1. The idea

| | |
|---|---|
| **Metaphor** | A desk of cut paper: cream sheets, pastel sticky notes with coloured edges, a black marker and a tomato pin. |
| **Personality** | Creative, tactile, organised in a human way. |
| **Feeling we want** | "Thoughtful work, made by a real person." |
| **Three ingredients** | **Serif voice** (DM Serif Display headlines) · **Sticky notes** (pastel cards with 2px coloured edges) · **Marker** (black pill buttons, tomato pin for what's live) |

## 2. Principles

1. **Parchment ground.** Pages on warm `parchment`; working panels are `white`.
2. **Notes, not boxes.** Grouped content sits on pastel sticky notes with a 2px edge in a deeper shade.
3. **Black marker to act.** Primary actions are `charcoal` pills.
4. **Tomato pin.** A small tomato dot marks live or new. It is never text.
5. **Four pastels, fixed meanings.** Butter = ideas/drafts, mint = done, rose = needs attention, sky = info.
6. **Product still; notes drop in on the website.** The hero notes fall and settle once.
7. **Accessible always.** Text 4.5:1 or better, borders and indicators 3:1, focus always visible.

## 3. Logo

- **Wordmark:** "Sahil Shaikh" in DM Serif Display, `ink`, with a tomato pin dot above the "i".
- **Product mark:** a tiny butter note (12px, rotated -4°) + product name in DM Serif Display.
- **App icon / avatar:** a butter sticky note with a 2px darker edge, 14px radius, a serif "S", a tomato pin.
- **Clear space:** the cap height. **Minimum size:** wordmark 96px; icon 24px.
- **Never:** rotate the wordmark, use more than one pastel in the logo, place it on dark.

## 4. Colour

### Core palette

| Token | Hex | Role |
|---|---|---|
| `parchment` | #FCF9F6 | Page ground, sidebar, website background |
| `white` | #FFFFFF | Cards, tables, inputs, modals |
| `flour` | #F4EFE9 | Hover rows, table headers |
| `rule` | #EAE3DA | Dividers and borders |
| `rule-strong` | #918878 | Input borders, strong dividers |
| `ink` | #141210 | Headings, primary text |
| `ink-secondary` | #36312B | Labels, nav, table text |
| `cocoa` | #6A6057 | Secondary text, labels |
| `placeholder` | #6E655C | Placeholders, disabled text |
| `charcoal` | #1A1714 | Primary pill buttons, active states, focus |
| `charcoal-hover` | #36312B | Hover/pressed charcoal |
| `charcoal-soft` / `charcoal-text` | #EFEBE6 / #1A1714 | Selected, active, success |
| `tomato` | #E4553E | Pins: live dots, "new" markers |
| `tomato-soft` / `tomato-text` | #FDEBE7 / #A3301E | Soft tomato badges |
| `butter` | #F6E7A6 | Sticky note: ideas, drafts |
| `butter-edge` | #D9B83C | Butter note edge |
| `mint` | #D2EDDC | Sticky note: done |
| `mint-edge` | #6FB98C | Mint note edge |
| `rose` | #F7D9DE | Sticky note: needs attention |
| `rose-edge` | #D98896 | Rose note edge |
| `sky` | #D6E8F8 | Sticky note: info |
| `sky-edge` | #7AAFE0 | Sky note edge |
| `warning` / `warning-soft` | #8A5A00 / #FFF4DC | Needs attention |
| `danger` / `danger-soft` | #B42318 / #FDECEB | Errors, destructive |

### Charts

`chart-1` charcoal #1A1714, `chart-2` #E2C65A, `chart-3` #86B6E3, and `chart-highlight` tomato #E4553E for the one value that matters. Gridlines use `rule`, axis labels use `ui-meta` in `cocoa`.

### Proportions

About 55% parchment, 25% white, 12% pastel notes, 7% type and lines, 1% tomato.

### Rules

- Charcoal is the action colour. One filled charcoal pill per view.
- Tomato is a pin: dots and small markers only, never text on white, never a button.
- Pastels are backgrounds with `ink` text; each has a fixed meaning (see Principles).
- No gradients.
- Never use `ink` as a large background.

## 5. Typography

Three roles, all free on Google Fonts:

`https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&family=DM+Mono:wght@400;500&display=swap`

| Family | Role | Use | Weights |
|---|---|---|---|
| **DM Serif Display** | **The voice** | Page titles, big numbers, website headlines, note titles | 400, 400 italic |
| **DM Sans** | **The clarity** | All UI and body text | 400, 500, 600 |
| **DM Mono** | **The precision** | Dates, IDs, column headers | 400, 500 |

- **Accent word:** one word per headline in DM Serif Display *italic*.
- Note titles in DM Serif Display 20px; note body in DM Sans 14px.
- Handwriting fonts are never used; the paper feel comes from shape and colour.
- Sentence case. No ALL CAPS.
- Full scales are in Part 2 (platform) and Part 3 (website).

## 6. Layout and spacing

- **4px grid:** 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 96, 128.
- **Platform:** sidebar on `parchment`, content on `white`, 24px page padding, max 1200px.
- **Website:** 1120px max width, 96px between sections.
- Align to a left edge in the product. Centre only short single lines (an empty state).

## 7. Shape and depth

| Token | Value | Use |
|---|---|---|
| `radius-xs` | 6px | Badges, checkboxes |
| `radius-sm` | 10px | Inputs, nav items |
| `radius-md` | 14px | Cards, sticky notes, tables |
| `radius-lg` | 20px | Modals, website panels |
| `radius-full` | 9999px | All buttons, pins, toggles |

- **Sticky notes** (signature): pastel fill, 2px border in the matching `-edge` colour, `radius-md`. On the website they may rotate between -2° and 2°; in the product never.
- **Torn edge** (signature, website only): sections can end with a soft zig-zag paper edge (CSS mask).
- **Pins**: 8px tomato dots on the top edge of a note that is live.
- Shadows: a small paper shadow (`0 1px 0 rgba(0,0,0,.04)`) on notes; modals use `shadow-modal`.

## 8. Iconography

- Lucide, 1.75px stroke, rounded. 16px in controls. `cocoa` default, `ink` active.
- Icon-only buttons always have an accessible label.

## 9. Imagery

- Screenshots placed on a white sheet with a 2px edge, slightly overlapping a sticky note.
- Collage-style compositions on the website: paper shapes, notes, a screenshot. Never stock photos.
- Portrait: warm, natural, paper-white background.

## 10. Voice and writing

- Human and warm, like a note left on a desk.
- Lead with what something does: "Agents plan, build and review work together."
- Buttons are verbs: "New project", "Save changes". Confirmations say what happened: "Project created."
- Errors say what went wrong and how to fix it: "Name is required. Add a project name to continue."
- Numbers: "AED 1,250.00", dates "21 Oct 2026", times "14:32".
- No buzzwords, no exclamation marks, no emoji in UI.

## 11. Accessibility

- Every text colour pair passes WCAG AA (4.5:1). Borders, focus rings and indicators pass 3:1.
- Focus ring: 2px white gap + 2px `charcoal`, on every interactive element.
- Never rely on colour alone; pair it with a word, icon or position.
- Hit targets at least 28px (34px default).
- The website respects `prefers-reduced-motion`: all motion off, content visible immediately.

Measured contrast for this palette:

| Pair | Ratio | Needed |
|---|---|---|
| Body text `ink` on `white` | 18.69:1 | 4.5:1 |
| `cocoa` on `parchment` | 5.85:1 | 4.5:1 |
| `cocoa` on `flour` | 5.37:1 | 4.5:1 |
| White on `charcoal` (primary button) | 17.85:1 | 4.5:1 |
| `charcoal` links on `white` | 17.85:1 | 4.5:1 |
| `charcoal-text` on `charcoal-soft` | 15.04:1 | 4.5:1 |
| `tomato-text` on `tomato-soft` | 6.07:1 | 4.5:1 |
| `placeholder` on `white` | 5.71:1 | 4.5:1 |
| `rule-strong` borders on `white` | 3.5:1 | 3:1 |
| `ink` on `tomato` (mark used as a fill) | 5.04:1 | 4.5:1 |

## 12. Do and don't

| Do | Don't |
|---|---|
| Parchment ground, white sheets | Dark backgrounds or dark mode |
| Pastel notes with fixed meanings | Random pastel colours |
| Charcoal pill buttons | Coloured buttons |
| Tomato as a pin | Tomato text |
| Rotation on the website only | Rotated notes in the product |
| Serif titles | Handwriting fonts |
| Torn edges between website sections | Torn edges in the product |
| Notes drop in once | Animation in the platform |


---

# Part 2 · Platform UI guideline

Rules for any platform, app, dashboard, admin or internal tool built in the Paper Cut brand. It is generic: it works for projects, CRM, analytics, payments, AI agents or anything else.

**The platform never animates.** State changes are instant. Every rule here assumes light only.

---

## 1. Foundations for the platform

- **Ground:** `parchment` for the app canvas and sidebar. `white` for every working panel (cards, tables, forms, modals).
- **Text:** `ink` for headings and values, `ink-secondary` for labels and nav, `cocoa` for help text and metadata.
- **Action colour:** `charcoal`. **Mark:** `tomato` (small).
- **Density:** 14px text, 34px controls, 44px rows, 4px grid.

## 2. Type scale

| Style | Size / line | Weight | Family | Use |
|---|---|---|---|---|
| `ui-page-title` | 32 / 36 | 400 | DM Serif Display | Page title, one per screen |
| `ui-numeric` | 36 / 40 | 400 | DM Serif Display | KPI values, big totals |
| `ui-heading` | 16 / 24 | 600 | DM Sans | Card, section, modal headings |
| `ui-subheading` | 14 / 20 | 600 | DM Sans | Form group titles |
| `ui-body` | **14 / 20** | 400 | DM Sans | **Default text** |
| `ui-body-lg` | 16 / 24 | 400 | DM Sans | Empty states, onboarding |
| `ui-label` | 13 / 18 | 500 | DM Sans | Labels, nav items, buttons |
| `ui-small` | 12 / 16 | 400 | DM Sans | Help text, captions |
| `ui-meta` | 11 / 16 | 400 | DM Mono | IDs, timestamps, column headers |

Rules:

- DM Serif Display only for `ui-page-title`, `ui-numeric` and modal titles. Never in buttons, tables, forms, nav or badges.
- Numbers in tables use `font-variant-numeric: tabular-nums` and align right.
- Never below 11px (mono) or 12px (UI).

## 3. App layout

- **Sidebar:** 232px (60px collapsed), `parchment`, 1px `rule` right border, 16px top padding. Product mark at top. Groups titled with `ui-meta`.
- **Top bar:** 56px, `white`, 1px `rule` bottom border. Search left (320px max), actions right.
- **Page header:** breadcrumb in `ui-meta`, then `ui-page-title`, optional one-line description in `cocoa`. Actions on the right, aligned to the title's baseline.
- **Content:** 24px padding, max width 1200px, 24px gap between blocks, 32px between page sections.
- **Breakpoints:** 640, 768, 1024, 1280. Below 1024 the sidebar becomes a drawer.

## 4. Components

### Buttons

| Variant | Look | Use |
|---|---|---|
| Primary | `charcoal` fill, `on-charcoal` text | The one main action per view |
| Secondary | `white` fill, 1px `rule-strong` border, `ink` text | Every other action |
| Ghost | No fill or border, `ink-secondary` text | Toolbars, cancel, low emphasis |
| Danger | `danger` fill, white text | Destructive confirmations only |

- Sizes: 28px (sm), **34px (default)**, 40px (lg). `radius-sm`. `ui-label` 13/500.
- States: hover = instant background change (`charcoal-hover`, `flour`); focus = `focus-ring`; disabled = `opacity-disabled`.
- Labels are verbs in sentence case: "New project", "Export CSV".

### Text inputs, selects, textareas

- 34px tall, 12px horizontal padding, `radius-sm`, `white` fill, 1px `rule-strong` border, `placeholder` colour for placeholders.
- Label above (`ui-label`, `ink-secondary`), help or error below (`ui-small`), 6px gaps.
- Focus: `charcoal` border + `focus-ring`. Error: `danger` border and a message saying how to fix it.

### Checkbox, radio, toggle

- Checkbox 16px, `radius-xs`; checked = `charcoal` fill with white tick. Radio: 8px `charcoal` dot. Toggle 32 × 18px; on = `charcoal`.
- The label is always clickable and sits 10px to the right.

### Badges

- 22px tall, 8px padding, `radius-xs`, 12/500.
- Done (`charcoal-soft`/`charcoal-text`), Live or new (`tomato-soft`/`tomato-text`), Needs review (`warning-soft`/`warning`), Failed (`danger-soft`/`danger`), Draft (`flour`/`cocoa`).

### Tabs and segmented controls

- **Tabs:** DM Sans 14/500 pills on a `flour` track; active = white pill with 1px `rule`.
- **Segmented control:** `flour` track, 3px padding; active segment = `white` with 1px `rule`.

### Tables

- `white` panel, 1px `rule`, `radius-md`, horizontal scroll on narrow screens.
- Header 36px, `flour`, `ui-meta` labels in `cocoa`. Rows 44px, 1px `rule` between rows. Hover = `parchment`. Selected = `charcoal-soft` with a 2px `charcoal` left edge.
- IDs in `ui-meta`. Amounts right-aligned, tabular. Status as badges.

### Cards and KPIs

- `white`, 1px `rule`, `radius-md`, 20px padding, no shadow. KPI: `ui-meta` label, value in `ui-numeric`, delta in `ui-small`.
- Signature detail (Sticky notes) on one group per screen at most.

### Navigation

- Sidebar items: 30px, `radius-sm`, `ui-label`, 16px icon in `cocoa`.
- Active: `flour` background + `ink` text, with a 6px tomato pin.
- Breadcrumbs in `ui-meta` separated by " / ".

### Modals and side sheets

- Widths 440 / 600 / 800px; `white`, `radius-lg`, `shadow-modal`. Backdrop `ink` at 20%.
- Title in DM Serif Display 24/30; footer buttons right-aligned, primary last. Escape closes; focus returns to the trigger.

### Toasts, banners, empty, loading and error states

- Toast: bottom-right, `white`, `radius-lg`, `shadow-pop`, one line + optional "Undo". No animation.
- Empty: centred, 20px icon in `cocoa`, `ui-heading`, one line of `ui-body`, one primary button.
- Loading: static `flour` skeleton blocks + a `ui-meta` "loading…" label. No spinners or shimmer.
- Error: danger banner with what failed and a "Try again" button.

### Data visualisation

- `chart-1` main series, `chart-2` comparison, `chart-3` other, `chart-highlight` for one value. Gridlines `rule`, axis labels `ui-meta`. No animation, no 3D, no gradients.

## 5. Patterns

- **Forms:** one column, max 560px. Labels above fields. Actions bottom-right, primary last.
- **List to detail:** clicking a row opens a side sheet for quick edits.
- **Destructive actions:** confirm in a modal that names the thing, with a danger button.
- **Settings:** left sub-nav (200px) + one form card per section.

## 6. No-motion rules

- Everything inside `.pp-app` has `transition: none; animation: none`.
- Hover, focus, open and close are instant. Progress is static text or a stepped bar.

## 7. Checklist for every screen

- [ ] `parchment` canvas, white panels, no dark areas
- [ ] One DM Serif Display page title; all other text DM Sans or mono
- [ ] One filled `charcoal` button
- [ ] `tomato` only as a small mark
- [ ] 14px body, 34px controls, 44px rows, 4px grid
- [ ] Lines, not shadows (shadows only on floating things)
- [ ] Focus visible on every control
- [ ] Status has a word, not just colour
- [ ] Nothing animates


---

# Part 3 · Website guideline

How the Paper Cut brand looks and moves on Sahil's website, landing pages and portfolio. Same palette and families as the platform, with bigger type, more air, and a defined motion system.

Light only: no dark bands, dark footers or dark cards.

---

## 1. Layout

- Max width 1120px, side padding 24px (16px on phones).
- 96px between sections (64px on phones); hero top spacing 128px (64px on phones).
- Text blocks max 60 characters wide.

## 2. Type scale

| Style | Size / line | Weight | Family | Use |
|---|---|---|---|---|
| `web-display` | 88 / 88 (48 / 50 on phones) | 400 | DM Serif Display | Hero headline |
| `web-h1` | 56 / 60 (36 on phones) | 400 | DM Serif Display | Section titles |
| `web-h2` | 40 / 46 (30 on phones) | 400 | DM Serif Display | Sub-sections, contact |
| `web-h3` | 20 / 28 | 600 | DM Sans | Card titles |
| `web-lead` | 19 / 30 | 400 | DM Sans | Intro paragraphs |
| `web-body` | 17 / 28 | 400 | DM Sans | Running text |
| `web-eyebrow` | 12 / 16 | 400 | DM Mono | Line above a headline |

- Accent: One italic DM Serif word per headline (same colour).
- Eyebrow: DM Mono 12px `cocoa`, led by an 8px tomato pin.

## 3. Page anatomy

### Navigation

- 68px, a floating white bar with `radius-full`, 1px `rule`, inset 12px from the top. Left: wordmark. Centre: links DM Sans 14/500. Right: charcoal pill "Say hello".

### Hero

- `parchment`. Centred DM Serif headline (84px) with one italic word, lead, charcoal pill. Below, a collage: a screenshot sheet with four sticky notes around it, each slightly rotated.

### Section header

- Centred `web-h1` in DM Serif, one-line description, optional butter note label.

### Work cards

- Projects as sticky notes in a masonry of two or three columns: pastel by type, DM Serif title, DM Sans text. Hover: rotation eases to 0° and the note lifts 2px.

### Notes / writing list

- Rows on white with the date in mono and DM Serif titles. Hover: a butter background.

### Contact

- A big butter note with a pin: headline, the email with Copy, charcoal pill.

### Footer

- `parchment` with a torn edge on top, links and mono copyright.

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
| 0ms | Sheet appears | The screenshot sheet fades in, 500ms |
| 150ms | Notes drop | Each note: translateY -40px → 0, rotate ±8° → its resting angle, 700ms, 90ms apart, with a soft overshoot |
| 200ms | Headline rises | Words fade up, 600ms, 50ms apart |
| 900ms | Pins | Tomato pins scale 0 → 1, 200ms |
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
<header class="ppw-hero"><h1 class="ppw-display">Ideas, built <em>carefully</em>.</h1>…<div class="ppw-collage"><div class="pp-note" style="--r:-3deg;--i:0">…</div>…</div></header>
```

## 5. Checklist for every page

- [ ] Light only, no dark bands
- [ ] Headlines follow the accent rule (One italic DM Serif word per headline (same colour))
- [ ] Eyebrow above key headlines
- [ ] Signature details only where Part 1 allows them
- [ ] One hero motion sequence; everything readable before it plays
- [ ] Hover responses at 150ms
- [ ] Reduced motion respected
- [ ] One primary button per section


---

# Part 4 · Code

Copy each block into its own file, exactly as written. Component classes use the `.pp-` prefix (platform) and `.ppw-` (website).

## tokens.css

```css
/* Paper Cut tokens · Sahil Shaikh. Light only: there is no dark theme. */
:root {
  color-scheme: light;
  --parchment: #fcf9f6;
  --white: #ffffff;
  --flour: #f4efe9;
  --rule: #eae3da;
  --rule-strong: #918878;
  --ink: #141210;
  --ink-secondary: #36312b;
  --cocoa: #6a6057;
  --placeholder: #6e655c;
  --charcoal: #1a1714;
  --charcoal-hover: #36312b;
  --charcoal-soft: #efebe6;
  --charcoal-text: #1a1714;
  --on-charcoal: #ffffff;
  --tomato: #e4553e;
  --tomato-soft: #fdebe7;
  --tomato-text: #a3301e;
  --butter: #f6e7a6;
  --butter-edge: #d9b83c;
  --mint: #d2eddc;
  --mint-edge: #6fb98c;
  --rose: #f7d9de;
  --rose-edge: #d98896;
  --sky: #d6e8f8;
  --sky-edge: #7aafe0;
  --success: var(--charcoal-text);
  --success-soft: var(--charcoal-soft);
  --warning: #8a5a00;
  --warning-soft: #fff4dc;
  --danger: #b42318;
  --danger-soft: #fdeceb;
  --chart-1: #1a1714;
  --chart-2: #e2c65a;
  --chart-3: #86b6e3;
  --chart-highlight: #e4553e;
  --shadow-pop: 0 4px 12px -2px #14121014, 0 2px 4px -2px #1412100f;
  --shadow-modal: 0 20px 48px -12px #1412102e, 0 4px 8px -4px #14121014;
  --focus-ring: 0 0 0 2px #ffffff, 0 0 0 4px #1a1714;
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
  --font-display: "DM Serif Display", "Iowan Old Style", Georgia, serif;
  --font-ui: "DM Sans", "Segoe UI", system-ui, sans-serif;
  --font-mono: "DM Mono", ui-monospace, Menlo, monospace;
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
/* Platform UI never animates: wrap the app in .pp-app */
.pp-app, .pp-app * { transition: none !important; animation: none !important; }
@media (max-width: 760px) { .web-display { font-size: 48px; line-height: 50px; } .web-h1 { font-size: 36px; line-height: 40px; } .web-h2 { font-size: 30px; line-height: 34px; } }
```

## components.css

```css
/* Paper Cut · components.css — reference styles for every component (.pp-* platform, shared by the website). Requires tokens.css. */
@import url("https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&family=DM+Mono:wght@400;500&display=swap");
/* Paper Cut components. .pp-* = platform UI (no motion). .ppw-* = website (motion allowed). */
body { margin: 0; font-family: var(--font-ui); font-size: 14px; line-height: 20px; color: var(--ink); background: var(--parchment); -webkit-font-smoothing: antialiased; }
.pp-pad { padding: var(--space-5); }
.pp-row { display: flex; flex-wrap: wrap; align-items: center; gap: var(--space-3); }
.pp-col { display: grid; gap: var(--space-4); }
.pp-grid { display: grid; gap: var(--space-4); grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); }
.pp-meta { font-family: var(--font-mono); font-size: 11px; line-height: 16px; color: var(--cocoa); }
.pp-eyebrow { display: inline-flex; align-items: center; gap: var(--space-2); font-family: var(--font-mono); font-size: 11px; line-height: 16px; color: var(--cocoa); }
.pp-num { font-variant-numeric: tabular-nums; }
.pp-app, .pp-app * { transition: none !important; animation: none !important; }
:where(.pp-btn, .pp-input, .pp-select, .pp-textarea, .pp-tab, .pp-seg button, .pp-nav a, .pp-check input, .pp-toggle input):focus-visible { outline: 2px solid transparent; box-shadow: var(--focus-ring); }


/* Buttons */
.pp-btn { font: inherit; font-size: 13px; line-height: 18px; font-weight: 500; height: var(--control-md); padding: 0 var(--space-3); display: inline-flex; align-items: center; justify-content: center; gap: 6px; border-radius: var(--radius-sm); border: 1px solid transparent; cursor: pointer; white-space: nowrap; text-decoration: none; background: transparent; color: var(--ink); }
.pp-btn svg { width: var(--icon-md); height: var(--icon-md); }
.pp-btn-sm { height: var(--control-sm); padding: 0 10px; font-size: 12px; }
.pp-btn-lg { height: var(--control-lg); padding: 0 var(--space-4); font-size: 14px; }
.pp-btn-primary { background: var(--charcoal); color: var(--on-charcoal); }
.pp-btn-primary:hover { background: var(--charcoal-hover); }
.pp-btn-secondary { background: var(--white); border-color: var(--rule-strong); }
.pp-btn-secondary:hover { background: var(--flour); }
.pp-btn-ghost { color: var(--ink-secondary); }
.pp-btn-ghost:hover { background: var(--flour); color: var(--ink); }
.pp-btn-danger { background: var(--danger); color: #ffffff; }
.pp-btn[disabled] { opacity: var(--opacity-disabled); cursor: not-allowed; }
.pp-icon { fill: none; stroke: currentColor; stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; width: var(--icon-md); height: var(--icon-md); flex: none; }

/* Fields */
.pp-field { display: grid; gap: 6px; min-width: 0; }
.pp-label { font-size: 13px; line-height: 18px; font-weight: 500; color: var(--ink-secondary); }
.pp-input, .pp-select, .pp-textarea { font: inherit; font-size: 14px; width: 100%; box-sizing: border-box; height: var(--control-md); padding: 0 var(--space-3); border-radius: var(--radius-sm); border: 1px solid var(--rule-strong); background: var(--white); color: var(--ink); }
.pp-textarea { height: 88px; padding-block: 8px; resize: vertical; }
.pp-select { appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='none' stroke='%236a6057' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m4 6 4 4 4-4'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 10px center; padding-right: 34px; }
.pp-input::placeholder, .pp-textarea::placeholder { color: var(--placeholder); }
.pp-input:focus, .pp-select:focus, .pp-textarea:focus, .pp-input.is-focus { outline: none; border-color: var(--charcoal); box-shadow: var(--focus-ring); }
.pp-input.is-error { border-color: var(--danger); }
.pp-help { margin: 0; font-size: 12px; line-height: 16px; color: var(--cocoa); }
.pp-help.is-error { color: var(--danger); }
.pp-check { display: inline-flex; align-items: center; gap: 10px; font-size: 14px; color: var(--ink-secondary); cursor: pointer; }
.pp-check input { appearance: none; margin: 0; width: 16px; height: 16px; border: 1px solid var(--rule-strong); border-radius: var(--radius-xs); background: var(--white); display: grid; place-items: center; cursor: pointer; }
.pp-check input:checked { background: var(--charcoal); border-color: var(--charcoal); }
.pp-check input:checked::after { content: ""; width: 4px; height: 8px; border: solid #ffffff; border-width: 0 2px 2px 0; transform: translateY(-1px) rotate(45deg); }
.pp-check input[type="radio"] { border-radius: 50%; }
.pp-check input[type="radio"]:checked { background: var(--white); border-color: var(--charcoal); }
.pp-check input[type="radio"]:checked::after { width: 8px; height: 8px; border: 0; border-radius: 50%; background: var(--charcoal); transform: none; }
.pp-toggle { display: inline-flex; align-items: center; gap: 10px; font-size: 14px; color: var(--ink-secondary); cursor: pointer; }
.pp-toggle input { appearance: none; margin: 0; width: 32px; height: 18px; border-radius: var(--radius-full); background: var(--rule-strong); position: relative; cursor: pointer; }
.pp-toggle input::after { content: ""; position: absolute; top: 2px; left: 2px; width: 14px; height: 14px; border-radius: 50%; background: #ffffff; }
.pp-toggle input:checked { background: var(--charcoal); }
.pp-toggle input:checked::after { left: 16px; }

/* Badges */
.pp-badge { display: inline-flex; align-items: center; gap: 6px; height: 22px; padding: 0 var(--space-2); border-radius: var(--radius-xs); font-size: 12px; line-height: 16px; font-weight: 500; background: var(--flour); color: var(--cocoa); white-space: nowrap; }
.pp-badge.dot::before { content: ""; width: 6px; height: 6px; background: currentColor; }
.pp-badge-done { background: var(--success-soft); color: var(--success); }
.pp-badge-live { background: var(--tomato-soft); color: var(--tomato-text); }
.pp-badge-warn { background: var(--warning-soft); color: var(--warning); }
.pp-badge-fail { background: var(--danger-soft); color: var(--danger); }
.pp-badge-mono { font-family: var(--font-mono); font-size: 11px; font-weight: 400; background: var(--white); border: 1px solid var(--rule); color: var(--ink-secondary); }

/* Tabs and segmented */
.pp-tabs { display: flex; gap: var(--space-5); border-bottom: 1px solid var(--rule); }
.pp-tab { font: inherit; background: none; border: 0; padding: 0; height: 36px; font-family: var(--font-mono); font-size: 11px; color: var(--cocoa); border-bottom: 2px solid transparent; margin-bottom: -1px; cursor: pointer; }
.pp-tab:hover { color: var(--ink); }
.pp-tab[aria-selected="true"] { color: var(--ink); border-bottom-color: var(--ink); }
.pp-seg { display: inline-flex; gap: 2px; padding: 3px; background: var(--flour); border-radius: var(--radius-sm); }
.pp-seg button { font: inherit; font-size: 13px; font-weight: 500; border: 1px solid transparent; background: none; color: var(--cocoa); height: 28px; padding: 0 12px; border-radius: 4px; cursor: pointer; }
.pp-seg button[aria-pressed="true"] { background: var(--white); color: var(--ink); border-color: var(--rule); }

/* Cards and KPIs */
.pp-card { background: var(--white); border: 1px solid var(--rule); border-radius: var(--radius-md); padding: var(--space-5); min-width: 0; }
.pp-card-head { display: flex; justify-content: space-between; align-items: center; gap: var(--space-3); margin-bottom: var(--space-4); }
.pp-card-title { margin: 0; font-size: 16px; line-height: 24px; font-weight: 600; letter-spacing: -.01em; }
.pp-kpi-value { font-family: var(--font-display); font-size: 36px; line-height: 40px; font-weight: 400; letter-spacing: -0.01em; font-variant-numeric: tabular-nums; margin-top: var(--space-2); }
.pp-delta { font-size: 12px; line-height: 16px; font-weight: 500; color: var(--success); margin-top: var(--space-1); }
.pp-delta.warn { color: var(--warning); } .pp-delta.down { color: var(--danger); }

/* Table */
.pp-table-wrap { background: var(--white); border: 1px solid var(--rule); border-radius: var(--radius-md); overflow-x: auto; }
.pp-table { width: 100%; border-collapse: collapse; font-size: 14px; }
.pp-table th { height: 36px; padding: 0 var(--space-3); text-align: left; background: var(--flour); border-bottom: 1px solid var(--rule); font-family: var(--font-mono); font-size: 11px; font-weight: 400; color: var(--cocoa); white-space: nowrap; }
.pp-table td { height: var(--row-height); padding: 0 var(--space-3); border-bottom: 1px solid var(--rule); color: var(--ink-secondary); white-space: nowrap; }
.pp-table tbody tr:last-child td { border-bottom: 0; }
.pp-table tbody tr { cursor: pointer; }
.pp-table tbody tr:hover td { background: var(--parchment); }
.pp-table tbody tr[aria-selected="true"] td { background: var(--charcoal-soft); }
.pp-table tbody tr[aria-selected="true"] td:first-child { box-shadow: inset 2px 0 0 var(--charcoal); }
.pp-table .r { text-align: right; font-variant-numeric: tabular-nums; }
.pp-table .strong { color: var(--ink); font-weight: 500; }
.pp-table .id { font-family: var(--font-mono); font-size: 11px; color: var(--cocoa); }
.pp-table-foot { display: flex; justify-content: space-between; gap: var(--space-3); padding: 10px var(--space-3); border-top: 1px solid var(--rule); font-size: 12px; color: var(--cocoa); }

/* App shell */
.pp-app { display: grid; grid-template-columns: var(--sidebar-width) minmax(0, 1fr); min-height: 640px; background: var(--white); font-size: 14px; }
.pp-side { background: var(--parchment); border-right: 1px solid var(--rule); padding: var(--space-4) 10px; display: flex; flex-direction: column; gap: var(--space-5); }
.pp-brand { display: flex; align-items: center; gap: var(--space-2); padding: 0 6px; font-family: var(--font-display); font-size: 20px; line-height: 24px; color: var(--ink); }
.pp-nav { display: grid; gap: 2px; }
.pp-nav .pp-meta { padding: 0 8px 6px; }
.pp-nav a { display: flex; align-items: center; gap: 10px; height: 30px; padding: 0 8px; border-radius: var(--radius-sm); font-size: 13px; font-weight: 500; color: var(--ink-secondary); text-decoration: none; cursor: pointer; }
.pp-nav a .pp-icon { color: var(--cocoa); }
.pp-nav a:hover { background: var(--white); color: var(--ink); }
.pp-nav a[aria-current="page"] { background: var(--charcoal-soft); color: var(--charcoal-text); }
.pp-nav a[aria-current="page"] .pp-icon { color: var(--charcoal-text); }
.pp-nav .count { margin-left: auto; font-family: var(--font-mono); font-size: 10px; color: var(--cocoa); }
.pp-main { min-width: 0; display: flex; flex-direction: column; }
.pp-top { height: var(--topbar-height); border-bottom: 1px solid var(--rule); display: flex; align-items: center; gap: var(--space-3); padding: 0 var(--space-6); }
.pp-top .pp-input { max-width: 320px; }
.pp-top .right { margin-left: auto; display: flex; gap: var(--space-2); align-items: center; }
.pp-avatar { width: 30px; height: 30px; border-radius: 50%; background: var(--parchment); border: 1px solid var(--rule); display: grid; place-items: center; font-size: 11px; font-weight: 600; color: var(--ink-secondary); }
.pp-page { padding: var(--space-6); display: grid; gap: var(--space-6); max-width: var(--content-max); }
.pp-page-head { display: flex; justify-content: space-between; align-items: flex-end; gap: var(--space-4); flex-wrap: wrap; }
.pp-page-title { margin: 2px 0 0; font-family: var(--font-display); font-size: 32px; line-height: 36px; font-weight: 400; letter-spacing: -0.01em; }
.pp-page-sub { margin: var(--space-1) 0 0; color: var(--cocoa); }

/* Modal, toast, banner, empty */
.pp-backdrop { background: rgba(20, 18, 16, .2); padding: var(--space-6); display: grid; place-items: center; }
.pp-modal { width: 100%; max-width: 440px; background: var(--white); border: 1px solid var(--rule); border-radius: var(--radius-lg); box-shadow: var(--shadow-modal); }
.pp-modal-head { display: flex; justify-content: space-between; gap: var(--space-3); padding: var(--space-5) var(--space-5) 0; }
.pp-modal-title { margin: 0; font-family: var(--font-display); font-size: 24px; line-height: 30px; font-weight: 400; }
.pp-modal-body { padding: var(--space-5); display: grid; gap: var(--space-4); }
.pp-modal-foot { display: flex; justify-content: flex-end; gap: var(--space-2); padding: var(--space-4) var(--space-5); border-top: 1px solid var(--rule); }
.pp-toast { display: inline-flex; align-items: center; gap: var(--space-3); padding: 12px var(--space-4); background: var(--white); border: 1px solid var(--rule); border-radius: var(--radius-lg); box-shadow: var(--shadow-pop); font-weight: 500; }
.pp-toast .pp-icon { color: var(--charcoal); }
.pp-banner { display: flex; align-items: center; gap: var(--space-3); padding: 12px var(--space-4); border-radius: var(--radius-md); font-size: 14px; }
.pp-banner .grow { flex: 1; }
.pp-banner-warn { background: var(--warning-soft); color: var(--warning); }
.pp-banner-fail { background: var(--danger-soft); color: var(--danger); }
.pp-banner-info { background: var(--charcoal-soft); color: var(--charcoal-text); }
.pp-empty { position: relative; overflow: hidden; text-align: center; padding: var(--space-12) var(--space-6); background: var(--white); border: 1px solid var(--rule); border-radius: var(--radius-md); }
.pp-empty > * { position: relative; }
.pp-empty .pp-icon { width: 20px; height: 20px; color: var(--cocoa); }
.pp-empty h3 { margin: var(--space-3) 0 var(--space-1); font-size: 16px; line-height: 24px; font-weight: 600; }
.pp-empty p { margin: 0 auto var(--space-4); max-width: 40ch; color: var(--cocoa); }
.pp-skel { background: var(--flour); border-radius: 4px; height: 12px; }

/* Signature details */
.pp-mark { display: inline-block; width: 12px; height: 12px; border-radius: 3px; background: var(--butter); border: 2px solid var(--butter-edge); transform: rotate(-4deg); flex: none; }
.pp-eyebrow::before { content: ""; width: 8px; height: 8px; border-radius: 50%; background: var(--tomato); }
.pp-accent { font-family: var(--font-display); font-style: italic; }
.pp-empty::before { content: none; }
/* Sticky notes, pins, torn edge (signature) */
.pp-note { border-radius: var(--radius-md); border: 2px solid var(--butter-edge); background: var(--butter); padding: var(--space-4); box-shadow: 0 1px 0 rgba(0,0,0,.04); color: var(--ink); }
.pp-note.mint { background: var(--mint); border-color: var(--mint-edge); } .pp-note.rose { background: var(--rose); border-color: var(--rose-edge); } .pp-note.sky { background: var(--sky); border-color: var(--sky-edge); }
.pp-pin { width: 8px; height: 8px; border-radius: 50%; background: var(--tomato); }
.ppw-torn { -webkit-mask: conic-gradient(from -45deg at bottom, #0000, #000 1deg 89deg, #0000 90deg) 50% / 22px 100%; mask: conic-gradient(from -45deg at bottom, #0000, #000 1deg 89deg, #0000 90deg) 50% / 22px 100%; }
```

## motion.css (website only)

```css
/* Paper Cut · motion.css — WEBSITE ONLY. Never load inside the platform UI. Requires tokens.css. */
/* ---------------- Website ---------------- */
.fw { font-size: 17px; line-height: 28px; background: var(--parchment); }
.ppw-wrap { max-width: var(--site-max); margin: 0 auto; padding: 0 var(--space-6); }
.ppw-nav { display: flex; align-items: center; justify-content: space-between; height: 72px; }
.ppw-logo { display: flex; align-items: center; gap: var(--space-2); font-family: var(--font-display); font-size: 22px; line-height: 28px; color: var(--ink); text-decoration: none; }
.ppw-links { display: flex; align-items: center; gap: var(--space-6); font-size: 14px; font-weight: 500; color: var(--cocoa); }
.ppw-links a { color: inherit; text-decoration: none; transition: color 150ms ease-out; }
.ppw-links a:hover { color: var(--ink); }
.ppw-links a[aria-current="page"] { color: var(--ink); text-decoration: underline; text-underline-offset: 6px; text-decoration-thickness: 1px; }
.fw .pp-btn { transition: background-color 150ms ease-out; }
.fw .pp-btn .arr { display: inline-block; transition: transform 150ms ease-out; }
.fw .pp-btn:hover .arr, .ppw-card:hover .arr { transform: translateX(3px); }
.ppw-display { margin: 0; font-family: var(--font-display); font-weight: 400; font-size: 88px; line-height: 84px; letter-spacing: -0.01em; max-width: 13ch; color: var(--ink); }
.ppw-display .w { display: inline-block; }
.ppw-lead { margin: var(--space-5) 0 var(--space-8); max-width: 44ch; font-size: 19px; line-height: 30px; color: var(--cocoa); }
.ppw-cta { display: flex; gap: var(--space-3); flex-wrap: wrap; }
.ppw-sec-head { display: flex; justify-content: space-between; align-items: flex-end; gap: var(--space-4); flex-wrap: wrap; margin-bottom: var(--space-8); }
.ppw-h1 { margin: var(--space-3) 0 0; font-family: var(--font-display); font-weight: 400; font-size: 56px; line-height: 58px; letter-spacing: -0.01em; }
.ppw-h2 { margin: 0; font-family: var(--font-display); font-weight: 400; font-size: 40px; line-height: 44px; letter-spacing: -0.01em; }
.ppw-cards { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: var(--space-6); }
.ppw-card { display: flex; flex-direction: column; gap: var(--space-2); padding: var(--space-6); background: var(--white); border: 1px solid var(--rule); border-radius: var(--radius-md); text-decoration: none; color: var(--ink); min-width: 0; }
.ppw-shot { aspect-ratio: 16/10; border-radius: var(--radius-sm); background: var(--parchment); border: 1px solid var(--rule); margin-bottom: var(--space-3); padding: 12px; display: grid; gap: 8px; align-content: start; }
.ppw-shot span { height: 8px; border-radius: 4px; background: var(--flour); }
.ppw-card h3 { margin: 0; font-size: 20px; line-height: 28px; font-weight: 600; letter-spacing: -.01em; display: flex; justify-content: space-between; transition: color 150ms ease-out; }
.ppw-card:hover h3 { color: var(--charcoal); }
.ppw-card p { margin: 0; font-size: 15px; line-height: 24px; color: var(--cocoa); }
.ppw-card .tags { display: flex; gap: var(--space-2); flex-wrap: wrap; margin-top: var(--space-3); }
.ppw-notes { display: grid; }
.ppw-note { display: grid; grid-template-columns: 120px minmax(0, 1fr); gap: var(--space-4); padding: var(--space-5) 0; border-bottom: 1px solid var(--rule); text-decoration: none; color: var(--ink); }
.ppw-note b { display: block; font-family: var(--font-display); font-weight: 400; font-size: 24px; line-height: 30px; transition: color 150ms ease-out; }
.ppw-note:hover b { color: var(--charcoal); }
.ppw-note span { color: var(--cocoa); font-size: 15px; }
@media (max-width: 760px) {
  .ppw-display { font-size: 48px; line-height: 48px; } .ppw-h1 { font-size: 36px; line-height: 40px; } .ppw-h2 { font-size: 30px; line-height: 34px; }
  .ppw-cards { grid-template-columns: 1fr; } .ppw-links { display: none; } .ppw-hero { padding: var(--space-5) var(--space-5) var(--space-10); }
  .ppw-note { grid-template-columns: 1fr; gap: var(--space-1); }
  .pp-app { grid-template-columns: 1fr; } .pp-side { display: none; }
}

/* Accent word */
.ppw-display em, .ppw-h1 em, .ppw-h2 em { font-style: italic; }

/* Hero (signature) */
.ppw-hero { text-align: center; padding: var(--space-24) 0 var(--space-12); }
.ppw-collage { position: relative; max-width: 880px; margin: var(--space-12) auto 0; }
.ppw-collage .pp-note { position: absolute; width: 160px; transform: rotate(var(--r, -2deg)); }

@media (prefers-reduced-motion: no-preference) {
  .ppw-play .ppw-collage .pp-note { animation: ppw-drop 700ms cubic-bezier(.3, 1.4, .5, 1) both; animation-delay: calc(150ms + var(--i) * 90ms); }
  @keyframes ppw-drop { from { opacity: 0; transform: translateY(-40px) rotate(calc(var(--r, -2deg) * 4)); } to { opacity: 1; transform: rotate(var(--r, -2deg)); } }
  .ppw-play .ppw-display .w { animation: ppw-rise 600ms var(--ease-reveal) both; animation-delay: calc(200ms + var(--i) * var(--stagger)); }
  @keyframes ppw-rise { from { opacity: 0; transform: translateY(.3em); } to { opacity: 1; transform: none; } }
  .ppw-play .pp-pin { animation: ppw-pin 200ms ease-out 900ms both; }
  @keyframes ppw-pin { from { transform: scale(0); } to { transform: none; } }
  .ppw-fade.ppw-in { animation: ppw-up var(--duration-reveal) var(--ease-reveal) both; }
  @keyframes ppw-up { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }
}

/* Usage
   1. Hero markup: <header class="ppw-hero"><h1 class="ppw-display">Ideas, built <em>carefully</em>.</h1>…<div class="ppw-collage"><div class="pp-note" style="--r:-3deg;--i:0">…</div>…</div></header>
   2. Split the headline into <span class="w" style="--i:N"> words (or lines), then add .ppw-play to the hero once it is in view.
   3. Section titles: add .ppw-fade; add .ppw-in when they first enter the viewport.
   Everything is visible before and without the script; prefers-reduced-motion turns all of it off. */
```

## tailwind-theme.css (only if the project uses Tailwind v4)

```css
@import "tailwindcss";
/* Paper Cut · Tailwind v4 theme. Load tokens.css first. Light only. */
@theme inline {
  --color-parchment: var(--parchment);
  --color-white: var(--white);
  --color-flour: var(--flour);
  --color-rule: var(--rule);
  --color-rule-strong: var(--rule-strong);
  --color-ink: var(--ink);
  --color-ink-secondary: var(--ink-secondary);
  --color-cocoa: var(--cocoa);
  --color-placeholder: var(--placeholder);
  --color-charcoal: var(--charcoal);
  --color-charcoal-hover: var(--charcoal-hover);
  --color-charcoal-soft: var(--charcoal-soft);
  --color-charcoal-text: var(--charcoal-text);
  --color-on-charcoal: var(--on-charcoal);
  --color-tomato: var(--tomato);
  --color-tomato-soft: var(--tomato-soft);
  --color-tomato-text: var(--tomato-text);
  --color-butter: var(--butter);
  --color-butter-edge: var(--butter-edge);
  --color-mint: var(--mint);
  --color-mint-edge: var(--mint-edge);
  --color-rose: var(--rose);
  --color-rose-edge: var(--rose-edge);
  --color-sky: var(--sky);
  --color-sky-edge: var(--sky-edge);
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

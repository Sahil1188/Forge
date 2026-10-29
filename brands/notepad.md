# NOTEPAD.md · Sahil Shaikh brand (all-in-one)

**For Claude Code:** this single file contains the whole Notepad system: brand rules, platform UI rules (no animation), website rules (with motion), and the complete CSS. Put it in the project root and add this line to `CLAUDE.md`:

```
All UI follows NOTEPAD.md. Before writing UI, create tokens.css, components.css (and motion.css for website pages) from Part 4 if they don't exist, then use only their variables and classes. Light only, never dark. Platform UI has no animation.
```

## How Claude Code should use this file

1. Decide the surface: **Platform UI** (app, dashboard, admin, settings) or **Website** (marketing, portfolio, landing). If unclear, assume Platform UI.
2. If `tokens.css` and `components.css` don't exist in the project, create them by copying the code blocks in Part 4 exactly. For website pages also create `motion.css`. With Tailwind v4 also create `tailwind-theme.css`.
3. Load the Google Fonts in Part 1, section 5.
4. Never hard-code colours, font sizes or fonts. Never add dark mode or dark sections.
5. Platform UI: wrap the app in `class="np-app"` (kills all motion). Website: follow Part 3, section 4.
6. Finish by running the checklist at the end of Part 2 or Part 3.

---

Sahil Shaikh's brand and design system, **Notepad**. Part 1 is the brand foundations, Part 2 the platform UI rules (no animation), Part 3 the website rules (with motion), Part 4 the code.

*Researched from: Notion, Notion's hand-drawn illustrations, Arc's onboarding. Inspired by, not copied from: no logos, fonts or assets of those products are used.*

---

# Part 1 · Brand foundations

The brand of Sahil Shaikh, Full Stack AI Engineer. **Notepad**: a clean notepad with a yellow highlighter and a blue pen: bold notes, a few doodles. It covers every platform Sahil designs and his website.

This system has three parts:

1. **Brand foundations** (Part 1): idea, logo, colour, type, layout, shape, icons, imagery, voice and accessibility.
2. **Platform UI** (Part 2): rules for any app, dashboard or tool. **No animation.**
3. **Website** (Part 3): the same brand with larger type and a defined motion system.

Light only. There is no dark theme, and no dark sections, panels or backgrounds anywhere.

---

## 1. The idea

| | |
|---|---|
| **Metaphor** | A clean notepad with a yellow highlighter and a blue pen: bold notes, a few doodles. |
| **Personality** | Clever, warm, approachable. Smart but never stiff. |
| **Feeling we want** | "I get it instantly, and it made me smile." |
| **Three ingredients** | **Bold notes** (tight Albert Sans 700 headlines) · **Highlighter** (one yellow-highlighted word) · **Doodles** (simple hand-drawn line marks) |

## 2. Principles

1. **Page white, scratch fills.** Pages are white; soft `scratch` fills group things.
2. **Big, tight headlines.** Albert Sans 700 at -0.04em; short sentences that fit on two lines.
3. **One highlight per headline.** A yellow highlighter pill behind one word, with a small dot.
4. **Blue pen to act.** `blueink` for actions and links; nothing else is saturated.
5. **Doodles, sparingly.** One hand-drawn line or face per page section, in `ink` 1.5px.
6. **Product still; the website highlights once.** The highlighter swipes behind its word, then rests.
7. **Accessible always.** Text 4.5:1 or better, borders and indicators 3:1, focus always visible.

## 3. Logo

- **Wordmark:** "Sahil" in Albert Sans 700, `ink`, with the final "l" followed by a yellow highlighter dot.
- **Product mark:** a 16px rounded square with a doodled "S" + product name in Albert Sans 700.
- **App icon / avatar:** a white square, 8px radius, 1.5px `ink` border (hand-drawn wobble allowed), doodled "S".
- **Clear space:** the height of the S. **Minimum size:** wordmark 64px; icon 20px.
- **Never:** fill the icon with colour, use more than one highlight, put it on a dark ground.

## 4. Colour

### Core palette

| Token | Hex | Role |
|---|---|---|
| `page` | #FFFFFF | Page ground (white) |
| `white` | #FFFFFF | Cards, tables, inputs, modals |
| `scratch` | #F6F5F2 | Sidebar, callouts, table headers, hover |
| `rule` | #ECEAE5 | Dividers and borders |
| `rule-strong` | #8E8B83 | Input borders, strong dividers |
| `ink` | #191817 | Headings, primary text |
| `ink-secondary` | #37352F | Labels, nav, table text |
| `pencil` | #6B6963 | Secondary text, placeholders in prose |
| `placeholder` | #6E6C66 | Placeholders, disabled text |
| `blueink` | #0B63C7 | Primary action, links, focus |
| `blueink-hover` | #0A54A8 | Hover/pressed blueink |
| `blueink-soft` / `blueink-text` | #E7F0FB / #0A4F9F | Selected, active, success |
| `highlighter` | #FFD84D | The highlighter: one word, the logo dot, "new" items |
| `highlighter-soft` / `highlighter-text` | #FFF6D6 / #7A5B00 | Soft highlighter badges |
| `warning` / `warning-soft` | #8A5A00 / #FFF4DC | Needs attention |
| `danger` / `danger-soft` | #B42318 / #FDECEB | Errors, destructive |

### Charts

`chart-1` blueink #0B63C7, `chart-2` #7DB1EA, `chart-3` #D3D1CB, and `chart-highlight` highlighter #FFD84D for the one value that matters. Gridlines use `rule`, axis labels use `ui-meta` in `pencil`.

### Proportions

About 70% white, 18% scratch, 8% type and lines, 3% blue, 1% highlighter.

### Rules

- Blueink is the only colour on buttons and links. One filled blue button per view.
- Highlighter yellow is only a background behind dark text: one word, a "New" pill, the logo dot.
- Status always has a word.
- No gradients.
- Never use `ink` as a background.

## 5. Typography

Three roles, all free on Google Fonts:

`https://fonts.googleapis.com/css2?family=Albert+Sans:wght@400;500;600;700&family=Source+Code+Pro:wght@400;500&display=swap`

| Family | Role | Use | Weights |
|---|---|---|---|
| **Albert Sans** | **The voice** | Page titles, numbers, website headlines (700, tight) | 700 |
| **Albert Sans** | **The clarity** | All UI and body text | 400, 500, 600 |
| **Source Code Pro** | **The precision** | IDs, shortcuts, code | 400, 500 |

- **Highlight word:** one word per headline sits in a `highlighter` pill with a 6px `ink` dot before it.
- Headlines max two lines on desktop; break by meaning, not width.
- Body 15px in the product (Notion-like density), 18px on the website.
- Sentence case. No ALL CAPS.
- Full scales are in Part 2 (platform) and Part 3 (website).

## 6. Layout and spacing

- **4px grid:** 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 96, 128.
- **Platform:** sidebar on `scratch`, content on `white`, 24px page padding, max 1200px.
- **Website:** 1120px max width, 96px between sections.
- Align to a left edge in the product. Centre only short single lines (an empty state).

## 7. Shape and depth

| Token | Value | Use |
|---|---|---|
| `radius-xs` | 4px | Badges, checkboxes |
| `radius-sm` | 6px | Buttons, inputs, nav |
| `radius-md` | 8px | Cards, tables, menus |
| `radius-lg` | 12px | Modals, website panels |
| `radius-full` | 9999px | Highlight pill, toggles |

- **Highlight pill** (signature): `highlighter` background, `radius-full`, padding 0 .3em, with a 6px dot.
- **Doodles** (signature): simple 1.5px `ink` line drawings (a face, an arrow, a scribble underline). One per section, never decorative noise.
- Callout blocks: `scratch` fill, `radius-md`, an emoji-free icon on the left.
- Shadows only for menus and modals.

## 8. Iconography

- Lucide, 1.75px stroke. 18px in the sidebar, 16px in controls. `pencil` default, `ink` active.
- Icon-only buttons always have an accessible label.

## 9. Imagery

- Screenshots on white with a 1px `rule`, `radius-lg`, sometimes with a doodled arrow pointing at the key part.
- Illustrations: black-line doodles only. No colour fills except one highlight.
- Portrait: friendly, natural, plain background.

## 10. Voice and writing

- Warm and clever: plain words, a light touch of humour in empty states.
- Lead with what something does: "Agents plan, build and review work together."
- Buttons are verbs: "New project", "Save changes". Confirmations say what happened: "Project created."
- Errors say what went wrong and how to fix it: "Name is required. Add a project name to continue."
- Numbers: "AED 1,250.00", dates "21 Oct 2026", times "14:32".
- No buzzwords, no exclamation marks, no emoji in UI.

## 11. Accessibility

- Every text colour pair passes WCAG AA (4.5:1). Borders, focus rings and indicators pass 3:1.
- Focus ring: 2px white gap + 2px `blueink`, on every interactive element.
- Never rely on colour alone; pair it with a word, icon or position.
- Hit targets at least 28px (34px default).
- The website respects `prefers-reduced-motion`: all motion off, content visible immediately.

Measured contrast for this palette:

| Pair | Ratio | Needed |
|---|---|---|
| Body text `ink` on `white` | 17.73:1 | 4.5:1 |
| `pencil` on `page` | 5.49:1 | 4.5:1 |
| `pencil` on `scratch` | 5.03:1 | 4.5:1 |
| White on `blueink` (primary button) | 5.8:1 | 4.5:1 |
| `blueink` links on `white` | 5.8:1 | 4.5:1 |
| `blueink-text` on `blueink-soft` | 6.94:1 | 4.5:1 |
| `highlighter-text` on `highlighter-soft` | 5.84:1 | 4.5:1 |
| `placeholder` on `white` | 5.25:1 | 4.5:1 |
| `rule-strong` borders on `white` | 3.4:1 | 3:1 |
| `ink` on `highlighter` (mark used as a fill) | 12.82:1 | 4.5:1 |

## 12. Do and don't

| Do | Don't |
|---|---|
| White pages, scratch fills | Dark backgrounds or dark mode |
| One highlighted word | Several highlights |
| Tight, bold headlines | Light or condensed headlines |
| Blue for actions | Blue for decoration |
| One doodle per section | Doodles everywhere |
| Callouts for tips | Coloured boxes for content |
| Highlighter behind dark text | Yellow text |
| Highlight swipe on the website | Animation in the platform |


---

# Part 2 · Platform UI guideline

Rules for any platform, app, dashboard, admin or internal tool built in the Notepad brand. It is generic: it works for projects, CRM, analytics, payments, AI agents or anything else.

**The platform never animates.** State changes are instant. Every rule here assumes light only.

---

## 1. Foundations for the platform

- **Ground:** `scratch` for the app canvas and sidebar. `white` for every working panel (cards, tables, forms, modals).
- **Text:** `ink` for headings and values, `ink-secondary` for labels and nav, `pencil` for help text and metadata.
- **Action colour:** `blueink`. **Mark:** `highlighter` (small).
- **Density:** 14px text, 34px controls, 44px rows, 4px grid.

## 2. Type scale

| Style | Size / line | Weight | Family | Use |
|---|---|---|---|---|
| `ui-page-title` | 32 / 36 | 700 | Albert Sans | Page title, one per screen |
| `ui-numeric` | 36 / 40 | 700 | Albert Sans | KPI values, big totals |
| `ui-heading` | 16 / 24 | 600 | Albert Sans | Card, section, modal headings |
| `ui-subheading` | 14 / 20 | 600 | Albert Sans | Form group titles |
| `ui-body` | **14 / 20** | 400 | Albert Sans | **Default text** |
| `ui-body-lg` | 16 / 24 | 400 | Albert Sans | Empty states, onboarding |
| `ui-label` | 13 / 18 | 500 | Albert Sans | Labels, nav items, buttons |
| `ui-small` | 12 / 16 | 400 | Albert Sans | Help text, captions |
| `ui-meta` | 11 / 16 | 400 | Source Code Pro | IDs, timestamps, column headers |

Rules:

- Albert Sans only for `ui-page-title`, `ui-numeric` and modal titles. Never in buttons, tables, forms, nav or badges.
- Numbers in tables use `font-variant-numeric: tabular-nums` and align right.
- Never below 11px (mono) or 12px (UI).

## 3. App layout

- **Sidebar:** 232px (60px collapsed), `scratch`, 1px `rule` right border, 16px top padding. Product mark at top. Groups titled with `ui-meta`.
- **Top bar:** 56px, `white`, 1px `rule` bottom border. Search left (320px max), actions right.
- **Page header:** breadcrumb in `ui-meta`, then `ui-page-title`, optional one-line description in `pencil`. Actions on the right, aligned to the title's baseline.
- **Content:** 24px padding, max width 1200px, 24px gap between blocks, 32px between page sections.
- **Breakpoints:** 640, 768, 1024, 1280. Below 1024 the sidebar becomes a drawer.

## 4. Components

### Buttons

| Variant | Look | Use |
|---|---|---|
| Primary | `blueink` fill, `on-blueink` text | The one main action per view |
| Secondary | `white` fill, 1px `rule-strong` border, `ink` text | Every other action |
| Ghost | No fill or border, `ink-secondary` text | Toolbars, cancel, low emphasis |
| Danger | `danger` fill, white text | Destructive confirmations only |

- Sizes: 28px (sm), **34px (default)**, 40px (lg). `radius-sm`. `ui-label` 13/500.
- States: hover = instant background change (`blueink-hover`, `scratch`); focus = `focus-ring`; disabled = `opacity-disabled`.
- Labels are verbs in sentence case: "New project", "Export CSV".

### Text inputs, selects, textareas

- 34px tall, 12px horizontal padding, `radius-sm`, `white` fill, 1px `rule-strong` border, `placeholder` colour for placeholders.
- Label above (`ui-label`, `ink-secondary`), help or error below (`ui-small`), 6px gaps.
- Focus: `blueink` border + `focus-ring`. Error: `danger` border and a message saying how to fix it.

### Checkbox, radio, toggle

- Checkbox 16px, `radius-xs`; checked = `blueink` fill with white tick. Radio: 8px `blueink` dot. Toggle 32 × 18px; on = `blueink`.
- The label is always clickable and sits 10px to the right.

### Badges

- 22px tall, 8px padding, `radius-xs`, 12/500.
- Done (`blueink-soft`/`blueink-text`), Live or new (`highlighter-soft`/`highlighter-text`), Needs review (`warning-soft`/`warning`), Failed (`danger-soft`/`danger`), Draft (`scratch`/`pencil`).

### Tabs and segmented controls

- **Tabs:** Albert Sans 14/500, 36px tall. Active = `ink` + 2px `ink` underline.
- **Segmented control:** `scratch` track, 3px padding; active segment = `white` with 1px `rule`.

### Tables

- `white` panel, 1px `rule`, `radius-md`, horizontal scroll on narrow screens.
- Header 36px, `scratch`, `ui-meta` labels in `pencil`. Rows 44px, 1px `rule` between rows. Hover = `page`. Selected = `blueink-soft` with a 2px `blueink` left edge.
- IDs in `ui-meta`. Amounts right-aligned, tabular. Status as badges.

### Cards and KPIs

- `white`, 1px `rule`, `radius-md`, 20px padding, no shadow. KPI: `ui-meta` label, value in `ui-numeric`, delta in `ui-small`.
- Signature detail (Highlight pill) on one group per screen at most.

### Navigation

- Sidebar items: 30px, `radius-sm`, `ui-label`, 16px icon in `pencil`.
- Active: `scratch` background + `ink` text, 600 weight.
- Breadcrumbs in `ui-meta` separated by " / ".

### Modals and side sheets

- Widths 440 / 600 / 800px; `white`, `radius-lg`, `shadow-modal`. Backdrop `ink` at 20%.
- Title in Albert Sans 24/30; footer buttons right-aligned, primary last. Escape closes; focus returns to the trigger.

### Toasts, banners, empty, loading and error states

- Toast: bottom-right, `white`, `radius-lg`, `shadow-pop`, one line + optional "Undo". No animation.
- Empty: centred, 20px icon in `pencil`, `ui-heading`, one line of `ui-body`, one primary button.
- Loading: static `scratch` skeleton blocks + a `ui-meta` "loading…" label. No spinners or shimmer.
- Error: danger banner with what failed and a "Try again" button.

### Data visualisation

- `chart-1` main series, `chart-2` comparison, `chart-3` other, `chart-highlight` for one value. Gridlines `rule`, axis labels `ui-meta`. No animation, no 3D, no gradients.

## 5. Patterns

- **Forms:** one column, max 560px. Labels above fields. Actions bottom-right, primary last.
- **List to detail:** clicking a row opens a side sheet for quick edits.
- **Destructive actions:** confirm in a modal that names the thing, with a danger button.
- **Settings:** left sub-nav (200px) + one form card per section.

## 6. No-motion rules

- Everything inside `.np-app` has `transition: none; animation: none`.
- Hover, focus, open and close are instant. Progress is static text or a stepped bar.

## 7. Checklist for every screen

- [ ] `scratch` canvas, white panels, no dark areas
- [ ] One Albert Sans page title; all other text Albert Sans or mono
- [ ] One filled `blueink` button
- [ ] `highlighter` only as a small mark
- [ ] 14px body, 34px controls, 44px rows, 4px grid
- [ ] Lines, not shadows (shadows only on floating things)
- [ ] Focus visible on every control
- [ ] Status has a word, not just colour
- [ ] Nothing animates


---

# Part 3 · Website guideline

How the Notepad brand looks and moves on Sahil's website, landing pages and portfolio. Same palette and families as the platform, with bigger type, more air, and a defined motion system.

Light only: no dark bands, dark footers or dark cards.

---

## 1. Layout

- Max width 1120px, side padding 24px (16px on phones).
- 96px between sections (64px on phones); hero top spacing 128px (64px on phones).
- Text blocks max 60 characters wide.

## 2. Type scale

| Style | Size / line | Weight | Family | Use |
|---|---|---|---|---|
| `web-display` | 88 / 88 (48 / 50 on phones) | 700 | Albert Sans | Hero headline |
| `web-h1` | 56 / 60 (36 on phones) | 700 | Albert Sans | Section titles |
| `web-h2` | 40 / 46 (30 on phones) | 700 | Albert Sans | Sub-sections, contact |
| `web-h3` | 20 / 28 | 600 | Albert Sans | Card titles |
| `web-lead` | 19 / 30 | 400 | Albert Sans | Intro paragraphs |
| `web-body` | 17 / 28 | 400 | Albert Sans | Running text |
| `web-eyebrow` | 12 / 16 | 400 | Source Code Pro | Line above a headline |

- Accent: One word per headline in a highlighter pill with a dot.
- Eyebrow: Albert Sans 13/600 `pencil` in a `scratch` pill.

## 3. Page anatomy

### Navigation

- 64px, white, 1px `rule` on scroll. Left: wordmark. Centre: links Albert Sans 15/500 `pencil`. Right: ghost "Resume" and a blueink button.

### Hero

- White. Centred, very large headline (96px) with one highlighted pill word, a short lead, two buttons, and one doodle (a small face or arrow) beside the headline. A product screenshot below in a white frame.

### Section header

- Centred `web-h1` with an optional doodled underline, one-line description below.

### Work cards

- `scratch` cards, `radius-lg`, no border, 24px padding, a doodle icon, Albert Sans 20/700 title. Hover: background turns white with 1px `rule`.

### Notes / writing list

- Rows with the title in Albert Sans 20/600 and date in `pencil`. Hover: title gets a highlighter background.

### Contact

- Centred: big headline with a highlighted word, the email with Copy, a doodled arrow pointing at it.

### Footer

- White, 1px `rule`, links in columns, copyright in `pencil`.

## 4. Motion system

The website has **one orchestrated moment per page** (the hero) plus small responses to the user. Nothing else moves.

### Tokens

| Token | Value | Use |
|---|---|---|
| `duration-fast` | 150ms | Hover colour changes |
| `duration-base` | 220ms | Menus, accordions |
| `duration-reveal` | 700ms | Section fade-up |
| `duration-hero` | 900ms | Hero layers |
| `stagger` | 45ms | Delay between headline parts |
| Easing | `cubic-bezier(.2, .7, 0, 1)` | All reveals |

### The hero sequence (in order)

| Time | What happens | Spec |
|---|---|---|
| 0ms | Headline in | Each word: opacity 0 → 1, translateY .25em → 0, 550ms, 45ms apart |
| 600ms | Highlighter swipe | The yellow pill grows from 0 to full width behind its word, 450ms |
| 800ms | Dot drops | The ink dot scales 0 → 1, 250ms |
| 1000ms | Doodle draws | The doodle stroke draws in (stroke-dashoffset), 900ms |
| ~1900ms | Done | Text readable from the first frame |

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
<header class="npw-hero"><h1 class="npw-display">Where ideas become <em>working</em> software.</h1><svg class="npw-doodle">…</svg>…</header>
```

## 5. Checklist for every page

- [ ] Light only, no dark bands
- [ ] Headlines follow the accent rule (One word per headline in a highlighter pill with a dot)
- [ ] Eyebrow above key headlines
- [ ] Signature details only where Part 1 allows them
- [ ] One hero motion sequence; everything readable before it plays
- [ ] Hover responses at 150ms
- [ ] Reduced motion respected
- [ ] One primary button per section


---

# Part 4 · Code

Copy each block into its own file, exactly as written. Component classes use the `.np-` prefix (platform) and `.npw-` (website).

## tokens.css

```css
/* Notepad tokens · Sahil Shaikh. Light only: there is no dark theme. */
:root {
  color-scheme: light;
  --page: #ffffff;
  --white: #ffffff;
  --scratch: #f6f5f2;
  --rule: #eceae5;
  --rule-strong: #8e8b83;
  --ink: #191817;
  --ink-secondary: #37352f;
  --pencil: #6b6963;
  --placeholder: #6e6c66;
  --blueink: #0b63c7;
  --blueink-hover: #0a54a8;
  --blueink-soft: #e7f0fb;
  --blueink-text: #0a4f9f;
  --on-blueink: #ffffff;
  --highlighter: #ffd84d;
  --highlighter-soft: #fff6d6;
  --highlighter-text: #7a5b00;
  --success: var(--blueink-text);
  --success-soft: var(--blueink-soft);
  --warning: #8a5a00;
  --warning-soft: #fff4dc;
  --danger: #b42318;
  --danger-soft: #fdeceb;
  --chart-1: #0b63c7;
  --chart-2: #7db1ea;
  --chart-3: #d3d1cb;
  --chart-highlight: #ffd84d;
  --shadow-pop: 0 4px 12px -2px #19181714, 0 2px 4px -2px #1918170f;
  --shadow-modal: 0 20px 48px -12px #1918172e, 0 4px 8px -4px #19181714;
  --focus-ring: 0 0 0 2px #ffffff, 0 0 0 4px #0b63c7;
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
  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 12px;
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
  --stagger: 45ms;
  --opacity-disabled: 0.45;
  --ease-reveal: cubic-bezier(.2, .7, 0, 1);
  --font-display: "Albert Sans", system-ui, sans-serif;
  --font-ui: "Albert Sans", system-ui, sans-serif;
  --font-mono: "Source Code Pro", ui-monospace, Menlo, monospace;
}
.ui-page-title { font-family: var(--font-display); font-size: 32px; line-height: 36px; font-weight: 700; letter-spacing: -0.04em;  }
.ui-numeric { font-family: var(--font-display); font-size: 36px; line-height: 40px; font-weight: 700; letter-spacing: -0.04em; font-variant-numeric: tabular-nums;  }
.ui-heading { font-family: var(--font-ui); font-size: 16px; line-height: 24px; font-weight: 600; letter-spacing: -0.01em; }
.ui-subheading { font-family: var(--font-ui); font-size: 14px; line-height: 20px; font-weight: 600; }
.ui-body { font-family: var(--font-ui); font-size: 14px; line-height: 20px; font-weight: 400; }
.ui-body-lg { font-family: var(--font-ui); font-size: 16px; line-height: 24px; font-weight: 400; }
.ui-label { font-family: var(--font-ui); font-size: 13px; line-height: 18px; font-weight: 500; }
.ui-small { font-family: var(--font-ui); font-size: 12px; line-height: 16px; font-weight: 400; }
.ui-meta { font-family: var(--font-mono); font-size: 11px; line-height: 16px; font-weight: 400; }
.web-display { font-family: var(--font-display); font-size: 88px; line-height: 88px; font-weight: 700; letter-spacing: -0.04em;  }
.web-h1 { font-family: var(--font-display); font-size: 56px; line-height: 60px; font-weight: 700; letter-spacing: -0.04em;  }
.web-h2 { font-family: var(--font-display); font-size: 40px; line-height: 46px; font-weight: 700; letter-spacing: -0.04em;  }
.web-h3 { font-family: var(--font-ui); font-size: 20px; line-height: 28px; font-weight: 600; letter-spacing: -0.01em; }
.web-lead { font-family: var(--font-ui); font-size: 19px; line-height: 30px; font-weight: 400; }
.web-body { font-family: var(--font-ui); font-size: 17px; line-height: 28px; font-weight: 400; }
.web-eyebrow { font-family: var(--font-mono); font-size: 12px; line-height: 16px; font-weight: 400; }
/* Platform UI never animates: wrap the app in .np-app */
.np-app, .np-app * { transition: none !important; animation: none !important; }
@media (max-width: 760px) { .web-display { font-size: 48px; line-height: 50px; } .web-h1 { font-size: 36px; line-height: 40px; } .web-h2 { font-size: 30px; line-height: 34px; } }
```

## components.css

```css
/* Notepad · components.css — reference styles for every component (.np-* platform, shared by the website). Requires tokens.css. */
@import url("https://fonts.googleapis.com/css2?family=Albert+Sans:wght@400;500;600;700&family=Source+Code+Pro:wght@400;500&display=swap");
/* Notepad components. .np-* = platform UI (no motion). .npw-* = website (motion allowed). */
body { margin: 0; font-family: var(--font-ui); font-size: 14px; line-height: 20px; color: var(--ink); background: var(--page); -webkit-font-smoothing: antialiased; }
.np-pad { padding: var(--space-5); }
.np-row { display: flex; flex-wrap: wrap; align-items: center; gap: var(--space-3); }
.np-col { display: grid; gap: var(--space-4); }
.np-grid { display: grid; gap: var(--space-4); grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); }
.np-meta { font-family: var(--font-mono); font-size: 11px; line-height: 16px; color: var(--pencil); }
.np-eyebrow { display: inline-flex; align-items: center; gap: var(--space-2); font-family: var(--font-mono); font-size: 11px; line-height: 16px; color: var(--pencil); }
.np-num { font-variant-numeric: tabular-nums; }
.np-app, .np-app * { transition: none !important; animation: none !important; }
:where(.np-btn, .np-input, .np-select, .np-textarea, .np-tab, .np-seg button, .np-nav a, .np-check input, .np-toggle input):focus-visible { outline: 2px solid transparent; box-shadow: var(--focus-ring); }


/* Buttons */
.np-btn { font: inherit; font-size: 13px; line-height: 18px; font-weight: 500; height: var(--control-md); padding: 0 var(--space-3); display: inline-flex; align-items: center; justify-content: center; gap: 6px; border-radius: var(--radius-sm); border: 1px solid transparent; cursor: pointer; white-space: nowrap; text-decoration: none; background: transparent; color: var(--ink); }
.np-btn svg { width: var(--icon-md); height: var(--icon-md); }
.np-btn-sm { height: var(--control-sm); padding: 0 10px; font-size: 12px; }
.np-btn-lg { height: var(--control-lg); padding: 0 var(--space-4); font-size: 14px; }
.np-btn-primary { background: var(--blueink); color: var(--on-blueink); }
.np-btn-primary:hover { background: var(--blueink-hover); }
.np-btn-secondary { background: var(--white); border-color: var(--rule-strong); }
.np-btn-secondary:hover { background: var(--scratch); }
.np-btn-ghost { color: var(--ink-secondary); }
.np-btn-ghost:hover { background: var(--scratch); color: var(--ink); }
.np-btn-danger { background: var(--danger); color: #ffffff; }
.np-btn[disabled] { opacity: var(--opacity-disabled); cursor: not-allowed; }
.np-icon { fill: none; stroke: currentColor; stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; width: var(--icon-md); height: var(--icon-md); flex: none; }

/* Fields */
.np-field { display: grid; gap: 6px; min-width: 0; }
.np-label { font-size: 13px; line-height: 18px; font-weight: 500; color: var(--ink-secondary); }
.np-input, .np-select, .np-textarea { font: inherit; font-size: 14px; width: 100%; box-sizing: border-box; height: var(--control-md); padding: 0 var(--space-3); border-radius: var(--radius-sm); border: 1px solid var(--rule-strong); background: var(--white); color: var(--ink); }
.np-textarea { height: 88px; padding-block: 8px; resize: vertical; }
.np-select { appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='none' stroke='%236b6963' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m4 6 4 4 4-4'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 10px center; padding-right: 34px; }
.np-input::placeholder, .np-textarea::placeholder { color: var(--placeholder); }
.np-input:focus, .np-select:focus, .np-textarea:focus, .np-input.is-focus { outline: none; border-color: var(--blueink); box-shadow: var(--focus-ring); }
.np-input.is-error { border-color: var(--danger); }
.np-help { margin: 0; font-size: 12px; line-height: 16px; color: var(--pencil); }
.np-help.is-error { color: var(--danger); }
.np-check { display: inline-flex; align-items: center; gap: 10px; font-size: 14px; color: var(--ink-secondary); cursor: pointer; }
.np-check input { appearance: none; margin: 0; width: 16px; height: 16px; border: 1px solid var(--rule-strong); border-radius: var(--radius-xs); background: var(--white); display: grid; place-items: center; cursor: pointer; }
.np-check input:checked { background: var(--blueink); border-color: var(--blueink); }
.np-check input:checked::after { content: ""; width: 4px; height: 8px; border: solid #ffffff; border-width: 0 2px 2px 0; transform: translateY(-1px) rotate(45deg); }
.np-check input[type="radio"] { border-radius: 50%; }
.np-check input[type="radio"]:checked { background: var(--white); border-color: var(--blueink); }
.np-check input[type="radio"]:checked::after { width: 8px; height: 8px; border: 0; border-radius: 50%; background: var(--blueink); transform: none; }
.np-toggle { display: inline-flex; align-items: center; gap: 10px; font-size: 14px; color: var(--ink-secondary); cursor: pointer; }
.np-toggle input { appearance: none; margin: 0; width: 32px; height: 18px; border-radius: var(--radius-full); background: var(--rule-strong); position: relative; cursor: pointer; }
.np-toggle input::after { content: ""; position: absolute; top: 2px; left: 2px; width: 14px; height: 14px; border-radius: 50%; background: #ffffff; }
.np-toggle input:checked { background: var(--blueink); }
.np-toggle input:checked::after { left: 16px; }

/* Badges */
.np-badge { display: inline-flex; align-items: center; gap: 6px; height: 22px; padding: 0 var(--space-2); border-radius: var(--radius-xs); font-size: 12px; line-height: 16px; font-weight: 500; background: var(--scratch); color: var(--pencil); white-space: nowrap; }
.np-badge.dot::before { content: ""; width: 6px; height: 6px; background: currentColor; }
.np-badge-done { background: var(--success-soft); color: var(--success); }
.np-badge-live { background: var(--highlighter-soft); color: var(--highlighter-text); }
.np-badge-warn { background: var(--warning-soft); color: var(--warning); }
.np-badge-fail { background: var(--danger-soft); color: var(--danger); }
.np-badge-mono { font-family: var(--font-mono); font-size: 11px; font-weight: 400; background: var(--white); border: 1px solid var(--rule); color: var(--ink-secondary); }

/* Tabs and segmented */
.np-tabs { display: flex; gap: var(--space-5); border-bottom: 1px solid var(--rule); }
.np-tab { font: inherit; background: none; border: 0; padding: 0; height: 36px; font-family: var(--font-mono); font-size: 11px; color: var(--pencil); border-bottom: 2px solid transparent; margin-bottom: -1px; cursor: pointer; }
.np-tab:hover { color: var(--ink); }
.np-tab[aria-selected="true"] { color: var(--ink); border-bottom-color: var(--ink); }
.np-seg { display: inline-flex; gap: 2px; padding: 3px; background: var(--scratch); border-radius: var(--radius-sm); }
.np-seg button { font: inherit; font-size: 13px; font-weight: 500; border: 1px solid transparent; background: none; color: var(--pencil); height: 28px; padding: 0 12px; border-radius: 4px; cursor: pointer; }
.np-seg button[aria-pressed="true"] { background: var(--white); color: var(--ink); border-color: var(--rule); }

/* Cards and KPIs */
.np-card { background: var(--white); border: 1px solid var(--rule); border-radius: var(--radius-md); padding: var(--space-5); min-width: 0; }
.np-card-head { display: flex; justify-content: space-between; align-items: center; gap: var(--space-3); margin-bottom: var(--space-4); }
.np-card-title { margin: 0; font-size: 16px; line-height: 24px; font-weight: 600; letter-spacing: -.01em; }
.np-kpi-value { font-family: var(--font-display); font-size: 36px; line-height: 40px; font-weight: 700; letter-spacing: -0.04em; font-variant-numeric: tabular-nums; margin-top: var(--space-2); }
.np-delta { font-size: 12px; line-height: 16px; font-weight: 500; color: var(--success); margin-top: var(--space-1); }
.np-delta.warn { color: var(--warning); } .np-delta.down { color: var(--danger); }

/* Table */
.np-table-wrap { background: var(--white); border: 1px solid var(--rule); border-radius: var(--radius-md); overflow-x: auto; }
.np-table { width: 100%; border-collapse: collapse; font-size: 14px; }
.np-table th { height: 36px; padding: 0 var(--space-3); text-align: left; background: var(--scratch); border-bottom: 1px solid var(--rule); font-family: var(--font-mono); font-size: 11px; font-weight: 400; color: var(--pencil); white-space: nowrap; }
.np-table td { height: var(--row-height); padding: 0 var(--space-3); border-bottom: 1px solid var(--rule); color: var(--ink-secondary); white-space: nowrap; }
.np-table tbody tr:last-child td { border-bottom: 0; }
.np-table tbody tr { cursor: pointer; }
.np-table tbody tr:hover td { background: var(--page); }
.np-table tbody tr[aria-selected="true"] td { background: var(--blueink-soft); }
.np-table tbody tr[aria-selected="true"] td:first-child { box-shadow: inset 2px 0 0 var(--blueink); }
.np-table .r { text-align: right; font-variant-numeric: tabular-nums; }
.np-table .strong { color: var(--ink); font-weight: 500; }
.np-table .id { font-family: var(--font-mono); font-size: 11px; color: var(--pencil); }
.np-table-foot { display: flex; justify-content: space-between; gap: var(--space-3); padding: 10px var(--space-3); border-top: 1px solid var(--rule); font-size: 12px; color: var(--pencil); }

/* App shell */
.np-app { display: grid; grid-template-columns: var(--sidebar-width) minmax(0, 1fr); min-height: 640px; background: var(--white); font-size: 14px; }
.np-side { background: var(--scratch); border-right: 1px solid var(--rule); padding: var(--space-4) 10px; display: flex; flex-direction: column; gap: var(--space-5); }
.np-brand { display: flex; align-items: center; gap: var(--space-2); padding: 0 6px; font-family: var(--font-display); font-size: 20px; line-height: 24px; color: var(--ink); }
.np-nav { display: grid; gap: 2px; }
.np-nav .np-meta { padding: 0 8px 6px; }
.np-nav a { display: flex; align-items: center; gap: 10px; height: 30px; padding: 0 8px; border-radius: var(--radius-sm); font-size: 13px; font-weight: 500; color: var(--ink-secondary); text-decoration: none; cursor: pointer; }
.np-nav a .np-icon { color: var(--pencil); }
.np-nav a:hover { background: var(--white); color: var(--ink); }
.np-nav a[aria-current="page"] { background: var(--blueink-soft); color: var(--blueink-text); }
.np-nav a[aria-current="page"] .np-icon { color: var(--blueink-text); }
.np-nav .count { margin-left: auto; font-family: var(--font-mono); font-size: 10px; color: var(--pencil); }
.np-main { min-width: 0; display: flex; flex-direction: column; }
.np-top { height: var(--topbar-height); border-bottom: 1px solid var(--rule); display: flex; align-items: center; gap: var(--space-3); padding: 0 var(--space-6); }
.np-top .np-input { max-width: 320px; }
.np-top .right { margin-left: auto; display: flex; gap: var(--space-2); align-items: center; }
.np-avatar { width: 30px; height: 30px; border-radius: 50%; background: var(--page); border: 1px solid var(--rule); display: grid; place-items: center; font-size: 11px; font-weight: 600; color: var(--ink-secondary); }
.np-page { padding: var(--space-6); display: grid; gap: var(--space-6); max-width: var(--content-max); }
.np-page-head { display: flex; justify-content: space-between; align-items: flex-end; gap: var(--space-4); flex-wrap: wrap; }
.np-page-title { margin: 2px 0 0; font-family: var(--font-display); font-size: 32px; line-height: 36px; font-weight: 700; letter-spacing: -0.04em; }
.np-page-sub { margin: var(--space-1) 0 0; color: var(--pencil); }

/* Modal, toast, banner, empty */
.np-backdrop { background: rgba(25, 24, 23, .2); padding: var(--space-6); display: grid; place-items: center; }
.np-modal { width: 100%; max-width: 440px; background: var(--white); border: 1px solid var(--rule); border-radius: var(--radius-lg); box-shadow: var(--shadow-modal); }
.np-modal-head { display: flex; justify-content: space-between; gap: var(--space-3); padding: var(--space-5) var(--space-5) 0; }
.np-modal-title { margin: 0; font-family: var(--font-display); font-size: 24px; line-height: 30px; font-weight: 700; }
.np-modal-body { padding: var(--space-5); display: grid; gap: var(--space-4); }
.np-modal-foot { display: flex; justify-content: flex-end; gap: var(--space-2); padding: var(--space-4) var(--space-5); border-top: 1px solid var(--rule); }
.np-toast { display: inline-flex; align-items: center; gap: var(--space-3); padding: 12px var(--space-4); background: var(--white); border: 1px solid var(--rule); border-radius: var(--radius-lg); box-shadow: var(--shadow-pop); font-weight: 500; }
.np-toast .np-icon { color: var(--blueink); }
.np-banner { display: flex; align-items: center; gap: var(--space-3); padding: 12px var(--space-4); border-radius: var(--radius-md); font-size: 14px; }
.np-banner .grow { flex: 1; }
.np-banner-warn { background: var(--warning-soft); color: var(--warning); }
.np-banner-fail { background: var(--danger-soft); color: var(--danger); }
.np-banner-info { background: var(--blueink-soft); color: var(--blueink-text); }
.np-empty { position: relative; overflow: hidden; text-align: center; padding: var(--space-12) var(--space-6); background: var(--white); border: 1px solid var(--rule); border-radius: var(--radius-md); }
.np-empty > * { position: relative; }
.np-empty .np-icon { width: 20px; height: 20px; color: var(--pencil); }
.np-empty h3 { margin: var(--space-3) 0 var(--space-1); font-size: 16px; line-height: 24px; font-weight: 600; }
.np-empty p { margin: 0 auto var(--space-4); max-width: 40ch; color: var(--pencil); }
.np-skel { background: var(--scratch); border-radius: 4px; height: 12px; }

/* Signature details */
.np-mark { display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: var(--highlighter); flex: none; }
.np-eyebrow::before { content: none; }
.np-accent { background: var(--highlighter); border-radius: var(--radius-full); padding: 0 .3em; }
.np-empty::before { content: none; }
/* Highlight pill and doodles (signature) */
.np-hl { display: inline-flex; align-items: center; gap: .25em; padding: 0 .3em; border-radius: var(--radius-full); background: var(--highlighter); color: var(--ink); }
.np-hl::before { content: ""; width: .22em; height: .22em; border-radius: 50%; background: var(--ink); }
.np-doodle { fill: none; stroke: var(--ink); stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; }
.np-callout { display: flex; gap: var(--space-3); padding: var(--space-4); background: var(--scratch); border-radius: var(--radius-md); }
```

## motion.css (website only)

```css
/* Notepad · motion.css — WEBSITE ONLY. Never load inside the platform UI. Requires tokens.css. */
/* ---------------- Website ---------------- */
.fw { font-size: 17px; line-height: 28px; background: var(--page); }
.npw-wrap { max-width: var(--site-max); margin: 0 auto; padding: 0 var(--space-6); }
.npw-nav { display: flex; align-items: center; justify-content: space-between; height: 72px; }
.npw-logo { display: flex; align-items: center; gap: var(--space-2); font-family: var(--font-display); font-size: 22px; line-height: 28px; color: var(--ink); text-decoration: none; }
.npw-links { display: flex; align-items: center; gap: var(--space-6); font-size: 14px; font-weight: 500; color: var(--pencil); }
.npw-links a { color: inherit; text-decoration: none; transition: color 150ms ease-out; }
.npw-links a:hover { color: var(--ink); }
.npw-links a[aria-current="page"] { color: var(--ink); text-decoration: underline; text-underline-offset: 6px; text-decoration-thickness: 1px; }
.fw .np-btn { transition: background-color 150ms ease-out; }
.fw .np-btn .arr { display: inline-block; transition: transform 150ms ease-out; }
.fw .np-btn:hover .arr, .npw-card:hover .arr { transform: translateX(3px); }
.npw-display { margin: 0; font-family: var(--font-display); font-weight: 700; font-size: 88px; line-height: 84px; letter-spacing: -0.04em; max-width: 13ch; color: var(--ink); }
.npw-display .w { display: inline-block; }
.npw-lead { margin: var(--space-5) 0 var(--space-8); max-width: 44ch; font-size: 19px; line-height: 30px; color: var(--pencil); }
.npw-cta { display: flex; gap: var(--space-3); flex-wrap: wrap; }
.npw-sec-head { display: flex; justify-content: space-between; align-items: flex-end; gap: var(--space-4); flex-wrap: wrap; margin-bottom: var(--space-8); }
.npw-h1 { margin: var(--space-3) 0 0; font-family: var(--font-display); font-weight: 700; font-size: 56px; line-height: 58px; letter-spacing: -0.04em; }
.npw-h2 { margin: 0; font-family: var(--font-display); font-weight: 700; font-size: 40px; line-height: 44px; letter-spacing: -0.04em; }
.npw-cards { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: var(--space-6); }
.npw-card { display: flex; flex-direction: column; gap: var(--space-2); padding: var(--space-6); background: var(--white); border: 1px solid var(--rule); border-radius: var(--radius-md); text-decoration: none; color: var(--ink); min-width: 0; }
.npw-shot { aspect-ratio: 16/10; border-radius: var(--radius-sm); background: var(--page); border: 1px solid var(--rule); margin-bottom: var(--space-3); padding: 12px; display: grid; gap: 8px; align-content: start; }
.npw-shot span { height: 8px; border-radius: 4px; background: var(--scratch); }
.npw-card h3 { margin: 0; font-size: 20px; line-height: 28px; font-weight: 600; letter-spacing: -.01em; display: flex; justify-content: space-between; transition: color 150ms ease-out; }
.npw-card:hover h3 { color: var(--blueink); }
.npw-card p { margin: 0; font-size: 15px; line-height: 24px; color: var(--pencil); }
.npw-card .tags { display: flex; gap: var(--space-2); flex-wrap: wrap; margin-top: var(--space-3); }
.npw-notes { display: grid; }
.npw-note { display: grid; grid-template-columns: 120px minmax(0, 1fr); gap: var(--space-4); padding: var(--space-5) 0; border-bottom: 1px solid var(--rule); text-decoration: none; color: var(--ink); }
.npw-note b { display: block; font-family: var(--font-display); font-weight: 700; font-size: 24px; line-height: 30px; transition: color 150ms ease-out; }
.npw-note:hover b { color: var(--blueink); }
.npw-note span { color: var(--pencil); font-size: 15px; }
@media (max-width: 760px) {
  .npw-display { font-size: 48px; line-height: 48px; } .npw-h1 { font-size: 36px; line-height: 40px; } .npw-h2 { font-size: 30px; line-height: 34px; }
  .npw-cards { grid-template-columns: 1fr; } .npw-links { display: none; } .npw-hero { padding: var(--space-5) var(--space-5) var(--space-10); }
  .npw-note { grid-template-columns: 1fr; gap: var(--space-1); }
  .np-app { grid-template-columns: 1fr; } .np-side { display: none; }
}

/* Accent word */
.npw-display em, .npw-h1 em, .npw-h2 em { font-style: normal; background: var(--highlighter); border-radius: 9999px; padding: 0 .25em; }

/* Hero (signature) */
.npw-hero { text-align: center; padding: var(--space-24) 0 var(--space-12); }
.npw-hero .npw-display { margin: 0 auto; max-width: 14ch; }
.npw-display em { background-repeat: no-repeat; }
.npw-doodle path { stroke-dasharray: 400; stroke-dashoffset: 0; }

@media (prefers-reduced-motion: no-preference) {
  .npw-play .npw-display .w { animation: npw-rise 550ms var(--ease-reveal) both; animation-delay: calc(var(--i) * var(--stagger)); }
  @keyframes npw-rise { from { opacity: 0; transform: translateY(.25em); } to { opacity: 1; transform: none; } }
  .npw-play .npw-display em { animation: npw-swipe 450ms ease-out 600ms both; }
  @keyframes npw-swipe { from { background-size: 0% 100%; } to { background-size: 100% 100%; } }
  .npw-play .npw-doodle path { animation: npw-draw 900ms ease-out 1000ms both; }
  @keyframes npw-draw { from { stroke-dashoffset: 400; } to { stroke-dashoffset: 0; } }
  .npw-fade.npw-in { animation: npw-up var(--duration-reveal) var(--ease-reveal) both; }
  @keyframes npw-up { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }
}

/* Usage
   1. Hero markup: <header class="npw-hero"><h1 class="npw-display">Where ideas become <em>working</em> software.</h1><svg class="npw-doodle">…</svg>…</header>
   2. Split the headline into <span class="w" style="--i:N"> words (or lines), then add .npw-play to the hero once it is in view.
   3. Section titles: add .npw-fade; add .npw-in when they first enter the viewport.
   Everything is visible before and without the script; prefers-reduced-motion turns all of it off. */
```

## tailwind-theme.css (only if the project uses Tailwind v4)

```css
@import "tailwindcss";
/* Notepad · Tailwind v4 theme. Load tokens.css first. Light only. */
@theme inline {
  --color-page: var(--page);
  --color-white: var(--white);
  --color-scratch: var(--scratch);
  --color-rule: var(--rule);
  --color-rule-strong: var(--rule-strong);
  --color-ink: var(--ink);
  --color-ink-secondary: var(--ink-secondary);
  --color-pencil: var(--pencil);
  --color-placeholder: var(--placeholder);
  --color-blueink: var(--blueink);
  --color-blueink-hover: var(--blueink-hover);
  --color-blueink-soft: var(--blueink-soft);
  --color-blueink-text: var(--blueink-text);
  --color-on-blueink: var(--on-blueink);
  --color-highlighter: var(--highlighter);
  --color-highlighter-soft: var(--highlighter-soft);
  --color-highlighter-text: var(--highlighter-text);
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

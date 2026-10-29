# FIELD-NOTEBOOK.md · Sahil Shaikh brand (all-in-one)

**For Claude Code:** this single file contains the whole Field Notebook system: brand rules, platform UI rules (no animation), website rules (with motion), and the complete CSS. Put it in the project root and add this line to `CLAUDE.md`:

```
All UI follows FIELD-NOTEBOOK.md. Before writing UI, create tokens.css, components.css (and motion.css for website pages) from Part 4 if they don't exist, then use only their variables and classes. Light only, never dark. Platform UI has no animation.
```

## How Claude Code should use this file

1. Decide the surface: **Platform UI** (app, dashboard, admin, settings) or **Website** (marketing, portfolio, landing). If unclear, assume Platform UI.
2. If `tokens.css` and `components.css` don't exist in the project, create them by copying the code blocks in Part 4 exactly. For website pages also create `motion.css`. With Tailwind v4 also create `tailwind-theme.css`.
3. Load the Google Fonts in Part 1, section 5.
4. Never hard-code colours, font sizes or fonts. Never add dark mode or dark sections.
5. Platform UI: wrap the app in `class="fn-app"` (kills all motion). Website: follow Part 3, section 4.
6. Finish by running the checklist at the end of Part 2 or Part 3.

---


Sahil Shaikh's brand and design system. Part 1 is the brand foundations, Part 2 the platform UI rules (no animation), Part 3 the website rules (with motion), Part 4 the code. The code for every value and component is in Part 4.

---


# Part 1 · Brand foundations

The brand of Sahil Shaikh, Full Stack AI Engineer. **Field Notebook** is an engineer's field notebook: warm paper, careful headlines, technical marks in the margins, and clean, readable working pages. It covers every platform Sahil designs and his website.

This system has three parts:

1. **Brand foundations** (Part 1): idea, logo, colour, type, layout, shape, icons, imagery, voice and accessibility.
2. **Platform UI** (Part 2): rules for any app, dashboard or tool. **No animation.**
3. **Website** (Part 3): the same brand with larger type and a defined motion system.

Light only. There is no dark theme, and no dark sections, panels or backgrounds anywhere.

---

## 1. The idea

| | |
|---|---|
| **Metaphor** | An engineer's field notebook: paper, ink, a fern-green pen, a small orange marker. |
| **Personality** | Calm, careful, quietly confident. Shows working things, never hype. |
| **Feeling we want** | "This was made by someone who cares about details." |
| **Three ingredients** | **Voice** (serif headlines on warm paper) · **Precision** (mono labels, the signal square, corner marks, drawing grid) · **Clarity** (white working panels, Onest UI text, one trustworthy green). |

## 2. Principles

1. **Paper first.** Everything sits on warm paper (`paper`) or white panels (`white`). Never dark.
2. **One voice, used for titles.** Instrument Serif speaks in page titles, big numbers and website headlines. Everything you read or click is Onest.
3. **Precision in the margins.** Small mono labels, an 8px orange square, thin corner marks: small, exact details that show care.
4. **One green to act.** Fern marks the thing to do next. Orange marks what is live. Nothing else is coloured.
5. **Lines, not shadows.** 1px `rule` lines separate areas. Only floating things cast a shadow.
6. **Calm product, alive website.** The platform never moves. The website has one orchestrated motion moment per page.
7. **Accessible always.** Text 4.5:1 or better, borders and indicators 3:1, focus always visible.

## 3. Logo

- **Wordmark:** the signal square (8px, `signal`) followed by "Sahil Shaikh" in Instrument Serif 400, `ink`, tracking -0.01em. The square sits on the x-height centre, 8px before the name.
- **Product mark:** the signal square + the product name in Instrument Serif (for example "■ Workspace").
- **App icon / avatar:** a `paper` tile, 1px `rule` border, 22% corner radius, a serif "S" in `ink`, and the signal square in the bottom-right corner.
- **Clear space:** the height of the capital S on every side.
- **Minimum size:** wordmark 96px wide; icon 20px.
- **Never:** recolour the square, outline the name, add shadows or gradients, put it on a dark background, or set the name in any other font.

## 4. Colour

### Core palette

| Token | Hex | Role |
|---|---|---|
| `paper` | #FAFAF7 | Page ground, sidebar, website background |
| `white` | #FFFFFF | Cards, tables, inputs, modals |
| `linen` | #F3F3EF | Hover rows, table headers, soft fills |
| `rule` | #E6E5E0 | Dividers and borders |
| `rule-strong` | #8D8C86 | Input borders, corner marks |
| `ink` | #1C1C1A | Headings, primary text |
| `ink-secondary` | #3D3C38 | Labels, nav, table text |
| `graphite` | #64635E | Secondary text, mono labels |
| `placeholder` | #72716B | Placeholders, disabled text |
| `fern` | #1E6B5C | Primary action, links, focus, accent word |
| `fern-hover` | #185A4D | Hover/pressed fern |
| `fern-soft` / `fern-text` | #E4F1ED / #17574B | Selected, active, success |
| `signal` | #FF5A1F | Brand square, live dots |
| `signal-soft` / `signal-text` | #FFF0E8 / #A8390C | "In progress" badges |
| `warning` / `warning-soft` | #8A5A00 / #FFF4DC | Needs attention |
| `danger` / `danger-soft` | #B42318 / #FDECEB | Errors, destructive |

### Charts

`chart-1` fern #1E6B5C, `chart-2` light fern #7FA99B, `chart-3` warm grey #B9B7AE, and `chart-highlight` signal #FF5A1F for the one value that matters (today, the outlier). Gridlines use `rule`, axis labels use `ui-meta` in `graphite`.

### Proportions

About 60% paper, 24% white, 10% lines and text, 4% fern, 1% signal.

### Rules

- Fern is the only colour on buttons and links. One filled fern button per view.
- Signal orange is never text on white and never a button. It is a mark: the logo square, a live dot, an in-progress badge.
- Status always has a word: "Failed" in a danger badge, never red alone.
- No gradients in the product. On the website, one soft fern glow is allowed in the hero.
- Never use `ink` or `graphite` as a background.

## 5. Typography

Three families, all free on Google Fonts:

`https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Onest:wght@400;500;600&family=Martian+Mono:wght@400;500&display=swap`

| Family | Role | Weights |
|---|---|---|
| **Instrument Serif** | The voice: page titles, KPI numbers, website headlines, the italic accent word | 400, 400 italic |
| **Onest** | The clarity: all UI and body text, headings inside cards and forms | 400, 500, 600 |
| **Martian Mono** | The precision: small lowercase labels, IDs, timestamps, tabs, column headers | 400, 500 |

- **Accent word:** one word or short phrase per headline may be Instrument Serif *italic* in `fern` ("Field *Notebook*", "that *actually* ship"). Never more than one per headline.
- **Mono labels** are always lowercase, 11px, `graphite`, and may start with the signal square.
- Onest never goes above 600. Serif is always 400.
- Sentence case for everything in Onest. No ALL CAPS.
- Full scales are in Part 2 (platform) and Part 3 (website).

## 6. Layout and spacing

- **4px grid:** 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 96, 128.
- **Platform:** sidebar on `paper`, content on `white`, 24px page padding, max 1200px.
- **Website:** 1120px max width, 96px between sections, headlines left-aligned.
- Align everything to a left edge. Centre only short single lines (an empty state).

## 7. Shape and depth

| Token | Value | Use |
|---|---|---|
| `radius-xs` | 3px | Badges, checkboxes |
| `radius-sm` | 6px | Buttons, inputs, nav items |
| `radius-md` | 10px | Cards, tables, menus |
| `radius-lg` | 14px | Modals, website panels |
| `radius-full` | 9999px | Avatars, dots, toggles |

- **Corner marks** (signature): two thin L-shaped brackets, 10px, 1px `rule-strong`, top-left and bottom-right of a feature card or hero panel, inset 6px. Use on at most one group per screen.
- **Drawing grid** (signature, website and empty states only): 32px squares in `rule`, faded out with a mask.
- Shadows: `shadow-pop` for menus and toasts, `shadow-modal` for modals. Cards never cast a shadow.

## 8. Iconography

- Lucide icons, 1.5px stroke, rounded joins. 16px in controls and tables, 20px in the sidebar and empty states.
- Colour: `graphite` by default, `ink` on hover, `fern-text` when active.
- Icon-only buttons always have an accessible label.

## 9. Imagery

- Real product screenshots in a `radius-md` frame with a 1px `rule` border, on `paper`.
- Diagrams are drawn like notebook sketches: 1px `ink` lines, `fern` for the main path, `signal` for the one thing to notice, mono labels.
- Portraits: natural light, plain warm background, never filters or heavy retouching.

## 10. Voice and writing

- Plain, warm, exact. Write like a careful engineer explaining to a friend.
- Lead with what something does: "Agents plan, build and review work together."
- Buttons are verbs: "New project", "Save changes". Confirmations say what happened: "Project created."
- Errors say what went wrong and how to fix it: "Name is required. Add a project name to continue."
- Numbers: "AED 1,250.00", dates "21 Oct 2026", times "14:32".
- No buzzwords, no exclamation marks, no emoji in UI.

## 11. Accessibility

- Every text colour pair passes WCAG AA (4.5:1). Borders, focus rings and indicators pass 3:1.
- Focus ring: 2px white gap + 2px `fern`, on every interactive element.
- Never rely on colour alone; pair it with a word, icon or position.
- Hit targets at least 28px (34px default).
- The website respects `prefers-reduced-motion`: all motion off, content visible immediately.

## 12. Do and don't

| Do | Don't |
|---|---|
| Paper ground, white panels | Dark backgrounds or dark mode |
| Serif for titles, Onest for UI | Serif in buttons, tables or forms |
| One italic fern word per headline | Several coloured or italic words |
| Orange as a small mark | Orange buttons, orange text on white |
| Mono labels in lowercase | ALL CAPS labels |
| Lines to separate | Shadows on every card |
| Corner marks on one feature group | Corner marks on everything |
| Motion on the website only | Any animation in the platform |


---

# Part 2 · Platform UI guideline

Rules for any platform, app, dashboard, admin or internal tool built in the Field Notebook brand. It is generic: it works for projects, CRM, analytics, payments, AI agents or anything else.

**The platform never animates.** State changes are instant. Every rule here assumes light only.

---

## 1. Foundations for the platform

- **Ground:** `paper` for the app canvas and sidebar. `white` for every working panel (cards, tables, forms, modals).
- **Text:** `ink` for headings and values, `ink-secondary` for labels and nav, `graphite` for help text and metadata.
- **Action colour:** `fern`. **Live/in-progress mark:** `signal` (small).
- **Density:** 14px text, 34px controls, 44px rows, 4px grid.

## 2. Type scale

| Style | Size / line | Weight | Family | Use |
|---|---|---|---|---|
| `ui-page-title` | 32 / 36 | 400 | Instrument Serif | Page title, one per screen |
| `ui-numeric` | 36 / 40 | 400 | Instrument Serif | KPI values, big totals |
| `ui-heading` | 16 / 24 | 600 | Onest | Card, section, modal headings |
| `ui-subheading` | 14 / 20 | 600 | Onest | Form group titles |
| `ui-body` | **14 / 20** | 400 | Onest | **Default text** |
| `ui-body-lg` | 16 / 24 | 400 | Onest | Empty states, onboarding |
| `ui-label` | 13 / 18 | 500 | Onest | Labels, nav items, buttons |
| `ui-small` | 12 / 16 | 400 | Onest | Help text, captions |
| `ui-meta` | 11 / 16 | 400 | Martian Mono | Lowercase labels, IDs, timestamps, tabs, column headers |

Rules:

- Serif only for `ui-page-title`, `ui-numeric` and modal titles. Never in buttons, tables, forms, nav or badges.
- Numbers in tables use `font-variant-numeric: tabular-nums` and align right.
- Never below 11px (mono) or 12px (Onest).

## 3. App layout

```
┌──────────────┬──────────────────────────────────────────────┐
│ ■ Product    │  top bar 56px (search · help · avatar)        │
│              ├──────────────────────────────────────────────┤
│ workspace    │  workspace / projects          [Filter] [New] │
│  Overview    │  Projects  (serif title)                       │
│  Projects ●  │                                               │
│  Documents   │  ┌ KPI ┐ ┌ KPI ┐ ┌ KPI ┐                       │
│              │  all · in progress · done                      │
│ account      │  ┌──────── table on white ─────────────────┐   │
│  Settings    │  └────────────────────────────────────────┘   │
└──────────────┴──────────────────────────────────────────────┘
 sidebar 232px on paper      content on white, 24px padding
```

- **Sidebar:** 232px (60px collapsed), `paper`, 1px `rule` right border, 16px top padding. Product mark at top. Groups titled with `ui-meta` ("workspace", "account").
- **Top bar:** 56px, `white`, 1px `rule` bottom border. Search left (320px max), actions right.
- **Page header:** breadcrumb in `ui-meta`, then `ui-page-title`, optional one-line description in `graphite`. Primary and secondary actions on the right, aligned to the title's baseline.
- **Content:** 24px padding, max width 1200px, 24px gap between blocks, 32px between page sections.
- **Breakpoints:** 640, 768, 1024, 1280. Below 1024 the sidebar becomes a drawer opened from a menu button in the top bar.

## 4. Components

### Buttons

| Variant | Look | Use |
|---|---|---|
| Primary | `fern` fill, `on-fern` text | The one main action per view |
| Secondary | `white` fill, 1px `rule-strong` border, `ink` text | Every other action |
| Ghost | No fill or border, `ink-secondary` text | Toolbars, cancel, low emphasis |
| Danger | `danger` fill, white text | Destructive confirmations only |

- Sizes: 28px (sm), **34px (default)**, 40px (lg). Padding 12px (10px sm, 16px lg). `radius-sm`. `ui-label` 13/500 (14/500 on lg).
- Icon + label: 16px icon, 6px gap, icon first.
- States: hover = instant background change (`fern-hover`, `linen`); focus = `focus-ring`; disabled = `opacity-disabled` and `not-allowed` cursor.
- Labels are verbs in sentence case: "New project", "Export CSV".

### Text inputs, selects, textareas

- 34px tall, 12px horizontal padding, `radius-sm`, `white` fill, 1px `rule-strong` border, `ui-body` text, `placeholder` colour for placeholders.
- Label above (`ui-label`, `ink-secondary`), help or error below (`ui-small`), 6px gaps.
- Focus: `fern` border + `focus-ring`. Error: `danger` border, message in `danger` saying how to fix it.
- Textarea min 88px. Select uses the native control styled with the same border and a 16px chevron.

### Checkbox, radio, toggle

- Checkbox 16px, `radius-xs`, 1px `rule-strong`; checked = `fern` fill with white tick.
- Radio 16px circle; selected = 5px `fern` dot.
- Toggle 32 × 18px, `radius-full`; off = `rule-strong`, on = `fern`; knob white.
- The label is always clickable and sits 10px to the right.

### Badges

- 22px tall, 8px padding, `radius-xs`, Onest 12/500 (or `ui-meta` for technical tags).
- Soft fill + strong text: Done (`fern-soft`/`fern-text`), In progress (`signal-soft`/`signal-text`), Needs review (`warning-soft`/`warning`), Failed (`danger-soft`/`danger`), Draft (`linen`/`graphite`).
- Optional 6px square dot before the word.

### Tabs and segmented controls

- **Tabs** (page sections): `ui-meta` lowercase labels, 36px tall, 20px apart. Active = `ink` text + 2px `ink` underline. Bottom border 1px `rule`.
- **Segmented control** (filters): `linen` track, 3px padding, `radius-sm`; active segment = `white` with 1px `rule`.

### Tables

- `white` panel, 1px `rule`, `radius-md`, overflow scroll on narrow screens.
- Header 36px, `linen`, `ui-meta` labels in `graphite`.
- Rows 44px, 12px cell padding, 1px `rule` between rows. Hover = `paper`. Selected = `fern-soft` with a 2px `fern` left edge.
- IDs in `ui-meta`. Amounts right-aligned, tabular. Status as badges. Row actions are ghost sm buttons, shown on hover and on focus.
- Footer row: count and total in `ui-small` `graphite`.

### Cards and KPIs

- `white`, 1px `rule`, `radius-md`, 20px padding, no shadow.
- Heading `ui-heading`, actions top-right as ghost sm buttons.
- **KPI card:** `ui-meta` label, value in `ui-numeric` (serif), delta in `ui-small` (`fern-text` up, `warning` attention, `danger` down).
- **Feature card** (one group per screen): may carry corner marks.

### Navigation

- Sidebar items: 30px, `radius-sm`, `ui-label`, 16px icon in `graphite`.
- Hover: `white` background. Active: `fern-soft` background + `fern-text`.
- Counts on the right in `ui-meta`.
- Breadcrumbs in `ui-meta` separated by " / ".

### Modals and side sheets

- Modal widths 440 / 600 / 800px; `white`, `radius-lg`, `shadow-modal`, 1px `rule`.
- Backdrop: `ink` at 20% opacity (a light dim).
- Header: title in Instrument Serif 24/30 + one-line description; close icon button top-right.
- Footer: 1px `rule` top border, buttons right-aligned, primary last. Escape and backdrop click close it; focus returns to the trigger.
- Side sheet: 440px from the right, same styles, full height.

### Toasts and banners

- Toast: bottom-right, `white`, `radius-lg`, `shadow-pop`, one line + optional "Undo". Disappears after 4s with no animation.
- Banner: full width inside the page, soft status fill, icon + one sentence + optional action.

### Empty, loading and error states

- **Empty:** centred in the panel, a faint drawing grid behind, 20px icon in `graphite`, `ui-heading` line, `ui-body` explanation, one primary button.
- **Loading:** static `linen` skeleton blocks in the shape of the content, plus a `ui-meta` "loading…" label. No spinners or shimmer.
- **Error:** danger banner with what failed and a "Try again" button.

### Data visualisation

- Bars and lines in `chart-1`; comparisons in `chart-2`; "other" in `chart-3`; one highlighted value in `chart-highlight`.
- Gridlines 1px `rule`; axis labels `ui-meta`; values `tabular-nums`.
- No animation on charts. No 3D, no gradients, no pie charts with more than 4 slices.

## 5. Patterns

- **Forms:** one column, max 560px wide. Labels above fields. 16px between fields, 32px between groups with a `ui-subheading`. Actions bottom-right, primary last.
- **Lists to detail:** clicking a row opens a side sheet, not a new page, for quick edits.
- **Search:** top bar search filters instantly; no "Search" button needed.
- **Destructive actions:** always confirm in a modal that names the thing ("Delete 'Q4 planning'?") with a danger button.
- **Settings:** left sub-nav (200px) + one form card per section.

## 6. No-motion rules

- Set `transition: none; animation: none;` on everything inside the app.
- Hover, focus, open and close are instant.
- Menus and modals appear and disappear immediately.
- Progress is shown with static text or a determinate bar that updates in steps.

## 7. Checklist for every screen

- [ ] Paper canvas, white panels, no dark areas
- [ ] One serif page title; all other text Onest or mono
- [ ] One filled fern button
- [ ] Orange only as a small mark
- [ ] 14px body, 34px controls, 44px rows, 4px grid
- [ ] Lines, not shadows (shadows only on menus, toasts, modals)
- [ ] Focus visible on every control
- [ ] Status has a word, not just colour
- [ ] Nothing animates


---

# Part 3 · Website guideline

How the Field Notebook brand looks and moves on Sahil's website, landing pages and portfolio. Same palette and families as the platform, with bigger type, more air, and a defined motion system.

Light only: every section sits on `paper` or `white`. No dark bands, dark footers or dark cards.

---

## 1. Layout

- Max width 1120px (`site-max`), side padding 24px (16px on phones).
- 96px between sections (64px on phones); hero top spacing 128px (64px on phones).
- Text blocks max 60 characters wide. Headlines left-aligned.
- Sections alternate `paper` and `white` only when it helps separate content; never more than two in a row of the same.

## 2. Type scale

| Style | Size / line | Weight | Family | Use |
|---|---|---|---|---|
| `web-display` | 88 / 84 (48 / 48 on phones) | 400 | Instrument Serif | Hero headline |
| `web-h1` | 56 / 58 (36 on phones) | 400 | Instrument Serif | Section titles |
| `web-h2` | 40 / 44 (30 on phones) | 400 | Instrument Serif | Sub-sections, contact |
| `web-h3` | 20 / 28 | 600 | Onest | Card titles |
| `web-lead` | 19 / 30 | 400 | Onest | Intro paragraphs |
| `web-body` | 17 / 28 | 400 | Onest | Running text |
| `web-eyebrow` | 11 / 16 | 400 | Martian Mono | Lowercase line above a headline, led by the signal square |

- One accent word per headline in Instrument Serif *italic* `fern`.
- Eyebrow format: `■ full stack ai engineer · dubai`.

## 3. Page anatomy

### Navigation

- 72px tall, `paper` with 88% opacity and a 12px backdrop blur when sticky.
- Left: wordmark (signal square + "Sahil Shaikh" in serif 22px). Right: 3 to 4 links in Onest 14/500 `graphite`, plus one primary button "Get in touch".
- Active link: `ink` text with a 1px `ink` underline 4px below.

### Hero

- `white` panel with `radius-lg` and 1px `rule`, or full-bleed `paper`.
- Layers, back to front: drawing grid (32px, `rule`, faded with a top-to-bottom mask) → soft fern glow (radial, 16% opacity, top-right) → corner marks on all four corners (14px, `rule-strong`, inset 14px) → content.
- Content: eyebrow → `web-display` headline with one italic fern word → `web-lead` → two buttons (primary "See the work →", secondary "Read my notes").

### Section header

- `web-eyebrow` + `web-h1` on the left; an optional one-line description in `graphite` and a ghost link on the right, aligned to the baseline.

### Work cards

- `white`, 1px `rule`, `radius-md`, 24px padding. 16:10 screenshot at the top in a `radius-sm` frame on `paper`.
- `ui-meta` line (`agentic ai · 2026`), `web-h3` title, 2 lines of `web-body` 15px in `graphite`, tags as badges.
- The whole card is the link. Hover: the title turns `fern` and the arrow nudges 3px right.

### Notes / writing list

- Rows with date in `ui-meta` (left, 120px), title in serif 24px, one-line summary in `graphite`. 1px `rule` between rows. Hover: title turns `fern`.

### Contact

- `white` panel with corner marks, `web-h2` headline ("Let's build something *useful*"), short line, the email shown as selectable text with a "Copy" button, and social links.

### Footer

- `paper`, 1px `rule` top border, `ui-meta` copyright on the left, links on the right.

## 4. Motion system

The website has **one orchestrated moment per page** (the hero) plus small responses to the user. Nothing else moves.

### Tokens

| Token | Value | Use |
|---|---|---|
| `duration-fast` | 150ms | Hover colour changes |
| `duration-base` | 220ms | Menus, accordions |
| `duration-reveal` | 700ms | Word rise, section fade-up |
| `duration-hero` | 900ms | Grid settle, glow |
| `stagger` | 70ms | Delay between headline words |
| Easing | `cubic-bezier(.2, .7, 0, 1)` | All reveals (fast start, soft landing) |
| Hover easing | `ease-out` | Colour and small movement |

### The hero sequence (in order)

| Time | What happens | Spec |
|---|---|---|
| 0ms | Drawing grid settles | Fades in and tightens from 48px to 32px cells over 900ms |
| 0ms | Fern glow appears | Opacity 0 → 1, scale .8 → 1 over 1400ms |
| 200ms | Headline words rise | Each word: opacity 0 → 1, translateY .4em → 0, blur 6px → 0, 760ms, 70ms apart |
| 700ms | Corner marks snap on | Opacity 0 → 1, scale 1.8 → 1, 500ms |
| 900ms | Signal dot pulses | 3 soft pulses, 1.2s each, then stops |
| ~1100ms | Done | Lead text and buttons are already visible; they never wait for the animation |

### Responses to the user

- **Links and buttons:** colour change over 150ms; arrows nudge 3px right.
- **Cards:** title colour to `fern`, arrow nudge. Cards do not lift, scale or tilt.
- **Sections:** the section title fades up 12px once when it first enters the viewport (700ms). Body text does not animate.
- **Menus and accordions:** height and opacity over 220ms.

### Never

- Parallax on text, scroll-jacking, animating every section, typing effects on long text.
- Hiding content until it animates. Every element is readable in the first frame.
- Animation in the product UI.

### Reduced motion

With `prefers-reduced-motion: reduce`, all of the above is switched off: the grid, glow and marks are simply there, and the words are visible.

### Reference CSS

```css
.reveal .w { display: inline-block; }
@media (prefers-reduced-motion: no-preference) {
  .reveal.play .w {
    animation: fn-rise var(--duration-reveal) cubic-bezier(.2,.7,0,1) both;
    animation-delay: calc(200ms + var(--i) * var(--stagger));
  }
  @keyframes fn-rise {
    from { opacity: 0; transform: translateY(.4em); filter: blur(6px); }
    to   { opacity: 1; transform: none; filter: none; }
  }
}
```

Split the headline into `<span class="w" style="--i:N">` words with a small script, add `play` when the hero enters the viewport, and keep the words visible if the script never runs.

## 5. Imagery on the website

- Product screenshots on `paper` in `radius-md` frames with 1px `rule`.
- Notebook-style diagrams: 1px `ink` lines, `fern` main path, one `signal` highlight, `ui-meta` labels.
- Portrait: natural light, warm plain background, 4:5.

## 6. Checklist for every page

- [ ] Light only: paper and white, no dark bands
- [ ] Serif headlines with at most one italic fern word each
- [ ] Mono eyebrow with the signal square above key headlines
- [ ] Drawing grid and corner marks only in the hero (and contact panel)
- [ ] One hero motion sequence; everything readable before it plays
- [ ] Hover responses at 150ms; no lifting or tilting cards
- [ ] Reduced motion respected
- [ ] One primary button per section


---

# Part 4 · Code

Copy each block into its own file, exactly as written.

## tokens.css

```css
/* Field Notebook tokens · Sahil Shaikh. Light only: there is no dark theme. */
:root {
  color-scheme: light;
  --paper: #fafaf7;
  --white: #ffffff;
  --linen: #f3f3ef;
  --rule: #e6e5e0;
  --rule-strong: #8d8c86;
  --ink: #1c1c1a;
  --ink-secondary: #3d3c38;
  --graphite: #64635e;
  --placeholder: #72716b;
  --fern: #1e6b5c;
  --fern-hover: #185a4d;
  --fern-soft: #e4f1ed;
  --fern-text: #17574b;
  --on-fern: #ffffff;
  --signal: #ff5a1f;
  --signal-soft: #fff0e8;
  --signal-text: #a8390c;
  --success: var(--fern-text);
  --success-soft: var(--fern-soft);
  --warning: #8a5a00;
  --warning-soft: #fff4dc;
  --danger: #b42318;
  --danger-soft: #fdeceb;
  --chart-1: #1e6b5c;
  --chart-2: #7fa99b;
  --chart-3: #b9b7ae;
  --chart-highlight: #ff5a1f;
  --shadow-pop: 0 4px 12px -2px #1c1c1a14, 0 2px 4px -2px #1c1c1a0f;
  --shadow-modal: 0 20px 48px -12px #1c1c1a2e, 0 4px 8px -4px #1c1c1a14;
  --focus-ring: 0 0 0 2px #ffffff, 0 0 0 4px #1e6b5c;
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
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 14px;
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
  --stagger: 70ms;
  --opacity-disabled: 0.45;
  --ease-reveal: cubic-bezier(.2, .7, 0, 1);
  --font-serif: "Instrument Serif", "Iowan Old Style", Georgia, serif;
  --font-sans: Onest, "SF Pro Text", "Segoe UI", system-ui, sans-serif;
  --font-mono: "Martian Mono", "JetBrains Mono", ui-monospace, Menlo, monospace;
}
.ui-page-title { font-family: var(--font-serif); font-size: 32px; line-height: 36px; font-weight: 400; letter-spacing: -0.01em; }
.ui-numeric { font-family: var(--font-serif); font-size: 36px; line-height: 40px; font-weight: 400; letter-spacing: -0.01em; font-variant-numeric: tabular-nums; }
.ui-heading { font-family: var(--font-sans); font-size: 16px; line-height: 24px; font-weight: 600; letter-spacing: -0.01em; }
.ui-subheading { font-family: var(--font-sans); font-size: 14px; line-height: 20px; font-weight: 600; }
.ui-body { font-family: var(--font-sans); font-size: 14px; line-height: 20px; font-weight: 400; }
.ui-body-lg { font-family: var(--font-sans); font-size: 16px; line-height: 24px; font-weight: 400; }
.ui-label { font-family: var(--font-sans); font-size: 13px; line-height: 18px; font-weight: 500; }
.ui-small { font-family: var(--font-sans); font-size: 12px; line-height: 16px; font-weight: 400; }
.ui-meta { font-family: var(--font-mono); font-size: 11px; line-height: 16px; font-weight: 400; }
.web-display { font-family: var(--font-serif); font-size: 88px; line-height: 84px; font-weight: 400; letter-spacing: -0.02em; }
.web-h1 { font-family: var(--font-serif); font-size: 56px; line-height: 58px; font-weight: 400; letter-spacing: -0.02em; }
.web-h2 { font-family: var(--font-serif); font-size: 40px; line-height: 44px; font-weight: 400; letter-spacing: -0.015em; }
.web-h3 { font-family: var(--font-sans); font-size: 20px; line-height: 28px; font-weight: 600; letter-spacing: -0.01em; }
.web-lead { font-family: var(--font-sans); font-size: 19px; line-height: 30px; font-weight: 400; }
.web-body { font-family: var(--font-sans); font-size: 17px; line-height: 28px; font-weight: 400; }
.web-eyebrow { font-family: var(--font-mono); font-size: 11px; line-height: 16px; font-weight: 400; }
/* Platform UI never animates: wrap the app in .fn-app */
.fn-app, .fn-app * { transition: none !important; animation: none !important; }
@media (max-width: 760px) { .web-display { font-size: 48px; line-height: 48px; } .web-h1 { font-size: 36px; line-height: 40px; } .web-h2 { font-size: 30px; line-height: 34px; } }
```

## components.css

```css
/* Field Notebook · components.css — reference styles for every component (.fn-* platform, shared by the website). Requires tokens.css. */
@import url("https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Onest:wght@400;500;600&family=Martian+Mono:wght@400;500&display=swap");
/* Field Notebook components. .fn-* = platform UI (no motion). .fw-* = website (motion allowed). */
body { margin: 0; font-family: var(--font-sans); font-size: 14px; line-height: 20px; color: var(--ink); background: var(--paper); -webkit-font-smoothing: antialiased; }
.fn-pad { padding: var(--space-5); }
.fn-row { display: flex; flex-wrap: wrap; align-items: center; gap: var(--space-3); }
.fn-col { display: grid; gap: var(--space-4); }
.fn-grid { display: grid; gap: var(--space-4); grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); }
.fn-meta { font-family: var(--font-mono); font-size: 11px; line-height: 16px; color: var(--graphite); }
.fn-mark { display: inline-block; width: var(--mark-size); height: var(--mark-size); background: var(--signal); flex: none; }
.fn-eyebrow { display: inline-flex; align-items: center; gap: var(--space-2); font-family: var(--font-mono); font-size: 11px; line-height: 16px; color: var(--graphite); }
.fn-eyebrow::before { content: ""; width: 6px; height: 6px; background: var(--signal); }
.fn-num { font-variant-numeric: tabular-nums; }
.fn-accent { font-family: var(--font-serif); font-style: italic; font-weight: 400; color: var(--fern); }
.fn-app, .fn-app * { transition: none !important; animation: none !important; }
:where(.fn-btn, .fn-input, .fn-select, .fn-textarea, .fn-tab, .fn-seg button, .fn-nav a, .fn-check input, .fn-toggle input):focus-visible { outline: 2px solid transparent; box-shadow: var(--focus-ring); }

/* Corner marks */
.fn-marked { position: relative; }
.fn-marked::before, .fn-marked::after { content: ""; position: absolute; width: 10px; height: 10px; border: 0 solid var(--rule-strong); pointer-events: none; }
.fn-marked::before { top: 6px; left: 6px; border-width: 1px 0 0 1px; }
.fn-marked::after { bottom: 6px; right: 6px; border-width: 0 1px 1px 0; }

/* Buttons */
.fn-btn { font: inherit; font-size: 13px; line-height: 18px; font-weight: 500; height: var(--control-md); padding: 0 var(--space-3); display: inline-flex; align-items: center; justify-content: center; gap: 6px; border-radius: var(--radius-sm); border: 1px solid transparent; cursor: pointer; white-space: nowrap; text-decoration: none; background: transparent; color: var(--ink); }
.fn-btn svg { width: var(--icon-md); height: var(--icon-md); }
.fn-btn-sm { height: var(--control-sm); padding: 0 10px; font-size: 12px; }
.fn-btn-lg { height: var(--control-lg); padding: 0 var(--space-4); font-size: 14px; }
.fn-btn-primary { background: var(--fern); color: var(--on-fern); }
.fn-btn-primary:hover { background: var(--fern-hover); }
.fn-btn-secondary { background: var(--white); border-color: var(--rule-strong); }
.fn-btn-secondary:hover { background: var(--linen); }
.fn-btn-ghost { color: var(--ink-secondary); }
.fn-btn-ghost:hover { background: var(--linen); color: var(--ink); }
.fn-btn-danger { background: var(--danger); color: #ffffff; }
.fn-btn[disabled] { opacity: var(--opacity-disabled); cursor: not-allowed; }
.fn-icon { fill: none; stroke: currentColor; stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; width: var(--icon-md); height: var(--icon-md); flex: none; }

/* Fields */
.fn-field { display: grid; gap: 6px; min-width: 0; }
.fn-label { font-size: 13px; line-height: 18px; font-weight: 500; color: var(--ink-secondary); }
.fn-input, .fn-select, .fn-textarea { font: inherit; font-size: 14px; width: 100%; box-sizing: border-box; height: var(--control-md); padding: 0 var(--space-3); border-radius: var(--radius-sm); border: 1px solid var(--rule-strong); background: var(--white); color: var(--ink); }
.fn-textarea { height: 88px; padding-block: 8px; resize: vertical; }
.fn-select { appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='none' stroke='%2364635e' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m4 6 4 4 4-4'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 10px center; padding-right: 34px; }
.fn-input::placeholder, .fn-textarea::placeholder { color: var(--placeholder); }
.fn-input:focus, .fn-select:focus, .fn-textarea:focus, .fn-input.is-focus { outline: none; border-color: var(--fern); box-shadow: var(--focus-ring); }
.fn-input.is-error { border-color: var(--danger); }
.fn-help { margin: 0; font-size: 12px; line-height: 16px; color: var(--graphite); }
.fn-help.is-error { color: var(--danger); }
.fn-check { display: inline-flex; align-items: center; gap: 10px; font-size: 14px; color: var(--ink-secondary); cursor: pointer; }
.fn-check input { appearance: none; margin: 0; width: 16px; height: 16px; border: 1px solid var(--rule-strong); border-radius: var(--radius-xs); background: var(--white); display: grid; place-items: center; cursor: pointer; }
.fn-check input:checked { background: var(--fern); border-color: var(--fern); }
.fn-check input:checked::after { content: ""; width: 4px; height: 8px; border: solid #ffffff; border-width: 0 2px 2px 0; transform: translateY(-1px) rotate(45deg); }
.fn-check input[type="radio"] { border-radius: 50%; }
.fn-check input[type="radio"]:checked { background: var(--white); border-color: var(--fern); }
.fn-check input[type="radio"]:checked::after { width: 8px; height: 8px; border: 0; border-radius: 50%; background: var(--fern); transform: none; }
.fn-toggle { display: inline-flex; align-items: center; gap: 10px; font-size: 14px; color: var(--ink-secondary); cursor: pointer; }
.fn-toggle input { appearance: none; margin: 0; width: 32px; height: 18px; border-radius: var(--radius-full); background: var(--rule-strong); position: relative; cursor: pointer; }
.fn-toggle input::after { content: ""; position: absolute; top: 2px; left: 2px; width: 14px; height: 14px; border-radius: 50%; background: #ffffff; }
.fn-toggle input:checked { background: var(--fern); }
.fn-toggle input:checked::after { left: 16px; }

/* Badges */
.fn-badge { display: inline-flex; align-items: center; gap: 6px; height: 22px; padding: 0 var(--space-2); border-radius: var(--radius-xs); font-size: 12px; line-height: 16px; font-weight: 500; background: var(--linen); color: var(--graphite); white-space: nowrap; }
.fn-badge.dot::before { content: ""; width: 6px; height: 6px; background: currentColor; }
.fn-badge-done { background: var(--fern-soft); color: var(--fern-text); }
.fn-badge-live { background: var(--signal-soft); color: var(--signal-text); }
.fn-badge-warn { background: var(--warning-soft); color: var(--warning); }
.fn-badge-fail { background: var(--danger-soft); color: var(--danger); }
.fn-badge-mono { font-family: var(--font-mono); font-size: 11px; font-weight: 400; background: var(--white); border: 1px solid var(--rule); color: var(--ink-secondary); }

/* Tabs and segmented */
.fn-tabs { display: flex; gap: var(--space-5); border-bottom: 1px solid var(--rule); }
.fn-tab { font: inherit; background: none; border: 0; padding: 0; height: 36px; font-family: var(--font-mono); font-size: 11px; color: var(--graphite); border-bottom: 2px solid transparent; margin-bottom: -1px; cursor: pointer; }
.fn-tab:hover { color: var(--ink); }
.fn-tab[aria-selected="true"] { color: var(--ink); border-bottom-color: var(--ink); }
.fn-seg { display: inline-flex; gap: 2px; padding: 3px; background: var(--linen); border-radius: var(--radius-sm); }
.fn-seg button { font: inherit; font-size: 13px; font-weight: 500; border: 1px solid transparent; background: none; color: var(--graphite); height: 28px; padding: 0 12px; border-radius: 4px; cursor: pointer; }
.fn-seg button[aria-pressed="true"] { background: var(--white); color: var(--ink); border-color: var(--rule); }

/* Cards and KPIs */
.fn-card { background: var(--white); border: 1px solid var(--rule); border-radius: var(--radius-md); padding: var(--space-5); min-width: 0; }
.fn-card-head { display: flex; justify-content: space-between; align-items: center; gap: var(--space-3); margin-bottom: var(--space-4); }
.fn-card-title { margin: 0; font-size: 16px; line-height: 24px; font-weight: 600; letter-spacing: -.01em; }
.fn-kpi-value { font-family: var(--font-serif); font-size: 36px; line-height: 40px; font-weight: 400; letter-spacing: -.01em; font-variant-numeric: tabular-nums; margin-top: var(--space-2); }
.fn-delta { font-size: 12px; line-height: 16px; font-weight: 500; color: var(--fern-text); margin-top: var(--space-1); }
.fn-delta.warn { color: var(--warning); } .fn-delta.down { color: var(--danger); }

/* Table */
.fn-table-wrap { background: var(--white); border: 1px solid var(--rule); border-radius: var(--radius-md); overflow-x: auto; }
.fn-table { width: 100%; border-collapse: collapse; font-size: 14px; }
.fn-table th { height: 36px; padding: 0 var(--space-3); text-align: left; background: var(--linen); border-bottom: 1px solid var(--rule); font-family: var(--font-mono); font-size: 11px; font-weight: 400; color: var(--graphite); white-space: nowrap; }
.fn-table td { height: var(--row-height); padding: 0 var(--space-3); border-bottom: 1px solid var(--rule); color: var(--ink-secondary); white-space: nowrap; }
.fn-table tbody tr:last-child td { border-bottom: 0; }
.fn-table tbody tr { cursor: pointer; }
.fn-table tbody tr:hover td { background: var(--paper); }
.fn-table tbody tr[aria-selected="true"] td { background: var(--fern-soft); }
.fn-table tbody tr[aria-selected="true"] td:first-child { box-shadow: inset 2px 0 0 var(--fern); }
.fn-table .r { text-align: right; font-variant-numeric: tabular-nums; }
.fn-table .strong { color: var(--ink); font-weight: 500; }
.fn-table .id { font-family: var(--font-mono); font-size: 11px; color: var(--graphite); }
.fn-table-foot { display: flex; justify-content: space-between; gap: var(--space-3); padding: 10px var(--space-3); border-top: 1px solid var(--rule); font-size: 12px; color: var(--graphite); }

/* App shell */
.fn-app { display: grid; grid-template-columns: var(--sidebar-width) minmax(0, 1fr); min-height: 640px; background: var(--white); font-size: 14px; }
.fn-side { background: var(--paper); border-right: 1px solid var(--rule); padding: var(--space-4) 10px; display: flex; flex-direction: column; gap: var(--space-5); }
.fn-brand { display: flex; align-items: center; gap: var(--space-2); padding: 0 6px; font-family: var(--font-serif); font-size: 20px; line-height: 24px; color: var(--ink); }
.fn-nav { display: grid; gap: 2px; }
.fn-nav .fn-meta { padding: 0 8px 6px; }
.fn-nav a { display: flex; align-items: center; gap: 10px; height: 30px; padding: 0 8px; border-radius: var(--radius-sm); font-size: 13px; font-weight: 500; color: var(--ink-secondary); text-decoration: none; cursor: pointer; }
.fn-nav a .fn-icon { color: var(--graphite); }
.fn-nav a:hover { background: var(--white); color: var(--ink); }
.fn-nav a[aria-current="page"] { background: var(--fern-soft); color: var(--fern-text); }
.fn-nav a[aria-current="page"] .fn-icon { color: var(--fern-text); }
.fn-nav .count { margin-left: auto; font-family: var(--font-mono); font-size: 10px; color: var(--graphite); }
.fn-main { min-width: 0; display: flex; flex-direction: column; }
.fn-top { height: var(--topbar-height); border-bottom: 1px solid var(--rule); display: flex; align-items: center; gap: var(--space-3); padding: 0 var(--space-6); }
.fn-top .fn-input { max-width: 320px; }
.fn-top .right { margin-left: auto; display: flex; gap: var(--space-2); align-items: center; }
.fn-avatar { width: 30px; height: 30px; border-radius: 50%; background: var(--paper); border: 1px solid var(--rule); display: grid; place-items: center; font-size: 11px; font-weight: 600; color: var(--ink-secondary); }
.fn-page { padding: var(--space-6); display: grid; gap: var(--space-6); max-width: var(--content-max); }
.fn-page-head { display: flex; justify-content: space-between; align-items: flex-end; gap: var(--space-4); flex-wrap: wrap; }
.fn-page-title { margin: 2px 0 0; font-family: var(--font-serif); font-size: 32px; line-height: 36px; font-weight: 400; letter-spacing: -.01em; }
.fn-page-sub { margin: var(--space-1) 0 0; color: var(--graphite); }

/* Modal, toast, banner, empty */
.fn-backdrop { background: rgba(28, 28, 26, .2); padding: var(--space-6); display: grid; place-items: center; }
.fn-modal { width: 100%; max-width: 440px; background: var(--white); border: 1px solid var(--rule); border-radius: var(--radius-lg); box-shadow: var(--shadow-modal); }
.fn-modal-head { display: flex; justify-content: space-between; gap: var(--space-3); padding: var(--space-5) var(--space-5) 0; }
.fn-modal-title { margin: 0; font-family: var(--font-serif); font-size: 24px; line-height: 30px; font-weight: 400; }
.fn-modal-body { padding: var(--space-5); display: grid; gap: var(--space-4); }
.fn-modal-foot { display: flex; justify-content: flex-end; gap: var(--space-2); padding: var(--space-4) var(--space-5); border-top: 1px solid var(--rule); }
.fn-toast { display: inline-flex; align-items: center; gap: var(--space-3); padding: 12px var(--space-4); background: var(--white); border: 1px solid var(--rule); border-radius: var(--radius-lg); box-shadow: var(--shadow-pop); font-weight: 500; }
.fn-toast .fn-icon { color: var(--fern); }
.fn-banner { display: flex; align-items: center; gap: var(--space-3); padding: 12px var(--space-4); border-radius: var(--radius-md); font-size: 14px; }
.fn-banner .grow { flex: 1; }
.fn-banner-warn { background: var(--warning-soft); color: var(--warning); }
.fn-banner-fail { background: var(--danger-soft); color: var(--danger); }
.fn-banner-info { background: var(--fern-soft); color: var(--fern-text); }
.fn-empty { position: relative; overflow: hidden; text-align: center; padding: var(--space-12) var(--space-6); background: var(--white); border: 1px solid var(--rule); border-radius: var(--radius-md); }
.fn-empty::before { content: ""; position: absolute; inset: 0; background-image: linear-gradient(var(--rule) 1px, transparent 1px), linear-gradient(90deg, var(--rule) 1px, transparent 1px); background-size: 32px 32px; opacity: .5; -webkit-mask-image: radial-gradient(circle at center, #000 0%, transparent 70%); mask-image: radial-gradient(circle at center, #000 0%, transparent 70%); }
.fn-empty > * { position: relative; }
.fn-empty .fn-icon { width: 20px; height: 20px; color: var(--graphite); }
.fn-empty h3 { margin: var(--space-3) 0 var(--space-1); font-size: 16px; line-height: 24px; font-weight: 600; }
.fn-empty p { margin: 0 auto var(--space-4); max-width: 40ch; color: var(--graphite); }
.fn-skel { background: var(--linen); border-radius: 4px; height: 12px; }

```

## motion.css (website only)

```css
/* Field Notebook · motion.css — WEBSITE ONLY. Never load inside the platform UI. Requires tokens.css. */
/* ---------------- Website ---------------- */
.fw { font-size: 17px; line-height: 28px; background: var(--paper); }
.fw-wrap { max-width: var(--site-max); margin: 0 auto; padding: 0 var(--space-6); }
.fw-nav { display: flex; align-items: center; justify-content: space-between; height: 72px; }
.fw-logo { display: flex; align-items: center; gap: var(--space-2); font-family: var(--font-serif); font-size: 22px; line-height: 28px; color: var(--ink); text-decoration: none; }
.fw-links { display: flex; align-items: center; gap: var(--space-6); font-size: 14px; font-weight: 500; color: var(--graphite); }
.fw-links a { color: inherit; text-decoration: none; transition: color 150ms ease-out; }
.fw-links a:hover { color: var(--ink); }
.fw-links a[aria-current="page"] { color: var(--ink); text-decoration: underline; text-underline-offset: 6px; text-decoration-thickness: 1px; }
.fw .fn-btn { transition: background-color 150ms ease-out; }
.fw .fn-btn .arr { display: inline-block; transition: transform 150ms ease-out; }
.fw .fn-btn:hover .arr, .fw-card:hover .arr { transform: translateX(3px); }
.fw-hero { position: relative; overflow: hidden; background: var(--white); border: 1px solid var(--rule); border-radius: var(--radius-lg); padding: var(--space-6) var(--space-8) var(--space-12); }
.fw-grid { position: absolute; inset: 0; background-image: linear-gradient(var(--rule) 1px, transparent 1px), linear-gradient(90deg, var(--rule) 1px, transparent 1px); background-size: 32px 32px; opacity: .55; -webkit-mask-image: linear-gradient(180deg, #000 0%, transparent 85%); mask-image: linear-gradient(180deg, #000 0%, transparent 85%); }
.fw-glow { position: absolute; right: -10%; top: -30%; width: 60%; aspect-ratio: 1; border-radius: 50%; background: radial-gradient(circle, rgba(30, 107, 92, .16), transparent 65%); }
.fw-marks { position: absolute; inset: 14px; pointer-events: none; }
.fw-marks i { position: absolute; width: 14px; height: 14px; border: 0 solid var(--rule-strong); }
.fw-marks i:nth-child(1) { top: 0; left: 0; border-width: 1px 0 0 1px; } .fw-marks i:nth-child(2) { top: 0; right: 0; border-width: 1px 1px 0 0; } .fw-marks i:nth-child(3) { bottom: 0; left: 0; border-width: 0 0 1px 1px; } .fw-marks i:nth-child(4) { bottom: 0; right: 0; border-width: 0 1px 1px 0; }
.fw-hero > .in { position: relative; }
.fw-hero .fn-eyebrow { margin: 72px 0 var(--space-4); }
.fw-display { margin: 0; font-family: var(--font-serif); font-weight: 400; font-size: 88px; line-height: 84px; letter-spacing: -.02em; max-width: 13ch; color: var(--ink); }
.fw-display em, .fw-h1 em, .fw-h2 em { font-style: italic; color: var(--fern); }
.fw-display .w { display: inline-block; }
.fw-lead { margin: var(--space-5) 0 var(--space-8); max-width: 44ch; font-size: 19px; line-height: 30px; color: var(--graphite); }
.fw-cta { display: flex; gap: var(--space-3); flex-wrap: wrap; }
.fw-sec-head { display: flex; justify-content: space-between; align-items: flex-end; gap: var(--space-4); flex-wrap: wrap; margin-bottom: var(--space-8); }
.fw-h1 { margin: var(--space-3) 0 0; font-family: var(--font-serif); font-weight: 400; font-size: 56px; line-height: 58px; letter-spacing: -.02em; }
.fw-h2 { margin: 0; font-family: var(--font-serif); font-weight: 400; font-size: 40px; line-height: 44px; letter-spacing: -.015em; }
.fw-cards { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: var(--space-6); }
.fw-card { display: flex; flex-direction: column; gap: var(--space-2); padding: var(--space-6); background: var(--white); border: 1px solid var(--rule); border-radius: var(--radius-md); text-decoration: none; color: var(--ink); min-width: 0; }
.fw-shot { aspect-ratio: 16/10; border-radius: var(--radius-sm); background: var(--paper); border: 1px solid var(--rule); margin-bottom: var(--space-3); padding: 12px; display: grid; gap: 8px; align-content: start; }
.fw-shot span { height: 8px; border-radius: 4px; background: var(--linen); }
.fw-card h3 { margin: 0; font-size: 20px; line-height: 28px; font-weight: 600; letter-spacing: -.01em; display: flex; justify-content: space-between; transition: color 150ms ease-out; }
.fw-card:hover h3 { color: var(--fern); }
.fw-card p { margin: 0; font-size: 15px; line-height: 24px; color: var(--graphite); }
.fw-card .tags { display: flex; gap: var(--space-2); flex-wrap: wrap; margin-top: var(--space-3); }
.fw-notes { display: grid; }
.fw-note { display: grid; grid-template-columns: 120px minmax(0, 1fr); gap: var(--space-4); padding: var(--space-5) 0; border-bottom: 1px solid var(--rule); text-decoration: none; color: var(--ink); }
.fw-note b { display: block; font-family: var(--font-serif); font-weight: 400; font-size: 24px; line-height: 30px; transition: color 150ms ease-out; }
.fw-note:hover b { color: var(--fern); }
.fw-note span { color: var(--graphite); font-size: 15px; }
@media (max-width: 760px) {
  .fw-display { font-size: 48px; line-height: 48px; } .fw-h1 { font-size: 36px; line-height: 40px; } .fw-h2 { font-size: 30px; line-height: 34px; }
  .fw-cards { grid-template-columns: 1fr; } .fw-links { display: none; } .fw-hero { padding: var(--space-5) var(--space-5) var(--space-10); }
  .fw-note { grid-template-columns: 1fr; gap: var(--space-1); }
  .fn-app { grid-template-columns: 1fr; } .fn-side { display: none; }
}
@media (prefers-reduced-motion: no-preference) {
  .fw-play .fw-grid { animation: fw-grid var(--duration-hero) ease-out both; }
  @keyframes fw-grid { from { opacity: 0; background-size: 48px 48px; } to { opacity: .55; background-size: 32px 32px; } }
  .fw-play .fw-glow { animation: fw-glow 1400ms ease-out both; }
  @keyframes fw-glow { from { opacity: 0; transform: scale(.8); } to { opacity: 1; transform: none; } }
  .fw-play .fw-display .w { animation: fw-rise 760ms cubic-bezier(.2,.7,0,1) both; animation-delay: calc(200ms + var(--i) * var(--stagger)); }
  @keyframes fw-rise { from { opacity: 0; transform: translateY(.4em); filter: blur(6px); } to { opacity: 1; transform: none; filter: none; } }
  .fw-play .fw-marks i { animation: fw-mark 500ms ease-out both 700ms; }
  @keyframes fw-mark { from { opacity: 0; transform: scale(1.8); } to { opacity: 1; transform: none; } }
  .fw-play .fn-eyebrow::before { animation: fw-pulse 1.2s ease-out 3 900ms; }
  @keyframes fw-pulse { 50% { box-shadow: 0 0 0 6px rgba(255, 90, 31, .18); } }
  .fw-fade.fw-in { animation: fw-up var(--duration-reveal) cubic-bezier(.2,.7,0,1) both; }
  @keyframes fw-up { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }
}
.fw-replay { position: absolute; z-index: 2; right: 20px; bottom: 20px; font-family: var(--font-mono); font-size: 11px; background: var(--white); border: 1px solid var(--rule); border-radius: var(--radius-full); padding: 6px 12px; cursor: pointer; color: var(--ink); }

/* Usage
   1. Hero markup: <header class="fw-hero" id="hero"><div class="fw-grid"></div><div class="fw-glow"></div>
      <div class="fw-marks"><i></i><i></i><i></i><i></i></div><div class="in">…<h1 class="fw-display">I build AI systems that <em>actually</em> ship.</h1>…</div></header>
   2. Split the headline into <span class="w" style="--i:N"> words, then add .fw-play to the hero once it is in view.
   3. Section titles: add .fw-fade; add .fw-in when they first enter the viewport.
   Everything is visible before and without the script; prefers-reduced-motion turns all of it off. */
```

## tailwind-theme.css (only if the project uses Tailwind v4)

```css
@import "tailwindcss";
/* Field Notebook · Tailwind v4 theme. Load tokens.css first. Light only. */
@theme inline {
  --color-paper: var(--paper);
  --color-white: var(--white);
  --color-linen: var(--linen);
  --color-rule: var(--rule);
  --color-rule-strong: var(--rule-strong);
  --color-ink: var(--ink);
  --color-ink-secondary: var(--ink-secondary);
  --color-graphite: var(--graphite);
  --color-placeholder: var(--placeholder);
  --color-fern: var(--fern);
  --color-fern-hover: var(--fern-hover);
  --color-fern-soft: var(--fern-soft);
  --color-fern-text: var(--fern-text);
  --color-on-fern: var(--on-fern);
  --color-signal: var(--signal);
  --color-signal-soft: var(--signal-soft);
  --color-signal-text: var(--signal-text);
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
  --font-serif: var(--font-serif);
  --font-sans: var(--font-sans);
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
  --text-ui-page-title: 32px;
  --text-ui-page-title--line-height: 36px;
  --text-ui-page-title--font-weight: 400;
  --text-ui-page-title--letter-spacing: -0.01em;
  --text-ui-numeric: 36px;
  --text-ui-numeric--line-height: 40px;
  --text-ui-numeric--font-weight: 400;
  --text-ui-numeric--letter-spacing: -0.01em;
  --text-ui-heading: 16px;
  --text-ui-heading--line-height: 24px;
  --text-ui-heading--font-weight: 600;
  --text-ui-heading--letter-spacing: -0.01em;
  --text-ui-subheading: 14px;
  --text-ui-subheading--line-height: 20px;
  --text-ui-subheading--font-weight: 600;
  --text-ui-body: 14px;
  --text-ui-body--line-height: 20px;
  --text-ui-body--font-weight: 400;
  --text-ui-body-lg: 16px;
  --text-ui-body-lg--line-height: 24px;
  --text-ui-body-lg--font-weight: 400;
  --text-ui-label: 13px;
  --text-ui-label--line-height: 18px;
  --text-ui-label--font-weight: 500;
  --text-ui-small: 12px;
  --text-ui-small--line-height: 16px;
  --text-ui-small--font-weight: 400;
  --text-ui-meta: 11px;
  --text-ui-meta--line-height: 16px;
  --text-ui-meta--font-weight: 400;
  --text-web-display: 88px;
  --text-web-display--line-height: 84px;
  --text-web-display--font-weight: 400;
  --text-web-display--letter-spacing: -0.02em;
  --text-web-h1: 56px;
  --text-web-h1--line-height: 58px;
  --text-web-h1--font-weight: 400;
  --text-web-h1--letter-spacing: -0.02em;
  --text-web-h2: 40px;
  --text-web-h2--line-height: 44px;
  --text-web-h2--font-weight: 400;
  --text-web-h2--letter-spacing: -0.015em;
  --text-web-h3: 20px;
  --text-web-h3--line-height: 28px;
  --text-web-h3--font-weight: 600;
  --text-web-h3--letter-spacing: -0.01em;
  --text-web-lead: 19px;
  --text-web-lead--line-height: 30px;
  --text-web-lead--font-weight: 400;
  --text-web-body: 17px;
  --text-web-body--line-height: 28px;
  --text-web-body--font-weight: 400;
  --text-web-eyebrow: 11px;
  --text-web-eyebrow--line-height: 16px;
  --text-web-eyebrow--font-weight: 400;
}
```

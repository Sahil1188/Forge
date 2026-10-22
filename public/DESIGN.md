# Design guideline — Field Notebook (Sahil Shaikh brand, Platform UI)

This console is **Platform UI** in the Field Notebook brand: warm paper, white working panels, serif titles,
one fern green to act, one small orange mark. **No animation. Light only.**
Tokens: `public/assets/tokens.css` (palette, radii, shadows and spacing verbatim from FIELD-NOTEBOOK.md Part 4).
Never hard-code colours, sizes or fonts: use the tokens.

## 1. Principles
1. Paper first. App canvas and sidebar on `paper`, every working panel on `white`. Never dark.
2. Serif speaks in titles only: page titles, KPI numbers, modal titles. Everything you read or click is Onest.
3. Precision in the margins: lowercase mono labels (breadcrumbs, tabs, column headers, KPI labels), the 8px signal square.
4. One green to act. `fern` marks the thing to do next; `signal` orange marks what is live. Nothing else is coloured.
5. Lines, not shadows. 1px `rule` separates areas; only menus, toasts and modals cast a shadow.
6. Nothing moves. The body carries `class="fn-app"`, which turns off every transition and animation.
7. Accessible: text 4.5:1, borders and indicators 3:1, focus ring (2px white + 2px fern) on every control.

## 2. Colour
`paper` #FAFAF7 · `white` #FFFFFF · `linen` #F3F3EF (hover, table header, soft fills) · `rule` #E6E5E0 ·
`rule-strong` #8D8C86 (inputs) · `ink` #1C1C1A · `ink-secondary` #3D3C38 · `graphite` #64635E · `placeholder` #72716B ·
`fern` #1E6B5C / `fern-hover` #185A4D / `fern-soft` #E4F1ED / `fern-text` #17574B · `signal` #FF5A1F /
`signal-soft` #FFF0E8 / `signal-text` #A8390C · `warning` #8A5A00 / `warning-soft` · `danger` #B42318 / `danger-soft`.
Charts: `chart-1` fern for bars, `chart-highlight` signal for the one value to notice (today).
Rules: one filled fern button per view. Signal is never text on white and never a button. Status always has a word.
No gradients. Never `ink` or `graphite` as a background.

## 3. Typography — Forge "large" scale
Instrument Serif (titles, numbers) · Onest (all UI text) · Martian Mono (labels, IDs, timestamps, code). Self-hosted
in `public/assets` because the console CSP only allows `'self'`.

The console runs about 15% larger than the guideline's default (14px body) so it reads comfortably. This is a
deliberate, owner-approved deviation; keep using the tokens rather than the guideline's raw numbers.

| Token | Size / line | Family | Use |
|---|---|---|---|
| page-title | 40 / 44 · 400 | serif | Page title, one per screen |
| numeric | 44 / 48 · 400 | serif | KPI values |
| modal-title | 30 / 36 · 400 | serif | Modal titles, wordmark |
| heading | 19 / 28 · 600 | Onest | Card, section, panel headings |
| subheading | 17 / 24 · 600 | Onest | Form group titles |
| body | **16 / 24 · 400** | Onest | **Default text** |
| body-lg | 18 / 28 · 400 | Onest | Page descriptions, empty states, composer |
| label | 15 / 22 · 500 | Onest | Labels, nav items, buttons |
| small | 14 / 20 · 400 | Onest | Help text, captions, badges |
| meta | 13 / 20 · 400 | mono | Lowercase labels, IDs, tabs, column headers |

Serif is always 400; Onest never above 600. Sentence case; mono labels lowercase; no ALL CAPS. Tabular numbers in tables.

## 4. Layout and spacing
4px grid. Sidebar 264px on `paper` with a 1px `rule` edge; top bar 64px on `white`; content on `white`, max 1280px,
32px top / 24px side padding, 24px between blocks. Controls 40px (32 sm, 46 lg), table rows 52px, icons 18px (22px in
empty states). Below 1024px the sidebar becomes a drawer.

## 5. Shape and depth
Radius: xs 3 (badges) · sm 6 (buttons, inputs, nav items) · md 10 (cards, tables, menus) · lg 14 (modals, panels,
toasts) · full (avatars, toggles). `shadow-pop` for menus and toasts, `shadow-modal` for modals and side panels.
Backdrop `ink` at 20%. Corner marks only on the onboarding card.

## 6. Components
Logo: signal square + "Forge" in serif. Buttons: primary fern fill, secondary white + `rule-strong` border, ghost no
border, danger fill. Inputs: `rule-strong` border, focus = fern border + focus ring. Badges: soft fill + strong text with a
6px square dot — done = fern, in progress = signal, needs attention = warning, failed = danger, other = linen.
Tabs: mono lowercase, active = ink text + 2px ink underline. Segmented filter: linen track, white active segment.
Sidebar item: hover white, active `fern-soft` + `fern-text`. Tables: linen header with mono labels, hover `paper`,
selected `fern-soft` with a 2px fern left edge. KPI: mono label, serif value, small delta. Empty state: faint 32px
drawing grid, icon, heading, one line, one primary button. Loading is a static "Loading…" label.

## 7. Writing
Buttons are verbs ("Create employee"); confirmations say what happened ("Employee created"). Errors say what went
wrong and how to fix it. Money "USD 1.25", dates "21 Oct 2026, 14:32". No exclamation marks, no emoji.

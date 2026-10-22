# `public/` — the Forge web console

Served by Forge itself at `/` (`forge serve`, then open http://localhost:3000). Plain ES modules,
no framework and no build step: ~60 KB total, no web fonts, no network calls except Forge's own API.
Ships in the npm package and works offline.

| File | Screen / role |
| --- | --- |
| `index.html` | Shell; strict CSP is set by the server (`UiController`). |
| `assets/app.js` | Router (hash), layout, event delegation, live refresh, side panel. |
| `assets/lib.js` | `html` auto-escaping template, API client, formatters. All API data is text, never markup. |
| `assets/home.js` | Composer (Task = one employee, Goal = CEO plans ≤3 steps, optional acceptance checks), numbers, recent work. |
| `assets/goals.js`, `goal.js` | Work list; one goal: items in run order, checks with output, runs + transcripts, approvals, retry/cancel, deliverable files. |
| `assets/team.js`, `employee.js` | Roster, add employee; profile, model, limits, skills, permissions, budget, memories, remove. |
| `assets/approvals.js`, `system.js`, `setup.js` | Approval inbox; what can run; first-run company + starter team. |

## Design notes

- **Tokens first** (`app.css` `:root`): neutral white/warm-grey surfaces, one ink for actions, one
  signal colour (ember) reserved for *running*. Dark mode follows the OS.
- **Ledger, not cards**: hairline rules, monospace for operational data (ids, models, money,
  durations), small square status markers always paired with a text label.
- **No motion** by design. Visible keyboard focus everywhere; phone layout below 860 px.
- One API request per screen (`/companies/:id/dashboard`, `/goals/:id/board`, …) keeps it fast.

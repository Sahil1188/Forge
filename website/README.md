# `website/` — the Forge website

One static page, `index.html`: what Forge does, how it works, the console, settings, safety, how to
start, and the full documentation in its Docs section (install, tutorials, the console, internals, CLI,
settings and API reference, troubleshooting). `docs.html` only forwards old links to that section. Plain HTML, CSS and small scripts (`site.js`, `demo.js`,
`docs.js`): no build step, no framework.

- Follows the **Field Notebook** brand (`brands/field-notebook.md`, Part 3 · Website).
  `tokens.css`, `components.css` and `motion.css` are copied from Part 4 exactly; `site.css` holds the
  page layout and uses tokens only.
- One motion moment (the hero sequence) plus section-title fade-ups and 150 ms hover responses; all of
  it is off with `prefers-reduced-motion`, and every element is readable before any script runs.
- `assets/` holds real screenshots of the Forge console.

Preview locally:

```bash
cd website && python -m http.server 4500    # then open http://127.0.0.1:4500
```

## Hosting on GitHub Pages

The workflow `.github/workflows/pages.yml` publishes this folder every time it changes on `main`.
One-time setup in the GitHub repository: **Settings → Pages → Source: GitHub Actions**. The site is then
at `https://<your-user>.github.io/<repository>/`. All paths are relative, so it works under that sub-path
and on a custom domain.

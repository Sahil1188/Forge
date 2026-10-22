import { badge, empty, html, icon, pageHead, progress, searchBox, when } from './lib.js';

export async function render(ctx) {
  return ctx.params.id ? project(ctx) : overview(ctx);
}

async function overview(ctx) {
  const rows = await ctx.api(`/companies/${ctx.company.id}/projects`);
  return html`${pageHead({
    title: 'Deliverables',
    desc: 'The finished code of each piece of work. Every project is its own git repository; passed work is merged into it.',
  })}
  ${rows.length
    ? html`<div style="display:flex;flex-direction:column;gap:var(--space-4)">
        <div style="display:flex;justify-content:flex-end">${searchBox('#projects-table', 'Filter projects')}</div>
        <div class="table-wrap" id="projects-table"><table class="table">
          <thead><tr><th>Project</th><th class="hide-sm">From</th><th>Status</th><th class="hide-sm">Steps</th><th class="hide-sm">Created</th><th></th></tr></thead>
          <tbody>${rows.map(
            (p) => html`<tr class="link" data-href="#/deliverables/${p.id}" data-text="${p.name} ${p.goalTitle}">
              <td class="primary"><span class="person">${icon('folder')}<a href="#/deliverables/${p.id}" style="color:inherit">${p.name}</a></span></td>
              <td class="clip hide-sm"><a href="#/work/${p.goalId}" class="secondary">${p.goalTitle}</a></td>
              <td>${badge(p.goalStatus)}</td>
              <td class="hide-sm">${progress(p.done, p.items)}</td>
              <td class="hide-sm">${when(p.createdAt)}</td>
              <td class="r muted">${icon('chevronRight')}</td>
            </tr>`,
          )}
          <tr class="no-match" hidden><td colspan="6" class="muted">No projects match that filter.</td></tr>
          </tbody></table></div></div>`
    : empty('folder', 'No deliverables yet', 'When work starts, its project repository shows up here with every file the team wrote.', html`<button class="btn btn-primary" data-action="new-task">${icon('plus')}New task</button>`)}`;
}

async function project(ctx) {
  const id = ctx.params.id;
  const [all, listing] = await Promise.all([ctx.api(`/companies/${ctx.company.id}/projects`), ctx.api(`/projects/${id}/files`)]);
  const p = all.find((x) => x.id === id) ?? { name: 'Project', goalTitle: '', goalId: null };
  const files = listing.files;
  const selected = ctx.query.get('file') ?? files.find((f) => /^readme/i.test(f)) ?? files[0];
  const file = selected && files.includes(selected) ? await ctx.api(`/projects/${id}/file?path=${encodeURIComponent(selected)}`) : null;

  return html`${pageHead({
    eyebrow: html`<a href="#/deliverables">Deliverables</a>`,
    title: p.name,
    desc: p.goalTitle && p.goalTitle !== p.name ? html`From <a href="#/work/${p.goalId}">${p.goalTitle}</a>` : html`<a href="#/work/${p.goalId}">View the work behind it</a>`,
    meta: html`<span class="help mono" style="word-break:break-all">${listing.path}</span>`,
  })}
  ${files.length
    ? html`<section class="card card-flush">
        <div class="files-layout">
          <nav class="file-list" aria-label="Files">${files.map(
            (f) => html`<a href="#/deliverables/${id}?file=${encodeURIComponent(f)}" ${f === selected ? html`aria-current="true"` : ''} title="${f}">${icon('file')}<span style="overflow:hidden;text-overflow:ellipsis">${f}</span></a>`,
          )}</nav>
          <div class="file-view">
            <div class="fh"><span>${selected}</span>${file
              ? html`<span style="display:flex;align-items:center;gap:var(--space-3)"><span class="muted num">${fmtSize(file.size)}</span>
                  <a class="btn btn-sm" href="/projects/${id}/download?path=${encodeURIComponent(selected)}" download>${icon('download')}Download</a></span>`
              : ''}</div>
            ${!file
              ? ''
              : file.binary
                ? empty('file', `${kindOf(selected)} file`, 'This file can’t be previewed here. Download it to open it in the right app.')
                : file.truncated
                  ? empty('file', 'Too large to preview', `${fmtSize(file.size)}. Download it to open it.`)
                  : html`<pre class="code">${file.content}</pre>`}
          </div>
        </div>
      </section>`
    : html`<section class="card">${empty('folder', 'No files yet', 'Files appear here as finished work is merged into the project.')}</section>`}`;
}

const KINDS = { xlsx: 'Excel', xls: 'Excel', docx: 'Word', pdf: 'PDF', pptx: 'PowerPoint', png: 'Image', jpg: 'Image', jpeg: 'Image', zip: 'Archive' };

function kindOf(name) {
  return KINDS[String(name).split('.').pop().toLowerCase()] ?? 'Binary';
}

function fmtSize(n) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

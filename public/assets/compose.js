import { goalFields, html, lines } from './lib.js';

/** The "New task" modal: one box for the instruction, Task vs Goal, optional acceptance checks. */
export async function openComposer(ctx, mode = 'task') {
  const brands = await ctx.api('/brands').catch(() => []);
  const companyBrand = brands.find((b) => b.slug === ctx.company.brand);
  ctx.openModal({
    title: 'New work',
    desc: 'Describe the outcome. Forge assigns it, builds it and checks it.',
    body: html`<form class="form composer" data-form="compose">
      <div class="seg" role="radiogroup" aria-label="Kind of work">
        <label><input type="radio" name="mode" value="task" ${mode !== 'goal' ? html`checked` : ''} /><span>Task</span></label>
        <label><input type="radio" name="mode" value="goal" ${mode === 'goal' ? html`checked` : ''} /><span>Goal</span></label>
      </div>
      <p class="help" style="margin-top:calc(-1 * var(--space-2))">A task goes straight to one employee. A goal is planned by your CEO into up to three steps.</p>
      <label class="field"><span>What should be done?</span>
        <textarea name="text" required maxlength="8000" placeholder="Build a CLI that converts CSV to JSON, with tests"></textarea></label>
      <label class="field"><span>Acceptance checks <span class="muted" style="font-weight:400">(optional)</span></span>
        <textarea name="checks" rows="3" style="font-family:var(--font-mono);font-size:var(--text-small)" placeholder="npm test&#10;node cli.js sample.csv"></textarea>
        <span class="help">One shell command per line. Each must pass in the project before the work is merged.</span></label>
      <label class="field"><span>Project folder <span class="muted" style="font-weight:400">(optional)</span></span>
        <input name="location" maxlength="500" placeholder="Default: your company's projects folder" style="font-family:var(--font-mono)" />
        <span class="help">A full path to a new or empty folder, for example C:\\Projects\\client-portal.</span></label>
      ${brands.length
        ? html`<label class="field"><span>Brand <span class="muted" style="font-weight:400">(for anything with a user interface)</span></span>
            <select name="brand"><option value="">${companyBrand ? `Company default: ${companyBrand.name}` : 'Best fit for the product'}</option>
              ${brands.map((b) => html`<option value="${b.slug}">${b.name}</option>`)}</select>
            <span class="help">Screens follow this brand system exactly: colours, type, components and CSS.</span></label>`
        : ''}
      <div class="form-foot">
        <button class="btn" type="button" data-action="close-overlay">Cancel</button>
        <button class="btn btn-primary" type="submit">Start work</button>
      </div>
    </form>`,
  });
}

export const composerForms = {
  async compose(data, form, ctx) {
    const text = String(data.text ?? '').trim();
    if (!text) return;
    const goal = await ctx.api(`/companies/${ctx.company.id}/goals`, {
      method: 'POST',
      body: {
        ...goalFields(text),
        mode: data.mode === 'goal' ? 'plan' : 'direct',
        acceptance: lines(data.checks),
        ...(String(data.location ?? '').trim() ? { location: String(data.location).trim() } : {}),
        ...(data.brand ? { brand: String(data.brand) } : {}),
        start: true,
      },
    });
    ctx.closeOverlay(true);
    ctx.go(`#/work/${goal.id}`);
  },
};

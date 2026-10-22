import { html, MODELS, toast } from './lib.js';

export async function render(ctx) {
  const first = ctx.companies.length === 0;
  return html`<div class="card">
    <div style="display:flex;flex-direction:column;gap:var(--space-2)">
      <span class="logo" style="padding:0;margin-bottom:var(--space-4)"><span class="mark" aria-hidden="true"></span><span class="wordmark">Forge</span></span>
      <h1 class="ui-page-title">${first ? 'Set up your company' : 'New company'}</h1>
      <p class="muted">A company is a team of AI employees that plans, builds and checks work on your Claude Code subscription.</p>
    </div>
    <form class="form" data-form="create">
      <label class="field"><span>Company name</span><input name="name" required maxlength="200" placeholder="Acme" autofocus /></label>
      <label class="field"><span>Models</span><select name="model">
          <option value="">Recommended: Opus for leaders, Sonnet for specialists</option>
          ${MODELS.map((m) => html`<option value="${m}">Everyone on ${m}</option>`)}</select>
        <span class="help">Recommended steps specialists up to Opus for complex work. One model for everyone is cheaper but less capable.</span></label>
      <label class="check"><input type="checkbox" name="starter" checked />Add the full team: an executive and senior specialists for every department</label>
      <div class="form-foot">${first ? '' : html`<a class="btn" href="#/">Cancel</a>`}<button class="btn btn-primary" type="submit">Create company</button></div>
    </form>
  </div>`;
}

export const forms = {
  async create(data, form, ctx) {
    const company = await ctx.api('/companies', { method: 'POST', body: { name: data.name } });
    if (data.starter) await ctx.api(`/companies/${company.id}/starter-team`, { method: 'POST', body: data.model ? { model: data.model } : {} });
    await ctx.reloadCompanies(company.id);
    toast(`${company.name} is ready`);
    ctx.go('#/');
  },
};

import { api, html } from './lib.js';

/** The sign-in screen, shown when accounts are on and nobody is signed in. */
export function renderSignIn(root, message = '') {
  root.innerHTML = html`<main class="onboard"><div class="card">
    <div style="display:flex;flex-direction:column;gap:var(--space-2)">
      <span class="logo" style="padding:0;margin-bottom:var(--space-4)"><span class="mark" aria-hidden="true"></span><span class="wordmark">Forge</span></span>
      <h1 class="ui-page-title">Sign in</h1>
      <p class="muted">Use the account your Forge owner set up for you.</p>
    </div>
    ${message ? html`<div class="notice danger"><span class="grow">${message}</span></div>` : ''}
    <form class="form" id="signin">
      <label class="field"><span>Email</span><input name="email" type="email" required autocomplete="username" autofocus /></label>
      <label class="field"><span>Password</span><input name="password" type="password" required autocomplete="current-password" /></label>
      <div class="form-foot"><button class="btn btn-primary" type="submit">Sign in</button></div>
    </form>
  </div></main>`.value;
  root.querySelector('#signin').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target));
    try {
      await api('/auth/login', { method: 'POST', body: { email: data.email, password: data.password } });
      location.reload();
    } catch (err) {
      renderSignIn(root, err.message);
    }
  });
}

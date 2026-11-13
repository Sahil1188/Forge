// "Try it": a simulation of the Forge goal board. It runs entirely in the browser and sends nothing.
(() => {
  const form = document.getElementById('demo-form');
  if (!form) return;
  const input = document.getElementById('demo-goal');
  const rows = document.getElementById('d-rows');
  const log = document.getElementById('d-log');
  const runBtn = document.getElementById('demo-run');
  const kpi = (id, v) => (document.getElementById(id).textContent = String(v));
  const quick = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const wait = (ms) => new Promise((r) => setTimeout(r, quick ? Math.min(ms, 120) : ms));
  const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  const esc = (t) => String(t).replace(/[&<>"']/g, (c) => ESC[c]);

  const STATUS = {
    queued: ['fn-badge', 'Queued'],
    building: ['fn-badge fn-badge-live dot', 'Building'],
    checking: ['fn-badge fn-badge-warn dot', 'Checking'],
    back: ['fn-badge fn-badge-fail dot', 'Sent back'],
    done: ['fn-badge fn-badge-done dot', 'Done'],
  };

  const plan = (goal) => {
    const thing = goal.replace(/^(a|an|the)\s+/i, '').replace(/\.$/, '');
    const ui = /site|page|app|tracker|planner|dashboard|portal|shop|store/i.test(goal);
    return [
      ['Contract: data model, API and project skeleton', 'Linus', 'src/contract'],
      [`Core features of ${thing}`, 'Grace', 'server/'],
      ui ? ['Screens and navigation in the brand', 'Nadia', 'web/screens'] : ['Command line and reports', 'Theo', 'cli/'],
      ['Seed data and a working demo', 'Kai', 'scripts/'],
      ['End-to-end tests and design review', 'Tom', 'tests/'],
      ['Independent production review', 'Ines', 'whole project'],
    ].map(([title, who, owns], i) => ({ n: i + 1, title, who, owns, status: 'queued' }));
  };

  const draw = (steps, shown = steps.length, fresh = -1) => {
    rows.innerHTML = steps
      .slice(0, shown)
      .map((s, i) => {
        const [cls, label] = STATUS[s.status];
        return `<tr class="${i === fresh ? 'new' : ''}"><td class="id">${String(s.n).padStart(2, '0')}</td><td class="step">${esc(s.title)}</td><td><span class="who"><span class="fn-avatar">${s.who[0]}</span>${s.who}</span></td><td class="id">${esc(s.owns)}</td><td><span class="${cls}">${label}</span></td></tr>`;
      })
      .join('');
    kpi('d-progress', `${steps.filter((s) => s.status === 'done').length} of ${steps.length}`);
    kpi('d-active', steps.filter((s) => s.status === 'building' || s.status === 'checking').length);
  };

  let running = false;
  const run = async (goal) => {
    if (running) return;
    running = true;
    runBtn.disabled = true;
    let checks = 0;
    let back = 0;
    kpi('d-checks', 0);
    kpi('d-back', 0);
    const steps = plan(goal);
    log.textContent = `the cto is planning "${goal}"…`;
    for (let i = 0; i < steps.length; i += 1) {
      await wait(260);
      draw(steps, i + 1, i);
    }
    draw(steps);
    log.textContent = `plan ready: ${steps.length} steps — a small contract first, then features in parallel`;
    const set = async (s, status, msg, ms) => {
      s.status = status;
      draw(steps);
      if (msg) log.textContent = msg;
      await wait(ms);
    };
    const checked = (n) => kpi('d-checks', (checks += n));

    await set(steps[0], 'building', 'linus builds the contract; the others start from it', 1100);
    await set(steps[0], 'checking', 'checking: lint, types, tests, build', 700);
    checked(4);
    await set(steps[0], 'done', 'contract merged into main — three steps start side by side', 500);

    const par = steps.slice(1, 4);
    par.forEach((s) => (s.status = 'building'));
    draw(steps);
    log.textContent = 'grace, nadia and kai build in parallel, each in their own folders';
    await wait(1500);
    for (const s of par) {
      s.status = 'checking';
      draw(steps);
      await wait(450);
    }
    checked(9);
    await set(par[1], 'back', `${par[1].who.toLowerCase()}'s work broke a check from step 01 — sent back with the evidence`, 300);
    kpi('d-back', (back += 1));
    await set(par[0], 'done', null, 250);
    await set(par[2], 'done', null, 900);
    await set(par[1], 'building', `${par[1].who.toLowerCase()} fixes it without undoing step 01`, 1100);
    await set(par[1], 'checking', null, 600);
    checked(5);
    await set(par[1], 'done', 'every earlier check passes again — merged', 500);

    await set(steps[4], 'building', 'tom runs the app end to end and screenshots every screen', 1100);
    await set(steps[4], 'checking', null, 500);
    checked(3);
    await set(steps[4], 'done', null, 400);
    await set(steps[5], 'building', 'ines reviews the whole project against the production standard', 1100);
    checked(2);
    await set(steps[5], 'done', `done — "${goal}" is in your projects folder, every step checked`, 0);
    running = false;
    runBtn.disabled = false;
  };

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    run(input.value.trim() || 'A booking site for my hair salon');
  });
  document.querySelectorAll('.chip').forEach((chip) =>
    chip.addEventListener('click', () => {
      if (running) return;
      input.value = chip.dataset.goal;
      run(chip.dataset.goal);
    }),
  );
})();

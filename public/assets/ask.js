import { ago, empty, esc, html, icon, pageHead, Safe, toast } from './lib.js';

const SUGGESTIONS = {
  goal: [
    'Where has this project reached, and what is left?',
    'Is anything stuck or failing right now? Why?',
    'What has been built so far, and how do I run it?',
    'Who is working on what, and what happens next?',
  ],
  company: [
    'Give me a status update on all our goals.',
    'Which goals need my attention?',
    'Who on the team is busy and who is free?',
    'How much have we spent, and on what?',
  ],
};

/** Questions in flight, kept across re-renders so the thread shows them while Forge thinks. */
const pending = new Map();

export async function render(ctx) {
  const goalId = ctx.query.get('goal') || '';
  const [dash, thread] = await Promise.all([
    ctx.api(`/companies/${ctx.company.id}/dashboard`),
    ctx.api(`/companies/${ctx.company.id}/ask${goalId ? `?goalId=${goalId}` : ''}`),
  ]);
  const goal = dash.goals.find((g) => g.id === goalId) ?? null;
  const waiting = pending.get(goalId || 'company');

  return html`${pageHead({
    title: 'Ask Forge',
    desc: 'Ask anything about your work: where a project is, what is left, why something failed, how to run what was built. Answers come from the live board and the project files, and asking never changes anything.',
  })}
  <div class="ask">
    <label class="field ask-scope"><span>Asking about</span>
      <select data-change="ask-scope" aria-label="Asking about">
        <option value="">The whole company</option>
        ${dash.goals.map((g) => html`<option value="${g.id}" ${g.id === goalId ? 'selected' : ''}>${g.title}</option>`)}
      </select></label>

    <div class="ask-thread" id="ask-thread" aria-live="polite">
      ${thread.length || waiting
        ? html`${thread.map(message)}${waiting ? html`${message({ role: 'user', content: waiting, createdAt: new Date() })}
            <div class="ask-msg assistant"><div class="ask-who">Forge</div><p class="muted">Reading the board and the project files…</p></div>` : ''}`
        : html`${empty('help', goal ? `Ask about ${goal.title}` : 'Ask about your company', 'Try one of these, or write your own below.')}
          <div class="ask-suggest">${SUGGESTIONS[goal ? 'goal' : 'company'].map(
            (q) => html`<button class="btn btn-sm" type="button" data-action="suggest" data-q="${q}">${q}</button>`,
          )}</div>`}
    </div>

    <form class="ask-form" data-form="ask">
      <textarea name="question" required minlength="2" maxlength="4000" rows="3" placeholder="${goal ? 'e.g. Why is the frontend not started yet?' : 'e.g. What is everyone working on?'}" aria-label="Your question" ${waiting ? 'disabled' : ''}></textarea>
      <div class="ask-foot"><span class="help">Enter to send · Shift+Enter for a new line</span>
        <button class="btn btn-primary" type="submit" ${waiting ? 'disabled' : ''}>${icon('help')}Ask</button></div>
    </form>
  </div>`;
}

function message(m) {
  const mine = m.role === 'user';
  return html`<div class="ask-msg ${mine ? 'user' : 'assistant'}">
    <div class="ask-who">${mine ? 'You' : 'Forge'}<span class="muted"> · ${ago(m.createdAt)}</span></div>
    ${mine ? html`<p>${m.content}</p>` : formatAnswer(m.content)}
  </div>`;
}

/** Light, safe formatting of an answer: paragraphs, bullet lists, **bold**, `code` and headings. */
export function formatAnswer(text) {
  const inline = (s) =>
    esc(s)
      .replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>')
      .replace(/&#96;([^&]+?)&#96;|`([^`]+)`/g, (_m, a, b) => `<code>${a ?? b}</code>`);
  const out = [];
  let list = null;
  const flush = () => {
    if (list) out.push(`<${list.tag}>${list.items.map((i) => `<li>${i}</li>`).join('')}</${list.tag}>`);
    list = null;
  };
  for (const raw of String(text ?? '').split('\n')) {
    const line = raw.trimEnd();
    const bullet = /^\s*[-*•]\s+(.*)$/.exec(line);
    const numbered = /^\s*\d+[.)]\s+(.*)$/.exec(line);
    const heading = /^#{1,4}\s+(.*)$/.exec(line);
    if (bullet || numbered) {
      const tag = bullet ? 'ul' : 'ol';
      if (list?.tag !== tag) flush();
      list ??= { tag, items: [] };
      list.items.push(inline((bullet ?? numbered)[1]));
    } else {
      flush();
      if (heading) out.push(`<h3>${inline(heading[1])}</h3>`);
      else if (line.trim()) out.push(`<p>${inline(line)}</p>`);
    }
  }
  flush();
  return new Safe(`<div class="ask-answer">${out.join('')}</div>`);
}

export const forms = {
  async ask(data, form, ctx) {
    const question = String(data.question ?? '').trim();
    if (!question) return;
    const goalId = ctx.query.get('goal') || '';
    const key = goalId || 'company';
    pending.set(key, question);
    ctx.refresh();
    try {
      await ctx.api(`/companies/${ctx.company.id}/ask`, {
        method: 'POST',
        body: { question, ...(goalId ? { goalId } : {}) },
      });
    } catch (err) {
      toast(err.message, 'bad');
    } finally {
      pending.delete(key);
      ctx.refresh();
    }
  },
};

export const actions = {
  suggest(el) {
    const box = document.querySelector('.ask-form textarea');
    if (!box) return;
    box.value = el.dataset.q;
    box.form.requestSubmit();
  },
};

/** Keeps the newest message in view and wires Enter-to-send. Called by the app after each render. */
export function mounted() {
  const thread = document.getElementById('ask-thread');
  if (thread) thread.scrollTop = thread.scrollHeight;
  const box = document.querySelector('.ask-form textarea');
  if (box && !box.dataset.wired) {
    box.dataset.wired = '1';
    box.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
        e.preventDefault();
        box.form.requestSubmit();
      }
    });
    if (!box.disabled) box.focus();
  }
}

export const changes = {
  'ask-scope'(el, ctx) {
    ctx.go(el.value ? `#/ask?goal=${el.value}` : '#/ask');
  },
};

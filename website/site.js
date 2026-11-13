// Forge website: the hero sequence, section title fade-ups, console tabs and copy buttons.
// Everything is readable without this script; prefers-reduced-motion turns the motion off in CSS.
(() => {
  // Hero: split the headline into words, then play the sequence once the hero is in view.
  const hero = document.getElementById('hero');
  const display = hero?.querySelector('.fw-display');
  if (display) {
    let i = 0;
    const split = (node) => {
      [...node.childNodes].forEach((child) => {
        if (child.nodeType === Node.TEXT_NODE) {
          const frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) return frag.append(part);
            const w = document.createElement('span');
            w.className = 'w';
            w.style.setProperty('--i', String(i++));
            w.textContent = part;
            frag.append(w);
          });
          child.replaceWith(frag);
        } else if (child.nodeType === Node.ELEMENT_NODE) {
          child.classList.add('w');
          child.style.setProperty('--i', String(i++));
        }
      });
    };
    split(display);
    requestAnimationFrame(() => hero.classList.add('fw-play'));
  }

  // Section titles fade up once when they first enter the viewport.
  const titles = document.querySelectorAll('.fw-fade');
  if ('IntersectionObserver' in window) {
    const seen = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('fw-in');
          seen.unobserve(e.target);
        }
      }),
      { rootMargin: '0px 0px -10% 0px' },
    );
    titles.forEach((t) => seen.observe(t));
  }

  // Sticky nav gets its rule once the page scrolls.
  const nav = document.querySelector('.nav-band');
  const onScroll = () => nav?.classList.toggle('scrolled', window.scrollY > 8);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Tabs (console tour and install), WAI-ARIA with arrow keys.
  document.querySelectorAll('[role="tablist"]').forEach((list) => {
    const tabs = [...list.querySelectorAll('[role="tab"]')];
    const select = (tab) => {
      tabs.forEach((t) => {
        const on = t === tab;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
      });
    };
    tabs.forEach((tab, idx) => {
      tab.addEventListener('click', () => select(tab));
      tab.addEventListener('keydown', (e) => {
        const step = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
        if (!step) return;
        e.preventDefault();
        const next = tabs[(idx + step + tabs.length) % tabs.length];
        select(next);
        next.focus();
      });
    });
  });

  // Copy buttons for the commands.
  document.querySelectorAll('.code .copy').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const text = btn.parentElement.querySelector('code').textContent;
      try {
        await navigator.clipboard.writeText(text);
        btn.textContent = 'Copied';
      } catch {
        const range = document.createRange();
        range.selectNodeContents(btn.parentElement.querySelector('code'));
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
        btn.textContent = 'Selected';
      }
      setTimeout(() => (btn.textContent = 'Copy'), 1600);
    });
  });
})();

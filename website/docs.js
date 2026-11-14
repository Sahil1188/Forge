// Docs page: search the contents, mark the section being read, filter the settings table.
(() => {
  const toc = document.getElementById('toc');
  if (!toc) return;
  const links = [...toc.querySelectorAll('a')];
  const sections = links.map((a) => document.getElementById(a.hash.slice(1))).filter(Boolean);

  // On phones the contents start folded, and fold again after a choice.
  const details = document.querySelector('.toc');
  const narrow = window.matchMedia('(max-width: 960px)');
  const fold = () => {
    if (narrow.matches) details.open = false;
  };
  fold();
  narrow.addEventListener('change', () => (details.open = !narrow.matches));
  links.forEach((a) => a.addEventListener('click', fold));

  // Search: matches the link text and the words in its section.
  const filter = document.getElementById('toc-filter');
  const empty = document.getElementById('toc-empty');
  const words = new Map(sections.map((s) => [s.id, s.textContent.toLowerCase()]));
  filter.addEventListener('input', () => {
    const q = filter.value.trim().toLowerCase();
    let shown = 0;
    links.forEach((a) => {
      const hit = !q || a.textContent.toLowerCase().includes(q) || (words.get(a.hash.slice(1)) ?? '').includes(q);
      a.hidden = !hit;
      if (hit) shown += 1;
    });
    toc.querySelectorAll('.toc-group').forEach((g) => {
      let n = g.nextElementSibling;
      let any = false;
      while (n && n.tagName === 'A') {
        if (!n.hidden) any = true;
        n = n.nextElementSibling;
      }
      g.hidden = !any;
    });
    empty.hidden = shown > 0;
  });
  filter.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter') return;
    const first = links.find((a) => !a.hidden);
    if (first) {
      e.preventDefault();
      first.click();
    }
  });

  // Mark the section being read: the last one whose top has passed under the sticky nav.
  let queued = false;
  const mark = () => {
    queued = false;
    let current = sections[0];
    for (const s of sections) {
      if (s.getBoundingClientRect().top <= 120) current = s;
      else break;
    }
    links.forEach((a) => a.classList.toggle('on', a.hash === `#${current.id}`));
  };
  const onScroll = () => {
    if (!queued) {
      queued = true;
      requestAnimationFrame(mark);
    }
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('hashchange', onScroll);
  mark();
  // A link straight to a section can land early, before images and fonts settle; land it again.
  window.addEventListener('load', () => {
    const target = location.hash && document.getElementById(location.hash.slice(1));
    if (target) target.scrollIntoView({ block: 'start', behavior: 'instant' });
    mark();
  });

  // Settings filter: a row matches by its text or its group's name; empty groups hide.
  const cfg = document.getElementById('cfg-filter');
  const rows = [...document.querySelectorAll('#cfg-table tbody tr')];
  cfg?.addEventListener('input', () => {
    const q = cfg.value.trim().toLowerCase();
    let group = null;
    let groupHit = false;
    const close = () => {
      if (group) group.hidden = !groupHit;
    };
    rows.forEach((r) => {
      if (r.querySelector('.grp')) {
        close();
        group = r;
        groupHit = false;
        return;
      }
      const inGroup = group ? group.textContent.toLowerCase().includes(q) : false;
      const hit = !q || inGroup || r.textContent.toLowerCase().includes(q);
      r.hidden = !hit;
      if (hit) groupHit = true;
    });
    close();
  });
})();

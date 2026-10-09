// About page: a highlighter-pen effect that follows the reading. Each
// paragraph has one span.hl; the one in the paragraph at the reading
// line (which moves down the text as you scroll) is switched on, and the
// rest are off. Scrolling to another paragraph wipes the old one out and
// sweeps the new one in (the animation itself is CSS, see style.css).
(() => {
  const marks = Array.from(document.querySelectorAll('.about-text .hl'));
  if (!marks.length) return;
  const paras = marks.map((m) => m.closest('p'));
  let current = -1;

  function setActive(i) {
    if (i === current) return;
    if (current >= 0) marks[current].classList.remove('is-on');
    marks[i].classList.add('is-on');
    current = i;
  }

  // Where the "reading line" sits on the page, in document coordinates.
  // It's tied to scroll progress, from the middle of the first paragraph
  // at the top of the page to the middle of the last one at the bottom,
  // so the first paragraph is highlighted on arrival, the last one at the
  // end, and the others take turns evenly in between however tall the
  // window is or short the page.
  function pick() {
    const top = window.scrollY;
    const mid = (p) => { const r = p.getBoundingClientRect(); return top + r.top + r.height / 2; };
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const progress = maxScroll > 0 ? Math.min(1, Math.max(0, top / maxScroll)) : 0;
    const first = mid(paras[0]);
    const line = first + (mid(paras[paras.length - 1]) - first) * progress;
    let best = 0;
    let bestDist = Infinity;
    paras.forEach((p, i) => {
      const r = p.getBoundingClientRect();
      const t = top + r.top;
      const b = top + r.bottom;
      // Inside the paragraph counts as distance 0; otherwise how far the
      // line is from its nearest edge.
      const d = line >= t && line <= b ? 0 : Math.min(Math.abs(line - t), Math.abs(line - b));
      if (d < bestDist) { bestDist = d; best = i; }
    });
    setActive(best);
  }

  // Throttled with a timer rather than requestAnimationFrame, which a
  // backgrounded tab can stall.
  let timer = null;
  const queue = () => { if (!timer) timer = setTimeout(() => { timer = null; pick(); }, 60); };
  window.addEventListener('scroll', queue, { passive: true });
  window.addEventListener('resize', queue);
  // The first highlight waits a beat after load so its sweep is seen.
  setTimeout(pick, 600);
})();

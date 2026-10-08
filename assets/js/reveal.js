// Scroll-in reveal for case study images. Opt-in per page: add
// data-reveal-images to <body>. Each image waits until it's scrolled
// near view and loaded, then fades in while drifting up a short way
// (see .is-revealed in case-study.css). Images sharing a row stagger
// left to right.
//
// The hidden starting state only applies once this script has added
// .reveal-ready to <html>, so with JS off (or if it fails) every image
// simply shows as normal. Reduced-motion users skip the effect entirely.
(() => {
  if (!document.body || !document.body.hasAttribute('data-reveal-images')) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const images = Array.from(document.querySelectorAll('main img'));
  if (!images.length) return;

  // Stagger siblings within the same grid/row; a lone image gets none.
  images.forEach((img) => {
    const row = img.parentElement;
    const siblings = Array.from(row.children).filter((el) => el.tagName === 'IMG');
    const i = siblings.indexOf(img);
    if (siblings.length > 1 && i > 0) img.style.setProperty('--reveal-delay', `${Math.min(i, 8) * 70}ms`);
  });

  document.documentElement.classList.add('reveal-ready');

  const reveal = (img) => {
    const show = () => img.classList.add('is-revealed');
    // Wait for the pixels, so the wipe never plays over a blank box. A
    // failed load still reveals (the alt text), rather than a hole.
    if (img.complete) show();
    else {
      img.addEventListener('load', show, { once: true });
      img.addEventListener('error', show, { once: true });
    }
  };

  // Position checks on scroll (via getBoundingClientRect), throttled to
  // every ~50ms with a timer rather than requestAnimationFrame, which a
  // backgrounded tab can stall (leaving images stuck hidden).
  let pending = images.slice();
  let timer = null;
  const check = () => {
    timer = null;
    const line = window.innerHeight * 0.95;
    pending = pending.filter((img) => {
      const r = img.getBoundingClientRect();
      if (r.top < line && r.bottom > 0) { reveal(img); return false; }
      return true;
    });
    if (!pending.length) {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    }
  };
  const onScroll = () => {
    if (!timer) timer = setTimeout(check, 50);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  check();
})();

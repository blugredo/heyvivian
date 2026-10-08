// Tap-to-enlarge for case study images. Any content image in <main>
// opens full screen over a dark backdrop; tap the backdrop, the close
// button or press Escape to close. Prev/next buttons, the arrow keys and
// a horizontal swipe step through every image on the page in order.
// Decorative images (empty alt) are left alone.
(() => {
  const images = Array.from(document.querySelectorAll('main img'))
    .filter((img) => img.getAttribute('alt'));
  if (!images.length) return;

  const box = document.createElement('div');
  box.className = 'lb';
  box.setAttribute('role', 'dialog');
  box.setAttribute('aria-modal', 'true');
  box.setAttribute('aria-label', 'Image viewer');
  box.hidden = true;
  box.innerHTML = `
    <img class="lb-img" alt="">
    <p class="lb-caption"></p>
    <button class="lb-btn lb-close" type="button" aria-label="Close">&times;</button>
    <button class="lb-btn lb-prev" type="button" aria-label="Previous image">&lsaquo;</button>
    <button class="lb-btn lb-next" type="button" aria-label="Next image">&rsaquo;</button>`;
  document.body.appendChild(box);
  const view = box.querySelector('.lb-img');
  const caption = box.querySelector('.lb-caption');
  const closeBtn = box.querySelector('.lb-close');

  let index = 0;
  let lastFocus = null;

  function show(i) {
    index = (i + images.length) % images.length;
    const img = images[index];
    view.src = img.currentSrc || img.src;
    view.alt = img.alt;
    caption.textContent = `${index + 1} / ${images.length}`;
  }
  function open(i) {
    lastFocus = document.activeElement;
    show(i);
    box.hidden = false;
    document.documentElement.classList.add('lb-lock');
    requestAnimationFrame(() => box.classList.add('is-open'));
    closeBtn.focus({ preventScroll: true });
  }
  function close() {
    box.classList.remove('is-open');
    document.documentElement.classList.remove('lb-lock');
    setTimeout(() => { box.hidden = true; }, 250);
    if (lastFocus) lastFocus.focus({ preventScroll: true });
  }

  images.forEach((img, i) => {
    img.classList.add('lb-target');
    img.setAttribute('tabindex', '0');
    img.setAttribute('role', 'button');
    img.addEventListener('click', () => open(i));
    img.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(i); }
    });
  });

  box.querySelector('.lb-prev').addEventListener('click', (e) => { e.stopPropagation(); show(index - 1); });
  box.querySelector('.lb-next').addEventListener('click', (e) => { e.stopPropagation(); show(index + 1); });
  closeBtn.addEventListener('click', close);
  // Tapping the backdrop closes; tapping the image itself does not.
  box.addEventListener('click', (e) => { if (e.target === box) close(); });
  document.addEventListener('keydown', (e) => {
    if (box.hidden) return;
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowLeft') show(index - 1);
    else if (e.key === 'ArrowRight') show(index + 1);
  });

  // Horizontal swipe to step; a mostly-vertical drag is ignored.
  let sx = 0; let sy = 0;
  box.addEventListener('touchstart', (e) => {
    if (e.touches.length !== 1) return;
    sx = e.touches[0].clientX; sy = e.touches[0].clientY;
  }, { passive: true });
  box.addEventListener('touchend', (e) => {
    const t = e.changedTouches[0];
    const dx = t.clientX - sx; const dy = t.clientY - sy;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) show(index + (dx < 0 ? 1 : -1));
  }, { passive: true });
})();

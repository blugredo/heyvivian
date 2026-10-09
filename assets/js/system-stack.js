// System snapshots: three floating cards in a fanned stack.
//   - The card in front flips over when tapped, showing how it works.
//   - A card behind it (the slightly tilted ones) comes forward when
//     tapped, swapping places with the one that was in front.
//   - Dragging the front card sideways (or the arrow keys) steps through
//     the deck: left for the next card, right for the previous.
// Slots live in data-slot (0 front, 1 back-left, 2 back-right); the CSS
// in draft-serif.css maps each slot to a position, tilt and layer.
(() => {
  const stage = document.querySelector('.sys-stage');
  if (!stage) return;
  const cards = Array.from(stage.querySelectorAll('.sys-card'));
  if (cards.length < 2) return;

  // order[0] is the front card, order[1] back-left, order[2] back-right.
  const order = cards.slice();
  const text = (card, sel) => card.querySelector(sel).textContent.trim();

  function paint() {
    order.forEach((card, slot) => {
      card.dataset.slot = String(slot);
      const title = text(card, '.sys-back .sys-title');
      const line = card.dataset.line.replace(/&rsquo;/g, '’');
      const note = card.dataset.note;
      // role="button" hides a card's inner text from screen readers, so the
      // label carries what's on whichever face is showing.
      card.setAttribute('aria-label', slot !== 0
        ? `${title}. Tap to bring to the front.`
        : card.classList.contains('is-flipped')
          ? `${title}. ${note} Tap to flip back.`
          : `${title}. ${line} Tap to flip.`);
    });
  }

  function bringToFront(card) {
    const i = order.indexOf(card);
    if (i <= 0) return;
    const old = order[0];
    order[0] = card;
    order[i] = old;
    // Whatever was flipped turns back over as it goes behind.
    cards.forEach((c) => c.classList.remove('is-flipped'));
    paint();
  }

  function activate(card) {
    if (order[0] === card) {
      card.classList.toggle('is-flipped');
      paint();
    } else {
      bringToFront(card);
    }
  }

  // Step through the deck: +1 brings the next card forward (the front
  // card goes to the back of the line), -1 the previous one.
  function step(dir) {
    if (dir > 0) order.push(order.shift());
    else order.unshift(order.pop());
    cards.forEach((c) => c.classList.remove('is-flipped'));
    paint();
  }

  // Drag (or swipe) the front card sideways to go to the next card: it
  // follows the finger with a little tilt, and past a short distance (or
  // a quick flick) the deck advances; otherwise it springs back. Left
  // goes to the next card, right to the previous. Vertical drags are
  // left to the page (touch-action: pan-y in the CSS), and a drag
  // swallows the click that would follow it.
  const DRAG_MIN = 8;      // px before a gesture counts as a drag
  const COMMIT_DIST = 56;  // px of travel that commits to the next card
  const COMMIT_SPEED = 0.45; // px/ms flick that commits on a shorter drag
  let drag = null;
  let swallowClick = false;

  function setDrag(card, dx) {
    card.style.setProperty('--dx', `${dx}px`);
    card.style.setProperty('--drot', `${Math.max(-12, Math.min(12, dx * 0.06))}deg`);
  }
  function clearDrag(card) {
    card.classList.remove('is-dragging');
    card.style.removeProperty('--dx');
    card.style.removeProperty('--drot');
  }

  stage.addEventListener('pointerdown', (e) => {
    const card = e.target.closest('.sys-card');
    if (!card || card !== order[0] || (e.pointerType === 'mouse' && e.button !== 0)) return;
    drag = { card, id: e.pointerId, x0: e.clientX, y0: e.clientY, dx: 0, moved: false, t0: performance.now() };
  });
  stage.addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const dx = e.clientX - drag.x0;
    const dy = e.clientY - drag.y0;
    if (!drag.moved) {
      if (Math.abs(dx) < DRAG_MIN || Math.abs(dx) < Math.abs(dy) * 1.2) return;
      drag.moved = true;
      drag.card.classList.add('is-dragging');
      try { drag.card.setPointerCapture(e.pointerId); } catch (err) { /* not capturable */ }
    }
    drag.dx = dx;
    setDrag(drag.card, dx);
  });
  function endDrag(e, cancelled) {
    if (!drag || e.pointerId !== drag.id) return;
    const { card, dx, moved, t0 } = drag;
    drag = null;
    if (!moved) return;
    swallowClick = true;
    setTimeout(() => { swallowClick = false; }, 80);
    const speed = Math.abs(dx) / Math.max(1, performance.now() - t0);
    const commit = !cancelled && (Math.abs(dx) >= COMMIT_DIST || (Math.abs(dx) > 24 && speed >= COMMIT_SPEED));
    clearDrag(card); // the CSS transition carries it to wherever it lands
    if (commit) step(dx < 0 ? 1 : -1);
  }
  stage.addEventListener('pointerup', (e) => endDrag(e, false));
  stage.addEventListener('pointercancel', (e) => endDrag(e, true));

  cards.forEach((card) => {
    card.addEventListener('click', () => { if (!swallowClick) activate(card); });
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activate(card); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); step(1); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1); }
    });
  });
  paint();
})();

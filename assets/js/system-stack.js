// System snapshots: three floating cards in a fanned stack.
//   - The card in front flips over when tapped, showing how it works.
//   - A card behind it (the slightly tilted ones) comes forward when
//     tapped, swapping places with the one that was in front.
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
      const title = text(card, '.sys-front .sys-title');
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

  cards.forEach((card) => {
    card.addEventListener('click', () => activate(card));
    card.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      e.preventDefault();
      activate(card);
    });
  });
  paint();
})();

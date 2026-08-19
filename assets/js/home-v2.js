// Drag-to-scroll for the work-samples row. No visible scrollbar — desktop
// mouse users click-and-drag horizontally; touch/trackpad already scrolls
// natively and is left alone (we only hook mouse pointer events).
document.addEventListener('DOMContentLoaded', () => {
  const row = document.querySelector('.v2-card-row');
  if (!row) return;

  // Defensive: force the row to start unscrolled so its left padding is
  // always visible on load, regardless of any browser scroll-restoration
  // quirks.
  row.scrollLeft = 0;

  const DRAG_THRESHOLD = 8; // px of real movement before we treat it as a drag

  let isDown = false;
  let isDragging = false; // only becomes true once past DRAG_THRESHOLD
  let justDragged = false; // true for the click immediately following a drag
  let startX = 0;
  let startScroll = 0;

  row.addEventListener('mousedown', (e) => {
    isDown = true;
    isDragging = false;
    startX = e.pageX;
    startScroll = row.scrollLeft;
  });

  window.addEventListener('mouseup', () => {
    if (!isDown) return;
    isDown = false;
    if (isDragging) {
      justDragged = true;
      row.classList.remove('dragging');
      // Clear the flag after this click has had a chance to read it.
      setTimeout(() => { justDragged = false; }, 0);
    }
    isDragging = false;
  });

  window.addEventListener('mousemove', (e) => {
    if (!isDown) return;
    const dx = e.pageX - startX;
    if (!isDragging) {
      // Don't do anything — including scrolling — until real drag distance
      // is reached. This is what makes an ordinary click immune to a few
      // pixels of natural mouse/trackpad jitter between mousedown/mouseup.
      if (Math.abs(dx) <= DRAG_THRESHOLD) return;
      isDragging = true;
      row.classList.add('dragging');
    }
    row.scrollLeft = startScroll - dx;
  });

  // Click-to-expand: a real click (not the tail end of a drag) toggles a
  // card open/closed. Only one card is open at a time. The close (←)
  // button always collapses regardless of what else is open.
  const cards = Array.from(document.querySelectorAll('.v2-card'));

  // Matches --liquid-duration in home-v2.css — kept as one shared number so
  // the scroll and the card's own width transition move as one motion
  // instead of a "grow, then jump" two-step.
  const LIQUID_MS = 700;
  // CSS open width breakpoint (see the max-width:640px block in home-v2.css).
  function openCardWidth() { return window.innerWidth <= 640 ? 460 : 688; }

  function easeOutExpo(t) { return t === 1 ? 1 : 1 - Math.pow(2, -10 * t); }

  function animateScrollLeft(el, target, duration) {
    const start = el.scrollLeft;
    const change = target - start;
    if (Math.abs(change) < 1) return;
    const startTime = performance.now();
    function step(now) {
      const t = Math.min(1, (now - startTime) / duration);
      el.scrollLeft = start + change * easeOutExpo(t);
      if (t < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  function closeCard(card) {
    card.classList.remove('is-open');
    card.setAttribute('aria-expanded', 'false');
  }
  function openCard(card) {
    cards.forEach((c) => { if (c !== card) closeCard(c); });

    // Compute the scroll target BEFORE the width changes, using the known
    // final open width — then kick off the card's grow (CSS transition)
    // and the row's scroll (JS-animated, same duration/easing) in the same
    // tick, so they read as one continuous motion rather than sequential.
    const rowRect = row.getBoundingClientRect();
    const cardRectNow = card.getBoundingClientRect();
    const cardLeft = row.scrollLeft + (cardRectNow.left - rowRect.left);
    const finalWidth = openCardWidth();
    const cardRight = cardLeft + finalWidth;
    const widthGrowth = finalWidth - cardRectNow.width;
    const maxScroll = row.scrollWidth - row.clientWidth + widthGrowth;

    let target;
    if (finalWidth <= rowRect.width) {
      target = cardLeft - (rowRect.width - finalWidth) / 2;
    } else {
      target = cardLeft;
    }
    target = Math.min(Math.max(0, target), Math.max(0, maxScroll));
    if (cardRight - target > rowRect.width) {
      target = Math.min(cardRight - rowRect.width, maxScroll);
    }

    card.classList.add('is-open');
    card.setAttribute('aria-expanded', 'true');
    animateScrollLeft(row, target, LIQUID_MS);
  }

  row.addEventListener('click', (e) => {
    if (justDragged) { e.preventDefault(); e.stopPropagation(); return; }

    const closeBtn = e.target.closest('.v2-card-close');
    const card = e.target.closest('.v2-card');
    if (!card) return;

    if (closeBtn) {
      closeCard(card);
      return;
    }
    if (card.classList.contains('is-open')) {
      closeCard(card);
    } else {
      openCard(card);
    }
  });

  row.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const card = e.target.closest('.v2-card');
    if (!card) return;
    e.preventDefault();
    card.classList.contains('is-open') ? closeCard(card) : openCard(card);
  });
});

// ---------------------------------------------------------------------
// Liquid dot circle — an interactive field of soft dots inside the
// callout circle. Each dot idles with a gentle sinusoidal bob, and drifts
// toward the cursor with spring physics when it's nearby, then eases
// back — a small mesmerizing "liquid" moment rather than a static shape.
// ---------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('liquidCircle');
  if (!canvas || !canvas.getContext) return;

  const cssSize = 260;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = cssSize * dpr;
  canvas.height = cssSize * dpr;
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);

  const R = cssSize / 2;
  const center = { x: R, y: R };

  // Build a hex-ish grid of dots clipped to the circle.
  const dots = [];
  const spacing = 21;
  const rows = Math.ceil((cssSize) / spacing) + 2;
  for (let row = -rows / 2; row < rows / 2; row++) {
    const rowOffset = (Math.round(row) % 2 === 0) ? 0 : spacing / 2;
    for (let col = -rows / 2; col < rows / 2; col++) {
      const x = center.x + col * spacing + rowOffset;
      const y = center.y + row * spacing * 0.87;
      const dist = Math.hypot(x - center.x, y - center.y);
      if (dist > R - 6) continue;
      dots.push({
        baseX: x, baseY: y,
        x, y,
        vx: 0, vy: 0,
        phase: Math.random() * Math.PI * 2,
        speed: 0.6 + Math.random() * 0.5,
        distFromCenter: dist / R, // 0 (center) .. 1 (edge)
        radius: 2.2 + (1 - dist / R) * 1.6,
      });
    }
  }

  let pointer = null; // {x, y} in canvas-local coords, or null when not hovering
  let targetPointer = null;
  let isDragging = false;

  function localPos(e) {
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  canvas.addEventListener('mousedown', (e) => {
    isDragging = true;
    targetPointer = localPos(e);
    pointer = { ...targetPointer }; // grab immediately, no easing lag on grab
  });
  window.addEventListener('mouseup', () => { isDragging = false; });
  canvas.addEventListener('mousemove', (e) => { targetPointer = localPos(e); });
  canvas.addEventListener('mouseleave', () => { if (!isDragging) targetPointer = null; });

  canvas.addEventListener('touchstart', (e) => {
    const t = e.touches[0];
    if (!t) return;
    isDragging = true;
    targetPointer = { x: t.clientX - canvas.getBoundingClientRect().left, y: t.clientY - canvas.getBoundingClientRect().top };
    pointer = { ...targetPointer };
  }, { passive: true });
  canvas.addEventListener('touchmove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const t = e.touches[0];
    if (!t) return;
    targetPointer = { x: t.clientX - rect.left, y: t.clientY - rect.top };
  }, { passive: true });
  canvas.addEventListener('touchend', () => { isDragging = false; targetPointer = null; });

  const INTERACT_R = 78;      // ambient hover glow/pull radius
  const DRAG_R = 190;         // much wider reach while actively dragging
  // Two spring "moods": a taut one while the mouse is grabbing a dot (so
  // it stretches but still resists), and a bouncier, lower-damping one
  // for the moment it's released — that's the "splash" snap back.
  const STIFFNESS_HELD = 0.16;
  const DAMPING_HELD = 0.78;
  const STIFFNESS_RELEASE = 0.42;
  const DAMPING_RELEASE = 0.68;

  function frame(t) {
    // Ease the tracked pointer itself when just hovering (fluid glow) —
    // but while actively dragging, follow the real cursor 1:1 so the
    // stretch feels directly grabbed, not laggy.
    if (targetPointer) {
      pointer = isDragging
        ? { ...targetPointer }
        : (pointer ? { x: pointer.x + (targetPointer.x - pointer.x) * 0.25, y: pointer.y + (targetPointer.y - pointer.y) * 0.25 } : { ...targetPointer });
    } else if (pointer) {
      pointer = null;
    }

    ctx.clearRect(0, 0, cssSize, cssSize);

    for (const d of dots) {
      // Idle bob: a small organic drift around the base position.
      const bobX = Math.sin(t * 0.001 * d.speed + d.phase) * 2.2;
      const bobY = Math.cos(t * 0.0013 * d.speed + d.phase) * 2.2;
      let tx = d.baseX + bobX;
      let ty = d.baseY + bobY;

      let glow = 0;
      if (pointer) {
        const reach = isDragging ? DRAG_R : INTERACT_R;
        const dx = pointer.x - d.baseX;
        const dy = pointer.y - d.baseY;
        const dist = Math.hypot(dx, dy);
        if (dist < reach) {
          const pull = (1 - dist / reach);
          // Dragging stretches dots much further toward the cursor than a
          // passive hover glow does.
          const strength = isDragging ? pull * pull * 0.92 : pull * 0.35;
          tx += dx * strength;
          ty += dy * strength;
          glow = pull;
        }
      }

      // Spring the actual position toward the (bobbing/pulled) target —
      // taut while held, bouncier once let go, for the "splash" back.
      const stiffness = isDragging ? STIFFNESS_HELD : STIFFNESS_RELEASE;
      const damping = isDragging ? DAMPING_HELD : DAMPING_RELEASE;
      d.vx = (d.vx + (tx - d.x) * stiffness) * damping;
      d.vy = (d.vy + (ty - d.y) * stiffness) * damping;
      d.x += d.vx;
      d.y += d.vy;

      const r = d.radius * (1 + glow * 0.9);
      const centerMix = 1 - d.distFromCenter;
      // Warm peach at the center, cooler cream at the edge, brightening
      // toward white right under the cursor.
      const red = 253 - centerMix * 6 + glow * 2;
      const green = 231 - centerMix * 10 + glow * 14;
      const blue = 199 + centerMix * 15 + glow * 40;
      const alpha = 0.55 + centerMix * 0.35 + glow * 0.25;

      ctx.beginPath();
      ctx.arc(d.x, d.y, Math.max(0.4, r), 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${red | 0}, ${green | 0}, ${blue | 0}, ${Math.min(1, alpha)})`;
      ctx.fill();
    }

    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
});

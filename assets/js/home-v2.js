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

  // Prev/next buttons — step by one card-width + gap in either direction,
  // clamped to the row's actual scroll range, using the same eased scroll
  // as the click-to-expand auto-scroll above.
  const STEP = 268 + 32; // card width + row gap
  const prevBtn = document.getElementById('scrollPrev');
  const nextBtn = document.getElementById('scrollNext');
  function stepScroll(dir) {
    const maxScroll = row.scrollWidth - row.clientWidth;
    const target = Math.min(Math.max(0, row.scrollLeft + dir * STEP), Math.max(0, maxScroll));
    animateScrollLeft(row, target, LIQUID_MS);
  }
  if (prevBtn) prevBtn.addEventListener('click', () => stepScroll(-1));
  if (nextBtn) nextBtn.addEventListener('click', () => stepScroll(1));

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
// Mood system — SNAPPY (default) vs ZEN. A mood switch changes tone, not
// facts: the section tagline, the sphere graphic, the card teasers, and
// (via body[data-mood] in style.css) the one accent color everything
// else on the page reads from. Stat panels never change with mood.
// Card copy is keyed per-mood with a snappy fallback so unwritten zen
// teasers just show the snappy one, per the copy doc.
// ---------------------------------------------------------------------
const CARDS = [
  { id: 'remitly-business', teasers: { snappy: 'Hidden experiment to $408M business in one year. Zero to one, three countries.', zen: null } },
  { id: 'duolingo-news-feed', teasers: { snappy: "Pitched a new tab connecting 500M learners to each other. It’s still there.", zen: null } },
  { id: 'pay-with-a-link', teasers: { snappy: 'Pay contractors abroad without asking for bank details. A family product, rebuilt for business.', zen: null } },
  { id: 'duocon', teasers: { snappy: "Co-created and branded Duolingo’s first live event. Also added a word to High Valyrian.", zen: null } },
  { id: 'duolingo-streak-society', teasers: { snappy: 'An exclusive club for Duolingo’s most obsessive learners.', zen: null } },
];
const MOODS = {
  snappy: { label: 'SNAPPY', tagline: 'I’ll be quick.' },
  zen: { label: 'ZEN', tagline: 'Take your time.' },
};

document.addEventListener('DOMContentLoaded', () => {
  const tabs = document.querySelectorAll('.v2-circle-tab');
  const graphics = document.querySelectorAll('.v2-circle-stage [data-circle]');
  const tagline = document.getElementById('moodTagline');
  const body = document.body;
  if (!tabs.length || !graphics.length) return;

  function applyMood(mood) {
    if (!MOODS[mood]) return;
    body.dataset.mood = mood;
    tabs.forEach((t) => {
      const active = t.dataset.circle === mood;
      t.classList.toggle('is-active', active);
      t.setAttribute('aria-selected', String(active));
    });
    graphics.forEach((g) => {
      g.classList.toggle('is-active', g.dataset.circle === mood);
    });
    if (tagline) tagline.textContent = MOODS[mood].tagline;
    CARDS.forEach((card) => {
      const el = document.getElementById(`desc-${card.id}`);
      if (!el) return;
      el.textContent = (card.teasers[mood] || card.teasers.snappy) + ' >';
    });
    try { localStorage.setItem('v2-mood', mood); } catch (e) { /* private mode etc — just skip persisting */ }
  }

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => applyMood(tab.dataset.circle));
  });

  let saved = null;
  try { saved = localStorage.getItem('v2-mood'); } catch (e) { /* ignore */ }
  applyMood(saved && MOODS[saved] ? saved : 'snappy');
});

// ---------------------------------------------------------------------
// Zen circle — a thin ring made of individual grains (not a single
// stroked path). Where the cursor passes, grains near it scatter like
// dandelion seeds caught by a puff of breath: a fast initial burst
// (impulse + heavy drag) that decays quickly, then a long, slow drift
// back home (a much weaker spring, so the return takes its time) —
// "disturbed, then eventually undisturbed," never a rigid bounce.
// ---------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('zenCircle');
  if (!canvas || !canvas.getContext) return;

  const cssSize = 260;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = cssSize * dpr;
  canvas.height = cssSize * dpr;
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);

  const center = { x: cssSize / 2, y: cssSize / 2 };
  const REST_RADIUS = 100;
  const POINT_COUNT = 160;

  const points = [];
  for (let i = 0; i < POINT_COUNT; i++) {
    const angle = (i / POINT_COUNT) * Math.PI * 2;
    const baseX = center.x + Math.cos(angle) * REST_RADIUS;
    const baseY = center.y + Math.sin(angle) * REST_RADIUS;
    points.push({ baseX, baseY, x: baseX, y: baseY, vx: 0, vy: 0 });
  }

  let pointer = null;
  function localPos(e) {
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }
  canvas.addEventListener('mousemove', (e) => { pointer = localPos(e); });
  canvas.addEventListener('mouseleave', () => { pointer = null; });
  canvas.addEventListener('touchmove', (e) => {
    const t = e.touches[0];
    if (!t) return;
    const rect = canvas.getBoundingClientRect();
    pointer = { x: t.clientX - rect.left, y: t.clientY - rect.top };
  }, { passive: true });
  canvas.addEventListener('touchend', () => { pointer = null; });

  const DISTURB_R = 50;      // reach of the "puff" around the cursor
  const BURST = 1.1;         // per-frame kick while under the cursor
  const DRAG = 0.9;          // fast decay right after the kick
  const RETURN_K = 0.0035;   // very weak — a long, unhurried drift home
  const FADE_DIST = 34;      // px of drift at which a grain is fully faded

  function frame() {
    ctx.clearRect(0, 0, cssSize, cssSize);

    for (const p of points) {
      if (pointer) {
        const dx = p.x - pointer.x;
        const dy = p.y - pointer.y;
        const dist = Math.hypot(dx, dy);
        if (dist < DISTURB_R) {
          const strength = (1 - dist / DISTURB_R) * BURST;
          // Mostly radially outward from the cursor, with a little
          // random jitter so a whole arc doesn't scatter in lockstep —
          // reads as loose grains, not a single rigid piece.
          const away = dist || 1;
          const jitter = (Math.random() - 0.5) * 0.8;
          const nx = dx / away + Math.cos(jitter);
          const ny = dy / away + Math.sin(jitter);
          p.vx += nx * strength;
          p.vy += ny * strength;
        }
      }
      p.vx *= DRAG;
      p.vy *= DRAG;
      // Slow spring back toward this grain's resting spot on the ring.
      p.vx += (p.baseX - p.x) * RETURN_K;
      p.vy += (p.baseY - p.y) * RETURN_K;
      p.x += p.vx;
      p.y += p.vy;
    }

    const accent = getComputedStyle(canvas).color; // tracks --v2-accent live
    for (const p of points) {
      const drift = Math.hypot(p.x - p.baseX, p.y - p.baseY);
      const alpha = Math.max(0.12, 1 - drift / FADE_DIST);
      ctx.beginPath();
      ctx.arc(p.x, p.y, 1.4, 0, Math.PI * 2);
      ctx.fillStyle = accent;
      ctx.globalAlpha = alpha;
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
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

  // Build a hex-ish grid of dots clipped to the circle. Both loops run a
  // symmetric -half..half range (not "-rows/2 to <rows/2", which is one
  // row/col heavier on the negative side than the positive) so the dot
  // cluster is actually centered in its box rather than reading as
  // shifted up-and-left.
  const dots = [];
  const spacing = 21;
  const rows = Math.ceil((cssSize) / spacing) + 2;
  const half = Math.floor(rows / 2);
  for (let row = -half; row <= half; row++) {
    const rowOffset = (Math.round(row) % 2 === 0) ? 0 : spacing / 2;
    for (let col = -half; col <= half; col++) {
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
      // Accent teal at the center, slightly deeper at the edge, brightening
      // toward white right under the cursor.
      const red = 60 + centerMix * 20 + glow * 130;
      const green = 175 + centerMix * 18 + glow * 70;
      const blue = 175 + centerMix * 18 + glow * 70;
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

// Shared site behavior: sticky-nav shadow + tiny carousel.
document.addEventListener('DOMContentLoaded', () => {
  const nav = document.getElementById('nav');
  if (nav) {
    const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 10);
    window.addEventListener('scroll', onScroll);
    onScroll();
  }

  // Carousels: a .cs-carousel-track scroller with dot indicators in the
  // following .cs-carousel-dots. Dots update on scroll and are clickable.
  document.querySelectorAll('.cs-carousel').forEach((carousel) => {
    const track = carousel.querySelector('.cs-carousel-track');
    const dots = carousel.parentElement.querySelectorAll('.cs-carousel-dots span');
    if (!track || !dots.length) return;

    dots.forEach((dot, i) => {
      dot.style.cursor = 'pointer';
      dot.addEventListener('click', () => {
        track.scrollTo({ left: track.clientWidth * i, behavior: 'smooth' });
      });
    });

    track.addEventListener('scroll', () => {
      const i = Math.round(track.scrollLeft / track.clientWidth);
      dots.forEach((dot, di) => dot.style.background = di === i ? '#222' : '#c9c9c5');
    });

    // Auto-advance one slide every few seconds, looping back to the first,
    // while the carousel is mostly on screen. Any interaction with it
    // (touching, scrolling it, or tapping a dot) stops this for good.
    // Off for reduced-motion users.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const slides = track.children.length;
    let timer = null;
    const stop = () => { clearInterval(timer); timer = null; };
    const onScreen = () => {
      const r = carousel.getBoundingClientRect();
      const visible = Math.min(r.bottom, window.innerHeight) - Math.max(r.top, 0);
      return visible > r.height * 0.6;
    };
    timer = setInterval(() => {
      if (document.hidden || !onScreen()) return;
      const i = Math.round(track.scrollLeft / track.clientWidth);
      const next = (i + 1) % slides;
      track.scrollTo({ left: track.clientWidth * next, behavior: 'smooth' });
    }, 3500);
    ['pointerdown', 'touchstart', 'wheel', 'keydown'].forEach((ev) => {
      track.addEventListener(ev, stop, { passive: true });
    });
    dots.forEach((dot) => dot.addEventListener('click', stop));
  });
});

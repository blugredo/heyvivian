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
  });
});

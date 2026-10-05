// Mobile nav: the burger button opens/closes the collapsed link group
// (.nav-menu). Shared by every page that has a .nav-toggle; on desktop
// the button is hidden by CSS and none of this has any visible effect.
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.nav-toggle').forEach((toggle) => {
    const nav = toggle.closest('nav');
    const menu = document.getElementById(toggle.getAttribute('aria-controls'));
    if (!nav || !menu) return;

    const isOpen = () => nav.classList.contains('is-menu-open');
    const setOpen = (open) => {
      nav.classList.toggle('is-menu-open', open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    };

    toggle.addEventListener('click', () => setOpen(!isOpen()));
    // Picking a link, tapping anywhere outside the nav, or Escape closes it.
    menu.addEventListener('click', (e) => { if (e.target.closest('a')) setOpen(false); });
    document.addEventListener('click', (e) => { if (isOpen() && !nav.contains(e.target)) setOpen(false); });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && isOpen()) { setOpen(false); toggle.focus(); }
    });
    // Widening past the mobile breakpoint with the menu open would leave
    // the state class behind for next time — reset it instead.
    window.matchMedia('(min-width: 781px)').addEventListener('change', (e) => {
      if (e.matches) setOpen(false);
    });
  });
});

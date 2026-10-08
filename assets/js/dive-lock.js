// The case-study icons on the homepage cards stay hidden until unlocked
// with a password from the discreet lock in the footer. This is a soft
// gate, not security: the case-study pages themselves are still public
// at their URLs. Only a SHA-256 hash of the password lives here.
// Unlocking is remembered in this browser; clicking the open lock locks
// it again.
(() => {
  const HASH = 'a123c67c03cb04b54815e8e743d655b0de161b8bf3e3e2d8bd710b0bad2048cc';
  const KEY = 'diveUnlocked';
  const root = document.documentElement;
  const btn = document.querySelector('.dive-lock');
  const form = document.querySelector('.dive-lock-form');
  const input = document.querySelector('.dive-lock-input');

  const remembered = () => { try { return localStorage.getItem(KEY) === '1'; } catch (e) { return false; } };
  const remember = (on) => { try { on ? localStorage.setItem(KEY, '1') : localStorage.removeItem(KEY); } catch (e) {} };
  const setUnlocked = (on) => {
    root.classList.toggle('dive-unlocked', on);
    if (btn) btn.setAttribute('aria-label', on ? 'Lock' : 'Unlock');
  };
  setUnlocked(remembered());
  if (!btn || !form || !input) return;

  const closeForm = () => {
    form.hidden = true; input.value = '';
    btn.setAttribute('aria-expanded', 'false');
  };

  btn.addEventListener('click', () => {
    if (root.classList.contains('dive-unlocked')) { setUnlocked(false); remember(false); return; }
    const opening = form.hidden;
    form.hidden = !opening;
    btn.setAttribute('aria-expanded', String(opening));
    if (opening) input.focus(); else input.value = '';
  });

  const sha256 = async (text) => {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
    return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if ((await sha256(input.value.trim())) === HASH) {
      setUnlocked(true); remember(true); closeForm();
    } else {
      input.value = '';
      input.classList.remove('is-wrong'); void input.offsetWidth; input.classList.add('is-wrong');
    }
  });
  input.addEventListener('keydown', (e) => { if (e.key === 'Escape') { closeForm(); btn.focus(); } });
})();

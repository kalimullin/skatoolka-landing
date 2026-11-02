/* Approved navigation. Native disclosure: links keep normal Tab behavior. */
(() => {
  const root = document.querySelector('.audience-disclosure');
  const toggle = root.querySelector('button');
  const links = root.querySelector('.audience-links');
  function close(restore = false) {
    links.hidden = true;
    toggle.setAttribute('aria-expanded', 'false');
    if (restore) toggle.focus();
  }
  function open(focus = false) {
    links.hidden = false;
    toggle.setAttribute('aria-expanded', 'true');
    if (focus) links.querySelector('a').focus();
  }
  toggle.addEventListener('click', () => links.hidden ? open() : close());
  toggle.addEventListener('keydown', event => {
    if (event.key === 'ArrowDown') { event.preventDefault(); open(true); }
  });
  root.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !links.hidden) { event.preventDefault(); close(true); }
  });
  root.addEventListener('focusout', () => requestAnimationFrame(() => {
    if (!root.contains(document.activeElement)) close();
  }));
  document.addEventListener('pointerdown', event => {
    if (!root.contains(event.target)) close();
  });
  links.addEventListener('click', event => { if (event.target.closest('a')) close(); });
  matchMedia('(max-width:760px)').addEventListener('change', () => close());
})();

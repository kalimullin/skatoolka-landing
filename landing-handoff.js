/* Native navigation disclosures. Static Figma content, real links only.
   Motion: brief opacity feedback for pointer input; keyboard/reduced motion instant. */
(() => {
  const header = document.querySelector('.header');
  if (!header) return;
  const mobile = matchMedia('(max-width:760px)');
  const finePointer = matchMedia('(hover:hover) and (pointer:fine)');
  const reducedMotion = matchMedia('(prefers-reduced-motion:reduce)');
  const disclosures = [...header.querySelectorAll('.nav-disclosure')].map(root => ({
    root, toggle:root.querySelector('.nav-toggle'), panel:root.querySelector('.nav-panel'),
    hideTimer:0, leaveTimer:0, openedByHover:false
  }));
  function instant() { return mobile.matches || reducedMotion.matches || header.dataset.navInput === 'keyboard'; }
  function close(item, restore = false, immediately = false) {
    clearTimeout(item.leaveTimer); clearTimeout(item.hideTimer);
    item.openedByHover = false;
    item.toggle.setAttribute('aria-expanded','false');
    item.panel.classList.remove('is-open'); item.panel.inert = true;
    if (immediately || instant()) item.panel.hidden = true;
    else item.hideTimer = setTimeout(() => { item.panel.hidden = true; },130);
    if (restore) item.toggle.focus({preventScroll:true});
  }
  function open(item, focus = false) {
    clearTimeout(item.leaveTimer); clearTimeout(item.hideTimer);
    disclosures.forEach(other => { if (other !== item) close(other,false,true); });
    const wasHidden = item.panel.hidden;
    item.panel.hidden = false; item.panel.inert = false;
    item.toggle.setAttribute('aria-expanded','true');
    if (wasHidden && !instant()) void item.panel.offsetWidth;
    item.panel.classList.add('is-open');
    if (focus) (item.panel.querySelector('a[href],button:not(:disabled)') || item.toggle).focus({preventScroll:true});
  }
  function closeAll() { disclosures.forEach(item => close(item,false,true)); }
  document.addEventListener('keydown', () => { header.dataset.navInput = 'keyboard'; },true);
  document.addEventListener('pointerdown', () => { header.dataset.navInput = 'pointer'; },true);
  disclosures.forEach(item => {
    item.toggle.addEventListener('click', event => {
      if (event.detail === 0) header.dataset.navInput = 'keyboard';
      if (event.detail > 0 && item.openedByHover) { item.openedByHover = false; return; }
      item.toggle.getAttribute('aria-expanded') === 'true' ? close(item) : open(item);
    });
    item.toggle.addEventListener('keydown', event => {
      if (event.key === 'ArrowDown') { event.preventDefault(); open(item,true); }
    });
    item.root.addEventListener('keydown', event => {
      if (event.key === 'Escape' && item.toggle.getAttribute('aria-expanded') === 'true') {
        event.preventDefault(); event.stopPropagation(); close(item,true);
      }
    });
    item.root.addEventListener('pointerenter', event => {
      clearTimeout(item.leaveTimer);
      if (!mobile.matches && finePointer.matches && event.pointerType !== 'touch') {
        header.dataset.navInput = 'pointer';
        if (item.toggle.getAttribute('aria-expanded') !== 'true') { open(item); item.openedByHover = true; }
      }
    });
    item.root.addEventListener('pointerleave', () => {
      if (!mobile.matches && !item.root.contains(document.activeElement)) item.leaveTimer = setTimeout(() => close(item),140);
    });
    item.root.addEventListener('focusout', () => requestAnimationFrame(() => {
      if (!item.root.contains(document.activeElement) && !item.root.matches(':hover')) close(item);
    }));
    item.panel.addEventListener('click', event => { if (event.target.closest('a[href]')) close(item,false,true); });
  });
  document.addEventListener('pointerdown', event => {
    if (!event.target.closest('.nav-disclosure')) closeAll();
  });
  // Pointer-only opening does not move focus, so Escape must also work from body.
  document.addEventListener('keydown', event => {
    if (mobile.matches || event.key !== 'Escape') return;
    const item = disclosures.find(item => item.toggle.getAttribute('aria-expanded') === 'true');
    if (item) { event.preventDefault(); close(item,true); }
  });
  header.querySelector('.mobile-menu-toggle')?.addEventListener('click', () => {
    if (header.querySelector('.mobile-menu-toggle').getAttribute('aria-expanded') === 'false') closeAll();
  });
  window.addEventListener('blur',closeAll);
  mobile.addEventListener('change',closeAll);
  reducedMotion.addEventListener('change',closeAll);
})();

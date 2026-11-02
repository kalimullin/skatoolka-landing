(() => {
  const header = document.querySelector('.header');
  const toggle = document.querySelector('.mobile-menu-toggle');
  const nav = document.querySelector('#main-navigation');
  const backdrop = document.querySelector('.mobile-menu-backdrop');
  const mobile = matchMedia('(max-width: 760px)');
  const prompt = document.querySelector('#prompt');
  const originalPlaceholder = prompt.placeholder;
  const hint = document.querySelector('#prompt-hint');
  const submit = document.querySelector('.submit-area');
  const originalHint = hint.textContent;
  const pageRegions = [...document.querySelectorAll('main, .page-ending')];
  let savedInert = null;
  function setMenuState(open) {
    header.classList.toggle('menu-open', open);
    document.documentElement.classList.toggle('mobile-menu-open', open);
    if (open && !savedInert) {
      savedInert = pageRegions.map(element => element.inert);
      pageRegions.forEach(element => { element.inert = true; });
    } else if (!open && savedInert) {
      pageRegions.forEach((element, index) => { element.inert = savedInert[index]; });
      savedInert = null;
    }
  }
  function closeMenu(restoreFocus = false) {
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Открыть меню');
    nav.classList.remove('is-open');
    backdrop.hidden = true;
    setMenuState(false);
    if (restoreFocus) toggle.focus();
  }
  toggle.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') !== 'true';
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    nav.classList.toggle('is-open', open);
    backdrop.hidden = !open;
    setMenuState(open);
    if (open) nav.querySelector('.mobile-nav-groups a').focus({ preventScroll: true });
  });
  // Close before the existing login/start handlers open a dialog or focus the form.
  header.addEventListener('click', event => {
    if (event.target.closest('#login, .header-start, .brand')) closeMenu();
  }, true);
  nav.addEventListener('click', event => { if (event.target.closest('a')) closeMenu(true); });
  document.addEventListener('pointerdown', event => { if (!header.contains(event.target)) closeMenu(); });
  document.addEventListener('keydown', event => {
    if (toggle.getAttribute('aria-expanded') !== 'true') return;
    if (event.key === 'Escape') closeMenu(true);
    if (event.key === 'Tab') {
      const items = [...header.querySelectorAll('a, button')].filter(element => element.getClientRects().length);
      const first = items[0], last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  });
  const detailsToggle = document.querySelector('#details-toggle');
  const details = document.querySelector('#prompt-details');
  const hasSharedDetails = document.body.classList.contains('suisse');
  const originalDetailsToggle = detailsToggle.onclick;
  function closeDetails(restoreFocus = false) {
    details.hidden = true;
    detailsToggle.setAttribute('aria-expanded', 'false');
    if (restoreFocus) detailsToggle.focus({ preventScroll: true });
  }
  detailsToggle.onclick = event => {
    originalDetailsToggle.call(detailsToggle, event);
    if (!hasSharedDetails && mobile.matches && !details.hidden) details.querySelector('#file-open').focus({ preventScroll: true });
  };
  details.addEventListener('click', event => {
    if (!hasSharedDetails && mobile.matches && event.target.closest('button')) closeDetails();
  }, true);
  document.addEventListener('pointerdown', event => {
    if (!hasSharedDetails && mobile.matches && !details.contains(event.target) && !detailsToggle.contains(event.target)) closeDetails();
  });
  document.addEventListener('keydown', event => {
    if (!hasSharedDetails && mobile.matches && !details.hidden && event.key === 'Escape') {
      event.preventDefault(); closeDetails(true);
    }
  });
  document.addEventListener('focusin', event => {
    if (!hasSharedDetails && mobile.matches && !details.contains(event.target) && !detailsToggle.contains(event.target)) closeDetails();
  });
  function adapt() {
    closeDetails();
    closeMenu();
    prompt.placeholder = mobile.matches ? 'Опишите сайт или приложение…' : originalPlaceholder;
    submit.prepend(hint);
    hint.textContent = mobile.matches ? '5 запросов бесплатно' : originalHint;
  }
  mobile.addEventListener('change', adapt);
  adapt();
})();

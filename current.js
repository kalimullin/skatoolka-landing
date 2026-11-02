/* Figma layer updates. Existing draft, modal, upload and process handlers stay shared. */
(() => {
  const mobile = matchMedia('(max-width:760px)');
  const field = document.querySelector('#prompt');
  const closing = document.querySelector('#closing-prompt');
  function syncComposer() {
    const hasDescription = Boolean(field.value.trim());
    const desktopIcon = hasDescription ? 'assets/figma-oct1/desktop-imgGeminiAi1.svg?v=2' : 'assets/figma-current/342-1072-imgLeftIcon1.svg';
    const mobileIcon = hasDescription ? 'assets/figma-oct1/mobile-imgUp.svg?v=2' : 'assets/figma-current/342-1671-imgUp.svg';
    document.querySelector('#create').disabled = !hasDescription;
    document.querySelector('.closing-create').disabled = !hasDescription;
    document.querySelectorAll('#create > .landing-icon, .closing-create > img.desktop-copy').forEach(icon => { icon.src = desktopIcon; });
    document.querySelectorAll('#create > .mobile-submit-icon, .closing-create > img.mobile-copy').forEach(icon => { icon.src = mobileIcon; });
    field.placeholder = mobile.matches ? 'Опишите, что хотите создать…' : 'Например, сайт уютной кофейни с меню и адресом';
    closing.placeholder = field.placeholder;
    closing.style.maxHeight = 'none';
    closing.style.overflowY = 'hidden';
    closing.style.height = 'auto';
    const closingStyle = getComputedStyle(closing);
    closing.style.height = `${closing.scrollHeight + parseFloat(closingStyle.borderTopWidth) + parseFloat(closingStyle.borderBottomWidth)}px`;
  }
  field.addEventListener('input', syncComposer);
  field.addEventListener('draftchange', syncComposer);
  mobile.addEventListener('change', syncComposer);
  syncComposer();
  document.fonts.ready.then(syncComposer);
  let closingWidth = 0;
  new ResizeObserver(([entry]) => {
    if (entry.contentRect.width === closingWidth) return;
    closingWidth = entry.contentRect.width;
    syncComposer();
  }).observe(closing);
  document.querySelector('#signup').addEventListener('click', () => showAuth(false));
  // Keep the middle plan centered on mobile, as in the source design.
  // A normal horizontally scrollable list keeps all three plans reachable.
  const plans = document.querySelector('.current-plans');
  let planIndex = 1;
  let planWidth = 0;
  let repositioning = false;
  function positionPlans() {
    if (!mobile.matches || plans.clientWidth === planWidth) return;
    planWidth = plans.clientWidth;
    const card = plans.children[planIndex];
    repositioning = true;
    plans.scrollTo({left: card.offsetLeft - (plans.clientWidth - card.offsetWidth) / 2, behavior: 'instant'});
    requestAnimationFrame(() => { repositioning = false; });
  }
  plans.addEventListener('scroll', () => {
    if (!mobile.matches || repositioning) return;
    const center = plans.scrollLeft + plans.clientWidth / 2;
    planIndex = [...plans.children].reduce((best, card, index, cards) =>
      Math.abs(card.offsetLeft + card.offsetWidth / 2 - center) < Math.abs(cards[best].offsetLeft + cards[best].offsetWidth / 2 - center) ? index : best, 0);
  }, {passive:true});
  new ResizeObserver(positionPlans).observe(plans);
  mobile.addEventListener('change', () => { planWidth = 0; positionPlans(); });
  document.fonts.ready.then(positionPlans);
  document.querySelectorAll('.cover').forEach(cover => {
    const resize = () => cover.style.setProperty('--cover-scale', cover.clientWidth / 584);
    new ResizeObserver(resize).observe(cover); resize();
  });
  document.querySelector('#all-ideas').addEventListener('click', () => {
    openDialog('Идеи для старта', '<h2 id="dialog-title">Что хотите создать?</h2><div class="more-ideas"><button class="button" data-new-idea="Сайт для записи на услуги с календарём, выбором мастера и подтверждением записи.">Запись на услуги</button><button class="button" data-new-idea="Личный сайт с портфолио, рассказом обо мне и контактами.">Личный сайт</button><button class="button" data-new-idea="Магазин парфюмерии с каталогом, корзиной и оформлением заказа.">Интернет-магазин</button></div>');
    document.querySelectorAll('[data-new-idea]').forEach(button => button.addEventListener('click', () => {
      field.value = button.dataset.newIdea; field.dispatchEvent(new Event('input', {bubbles:true})); closeDialog();
    }));
  });
  const toggle = document.querySelector('.comparison-toggle');
  toggle.addEventListener('click', () => {
    const expanded = toggle.getAttribute('aria-expanded') !== 'true';
    toggle.setAttribute('aria-expanded', expanded);
    document.querySelector('.comparison-more').hidden = !expanded;
    toggle.textContent = expanded ? 'Свернуть' : 'Показать ещё';
  });
  // Public production pricing snapshot, 13 October 2026. Payments remain local previews.
  const packages = {1:[990,1980,3960,7920,11640,19010,27920,36430]};
  let period = 'month';
  function updatePrices() {
    document.querySelectorAll('.current-plan').forEach(card => {
      const plan = Number(card.dataset.plan); if (!packages[plan]) return;
      const monthly = packages[plan][Number(card.querySelector('select').value)];
      const amount = period === 'year' ? monthly * 10 / 12 : monthly;
      card.querySelector('.current-price strong').textContent = amount.toLocaleString('ru-RU',{maximumFractionDigits:2}) + ' ₽';
      card.querySelector('.current-price span').textContent = '/ месяц';
      card.querySelector('.billing-note').textContent = period === 'year' ? (monthly * 10).toLocaleString('ru-RU') + ' ₽ за год · 2 месяца бесплатно' : 'Оплата каждый месяц';
    });
  }
  document.querySelectorAll('[data-billing]').forEach(button => button.addEventListener('click', () => {
    period = button.dataset.billing;
    document.querySelectorAll('[data-billing]').forEach(b => b.setAttribute('aria-pressed', b === button)); updatePrices();
  }));
  document.querySelectorAll('.plan-controls select').forEach(select => select.addEventListener('change',updatePrices));
  document.querySelectorAll('[data-select-plan]').forEach(button => button.addEventListener('click', () => {
    const card = button.closest('.current-plan');
    openDialog('Тариф', `<h2 id="dialog-title">${card.querySelector('h3').textContent}</h2><p>${card.querySelector('select').selectedOptions[0].textContent}</p><p>${card.querySelector('.current-price').textContent} · ${card.querySelector('.billing-note').textContent}</p><button class="button primary" id="plan-sign-in">Войти и продолжить</button>`);
    document.querySelector('#plan-sign-in').addEventListener('click', () => { closeDialog(); document.querySelector('#login').click(); });
  }));
})();

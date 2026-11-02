/* Interactions specific to the main landing; shared prototype owns the composer/dialog. */
(() => {
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  const steps = [...document.querySelectorAll('.process-step')];
  const scenes = [...document.querySelectorAll('.process-scene')];
  const desktopProcess = matchMedia('(min-width: 761px)');
  const process = document.querySelector('.interactive-process');
  if (!process.hasAttribute('data-process-tabs')) {
  let scrollFrame = 0;

  function selectStep(index) {
    steps.forEach((step, i) => {
      step.classList.toggle('active', i === index);
      if (i === index) step.setAttribute('aria-current', 'step');
      else step.removeAttribute('aria-current');
    });
  }
  function syncProcess() {
    scrollFrame = 0;
    if (!desktopProcess.matches) return;
    let active = 0;
    scenes.forEach((scene, index) => {
      if (scene.getBoundingClientRect().top <= innerHeight * .35) active = index;
    });
    selectStep(active);
  }
  function scheduleProcess() {
    if (!scrollFrame) scrollFrame = requestAnimationFrame(syncProcess);
  }
  steps.forEach((step, index) => {
    step.addEventListener('click', event => {
      const instant = event.detail === 0 || reducedMotion.matches;
      process.classList.toggle('instant-process', instant);
      selectStep(index);
      window.scrollTo({
        top: scrollY + scenes[index].getBoundingClientRect().top - innerHeight * .2,
        behavior: instant ? 'instant' : 'smooth'
      });
      if (instant) requestAnimationFrame(() => process.classList.remove('instant-process'));
    });
    step.addEventListener('keydown', event => {
      const next = { ArrowDown: (index + 1) % steps.length, ArrowUp: (index + steps.length - 1) % steps.length, Home: 0, End: steps.length - 1 }[event.key];
      if (next === undefined) return;
      event.preventDefault();
      steps[next].focus({ preventScroll: true });
      steps[next].click();
    });
  });
  window.addEventListener('scroll', scheduleProcess, { passive: true });
  window.addEventListener('resize', scheduleProcess);
  desktopProcess.addEventListener('change', scheduleProcess);
  new ResizeObserver(scheduleProcess).observe(process);
  syncProcess();

  // Reveal each screen once; scrolling back never hides already-read content.
  if (!reducedMotion.matches) {
    const reveal = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-revealed');
        reveal.unobserve(entry.target);
      });
    }, { threshold: .12 });
    scenes.forEach(scene => {
      scene.classList.add('will-reveal');
      reveal.observe(scene);
    });
  }

  }

  const templates = {
    parfum: { image: '../figma-current/342-1132-imgPreviewImage2.png', title: 'Магазин парфюмерии', description: 'Товары, заказы и поддержка', prompt: 'Создай магазин парфюмерии с каталогом, карточками товаров, корзиной и поддержкой.' },
    salon: { image: '../figma-current/342-1132-imgPreviewImage.png', title: 'Запись в парикмахерскую', description: 'Пример интерфейса записи: услуги, мастера и свободное время.', source: 'https://www.mypage.dev/templates/g-app-salon', prompt: 'Создай приложение для записи в парикмахерскую: выбор услуги и мастера, календарь со свободным временем и подтверждение записи.' },
    crm: { image: '../figma-current/342-1132-imgPreviewImage1.png', title: 'Личная CRM', description: 'Пример интерфейса для работы с контактами, задачами и сделками.', source: 'https://shadcnuikit.com/dashboard/crm', prompt: 'Создай личную CRM с контактами, задачами, воронкой сделок и сводкой показателей на главной странице.' },
    telegram: { image: '../concepts/telegram-ru-v2.jpg', title: 'Telegram-бот', description: 'Пример интерфейса управления ботом: заявки, заказы и поддержка.', source: 'https://shadcnuikit.com/dashboard/workflow-automation', prompt: 'Создай Telegram-бота для приёма заявок и заказов с панелью управления обращениями и сценариями ответов.' },
    'custom-spaces': { image: '../figma-current/342-1132-imgImage20.png', title: 'Архитектурная студия', description: 'Архитектура и интерьер. Воздушная композиция с объёмной галереей проектов.', prompt: 'Создай сайт архитектурной студии: светлая редакционная типографика, крупная галерея интерьеров, проекты, услуги и контакты. Вдохновение — Custom Spaces.' },
    '6': { title: 'Портфолио дизайнера', image: '../figma-current/342-1132-imgImage21.png', description: 'Смелое портфолио: оранжевый фон, крупная типографика и выразительный портрет.', prompt: 'Создай моё портфолио дизайнера: яркий оранжевый фон, крупная типографика, выразительный портрет, избранные работы и контакты.' },
    'immersive-studio': { image: '../figma-current/342-1132-imgImage22.png', title: 'Креативная студия', description: 'Сайт креативной студии: тёмная сцена, скульптурный объект и кинематографичный свет.', prompt: 'Создай сайт креативной студии с тёмной кинематографичной сценой, выразительным 3D-акцентом, кейсами, услугами и формой связи. Вдохновение — Immersive Studio.' },
  };
  document.querySelectorAll('[data-template]').forEach(button => {
    button.addEventListener('click', () => {
      const id = button.dataset.template;
      const template = templates[id];
      if (!template) return;
      openDialog(template.source ? 'Пример интерфейса' : 'Пример сайта', `<h2 id="dialog-title">${template.title}</h2><p>${template.description}</p><img class="template-dialog-image" src="assets/templates/${template.image || `${id}.webp`}" width="1280" height="956" alt="Превью ${template.title}"><div class="actions"><button type="button" class="button primary" id="use-template-idea">Описать похожий проект</button><a class="button" href="${template.source || `https://meez.design/p/${id}`}" target="_blank" rel="noopener">${template.source ? 'Исходный шаблон' : 'Исходный шаблон Meez'}</a></div>`);
      document.querySelector('#use-template-idea').addEventListener('click', () => {
        const field = document.querySelector('#prompt');
        // Keep a user's draft intact when they browse a visual reference.
        if (!field.value.trim()) {
          field.value = template.prompt;
          field.dispatchEvent(new Event('input', { bubbles: true }));
        }
        document.querySelector('#dialog').addEventListener('close', () => requestAnimationFrame(startAtInput), { once: true });
        closeDialog();
      });
    });
  });

  const card = document.querySelector('.holo-card');
  if (!card) return;
  const foil = card.querySelector('.holo-foil');
  const glare = card.querySelector('.holo-glare');
  let bounds, frame = 0, last = 0;
  let x = 0, y = 0, vx = 0, vy = 0, targetX = 0, targetY = 0;
  function tick(now) {
    const dt = Math.min((now - (last || now - 16)) / 1000, .032);
    last = now;
    // Damped spring: mass 1, stiffness 100, damping 10.
    vx += ((targetX - x) * 100 - vx * 10) * dt;
    vy += ((targetY - y) * 100 - vy * 10) * dt;
    x += vx * dt; y += vy * dt;
    card.style.transform = `perspective(1000px) rotateX(${x}deg) rotateY(${y}deg)`;
    if (Math.abs(targetX - x) + Math.abs(targetY - y) + Math.abs(vx) + Math.abs(vy) > .01) {
      frame = requestAnimationFrame(tick);
    } else {
      frame = 0; last = 0;
      if (!card.classList.contains('is-hovered')) card.style.removeProperty('transform');
    }
  }
  function start() { if (!frame) frame = requestAnimationFrame(tick); }
  card.addEventListener('pointerenter', () => {
    if (!finePointer.matches || reducedMotion.matches) return;
    bounds = card.getBoundingClientRect();
    card.classList.add('is-hovered');
  });
  card.addEventListener('pointermove', event => {
    if (!bounds || !finePointer.matches || reducedMotion.matches) return;
    const px = Math.max(0, Math.min(1, (event.clientX - bounds.left) / bounds.width));
    const py = Math.max(0, Math.min(1, (event.clientY - bounds.top) / bounds.height));
    targetX = (0.5 - py) * 10;
    targetY = (px - 0.5) * 10;
    foil.style.setProperty('--foil-x', `${px * 100}%`);
    foil.style.setProperty('--foil-y', `${py * 100}%`);
    glare.style.setProperty('--glare-x', `${px * 100}%`);
    glare.style.setProperty('--glare-y', `${py * 100}%`);
    start();
  });
  function reset() {
    bounds = null; targetX = targetY = 0;
    card.classList.remove('is-hovered');
    if (reducedMotion.matches || !finePointer.matches) {
      cancelAnimationFrame(frame); frame = 0; last = 0;
      x = y = vx = vy = 0;
      card.style.removeProperty('transform');
    } else start();
  }
  card.addEventListener('pointerleave', reset);
  card.addEventListener('pointercancel', reset);
  reducedMotion.addEventListener('change', () => { reset(); });
  finePointer.addEventListener('change', reset);
  window.addEventListener('blur', reset);
})();

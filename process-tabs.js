/* Local demonstration only: tab changes never publish an actual project. */
(() => {
  const process = document.querySelector('[data-process-tabs]');
  if (!process) return;
  const tabs = [...process.querySelectorAll('[role="tab"]')];
  const nav = process.querySelector('[role="tablist"]');
  const highlight = process.querySelector('.process-highlight');
  const shell = process.querySelector('.process-demo-shell');
  const demo = process.querySelector('.process-demo');
  const messages = [...process.querySelectorAll('[data-message-state]')];
  const status = process.querySelector('#process-status');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const mobile = matchMedia('(max-width: 760px)');
  let active = 0;
  let celebrationTimer;
  let particles = [];
  // Keep the editor in view while normal page scrolling advances its three states.
  const runway = document.createElement('div');
  runway.className = 'process-scroll-runway';
  process.before(runway);
  runway.append(process);
  let scrollStep = 0;
  let stickyTop = 0;
  let scrollFrame = 0;
  function syncScroll() {
    scrollFrame = 0;
    if (!scrollStep) return;
    const distance = stickyTop - runway.getBoundingClientRect().top;
    const index = Math.max(0, Math.min(tabs.length - 1, Math.floor(distance / scrollStep + .25)));
    if (index !== active) select(index);
  }
  function requestScrollSync() {
    if (!scrollFrame) scrollFrame = requestAnimationFrame(syncScroll);
  }
  function resizeStory() {
    layout();
    const height = process.offsetHeight;
    const fits = !reduced.matches && !mobile.matches && height <= innerHeight - 48;
    scrollStep = fits ? Math.max(320, innerHeight * .65) : 0;
    stickyTop = Math.max(24, (innerHeight - height) / 2);
    runway.classList.toggle('is-scrollable', fits);
    runway.style.height = fits ? `${height + scrollStep * 2.5}px` : '';
    process.style.setProperty('--process-sticky-top', `${stickyTop}px`);
    requestScrollSync();
  }
  function activateTab(index) {
    select(index);
    if (!scrollStep) return;
    // Align the scroll position with a clicked tab so the next wheel/touch move
    // continues from that state instead of snapping back to the previous one.
    const top = scrollY + runway.getBoundingClientRect().top - stickyTop + index * scrollStep;
    window.scrollTo({ top, behavior: 'instant' });
  }
  function layout() {
    demo.style.transform = `scale(${shell.clientWidth / 773.39})`;
    const tab = tabs[active];
    highlight.style.width = `${tab.offsetWidth}px`;
    highlight.style.height = `${tab.offsetHeight}px`;
    highlight.style.transform = `translate(${tab.offsetLeft}px, ${tab.offsetTop}px)`;
    nav.setAttribute('aria-orientation', mobile.matches ? 'horizontal' : 'vertical');
  }
  function clearCelebration() {
    clearTimeout(celebrationTimer);
    particles.forEach(({element, animation}) => { animation.cancel(); element.remove(); });
    particles = [];
  }
  function celebrate() {
    if (reduced.matches || document.hidden || active !== 2) return;
    const colors = ['#b67adc', '#f3bd48', '#ef9d8b', '#79bd9e'];
    for (let i = 0; i < 32; i++) {
      const piece = document.createElement('i');
      piece.className = 'confetti-piece';
      piece.setAttribute('aria-hidden', 'true');
      piece.style.background = colors[i % colors.length];
      piece.style.left = '615px'; piece.style.top = '480px';
      demo.append(piece);
      const angle = Math.PI + (i / 31) * Math.PI;
      const reach = 80 + Math.random() * 110;
      const x = Math.cos(angle) * reach;
      const y = Math.sin(angle) * reach;
      const rotation = Math.random() * 480 - 240;
      const animation = piece.animate([
        { transform: 'translate(0, 0) rotate(0deg)', opacity: 0 },
        { transform: `translate(${x * .6}px, ${y * .8}px) rotate(${rotation * .5}deg)`, opacity: 1, offset: .25 },
        { transform: `translate(${x}px, ${y + 120}px) rotate(${rotation}deg)`, opacity: 0 }
      ], { duration: 1200 + Math.random() * 400, easing: 'linear', fill: 'both' });
      particles.push({ element: piece, animation });
      animation.finished.then(() => piece.remove()).catch(() => {});
    }
  }
  function select(index, announce = true) {
    if (index === active && announce) return;
    clearCelebration();
    active = index;
    tabs.forEach((tab, i) => {
      tab.classList.toggle('active', i === index);
      tab.setAttribute('aria-selected', String(i === index));
      tab.tabIndex = i === index ? 0 : -1;
    });
    messages.forEach((message, i) => {
      message.classList.toggle('is-current', i === index);
      message.setAttribute('aria-hidden', String(i !== index));
    });
    demo.dataset.state = String(index);
    shell.setAttribute('aria-labelledby', tabs[index].id);
    process.querySelector('.demo-window-title').textContent = index === 2 ? 'liniya.skatoolka.ru' : 'Линия — студия архитектуры';
    process.querySelector('.demo-success').setAttribute('aria-hidden', String(index !== 2));
    if (announce) status.textContent = index === 2 ? 'Пример публикации: сайт опубликован, ссылка готова.' : tabs[index].querySelector('.step-description').textContent;
    layout();
    if (index === 2) celebrationTimer = setTimeout(celebrate, 250);
  }
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => activateTab(index));
    tab.addEventListener('keydown', event => {
      const next = { ArrowDown: (index + 1) % 3, ArrowRight: (index + 1) % 3, ArrowUp: (index + 2) % 3, ArrowLeft: (index + 2) % 3, Home: 0, End: 2 }[event.key];
      if (next === undefined) return;
      event.preventDefault(); tabs[next].focus({ preventScroll: true }); activateTab(next);
    });
  });
  new ResizeObserver(resizeStory).observe(process);
  window.addEventListener('resize', resizeStory);
  window.addEventListener('scroll', requestScrollSync, { passive: true });
  document.fonts.ready.then(resizeStory);
  reduced.addEventListener('change', () => { clearCelebration(); resizeStory(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) clearCelebration(); });
  select(0, false);
})();

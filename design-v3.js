/* Visual enhancements only. The shared prototype owns form data and dialogs. */
(() => {
  const field = document.querySelector('#prompt');
  const form = document.querySelector('#prompt-form');
  const example = document.querySelector('[data-example]');
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  document.addEventListener('keydown', event => {
    if (event.key === 'Tab') document.body.classList.add('keyboard-nav');
  });
  document.addEventListener('pointerdown', () => document.body.classList.remove('keyboard-nav'));
  const spectrum = document.querySelector('.hero-spectrum');
  const hero = document.querySelector('.hero');
  let scrollFrame = 0;
  function paintSpectrum() {
    scrollFrame = 0;
    if (!spectrum) return;
    const progress = Math.min(1, Math.max(0, scrollY / hero.offsetHeight));
    spectrum.style.transform = reduceMotion.matches ? 'none' :
      `translateY(${-progress * 4}%) scaleY(${1 + progress * .32})`;
  }
  if (spectrum) {
    window.addEventListener('scroll', () => {
      if (!scrollFrame) scrollFrame = requestAnimationFrame(paintSpectrum);
    }, { passive: true });
    window.addEventListener('resize', paintSpectrum);
    reduceMotion.addEventListener('change', paintSpectrum);
    paintSpectrum();
  }

  const compactIdeas = ['Сайт уютной кофейни с меню…','Портфолио с лучшими работами…','Лендинг студии йоги…'];
  const ideas = matchMedia('(max-width: 760px)').matches && document.body.classList.contains('suisse') ? compactIdeas : [
    'сайт уютной кофейни с меню и адресом',
    'портфолио фотографа с лучшими работами',
    'лендинг студии йоги с расписанием занятий',
  ];

  // Never steal focus after an interaction, anchor navigation, or scrolling.
  let interacted = false;
  const markInteraction = () => { interacted = true; };
  window.addEventListener('pointerdown', markInteraction, { once: true });
  window.addEventListener('keydown', markInteraction, { once: true });
  setTimeout(() => {
    if (!interacted && !location.hash && scrollY < 100 &&
        matchMedia('(hover: hover) and (pointer: fine)').matches &&
        document.activeElement === document.body && !document.querySelector('dialog[open]')) {
      field.focus({ preventScroll: true });
    }
  }, 350);

  // Animate a decorative overlay; retain a stable native placeholder for AT.
  form.classList.add('has-animated-example');
  let timer;
  let index = 0;
  let length = ideas[0].length;
  let phase = 'erase';
  let stopped = Boolean(field.value);
  let visible = true;
  example.textContent = ideas[0];

  function pause() { clearTimeout(timer); }
  function schedule(delay = 2800) {
    pause();
    if (!stopped && !reduceMotion.matches && !document.hidden && visible) {
      timer = setTimeout(tick, delay);
    }
  }
  function stop() {
    stopped = true;
    pause();
    example.textContent = ideas[index];
  }
  function tick() {
    if (field.value || field.matches(':disabled') || document.querySelector('dialog[open]')) {
      if (field.value) stop(); else schedule();
      return;
    }
    if (phase === 'erase') {
      length = Math.max(0, length - 2);
      example.textContent = ideas[index].slice(0, length);
      if (length === 0) { index = (index + 1) % ideas.length; phase = 'type'; }
      schedule(length === 0 ? 200 : 34);
    } else {
      length += 1;
      example.textContent = ideas[index].slice(0, length);
      if (length >= ideas[index].length) {
        // One tour of the examples, then settle; no perpetual distraction.
        if (index === 0) { stop(); return; }
        phase = 'erase';
        schedule(2800);
      } else schedule(50);
    }
  }
  field.addEventListener('input', stop, { once: true });
  field.addEventListener('compositionstart', stop, { once: true });
  document.addEventListener('visibilitychange', () => document.hidden ? pause() : schedule());
  reduceMotion.addEventListener('change', () => {
    pause();
    example.textContent = ideas[index];
    length = ideas[index].length;
    phase = 'erase';
    schedule();
  });
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    visible ? schedule() : pause();
  }).observe(field);
  window.addEventListener('pagehide', pause);
  window.addEventListener('pageshow', () => schedule());
  schedule();
})();

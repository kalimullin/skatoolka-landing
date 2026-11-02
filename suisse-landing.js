/* Both entry points use the existing draft, attachments and sign-in flow. */
(() => {
  const primary = document.querySelector('#prompt');
  const secondary = document.querySelector('#closing-prompt');
  const form = document.querySelector('.closing-composer');
  if (!primary || !secondary || !form) return;
  const sync = (from, to) => { to.value = from.value; };
  sync(primary, secondary);
  primary.addEventListener('input', () => sync(primary, secondary));
  primary.addEventListener('draftchange', () => sync(primary, secondary));
  secondary.addEventListener('input', () => {
    sync(secondary, primary);
    primary.dispatchEvent(new Event('input', { bubbles: true }));
  });
  form.addEventListener('submit', event => {
    event.preventDefault();
    sync(secondary, primary);
    document.querySelector('#prompt-form').requestSubmit();
    if (!primary.value.trim()) primary.scrollIntoView({ block: 'center', behavior: 'smooth' });
  });
  secondary.addEventListener('keydown', event => {
    if (event.key === 'Enter' && (event.ctrlKey || event.metaKey) && !event.isComposing) {
      event.preventDefault(); form.requestSubmit();
    }
  });
  form.querySelector('.closing-voice').addEventListener('click', () => document.querySelector('#more-open').click());
  // One shared details panel keeps the existing design and upload actions intact.
  // Anchor it to whichever composer opened it, without moving the page.
  const details = document.querySelector('#prompt-details');
  const triggers = [document.querySelector('#details-toggle'), form.querySelector('.closing-add')];
  let activeTrigger = null;
  triggers.forEach(trigger => {
    const anchor = document.createElement('div');
    anchor.className = 'details-anchor';
    trigger.before(anchor);
    anchor.append(trigger);
    trigger.setAttribute('aria-controls', details.id);
    trigger.setAttribute('aria-expanded', 'false');
    trigger.onclick = () => {
      if (activeTrigger === trigger && !details.hidden) return closeDetails(true);
      closeDetails();
      activeTrigger = trigger;
      anchor.append(details);
      details.hidden = false;
      trigger.setAttribute('aria-expanded', 'true');
      details.querySelector('#file-open').focus({ preventScroll: true });
    };
  });
  function closeDetails(restoreFocus = false) {
    details.hidden = true;
    triggers.forEach(trigger => trigger.setAttribute('aria-expanded', 'false'));
    if (restoreFocus) activeTrigger?.focus({ preventScroll: true });
  }
  details.addEventListener('click', event => {
    if (event.target.closest('button')) closeDetails(true);
  }, true);
  document.addEventListener('pointerdown', event => {
    if (!details.contains(event.target) && !triggers.some(trigger => trigger.contains(event.target))) closeDetails();
  });
  document.addEventListener('focusin', event => {
    if (!details.contains(event.target) && !triggers.includes(event.target)) closeDetails();
  });
  document.addEventListener('keydown', event => {
    if (details.hidden) return;
    if (event.key === 'Escape') { event.preventDefault(); closeDetails(true); }
    if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
      event.preventDefault();
      const buttons = [details.querySelector('#file-open'), details.querySelector('#style-open')];
      const index = buttons.indexOf(document.activeElement);
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : (index + (event.key === 'ArrowDown' ? 1 : -1) + buttons.length) % buttons.length;
      buttons[next].focus({ preventScroll: true });
    }
  });
  matchMedia('(max-width: 760px)').addEventListener('change', () => closeDetails());
  const story = document.querySelector('[data-process-tabs]');
  const description = document.createElement('p');
  description.className = 'process-mobile-description';
  story.querySelector('.process-story').after(description);
  const update = () => { description.textContent = story.querySelector('.process-step.active .step-description').textContent; };
  new MutationObserver(update).observe(story.querySelector('.process-story'), { attributes: true, attributeFilter: ['aria-selected'], subtree: true });
  update();
})();

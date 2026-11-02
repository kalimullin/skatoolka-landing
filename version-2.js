/* Quick-start descriptions from skatoolka.ru. Never submit on selection. */
(() => {
  const field = document.querySelector('#prompt');
  const ideas = {
    personal: 'Создай личный сайт с рассказом обо мне, избранными работами и контактами.',
    landing: 'Эффектный лендинг: тёмная тема, крупная типографика, стеклянные карточки, плавные появления по скроллу, галерея сгенерированных изображений, форма заявки с сохранением в базу.',
    crm: 'CRM со сделками: канбан по статусам с перетаскиванием, карточка с заметками, фильтры и поиск, сводка сумм сверху.',
    telegram: 'Telegram-бот с меню кнопок: пользователь оставляет заявку, она сохраняется в базу, есть команда «мои заявки» и веб-страница со списком.',
    dashboard: 'Дашборд по загруженному CSV: четыре ключевых показателя, график по месяцам, разбивка по категориям, таблица с сортировкой и фильтрами.',
    sales: 'Продающий лендинг под одно целевое действие: сильный оффер на первом экране, выгода, демонстрация продукта, отзывы, FAQ и повторяющиеся кнопки заявки. Меню — якорями внутри страницы, без лишних анимаций.',
  };
  document.querySelectorAll('[data-idea]').forEach(button => {
    button.addEventListener('click', () => {
      const text = ideas[button.dataset.idea];
      if (!text) return;
      const previous = field.value;
      if (previous !== text) {
        // Keep the shared draft/validation lifecycle and its existing undo control.
        const original = undoDraft ?? (previous.trim() ? previous : null);
        field.value = text;
        field.dispatchEvent(new Event('input', { bubbles: true }));
        undoDraft = original;
        saveDraft();
      }
      // Keep focus on the chosen idea; filling a draft must not open the keyboard.
      announce('Идея добавлена. Измените описание под свою задачу.');
    });
  });
})();

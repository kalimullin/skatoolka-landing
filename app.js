/* Disposable wireframe. No auth, generation, analytics or API requests. */
'use strict';
const $ = (selector) => document.querySelector(selector);
const prompt = $('#prompt');
const dialog = $('#dialog');
const content = $('#dialog-content');
const emptyPromptMessage = document.querySelector('[data-dialog="prompt-example"]')
  ? 'Опишите, что хотите создать, или откройте пример под полем.'
  : 'Опишите, что хотите создать. Например, сайт кофейни с меню и адресом.';
const examples = {
  coffee: {title:'Сайт кофейни', text:'Создай сайт для тестовой кофейни «Утро». Покажи меню с ценами, фотографии интерьера, адрес и часы работы. Посетитель должен быстро найти меню и понять, как добраться.'},
  portfolio: {title:'Портфолио фотографа', text:'Создай сайт-портфолио для тестового фотографа. Покажи работы по категориям: портреты, съёмки для бизнеса и события. Добавь рассказ о фотографе и контакты. Посетитель должен оценить стиль фотографий и связаться для обсуждения съёмки.'},
  service: {title:'Лендинг услуги', text:'Создай лендинг тестовой службы химчистки мебели для запуска рекламы. Расскажи об услугах, ценах и порядке работы, добавь ответы на частые вопросы. Посетитель должен понять предложение и связаться по телефону или в мессенджере. Форму заявки и личный кабинет не добавляй.'}
};
const styles = ['Авто','Спокойный','Выразительный','Деловой'];
const headlines = [
  {lines:['Создайте сайт или приложение.','Просто опишите идею.'], note:'Исходный вариант. Два призыва подряд.'},
  {lines:['Сайты и приложения','из вашего описания'], note:'Рекомендую. Коротко называет результат и способ создания.'},
  {lines:['Опишите задачу.','Шкатулка соберёт сайт или приложение.'], note:'Объясняет, что делает человек и что берёт на себя сервис.'},
  {lines:['Создавайте сайты и приложения,','общаясь с ИИ'], note:'Подчёркивает работу через диалог, включая дальнейшие правки.'}
];
const exampleChecks = {
  coffee:'Открыть опубликованный сайт на телефоне, проверить меню, изображения, адрес и переходы. Сопоставить результат с исходным описанием.',
  portfolio:'Проверить фотографии и категории работ на телефоне, читаемость информации и ссылки для связи с фотографом.',
  service:'Проверить услуги, цены, порядок работы и ответы на вопросы на телефоне. Кнопка связи должна открывать нужный номер или мессенджер.'
};
let selectedHeadline = 1;
let chosenStyle = 'Авто';
let files = [];
let undoDraft = null;
let returnFocus = null;
let timers = [];
let previewKey = 'coffee';
let canPersist = true;
try {
  const stored = JSON.parse(sessionStorage.getItem('skatoolka-wireframe-draft') || 'null');
  if (stored) { prompt.value = stored.text || ''; chosenStyle = styles.includes(stored.style) ? stored.style : 'Авто'; }
} catch { canPersist = false; }

function announce(text) { $('#announcement').textContent = ''; requestAnimationFrame(() => { $('#announcement').textContent = text; }); }
function resizePrompt() {
  if (!document.body.classList.contains('version-three')) return;
  prompt.style.maxHeight = 'none';
  prompt.style.overflowY = 'hidden';
  prompt.style.height = 'auto';
  const style = getComputedStyle(prompt);
  const borders = parseFloat(style.borderTopWidth) + parseFloat(style.borderBottomWidth);
  prompt.style.height = `${prompt.scrollHeight + borders}px`;
}
function saveDraft() {
  resizePrompt();
  prompt.dispatchEvent(new Event('draftchange'));
  try {sessionStorage.setItem('skatoolka-wireframe-draft', JSON.stringify({text:prompt.value,style:chosenStyle}));canPersist=true;} catch {canPersist=false;}
  $('#style-value').textContent = chosenStyle === 'Авто' ? 'Автоматически' : chosenStyle;
  $('#selected-design').hidden = chosenStyle === 'Авто';
  $('#selected-design').textContent = chosenStyle === 'Авто' ? '' : `Дизайн: ${chosenStyle}`;
  updateDetailsLabel();
  const status = $('#draft-status');
  status.textContent = prompt.value ? (canPersist ? 'Текст сохранён в этой вкладке' : 'Текст останется, пока страница открыта') : '';
  if (undoDraft !== null) {
    const undo = document.createElement('button');
    undo.type = 'button';undo.className = 'restore-button';undo.textContent = 'Вернуть мой текст';
    undo.onclick = () => {prompt.value = undoDraft;undoDraft=null;clearError();saveDraft();prompt.focus();announce('Предыдущее описание восстановлено.');};
    status.append(' · ',undo);
  }
}
function clearError() {$('#prompt-error').hidden=true;$('#prompt-error').textContent='';prompt.removeAttribute('aria-invalid');}
function updateDetailsLabel() {$('#details-label').textContent = chosenStyle !== 'Авто' || files.length ? 'Изменить детали' : 'Добавить детали';}
function showHeadlines() {
  openDialog('Для сравнения · 3 новых варианта',`<h2 id="dialog-title">Выберите заголовок первого экрана</h2><p>Вариант появится в макете. Подзаголовок остаётся прежним, чтобы сравнить именно тайтлы.</p><div class="headline-options">${headlines.map((item,i)=>`<button class="style-option headline-option" data-headline="${i}" aria-pressed="${i===selectedHeadline}"><span>${i===0?'Исходный':'Вариант '+i}</span><b>${item.lines.join(' ')}</b><span>${item.note}</span></button>`).join('')}</div>`);
  content.querySelectorAll('[data-headline]').forEach(button=>button.onclick=()=>{
    selectedHeadline=Number(button.dataset.headline);
    const lines=headlines[selectedHeadline].lines;
    $('#hero-title').replaceChildren(document.createTextNode(lines[0]),document.createElement('br'),document.createTextNode(' '+lines[1]));
    closeDialog();$('#hero-title').scrollIntoView({block:'center'});announce('Заголовок изменён.');
  });
}
function showPromptExample() {
  openDialog('Пример описания',`<h2 id="dialog-title">Расскажите, для кого и зачем нужен сайт</h2><p>Начните с задачи и того, что посетитель должен увидеть или сделать.</p><div class="request-summary" id="sample-text"></div><div class="actions"><button class="button primary" id="use-prompt">Использовать описание</button><button class="button" id="write-own">Написать своё</button></div><p class="footnote">Это пример формулировки, не обещание проверенного результата генерации.</p>`);
  $('#sample-text').textContent=examples.coffee.text;
  $('#use-prompt').onclick=()=>{closeDialog();setIdea('coffee');};
  $('#write-own').onclick=()=>{closeDialog();startAtInput();};
}
function fieldError(message, invalid=true) {const error=$('#prompt-error');error.hidden=false;error.textContent=message;if(invalid)prompt.setAttribute('aria-invalid','true');}
function setIdea(key) {
  if (prompt.value.trim() && prompt.value !== examples[key].text) undoDraft=prompt.value;
  prompt.value=examples[key].text;clearError();saveDraft();startAtInput();announce('Пример добавлен. Измените описание под свою задачу.');
}
function startAtInput() {document.querySelector('.composer').scrollIntoView({block:'center'});prompt.focus({preventScroll:true});}
function cancelTimers() {timers.forEach(clearTimeout);timers=[];}
function openDialog(kicker,html) {
  cancelTimers();
  if (!dialog.open) returnFocus=document.activeElement;
  $('#dialog-kicker').textContent=kicker;
  content.innerHTML=document.body.classList.contains('visual-design')
    ? html.replaceAll('↗','<span class="icon icon-arrow" aria-hidden="true"></span>') : html;
  if(!dialog.open)dialog.showModal();
  const heading=$('#dialog-title');if(heading){heading.tabIndex=-1;heading.focus();}
}
function closeDialog() {dialog.close();}
dialog.addEventListener('close',()=>{cancelTimers();if(returnFocus?.isConnected)returnFocus.focus({preventScroll:true});});
$('#dialog-close').onclick=closeDialog;
dialog.addEventListener('click',(event)=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)closeDialog();}});

function showStyle() {
  openDialog('Необязательный шаг',`<h2 id="dialog-title">Как должен выглядеть проект?</h2><p>Выберите направление или оставьте подбор Шкатулке. Описание вашей задачи останется прежним.</p><div class="style-list">${styles.map((name,i)=>`<button class="style-option" data-style="${name}" aria-pressed="${chosenStyle===name}"><b>${name==='Авто'?'Подобрать автоматически':name}</b><span>${['Шкатулка предложит дизайн по вашей задаче','Сдержанные цвета и свободная композиция','Крупные заголовки и заметные акценты','Плотная сетка для данных и рабочих задач'][i]}</span></button>`).join('')}</div><p class="footnote">Для обсуждения: названия направлений и библиотека ещё не утверждены.</p>`);
  content.querySelectorAll('[data-style]').forEach(button=>button.onclick=()=>{chosenStyle=button.dataset.style;saveDraft();closeDialog();announce(`Дизайн: ${chosenStyle}.`);});
}
function showAuth(login=false) {
  openDialog('Демонстрация · вход в продукт',`<h2 id="dialog-title">${login?'Войдите в Шкатулку':'Сохраните идею в своём аккаунте'}</h2><p>${login?'После входа вы сможете продолжить работу над проектами.':'Создайте аккаунт или войдите, чтобы продолжить. Ваше описание перейдёт в проект.'}</p><div class="request-summary" id="request-summary"></div><p class="note">Это граница лендинга и продукта. Вход здесь имитируется: аккаунт не создаётся, личные данные не нужны.</p><div class="actions"><button class="button primary" id="auth-demo">Продолжить в демо ↗</button><button class="button" id="auth-back">Вернуться к описанию</button></div><p class="footnote">В продукте здесь открывается существующая регистрация с сохранением описания, дизайна и изображений. Этот перенос нужно проверить с разработкой.</p>`);
  $('#request-summary').textContent=prompt.value.trim() || 'Описание пока не добавлено. Можно вернуться и начать со своей идеи.';
  $('#auth-demo').onclick=()=>{if(!prompt.value.trim()){closeDialog();startAtInput();fieldError(emptyPromptMessage);return;}showLoading();};
  $('#auth-back').onclick=()=>{closeDialog();startAtInput();};
}
function showLoading(fail=false,hold=false) {
  openDialog('Демонстрация · генерация',`<h2 id="dialog-title">Создаём первую версию</h2><p>Описание остаётся в проекте. Сначала составим план, затем соберём страницы.</p><ol class="flow-steps" aria-label="Этапы создания"><li class="active" id="stage-plan">1. Составляем план</li><li id="stage-build">2. Собираем страницы</li><li id="stage-result">3. Готовим предпросмотр</li></ol><p id="flow-status" role="status">Составляем план по вашему описанию…</p><div class="actions"><button class="button" id="stop-demo">Вернуться к описанию</button></div><p class="footnote">${hold?'Состояние остановлено для просмотра.':'Демо длится несколько секунд. Реальное время генерации не оценивалось.'} Реальный проект не создаётся.</p>`);
  $('#stop-demo').onclick=()=>{closeDialog();startAtInput();};
  if(hold)return;
  timers.push(setTimeout(()=>{$('#stage-plan').classList.remove('active');$('#stage-plan').textContent='План составлен';$('#stage-build').classList.add('active');$('#flow-status').textContent='Собираем страницы по плану…';},1400));
  timers.push(setTimeout(()=>{if(fail){showFailure();return;}$('#stage-build').classList.remove('active');$('#stage-build').textContent='Страницы собраны';$('#stage-result').classList.add('active');$('#flow-status').textContent='Готовим предпросмотр…';},2800));
  timers.push(setTimeout(showResult,4100));
}
function showFailure(dependency=false) {
  openDialog('Демонстрация · восстановление',`<h2 id="dialog-title">${dependency?'Не удалось открыть вход':'Не удалось создать первую версию'}</h2><p>${dependency?'Сервис входа сейчас недоступен.':'Сервис генерации не ответил.'} Ваше описание, дизайн и изображения остались в этой вкладке. Попробуйте ещё раз или вернитесь к описанию.</p><div class="actions"><button class="button primary" id="retry">Попробовать ещё раз</button><button class="button" id="failure-back">Вернуться к описанию</button></div><p><a href="https://t.me/skatoolka_support" target="_blank" rel="noopener">Написать в поддержку ↗</a></p><p class="footnote">Ошибка имитируется. Правила списания и возврата запросов требуют подтверждения, поэтому обещания о них здесь нет.</p>`);
  $('#retry').onclick=()=>dependency?showAuth():showLoading();$('#failure-back').onclick=()=>{closeDialog();startAtInput();};
}
function showResult() {
  openDialog('Демонстрация · конец сценария лендинга',`<h2 id="dialog-title">Первая версия готова</h2><p>Дальше в продукте: откройте предпросмотр, проверьте результат и напишите в чате, что изменить. Публикация будет отдельным действием.</p><div class="note"><b>Здесь открывается редактор проекта.</b><br>В этом вайрфрейме проверяем путь до редактора. Генерация, сам редактор и публикация не подключены.</div><div class="actions"><button class="button primary" id="result-back">Вернуться к лендингу</button></div>`);
  $('#result-back').onclick=()=>{closeDialog();startAtInput();};
}
function showPreview(key) {
  previewKey=key;
  openDialog('Кандидат для проверки · не готовый результат',`<h2 id="dialog-title">${examples[key].title}</h2><div class="modal-preview" id="modal-preview"></div><p>Эта схема показывает идею проекта. Создание и работа такого проекта в Шкатулке пока не проверены.</p><p class="note"><b>Что проверить перед показом на лендинге</b><br>${exampleChecks[key]}</p><div class="actions"><button class="button primary" id="use-example">Использовать описание ↗</button><button class="button" id="preview-next">Следующий пример</button></div><p class="footnote">Для публикации нужны работающий URL, исходное описание, число итераций и запросов, перечень ручных доработок и разрешение команды на показ.</p><h3>Описание для пробной генерации</h3><div class="request-summary" id="example-text"></div>`);
  const source=document.querySelector(`[data-preview="${key}"]`);
  $('#modal-preview').innerHTML=source.innerHTML;
  $('#example-text').textContent=examples[key].text;
  $('#use-example').onclick=()=>{closeDialog();setIdea(key);};
  $('#preview-next').onclick=()=>{const keys=Object.keys(examples);showPreview(keys[(keys.indexOf(previewKey)+1)%keys.length]);};
}
function showMore() {
  openDialog('Способ ввода',`<h2 id="dialog-title">Опишите идею голосом</h2><p>В продукте можно надиктовать описание. Перед отправкой текст должен оставаться доступным для редактирования.</p><div class="note">Прототип не включает микрофон. Кнопка ниже подставит демонстрационный текст, чтобы проверить сценарий.</div><div class="actions"><button class="button primary" id="voice-demo">Вставить пример диктовки</button></div>`);
  $('#voice-demo').onclick=()=>{closeDialog();if(prompt.value.trim())undoDraft=prompt.value;prompt.value=(prompt.value.trim()?prompt.value.trim()+'\n':'')+'Добавь на сайт раздел с ответами на частые вопросы.';clearError();saveDraft();startAtInput();};
}
function renderFiles() {
  const list=$('#attachments');list.replaceChildren();
  updateDetailsLabel();
  files.forEach((entry,index)=>{
    const item=document.createElement('div');item.className='attachment';
    const image=document.createElement('img');image.src=entry.url;image.alt='';
    const name=document.createElement('span');name.textContent=entry.file.name;
    const remove=document.createElement('button');remove.type='button';const closeIcon=document.createElement('img');closeIcon.src='assets/figma-current/342-1411-imgIconClose.svg';closeIcon.alt='';closeIcon.width=14;closeIcon.height=14;remove.append(closeIcon);remove.setAttribute('aria-label',`Удалить изображение ${entry.file.name}`);
    remove.onclick=()=>{URL.revokeObjectURL(entry.url);files.splice(index,1);renderFiles();$('#file-open').focus();announce('Изображение удалено. Описание сохранено.');};
    item.append(image,name,remove);list.append(item);
  });
}
$('#file-input').onchange=(event)=>{
  clearError();const errors=[];
  for(const file of event.target.files){
    if(!['image/png','image/jpeg','image/webp'].includes(file.type)){errors.push('Этот формат не подходит. Выберите PNG, JPG или WebP.');continue;}
    if(file.size>10*1024*1024){errors.push('В прототипе можно добавить файл до 10 МБ. Выберите изображение поменьше.');continue;}
    files.push({file,url:URL.createObjectURL(file)});
  }
  renderFiles();event.target.value='';
  if(errors.length)fieldError([...new Set(errors)].join(' ')+' Описание и добавленные изображения остались в поле.',false);
  else announce('Изображения добавлены. Они хранятся только в открытом прототипе.');
};
function showNotes() {
  openDialog('Для обсуждения · 23 сентября',`<h2 id="dialog-title">От обещания к результату</h2><p>Опора: обе встречи, смета и текущий сайт. В этой версии обсуждаем структуру, тексты и старт генерации. Визуальный стиль ещё не выбран.</p><ol class="notes-list"><li><b>Назвать продукт прямо.</b> Сайт или приложение вместо «Открой свою шкатулку». Первое прочтение должно объяснять, что получится.</li><li><b>Показать результат рядом со стартом.</b> Место под три сильных живых проекта сразу после инпута. Пока показаны схемы сайта кофейни, портфолио фотографа и лендинга услуги. Их заменят реальные результаты команды. Видео остаётся возможным дополнением, а не единственным объяснением.</li><li><b>Снизить порог пустого поля.</b> Поле и основной CTA. Дизайн, изображения и диктовка раскрываются через «Добавить детали». Пример описания доступен по одной ссылке.</li><li><b>Согласовать ожидания.</b> Первый экран говорит о задаче пользователя: представить бизнес, показать работы, запустить страницу для рекламы. Перед созданием показываем регистрацию. Бесплатный лимит относится к запросам, а не сайтам.</li><li><b>Довести историю до публикации.</b> Редактирование и публикация показаны разными шагами. Собственный домен отмечен как платная возможность.</li><li><b>Дать путь к человеку.</b> Поддержка в шапке, в ошибке и в FAQ. Она доступна до начала работы, но не конкурирует с примером описания под инпутом.</li></ol><h3>Что пока является гипотезой</h3><p>Перенос описания, изображений и дизайна через регистрацию; состав библиотеки дизайна; этапы генерации; правила файлов и сохранения черновика. Всё это требует проверки с продуктом.</p><h3>Что нужно для следующей итерации</h3><p>Три лучших результата с живыми ссылками и исходными описаниями. Подтверждение ограничений бесплатного тарифа, публикации и актуального статуса выбора дизайна.</p><h3>Почему этот порядок</h3><p>Галерея на первом месте откладывает действие. Сложный конструктор на первом экране перегружает новичка. Здесь сохраняем один простой старт и сразу подкрепляем его результатами.</p><p class="footnote">Тариф «Старт»: 5 запросов/месяц, бесплатно. Проверено на skatoolka.ru/pricing/ 23.09.2026. Громкие обещания про сроки, безошибочность и готовый бизнес не используются.</p>`);
}
function showStates() {
  openDialog('Инструменты ревью · не часть лендинга',`<h2 id="dialog-title">Проверьте старт генерации</h2><p>Выберите состояние. Переходы имитируются локально, запросы не списываются.</p><div class="state-list"><button data-state="empty">01 · Пустое поле</button><button data-state="filled">02 · Описание добавлено</button><button data-state="auth">03 · Регистрация</button><button data-state="loading">04 · Генерация</button><button data-state="error">05 · Ошибка генерации</button><button data-state="dependency">06 · Вход недоступен</button><button data-state="overflow">07 · Длинное описание</button><button data-state="result">08 · Первая версия готова</button></div><p class="footnote">Также работают: примеры, отмена подстановки, дизайн, изображения, FAQ, Tab, Escape. Мобильная версия включается при сужении окна.</p>`);
  content.querySelectorAll('[data-state]').forEach(button=>button.onclick=()=>{
    const state=button.dataset.state;
    if(['empty','filled','overflow'].includes(state)){
      closeDialog();if(prompt.value.trim())undoDraft=prompt.value;
      prompt.value=state==='empty'?'':state==='filled'?examples.coffee.text:Array(20).fill(examples.portfolio.text).join('\n');
      clearError();saveDraft();startAtInput();if(state==='empty')fieldError(emptyPromptMessage);return;
    }
    if(state==='auth')showAuth();if(state==='loading')showLoading(false,true);if(state==='error')showFailure();if(state==='dependency')showFailure(true);if(state==='result')showResult();
  });
}
prompt.addEventListener('input',()=>{clearError();undoDraft=null;saveDraft();});
prompt.addEventListener('keydown',(event)=>{if(event.key==='Enter'&&(event.ctrlKey||event.metaKey)&&!event.isComposing){event.preventDefault();$('#prompt-form').requestSubmit();}});
$('#prompt-form').addEventListener('submit',(event)=>{event.preventDefault();clearError();if(!prompt.value.trim()){fieldError(emptyPromptMessage);prompt.focus();return;}saveDraft();showAuth();});
$('#style-open').onclick=showStyle;$('#file-open').onclick=()=>$('#file-input').click();$('#more-open').onclick=showMore;
$('#details-toggle').onclick=()=>{const expanded=$('#details-toggle').getAttribute('aria-expanded')!=='true';$('#details-toggle').setAttribute('aria-expanded',String(expanded));$('#prompt-details').hidden=!expanded;};
$('#login')?.addEventListener('click',()=>showAuth(true));
document.querySelectorAll('[data-start]').forEach(button=>button.onclick=startAtInput);
document.querySelectorAll('[data-prompt]').forEach(button=>button.onclick=()=>setIdea(button.dataset.prompt));
document.querySelectorAll('[data-preview]').forEach(button=>button.onclick=()=>showPreview(button.dataset.preview));
const dialogActions = {notes:showNotes,states:showStates,headlines:showHeadlines,'prompt-example':showPromptExample};
document.querySelectorAll('[data-dialog]').forEach(button=>button.onclick=dialogActions[button.dataset.dialog]);
saveDraft();

// Reflow restored drafts and long descriptions when the available width changes.
if (document.body.classList.contains('version-three')) {
  let previousWidth = 0;
  new ResizeObserver(([entry]) => {
    if (entry.contentRect.width === previousWidth) return;
    previousWidth = entry.contentRect.width;
    resizePrompt();
  }).observe(prompt.parentElement);
  document.fonts.ready.then(resizePrompt);
}

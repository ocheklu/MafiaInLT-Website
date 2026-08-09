// ===========================
// CALCULATOR V2 - IMPROVED FLOW
// ===========================

const calculatorState = {
    service: null,
    dateStart: null,
    dateEnd: null,
    tables: null,
    days: null,
    location: 'vilnius',
    distance: 0,
    additionalServices: [],
    currentStep: 1,
    completedSteps: [1]
};

// Пока идёт анимация перехода между шагами, любые клики игнорируются:
// иначе двойной тап запускает два перехода сразу и шаг может «пропасть».
let isTransitioning = false;
const STEP_ANIMATION_MS = 600;

// Подпись под полосой шагов на телефоне: «3 / 6» и название текущего шага.
// Название берём из разметки полосы, чтобы не дублировать переводы.
function updateProgressCaption(currentStep) {
    const countEl = document.querySelector('.progress-caption-count');
    const titleEl = document.querySelector('.progress-caption-title');
    if (!countEl || !titleEl) return;

    const total = document.querySelectorAll('.progress-step').length;
    const label = document.querySelector('.progress-step[data-step="' + currentStep + '"] .progress-label');

    countEl.textContent = currentStep + ' / ' + total;
    titleEl.textContent = label ? label.textContent : '';
}

// Update progress bar with bullet animation
function updateProgressBar(currentStep) {
    updateProgressCaption(currentStep);

    const steps = document.querySelectorAll('.progress-step');
    const progressLine = document.querySelector('.progress-line');
    const progressLineBg = document.querySelector('.progress-line-bg');
    const progressBullet = document.querySelector('.progress-bullet');
    
    steps.forEach((step, index) => {
        const stepNum = index + 1;
        if (stepNum < currentStep) {
            step.classList.add('completed');
            step.classList.remove('active');
        } else if (stepNum === currentStep) {
            step.classList.add('active');
            step.classList.remove('completed');
        } else {
            step.classList.remove('active', 'completed');
        }
    });
    
    // Calculate width of progress line from center to center
    const progressBar = document.querySelector('.progress-bar');
    const firstStep = steps[0];
    const targetStep = steps[currentStep - 1];
    
    if (progressBar && firstStep && targetStep) {
        const firstRect = firstStep.getBoundingClientRect();
        const targetRect = targetStep.getBoundingClientRect();
        const barRect = progressBar.getBoundingClientRect();
        
        // Calculate centers
        const firstCenter = firstRect.left + (firstRect.width / 2) - barRect.left;
        const targetCenter = targetRect.left + (targetRect.width / 2) - barRect.left;
        
        // Width from first center to target center
        const lineWidth = targetCenter - firstCenter;
        progressLine.style.width = lineWidth + 'px';
        progressLine.style.left = firstCenter + 'px';
        
        // Position background line from first to last step
        if (progressLineBg) {
            const lastStep = steps[steps.length - 1];
            const lastRect = lastStep.getBoundingClientRect();
            const lastCenter = lastRect.left + (lastRect.width / 2) - barRect.left;
            
            progressLineBg.style.left = firstCenter + 'px';
            progressLineBg.style.width = (lastCenter - firstCenter) + 'px';
        }
    }
}

// Reset all steps after given step number
function resetStepsAfter(stepNumber) {
    // Clear data based on step
    if (stepNumber < 2) {
        calculatorState.dateStart = null;
        calculatorState.dateEnd = null;
        calculatorState.tables = null;
        calculatorState.days = null;
        calculatorState.location = 'vilnius';
        calculatorState.distance = 0;
        calculatorState.additionalServices = [];
    }
    if (stepNumber < 3) {
        calculatorState.tables = null;
        calculatorState.days = null;
        calculatorState.location = 'vilnius';
        calculatorState.distance = 0;
        calculatorState.additionalServices = [];
    }
    if (stepNumber < 4) {
        calculatorState.location = 'vilnius';
        calculatorState.distance = 0;
        calculatorState.additionalServices = [];
    }
    if (stepNumber < 5) {
        calculatorState.additionalServices = [];
    }
    
    // Update completed steps
    calculatorState.completedSteps = calculatorState.completedSteps.filter(s => s <= stepNumber);

    // Update progress bar visual
    updateProgressBar(stepNumber);
    updatePriceBar();
}

// Шаги калькулятора в Google Analytics — иначе не видно, где люди бросают форму.
// Ключи шагов латиницей и одинаковые для всех языков, чтобы отчёты сходились.
const STEP_KEYS = {
    1: 'service',
    2: 'date',
    3: 'tables',
    4: 'location',
    5: 'services',
    6: 'summary'
};

function trackCalculatorEvent(name, params) {
    if (typeof gtag !== 'function') return;
    gtag('event', name, params || {});
}

// 'YYYY-MM-DD' → Date по местному времени.
// Через new Date(строка) нельзя: такая строка разбирается как UTC и в нашем
// поясе может съехать на сутки назад.
function parseCalcDate(str) {
    const parts = str.split('-');
    return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
}

// Прокрутка к началу калькулятора после смены шага: иначе на телефоне экран
// остаётся посреди предыдущего списка и нового заголовка не видно
function scrollToCalculatorTop() {
    const anchor = document.querySelector('.progress-bar-container') || document.getElementById('calculator');
    if (!anchor) return;

    const navbar = document.querySelector('.navbar');
    const navHeight = navbar ? navbar.getBoundingClientRect().height : 0;
    const target = anchor.getBoundingClientRect().top + window.pageYOffset - navHeight - 16;

    // Поднимаем страницу, только если пользователь ушёл ниже начала калькулятора.
    // Если калькулятор и так перед глазами — не дёргаем.
    if (window.pageYOffset <= target + 8) return;

    window.scrollTo({ top: Math.max(target, 0), behavior: 'smooth' });
}

// Высота контейнера подгоняется под текущий шаг: короткие шаги больше не
// оставляют пустоту, а переход между шагами не дёргает страницу.
// ResizeObserver ловит и то, что содержимое меняется позже — например,
// список услуг подставляется через полсекунды, а календарь меняет высоту
// при переключении месяца.
function syncStepsHeight() {
    const container = document.querySelector('.calculator-steps-container');
    const active = document.querySelector('.calculator-step.active');
    if (!container || !active) return;

    container.style.height = active.offsetHeight + 'px';
}

if (window.ResizeObserver) {
    const stepObserver = new ResizeObserver(syncStepsHeight);
    document.addEventListener('DOMContentLoaded', function() {
        document.querySelectorAll('.calculator-step').forEach(function(step) {
            stepObserver.observe(step);
        });
    });
}

// Предыдущий доступный шаг. Для атрибутики шаги «Stalai» и «Lokacija»
// в completedSteps не попадают, поэтому назад ведёт сразу к календарю
function previousAvailableStep() {
    const earlier = calculatorState.completedSteps.filter(s => s < calculatorState.currentStep);
    return earlier.length ? Math.max.apply(null, earlier) : null;
}

function updateBackButton() {
    const btn = document.getElementById('back-btn');
    if (!btn) return;
    btn.style.display = previousAvailableStep() ? 'inline-block' : 'none';
}

// Единый расчёт цены — используется и в липкой полосе, и в сводке
function calculateTotal() {
    if (!calculatorState.service) return 0;

    let basePrice = 0;
    if (calculatorState.service === 'atributika') {
        if (!calculatorState.days) return 0;
        basePrice = prices.atributika * calculatorState.days;
    } else {
        if (!calculatorState.tables) return 0;
        basePrice = prices[calculatorState.service][calculatorState.tables] + calculatorState.distance;
    }

    return basePrice + calculatorState.additionalServices.reduce((sum, s) => sum + s.price, 0);
}

// Липкая полоса с ценой на телефоне: появляется, как только цену уже можно посчитать,
// и прячется на последнем шаге, где сумма и так показана крупно
function updatePriceBar() {
    const bar = document.getElementById('calc-price-bar');
    if (!bar) return;

    const total = calculateTotal();
    const visible = total > 0 && calculatorState.currentStep < 6;

    bar.classList.toggle('show', visible);
    if (visible) {
        document.getElementById('calc-price-bar-value').textContent = total;
    }
}

// Go to specific step by clicking on progress bar
function goToStep(stepNumber) {
    if (isTransitioning) return;

    // Can only go to completed steps or current step
    if (!calculatorState.completedSteps.includes(stepNumber)) {
        return;
    }
    
    // Map step numbers to IDs based on service type
    let targetStepId;
    if (stepNumber === 1) targetStepId = 'step-service';
    else if (stepNumber === 2) targetStepId = 'step-calendar';
    else if (stepNumber === 3) {
        if (calculatorState.service === 'atributika') return; // Skip for atributika
        targetStepId = 'step-tables';
    }
    else if (stepNumber === 4) {
        if (calculatorState.service === 'atributika') return; // Skip for atributika
        targetStepId = 'step-location'; // For both zaidimo and renginio
    }
    else if (stepNumber === 5) targetStepId = 'step-services';
    else if (stepNumber === 6) targetStepId = 'step-summary';
    
    const currentStepId = document.querySelector('.calculator-step.active')?.id;
    
    if (!targetStepId || !currentStepId || targetStepId === currentStepId) {
        return;
    }
    
    // Hide current step
    const currentStep = document.getElementById(currentStepId);
    currentStep.classList.remove('active');
    currentStep.style.display = 'none';
    
    // Show target step
    const targetStep = document.getElementById(targetStepId);
    targetStep.style.display = 'block';
    targetStep.classList.add('active');
    
    calculatorState.currentStep = stepNumber;
    updateProgressBar(stepNumber);
    
    // Hide/show "Toliau" button based on step
    const nextButton = document.getElementById('next-to-summary-btn');
    if (nextButton) {
        if (stepNumber === 5) {
            nextButton.style.display = 'inline-block';
        } else {
            nextButton.style.display = 'none';
        }
    }
    
    // Re-initialize calendar if going back to step 2
    if (stepNumber === 2 && targetStepId === 'step-calendar') {
        setTimeout(() => initCalculatorCalendar(), 100);
    }
    
    // Re-show services if going to step 5
    if (stepNumber === 5 && targetStepId === 'step-services') {
        setTimeout(() => showServicesStep(), 100);
    }

    updateBackButton();
    updatePriceBar();
    scrollToCalculatorTop();
}

document.getElementById('back-btn')?.addEventListener('click', function() {
    if (isTransitioning) return;

    const step = previousAvailableStep();
    if (step) goToStep(step);
});

// Transition between steps with animation
function transitionToStep(currentStepId, nextStepId, progressStep) {
    const currentStep = document.getElementById(currentStepId);
    const nextStep = document.getElementById(nextStepId);
    
    if (!currentStep || !nextStep) return;

    isTransitioning = true;
    setTimeout(() => { isTransitioning = false; }, STEP_ANIMATION_MS);

    // Mark step as completed
    if (!calculatorState.completedSteps.includes(progressStep)) {
        calculatorState.completedSteps.push(progressStep);

        // Шаг засчитываем один раз — при первом достижении, а не при возвратах
        trackCalculatorEvent('calculator_step', {
            step_number: progressStep,
            step_name: STEP_KEYS[progressStep] || String(progressStep),
            service: calculatorState.service || 'none',
            language: CALC_LANG
        });
    }
    calculatorState.currentStep = progressStep;
    
    // Hide "Toliau" button on all steps except step 5
    const nextButton = document.getElementById('next-to-summary-btn');
    if (nextButton && progressStep !== 5) {
        nextButton.style.display = 'none';
    }
    
    // Exit current step
    currentStep.classList.add('exit-left');
    currentStep.classList.remove('active');
    
    setTimeout(() => {
        currentStep.style.display = 'none';
        
        // Show and animate next step
        nextStep.style.display = 'block';
        nextStep.classList.remove('exit-left');
        
        // Force reflow
        nextStep.offsetHeight;
        
        // Add active class to trigger CSS animation
        nextStep.classList.add('active');
        updateProgressBar(progressStep);
    }, 500);

    updateBackButton();
    updatePriceBar();
    scrollToCalculatorTop();
}

const prices = {
    zaidimo: {
        1: 600,
        2: 1200
    },
    renginio: {
        1: 1200,
        2: 2200
    },
    atributika: 150
};

const additionalServicesPrices = {
    'Stalo dekoravimas': 200,
    'Stalų dekoravimas': 400,
    'Vietos paieška ir rezervacija': 50,
    'Erdvės dekoravimas': 400,
    'Foto paslaugos (3 val.)': 600,
    'Video paslaugos (3 val.)': 600
};

// Локализация калькулятора: язык задаёт <html lang> (/ — LT, /ru/ — RU, /en/ — EN).
// Внутренние ключи услуг остаются литовскими — SVC_NAMES переводит только отображение.
// В Formspree заявка уходит с литовскими названиями, чтобы все заявки читались одинаково.
const CALC_LANG = (document.documentElement.lang || 'lt').slice(0, 2);

const CALC_L10N = {
    lt: {
        serviceNames: {
            'zaidimo': 'Žaidimo organizavimas',
            'renginio': 'Renginio organizavimas',
            'atributika': 'Atributikos nuoma'
        },
        service: 'Paslauga',
        date: 'Data',
        endDate: 'Pabaigos data',
        tables: 'Stalų kiekis',
        days: 'Parų kiekis',
        location: 'Lokacija',
        distance: 'Atstumas',
        additionalServices: 'Papildomos paslaugos',
        vilnius: 'Vilnius',
        outsideVilnius: 'Už Vilniaus ribų',
        error: 'Klaida',
        invalidName: 'Prašome įvesti savo vardą',
        invalidPhone: 'Prašome įvesti telefono numerį',
        invalidEmail: 'Prašome įvesti galiojantį el. pašto adresą',
        thanks: 'Ačiū',
        requestSent: 'Jūsų užklausa išsiųsta. Susisieksime su jumis artimiausiu metu.',
        requestFailed: 'Užklausa neišsiųsta. Prašome bandyti dar kartą.',
        selectEndDate: 'Pasirinkite pabaigos datą',
        sending: 'Siunčiama…',
        sent: 'Išsiųsta'
    },
    ru: {
        serviceNames: {
            'zaidimo': 'Организация игры',
            'renginio': 'Организация мероприятия',
            'atributika': 'Аренда реквизита'
        },
        service: 'Услуга',
        date: 'Дата',
        endDate: 'Дата окончания',
        tables: 'Количество столов',
        days: 'Количество суток',
        location: 'Локация',
        distance: 'Расстояние',
        additionalServices: 'Дополнительные услуги',
        vilnius: 'Вильнюс',
        outsideVilnius: 'За пределами Вильнюса',
        error: 'Ошибка',
        invalidName: 'Пожалуйста, укажите ваше имя',
        invalidPhone: 'Пожалуйста, укажите номер телефона',
        invalidEmail: 'Пожалуйста, введите корректный адрес эл. почты',
        thanks: 'Спасибо',
        requestSent: 'Ваш запрос отправлен. Мы свяжемся с вами в ближайшее время.',
        requestFailed: 'Запрос не отправлен. Пожалуйста, попробуйте ещё раз.',
        selectEndDate: 'Выберите дату окончания',
        sending: 'Отправляем…',
        sent: 'Отправлено'
    },
    en: {
        serviceNames: {
            'zaidimo': 'Game organization',
            'renginio': 'Event organization',
            'atributika': 'Prop rental'
        },
        service: 'Service',
        date: 'Date',
        endDate: 'End date',
        tables: 'Number of tables',
        days: 'Number of days',
        location: 'Location',
        distance: 'Distance',
        additionalServices: 'Additional services',
        vilnius: 'Vilnius',
        outsideVilnius: 'Outside Vilnius',
        error: 'Error',
        invalidName: 'Please enter your name',
        invalidPhone: 'Please enter your phone number',
        invalidEmail: 'Please enter a valid email address',
        thanks: 'Thank you',
        requestSent: 'Your request has been sent. We will get back to you shortly.',
        requestFailed: 'The request was not sent. Please try again.',
        selectEndDate: 'Select an end date',
        sending: 'Sending…',
        sent: 'Sent'
    }
};

const CALC_T = CALC_L10N[CALC_LANG] || CALC_L10N.lt;

// Переводы названий услуг: ключ — каноническое литовское название
const SVC_NAMES = {
    '3 mafijos sesijos':                      { ru: '3 сессии мафии',                       en: '3 Mafia sessions' },
    '6 mafijos sesijos':                      { ru: '6 сессий мафии',                       en: '6 Mafia sessions' },
    'Vedėjo paslaugos':                       { ru: 'Услуги ведущего',                      en: 'Host services' },
    'Vedėjų paslaugos':                       { ru: 'Услуги ведущих',                       en: 'Host services' },
    'Atributika':                             { ru: 'Реквизит',                             en: 'Props' },
    'Apvalus stalas su staltiese':            { ru: 'Круглый стол со скатертью',            en: 'Round table with tablecloth' },
    'Apvalus stalai su staltiese':            { ru: 'Круглые столы со скатертями',          en: 'Round tables with tablecloths' },
    'Svečių vardų kortelės':                  { ru: 'Именные карточки гостей',              en: 'Guest name cards' },
    'Stalo dekoravimas':                      { ru: 'Оформление стола',                     en: 'Table decoration' },
    'Stalų dekoravimas':                      { ru: 'Оформление столов',                    en: 'Table decoration' },
    'Vietos paieška ir rezervacija':          { ru: 'Поиск и бронирование площадки',        en: 'Venue search and booking' },
    'Programos planavimas':                   { ru: 'Планирование программы',               en: 'Program planning' },
    'Renginio koordinavimas vietoje':         { ru: 'Координация мероприятия на месте',     en: 'On-site event coordination' },
    'Erdvės dekoravimas':                     { ru: 'Оформление пространства',              en: 'Venue decoration' },
    'Foto paslaugos (3 val.)':                { ru: 'Фотосъёмка (3 ч)',                     en: 'Photography (3 h)' },
    'Video paslaugos (3 val.)':               { ru: 'Видеосъёмка (3 ч)',                    en: 'Videography (3 h)' },
    'Kaukės | 10 vnt':                        { ru: 'Маски | 10 шт',                        en: 'Masks | 10 pcs' },
    'Revolveriai | 10 vnt':                   { ru: 'Револьверы | 10 шт',                   en: 'Revolvers | 10 pcs' },
    'Vokai | 10 vnt':                         { ru: 'Конверты | 10 шт',                     en: 'Envelopes | 10 pcs' },
    'Vaidmenų kortelės | 10 vnt':             { ru: 'Карты ролей | 10 шт',                  en: 'Role cards | 10 pcs' },
    'Šablonai vedėjui | 3 vnt':               { ru: 'Шаблоны для ведущего | 3 шт',          en: 'Host templates | 3 pcs' },
    'Pagrindas rašymui':                      { ru: 'Планшет для записей',                  en: 'Writing pad' },
    'Rašiklis':                               { ru: 'Ручка',                                en: 'Pen' },
    'Papildomos kaukės | 10 vnt':             { ru: 'Дополнительные маски | 10 шт',         en: 'Extra masks | 10 pcs' },
    'Papildomi revolveriai | 10 vnt':         { ru: 'Дополнительные револьверы | 10 шт',    en: 'Extra revolvers | 10 pcs' },
    'Papildomi vokai | 10 vnt':               { ru: 'Дополнительные конверты | 10 шт',      en: 'Extra envelopes | 10 pcs' },
    'Papildomos vaidmenų kortelės | 10 vnt':  { ru: 'Дополнительные карты ролей | 10 шт',   en: 'Extra role cards | 10 pcs' },
    'Papildomas rinkinys vedėjui':            { ru: 'Дополнительный набор ведущего',        en: 'Extra host kit' }
};

function svcName(key) {
    if (CALC_LANG === 'lt') return key;
    return (SVC_NAMES[key] && SVC_NAMES[key][CALC_LANG]) || key;
}

// Service selection
document.querySelector('#step-service').querySelectorAll('.service-option').forEach(option => {
    option.addEventListener('click', function() {
        if (isTransitioning) return;

        const newService = this.dataset.service;

        // Reset if service changed and already made progress
        if (calculatorState.service !== null && calculatorState.service !== newService) {
            resetStepsAfter(1);
        }
        
        // Remove selected class from all
        document.querySelectorAll('#step-service .service-option').forEach(opt => {
            opt.classList.remove('selected');
        });
        
        // Add selected to clicked
        this.classList.add('selected');
        
        calculatorState.service = newService;
        
        // Animate step transition
        transitionToStep('step-service', 'step-calendar', 2);
        setTimeout(() => initCalculatorCalendar(), 600);
    });
});

// Table selection
document.querySelectorAll('.table-option').forEach(option => {
    option.addEventListener('click', function() {
        if (isTransitioning) return;

        const newTables = parseInt(this.dataset.tables);

        // Reset if tables changed and already made progress
        if (calculatorState.tables !== null && calculatorState.tables !== newTables) {
            resetStepsAfter(3);
        }
        
        document.querySelectorAll('.table-option').forEach(opt => {
            opt.classList.remove('selected');
        });
        
        this.classList.add('selected');
        
        calculatorState.tables = newTables;
        
        // Transition to next step (both zaidimo and renginio go to location)
        transitionToStep('step-tables', 'step-location', 4);
    });
});

// Location selection (click on wrapper divs)
document.querySelector('#step-location .location-options').querySelectorAll('.service-option').forEach(option => {
    option.addEventListener('click', function() {
        if (isTransitioning) return;

        const radio = this.querySelector('input[name="location"]');
        const newLocation = radio.value;

        // Check the radio
        radio.checked = true;
        
        // Reset if location changed and already made progress
        if (calculatorState.completedSteps.some(s => s > 4) && calculatorState.location !== newLocation) {
            resetStepsAfter(4);
        }
        
        calculatorState.location = newLocation;
        
        // Update selected class
        document.querySelectorAll('#step-location .location-options .service-option').forEach(opt => {
            opt.classList.remove('selected');
        });
        this.classList.add('selected');
        
        if (newLocation === 'outside') {
            // Show distance options, don't transition yet
            document.getElementById('distance-options').style.display = 'block';
        } else {
            // Vilnius selected - transition to services
            document.getElementById('distance-options').style.display = 'none';
            calculatorState.distance = 0;
            
            transitionToStep('step-location', 'step-services', 5);
            setTimeout(() => showServicesStep(), 600);
        }
    });
});

// Distance selection (buttons instead of dropdown)
document.querySelectorAll('.distance-option').forEach(option => {
    option.addEventListener('click', function() {
        if (isTransitioning) return;

        const newDistance = parseInt(this.dataset.distance);

        // Reset only if distance was already chosen AND it's different
        if (calculatorState.completedSteps.some(s => s > 4) && calculatorState.distance !== newDistance) {
            resetStepsAfter(4);
        }
        
        // Remove selected class from all
        document.querySelectorAll('.distance-option').forEach(opt => {
            opt.classList.remove('selected');
        });
        
        // Add selected to clicked
        this.classList.add('selected');
        
        calculatorState.distance = newDistance;
        
        // Transition to services
        transitionToStep('step-location', 'step-services', 5);
        setTimeout(() => showServicesStep(), 600);
    });
});

// Количество суток для атрибутики считается из диапазона дат в календаре
// (см. initCalculatorCalendar), отдельного шага с выпадающим списком нет.

function showServicesStep() {
    const servicesList = document.getElementById('services-list');
    servicesList.innerHTML = '';
    
    let services = [];
    
    if (calculatorState.service === 'zaidimo') {
        if (calculatorState.tables === 1) {
            services = [
                { name: '3 mafijos sesijos', included: true },
                { name: 'Vedėjo paslaugos', included: true },
                { name: 'Atributika', included: true },
                { name: 'Apvalus stalas su staltiese', included: true },
                { name: 'Svečių vardų kortelės', included: true },
                { name: 'Stalo dekoravimas', price: 200 },
                { name: 'Vietos paieška ir rezervacija', price: 50 }
            ];
        } else {
            services = [
                { name: '6 mafijos sesijos', included: true },
                { name: 'Vedėjų paslaugos', included: true },
                { name: 'Atributika', included: true },
                { name: 'Apvalus stalai su staltiese', included: true },
                { name: 'Svečių vardų kortelės', included: true },
                { name: 'Stalų dekoravimas', price: 400 },
                { name: 'Vietos paieška ir rezervacija', price: 50 }
            ];
        }
    } else if (calculatorState.service === 'renginio') {
        const commonServices = [
            { name: 'Vietos paieška ir rezervacija', included: true },
            { name: 'Programos planavimas', included: true },
            { name: 'Renginio koordinavimas vietoje', included: true },
            { name: 'Stalo dekoravimas', included: true },
            { name: calculatorState.tables === 1 ? '3 mafijos sesijos' : '6 mafijos sesijos', included: true },
            { name: 'Vedėjo paslaugos', included: true },
            { name: 'Atributika', included: true },
            { name: calculatorState.tables === 1 ? 'Apvalus stalas su staltiese' : 'Apvalus stalai su staltiese', included: true },
            { name: 'Svečių vardų kortelės', included: true },
            { name: 'Erdvės dekoravimas', price: 400 },
            { name: 'Foto paslaugos (3 val.)', price: 600 },
            { name: 'Video paslaugos (3 val.)', price: 600 }
        ];
        services = commonServices;
    } else if (calculatorState.service === 'atributika') {
        services = [
            { name: 'Kaukės | 10 vnt', included: true },
            { name: 'Revolveriai | 10 vnt', included: true },
            { name: 'Vokai | 10 vnt', included: true },
            { name: 'Vaidmenų kortelės | 10 vnt', included: true },
            { name: 'Šablonai vedėjui | 3 vnt', included: true },
            { name: 'Pagrindas rašymui', included: true },
            { name: 'Rašiklis', included: true },
            { name: 'Papildomos kaukės | 10 vnt', price: 40 },
            { name: 'Papildomi revolveriai | 10 vnt', price: 40 },
            { name: 'Papildomi vokai | 10 vnt', price: 20 },
            { name: 'Papildomos vaidmenų kortelės | 10 vnt', price: 20 },
            { name: 'Papildomas rinkinys vedėjui', price: 20 },

            { name: 'Foto paslaugos (3 val.)', price: 600 },
            { name: 'Video paslaugos (3 val.)', price: 600 }
        ];
    }
    
    services.forEach(service => {
        const serviceDiv = document.createElement('div');
        serviceDiv.className = 'service-item choice-card';
        
        if (service.included) {
            serviceDiv.innerHTML = `
                <div class="choice-indicator service-included"></div>
                <div class="service-content">
                    <span class="service-name">${svcName(service.name)}</span>
                </div>
            `;
        } else {
            // Check if service already selected
            const isSelected = calculatorState.additionalServices.some(s => s.name === service.name);
            
            serviceDiv.innerHTML = `
                <div class="choice-indicator service-checkbox">
                    <input type="checkbox" class="additional-service" data-service="${service.name}" data-price="${service.price}" ${isSelected ? 'checked' : ''}>
                </div>
                <div class="service-content">
                    <span class="service-name">${svcName(service.name)}</span>
                    <span class="service-price">+${service.price} €</span>
                </div>
            `;
            
            if (isSelected) {
                serviceDiv.classList.add('selected');
            }
        }
        
        servicesList.appendChild(serviceDiv);

        // Сделать весь контейнер кликабельным для дополнительных услуг
        if (!service.included) {
            serviceDiv.addEventListener('click', function(e) {
                if (e.target.tagName !== 'INPUT') {
                    const checkbox = this.querySelector('input[type="checkbox"]');
                    checkbox.click();
                }
            });
        }
    });
    
    // Show next button
    document.getElementById('next-to-summary-btn').style.display = 'inline-block';
    
    // Add event listeners to checkboxes
    document.querySelectorAll('.additional-service').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            // Save old state before change
            const oldServicesCount = calculatorState.additionalServices.length;
            
            // Get parent service-item element
            const serviceItem = this.closest('.service-item');
            
            if (this.checked) {
                calculatorState.additionalServices.push({
                    name: this.dataset.service,
                    price: parseInt(this.dataset.price)
                });
                // Добавляем класс selected
                if (serviceItem) {
                    serviceItem.classList.add('selected');
                }
            } else {
                calculatorState.additionalServices = calculatorState.additionalServices.filter(
                    s => s.name !== this.dataset.service
                );
                // Убираем класс selected
                if (serviceItem) {
                    serviceItem.classList.remove('selected');
                }
            }
            
            // Reset step 6 if services changed and we were already there
            const newServicesCount = calculatorState.additionalServices.length;
            if (calculatorState.completedSteps.some(s => s > 5) && oldServicesCount !== newServicesCount) {
                resetStepsAfter(5);
            }

            updatePriceBar();
        });
    });
}

// Next to summary button
document.getElementById('next-to-summary-btn')?.addEventListener('click', function() {
    if (isTransitioning) return;

    // Show summary
    showSummary(calculateTotal());
});

function showSummary(totalPrice) {
    const summaryCard = document.getElementById('summary-card');
    let summaryHTML = '<div style="font-size: 0.95rem; line-height: 1.8;">';
    
    // Service type
    summaryHTML += `<p><strong>${CALC_T.service}:</strong> ${CALC_T.serviceNames[calculatorState.service]}</p>`;

    // Date
    if (calculatorState.dateStart) {
        summaryHTML += `<p><strong>${CALC_T.date}:</strong> ${calculatorState.dateStart}</p>`;
    }
    if (calculatorState.dateEnd && calculatorState.service === 'atributika') {
        summaryHTML += `<p><strong>${CALC_T.endDate}:</strong> ${calculatorState.dateEnd}</p>`;
    }

    // Tables or days
    if (calculatorState.tables) {
        summaryHTML += `<p><strong>${CALC_T.tables}:</strong> ${calculatorState.tables}</p>`;
    }
    if (calculatorState.days) {
        summaryHTML += `<p><strong>${CALC_T.days}:</strong> ${calculatorState.days}</p>`;
    }

    // Location
    if (calculatorState.service !== 'atributika') {
        summaryHTML += `<p><strong>${CALC_T.location}:</strong> ${calculatorState.location === 'vilnius' ? CALC_T.vilnius : CALC_T.outsideVilnius}</p>`;
        if (calculatorState.distance > 0) {
            summaryHTML += `<p><strong>${CALC_T.distance}:</strong> +${calculatorState.distance} €</p>`;
        }
    }

    // Additional services
    if (calculatorState.additionalServices.length > 0) {
        summaryHTML += `<p><strong>${CALC_T.additionalServices}:</strong></p><ul style="margin-left: 1.5rem;">`;
        calculatorState.additionalServices.forEach(service => {
            summaryHTML += `<li>${svcName(service.name)} (+${service.price} €)</li>`;
        });
        summaryHTML += '</ul>';
    }
    
    summaryHTML += '</div>';
    summaryCard.innerHTML = summaryHTML;
    
    document.getElementById('total-price').textContent = totalPrice;
    
    // Hide next button on summary step
    document.getElementById('next-to-summary-btn').style.display = 'none';
    
    // Transition to summary step
    transitionToStep('step-services', 'step-summary', 6);
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

// Reserve button click
document.getElementById('reserve-btn')?.addEventListener('click', async function() {
    if (this.disabled) return;

    const nameInput = document.getElementById('client-name');
    const phoneInput = document.getElementById('client-phone');
    const emailInput = document.getElementById('client-email');

    const name = nameInput ? nameInput.value.trim() : '';
    const phone = phoneInput ? phoneInput.value.trim() : '';
    const email = emailInput.value.trim();

    if (nameInput && name.length < 2) {
        showModal(CALC_T.error, CALC_T.invalidName);
        nameInput.focus();
        return;
    }

    // Телефон проверяем мягко: только по количеству цифр,
    // чтобы не отсекать записи вида +370 600 12345 или (8-600) 12345
    if (phoneInput && phone.replace(/\D/g, '').length < 8) {
        showModal(CALC_T.error, CALC_T.invalidPhone);
        phoneInput.focus();
        return;
    }

    if (!EMAIL_RE.test(email)) {
        showModal(CALC_T.error, CALC_T.invalidEmail);
        emailInput.focus();
        return;
    }

    // Prepare data
    const formData = {
        name: name,
        phone: phone,
        email: email,
        service: calculatorState.service,
        dateStart: calculatorState.dateStart,
        dateEnd: calculatorState.dateEnd,
        tables: calculatorState.tables,
        days: calculatorState.days,
        location: calculatorState.location,
        distance: calculatorState.distance,
        additionalServices: calculatorState.additionalServices,
        totalPrice: document.getElementById('total-price').textContent
    };
    
    // Кнопка блокируется на время отправки, иначе несколько тапов
    // отправляют одну и ту же заявку по нескольку раз
    const originalLabel = this.textContent;
    this.disabled = true;
    this.style.opacity = '0.6';
    this.style.cursor = 'not-allowed';
    this.textContent = CALC_T.sending;

    // Send to Formspree
    try {
        const response = await fetch('https://formspree.io/f/mwvvkyok', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        if (response.ok) {
            // Заявка ушла — кнопка остаётся выключенной, повторять нечего
            this.style.opacity = '';
            this.classList.add('btn-sent');
            this.innerHTML =
                '<svg class="sent-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
                'stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
                '<circle cx="12" cy="12" r="10"/><path d="M7.5 12.4l3.1 3.1 6-6.6"/></svg>' +
                '<span>' + CALC_T.sent + '</span>';

            trackCalculatorEvent('reservation_request', {
                service: calculatorState.service,
                value: calculateTotal(),
                currency: 'EUR',
                language: CALC_LANG
            });

            showModal(CALC_T.thanks, CALC_T.requestSent);
            return;
        }

        showModal(CALC_T.error, CALC_T.requestFailed);
    } catch (error) {
        showModal(CALC_T.error, CALC_T.requestFailed);
        console.error('Formspree error:', error);
    }

    // Не отправилось — возвращаем кнопку, чтобы можно было попробовать ещё раз
    this.disabled = false;
    this.style.opacity = '';
    this.style.cursor = '';
    this.textContent = originalLabel;
});

// Initialize calendar when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Calendar will be initialized when service is selected
});

// Initialize calculator calendar
let calculatorCalendar = null;

function initCalculatorCalendar() {
    if (typeof Calendar === 'undefined') {
        console.error('Calendar class not found');
        return;
    }
    
    const isAtributika = calculatorState.service === 'atributika';
    
    const calendarOptions = isAtributika ? { rangeMode: true } : {};
    
    calculatorCalendar = new Calendar('calculator-calendar', function(date) {
        if (isTransitioning) return;

        // Callback when date is selected
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');

        const newDate = `${year}-${month}-${day}`;

        if (isAtributika && (!calculatorState.dateStart || (calculatorState.dateStart && calculatorState.dateEnd))) {
            // First date selected for atributika (or resetting range)
            calculatorState.dateStart = newDate;
            calculatorState.dateEnd = null; // Reset end date
            
            // Show tooltip under calendar
            let tooltip = document.getElementById('calendar-tooltip');
            if (!tooltip) {
                tooltip = document.createElement('div');
                tooltip.id = 'calendar-tooltip';
                tooltip.style.cssText = 'margin-top: 0.8rem; padding: 0.6rem 1rem; background: #000; color: #d4af37; border: 2px solid #d4af37; border-radius: 6px; text-align: center; font-size: 0.9rem; animation: fadeIn 0.3s ease;';
                tooltip.textContent = CALC_T.selectEndDate;
                document.getElementById('calculator-calendar').parentElement.appendChild(tooltip);
            }
            tooltip.style.display = 'block';
        } else if (isAtributika && calculatorState.dateStart && !calculatorState.dateEnd) {
            // Second date selected for atributika
            
            // Hide tooltip
            const tooltip = document.getElementById('calendar-tooltip');
            if (tooltip) tooltip.style.display = 'none';
            
            // Reset if date changed and already made progress
            if (calculatorState.dateEnd !== null && calculatorState.dateEnd !== newDate) {
                resetStepsAfter(2);
            }
            
            // Дату раньше начала календарь выбрать не даёт (см. calendar.js),
            // поэтому порядок здесь заведомо правильный
            calculatorState.dateEnd = newDate;

            // Calculate days
            const diffTime = parseCalcDate(newDate) - parseCalcDate(calculatorState.dateStart);
            const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
            calculatorState.days = diffDays === 0 ? 1 : diffDays;
            
            // Go directly to services step (step 5)
            transitionToStep('step-calendar', 'step-services', 5);
            setTimeout(() => showServicesStep(), 600);
        } else {
            // Single date for zaidimo/renginio
            
            // Reset if date changed and already made progress
            if (calculatorState.dateStart !== null && calculatorState.dateStart !== newDate) {
                resetStepsAfter(2);
            }
            
            calculatorState.dateStart = newDate;
            transitionToStep('step-calendar', 'step-tables', 3);
        }
    }, calendarOptions);
    
    // Restore previously selected date if exists
    if (calculatorState.dateStart) {
        if (isAtributika && calculatorState.dateEnd) {
            // Restore both dates for atributika
            calculatorCalendar.selectedDateStart = parseCalcDate(calculatorState.dateStart);
            calculatorCalendar.selectedDateEnd = parseCalcDate(calculatorState.dateEnd);
        } else {
            // Restore single date for zaidimo/renginio
            calculatorCalendar.selectedDate = parseCalcDate(calculatorState.dateStart);
        }

        calculatorCalendar.render();
    }
}

// Make progress steps clickable
document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.progress-step').forEach(step => {
        step.addEventListener('click', function() {
            const stepNumber = parseInt(this.dataset.step);
            goToStep(stepNumber);
        });
    });
});

// Initialize progress bar on page load
document.addEventListener('DOMContentLoaded', function() {
    updateProgressBar(calculatorState.currentStep);
});

// Линия прогресса позиционируется в пикселях, поэтому её нужно пересчитывать
// при изменении ширины экрана и повороте телефона — иначе она съезжает мимо кружков
let progressResizeTimer = null;
function scheduleProgressBarUpdate() {
    clearTimeout(progressResizeTimer);
    progressResizeTimer = setTimeout(function() {
        updateProgressBar(calculatorState.currentStep);
    }, 150);
}
window.addEventListener('resize', scheduleProgressBarUpdate);
window.addEventListener('orientationchange', scheduleProgressBarUpdate);

// Show modal function
function showModal(title, message) {
    const modal = document.getElementById('successModal');
    if (modal) {
        const modalTitle = modal.querySelector('h3');
        const modalText = modal.querySelector('p');
        modalTitle.textContent = title;
        modalText.textContent = message;
        modal.classList.add('show');
    }
}

// Success modal close handler.
// Модалка в разметке стоит ниже, чем подключены скрипты, поэтому искать крестик
// сразу нельзя — его ещё нет в DOM. Слушаем клики на document.
document.addEventListener('click', function(e) {
    const modal = document.getElementById('successModal');
    if (!modal || !modal.classList.contains('show')) return;

    const onCloseBtn = e.target instanceof Element && e.target.closest('.contact-modal-close');
    if (onCloseBtn || e.target === modal) {
        modal.classList.remove('show');
    }
});

// Закрытие по Esc
document.addEventListener('keydown', function(e) {
    if (e.key !== 'Escape') return;
    const modal = document.getElementById('successModal');
    if (modal) modal.classList.remove('show');
});

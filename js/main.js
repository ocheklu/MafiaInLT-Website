// ===========================
// МОБИЛЬНОЕ МЕНЮ
// ===========================

document.addEventListener('DOMContentLoaded', function() {
    const mobileToggle = document.querySelector('.mobile-menu-toggle');
    const navMenu = document.querySelector('.nav-menu');
    
    if (mobileToggle) {
        mobileToggle.addEventListener('click', function() {
            navMenu.classList.toggle('active');
            mobileToggle.classList.toggle('active');
            document.body.classList.toggle('menu-open');
        });
        
        // Закрыть меню при клике на ссылку
        const navLinks = document.querySelectorAll('.nav-menu a');
        navLinks.forEach(link => {
            link.addEventListener('click', function() {
                navMenu.classList.remove('active');
                mobileToggle.classList.remove('active');
                document.body.classList.remove('menu-open');
            });
        });
        
        // Закрыть меню при клике вне его
        document.addEventListener('click', function(e) {
            if (!navMenu.contains(e.target) && !mobileToggle.contains(e.target)) {
                navMenu.classList.remove('active');
                mobileToggle.classList.remove('active');
                document.body.classList.remove('menu-open');
            }
        });
    }
});

// ===========================
// ПЕРЕКЛЮЧАТЕЛЬ ЯЗЫКОВ
// ===========================

// Язык определяется по <html lang> — каждая языковая версия живёт
// в своей папке: / (LT), /ru/, /en/. Кнопки — это навигация между ними.
const PAGE_LANG = (document.documentElement.lang || 'lt').slice(0, 2);
let currentLanguage = PAGE_LANG;

// Тексты модалки формы контактов на языке страницы
const UI_TEXT = {
    lt: {
        thanks: 'Ačiū!',
        error: 'Klaida',
        tryAgain: 'Bandykite dar kartą.',
        messageSent: 'Jūsų žinutė išsiųsta. Susisieksime su jumis artimiausiu metu.'
    },
    ru: {
        thanks: 'Спасибо!',
        error: 'Ошибка',
        tryAgain: 'Попробуйте ещё раз.',
        messageSent: 'Ваше сообщение отправлено. Мы свяжемся с вами в ближайшее время.'
    },
    en: {
        thanks: 'Thank you!',
        error: 'Error',
        tryAgain: 'Please try again.',
        messageSent: 'Your message has been sent. We will get back to you shortly.'
    }
};
const T = UI_TEXT[PAGE_LANG] || UI_TEXT.lt;

document.addEventListener('DOMContentLoaded', function() {
    const langButtons = document.querySelectorAll('.lang-btn');

    updateLanguageUI(PAGE_LANG);

    langButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const lang = this.getAttribute('data-lang');
            if (lang === PAGE_LANG) return;
            localStorage.setItem('selectedLanguage', lang);
            window.location.href = langHref(lang);
        });
    });
});

// Строит ссылку на текущую страницу в другой языковой версии.
// Пути относительные — работает и локально (file://), и на хостинге.
function langHref(targetLang) {
    const path = window.location.pathname.replace(/\\/g, '/');
    let file = path.split('/').pop();
    if (!file || !file.includes('.')) file = 'index.html';

    const inLangDir = /\/(ru|en)\/[^\/]*$/.test(path);
    const inBlog = /\/straipsniai\//.test(path);
    const prefix = (inLangDir || inBlog) ? '../' : '';

    // Блог пока только на литовском — с него ведём на главную нужного языка
    if (inBlog) {
        return targetLang === 'lt' ? prefix + 'index.html' : prefix + targetLang + '/index.html';
    }

    return targetLang === 'lt' ? prefix + file : prefix + targetLang + '/' + file;
}

function updateLanguageUI(lang) {
    const langButtons = document.querySelectorAll('.lang-btn');
    langButtons.forEach(btn => {
        if (btn.getAttribute('data-lang') === lang) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

// ===========================
// FAQ АККОРДЕОН
// ===========================

document.addEventListener('DOMContentLoaded', function() {
    const faqQuestions = document.querySelectorAll('.faq-question');
    
    faqQuestions.forEach(question => {
        question.addEventListener('click', function() {
            const isActive = this.classList.contains('active');
            
            // Закрыть все FAQ
            faqQuestions.forEach(q => {
                q.classList.remove('active');
                q.nextElementSibling.style.maxHeight = null;
            });
            
            // Открыть текущий, если он не был активен
            if (!isActive) {
                this.classList.add('active');
                const answer = this.nextElementSibling;
                answer.style.maxHeight = answer.scrollHeight + 'px';
            }
        });
    });
});

// ===========================
// ПЛАВНАЯ ПРОКРУТКА К ЯКОРЯМ
// ===========================

// Куда именно вставать: под sticky-шапкой, с запасом воздуха.
// Высоту шапки берём живьём — она разная на десктопе (113px) и на
// телефоне (61px), а прежние жёсткие 80px не совпадали ни с одной.
function anchorOffsetTop(target) {
    const header = document.querySelector('.navbar');
    const headerH = header ? header.getBoundingClientRect().height : 0;
    const top = target.getBoundingClientRect().top + window.scrollY;
    return Math.max(0, Math.round(top - headerH - 28));
}

// Ведём прокрутку сами, кадр за кадром.
//
// Браузерный scroll-behavior: smooth здесь ненадёжен: Chrome отменяет
// плавную прокрутку, пока догружаются картинки страницы, — по той же
// причине не срабатывает и нативный якорный прыжок. Своя анимация от
// него не зависит: мы просто ставим scrollTop каждый кадр.
//
// getDest — функция, а не число: страница может ещё расти, и цель
// пересчитывается на каждом кадре.
function glideTo(getDest, duration) {
    const from = window.scrollY;
    const span = getDest() - from;
    if (Math.abs(span) < 4) return;

    let cancelled = false;
    const stop = () => { cancelled = true; };
    window.addEventListener('wheel', stop, { once: true, passive: true });
    window.addEventListener('touchstart', stop, { once: true, passive: true });

    const start = performance.now();
    let done = false;

    const step = (now) => {
        if (cancelled) return;
        const p = Math.min(1, (now - start) / duration);
        // ease-out-cubic: трогается заметно, останавливается мягко
        const eased = 1 - Math.pow(1 - p, 3);
        window.scrollTo({ top: from + (getDest() - from) * eased, behavior: 'instant' });
        if (p < 1) requestAnimationFrame(step);
        else done = true;
    };
    requestAnimationFrame(step);

    // Страховка: requestAnimationFrame не вызывается, пока вкладка в
    // фоне. Человек открыл ссылку в новой вкладке, вернулся — и стоит
    // не там, куда шёл. Проверяем и доводим разом.
    setTimeout(() => {
        if (!done && !cancelled) {
            window.scrollTo({ top: getDest(), behavior: 'instant' });
        }
    }, duration + 180);
}

document.addEventListener('DOMContentLoaded', function() {
    const links = document.querySelectorAll('a[href^="#"]');

    links.forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href === '#') return;

            const target = document.querySelector(href);
            if (target) {
                e.preventDefault();
                glideTo(() => anchorOffsetTop(target), 620);
            }
        });
    });
});

// ===========================
// АКТИВНАЯ СТРАНИЦА В НАВИГАЦИИ
// ===========================

document.addEventListener('DOMContentLoaded', function() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('.nav-menu a');
    
    navLinks.forEach(link => {
        const linkPage = link.getAttribute('href');
        if (linkPage === currentPage || (currentPage === '' && linkPage === 'index.html')) {
            link.classList.add('active');
        }
    });
});

// ===========================
// ЭКСПОРТ ДЛЯ ИСПОЛЬЗОВАНИЯ В ДРУГИХ МОДУЛЯХ
// ===========================

window.getCurrentLanguage = function() {
    return currentLanguage;
};

// ===========================
// FLIP CARDS
// ===========================

document.addEventListener('DOMContentLoaded', function() {
    // Flip cards on click
    document.querySelectorAll('.service-flip-card').forEach(card => {
        card.addEventListener('click', function(e) {
            // Don't flip if clicking on back button or link
            if (e.target.closest('.flip-back-btn') || e.target.closest('a') || e.target.closest('.btn')) {
                return;
            }
            
            // Toggle flip
            this.classList.toggle('flipped');
        });
    });
    
    // Back buttons
    document.querySelectorAll('.flip-back-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const card = this.closest('.service-flip-card');
            card.classList.remove('flipped');
        });
    });
});

// ===========================
// CARD TILT EFFECT
// ===========================

document.addEventListener('DOMContentLoaded', function() {
    // Skip tilt on touch devices
    if ('ontouchstart' in window) return;
    
    const cards = document.querySelectorAll('.service-flip-card');
    
    cards.forEach(card => {
        card.addEventListener('mousemove', function(e) {
    if (card.classList.contains('flipped')) return;
    
    const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            const rotateY = (centerX - x) / 10;

            card.style.transform = `perspective(500px) rotateY(${rotateY}deg)`;
        });
        
        card.addEventListener('mouseleave', function() {
            card.style.transform = 'perspective(500px) rotateY(0)';
        });
    });
});

// ===========================
// AUTO FLIP CARD FROM ANCHOR
// ===========================

document.addEventListener('DOMContentLoaded', function() {
    const hash = window.location.hash;
    if (!hash) return;

    const target = document.getElementById(hash.substring(1));
    if (!target) return;

    const isCard = target.classList.contains('service-flip-card');

    // Флип-карточку показываем целиком, если она помещается под шапкой —
    // тогда ставим её по центру свободной области. Если не помещается
    // (на телефоне оборот выше экрана), центрировать нельзя: заголовок
    // карточки уедет под шапку. В этом случае ведём себя как с секцией —
    // верх под шапку.
    const destOf = () => {
        if (!isCard) return anchorOffsetTop(target);

        const header = document.querySelector('.navbar');
        const headerH = header ? header.getBoundingClientRect().height : 0;
        const r = target.getBoundingClientRect();
        const avail = window.innerHeight - headerH;

        if (r.height > avail - 24) return anchorOffsetTop(target);

        return Math.max(0, Math.round(
            r.top + window.scrollY - headerH - (avail - r.height) / 2));
    };

    // Приход по якорю с другой страницы. Через всю страницу человека не
    // гоним: мгновенно встаём в 260px от цели и проезжаем их плавно —
    // прибытие читается как движение, а не как рывок. Ждём при этом
    // полной загрузки: пока грузятся картинки, документ короче итогового
    // и прокрутка упирается в его текущий конец.
    const arrive = () => {
        window.scrollTo({ top: Math.max(0, destOf() - 260), behavior: 'instant' });
        if (document.readyState === 'complete') {
            glideTo(destOf, 520);
        } else {
            window.addEventListener('load', () => glideTo(destOf, 520), { once: true });
        }
    };

    setTimeout(() => {
        if (isCard) target.classList.add('flipped');
        arrive();
    }, 300);
});

// ===========================
// SCROLL REVEAL ANIMATION
// ===========================

document.addEventListener('DOMContentLoaded', function() {
    const revealElements = document.querySelectorAll('.scroll-reveal');
    if (!revealElements.length) return;

    // Следим за реальным пересечением, а не считаем координаты по таймеру.
    //
    // Раньше проверка шла один раз на DOMContentLoaded и дальше на каждый
    // scroll. Беда в первом вызове: картинки ещё не загружены, страница
    // короче итоговой, и заголовок следующей секции попадает в видимую
    // зону — ему сразу ставился .visible. На телефоне это выглядело так:
    // hero ещё грузится, а «Paslaugos» под ним уже проявлен, и когда до
    // него доскроллишь, появляться ему уже нечем.
    //
    // Наблюдатель пересчитывает пересечения сам, в том числе когда
    // страница выросла после загрузки картинок.
    if ('IntersectionObserver' in window) {
        // Ленты со свайпом: карточка, стоящая правее экрана, с точки зрения
        // наблюдателя невидима — и проявлялась бы по одной прямо под пальцем
        // во время свайпа. Поэтому у таких карточек появление общее: вошла
        // в кадр одна — показываем всю ленту.
        const stripOf = (el) => el.closest('.services-grid, .blog-preview-grid');

        const io = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;

                const strip = stripOf(entry.target);
                const group = strip
                    ? strip.querySelectorAll('.scroll-reveal')
                    : [entry.target];

                group.forEach(el => {
                    el.classList.add('visible');
                    io.unobserve(el);        // появляется один раз
                });
            });
        }, {
            // Нижняя граница поднята на 150px: элемент проявляется, когда
            // вошёл в кадр заметной частью, а не краем.
            rootMargin: '0px 0px -150px 0px',
            threshold: 0
        });

        // Кто уже в первом экране, тот ждёт hero.
        //
        // На телефоне заголовок следующей секции виден краем сразу при
        // загрузке — наблюдатель честно сообщает «в кадре» и показывает его
        // в ту же секунду, поверх ещё едущего hero. Поэтому за такими
        // элементами начинаем следить не сразу: hero разворачивается
        // до 2.5s — последняя его кнопка стартует на 1.5s и едет
        // секунду. К 2.6s заголовок вступает следом за ним, а не
        // вперёд него. За всем, что ниже сгиба, следим с самого начала —
        // туда всё равно надо доскроллить.
        const HERO_MS = 2600;
        const early = [];

        revealElements.forEach(el => {
            if (el.getBoundingClientRect().top < window.innerHeight) early.push(el);
            else io.observe(el);
        });

        setTimeout(() => early.forEach(el => io.observe(el)), HERO_MS);

        // Страховка. Наблюдатель, как и requestAnimationFrame, молчит, пока
        // вкладка в фоне: страницу открыли в соседней вкладке, вернулись —
        // и первый экран пустой, пока не тронешь скролл. Поэтому сами
        // проходим по тому, что уже в кадре: один раз после полной загрузки
        // и дальше на скролл, пока не покажем всё.
        //
        // Важно, что после загрузки, а не на DOMContentLoaded: пока грузятся
        // картинки, страница короче итоговой, и в «видимую зону» попадает
        // заголовок следующей секции — он проявлялся раньше, чем дочитан hero.
        let left = revealElements.length;

        const sweep = () => {
            revealElements.forEach(el => {
                if (el.classList.contains('visible')) return;
                const r = el.getBoundingClientRect();
                if (r.top < window.innerHeight - 150 && r.bottom > 0) {
                    const strip = stripOf(el);
                    (strip ? strip.querySelectorAll('.scroll-reveal') : [el])
                        .forEach(x => {
                            if (x.classList.contains('visible')) return;
                            x.classList.add('visible');
                            io.unobserve(x);
                            left--;
                        });
                }
            });
            if (left <= 0) window.removeEventListener('scroll', sweep);
        };

        window.addEventListener('scroll', sweep, { passive: true });

        // Пауза даёт hero отыграть своё появление первым: его последний
        // элемент выходит на 1.5s. Заголовок следующей секции, если он
        // виден краем уже на первом экране, подтягивается за ним, а не
        // вперёд него.
        if (document.readyState === 'complete') setTimeout(sweep, HERO_MS);
        else window.addEventListener('load', () => setTimeout(sweep, HERO_MS), { once: true });

        return;
    }

    // Запасной путь для браузеров без наблюдателя.
    const revealOnScroll = () => {
        const windowHeight = window.innerHeight;
        revealElements.forEach(element => {
            if (element.getBoundingClientRect().top < windowHeight - 150) {
                element.classList.add('visible');
            }
        });
    };

    window.addEventListener('scroll', revealOnScroll);
    window.addEventListener('load', revealOnScroll);
    revealOnScroll();
});

// Contact Form Success Modal
document.addEventListener('DOMContentLoaded', function() {
    const form = document.querySelector('.contact-form-card form');
    const modal = document.getElementById('successModal');
    // Модалки нет на галерее, в блоге и на странице политики — читать её
    // содержимое до проверки нельзя, иначе обработчик падает на пустой ссылке.
    if (!form || !modal) return;

    const modalTitle = modal.querySelector('h3');
    const modalText = modal.querySelector('p');
    const closeBtn = document.querySelector('.contact-modal-close');

    if (form && modal) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = new FormData(form);

            // Откуда человек пришёл — уезжает вместе с заявкой в письмо
            if (window.MafiaTracking) window.MafiaTracking.applyToFormData(formData);

            fetch(form.action, {
                method: 'POST',
                body: formData,
                headers: {
                    'Accept': 'application/json'
                }
            })
            .then(response => {
                if (response.ok) {
                    modalTitle.textContent = T.thanks;
                    modalText.textContent = T.messageSent;
                    // Обращение через форму — считаем как лид: и в GA, и в Meta
                    if (window.MafiaTracking) {
                        window.MafiaTracking.lead({ content_name: 'contact_form' });
                    }
                    modal.classList.add('show');
                    form.reset();
                } else {
                    modalTitle.textContent = T.error;
                    modalText.textContent = T.tryAgain;
                    modal.classList.add('show');
                }
            })
            .catch(error => {
                modalTitle.textContent = T.error;
                modalText.textContent = T.tryAgain;
                modal.classList.add('show');
            });
        });
        
        // Close modal
        closeBtn.addEventListener('click', function() {
            modal.classList.remove('show');
        });
        
        window.addEventListener('click', function(e) {
            if (e.target === modal) {
                modal.classList.remove('show');
            }
        });
    }
});

// Close success modal on outside click
window.addEventListener('click', function(e) {
    const modal = document.getElementById('successModal');
    if (e.target === modal) {
        modal.classList.remove('show');
    }
});



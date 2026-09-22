// ===========================
// ТРЕКИНГ, СОГЛАСИЕ И ИСТОЧНИК ТРАФИКА
// ===========================
//
// Один файл вместо трёх блоков счётчиков в <head>. Подключается первым,
// синхронно, до main.js — чтобы gtag/fbq успели определиться раньше, чем
// их позовут из калькулятора и форм.
//
// Что делает:
//   1. Заглушки gtag/fbq — команды копятся в очереди даже до согласия
//      и уходят разом, когда счётчики догружаются.
//   2. Cookie-баннер: до выбора Google работает в режиме denied
//      (Consent Mode v2 — данные без cookie), Meta молчит, Clarity не грузится.
//   3. Запоминает, откуда человек пришёл, и подставляет это в заявки.
//   4. Считает клики по телефону, почте, отзыву и кнопке онлайн-игры.

(function () {
    'use strict';

    var GA_ID = 'G-3GXVW6KLRR';
    var PIXEL_ID = '359618631730393';
    var CLARITY_ID = '3j9kkblzoj';

    var CONSENT_KEY = 'mafia_consent';      // 'all' | 'necessary'
    var ATTR_FIRST = 'mafia_attr_first';
    var ATTR_LAST = 'mafia_attr_last';

    // Базовый адрес сайта берём из пути к этому файлу: работает и на домене,
    // и при открытии .html с диска, и из подпапок (/straipsniai/, /online/en/).
    var BASE = (function () {
        var s = document.currentScript;
        if (s && s.src) return s.src.replace(/js\/tracking\.js.*$/, '');
        return '/';
    })();

    var LANG = (document.documentElement.getAttribute('lang') || 'lt').slice(0, 2).toLowerCase();

    // ---------------------------------------------------------------
    // Хранилище
    // ---------------------------------------------------------------
    // До согласия ничего в localStorage не кладём — только на время вкладки.
    // После «Sutinku» источник переезжает в localStorage и живёт между визитами.

    function safeGet(store, key) {
        try { return store.getItem(key); } catch (e) { return null; }
    }

    function safeSet(store, key, value) {
        try { store.setItem(key, value); } catch (e) { /* приватный режим */ }
    }

    function consentValue() {
        return safeGet(window.localStorage, CONSENT_KEY);
    }

    function attrStore() {
        return consentValue() === 'all' ? window.localStorage : window.sessionStorage;
    }

    // ---------------------------------------------------------------
    // Заглушки счётчиков
    // ---------------------------------------------------------------

    function loadScript(src) {
        var t = document.createElement('script');
        t.async = true;
        t.src = src;
        var s = document.getElementsByTagName('script')[0];
        s.parentNode.insertBefore(t, s);
    }

    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };

    // Consent Mode v2. До ответа всё denied: Google считает визиты без cookie,
    // персональных данных не собирает.
    gtag('consent', 'default', {
        ad_storage: 'denied',
        ad_user_data: 'denied',
        ad_personalization: 'denied',
        analytics_storage: 'denied',
        wait_for_update: 500
    });
    gtag('js', new Date());
    gtag('config', GA_ID);

    loadScript('https://www.googletagmanager.com/gtag/js?id=' + GA_ID);

    // Meta: заглушка ставится всегда, сам fbevents.js грузим только по согласию —
    // у пикселя своего режима «без cookie» нет.
    if (!window.fbq) {
        var n = window.fbq = function () {
            n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
        };
        if (!window._fbq) window._fbq = n;
        n.push = n;
        n.loaded = false;
        n.version = '2.0';
        n.queue = [];
    }

    var trackersLoaded = false;

    function loadTrackers() {
        if (trackersLoaded) return;
        trackersLoaded = true;

        gtag('consent', 'update', {
            ad_storage: 'granted',
            ad_user_data: 'granted',
            ad_personalization: 'granted',
            analytics_storage: 'granted'
        });

        window.fbq.loaded = true;
        loadScript('https://connect.facebook.net/en_US/fbevents.js');
        fbq('init', PIXEL_ID);
        fbq('track', 'PageView');

        window.clarity = window.clarity || function () {
            (window.clarity.q = window.clarity.q || []).push(arguments);
        };
        loadScript('https://www.clarity.ms/tag/' + CLARITY_ID);

        pageEvents();
    }

    // ---------------------------------------------------------------
    // Источник трафика
    // ---------------------------------------------------------------

    function collectAttribution() {
        var p = new URLSearchParams(window.location.search);
        var ref = document.referrer || '';
        var sameSite = ref && ref.indexOf(window.location.hostname) !== -1;

        var source = p.get('utm_source');
        var medium = p.get('utm_medium');

        // Рекламные клики узнаём по метке, даже если UTM забыли проставить.
        if (!source && p.get('fbclid')) { source = 'facebook'; medium = 'paid'; }
        if (!source && p.get('gclid')) { source = 'google'; medium = 'cpc'; }

        if (!source && ref && !sameSite) {
            try {
                source = new URL(ref).hostname.replace(/^www\./, '');
                medium = 'referral';
            } catch (e) { /* кривой referrer */ }
        }
        if (!source && !ref) { source = 'direct'; medium = 'none'; }
        if (!source) { source = 'unknown'; medium = medium || 'unknown'; }

        return {
            source: source,
            medium: medium || '',
            campaign: p.get('utm_campaign') || '',
            content: p.get('utm_content') || '',
            term: p.get('utm_term') || '',
            landing: window.location.pathname + window.location.search,
            referrer: sameSite ? '' : ref,
            date: new Date().toISOString().slice(0, 10)
        };
    }

    function rememberAttribution() {
        var store = attrStore();
        var current = collectAttribution();
        var hasSignal = current.source !== 'direct' && current.source !== 'unknown';

        if (!safeGet(store, ATTR_FIRST)) {
            safeSet(store, ATTR_FIRST, JSON.stringify(current));
        }
        // Последний источник переписываем только когда он что-то значит:
        // переход по внутренней ссылке не должен затирать рекламный клик.
        if (hasSignal || !safeGet(store, ATTR_LAST)) {
            safeSet(store, ATTR_LAST, JSON.stringify(current));
        }
    }

    function readAttr(key) {
        var raw = safeGet(attrStore(), key);
        if (!raw) return null;
        try { return JSON.parse(raw); } catch (e) { return null; }
    }

    // Короткая строка для письма: «facebook / paid · Renginiai LT - 2026-09»
    function attrLine(a) {
        if (!a) return '';
        var parts = [a.source + (a.medium ? ' / ' + a.medium : '')];
        if (a.campaign) parts.push(a.campaign);
        if (a.content) parts.push(a.content);
        return parts.join(' · ');
    }

    // Поля, которые уезжают вместе с заявкой в Formspree.
    function attributionPayload() {
        var last = readAttr(ATTR_LAST) || collectAttribution();
        var first = readAttr(ATTR_FIRST) || last;
        return {
            'Saltinis': attrLine(last),
            'Pirmas saltinis': attrLine(first),
            'Pirmas apsilankymas': first.date || '',
            'Puslapis': last.landing || '',
            'Nuoroda is': last.referrer || ''
        };
    }

    // ---------------------------------------------------------------
    // События
    // ---------------------------------------------------------------

    function event(name, params) {
        if (typeof gtag === 'function') gtag('event', name, params || {});
    }

    // Заявка. Единственное место, где рождается конверсия: и в GA, и в Meta.
    function lead(params) {
        params = params || {};
        event('generate_lead', {
            currency: params.currency || 'EUR',
            value: params.value || 0,
            content_name: params.content_name || '',
            traffic_source: attrLine(readAttr(ATTR_LAST))
        });
        if (typeof fbq === 'function' && trackersLoaded) {
            var fb = { content_name: params.content_name || '' };
            if (params.value) { fb.value = params.value; fb.currency = params.currency || 'EUR'; }
            fbq('track', 'Lead', fb);
        }
    }

    // Промежуточные события страницы — только после согласия, иначе Meta их отбросит.
    function pageEvents() {
        var path = window.location.pathname;
        if (typeof fbq !== 'function') return;
        if (/paslaugos(\.html)?\/?$/.test(path)) {
            fbq('track', 'ViewContent', { content_name: 'paslaugos', content_type: 'service' });
        }
    }

    function bindClicks() {
        document.addEventListener('click', function (e) {
            var a = e.target && e.target.closest ? e.target.closest('a') : null;
            if (!a) return;
            var href = a.getAttribute('href') || '';

            if (href.indexOf('tel:') === 0) {
                event('click_phone', { phone: href.replace('tel:', '') });
                if (typeof fbq === 'function' && trackersLoaded) fbq('track', 'Contact', { method: 'phone' });
            } else if (href.indexOf('mailto:') === 0) {
                event('click_email', {});
                if (typeof fbq === 'function' && trackersLoaded) fbq('track', 'Contact', { method: 'email' });
            } else if (href.indexOf('g.page') !== -1) {
                event('click_review', {});
            } else if (href.indexOf('mafiaonlinegame.com') !== -1) {
                event('click_play_online', {});
            }
        }, true);
    }

    // ---------------------------------------------------------------
    // Баннер согласия
    // ---------------------------------------------------------------

    var BANNER_TEXT = {
        lt: {
            text: 'Naudojame slapukus, kad geriau suprastume, kas mumis domisi.',
            all: 'Sutinku',
            necessary: 'Tik būtini',
            policy: 'Privatumo politika'
        },
        ru: {
            text: 'Используем cookie, чтобы лучше понимать, кому мы интересны.',
            all: 'Принимаю',
            necessary: 'Только необходимые',
            policy: 'Политика приватности'
        },
        en: {
            text: 'We use cookies to better understand who is interested in us.',
            all: 'Accept',
            necessary: 'Essential only',
            policy: 'Privacy policy'
        }
    };

    // Полоса на десктопе держится тонкой: одна строка текста и две кнопки
    // в её высоту. Ширину ей задаём left/right, а не width — иначе на странице
    // с вертикальной прокруткой элемент оказывается шире вьюпорта ровно на
    // полосу скроллбара, и вся страница начинает ездить вбок.
    var BANNER_CSS = [
        '.cookie-bar{position:fixed;left:0;right:0;bottom:0;z-index:9999;background:#000;',
        'box-sizing:border-box;max-width:100%;',
        'border-top:1px solid rgba(255,255,255,.14);padding:10px 20px;display:flex;align-items:center;',
        'gap:18px;justify-content:center;flex-wrap:wrap;transform:translateY(100%);',
        'transition:transform .5s cubic-bezier(.22,1,.36,1);-webkit-tap-highlight-color:transparent}',
        '.cookie-bar *{box-sizing:border-box}',
        '.cookie-bar.visible{transform:translateY(0)}',
        '.cookie-bar p{margin:0;color:rgba(255,255,255,.72);font-size:.72rem;line-height:1.45;',
        'letter-spacing:.02em;max-width:560px;min-width:0;overflow-wrap:anywhere}',
        '.cookie-bar-policy{color:rgba(255,255,255,.55);font-size:.68rem;letter-spacing:.02em;',
        'text-decoration:underline;text-underline-offset:3px;white-space:nowrap;flex-shrink:0}',
        '.cookie-bar-actions{display:flex;gap:8px;flex-shrink:0;min-width:0}',
        '.cookie-bar button{font-family:inherit;text-transform:uppercase;letter-spacing:.12em;',
        'font-size:.64rem;padding:8px 18px;border-radius:2px;cursor:pointer;white-space:nowrap;',
        'transition:background .3s ease,color .3s ease,border-color .3s ease,opacity .08s ease,transform .08s ease}',
        '.cookie-bar .cookie-all{background:#f7f7f7;color:#111;border:1px solid #f7f7f7}',
        '.cookie-bar .cookie-necessary{background:transparent;color:rgba(255,255,255,.78);',
        'border:1px solid rgba(255,255,255,.28)}',
        '@media (hover:hover){.cookie-bar .cookie-all:hover{background:#fff}',
        '.cookie-bar .cookie-necessary:hover{border-color:rgba(255,255,255,.6);color:#fff}',
        '.cookie-bar-policy:hover{color:rgba(255,255,255,.85)}}',
        '@media (hover:none){.cookie-bar button:active{transform:scale(.985);opacity:.72}}',
        // На телефоне полоса разворачивается в колонку: текст, кнопки,
        // и под ними — ссылка на политику (order, потому что в разметке
        // она идёт раньше кнопок ради десктопной строки).
        '@media (max-width:600px){.cookie-bar{flex-direction:column;align-items:stretch;gap:10px;',
        'padding:14px 20px calc(14px + env(safe-area-inset-bottom))}',
        '.cookie-bar p{max-width:none;font-size:.72rem;order:1}',
        '.cookie-bar-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px;order:2}',
        '.cookie-bar button{font-size:.62rem;padding:10px 14px}',
        '.cookie-bar-policy{order:3;text-align:center;font-size:.64rem;',
        'color:rgba(255,255,255,.45);white-space:normal}}',
        '@media (prefers-reduced-motion:reduce){.cookie-bar{transition:none}}'
    ].join('');

    function showBanner() {
        var T = BANNER_TEXT[LANG] || BANNER_TEXT.lt;

        var style = document.createElement('style');
        style.textContent = BANNER_CSS;
        document.head.appendChild(style);

        var bar = document.createElement('div');
        bar.className = 'cookie-bar';
        bar.setAttribute('role', 'dialog');
        bar.setAttribute('aria-live', 'polite');
        // Ссылка на политику — отдельным элементом, а не внутри абзаца:
        // на телефоне она уезжает под кнопки (order в колонке), и внутри
        // текста её было бы не сдвинуть.
        bar.innerHTML =
            '<p>' + T.text + '</p>' +
            '<a class="cookie-bar-policy" href="' + BASE + 'privatumo-politika.html">' + T.policy + '</a>' +
            '<div class="cookie-bar-actions">' +
            '<button type="button" class="cookie-all">' + T.all + '</button>' +
            '<button type="button" class="cookie-necessary">' + T.necessary + '</button>' +
            '</div>';
        document.body.appendChild(bar);

        // Через таймер, а не requestAnimationFrame: в фоновой вкладке кадры
        // не выдаются вовсе, и баннер остался бы за нижним краем навсегда.
        setTimeout(function () { bar.classList.add('visible'); }, 60);

        function close() {
            bar.classList.remove('visible');
            setTimeout(function () { bar.remove(); }, 500);
        }

        bar.querySelector('.cookie-all').addEventListener('click', function () {
            safeSet(window.localStorage, CONSENT_KEY, 'all');
            // Источник до согласия жил в sessionStorage — переносим, чтобы не потерять.
            var first = safeGet(window.sessionStorage, ATTR_FIRST);
            var last = safeGet(window.sessionStorage, ATTR_LAST);
            if (first) safeSet(window.localStorage, ATTR_FIRST, first);
            if (last) safeSet(window.localStorage, ATTR_LAST, last);
            loadTrackers();
            close();
        });

        bar.querySelector('.cookie-necessary').addEventListener('click', function () {
            safeSet(window.localStorage, CONSENT_KEY, 'necessary');
            close();
        });
    }

    // ---------------------------------------------------------------
    // Запуск
    // ---------------------------------------------------------------

    rememberAttribution();

    if (consentValue() === 'all') loadTrackers();

    function ready(fn) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', fn);
        } else {
            fn();
        }
    }

    ready(function () {
        bindClicks();
        if (!consentValue()) showBanner();
    });

    window.MafiaTracking = {
        lead: lead,
        event: event,
        attribution: attributionPayload,
        // Дописывает источник в FormData перед отправкой формы.
        applyToFormData: function (formData) {
            var payload = attributionPayload();
            Object.keys(payload).forEach(function (k) {
                if (payload[k]) formData.append(k, payload[k]);
            });
            return formData;
        }
    };
})();

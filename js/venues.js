// Список залов — одно место правды для страницы vietos.html и калькулятора на paslaugos.html.
//
// Порядок в массиве = порядок карточек на странице и номер зала (#1, #2…).
// Переставили строки — поменялись и номера, и порядок, и плитки в калькуляторе.
//
//   id     — префикс фото в images/vietos/ и data-id карточки в vietos.html (не меняется никогда)
//   photos — фото плитки в калькуляторе, по порядку; первое — обложка
//   guests — [от, до]; по «до» калькулятор решает, подходит ли зал под два стола
//   price  — уровень цены, 1–5 (€…€€€€€); на странице и в калькуляторе берётся отсюда
//   km     — от центра Вильнюса; столько же евро добавляется к цене за дорогу (1 km = 1 €)
//
// Новый зал: строка здесь + карточка в vietos.html с тем же data-id. Описание, кухня и
// фото карточки остаются в разметке страницы.
window.MAFIA_VENUES = [
    { id: 'sale-1', photos: ['sale-1-1.webp', 'sale-1-2.webp'],                                   guests: [10, 26], price: 4, km: 0 },
    { id: 'sale-2', photos: ['sale-2-1.webp', 'sale-2-2.webp'],                                   guests: [10, 22], price: 3, km: 0 },
    { id: 'sale-3', photos: ['sale-3-1.webp', 'sale-3-2.webp'],                                   guests: [20, 60], price: 3, km: 0 },
    { id: 'sale-7', photos: ['sale-7-1.webp', 'sale-7-2.webp'],                                   guests: [8, 14],  price: 2, km: 0 },
    { id: 'sale-8', photos: ['sale-8-1.webp', 'sale-8-2.webp', 'sale-8-3.webp', 'sale-8-4.webp'], guests: [10, 40], price: 5, km: 0 },
    { id: 'sale-5', photos: ['sale-5-1.webp', 'sale-5-2.webp', 'sale-5-3.webp'],                  guests: [10, 18], price: 3, km: 0 },
    { id: 'sale-6', photos: ['sale-6-1.webp', 'sale-6-2.webp', 'sale-6-3.webp'],                  guests: [10, 60], price: 3, km: 0 },
    { id: 'sale-9', photos: ['sale-9-2.webp', 'sale-9-1.webp'],                                   guests: [10, 50], price: 3, km: 20 }
];

// Цена услуги «подбор и бронирование зала», если клиент выбирает наше место
window.MAFIA_VENUE_FEE = 50;

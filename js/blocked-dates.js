// ===========================
// ЗАНЯТЫЕ ДАТЫ ДЛЯ КАЛЕНДАРЯ
// ===========================

// Формат даты: 'YYYY-MM-DD'
// Клиент может редактировать этот массив, добавляя или удаляя даты

// Занято только для мероприятий (žaidimas / renginys).
// На аренду атрибутики эти даты не влияют: комплектов несколько,
// и бронь реквизита на занятый день ничему не мешает.
const blockedDates = [
    '2026-09-12',
    '2026-10-15',
    '2026-10-31',
];

// Функция для проверки, заблокирована ли дата
function isDateBlocked(dateString) {
    return blockedDates.includes(dateString);
}

// Функция для добавления даты в список заблокированных
function addBlockedDate(dateString) {
    if (!isDateBlocked(dateString)) {
        blockedDates.push(dateString);
        blockedDates.sort(); // Сортируем для удобства
        console.log(`Дата ${dateString} добавлена в заблокированные`);
    }
}

// Функция для удаления даты из списка заблокированных
function removeBlockedDate(dateString) {
    const index = blockedDates.indexOf(dateString);
    if (index > -1) {
        blockedDates.splice(index, 1);
        console.log(`Дата ${dateString} удалена из заблокированных`);
    }
}

// Экспорт для использования в calendar.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { blockedDates, isDateBlocked, addBlockedDate, removeBlockedDate };
}
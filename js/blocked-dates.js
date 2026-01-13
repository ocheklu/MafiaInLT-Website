// ===========================
// ЗАНЯТЫЕ ДАТЫ ДЛЯ КАЛЕНДАРЯ
// ===========================

// Формат даты: 'YYYY-MM-DD'
// Клиент может редактировать этот массив, добавляя или удаляя даты

const blockedDates = [
    // Примеры занятых дат (клиент должен обновлять вручную):
    // '2025-01-15',
    // '2025-01-20',
    // '2025-02-14',
    // '2025-03-08',
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
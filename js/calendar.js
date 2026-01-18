// ===========================
// ИНТЕРАКТИВНЫЙ КАЛЕНДАРЬ
// ===========================

class Calendar {
    constructor(containerId, onDateSelect, options = {}) {
        this.container = document.getElementById(containerId);
        if (!this.container) return;
        
        this.currentDate = new Date();
        this.selectedDate = null;
        this.onDateSelect = onDateSelect;
        
        // Range mode for selecting two dates
        this.isRangeMode = options.rangeMode || false;
        this.selectedDateStart = null;
        this.selectedDateEnd = null;
        
        this.monthNames = [
            'Sausis', 'Vasaris', 'Kovas', 'Balandis', 'Gegužė', 'Birželis',
            'Liepa', 'Rugpjūtis', 'Rugsėjis', 'Spalis', 'Lapkritis', 'Gruodis'
        ];
        
        this.weekDays = ['Pr', 'An', 'Tr', 'Kt', 'Pn', 'Št', 'Sk'];
        
        this.render();
    }
    
    render() {
        this.container.innerHTML = '';
        
        // Создаем header календаря
        const header = document.createElement('div');
        header.className = 'calendar-header';
        
        const prevBtn = document.createElement('button');
        prevBtn.className = 'calendar-nav';
        prevBtn.innerHTML = '&larr;';
        prevBtn.addEventListener('click', () => this.previousMonth());
        
        const currentMonth = document.createElement('span');
        currentMonth.textContent = `${this.monthNames[this.currentDate.getMonth()]} ${this.currentDate.getFullYear()}`;
        
        const nextBtn = document.createElement('button');
        nextBtn.className = 'calendar-nav';
        nextBtn.innerHTML = '&rarr;';
        nextBtn.addEventListener('click', () => this.nextMonth());
        
        header.appendChild(prevBtn);
        header.appendChild(currentMonth);
        header.appendChild(nextBtn);
        
        this.container.appendChild(header);
        
        // Создаем сетку календаря
        const grid = document.createElement('div');
        grid.className = 'calendar-grid';
        
        // Добавляем дни недели
        this.weekDays.forEach(day => {
            const dayHeader = document.createElement('div');
            dayHeader.className = 'calendar-weekday';
            dayHeader.textContent = day;
            grid.appendChild(dayHeader);
        });
        
        // Получаем первый день месяца
        const firstDay = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), 1);
        const lastDay = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 0);
        
        // Корректируем день недели (понедельник = 0)
        let startDay = firstDay.getDay() - 1;
        if (startDay === -1) startDay = 6;
        
        // Добавляем пустые ячейки до первого дня
        for (let i = 0; i < startDay; i++) {
            const emptyDay = document.createElement('div');
            emptyDay.className = 'calendar-day disabled';
            grid.appendChild(emptyDay);
        }
        
        // Добавляем дни месяца
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        for (let day = 1; day <= lastDay.getDate(); day++) {
            const dayElement = document.createElement('div');
            dayElement.className = 'calendar-day';
            dayElement.textContent = day;
            
            const currentDayDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), day);
            const dateString = this.formatDate(currentDayDate);
            
            // Проверяем, не прошедшая ли это дата
            if (currentDayDate < today) {
                dayElement.classList.add('disabled');
            }
            // Проверяем, не заблокирована ли дата
            else if (typeof isDateBlocked !== 'undefined' && isDateBlocked(dateString)) {
                dayElement.classList.add('blocked');
                dayElement.title = 'Ši data užimta';
            }
            // Проверяем, выбрана ли дата
            else if (this.selectedDate && this.formatDate(this.selectedDate) === dateString) {
                dayElement.classList.add('selected');
            }
            // Range mode: check if date is in range
            else if (this.isRangeMode && this.selectedDateStart && this.selectedDateEnd) {
                const startStr = this.formatDate(this.selectedDateStart);
                const endStr = this.formatDate(this.selectedDateEnd);
                
                if (dateString === startStr || dateString === endStr) {
                    dayElement.classList.add('selected');
                } else if (dateString > startStr && dateString < endStr) {
                    dayElement.classList.add('in-range');
                }
                // Allow clicking to reset range
                dayElement.addEventListener('click', () => this.selectDate(currentDayDate));
            }
            // Range mode: check if start date selected
            else if (this.isRangeMode && this.selectedDateStart && !this.selectedDateEnd) {
                const startStr = this.formatDate(this.selectedDateStart);
                if (dateString === startStr) {
                    dayElement.classList.add('selected');
                }
                // Allow clicking to select second date
                dayElement.addEventListener('click', () => this.selectDate(currentDayDate));
            }
            // Дата доступна для выбора
            else {
                dayElement.addEventListener('click', () => this.selectDate(currentDayDate));
            }
            
            grid.appendChild(dayElement);
        }
        
        this.container.appendChild(grid);
    }
    
    formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
    
    selectDate(date) {
        if (this.isRangeMode) {
            // Range mode: select start and end dates
            if (!this.selectedDateStart || (this.selectedDateStart && this.selectedDateEnd)) {
                // First date or reset
                this.selectedDateStart = date;
                this.selectedDateEnd = null;
                this.render();
            } else {
                // Second date
                this.selectedDateEnd = date;
                this.render();
                
                if (this.onDateSelect) {
                    this.onDateSelect(date);
                }
            }
        } else {
            // Single date mode
            this.selectedDate = date;
            this.render();
            
            if (this.onDateSelect) {
                this.onDateSelect(date);
            }
        }
    }
    
    previousMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() - 1);
        this.render();
    }
    
    nextMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() + 1);
        this.render();
    }
    
    getSelectedDate() {
        return this.selectedDate;
    }
    
    getFormattedSelectedDate() {
        if (!this.selectedDate) return null;
        return this.formatDate(this.selectedDate);
    }
}

// Экспорт для использования в calculator.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Calendar;
}
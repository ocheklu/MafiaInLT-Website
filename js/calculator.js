// ===========================
// КАЛЬКУЛЯТОР ЦЕН
// ===========================

document.addEventListener('DOMContentLoaded', function() {
    // Проверяем, есть ли калькулятор на странице
    const calculatorForm = document.getElementById('calculator-form');
    if (!calculatorForm) return;
    
    // Инициализация переменных
    let calendar = null;
    let selectedPackage = '';
    let selectedDate = null;
    let guestCount = 0;
    let selectedLocation = 'vilnius';
    let distance = 0;
    let additionalServices = [];
    
    // Цены для пакетов
    const prices = {
        zaidimo: {
            '2sessions': 400,   // 9-20 гостей, 1 стол
            '3sessions': 600,   // 9-30 гостей, 1 стол
            '4sessions': 800,   // 20-40 гостей, 2 стола
            '6sessions': 1200   // 20-60 гостей, 2 стола
        },
        renginio: {
            'venue': 50,
            'coordination': 200,
            'flowers': 200,
            'decoration': 600,
            'photographer': 600,
            'videographer': 600,
            '3sessions': 600,   // обязательный
            '6sessions': 1200,  // обязательный
            'extra_table': 50
        },
        atributika: {
            'base': 150
        },
        distance: {
            50: 20,
            100: 40,
            150: 60,
            200: 80,
            250: 100,
            300: 120,
            350: 140
        }
    };
    
    // Элементы формы
    const packageSelect = document.getElementById('package');
    const guestsInput = document.getElementById('guests');
    const locationRadios = document.querySelectorAll('input[name="location"]');
    const distanceGroup = document.querySelector('.location-distance');
    const distanceSelect = document.getElementById('distance');
    const additionalServicesContainer = document.getElementById('additional-services');
    const calculateBtn = document.getElementById('calculate-btn');
    const resultContainer = document.querySelector('.calculator-result');
    
    // Инициализация календаря
    calendar = new Calendar('calendar', function(date) {
        selectedDate = date;
        console.log('Выбрана дата:', date);
    });
    
    // Обработчик выбора пакета
    packageSelect.addEventListener('change', function() {
        selectedPackage = this.value;
        updateAdditionalServices();
        updateGuestsValidation();
        resetCalculation();
    });
    
    // Обработчик количества гостей
    guestsInput.addEventListener('input', function() {
        guestCount = parseInt(this.value) || 0;
        updateGuestsValidation();
        resetCalculation();
    });
    
    // Обработчики локации
    locationRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            selectedLocation = this.value;
            if (selectedLocation === 'outside') {
                distanceGroup.classList.add('active');
            } else {
                distanceGroup.classList.remove('active');
                distance = 0;
            }
            resetCalculation();
        });
    });
    
    // Обработчик расстояния
    distanceSelect.addEventListener('change', function() {
        distance = parseInt(this.value) || 0;
        resetCalculation();
    });
    
    // Функция обновления дополнительных услуг
    function updateAdditionalServices() {
        additionalServicesContainer.innerHTML = '';
        
        if (selectedPackage === 'zaidimo') {
            // Для žaidimo organizavimas показываем включенные услуги
            const included = [
                'Atributika',
                'Apvalus stalas su staltiese',
                'Svečių vardų kortelės',
                'Vedėjo(-ų) paslaugos'
            ];
            
            included.forEach(service => {
                const div = createCheckboxItem(service, 0, true, true);
                additionalServicesContainer.appendChild(div);
            });
        } else if (selectedPackage === 'renginio') {
            // Для renginio organizavimas все опции
            const services = [
                { name: 'Vietos paieška ir rezervacija', price: 50, key: 'venue' },
                { name: 'Programos planavimas ir renginio koordinavimas vietoje', price: 200, key: 'coordination' },
                { name: 'Stalo dekoravimas gėlėmis', price: 200, key: 'flowers' },
                { name: 'Visos erdvės dekoravimas', price: 600, key: 'decoration' },
                { name: 'Fotografas (3 valandos)', price: 600, key: 'photographer' },
                { name: 'Videografas (3 valandos)', price: 600, key: 'videographer' },
                { name: 'Papildomas apvalus stalas ir staltiese', price: 50, key: 'extra_table' }
            ];
            
            services.forEach(service => {
                const div = createCheckboxItem(service.name, service.price, false, false, service.key);
                additionalServicesContainer.appendChild(div);
            });
            
            // Добавляем включенные услуги
            const included = [
                'Vedėjo(-ų) paslaugos',
                'Atributika',
                'Apvalus stalas su staltiese',
                'Svečių vardų kortelės'
            ];
            
            const separator = document.createElement('h4');
            separator.textContent = 'Įtraukta automatiškai:';
            separator.style.marginTop = '1rem';
            additionalServicesContainer.appendChild(separator);
            
            included.forEach(service => {
                const div = createCheckboxItem(service, 0, true, true);
                additionalServicesContainer.appendChild(div);
            });
        } else if (selectedPackage === 'atributika') {
            // Для atributikos nuoma показываем что включено
            const included = [
                'Kaukės (10 vnt)',
                'Revolveriai (10 vnt)',
                'Vokai (10 vnt)',
                'Vaidmenų kortelės (10 vnt)',
                'Šablonai vedėjui (3 vnt)',
                'Pagrindas rašymui',
                'Rašiklis'
            ];
            
            included.forEach(service => {
                const div = createCheckboxItem(service, 0, true, true);
                additionalServicesContainer.appendChild(div);
            });
        }
    }
    
    // Создание чекбокса
    function createCheckboxItem(name, price, checked, disabled, key = '') {
        const div = document.createElement('div');
        div.className = 'checkbox-item';
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = checked;
        checkbox.disabled = disabled;
        if (key) checkbox.dataset.serviceKey = key;
        
        if (!disabled) {
            checkbox.addEventListener('change', function() {
                resetCalculation();
            });
        }
        
        const label = document.createElement('label');
        label.textContent = price > 0 ? `${name} (+${price}€)` : name;
        
        div.appendChild(checkbox);
        div.appendChild(label);
        
        return div;
    }
    
    // Валидация количества гостей
    function updateGuestsValidation() {
        if (selectedPackage === 'zaidimo' || selectedPackage === 'renginio') {
            if (guestCount > 60) {
                guestsInput.setCustomValidity('Maksimalus svečių skaičius: 60');
            } else if (guestCount > 0 && guestCount < 9) {
                guestsInput.setCustomValidity('Minimalus svečių skaičius: 9');
            } else {
                guestsInput.setCustomValidity('');
            }
        } else {
            guestsInput.setCustomValidity('');
        }
    }
    
    // Сброс результата при изменении данных
    function resetCalculation() {
        resultContainer.classList.remove('active');
        calculateBtn.textContent = 'Paskaičiuoti';
        calculateBtn.classList.remove('btn-reserve');
    }
    
    // Обработчик кнопки расчета
    calculateBtn.addEventListener('click', function(e) {
        e.preventDefault();
        
        // Если кнопка уже в режиме резервации
        if (this.classList.contains('btn-reserve')) {
            openReservationForm();
            return;
        }
        
        // Валидация
        if (!selectedPackage) {
            alert('Pasirinkite paketą');
            return;
        }
        
        if (!selectedDate) {
            alert('Pasirinkite datą');
            return;
        }
        
        if ((selectedPackage === 'zaidimo' || selectedPackage === 'renginio') && (guestCount < 9 || guestCount > 60)) {
            alert('Svečių skaičius turi būti nuo 9 iki 60');
            return;
        }
        
        // Расчет цены
        const calculation = calculatePrice();
        displayResult(calculation);
        
        // Изменяем кнопку на "Rezervuoti"
        this.textContent = 'Rezervuoti';
        this.classList.add('btn-reserve');
    });
    
    // Функция расчета цены
    function calculatePrice() {
        let total = 0;
        let breakdown = [];
        
        if (selectedPackage === 'zaidimo') {
            // Определяем количество сессий на основе гостей
            let sessions = '';
            let sessionPrice = 0;
            
            if (guestCount >= 9 && guestCount <= 20) {
                sessions = '2 žaidimo sesijos';
                sessionPrice = prices.zaidimo['2sessions'];
            } else if (guestCount >= 21 && guestCount <= 30) {
                sessions = '3 žaidimo sesijos';
                sessionPrice = prices.zaidimo['3sessions'];
            } else if (guestCount >= 31 && guestCount <= 40) {
                sessions = '4 žaidimo sesijos';
                sessionPrice = prices.zaidimo['4sessions'];
            } else if (guestCount >= 41 && guestCount <= 60) {
                sessions = '6 žaidimo sesijos';
                sessionPrice = prices.zaidimo['6sessions'];
            }
            
            breakdown.push({ name: sessions, price: sessionPrice });
            total += sessionPrice;
            
        } else if (selectedPackage === 'renginio') {
            // Определяем базовую стоимость игры
            let gameSessions = '';
            let gamePrice = 0;
            
            if (guestCount >= 9 && guestCount <= 30) {
                gameSessions = '3 žaidimo sesijos';
                gamePrice = prices.renginio['3sessions'];
            } else if (guestCount >= 31 && guestCount <= 60) {
                gameSessions = '6 žaidimo sesijos';
                gamePrice = prices.renginio['6sessions'];
            }
            
            breakdown.push({ name: gameSessions, price: gamePrice });
            total += gamePrice;
            
            // Дополнительные услуги
            const checkboxes = additionalServicesContainer.querySelectorAll('input[type="checkbox"]:not(:disabled):checked');
            checkboxes.forEach(checkbox => {
                const key = checkbox.dataset.serviceKey;
                if (key && prices.renginio[key]) {
                    const label = checkbox.nextElementSibling.textContent;
                    const price = prices.renginio[key];
                    breakdown.push({ name: label.split(' (+')[0], price: price });
                    total += price;
                }
            });
            
        } else if (selectedPackage === 'atributika') {
            breakdown.push({ name: 'Atributikos nuoma (1 para)', price: prices.atributika.base });
            total += prices.atributika.base;
        }
        
        // Добавляем стоимость за расстояние
        if (selectedLocation === 'outside' && distance > 0) {
            const distancePrice = prices.distance[distance] || 0;
            if (distancePrice > 0) {
                breakdown.push({ name: `Atstumas: ${distance} km`, price: distancePrice });
                total += distancePrice;
            }
        }
        
        return { total, breakdown };
    }
    
    // Отображение результата
    function displayResult(calculation) {
        const totalElement = resultContainer.querySelector('.total-price');
        const breakdownElement = resultContainer.querySelector('.price-breakdown');
        
        totalElement.textContent = `${calculation.total}€`;
        
        let breakdownHTML = '<h4>Išsami kaina:</h4>';
        calculation.breakdown.forEach(item => {
            breakdownHTML += `
                <div class="price-item">
                    <span>${item.name}</span>
                    <span>${item.price}€</span>
                </div>
            `;
        });
        
        breakdownElement.innerHTML = breakdownHTML;
        resultContainer.classList.add('active');
        
        // Плавная прокрутка к результату
        resultContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    
    // Открытие формы резервации
    function openReservationForm() {
        // Подготовка данных для формы
        const calculation = calculatePrice();
        const formData = {
            package: packageSelect.options[packageSelect.selectedIndex].text,
            date: calendar.getFormattedSelectedDate(),
            guests: guestCount,
            location: selectedLocation === 'vilnius' ? 'Vilnius' : `Už Vilniaus ribų (${distance} km)`,
            total: calculation.total,
            breakdown: calculation.breakdown
        };
        
        // Создаем скрытую форму и отправляем через Formspree
        createAndSubmitReservationForm(formData);
    }
    
    // Создание и отправка формы резервации
    function createAndSubmitReservationForm(data) {
        // Формируем детали заказа
        let orderDetails = `
NAUJAS REZERVACIJOS UŽKLAUSIMAS

Paketas: ${data.package}
Data: ${data.date}
Svečių skaičius: ${data.guests}
Lokacija: ${data.location}

KAINŲ IŠSKLEIDIMAS:
${data.breakdown.map(item => `${item.name}: ${item.price}€`).join('\n')}

BENDRA SUMA: ${data.total}€

Klientas užpildys savo kontaktus formoje.
        `;
        
        // Открываем модальное окно для ввода контактов
        const modal = createContactModal(orderDetails, data);
        document.body.appendChild(modal);
    }
    
    // Создание модального окна для контактов
    function createContactModal(orderDetails, orderData) {
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.7);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 3000;
        `;
        
        const modalContent = document.createElement('div');
        modalContent.style.cssText = `
            background: white;
            padding: 2rem;
            border-radius: 10px;
            max-width: 500px;
            width: 90%;
        `;
        
        modalContent.innerHTML = `
            <h3>Užbaigti rezervaciją</h3>
            <p style="margin-bottom: 1rem;">Įveskite savo kontaktus ir mes su jumis susisieksime artimiausiu metu.</p>
            
            <form id="reservation-form" action="https://formspree.io/f/mwvvkyok" method="POST">
                <input type="hidden" name="order_details" value="${encodeURIComponent(orderDetails)}">
                <input type="hidden" name="total" value="${orderData.total}€">
                
                <div class="form-group">
                    <label>Jūsų vardas *</label>
                    <input type="text" name="name" required>
                </div>
                
                <div class="form-group">
                    <label>Telefonas *</label>
                    <input type="tel" name="phone" required>
                </div>
                
                <div class="form-group">
                    <label>El. paštas *</label>
                    <input type="email" name="email" required>
                </div>
                
                <div class="form-group">
                    <label>Papildoma informacija</label>
                    <textarea name="additional_info" rows="3"></textarea>
                </div>
                
                <div style="display: flex; gap: 1rem; margin-top: 1.5rem;">
                    <button type="submit" class="btn btn-primary" style="flex: 1;">Siųsti užklausą</button>
                    <button type="button" class="btn btn-outline" id="cancel-reservation" style="flex: 1;">Atšaukti</button>
                </div>
            </form>
        `;
        
        modal.appendChild(modalContent);
        
        // Обработчик отмены
        modal.querySelector('#cancel-reservation').addEventListener('click', function() {
            document.body.removeChild(modal);
        });
        
        // Обработчик отправки формы
        modal.querySelector('#reservation-form').addEventListener('submit', function(e) {
            // Форма отправится через Formspree
            // После отправки можно показать сообщение об успехе
            setTimeout(() => {
                alert('Užklausa išsiųsta! Susisieksime su jumis artimiausiu metu.');
                document.body.removeChild(modal);
                location.reload(); // Перезагружаем страницу
            }, 1000);
        });
        
        return modal;
    }
});
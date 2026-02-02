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

// Update progress bar with bullet animation
function updateProgressBar(currentStep) {
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
}

// Go to specific step by clicking on progress bar
function goToStep(stepNumber) {
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
}

// Transition between steps with animation
function transitionToStep(currentStepId, nextStepId, progressStep) {
    const currentStep = document.getElementById(currentStepId);
    const nextStep = document.getElementById(nextStepId);
    
    if (!currentStep || !nextStep) return;
    
    // Mark step as completed
    if (!calculatorState.completedSteps.includes(progressStep)) {
        calculatorState.completedSteps.push(progressStep);
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

    // Show mobile info popup on first visit to step 6
    if (progressStep === 6 && window.innerWidth <= 768) {
        const hasSeenPopup = localStorage.getItem('reserveInfoSeen');
        if (!hasSeenPopup) {
            setTimeout(() => {
                const popup = document.getElementById('mobile-reserve-info');
                if (popup) {
                    popup.style.display = 'block';
                }
            }, 1000);
        }
    }
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

// Service selection
document.querySelector('#step-service').querySelectorAll('.service-option').forEach(option => {
    option.addEventListener('click', function() {
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
        const radio = this.querySelector('input[name="location"]');
        const newLocation = radio.value;
        
        console.log('Location click:', {
            old: calculatorState.location,
            new: newLocation,
            currentStep: calculatorState.currentStep
        });
        
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

// Days selection (for atributika)
document.getElementById('days-select')?.addEventListener('change', function() {
    calculatorState.days = parseInt(this.value);
});

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
                    <span class="service-name">${service.name}</span>
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
                    <span class="service-name">${service.name}</span>
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
        });
    });
}

// Next to summary button
document.getElementById('next-to-summary-btn')?.addEventListener('click', function() {
    let basePrice = 0;
    
    if (calculatorState.service === 'atributika') {
        basePrice = prices.atributika * calculatorState.days;
    } else {
        basePrice = prices[calculatorState.service][calculatorState.tables];
        basePrice += calculatorState.distance;
    }
    
    const additionalPrice = calculatorState.additionalServices.reduce((sum, service) => sum + service.price, 0);
    const totalPrice = basePrice + additionalPrice;
    
    // Show summary
    showSummary(totalPrice);
});

function showSummary(totalPrice) {
    const summaryCard = document.getElementById('summary-card');
    let summaryHTML = '<div style="font-size: 0.95rem; line-height: 1.8;">';
    
    // Service type
    const serviceNames = {
        'zaidimo': 'Žaidimo organizavimas',
        'renginio': 'Renginio organizavimas',
        'atributika': 'Atributikos nuoma'
    };
    summaryHTML += `<p><strong>Paslauga:</strong> ${serviceNames[calculatorState.service]}</p>`;
    
    // Date
    if (calculatorState.dateStart) {
        summaryHTML += `<p><strong>Data:</strong> ${calculatorState.dateStart}</p>`;
    }
    if (calculatorState.dateEnd && calculatorState.service === 'atributika') {
        summaryHTML += `<p><strong>Pabaigos data:</strong> ${calculatorState.dateEnd}</p>`;
    }
    
    // Tables or days
    if (calculatorState.tables) {
        summaryHTML += `<p><strong>Stalų kiekis:</strong> ${calculatorState.tables}</p>`;
    }
    if (calculatorState.days) {
        summaryHTML += `<p><strong>Parų kiekis:</strong> ${calculatorState.days}</p>`;
    }
    
    // Location
    if (calculatorState.service !== 'atributika') {
        summaryHTML += `<p><strong>Lokacija:</strong> ${calculatorState.location === 'vilnius' ? 'Vilnius' : 'Už Vilniaus ribų'}</p>`;
        if (calculatorState.distance > 0) {
            summaryHTML += `<p><strong>Atstumas:</strong> +${calculatorState.distance} €</p>`;
        }
    }
    
    // Additional services
    if (calculatorState.additionalServices.length > 0) {
        summaryHTML += '<p><strong>Papildomos paslaugos:</strong></p><ul style="margin-left: 1.5rem;">';
        calculatorState.additionalServices.forEach(service => {
            summaryHTML += `<li>${service.name} (+${service.price} €)</li>`;
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

// Reserve button tooltip
document.getElementById('reserve-btn')?.addEventListener('mouseenter', function() {
    const tooltip = this.parentElement.querySelector('.tooltip');
    if (tooltip) {
        tooltip.style.display = 'block';
        tooltip.style.visibility = 'visible';
        tooltip.style.opacity = '1';
    }
});
document.getElementById('reserve-btn')?.addEventListener('mouseleave', function() {
    const tooltip = this.parentElement.querySelector('.tooltip');
    if (tooltip) {
        tooltip.style.display = 'none';
        tooltip.style.visibility = 'hidden';
        tooltip.style.opacity = '0';
    }
});

// Reserve button click
document.getElementById('reserve-btn')?.addEventListener('click', async function() {
    const email = document.getElementById('client-email').value;
    
    if (!email || !email.includes('@')) {
        showModal('Klaida', 'Prašome įvesti galiojantį el. pašto adresą');
        document.getElementById('client-email').focus();
        return;
    }
    
    // Prepare data
    const formData = {
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
            showModal('Ačiū', 'Jūsų užklausa išsiųsta. Susisieksime su jumis artimiausiu metu.');
        } else {
            showModal('Klaida', 'Užklausa neišsiųsta. Prašome bandyti dar kartą.');
        }
    } catch (error) {
        showModal('Klaida', 'Užklausa neišsiųsta. Prašome bandyti dar kartą.');
        console.error('Formspree error:', error);
    }
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
        // Callback when date is selected
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        
        const newDate = `${year}-${month}-${day}`;
        console.log('Date selected:', {
            isAtributika,
            dateStart: calculatorState.dateStart,
            dateEnd: calculatorState.dateEnd,
            newDate
        });
        
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
                tooltip.textContent = 'Pasirinkite pabaigos datą';
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
            
            calculatorState.dateEnd = newDate;
            
            // Calculate days
            const start = new Date(calculatorState.dateStart);
            const end = new Date(calculatorState.dateEnd);
            const diffTime = Math.abs(end - start);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
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
        const [year, month, day] = calculatorState.dateStart.split('-');
        
        if (isAtributika && calculatorState.dateEnd) {
            // Restore both dates for atributika
            const [year2, month2, day2] = calculatorState.dateEnd.split('-');
            calculatorCalendar.selectedDateStart = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
            calculatorCalendar.selectedDateEnd = new Date(parseInt(year2), parseInt(month2) - 1, parseInt(day2));
        } else {
            // Restore single date for zaidimo/renginio
            calculatorCalendar.selectedDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
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

// Mobile popup close handler
document.querySelector('.mobile-popup-close')?.addEventListener('click', function() {
    const popup = document.getElementById('mobile-reserve-info');
    if (popup) {
        popup.style.display = 'none';
        localStorage.setItem('reserveInfoSeen', 'true');
    }
});

// Success modal close handler
document.querySelector('.contact-modal-close')?.addEventListener('click', function() {
    const modal = document.getElementById('successModal');
    if (modal) {
        modal.classList.remove('show');
    }
});

// Close modal on outside click
window.addEventListener('click', function(e) {
    const modal = document.getElementById('successModal');
    if (e.target === modal) {
        modal.classList.remove('show');
    }
});

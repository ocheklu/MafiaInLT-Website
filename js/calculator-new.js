// ===========================
// NEW CALCULATOR LOGIC
// ===========================

const calculatorState = {
    service: null,
    dateStart: null,
    dateEnd: null,
    tables: null,
    days: null,
    location: 'vilnius',
    distance: 0,
    additionalServices: []
};

// Update progress bar
function updateProgressBar(currentStep) {
    const steps = document.querySelectorAll('.progress-step');
    const progressLine = document.querySelector('.progress-line');
    
    steps.forEach((step, index) => {
        if (index < currentStep - 1) {
            step.classList.add('completed');
            step.classList.remove('active');
        } else if (index === currentStep - 1) {
            step.classList.add('active');
            step.classList.remove('completed');
        } else {
            step.classList.remove('active', 'completed');
        }
    });
    
    const progress = ((currentStep - 1) / (steps.length - 1)) * 100;
    progressLine.style.width = progress + '%';
}

// Transition between steps with animation
function transitionToStep(currentStepId, nextStepId, progressStep) {
    const currentStep = document.getElementById(currentStepId);
    const nextStep = document.getElementById(nextStepId);
    
    if (!currentStep || !nextStep) return;
    
    // Exit current step
    currentStep.classList.add('exit-left');
    currentStep.classList.remove('active');
    
    // Enter next step after delay
    setTimeout(() => {
        nextStep.style.display = 'block';
        
        setTimeout(() => {
            nextStep.classList.add('active');
            updateProgressBar(progressStep);
        }, 50);
    }, 500);
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
document.querySelectorAll('.service-option').forEach(option => {
    option.addEventListener('click', function() {
        // Remove active class from all
        document.querySelectorAll('.service-option').forEach(opt => {
            opt.style.borderColor = '#e0e0e0';
            opt.style.background = 'white';
        });
        
        // Add active to clicked
        this.style.borderColor = '#000';
        this.style.background = '#f8f8f8';
        
        calculatorState.service = this.dataset.service;

// Animate step transition
transitionToStep('step-service', 'step-calendar', 2);
setTimeout(() => initCalculatorCalendar(), 600);
    });
});

// Table selection
document.querySelectorAll('.table-option').forEach(option => {
    option.addEventListener('click', function() {
        document.querySelectorAll('.table-option > div').forEach(div => {
            div.style.borderColor = '#e0e0e0';
            div.style.background = 'white';
        });
        
        this.querySelector('div').style.borderColor = '#000';
        this.querySelector('div').style.background = '#f8f8f8';
        
        calculatorState.tables = parseInt(this.dataset.tables);
        
        // Transition to next step
if (calculatorState.service === 'zaidimo') {
    transitionToStep('step-tables', 'step-location', 4);
} else {
    // For renginio, skip to services
    transitionToStep('step-tables', 'step-services', 4);
    setTimeout(() => showServicesStep(), 600);
}
    });
});

// Location selection
document.querySelectorAll('input[name="location"]').forEach(radio => {
    radio.addEventListener('change', function() {
        if (this.value === 'outside') {
            document.getElementById('distance-select').style.display = 'block';
        } else {
            document.getElementById('distance-select').style.display = 'none';
            calculatorState.distance = 0;
        }
        calculatorState.location = this.value;
        
        // Transition to services step
        transitionToStep('step-location', 'step-services', 4);
        setTimeout(() => showServicesStep(), 600);
    });
});

// Distance selection
document.querySelector('#distance-select select')?.addEventListener('change', function() {
    calculatorState.distance = parseInt(this.value);
});

// Days selection
document.getElementById('days-select')?.addEventListener('change', function() {
    calculatorState.days = parseInt(this.value);

// For atributika, transition to result
document.getElementById('step-days').classList.add('exit-left');
document.getElementById('step-days').classList.remove('active');
setTimeout(() => {
    document.getElementById('calculate-btn').style.display = 'inline-block';
}, 500);
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
    }
    
    services.forEach(service => {
        const serviceDiv = document.createElement('div');
        serviceDiv.style.cssText = 'padding: 1rem; border: 2px solid #e0e0e0; border-radius: 10px; display: flex; justify-content: space-between; align-items: center;';
        
        if (service.included) {
            serviceDiv.innerHTML = `
                <label style="display: flex; align-items: center; flex: 1; cursor: not-allowed; opacity: 0.7;">
                    <input type="checkbox" checked disabled style="margin-right: 1rem;">
                    <span>${service.name}</span>
                </label>
                <span style="color: #2d6a4f; font-weight: 600;">Įskaičiuota</span>
            `;
        } else {
            serviceDiv.innerHTML = `
                <label style="display: flex; align-items: center; flex: 1; cursor: pointer;">
                    <input type="checkbox" class="additional-service" data-service="${service.name}" data-price="${service.price}" style="margin-right: 1rem;">
                    <span>${service.name}</span>
                </label>
                <span style="font-weight: 600;">+${service.price} €</span>
            `;
        }
        
        servicesList.appendChild(serviceDiv);
    });
    
    // Services step is already shown by transitionToStep
    document.getElementById('calculate-btn').style.display = 'inline-block';
    
    // Add event listeners to checkboxes
    document.querySelectorAll('.additional-service').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            if (this.checked) {
                calculatorState.additionalServices.push({
                    name: this.dataset.service,
                    price: parseInt(this.dataset.price)
                });
            } else {
                calculatorState.additionalServices = calculatorState.additionalServices.filter(
                    s => s.name !== this.dataset.service
                );
            }
        });
    });
}

// Calculate button
document.getElementById('calculate-btn')?.addEventListener('click', function() {
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
    
    // Hide all steps and show result with animation
    const activeStep = document.querySelector('.calculator-step.active');
    if (activeStep) {
        activeStep.classList.add('exit-left');
        activeStep.classList.remove('active');
    }
    
    document.getElementById('calculate-btn').style.display = 'none';
    
    setTimeout(() => {
        document.getElementById('result-summary').style.display = 'block';
        updateProgressBar(5);
        document.getElementById('result-summary').scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 500);
}

// Reserve button tooltip
document.getElementById('reserve-btn')?.addEventListener('mouseenter', function() {
    this.parentElement.querySelector('.tooltip').style.display = 'block';
});
document.getElementById('reserve-btn')?.addEventListener('mouseleave', function() {
    this.parentElement.querySelector('.tooltip').style.display = 'none';
});

// Reserve button click
document.getElementById('reserve-btn')?.addEventListener('click', function() {
    const email = document.getElementById('client-email').value;
    
    if (!email || !email.includes('@')) {
        alert('Prašome įvesti galiojantį el. pašto adresą');
        document.getElementById('client-email').focus();
        return;
    }
    
    // Here you would send the data to Formspree or your email service
    alert('Ačiū! Jūsų užklausa išsiųsta. Susisieksime su jumis artimiausiu metu.');
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
    
    calculatorCalendar = new Calendar('calculator-calendar', function(date) {
        // Callback when date is selected
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        calculatorState.dateStart = `${year}-${month}-${day}`;
        
        // Transition to next step
        if (calculatorState.service === 'atributika') {
            transitionToStep('step-calendar', 'step-days', 3);
        } else {
            transitionToStep('step-calendar', 'step-tables', 3);
        }
    });
}
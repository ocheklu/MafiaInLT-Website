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
        });
        
        // Закрыть меню при клике на ссылку
        const navLinks = document.querySelectorAll('.nav-menu a');
        navLinks.forEach(link => {
            link.addEventListener('click', function() {
                navMenu.classList.remove('active');
                mobileToggle.classList.remove('active');
            });
        });
        
        // Закрыть меню при клике вне его
        document.addEventListener('click', function(e) {
            if (!navMenu.contains(e.target) && !mobileToggle.contains(e.target)) {
                navMenu.classList.remove('active');
                mobileToggle.classList.remove('active');
            }
        });
    }
});

// ===========================
// ПЕРЕКЛЮЧАТЕЛЬ ЯЗЫКОВ
// ===========================

let currentLanguage = 'lt'; // По умолчанию литовский

document.addEventListener('DOMContentLoaded', function() {
    const langButtons = document.querySelectorAll('.lang-btn');
    
    // Проверяем сохраненный язык в localStorage
    const savedLang = localStorage.getItem('selectedLanguage');
    if (savedLang) {
        currentLanguage = savedLang;
        updateLanguageUI(savedLang);
    }
    
    langButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const lang = this.getAttribute('data-lang');
            changeLanguage(lang);
        });
    });
});

function changeLanguage(lang) {
    currentLanguage = lang;
    localStorage.setItem('selectedLanguage', lang);
    updateLanguageUI(lang);
    updatePageContent(lang);
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

function updatePageContent(lang) {
    // Эта функция будет обновлять контент страницы
    // В будущем здесь будет загрузка переводов из translations.js
    
    // Пример структуры (пока не реализовано, но готово к добавлению):
    // const elements = document.querySelectorAll('[data-translate]');
    // elements.forEach(el => {
    //     const key = el.getAttribute('data-translate');
    //     if (translations[lang] && translations[lang][key]) {
    //         el.textContent = translations[lang][key];
    //     }
    // });
    
    console.log(`Language changed to: ${lang}`);
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

document.addEventListener('DOMContentLoaded', function() {
    const links = document.querySelectorAll('a[href^="#"]');
    
    links.forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href === '#') return;
            
            const target = document.querySelector(href);
            if (target) {
                e.preventDefault();
                const offsetTop = target.offsetTop - 80; // Учитываем высоту навигации
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
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
            // Don't flip if clicking on back button
            if (e.target.closest('.flip-back-btn')) {
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
// MOBILE CAROUSEL
// ===========================

let currentSlide = 0;
const carouselInner = document.getElementById('carousel-inner');
const dots = document.querySelectorAll('.carousel-dot');

if (carouselInner) {
    let startX = 0;
    let currentX = 0;
    let isDragging = false;

    // Touch events
    carouselInner.addEventListener('touchstart', function(e) {
        startX = e.touches[0].clientX;
        isDragging = true;
    });

    carouselInner.addEventListener('touchmove', function(e) {
        if (!isDragging) return;
        currentX = e.touches[0].clientX;
    });

    carouselInner.addEventListener('touchend', function() {
        if (!isDragging) return;
        isDragging = false;
        
        const diff = startX - currentX;
        
        if (Math.abs(diff) > 50) {
            if (diff > 0 && currentSlide < 2) {
                currentSlide++;
            } else if (diff < 0 && currentSlide > 0) {
                currentSlide--;
            }
            updateCarousel();
        }
    });

    // Dot navigation
    dots.forEach(dot => {
        dot.addEventListener('click', function() {
            currentSlide = parseInt(this.dataset.slide);
            updateCarousel();
        });
    });

    function updateCarousel() {
        carouselInner.style.transform = `translateX(-${currentSlide * 100}%)`;
        
        dots.forEach((dot, index) => {
            if (index === currentSlide) {
                dot.classList.add('active');
            } else {
                dot.classList.remove('active');
            }
        });
    }
}
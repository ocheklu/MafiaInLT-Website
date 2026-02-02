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
    
    if (hash) {
        const cardId = hash.substring(1);
        const card = document.getElementById(cardId);
        
        if (card && card.classList.contains('service-flip-card')) {
            setTimeout(() => {
                card.classList.add('flipped');
                card.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 300);
        }
    }
});

// ===========================
// SCROLL REVEAL ANIMATION
// ===========================

document.addEventListener('DOMContentLoaded', function() {
    const revealElements = document.querySelectorAll('.scroll-reveal');
    
    const revealOnScroll = () => {
        const windowHeight = window.innerHeight;
        
        revealElements.forEach(element => {
            const elementTop = element.getBoundingClientRect().top;
            const revealPoint = 150;
            
            if (elementTop < windowHeight - revealPoint) {
                element.classList.add('visible');
            }
        });
    };
    
    window.addEventListener('scroll', revealOnScroll);
    revealOnScroll(); // Check on load
});

// ===========================
// REVIEW MODAL
// ===========================

document.addEventListener('DOMContentLoaded', function() {
    const modal = document.getElementById('reviewModal');
    const openBtn = document.querySelector('.open-review-modal');
    const closeBtn = document.querySelector('.review-modal-close');
    const overlay = document.querySelector('.review-modal-overlay');
    
    if (openBtn && modal) {
        // Open modal
        openBtn.addEventListener('click', function() {
            modal.classList.add('active');
            setTimeout(() => modal.classList.add('show'), 10);
            document.body.style.overflow = 'hidden';
        });
        
        // Close modal
        function closeModal() {
            modal.classList.remove('show');
            setTimeout(() => {
                modal.classList.remove('active');
                document.body.style.overflow = '';
            }, 300);
        }
        
        closeBtn.addEventListener('click', closeModal);
        overlay.addEventListener('click', closeModal);
        
        // Close on ESC key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && modal.classList.contains('active')) {
                closeModal();
            }
        });
    }
});

// Contact Form Success Modal
document.addEventListener('DOMContentLoaded', function() {
    const form = document.querySelector('.contact-form-card form');
    const modal = document.getElementById('successModal');
    const modalTitle = modal.querySelector('h3');
    const modalText = modal.querySelector('p');
    const closeBtn = document.querySelector('.contact-modal-close');
    
    if (form && modal) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = new FormData(form);
            
            fetch(form.action, {
                method: 'POST',
                body: formData,
                headers: {
                    'Accept': 'application/json'
                }
            })
            .then(response => {
                if (response.ok) {
                    modalTitle.textContent = 'Ačiū!';
                    modalText.textContent = 'Jūsų žinutė išsiųsta. Susisieksime su jumis artimiausiu metu.';
                    modal.classList.add('show');
                    form.reset();
                } else {
                    modalTitle.textContent = 'Klaida';
                    modalText.textContent = 'Bandykite dar kartą.';
                    modal.classList.add('show');
                }
            })
            .catch(error => {
                modalTitle.textContent = 'Klaida';
                modalText.textContent = 'Bandykite dar kartą.';
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
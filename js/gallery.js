// ===========================
// ГАЛЕРЕЯ С LIGHTBOX
// ===========================

document.addEventListener('DOMContentLoaded', function() {
    const galleryItems = document.querySelectorAll('.gallery-item');
    if (galleryItems.length === 0) return;
    
    let currentIndex = 0;
    let images = [];
    
    // Собираем все изображения
    galleryItems.forEach((item, index) => {
        const img = item.querySelector('img');
        if (img) {
            images.push({
                src: img.src,
                alt: img.alt
            });
            
            // Добавляем обработчик клика
            item.addEventListener('click', function() {
                openLightbox(index);
            });
        }
    });
    
    // Создаем lightbox
    const lightbox = createLightbox();
    document.body.appendChild(lightbox);
    
    function createLightbox() {
        const lightbox = document.createElement('div');
        lightbox.className = 'lightbox';
        lightbox.innerHTML = `
            <span class="lightbox-close">&times;</span>
            <span class="lightbox-nav lightbox-prev">&lsaquo;</span>
            <img class="lightbox-content" src="" alt="">
            <span class="lightbox-nav lightbox-next">&rsaquo;</span>
        `;
        
        // Обработчики
        const close = lightbox.querySelector('.lightbox-close');
        const prev = lightbox.querySelector('.lightbox-prev');
        const next = lightbox.querySelector('.lightbox-next');
        
        close.addEventListener('click', closeLightbox);
        prev.addEventListener('click', showPrevious);
        next.addEventListener('click', showNext);
        
        // Закрытие по клику на фон
        lightbox.addEventListener('click', function(e) {
            if (e.target === lightbox) {
                closeLightbox();
            }
        });
        
        // Клавиатурная навигация
        document.addEventListener('keydown', function(e) {
            if (!lightbox.classList.contains('active')) return;
            
            if (e.key === 'Escape') closeLightbox();
            if (e.key === 'ArrowLeft') showPrevious();
            if (e.key === 'ArrowRight') showNext();
        });
        
        return lightbox;
    }
    
    function openLightbox(index) {
        currentIndex = index;
        updateLightboxImage();
        lightbox.classList.add('active');
        document.body.style.overflow = 'hidden'; // Блокируем прокрутку
    }
    
    function closeLightbox() {
        lightbox.classList.remove('active');
        document.body.style.overflow = ''; // Восстанавливаем прокрутку
    }
    
    function showPrevious() {
        currentIndex = (currentIndex - 1 + images.length) % images.length;
        updateLightboxImage();
    }
    
    function showNext() {
        currentIndex = (currentIndex + 1) % images.length;
        updateLightboxImage();
    }
    
    function updateLightboxImage() {
        const img = lightbox.querySelector('.lightbox-content');
        img.src = images[currentIndex].src;
        img.alt = images[currentIndex].alt;
    }
});
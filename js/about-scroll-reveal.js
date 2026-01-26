// About Page - Scroll Reveal Animation
document.addEventListener('DOMContentLoaded', function() {
    const teamRows = document.querySelectorAll('.team-reveal-row');
    const formatCard = document.querySelector('.dark-format-card');
    
    // Intersection Observer options
    const options = {
        root: null,
        rootMargin: '0px',
        threshold: 0.3 // Trigger when 30% visible
    };
    
    // Observer callback
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, options);
    
    // Observe team rows
    teamRows.forEach(row => {
        observer.observe(row);
    });
    
    // Observe format card
    if (formatCard) {
        observer.observe(formatCard);
    }
    
    // Smooth scroll for CTA buttons
    const ctaButtons = document.querySelectorAll('.team-cta-btn');
    ctaButtons.forEach(btn => {
        btn.addEventListener('click', function(e) {
            if (this.getAttribute('href').startsWith('#')) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }
        });
    });
});

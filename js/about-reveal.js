// About Page - Team Reveal
document.addEventListener('DOMContentLoaded', function() {
    const teamCards = document.querySelectorAll('.team-reveal-card');
    const closeButtons = document.querySelectorAll('.close-details');
    
    teamCards.forEach(card => {
        card.addEventListener('click', function() {
            const person = this.getAttribute('data-person');
            const details = document.getElementById(`details-${person}`);
            
            // Close all other details
            document.querySelectorAll('.team-details').forEach(detail => {
                if (detail !== details) {
                    detail.classList.remove('active');
                }
            });
            
            // Toggle current details
            details.classList.toggle('active');
            
            // Smooth scroll to details
            if (details.classList.contains('active')) {
                setTimeout(() => {
                    details.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }, 300);
            }
        });
    });
    
    closeButtons.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const details = this.closest('.team-details');
            details.classList.remove('active');
        });
    });
});

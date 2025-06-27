// Main JavaScript file for TrustTrack

document.addEventListener('DOMContentLoaded', function() {
    // Mobile navigation toggle
    const navToggle = document.querySelector('.nav-toggle');
    const navLinks = document.querySelector('.nav-links');

    if (navToggle && navLinks) {
        navToggle.addEventListener('click', function() {
            navLinks.classList.toggle('open');
            navToggle.classList.toggle('active');
        });
    }

    // Smooth scrolling for anchor links
    const anchorLinks = document.querySelectorAll('a[href^="#"]');
    anchorLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Close mobile menu when clicking outside
    document.addEventListener('click', function(e) {
        if (navLinks && navLinks.classList.contains('open') && 
            !navToggle.contains(e.target) && !navLinks.contains(e.target)) {
            navLinks.classList.remove('open');
            navToggle.classList.remove('active');
        }
    });

    // Close mobile menu when clicking on nav links
    if (navLinks) {
        navLinks.addEventListener('click', function(e) {
            if (e.target.tagName === 'A') {
                navLinks.classList.remove('open');
                navToggle.classList.remove('active');
            }
        });
    }

    // Add scroll effect to navbar
    window.addEventListener('scroll', function() {
        const navbar = document.querySelector('.navbar');
        if (window.scrollY > 50) {
            navbar.style.backgroundColor = 'rgba(255, 255, 255, 0.95)';
            navbar.style.backdropFilter = 'blur(10px)';
        } else {
            navbar.style.backgroundColor = '#fff';
            navbar.style.backdropFilter = 'none';
        }
    });

    // Render 3D review card in hero section
    const heroReview = document.getElementById('heroReview');
    if (heroReview) {
        // Get latest review from localStorage or use fallback
        let review = null;
        const reviews = JSON.parse(localStorage.getItem('trusttrack_reviews') || '[]');
        if (reviews.length > 0) {
            review = reviews[0];
        }
        // Fallback review
        if (!review) {
            review = {
                userName: 'TrustTrack User',
                transportRoute: 'dhaka-chittagong',
                overallRating: 5,
                feedback: 'TrustTrack made my commute safer and more comfortable! Highly recommended.',
                safetyRating: 5,
                hygieneRating: 5
            };
        }
        // Route name mapping
        const routeNames = {
            'dhaka-chittagong': 'Dhaka - Chittagong Highway',
            'mirpur-dhanmondi': 'Mirpur - Dhanmondi Route',
            'uttara-motijheel': 'Uttara - Motijheel Express',
            'gazipur-dhaka': 'Gazipur - Dhaka Route',
            'sylhet-dhaka': 'Sylhet - Dhaka Highway',
            'other': 'Other Route'
        };
        const transportName = routeNames[review.transportRoute] || review.transportRoute || 'Public Transport';
        const rating = review.overallRating || 5;
        const stars = '★'.repeat(Math.floor(rating)) + (rating % 1 !== 0 ? '☆' : '') + '☆'.repeat(5 - Math.ceil(rating));
        const reviewText = review.feedback || 'Great experience with this transport service!';
        heroReview.innerHTML = `
            <div class="hero-card-3d" style="perspective: 800px;">
                <div class="hero-card-inner" style="transform: rotateY(-12deg) rotateX(8deg) scale(1.05); box-shadow: 0 24px 48px rgba(44,90,160,0.18), 0 2px 8px rgba(44,90,160,0.10); background: white; border-radius: 20px; padding: 2rem; max-width: 370px; border: 2px solid rgba(44,90,160,0.12);">
                    <div class="card-header">
                        <div class="user-info" style="width:100%; text-align:center;">
                            <h4>${review.userName || 'Anonymous'}</h4>
                            <span class="transport-name">${transportName}</span>
                        </div>
                    </div>
                    <div class="card-rating" style="text-align:center; font-size:1.3rem; color:#f59e0b; margin-bottom:1rem;">${stars} <span style="font-size:1rem; color:#64748b;">${rating}/5</span></div>
                    <p style="text-align:center; color:#64748b; font-size:1.08rem;">"${reviewText.length > 120 ? reviewText.substring(0, 120) + '...' : reviewText}"</p>
                    <div class="rating-breakdown" style="display:flex; justify-content:center; gap:1.5rem; margin-top:1.2rem;">
                        <div class="rating-item" style="text-align:center;">
                            <span style="font-size:0.9rem; color:#64748b;">Safety</span><br>
                            <span style="color:#f59e0b;">${'★'.repeat(review.safetyRating || rating)}${'☆'.repeat(5 - (review.safetyRating || rating))}</span>
                        </div>
                        <div class="rating-item" style="text-align:center;">
                            <span style="font-size:0.9rem; color:#64748b;">Hygiene</span><br>
                            <span style="color:#f59e0b;">${'★'.repeat(review.hygieneRating || rating)}${'☆'.repeat(5 - (review.hygieneRating || rating))}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
});

// Utility functions
function showLoading(element) {
    element.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
    element.disabled = true;
}

function hideLoading(element, originalText) {
    element.innerHTML = originalText;
    element.disabled = false;
}

function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
        ${message}
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Form validation utilities
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function validatePhone(phone) {
    const re = /^(\+880|880|0)?[1-9]\d{8,9}$/;
    return re.test(phone);
}



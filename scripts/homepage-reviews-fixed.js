// Homepage Firebase Integration for Reviews Carousel

class HomepageReviewsManager {
    constructor() {
        this.currentIndex = 0;
        this.reviews = [];
        this.autoSlideInterval = null;
        this.init();
    }

    init() {
        // Wait for Firebase to be ready
        if (typeof firebase === 'undefined' || !window.db) {
            console.log('Waiting for Firebase to initialize...');
            setTimeout(() => this.init(), 500);
            return;
        }
        console.log('Firebase ready, loading carousel...');
        this.setupEventListeners();
        this.loadReviewsCarousel();
    }

    setupEventListeners() {
        // Listen for review updates from other pages
        window.addEventListener('reviewsUpdated', () => {
            this.loadReviewsCarousel();
        });
        
        // Periodically refresh reviews (every 30 seconds)
        setInterval(() => {
            this.loadReviewsCarousel();
        }, 30000);
        
        // Refresh on window focus (when user comes back to tab)
        window.addEventListener('focus', () => {
            this.loadReviewsCarousel();
        });

        // Setup carousel navigation
        this.setupCarouselNavigation();
    }

    async loadReviewsCarousel() {
        try {
            console.log('Loading real-time reviews from Firebase...');
            
            const reviewsCarousel = document.getElementById('reviewsCarousel');
            if (!reviewsCarousel) {
                console.error('Reviews carousel element not found');
                return;
            }

            // Show loading state
            reviewsCarousel.innerHTML = `
                <div class="carousel-review" style="text-align:center; padding:2rem;">
                    <i class="fas fa-spinner fa-spin" style="font-size:2rem; color:#667eea;"></i>
                    <p style="margin-top:1rem; color:#64748b;">Loading latest reviews...</p>
                </div>
            `;

            // Load reviews directly from Firebase
            if (typeof firebase === 'undefined' || !window.db) {
                console.error('Firebase not available');
                this.loadFallbackCarousel();
                return;
            }

            // Get latest reviews from Firebase
            const snapshot = await window.db.collection('reviews')
                .orderBy('createdAt', 'desc')
                .limit(10)
                .get();

            this.reviews = [];
            
            if (snapshot.empty) {
                console.log('No reviews found, showing welcome message');
                this.reviews.push({
                    id: 'welcome',
                    rating: 5,
                    comment: 'Welcome to TrustTrack! Be the first to share your transport experience and help others make informed travel decisions.',
                    route: 'Getting Started',
                    userEmail: 'TrustTrack Team',
                    createdAt: new Date()
                });
            } else {
                // Convert Firebase documents to review objects
                snapshot.forEach(doc => {
                    const data = doc.data();
                    this.reviews.push({
                        id: doc.id,
                        rating: data.rating || 5,
                        comment: data.comment || 'Great service!',
                        route: data.route || 'Unknown Route',
                        userEmail: data.userEmail || data.userName || 'Anonymous User',
                        createdAt: data.createdAt ? data.createdAt.toDate() : new Date()
                    });
                });
                console.log(`Loaded ${this.reviews.length} reviews from Firebase`);
            }

            // Create carousel with real data
            this.createCarousel();
            this.startAutoSlide();
            
        } catch (error) {
            console.error('Error loading reviews from Firebase:', error);
            this.loadFallbackCarousel();
        }
    }

    createCarousel() {
        const reviewsCarousel = document.getElementById('reviewsCarousel');
        if (!reviewsCarousel || !this.reviews.length) return;

        let html = '';
        this.reviews.forEach((review, index) => {
            const isActive = index === 0 ? 'active' : '';
            html += this.createCarouselReviewElement(review, isActive);
        });

        reviewsCarousel.innerHTML = html;

        // Add navigation controls
        this.addNavigationControls();
    }

    createCarouselReviewElement(review, activeClass = '') {
        const stars = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);
        const date = review.createdAt.toLocaleDateString();
        const userName = review.userEmail.split('@')[0] || 'Anonymous';
        
        return `
            <div class="carousel-review ${activeClass}">
                <div class="review-content">
                    <div class="review-header">
                        <div class="overall-rating">
                            <span class="rating-stars">${stars}</span>
                            <span class="rating-number">${review.rating}/5</span>
                        </div>
                        <div class="review-meta">
                            <div class="reviewer-name">${userName}</div>
                            <div class="transport-name-sober">${review.route}</div>
                            <div class="review-date">${date}</div>
                        </div>
                    </div>
                    <div class="review-feedback">
                        <p>"${review.comment}"</p>
                    </div>
                </div>
            </div>
        `;
    }

    addNavigationControls() {
        const reviewsCarousel = document.getElementById('reviewsCarousel');
        if (!reviewsCarousel || this.reviews.length <= 1) return;

        const navHTML = `
            <div class="carousel-nav">
                <button class="carousel-btn prev-btn" onclick="homepageReviews.previousSlide()">
                    <i class="fas fa-chevron-left"></i>
                </button>
                <button class="carousel-btn next-btn" onclick="homepageReviews.nextSlide()">
                    <i class="fas fa-chevron-right"></i>
                </button>
            </div>
            <div class="carousel-indicators">
                ${this.reviews.map((_, index) => 
                    `<button class="indicator ${index === 0 ? 'active' : ''}" onclick="homepageReviews.goToSlide(${index})"></button>`
                ).join('')}
            </div>
        `;

        reviewsCarousel.insertAdjacentHTML('afterend', navHTML);
    }

    setupCarouselNavigation() {
        // Expose navigation methods globally
        window.homepageReviews = this;
    }

    nextSlide() {
        if (this.reviews.length <= 1) return;
        
        this.currentIndex = (this.currentIndex + 1) % this.reviews.length;
        this.updateCarouselDisplay();
    }

    previousSlide() {
        if (this.reviews.length <= 1) return;
        
        this.currentIndex = this.currentIndex === 0 ? this.reviews.length - 1 : this.currentIndex - 1;
        this.updateCarouselDisplay();
    }

    goToSlide(index) {
        if (index >= 0 && index < this.reviews.length) {
            this.currentIndex = index;
            this.updateCarouselDisplay();
        }
    }

    updateCarouselDisplay() {
        const reviews = document.querySelectorAll('.carousel-review');
        const indicators = document.querySelectorAll('.carousel-indicators .indicator');

        reviews.forEach((review, index) => {
            review.classList.toggle('active', index === this.currentIndex);
        });

        indicators.forEach((indicator, index) => {
            indicator.classList.toggle('active', index === this.currentIndex);
        });
    }

    startAutoSlide() {
        this.stopAutoSlide();
        if (this.reviews.length > 1) {
            this.autoSlideInterval = setInterval(() => {
                this.nextSlide();
            }, 5000); // Change slide every 5 seconds
        }
    }

    stopAutoSlide() {
        if (this.autoSlideInterval) {
            clearInterval(this.autoSlideInterval);
            this.autoSlideInterval = null;
        }
    }

    loadFallbackCarousel() {
        const reviewsCarousel = document.getElementById('reviewsCarousel');
        if (!reviewsCarousel) return;

        console.log('Loading fallback carousel...');
        
        this.reviews = [
            {
                id: 'fallback',
                rating: 5,
                comment: 'Welcome to TrustTrack! Share your transport experiences and help others make better travel decisions.',
                route: 'Getting Started',
                userEmail: 'TrustTrack Team',
                createdAt: new Date()
            }
        ];

        this.createCarousel();
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing Homepage Reviews Manager...');
    window.homepageReviewsManager = new HomepageReviewsManager();
});

// Fallback initialization
if (document.readyState !== 'loading') {
    console.log('Document already loaded, initializing Homepage Reviews Manager immediately');
    window.homepageReviewsManager = new HomepageReviewsManager();
}

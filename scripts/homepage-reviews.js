// Homepage Firebase Integration for Reviews Carousel

class HomepageReviewsManager {
    constructor() {
        this.currentIndex = 0;
        this.reviews = [];
        this.autoSlideInterval = null;
        this.init();
    }

    init() {
        // First load the fallback immediately to ensure something shows
        console.log('Loading immediate fallback for testing...');
        this.loadFallbackCarousel();
        
        // Wait for Firebase to be ready
        if (typeof firebase === 'undefined' || !window.db) {
            console.log('Waiting for Firebase to initialize...');
            setTimeout(() => this.init(), 1000);
            return;
        }
        console.log('Firebase ready, loading real reviews...');
        this.setupEventListeners();
        // Add a small delay to ensure DOM is ready
        setTimeout(() => {
            this.loadReviewsCarousel();
        }, 500);
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
            console.log('Setting up real-time reviews listener for carousel...');
            
            const reviewsCarousel = document.getElementById('reviewsCarousel');
            if (!reviewsCarousel) {
                console.error('Reviews carousel element not found');
                return;
            }

            // Show loading state
            reviewsCarousel.innerHTML = `
                <div class="carousel-review active" style="text-align:center; padding:2rem; display:flex; position:relative; left:auto; top:auto; transform:none;">
                    <div style="margin:auto;">
                        <i class="fas fa-spinner fa-spin" style="font-size:2rem; color:#667eea;"></i>
                        <p style="margin-top:1rem; color:#64748b;">Loading latest reviews...</p>
                    </div>
                </div>
            `;

            // Load reviews directly from Firebase with real-time listener
            if (typeof firebase === 'undefined' || !window.db) {
                console.error('Firebase not available');
                this.loadFallbackCarousel();
                return;
            }

            // Set up real-time listener
            if (this.reviewsListener) {
                this.reviewsListener(); // Unsubscribe previous listener
            }

            this.reviewsListener = window.db.collection('reviews')
                .orderBy('createdAt', 'desc')
                .limit(10)
                .onSnapshot((snapshot) => {
                    console.log('Real-time homepage reviews update received', snapshot.size, 'reviews');
                    this.reviews = [];
                    
                    if (snapshot.empty) {
                        console.log('No reviews found, showing welcome message');
                        this.reviews.push({
                            id: 'welcome',
                            rating: 5,
                            comment: 'Welcome to TrustTrack! Be the first to share your transport experience and help others make informed travel decisions.',
                            route: 'Getting Started',
                            userEmail: 'team@trusttrack.com',
                            createdAt: new Date()
                        });
                    } else {
                        // Convert Firebase documents to review objects
                        snapshot.forEach(doc => {
                            const data = doc.data();
                            console.log('Processing review:', doc.id, data);
                            this.reviews.push({
                                id: doc.id,
                                rating: data.rating || 5,
                                comment: data.comment || 'Great service!',
                                route: data.route || 'Unknown Route',
                                userEmail: data.userEmail || data.userName || 'Anonymous User',
                                createdAt: data.createdAt ? data.createdAt.toDate() : new Date()
                            });
                        });
                        console.log(`Real-time loaded ${this.reviews.length} reviews from Firebase`);
                    }

                    // Create carousel with real-time data
                    this.currentIndex = 0; // Reset to first slide
                    this.createCarousel();
                    this.startAutoSlide();
                    
                }, (error) => {
                    console.error('Error setting up real-time listener for homepage:', error);
                    this.loadFallbackCarousel();
                });
            
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

        // Add navigation controls to the carousel container
        this.addNavigationControls();
        
        // Initialize carousel display
        this.updateCarouselDisplay();
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
        const carouselContainer = document.querySelector('.carousel-container');
        if (!carouselContainer || this.reviews.length <= 1) return;

        // Remove existing navigation controls if any
        const existingNav = carouselContainer.querySelector('.carousel-nav');
        const existingIndicators = carouselContainer.querySelector('.carousel-indicators');
        if (existingNav) existingNav.remove();
        if (existingIndicators) existingIndicators.remove();

        // Add navigation buttons
        const navHTML = `
            <div class="carousel-nav">
                <button class="carousel-btn prev-btn" onclick="window.homepageReviewsManager.previousSlide()">
                    <i class="fas fa-chevron-left"></i>
                </button>
                <button class="carousel-btn next-btn" onclick="window.homepageReviewsManager.nextSlide()">
                    <i class="fas fa-chevron-right"></i>
                </button>
            </div>
        `;

        // Add indicators
        const indicatorsHTML = `
            <div class="carousel-indicators">
                ${this.reviews.map((_, index) => 
                    `<button class="indicator ${index === this.currentIndex ? 'active' : ''}" onclick="window.homepageReviewsManager.goToSlide(${index})"></button>`
                ).join('')}
            </div>
        `;

        carouselContainer.insertAdjacentHTML('beforeend', navHTML);
        carouselContainer.insertAdjacentHTML('beforeend', indicatorsHTML);
    }

    setupCarouselNavigation() {
        // Make sure the navigation methods are available globally
        window.homepageReviews = this;
        window.homepageReviewsManager = this;
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

        console.log('Loading fallback carousel with sample data...');
        
        this.reviews = [
            {
                id: 'sample1',
                rating: 5,
                comment: 'Excellent service! The bus was on time and the driver was very professional. Clean and comfortable ride.',
                route: 'Dhaka to Chittagong',
                userEmail: 'user1@example.com',
                createdAt: new Date(Date.now() - 86400000) // 1 day ago
            },
            {
                id: 'sample2',
                rating: 4,
                comment: 'Good experience overall. The journey was smooth but could use better air conditioning.',
                route: 'Dhaka to Sylhet',
                userEmail: 'traveler2@example.com',
                createdAt: new Date(Date.now() - 172800000) // 2 days ago
            },
            {
                id: 'sample3',
                rating: 5,
                comment: 'Amazing service! Punctual, clean, and comfortable. Will definitely use again.',
                route: 'Dhaka to Cox\'s Bazar',
                userEmail: 'reviewer3@example.com',
                createdAt: new Date(Date.now() - 259200000) // 3 days ago
            },
            {
                id: 'welcome',
                rating: 5,
                comment: 'Welcome to TrustTrack! Share your transport experiences and help others make better travel decisions.',
                route: 'Getting Started',
                userEmail: 'team@trusttrack.com',
                createdAt: new Date()
            }
        ];

        this.currentIndex = 0;
        this.createCarousel();
        this.startAutoSlide();
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

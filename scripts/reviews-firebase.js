// Reviews Page JavaScript with Firebase Integration

class ReviewsManager {
    constructor() {
        this.currentUser = null;
        this.userRole = 'user';
        this.ratings = {
            safety: 0,
            comfort: 0,
            hygiene: 0,
            punctuality: 0
        };
        this.init();
    }

    init() {
        // Wait for Firebase to be ready
        if (typeof firebase === 'undefined') {
            setTimeout(() => this.init(), 100);
            return;
        }
        
        this.initAuthObserver();
        this.initializeStarRatings();
        this.initializeFileUpload();
        this.initializeFormSubmission();
        this.loadRecentReviews();
    }

    initAuthObserver() {
        window.FirebaseAuth.onAuthStateChanged(async (user) => {
            this.currentUser = user;
            if (user) {
                // Fetch user role from Firestore
                const userDoc = await firebase.firestore().collection('users').doc(user.uid).get();
                if (userDoc.exists && userDoc.data().role === 'admin') {
                    this.userRole = 'admin';
                } else {
                    this.userRole = 'user';
                }
            } else {
                this.userRole = 'user';
            }
            this.updateFormVisibility();
            this.loadRecentReviews();
        });
    }

    updateFormVisibility() {
        const form = document.getElementById('reviewForm');
        const loginPrompt = document.getElementById('loginPrompt');
        
        if (this.currentUser) {
            if (form) form.style.display = 'block';
            if (loginPrompt) loginPrompt.style.display = 'none';
            
            // Pre-fill user name
            const userNameField = document.getElementById('userName');
            if (userNameField && this.currentUser.displayName) {
                userNameField.value = this.currentUser.displayName;
            }
        } else {
            if (form) form.style.display = 'none';
            if (!loginPrompt) {
                this.createLoginPrompt();
            }
        }
    }

    createLoginPrompt() {
        const container = document.querySelector('.review-form-container');
        if (container) {
            const prompt = document.createElement('div');
            prompt.id = 'loginPrompt';
            prompt.className = 'login-prompt';
            prompt.innerHTML = `
                <div class="prompt-content">
                    <i class="fas fa-sign-in-alt"></i>
                    <h3>Login Required</h3>
                    <p>Please login to submit a review</p>
                    <button onclick="window.location.href='/pages/login.html'" class="login-btn">
                        <i class="fas fa-sign-in-alt"></i> Login
                    </button>
                </div>
            `;
            container.insertBefore(prompt, container.firstChild);
        }
    }

    initializeStarRatings() {
        const starRatings = document.querySelectorAll('.star-rating');
        
        starRatings.forEach(rating => {
            const stars = rating.querySelectorAll('i');
            const ratingType = rating.dataset.rating;
            const ratingText = rating.parentElement.querySelector('.rating-text');
            
            stars.forEach((star, index) => {
                star.addEventListener('click', () => {
                    const value = parseInt(star.dataset.value);
                    this.updateRating(rating, value, ratingText, ratingType);
                });
                
                star.addEventListener('mouseenter', () => {
                    this.highlightStars(rating, parseInt(star.dataset.value));
                });
            });
            
            rating.addEventListener('mouseleave', () => {
                const currentRating = parseInt(rating.dataset.currentRating) || 0;
                this.highlightStars(rating, currentRating);
            });
        });
    }

    updateRating(ratingElement, value, textElement, ratingType) {
        ratingElement.dataset.currentRating = value;
        this.ratings[ratingType] = value;
        this.highlightStars(ratingElement, value);
        
        const ratingTexts = {
            1: 'Poor',
            2: 'Fair', 
            3: 'Good',
            4: 'Very Good',
            5: 'Excellent'
        };
        
        textElement.textContent = ratingTexts[value];
    }

    highlightStars(ratingElement, count) {
        const stars = ratingElement.querySelectorAll('i');
        stars.forEach((star, index) => {
            if (index < count) {
                star.classList.add('active');
            } else {
                star.classList.remove('active');
            }
        });
    }

    initializeFileUpload() {
        const fileInput = document.getElementById('photo');
        const filePreview = document.getElementById('filePreview');
        
        if (fileInput) {
            fileInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        filePreview.innerHTML = `
                            <img src="${e.target.result}" alt="Preview" style="max-width: 200px; max-height: 200px; border-radius: 8px;">
                            <button type="button" onclick="this.parentElement.innerHTML=''; document.getElementById('photo').value='';" class="remove-photo">
                                <i class="fas fa-times"></i> Remove
                            </button>
                        `;
                    };
                    reader.readAsDataURL(file);
                }
            });
        }
    }

    initializeFormSubmission() {
        const form = document.getElementById('reviewForm');
        if (form) {
            form.addEventListener('submit', (e) => this.handleFormSubmission(e));
        }
    }

    async handleFormSubmission(e) {
        e.preventDefault();
        
        if (!this.currentUser) {
            alert('Please login to submit a review');
            return;
        }

        const formData = new FormData(e.target);
        const submitBtn = e.target.querySelector('.submit-btn');
        
        // Show loading state
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';

        try {
            // Validate ratings
            const hasRatings = Object.values(this.ratings).some(rating => rating > 0);
            if (!hasRatings) {
                throw new Error('Please provide at least one rating');
            }

            // Prepare review data
            const reviewData = {
                userId: this.currentUser.uid,
                userEmail: this.currentUser.email,
                userName: formData.get('userName') || this.currentUser.displayName || 'Anonymous',
                routeName: formData.get('route') || 'Public Transport',
                vehicleType: formData.get('vehicleType'),
                fromLocation: formData.get('from'),
                toLocation: formData.get('to'),
                travelDate: formData.get('date'),
                ratings: { ...this.ratings },
                overallRating: this.calculateOverallRating(),
                feedback: formData.get('feedback') || '',
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                isVerified: false,
                helpfulVotes: 0
            };

            // Handle photo upload if present
            const photoFile = formData.get('photo');
            if (photoFile && photoFile.size > 0) {
                // For now, we'll skip photo upload and just note that there was one
                reviewData.hasPhoto = true;
            }

            // Save to Firestore
            await firebase.firestore().collection('reviews').add(reviewData);

            // Update user's review count
            await this.updateUserReviewCount();

            // Show success message
            this.showSuccessMessage('Review submitted successfully!');
            
            // Reset form
            this.resetForm(e.target);
            
            // Reload reviews
            setTimeout(() => {
                this.loadRecentReviews();
            }, 1000);

        } catch (error) {
            console.error('Error submitting review:', error);
            this.showErrorMessage(error.message || 'Failed to submit review. Please try again.');
        } finally {
            // Reset button
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Submit Review';
        }
    }

    calculateOverallRating() {
        const ratings = Object.values(this.ratings).filter(r => r > 0);
        if (ratings.length === 0) return 0;
        return Math.round(ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length);
    }

    async updateUserReviewCount() {
        try {
            const userDoc = firebase.firestore().collection('users').doc(this.currentUser.uid);
            await userDoc.update({
                reviewsCount: firebase.firestore.FieldValue.increment(1)
            });
        } catch (error) {
            console.error('Error updating user review count:', error);
        }
    }

    resetForm(form) {
        form.reset();
        this.ratings = { safety: 0, comfort: 0, hygiene: 0, punctuality: 0 };
        
        // Reset star ratings
        const starRatings = document.querySelectorAll('.star-rating');
        starRatings.forEach(rating => {
            rating.dataset.currentRating = '0';
            this.highlightStars(rating, 0);
            const ratingText = rating.parentElement.querySelector('.rating-text');
            if (ratingText) {
                ratingText.textContent = 'Not rated';
            }
        });

        // Clear file preview
        const filePreview = document.getElementById('filePreview');
        if (filePreview) {
            filePreview.innerHTML = '';
        }
    }

    async loadRecentReviews() {
        try {
            const reviewsSnapshot = await firebase.firestore()
                .collection('reviews')
                .orderBy('createdAt', 'desc')
                .limit(10)
                .get();

            const reviewsContainer = document.getElementById('recentReviews');
            if (!reviewsContainer) return;

            if (reviewsSnapshot.empty) {
                reviewsContainer.innerHTML = `
                    <div class="no-reviews">
                        <i class="fas fa-star"></i>
                        <h3>No reviews yet</h3>
                        <p>Be the first to share your transport experience!</p>
                    </div>
                `;
                return;
            }

            reviewsContainer.innerHTML = '';
            
            reviewsSnapshot.docs.forEach(doc => {
                const review = doc.data();
                const reviewElement = this.createReviewElement(review);
                reviewsContainer.appendChild(reviewElement);
            });

        } catch (error) {
            console.error('Error loading reviews:', error);
        }
    }

    createReviewElement(review) {
        const reviewDiv = document.createElement('div');
        reviewDiv.className = 'review-item';
        
        const stars = '★'.repeat(review.overallRating) + '☆'.repeat(5 - review.overallRating);
        const date = review.createdAt ? new Date(review.createdAt.toDate()).toLocaleDateString() : 'Recently';
        
        reviewDiv.innerHTML = `
            <div class="review-header">
                <div class="reviewer-info">
                    <strong>${review.userName}</strong>
                    <span class="review-route">${review.routeName}</span>
                </div>
                <div class="review-rating">
                    <span class="stars">${stars}</span>
                    <span class="rating-number">${review.overallRating}/5</span>
                </div>
            </div>
            <div class="review-content">
                <div class="route-info">
                    <span><i class="fas fa-map-marker-alt"></i> ${review.fromLocation} → ${review.toLocation}</span>
                    <span><i class="fas fa-calendar"></i> ${date}</span>
                </div>
                ${review.feedback ? `<p class="review-text">${review.feedback}</p>` : ''}
                <div class="review-details">
                    <span>Safety: ${review.ratings.safety}/5</span>
                    <span>Comfort: ${review.ratings.comfort}/5</span>
                    <span>Hygiene: ${review.ratings.hygiene}/5</span>
                    <span>Punctuality: ${review.ratings.punctuality}/5</span>
                </div>
            </div>
        `;
        
        // Add delete button if admin or review owner
        if (this.currentUser && (this.userRole === 'admin' || review.userId === this.currentUser.uid)) {
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-review-btn';
            deleteBtn.innerHTML = '<i class="fas fa-trash-alt"></i> Delete';
            deleteBtn.onclick = async () => {
                if (confirm('Are you sure you want to delete this review?')) {
                    try {
                        await firebase.firestore().collection('reviews').doc(review.id).delete();
                        this.showSuccessMessage('Review deleted successfully!');
                        this.loadRecentReviews();
                    } catch (error) {
                        this.showErrorMessage('Failed to delete review.');
                    }
                }
            };
            reviewDiv.appendChild(deleteBtn);
        }
        
        return reviewDiv;
    }

    showSuccessMessage(message) {
        this.showMessage(message, 'success');
    }

    showErrorMessage(message) {
        this.showMessage(message, 'error');
    }

    showMessage(message, type) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message-popup ${type}`;
        messageDiv.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
            <span>${message}</span>
        `;
        
        document.body.appendChild(messageDiv);
        
        setTimeout(() => {
            messageDiv.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            messageDiv.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(messageDiv);
            }, 300);
        }, 3000);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ReviewsManager();
});

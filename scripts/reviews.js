// Reviews Page JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Initialize Firebase Auth observer first
    initializeAuthObserver();
    
    // Initialize basic functionality immediately
    initializeStarRatings();
    initializeFileUpload();
    initializeFormSubmission();
    // Temporarily disable cleanup to debug review deletion issue
    // cleanupOldReviews();
    
    // Wait for Firebase auth to be ready before loading reviews
    // This ensures delete buttons show up properly
    function waitForAuth() {
        if (typeof window.FirebaseAuth !== 'undefined') {
            loadRecentReviews();
        } else {
            setTimeout(waitForAuth, 100);
        }
    }
    waitForAuth();
});

// Firebase Auth Observer
function initializeAuthObserver() {
    // Wait for Firebase to be ready
    function waitForFirebase() {
        if (typeof firebase !== 'undefined' && firebase.auth) {
            firebase.auth().onAuthStateChanged((user) => {
                updateAuthUI(user);
                
                // Show/hide form based on auth status
                const reviewForm = document.getElementById('reviewForm');
                const loginPrompt = document.getElementById('loginPrompt');
                
                if (user) {
                    if (reviewForm) reviewForm.style.display = 'block';
                    if (loginPrompt) loginPrompt.style.display = 'none';
                } else {
                    if (reviewForm) reviewForm.style.display = 'none';
                    if (loginPrompt) loginPrompt.style.display = 'block';
                }
            });
            
            // Add logout functionality
            const logoutBtn = document.getElementById('logoutBtn');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', async (e) => {
                    e.preventDefault();
                    try {
                        await firebase.auth().signOut();
                        window.location.href = '/index.html';
                    } catch (error) {
                        console.error('Logout error:', error);
                    }
                });
            }
            
            // Add login/signup button functionality
            const loginBtn = document.getElementById('loginBtn');
            const signupBtn = document.getElementById('signupBtn');
            
            if (loginBtn) {
                loginBtn.addEventListener('click', () => {
                    window.location.href = '/pages/login.html';
                });
            }            
            if (signupBtn) {
                signupBtn.addEventListener('click', () => {
                    window.location.href = '/pages/signup.html';
                });
            }
            
            // Add auth state change listener to refresh reviews when user logs in/out
            firebase.auth().onAuthStateChanged((user) => {
                // Small delay to ensure UI is updated
                setTimeout(() => {
                    loadRecentReviews();
                }, 500);
            });
        } else {
            setTimeout(waitForFirebase, 100);
        }
    }
    waitForFirebase();
}

function updateAuthUI(user) {
    const authButtons = document.getElementById('authButtons');
    const dashboardLink = document.getElementById('dashboardLink');
    
    if (user) {
        // User is logged in - hide auth buttons, show dashboard link
        if (authButtons) authButtons.style.display = 'none';
        if (dashboardLink) dashboardLink.style.display = 'inline';
        
    } else {
        // User is not logged in - show auth buttons, hide dashboard link
        if (authButtons) authButtons.style.display = 'flex';
        if (dashboardLink) dashboardLink.style.display = 'none';
    }
}

// Star rating system
function initializeStarRatings() {
    const starRatings = document.querySelectorAll('.star-rating');
    
    starRatings.forEach(rating => {
        const stars = rating.querySelectorAll('i');
        const ratingType = rating.dataset.rating;
        const ratingText = rating.parentElement.querySelector('.rating-text');
        
        stars.forEach((star, index) => {
            star.addEventListener('click', function() {
                const value = parseInt(this.dataset.value);
                updateRating(rating, value, ratingText);
            });
            
            star.addEventListener('mouseenter', function() {
                highlightStars(rating, parseInt(this.dataset.value));
            });
        });
        
        rating.addEventListener('mouseleave', function() {
            const currentRating = parseInt(this.dataset.currentRating) || 0;
            highlightStars(this, currentRating);
        });
    });
}

function updateRating(ratingElement, value, textElement) {
    ratingElement.dataset.currentRating = value;
    highlightStars(ratingElement, value);
    
    const ratingTexts = {
        1: 'Poor',
        2: 'Fair',
        3: 'Good',
        4: 'Very Good',
        5: 'Excellent'
    };
    
    textElement.textContent = ratingTexts[value];
}

function highlightStars(ratingElement, value) {
    const stars = ratingElement.querySelectorAll('i');
    stars.forEach((star, index) => {
        if (index < value) {
            star.classList.add('active');
        } else {
            star.classList.remove('active');
        }
    });
}

// File upload functionality
function initializeFileUpload() {
    const fileInput = document.getElementById('photo');
    const fileLabel = document.querySelector('.file-upload-label span');
    const filePreview = document.getElementById('filePreview');
    
    fileInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            if (file.type.startsWith('image/')) {
                fileLabel.textContent = file.name;
                
                const reader = new FileReader();
                reader.onload = function(e) {
                    filePreview.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
                };
                reader.readAsDataURL(file);
            } else {
                alert('Please select an image file.');
                fileInput.value = '';
                fileLabel.textContent = 'Choose Photo';
                filePreview.innerHTML = '';
            }
        }
    });
}

// Form submission
function initializeFormSubmission() {
    const form = document.getElementById('reviewForm');
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        if (validateForm()) {
            submitReview();
        }
    });
}

function validateForm() {
    const transportRoute = document.getElementById('transportRoute').value;
    
    if (!transportRoute) {
        showNotification('Please select a transport route.', 'error');
        return false;
    }
    
    // Check if at least one rating is provided
    const ratings = document.querySelectorAll('.star-rating');
    let hasRating = false;
    
    ratings.forEach(rating => {
        if (rating.dataset.currentRating) {
            hasRating = true;
        }
    });
    
    if (!hasRating) {
        showNotification('Please provide at least one rating.', 'error');
        return false;
    }
    
    return true;
}

function submitReview() {
    // Check if user is authenticated
    const currentUser = firebase.auth().currentUser;
    if (!currentUser) {
        showNotification('❌ You must be logged in to submit a review', 'error');
        window.location.href = '/pages/login.html';
        return;
    }

    const submitBtn = document.querySelector('.submit-btn');
    const originalText = submitBtn.innerHTML;
    
    // Show loading state
    showLoading(submitBtn);
    
    // Collect form data
    const formData = collectFormData();
    
    // Simulate API call
    setTimeout(() => {
        // Save to localStorage for demo purposes
        saveReview(formData);
        
        hideLoading(submitBtn, originalText);
        showNotification('🎉 Review submitted successfully! Thank you for helping fellow travelers!', 'success');
        
        // Reset form
        resetForm();
        
        // Reload recent reviews
        loadRecentReviews();
    }, 2000);
}

function collectFormData() {
    const currentUser = firebase.auth().currentUser;
    if (!currentUser) {
        throw new Error('User not authenticated');
    }

    const ratings = {};
    document.querySelectorAll('.star-rating').forEach(rating => {
        const type = rating.dataset.rating;
        const value = parseInt(rating.dataset.currentRating) || 0;
        ratings[type] = value;
    });
    
    return {
        id: Date.now(),
        transportRoute: document.getElementById('transportRoute').value,
        ratings: ratings,
        feedback: document.getElementById('feedback').value,
        userName: currentUser.displayName || currentUser.email.split('@')[0],
        userEmail: currentUser.email,
        userId: currentUser.uid,
        timestamp: new Date().toISOString(),
        overallRating: calculateOverallRating(ratings)
    };
}

function calculateOverallRating(ratings) {
    const values = Object.values(ratings).filter(val => val > 0);
    if (values.length === 0) return 0;
    return (values.reduce((sum, val) => sum + val, 0) / values.length).toFixed(1);
}

function saveReview(reviewData) {
    try {
        // User information is already included in reviewData from collectFormData
        reviewData.id = Date.now().toString(); // Simple ID generation
        
        let reviews = JSON.parse(localStorage.getItem('trusttrack_reviews') || '[]');
        console.log('Before saving - existing reviews:', reviews.length);
        
        reviews.unshift(reviewData);
        
        // Keep only the latest 100 reviews (increased from 50)
        reviews = reviews.slice(0, 100);
        
        localStorage.setItem('trusttrack_reviews', JSON.stringify(reviews));
        console.log('After saving - total reviews:', reviews.length);
        
        // Trigger homepage update
        updateHomepageCarousel();
    } catch (error) {
        console.error('Error saving review:', error);
        showNotification('Failed to save review. Please try again.', 'error');
    }
}

function resetForm() {
    document.getElementById('reviewForm').reset();
    
    // Reset star ratings
    document.querySelectorAll('.star-rating').forEach(rating => {
        delete rating.dataset.currentRating;
        rating.querySelectorAll('i').forEach(star => {
            star.classList.remove('active');
        });
    });
    
    // Reset rating texts
    document.querySelectorAll('.rating-text').forEach(text => {
        text.textContent = 'Not rated';
    });
    
    // Reset file upload
    document.querySelector('.file-upload-label span').textContent = 'Choose Photo';
    document.getElementById('filePreview').innerHTML = '';
}

// Load and display recent reviews
function loadRecentReviews() {
    const reviews = JSON.parse(localStorage.getItem('trusttrack_reviews') || '[]');
    console.log('Loading recent reviews - count:', reviews.length);
    
    const container = document.getElementById('recentReviews');
    
    if (reviews.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; color: #666; padding: 3rem;">
                <i class="fas fa-comments" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                <p>No reviews yet. Be the first to share your experience!</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = reviews.slice(0, 6).map(review => createReviewHTML(review)).join('');
}

function createReviewHTML(review) {
    const routeNames = {
        'dhaka-chittagong': 'Dhaka - Chittagong Highway',
        'mirpur-dhanmondi': 'Mirpur - Dhanmondi Route',
        'uttara-motijheel': 'Uttara - Motijheel Express',
        'gazipur-dhaka': 'Gazipur - Dhaka Route',
        'sylhet-dhaka': 'Sylhet - Dhaka Highway',
        'other': 'Other Route'
    };
    const timeAgo = getTimeAgo(review.timestamp);
    const stars = generateStars(review.overallRating);

    // Check toggle settings
    const showUsernames = document.getElementById('showUsernames')?.checked !== false;
    const showDeleteButtons = document.getElementById('showDeleteButtons')?.checked !== false;    // Check if current user can delete this review
    const currentUser = window.FirebaseAuth?.getCurrentUser() || 
                      (typeof firebase !== 'undefined' && firebase.auth?.().currentUser);
      // More robust user matching - check both uid and email
    const canDelete = currentUser && (
        (review.userId && currentUser.uid === review.userId) ||
        (review.userEmail && currentUser.email === review.userEmail) ||
        (review.userId === currentUser.uid) ||
        (review.userEmail === currentUser.email)
    );

    // Debug logging for delete button visibility
    if (currentUser && review.userId) {
        console.log(`Delete check - Review: ${review.id}, User: ${currentUser.email}, Review Owner: ${review.userEmail}, Can Delete: ${canDelete}`);
    }
    
    const deleteButton = (canDelete && showDeleteButtons) ?
        `<button class="delete-review-btn" onclick="deleteReview('${review.id}')" title="Delete Review">
            <i class="fas fa-trash-alt"></i>
        </button>` : '';

    // Username display logic
    const usernameDisplay = showUsernames ? 
        `<span><i class="fas fa-user"></i> ${review.userName}</span>` : '';
    
    return `
        <div class="review-item" data-review-id="${review.id}">
            <div class="review-item-header">
                <h3>${routeNames[review.transportRoute] || review.transportRoute}</h3>
                <div class="review-actions">
                    <div class="overall-rating">
                        ${stars}
                    </div>
                    ${deleteButton}
                </div>
            </div>
            <div class="review-feedback">"${review.feedback}"</div>
            <div class="review-meta">
                ${usernameDisplay}
                <span><i class="fas fa-clock"></i> ${timeAgo}</span>
                ${review.userId !== 'anonymous' ? '<span class="verified-user"><i class="fas fa-check-circle"></i> Verified</span>' : ''}
            </div>
        </div>
    `;
}

function generateStars(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    let stars = '';
    
    for (let i = 0; i < fullStars; i++) {
        stars += '<i class="fas fa-star"></i>';
    }
    
    if (hasHalfStar) {
        stars += '<i class="fas fa-star-half-alt"></i>';
    }
    
    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
        stars += '<i class="far fa-star"></i>';
    }
    
    return stars;
}

function getTimeAgo(timestamp) {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now - time) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
}

// Delete review function (only works for review owner)
function deleteReview(reviewId) {
    const currentUser = window.FirebaseAuth?.getCurrentUser();
    if (!currentUser) {
        showNotification('You must be logged in to delete reviews.', 'error');
        return;
    }
    
    let reviews = JSON.parse(localStorage.getItem('trusttrack_reviews') || '[]');
    const reviewIndex = reviews.findIndex(review => review.id === reviewId);
    
    if (reviewIndex === -1) {
        showNotification('Review not found.', 'error');
        return;
    }
    
    const review = reviews[reviewIndex];
    
    // Check if user owns this review
    if (review.userId !== currentUser.uid && review.userEmail !== currentUser.email) {
        showNotification('You can only delete your own reviews.', 'error');
        return;
    }
    
    // Show custom confirmation dialog
    showDeleteConfirmation(reviewId, () => {
        reviews.splice(reviewIndex, 1);
        localStorage.setItem('trusttrack_reviews', JSON.stringify(reviews));
        
        // Remove from DOM
        const reviewElement = document.querySelector(`[data-review-id="${reviewId}"]`);
        if (reviewElement) {
            reviewElement.style.transition = 'all 0.3s ease';
            reviewElement.style.opacity = '0';
            reviewElement.style.transform = 'translateX(-20px)';
            setTimeout(() => {
                reviewElement.remove();
            }, 300);
        }
        
        // Update homepage carousel
        updateHomepageCarousel();
        
        // Reload reviews display
        setTimeout(() => {
            loadRecentReviews();
        }, 300);
        
        showNotification('Review deleted successfully.', 'success');
    });
}

// Custom delete confirmation dialog
function showDeleteConfirmation(reviewId, onConfirm) {
    const modal = document.createElement('div');
    modal.className = 'delete-confirmation';
    modal.innerHTML = `
        <div class="delete-confirmation-content">
            <h3><i class="fas fa-exclamation-triangle"></i> Delete Review</h3>
            <p>Are you sure you want to delete this review? This action cannot be undone.</p>
            <div class="delete-confirmation-actions">
                <button class="cancel-delete-btn" onclick="this.closest('.delete-confirmation').remove()">
                    Cancel
                </button>
                <button class="confirm-delete-btn" onclick="confirmDelete('${reviewId}')">
                    Delete Review
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Store callback function
    window.deleteCallback = onConfirm;
    
    // Close on background click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

function confirmDelete(reviewId) {
    const modal = document.querySelector('.delete-confirmation');
    if (modal) {
        modal.remove();
    }
    
    if (window.deleteCallback) {
        window.deleteCallback();
        window.deleteCallback = null;
    }
}

// Enhanced corner notification system
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    
    // Enhanced HTML with better styling
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas ${type === 'success' ? 'fa-check-circle' : 
                          type === 'error' ? 'fa-exclamation-circle' : 
                          'fa-info-circle'}"></i>
            <span>${message}</span>
            <button class="notification-close" onclick="this.parentElement.parentElement.style.transform='translateX(100%)'">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    // Enhanced corner notification styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#28a745' : 
                      type === 'error' ? '#dc3545' : '#17a2b8'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 12px;
        box-shadow: 0 8px 25px rgba(0,0,0,0.2);
        z-index: 10001;
        transform: translateX(100%);
        transition: all 0.3s ease;
        max-width: 350px;
        min-width: 300px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255,255,255,0.1);
    `;
    
    // Style the content
    const content = notification.querySelector('.notification-content');
    content.style.cssText = `
        display: flex;
        align-items: center;
        gap: 10px;
    `;
    
    // Style the icon
    const icon = notification.querySelector('i:first-child');
    icon.style.cssText = `
        font-size: 18px;
        flex-shrink: 0;
    `;
    
    // Style the message
    const messageSpan = notification.querySelector('span');
    messageSpan.style.cssText = `
        flex: 1;
        line-height: 1.4;
    `;
    
    // Style the close button
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.style.cssText = `
        background: none;
        border: none;
        color: rgba(255,255,255,0.8);
        cursor: pointer;
        padding: 4px;
        border-radius: 4px;
        transition: background 0.2s ease;
        flex-shrink: 0;
    `;
    
    closeBtn.addEventListener('mouseenter', () => {
        closeBtn.style.background = 'rgba(255,255,255,0.1)';
    });
    
    closeBtn.addEventListener('mouseleave', () => {
        closeBtn.style.background = 'none';
    });
    
    closeBtn.addEventListener('click', () => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 300);
    });
    
    document.body.appendChild(notification);
    
    // Slide in animation
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Auto remove after 4 seconds (increased from 3 for better visibility)
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        }
    }, 4000);
}

// Update homepage carousel with latest reviews
function updateHomepageCarousel() {
    // Try to update the homepage carousel if it exists (for cross-page updates)
    if (typeof window.updateHomeReviews === 'function') {
        window.updateHomeReviews();
    }
    
    // Also trigger a custom event for other pages to listen to
    window.dispatchEvent(new CustomEvent('reviewsUpdated'));
    
    // Force trigger storage event for cross-tab updates
    if (typeof window.localStorage !== 'undefined') {
        // Trigger storage event by setting a dummy value
        const timestamp = Date.now().toString();
        localStorage.setItem('trusttrack_reviews_updated', timestamp);
        
        // Clean up the dummy value
        setTimeout(() => {
            localStorage.removeItem('trusttrack_reviews_updated');
        }, 100);
    }
    
    console.log('Homepage carousel update triggered');
}

// Clean up old reviews (remove reviews older than 6 months)
function cleanupOldReviews() {
    const sixMonthsAgo = Date.now() - (6 * 30 * 24 * 60 * 60 * 1000); // 6 months in milliseconds
    let reviews = JSON.parse(localStorage.getItem('trusttrack_reviews') || '[]');
    
    console.log('Before cleanup - Review count:', reviews.length);
    
    const originalCount = reviews.length;
    // Fix: Convert ISO string timestamp to Date for proper comparison
    reviews = reviews.filter(review => {
        const reviewDate = review.timestamp ? new Date(review.timestamp).getTime() : Date.now();
        return reviewDate > sixMonthsAgo;
    });
    
    console.log('After cleanup - Review count:', reviews.length);
    
    if (reviews.length < originalCount) {
        localStorage.setItem('trusttrack_reviews', JSON.stringify(reviews));
        console.log(`Cleaned up ${originalCount - reviews.length} old reviews.`);
    }
}

// Note: showNotification function is defined above at line ~430

function showLoading(element) {
    if (window.TrustTrackUtils && window.TrustTrackUtils.showLoading) {
        window.TrustTrackUtils.showLoading(element);
    }
}

function hideLoading(element, originalText) {
    if (window.TrustTrackUtils && window.TrustTrackUtils.hideLoading) {
        window.TrustTrackUtils.hideLoading(element, originalText);
    }
}

// Test function to add current user ownership to existing reviews (for testing)
function addCurrentUserToReviews() {
    const currentUser = window.FirebaseAuth?.getCurrentUser();
    if (!currentUser) {
        console.log('No user logged in');
        return;
    }
    
    let reviews = JSON.parse(localStorage.getItem('trusttrack_reviews') || '[]');
    if (reviews.length === 0) {
        console.log('No reviews found');
        return;
    }
    
    // Add current user ID to first review for testing
    reviews[0].userId = currentUser.uid;
    reviews[0].userEmail = currentUser.email;
    
    localStorage.setItem('trusttrack_reviews', JSON.stringify(reviews));
    console.log('Updated first review with current user ownership');
    
    // Reload reviews to show delete button
    loadRecentReviews();
}

// Test function to create a new review with current user ownership
function createTestReview() {
    const currentUser = window.FirebaseAuth?.getCurrentUser();
    if (!currentUser) {
        console.log('No user logged in - please log in first');
        return;
    }
    
    const testReview = {
        id: Date.now().toString(),
        transportRoute: 'dhaka-chittagong',
        fromLocation: 'Dhaka',
        toLocation: 'Chittagong',
        transportType: 'bus',
        userName: currentUser.displayName || currentUser.email || 'Test User',
        userEmail: currentUser.email,
        userId: currentUser.uid,
        overallRating: 4,
        safetyRating: 4,
        hygieneRating: 4,
        serviceRating: 4,
        comfortRating: 4,
        valueRating: 4,
        feedback: 'This is a test review that I can delete since I own it.',
        timestamp: new Date().toISOString()
    };
    
    let reviews = JSON.parse(localStorage.getItem('trusttrack_reviews') || '[]');
    reviews.unshift(testReview);
    localStorage.setItem('trusttrack_reviews', JSON.stringify(reviews));
    
    console.log('Created test review with current user ownership');
    
    // Reload reviews to show delete button
    loadRecentReviews();
    
    // Update homepage carousel
    updateHomepageCarousel();
}

// Function to create sample reviews for testing (if none exist)
function createSampleReviews() {
    let reviews = JSON.parse(localStorage.getItem('trusttrack_reviews') || '[]');
    
    if (reviews.length > 0) {
        console.log('Reviews already exist, not creating samples');
        return;
    }
    
    const sampleReviews = [
        {
            id: '1640000000001',
            transportRoute: 'dhaka-chittagong',
            fromLocation: 'Dhaka',
            toLocation: 'Chittagong',
            transportType: 'bus',
            userName: 'Sarah Khan',
            userEmail: 'sarah@example.com',
            userId: 'sample_user_1',
            overallRating: 5,
            safetyRating: 5,
            hygieneRating: 4,
            serviceRating: 5,
            comfortRating: 4,
            valueRating: 5,
            feedback: 'Excellent service! The bus was clean, comfortable, and arrived on time. Highly recommend for long-distance travel.',
            timestamp: new Date(Date.now() - 86400000).toISOString() // 1 day ago
        },
        {
            id: '1640000000002',
            transportRoute: 'mirpur-dhanmondi',
            fromLocation: 'Mirpur',
            toLocation: 'Dhanmondi',
            transportType: 'bus',
            userName: 'Ahmed Rahman',
            userEmail: 'ahmed@example.com',
            userId: 'sample_user_2',
            overallRating: 4,
            safetyRating: 4,
            hygieneRating: 3,
            serviceRating: 4,
            comfortRating: 4,
            valueRating: 4,
            feedback: 'Good daily commute option. Driver was professional and the route is well-maintained. Could improve cleanliness.',
            timestamp: new Date(Date.now() - 172800000).toISOString() // 2 days ago
        },
        {
            id: '1640000000003',
            transportRoute: 'uttara-motijheel',
            fromLocation: 'Uttara',
            toLocation: 'Motijheel',
            transportType: 'bus',
            userName: 'Fatima Ali',
            userEmail: 'fatima@example.com',
            userId: 'sample_user_3',
            overallRating: 3,
            safetyRating: 3,
            hygieneRating: 3,
            serviceRating: 3,
            comfortRating: 2,
            valueRating: 4,
            feedback: 'Average experience. The bus gets quite crowded during peak hours, but the fare is reasonable.',
            timestamp: new Date(Date.now() - 259200000).toISOString() // 3 days ago
        }
    ];
    
    localStorage.setItem('trusttrack_reviews', JSON.stringify(sampleReviews));
    console.log('Created sample reviews');
    
    // Update displays
    loadRecentReviews();
    updateHomepageCarousel();
}

// Comprehensive test function for review system
function testReviewSystem() {
    console.log('=== TESTING REVIEW SYSTEM ===');
    
    // Check authentication
    const currentUser = window.FirebaseAuth?.getCurrentUser();
    console.log('1. Current User:', currentUser ? `${currentUser.email} (${currentUser.uid})` : 'Not logged in');
    
    // Check existing reviews
    const reviews = JSON.parse(localStorage.getItem('trusttrack_reviews') || '[]');
    console.log('2. Existing Reviews:', reviews.length);
    
    if (reviews.length === 0) {
        console.log('   Creating sample reviews...');
        createSampleReviews();
    }
    
    // Test user ownership
    console.log('3. Review Ownership Check:');
    reviews.forEach((review, index) => {
        const canDelete = currentUser && (currentUser.uid === review.userId || currentUser.email === review.userEmail);
        console.log(`   Review ${index + 1}: ${review.userName} - Can delete: ${canDelete}`);
    });
    
    // Create test review if user is logged in
    if (currentUser) {
        console.log('4. Creating test review with your ownership...');
        createTestReview();
    } else {
        console.log('4. Cannot create test review - please log in first');
    }
    
    // Test homepage update
    console.log('5. Triggering homepage update...');
    updateHomepageCarousel();
    
    console.log('=== TEST COMPLETE ===');
    console.log('If you are logged in, you should see delete buttons on your reviews!');
}

// Manual refresh function for testing
function refreshReviews() {
    console.log('Refreshing reviews...');
    loadRecentReviews();
    updateHomepageCarousel();
}

// Force reload reviews with auth check
function forceReloadWithAuth() {
    console.log('Force reloading reviews with auth check...');
    const currentUser = window.FirebaseAuth?.getCurrentUser();
    console.log('Current user:', currentUser ? `${currentUser.email} (${currentUser.uid})` : 'Not logged in');
    
    if (currentUser) {
        // User is logged in, create a test review for them
        createTestReview();
    } else {
        // User not logged in, just reload existing reviews
        loadRecentReviews();
    }
}

// Debug function to check localStorage state
function debugReviews() {
    const reviews = JSON.parse(localStorage.getItem('trusttrack_reviews') || '[]');
    console.log('=== DEBUG REVIEWS ===');
    console.log('Total reviews in localStorage:', reviews.length);
    console.log('Reviews:', reviews);
    console.log('Latest review timestamp:', reviews[0]?.timestamp);
    console.log('===================');
}

// Make functions globally available
window.refreshReviews = refreshReviews;
window.forceReloadWithAuth = forceReloadWithAuth;

// Make functions available globally for testing
window.addCurrentUserToReviews = addCurrentUserToReviews;
window.createTestReview = createTestReview;
window.confirmDelete = confirmDelete;
window.showDeleteConfirmation = showDeleteConfirmation;
window.showNotification = showNotification;
window.createSampleReviews = createSampleReviews;
window.testReviewSystem = testReviewSystem;
window.debugReviews = debugReviews;

// Add toggle event listeners for real-time updates
const showUsernamesToggle = document.getElementById('showUsernames');
const showDeleteButtonsToggle = document.getElementById('showDeleteButtons');

if (showUsernamesToggle) {
    showUsernamesToggle.addEventListener('change', () => {
        loadRecentReviews();
    });
}

if (showDeleteButtonsToggle) {
    showDeleteButtonsToggle.addEventListener('change', () => {
        loadRecentReviews();
    });
}

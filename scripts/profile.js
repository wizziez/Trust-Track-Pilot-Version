// Profile page functionality for TrustTrack

class ProfileManager {
    constructor() {
        this.currentUser = null;
        this.userData = null;
        this.init();
    }

    init() {
        // Wait for Firebase to be ready
        if (typeof firebase === 'undefined') {
            setTimeout(() => this.init(), 100);
            return;
        }
        
        // Check authentication state
        firebase.auth().onAuthStateChanged(async (user) => {
            this.currentUser = user;
            if (user) {
                // Fetch user data from Firestore
                const userDoc = await firebase.firestore().collection('users').doc(user.uid).get();
                if (userDoc.exists && userDoc.data().role === 'admin') {
                    window.location.href = '/pages/admin.html';
                    return;
                }
                this.loadUserProfile();
                this.loadUserStats();
            } else {
                // Redirect to home if not authenticated
                window.location.href = '/index.html';
            }
        });

        this.bindEvents();
    }

    async loadUserProfile() {
        try {
            // Load user data from Firestore
            const userDoc = await firebase.firestore()
                .collection('users')
                .doc(this.currentUser.uid)
                .get();

            if (userDoc.exists) {
                this.userData = userDoc.data();
            } else {
                // Create default user data
                this.userData = {
                    displayName: this.currentUser.displayName || '',
                    email: this.currentUser.email,
                    phone: '',
                    location: '',
                    emailNotifications: true,
                    profileVisibility: true,
                    reviewPrivacy: true,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                };
                
                // Save default data
                await firebase.firestore()
                    .collection('users')
                    .doc(this.currentUser.uid)
                    .set(this.userData);
            }

            this.populateProfileForm();
            this.updateUserNavigationInfo();
        } catch (error) {
            console.error('Error loading user profile:', error);
            this.showNotification('Error loading profile data', 'error');
        }
    }    populateProfileForm() {
        // Update navigation user info
        this.updateUserNavigationInfo();

        // Update profile avatar
        const profileAvatar = document.getElementById('profileAvatar');
        if (profileAvatar && this.currentUser.photoURL) {
            profileAvatar.src = this.currentUser.photoURL;
        }

        // Basic profile info
        document.getElementById('displayName').value = this.userData.displayName || '';
        document.getElementById('email').value = this.userData.email || '';
        document.getElementById('phone').value = this.userData.phone || '';
        document.getElementById('location').value = this.userData.location || '';

        // Privacy settings
        document.getElementById('emailNotifications').checked = this.userData.emailNotifications !== false;
        document.getElementById('profileVisibility').checked = this.userData.profileVisibility !== false;
        document.getElementById('reviewPrivacy').checked = this.userData.reviewPrivacy !== false;

        // Member since
        if (this.userData.createdAt) {
            const memberSince = this.userData.createdAt.toDate ? 
                this.userData.createdAt.toDate() : 
                new Date(this.userData.createdAt);
            document.getElementById('memberSince').textContent = memberSince.getFullYear();
        }
    }

    async loadUserStats() {
        try {
            // Load user reviews count
            const reviewsSnapshot = await firebase.firestore()
                .collection('reviews')
                .where('userId', '==', this.currentUser.uid)
                .get();

            document.getElementById('totalReviews').textContent = reviewsSnapshot.size;

            // Load recent activity
            this.loadRecentActivity();

            // For now, set helpful votes to 0 (can be implemented later)
            document.getElementById('helpfulVotes').textContent = '0';

        } catch (error) {
            console.error('Error loading user stats:', error);
        }
    }    loadRecentActivity() {
        const activityContainer = document.getElementById('userRecentActivity');
        if (!activityContainer || !this.currentUser) return;

        // Load reviews from localStorage (same source as reviews page)
        const allReviews = JSON.parse(localStorage.getItem('trusttrack_reviews') || '[]');
        
        // Filter reviews by current user
        const userReviews = allReviews.filter(review => 
            review.userId === this.currentUser.uid || 
            review.userEmail === this.currentUser.email
        );

        if (userReviews.length === 0) {
            activityContainer.innerHTML = `
                <div class="no-activity">
                    <i class="fas fa-clock"></i>
                    <p>No recent activity to display. <a href="./reviews.html">Write your first review!</a></p>
                </div>
            `;
            return;
        }

        // Sort reviews by timestamp and take the most recent 5
        const recentReviews = userReviews
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, 5);

        activityContainer.innerHTML = recentReviews.map(review => `
            <div class="activity-item" data-review-id="${review.id}">
                <div class="activity-icon">
                    <i class="fas fa-star"></i>
                </div>
                <div class="activity-content">
                    <p><strong>Reviewed ${this.getRouteDisplayName(review.transportRoute)}</strong></p>
                    <p class="activity-detail">${review.feedback.substring(0, 100)}${review.feedback.length > 100 ? '...' : ''}</p>
                    <span class="activity-time">${this.getTimeAgo(review.timestamp)}</span>
                </div>
                <div class="activity-rating">
                    ${this.generateStars(review.overallRating)}
                </div>
            </div>
        `).join('');
    }

    getRouteDisplayName(routeKey) {
        const routeNames = {
            'dhaka-chittagong': 'Dhaka - Chittagong Highway',
            'mirpur-dhanmondi': 'Mirpur - Dhanmondi Route',
            'uttara-motijheel': 'Uttara - Motijheel Express',
            'gazipur-dhaka': 'Gazipur - Dhaka Route',
            'sylhet-dhaka': 'Sylhet - Dhaka Highway',
            'other': 'Other Route'        };
        return routeNames[routeKey] || routeKey;
    }

    bindEvents() {
        // User dropdown toggle
        const userInfo = document.getElementById('userInfo');
        const userDropdown = document.getElementById('userDropdown');
        
        if (userInfo && userDropdown) {
            userInfo.addEventListener('click', (e) => {
                e.stopPropagation();
                userDropdown.classList.toggle('show');
            });

            // Close dropdown when clicking outside
            document.addEventListener('click', () => {
                userDropdown.classList.remove('show');
            });
        }

        // Logout functionality
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                await this.handleLogout();
            });
        }

        // Profile form submission
        document.getElementById('profileForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveProfile();
        });

        // Change password
        document.getElementById('changePasswordBtn').addEventListener('click', () => {
            this.changePassword();
        });

        // Delete account
        document.getElementById('deleteAccountBtn').addEventListener('click', () => {
            this.deleteAccount();
        });

        // Privacy settings
        ['emailNotifications', 'profileVisibility', 'reviewPrivacy'].forEach(settingId => {
            document.getElementById(settingId).addEventListener('change', () => {
                this.savePrivacySettings();
            });
        });

        // Review action handlers
        document.addEventListener('click', (e) => {
            if (e.target.closest('.delete-review')) {
                const reviewId = e.target.closest('.delete-review').dataset.reviewId;
                this.deleteReview(reviewId);
            }
            
            if (e.target.closest('.edit-review')) {
                const reviewId = e.target.closest('.edit-review').dataset.reviewId;
                this.editReview(reviewId);
            }
        });
    }

    async saveProfile() {
        try {
            const formData = {
                displayName: document.getElementById('displayName').value.trim(),
                phone: document.getElementById('phone').value.trim(),
                location: document.getElementById('location').value.trim(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            // Update Firestore
            await firebase.firestore()
                .collection('users')
                .doc(this.currentUser.uid)
                .update(formData);

            // Update Firebase Auth display name if changed
            if (formData.displayName !== this.currentUser.displayName) {
                await this.currentUser.updateProfile({
                    displayName: formData.displayName
                });
            }

            this.userData = { ...this.userData, ...formData };
            this.showNotification('Profile updated successfully!', 'success');

        } catch (error) {
            console.error('Error saving profile:', error);
            this.showNotification('Error updating profile', 'error');
        }
    }

    async savePrivacySettings() {
        try {
            const settings = {
                emailNotifications: document.getElementById('emailNotifications').checked,
                profileVisibility: document.getElementById('profileVisibility').checked,
                reviewPrivacy: document.getElementById('reviewPrivacy').checked,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            await firebase.firestore()
                .collection('users')
                .doc(this.currentUser.uid)
                .update(settings);

            this.userData = { ...this.userData, ...settings };
            this.showNotification('Privacy settings updated!', 'success');

        } catch (error) {
            console.error('Error saving privacy settings:', error);
            this.showNotification('Error updating settings', 'error');
        }
    }

    async changePassword() {
        const email = this.currentUser.email;
        
        try {
            await firebase.auth().sendPasswordResetEmail(email);
            this.showNotification('Password reset email sent! Check your inbox.', 'success');
        } catch (error) {
            console.error('Error sending password reset:', error);
            this.showNotification('Error sending password reset email', 'error');
        }
    }

    async deleteAccount() {
        const confirmation = confirm(
            'Are you sure you want to delete your account? This action cannot be undone. All your reviews and data will be permanently deleted.'
        );

        if (!confirmation) return;

        const doubleConfirmation = prompt(
            'Type "DELETE" to confirm account deletion:'
        );

        if (doubleConfirmation !== 'DELETE') {
            this.showNotification('Account deletion cancelled', 'info');
            return;
        }

        try {
            // Delete user data from Firestore
            const batch = firebase.firestore().batch();
            
            // Delete user document
            batch.delete(firebase.firestore().collection('users').doc(this.currentUser.uid));
            
            // Delete user reviews
            const userReviews = await firebase.firestore()
                .collection('reviews')
                .where('userId', '==', this.currentUser.uid)
                .get();

            userReviews.docs.forEach(doc => {
                batch.delete(doc.ref);
            });

            await batch.commit();

            // Delete Firebase Auth account
            await this.currentUser.delete();

            this.showNotification('Account deleted successfully', 'success');
            
            // Redirect to home page
            setTimeout(() => {
                window.location.href = '/index.html';
            }, 2000);

        } catch (error) {
            console.error('Error deleting account:', error);
            this.showNotification('Error deleting account. Please try again.', 'error');
        }
    }

    async deleteReview(reviewId) {
        const confirmed = confirm('Are you sure you want to delete this review? This action cannot be undone.');
        
        if (!confirmed) return;

        try {
            // Delete from Firestore
            await firebase.firestore()
                .collection('reviews')
                .doc(reviewId)
                .delete();

            this.showNotification('Review deleted successfully!', 'success');
            
            // Reload stats and activity
            this.loadUserStats();

        } catch (error) {
            console.error('Error deleting review:', error);
            this.showNotification('Error deleting review. Please try again.', 'error');
        }
    }

    editReview(reviewId) {
        // Redirect to reviews page with edit mode
        const currentPath = window.location.pathname;
        
        if (currentPath.includes('/pages/')) {
            window.location.href = '/pages/reviews.html?edit='+reviewId;
        } else {
            window.location.href = '/pages/reviews.html?edit='+reviewId;
        }
    }

    generateStars(rating) {
        let stars = '';
        for (let i = 1; i <= 5; i++) {
            if (i <= rating) {
                stars += '<i class="fas fa-star"></i>';
            } else {
                stars += '<i class="far fa-star"></i>';
            }
        }
        return stars;
    }

    getTimeAgo(timestamp) {
        if (!timestamp) return 'Recently';
        
        const now = new Date();
        const time = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        const diffInMinutes = Math.floor((now - time) / (1000 * 60));
        
        if (diffInMinutes < 1) return 'Just now';
        if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
        
        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
        
        const diffInDays = Math.floor(diffInHours / 24);
        return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    }

    showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
            ${message}
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }    updateUserNavigationInfo() {
        if (this.currentUser) {
            const userName = this.currentUser.displayName || this.currentUser.email.split('@')[0];
            const userAvatar = this.currentUser.photoURL || 'https://via.placeholder.com/40';

            // Update user info in navigation
            const userNameElement = document.getElementById('userName');
            const userAvatarElement = document.getElementById('userAvatar');
            const profileUserNameElement = document.getElementById('profileUserName');
            
            if (userNameElement) userNameElement.textContent = userName;
            if (userAvatarElement) userAvatarElement.src = userAvatar;
            if (profileUserNameElement) profileUserNameElement.textContent = userName;
        }
    }

    async handleLogout() {
        try {
            await firebase.auth().signOut();
            window.location.href = '/index.html';
        } catch (error) {
            console.error('Logout error:', error);
            alert('An error occurred during logout.');
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ProfileManager();
});

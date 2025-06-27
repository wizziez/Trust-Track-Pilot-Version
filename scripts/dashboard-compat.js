// Dashboard functionality with Firebase compat
class Dashboard {
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
        this.initAuthObserver();
        this.bindEvents();
    }

    initAuthObserver() {
        window.FirebaseAuth.onAuthStateChanged((user) => {
            if (user) {
                this.currentUser = user;
                this.loadUserData();
                this.updateUI();
            } else {
                // Redirect to login if not authenticated
                window.location.href = '/pages/login.html';
            }
        });
    }    async loadUserData() {
        if (this.currentUser) {
            const result = await window.FirebaseAuth.getUserData(this.currentUser.uid);
            if (result.success) {
                this.userData = result.data;
                // Hide user-menu and redirect if admin
                if (this.userData.role === 'admin') {
                    const userMenu = document.querySelector('.user-menu');
                    if (userMenu) userMenu.style.display = 'none';
                    window.location.href = '/pages/admin.html';
                    return;
                }
                this.updateUserStats();
                this.loadRecentActivity();
            }
        }
    }

    updateUI() {
        if (this.currentUser) {
            const userName = this.currentUser.displayName || this.currentUser.email.split('@')[0];
            const userAvatar = this.currentUser.photoURL || 'https://via.placeholder.com/40';            // Update user info in navigation
            const userNameElement = document.getElementById('userName');
            const userAvatarElement = document.getElementById('userAvatar');
            const welcomeUserNameElement = document.getElementById('welcomeUserName');            if (userNameElement) {
                userNameElement.textContent = userName;
                // Add click event for user dropdown
                userNameElement.style.cursor = 'pointer';
                // User dropdown is handled by bindEvents() method - removing duplicate onclick
            }
              if (userAvatarElement) {
                // Use a default avatar instead of placeholder
                const defaultAvatar = `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><circle cx="20" cy="20" r="20" fill="%23667eea"/><circle cx="20" cy="16" r="6" fill="white"/><path d="M20 24c-8 0-12 4-12 8v8h24v-8c0-4-4-8-12-8z" fill="white"/></svg>`;
                
                userAvatarElement.src = userAvatar && userAvatar !== 'https://via.placeholder.com/40' ? userAvatar : defaultAvatar;
                userAvatarElement.onerror = function() {
                    console.log('Avatar failed to load, using default');
                    this.src = defaultAvatar;
                };
            }
            
            if (welcomeUserNameElement) welcomeUserNameElement.textContent = userName;

            // Update join date if available
            if (this.userData && this.userData.createdAt) {
                const joinDateElement = document.getElementById('joinDate');
                if (joinDateElement && this.userData.createdAt.toDate) {
                    const joinDate = new Date(this.userData.createdAt.toDate()).toLocaleDateString();
                    joinDateElement.textContent = `Joined ${joinDate}`;
                }
            }
        }
    }

    updateUserStats() {
        if (this.userData) {
            const reviewsCountElement = document.getElementById('userReviewsCount');
            const helpfulVotesElement = document.getElementById('userHelpfulVotes');
            const safetyScoreElement = document.getElementById('safetyScore');

            if (reviewsCountElement) {
                reviewsCountElement.textContent = this.userData.reviewsCount || 0;
            }
            if (helpfulVotesElement) {
                helpfulVotesElement.textContent = this.userData.helpfulVotes || 0;
            }
            
            // Calculate safety score based on user activity
            const safetyScore = this.calculateSafetyScore();
            if (safetyScoreElement) {
                safetyScoreElement.textContent = `${safetyScore}%`;
            }
        }
    }

    calculateSafetyScore() {
        if (!this.userData) return 95;
        
        const reviewsCount = this.userData.reviewsCount || 0;
        const helpfulVotes = this.userData.helpfulVotes || 0;
        const isVerified = this.userData.isVerified || false;
        
        let score = 75; // Base score
        score += Math.min(reviewsCount * 2, 15); // Max 15 points for reviews
        score += Math.min(helpfulVotes, 10); // Max 10 points for helpful votes
        if (isVerified) score += 5; // 5 points for verification
        
        return Math.min(score, 100);
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
    }

    async handleLogout() {
        try {
            const result = await window.FirebaseAuth.signOutUser();
            if (result.success) {
                window.location.href = '/index.html';
            } else {
                console.error('Logout failed:', result.error);
                alert('Failed to logout. Please try again.');
            }
        } catch (error) {
            console.error('Logout error:', error);
            alert('An error occurred during logout.');
        }    }

    async loadRecentActivity() {
        try {
            // Load user's recent reviews
            const reviews = await this.getUserReviews();
            const activityContainer = document.getElementById('recentActivity');
            
            if (reviews.length === 0) {
                activityContainer.innerHTML = `
                    <div class="no-activity">
                        <i class="fas fa-clipboard-list"></i>
                        <p>No recent activity yet. Start by writing your first review!</p>
                    </div>
                `;
                return;
            }
            
            activityContainer.innerHTML = '';
            
            // Add welcome message for new users
            if (this.userData && this.userData.createdAt) {
                const welcomeItem = document.createElement('div');
                welcomeItem.className = 'activity-item';
                welcomeItem.innerHTML = `
                    <div class="activity-icon">
                        <i class="fas fa-user-plus"></i>
                    </div>
                    <div class="activity-content">
                        <p><strong>Welcome to TrustTrack!</strong> Account created</p>
                        <span class="activity-time">${this.formatDate(this.userData.createdAt)}</span>
                    </div>
                `;
                activityContainer.appendChild(welcomeItem);
            }
            
            // Add recent reviews
            reviews.slice(0, 5).forEach(review => {
                const activityItem = document.createElement('div');
                activityItem.className = 'activity-item';
                activityItem.innerHTML = `
                    <div class="activity-icon">
                        <i class="fas fa-star"></i>
                    </div>
                    <div class="activity-content">
                        <p><strong>You</strong> wrote a review for ${review.routeName || 'Public Transport'}</p>
                        <span class="activity-time">${this.formatDate(review.createdAt)}</span>
                    </div>
                `;
                activityContainer.appendChild(activityItem);
            });
            
        } catch (error) {
            console.error('Error loading recent activity:', error);
        }
    }    async getUserReviews() {
        try {
            // First get user reviews without ordering to avoid index requirement
            const reviewsSnapshot = await firebase.firestore()
                .collection('reviews')
                .where('userId', '==', this.currentUser.uid)
                .get();
            
            const reviews = reviewsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            
            // Sort in JavaScript instead of Firestore to avoid composite index
            return reviews.sort((a, b) => {
                const aDate = a.createdAt ? a.createdAt.toDate() : new Date(0);
                const bDate = b.createdAt ? b.createdAt.toDate() : new Date(0);
                return bDate - aDate; // Most recent first
            });
            
        } catch (error) {
            console.error('Error getting user reviews:', error);
            // Return empty array instead of crashing
            return [];
        }
    }

    formatDate(timestamp) {
        if (!timestamp) return 'Recently';
        
        let date;
        if (timestamp.toDate) {
            date = timestamp.toDate();
        } else if (timestamp instanceof Date) {
            date = timestamp;
        } else {
            date = new Date(timestamp);
        }
        
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) return '1 day ago';
        if (diffDays < 7) return `${diffDays} days ago`;
        if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
        if (diffDays < 365) return `${Math.ceil(diffDays / 30)} months ago`;
        return `${Math.ceil(diffDays / 365)} years ago`;
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new Dashboard();
});

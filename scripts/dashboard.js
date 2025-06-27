import { initAuthObserver, signOutUser, getUserData } from './firebase-config.js';

class Dashboard {
    constructor() {
        this.currentUser = null;
        this.userData = null;
        this.init();
    }

    init() {
        this.initAuthObserver();
        this.bindEvents();
    }

    initAuthObserver() {
        initAuthObserver((user) => {
            if (user) {
                this.currentUser = user;
                this.loadUserData();
                this.updateUI();
            } else {
                // Redirect to login if not authenticated
                window.location.href = '/pages/login.html';
            }
        });
    }

    async loadUserData() {
        if (this.currentUser) {
            const result = await getUserData(this.currentUser.uid);
            if (result.success) {
                this.userData = result.data;
                // Block admin users from accessing dashboard
                if (this.userData.role === 'admin') {
                    window.location.href = '/pages/admin.html';
                    return;
                }
                this.updateUserStats();
            }
        }
    }

    updateUI() {
        if (this.currentUser) {
            const userName = this.currentUser.displayName || this.currentUser.email.split('@')[0];
            const userAvatar = this.currentUser.photoURL || 'https://via.placeholder.com/40';

            // Update user info in navigation
            document.getElementById('userName').textContent = userName;
            document.getElementById('userAvatar').src = userAvatar;
            document.getElementById('welcomeUserName').textContent = userName;

            // Update join date if available
            if (this.userData && this.userData.createdAt) {
                const joinDate = new Date(this.userData.createdAt.toDate()).toLocaleDateString();
                document.getElementById('joinDate').textContent = `Joined ${joinDate}`;
            }
        }
    }

    updateUserStats() {
        if (this.userData) {
            document.getElementById('userReviewsCount').textContent = this.userData.reviewsCount || 0;
            document.getElementById('userHelpfulVotes').textContent = this.userData.helpfulVotes || 0;
            
            // Calculate safety score based on user activity
            const safetyScore = this.calculateSafetyScore();
            document.getElementById('safetyScore').textContent = `${safetyScore}%`;
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
            const result = await signOutUser();
            if (result.success) {
                window.location.href = '/index.html';
            } else {
                console.error('Logout failed:', result.error);
                alert('Failed to logout. Please try again.');
            }
        } catch (error) {
            console.error('Logout error:', error);
            alert('An error occurred during logout.');
        }
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new Dashboard();
});

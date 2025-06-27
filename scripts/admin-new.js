// Fresh Admin Dashboard Implementation
console.log('Loading fresh admin script...');

class FreshAdminDashboard {
    constructor() {
        console.log('Fresh AdminDashboard constructor');
        this.isLoggedIn = false;
        this.currentUser = null;
        this.init();
    }

    init() {
        console.log('Initializing Fresh Admin Dashboard');
        
        // Add a small delay to ensure Firebase is loaded
        setTimeout(() => {
            this.setupEventListeners();
            this.checkAuthStatus();
            this.initializeDatabase();
        }, 100);
    }

    initializeDatabase() {
        console.log('Initializing database connection...');
        console.log('Firebase available:', typeof firebase !== 'undefined');
        console.log('Firebase app initialized:', typeof firebase !== 'undefined' && firebase.apps.length > 0);
        console.log('window.db available:', typeof window.db !== 'undefined');
        
        // If window.db is not available, try to set it up
        if (!window.db && typeof firebase !== 'undefined') {
            try {
                window.db = firebase.firestore();
                console.log('Database initialized successfully');
            } catch (error) {
                console.error('Error initializing database:', error);
            }
        }
    }

    setupEventListeners() {
        console.log('Setting up event listeners');
        
        // Login button
        const loginBtn = document.getElementById('adminLoginBtn');
        if (loginBtn) {
            console.log('Login button found, adding listener');
            loginBtn.addEventListener('click', (e) => {
                console.log('Login button clicked!');
                this.handleLogin(e);
            });
        } else {
            console.error('Login button not found!');
        }

        // Logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.handleLogout());
        }

        // Tab switching
        const tabBtns = document.querySelectorAll('.tab-btn');
        tabBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tabName = e.target.getAttribute('data-tab');
                this.switchTab(tabName);
            });
        });

        // Enter key support
        const emailInput = document.getElementById('adminEmail');
        const passwordInput = document.getElementById('adminPassword');
        
        if (emailInput) {
            emailInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.handleLogin(e);
            });
        }
        
        if (passwordInput) {
            passwordInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.handleLogin(e);
            });
        }
    }

    async handleLogin(e) {
        console.log('handleLogin called');
        e.preventDefault();
        
        const email = document.getElementById('adminEmail').value.trim();
        const password = document.getElementById('adminPassword').value;
        
        console.log('Login attempt with email:', email);
        
        if (!email || !password) {
            this.showError('Please enter both email and password');
            return;
        }

        this.showLoading(true);
        this.clearMessages();

        try {
            // Check if Firebase is available
            if (typeof window.FirebaseAuth === 'undefined') {
                throw new Error('Firebase not available');
            }

            console.log('Attempting Firebase authentication...');
            const result = await window.FirebaseAuth.signInUser(email, password);
            
            console.log('Firebase auth result:', result);
            
            if (result.success) {
                const user = result.user;
                console.log('User authenticated:', user.uid);
                
                // Check admin role
                const userData = await window.FirebaseAuth.getUserData(user.uid);
                console.log('User data:', userData);
                
                if (userData.success && userData.data.role === 'admin') {
                    console.log('Admin role confirmed');
                    
                    this.isLoggedIn = true;
                    this.currentUser = {
                        uid: user.uid,
                        email: user.email,
                        name: userData.data.displayName || user.email.split('@')[0]
                    };
                    
                    // Store in localStorage
                    localStorage.setItem('adminAuth', 'true');
                    localStorage.setItem('adminUser', JSON.stringify(this.currentUser));
                    
                    this.showSuccess('Login successful! Loading dashboard...');
                    
                    setTimeout(() => {
                        this.showDashboard();
                        this.loadDashboardData();
                    }, 1000);
                    
                } else {
                    console.error('Access denied - not admin');
                    await window.FirebaseAuth.signOutUser();
                    this.showError('Access denied. Admin privileges required.');
                }
            } else {
                console.error('Authentication failed:', result.error);
                this.showError(result.error || 'Login failed');
            }
            
        } catch (error) {
            console.error('Login error:', error);
            this.showError('Login failed: ' + error.message);
        } finally {
            this.showLoading(false);
        }
    }

    handleLogout() {
        console.log('Logging out');
        
        // Clear localStorage
        localStorage.removeItem('adminAuth');
        localStorage.removeItem('adminUser');
        
        // Reset state
        this.isLoggedIn = false;
        this.currentUser = null;
        
        // Sign out from Firebase
        if (window.FirebaseAuth) {
            window.FirebaseAuth.signOutUser();
        }
        
        // Show login section
        this.showLogin();
    }

    checkAuthStatus() {
        console.log('Checking auth status');
        const adminAuth = localStorage.getItem('adminAuth');
        const adminUser = localStorage.getItem('adminUser');
        
        if (adminAuth === 'true' && adminUser) {
            console.log('Found existing admin session');
            this.isLoggedIn = true;
            this.currentUser = JSON.parse(adminUser);
            this.showDashboard();
            this.loadDashboardData();
        } else {
            console.log('No existing admin session');
            this.showLogin();
        }
    }

    showLogin() {
        const loginSection = document.getElementById('adminLogin');
        const dashboardSection = document.getElementById('adminDashboard');
        
        if (loginSection && dashboardSection) {
            loginSection.style.display = 'block';
            dashboardSection.style.display = 'none';
        }
    }

    showDashboard() {
        console.log('Showing dashboard');
        const loginSection = document.getElementById('adminLogin');
        const dashboardSection = document.getElementById('adminDashboard');
        
        if (loginSection && dashboardSection) {
            loginSection.style.display = 'none';
            dashboardSection.style.display = 'block';
        }
        
        // Update admin name
        const adminNameEl = document.getElementById('adminName');
        if (adminNameEl && this.currentUser) {
            adminNameEl.textContent = this.currentUser.name;
        }
    }

    async loadDashboardData() {
        console.log('Loading dashboard data');
        
        try {
            // Load reviews count
            const reviewsCount = await this.getCollectionCount('reviews');
            document.getElementById('totalReviews').textContent = reviewsCount;
            
            // Load users count
            const usersCount = await this.getCollectionCount('users');
            document.getElementById('totalUsers').textContent = usersCount;
            
            // Load feedback count
            const feedbackCount = await this.getCollectionCount('feedback');
            document.getElementById('totalFeedback').textContent = feedbackCount;
            
            // Load actual data for tabs
            await this.loadAnalytics();
            await this.loadReviews();
            await this.loadUsers();
            await this.loadFeedback();
            
        } catch (error) {
            console.error('Error loading dashboard data:', error);
        }
    }

    async getCollectionCount(collectionName) {
        try {
            if (window.db) {
                const snapshot = await window.db.collection(collectionName).get();
                return snapshot.size;
            }
            return 0;
        } catch (error) {
            console.error(`Error getting ${collectionName} count:`, error);
            return 0;
        }
    }

    async loadReviews() {
        const reviewsTable = document.getElementById('reviewsTable');
        if (!reviewsTable) {
            console.error('Reviews table not found');
            return;
        }
        
        reviewsTable.innerHTML = '<p>Loading reviews...</p>';
        
        try {
            console.log('Checking database availability...');
            console.log('window.db:', window.db);
            console.log('Firebase:', typeof firebase);
            
            if (window.db) {
                console.log('Database available, fetching reviews...');
                const snapshot = await window.db.collection('reviews').orderBy('createdAt', 'desc').limit(50).get();
                
                if (snapshot.empty) {
                    reviewsTable.innerHTML = '<p>No reviews found.</p>';
                    return;
                }
                
                let html = `
                    <div class="table-wrapper">
                        <table class="data-table-content">
                            <thead>
                                <tr>
                                    <th>Route</th>
                                    <th>Rating</th>
                                    <th>Comment</th>
                                    <th>User</th>
                                    <th>Date</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                `;
                
                snapshot.forEach(doc => {
                    const data = doc.data();
                    const date = data.createdAt ? data.createdAt.toDate().toLocaleDateString() : 'N/A';
                    const rating = data.rating || 0;
                    const stars = '★'.repeat(rating) + '☆'.repeat(5 - rating);
                    const comment = data.comment || 'No comment';
                    const shortComment = comment.length > 100 ? comment.substring(0, 100) + '...' : comment;
                    
                    html += `
                        <tr data-id="${doc.id}">
                            <td>${data.route || 'Unknown Route'}</td>
                            <td><span class="rating-stars">${stars} (${rating}/5)</span></td>
                            <td class="comment-cell" title="${comment}">${shortComment}</td>
                            <td>${data.userEmail || data.userName || 'Anonymous'}</td>
                            <td>${date}</td>
                            <td>
                                <button onclick="adminDashboard.deleteReview('${doc.id}')" class="action-btn delete-btn">
                                    <i class="fas fa-trash"></i> Delete
                                </button>
                            </td>
                        </tr>
                    `;
                });
                
                html += `
                            </tbody>
                        </table>
                    </div>
                `;
                reviewsTable.innerHTML = html;
                console.log(`Loaded ${snapshot.size} reviews`);
            } else {
                console.error('Database not available!');
                console.log('firebase:', typeof firebase);
                console.log('firebase.firestore:', typeof firebase !== 'undefined' ? firebase.firestore : 'N/A');
                reviewsTable.innerHTML = '<p>Database not available. Please check Firebase configuration.</p>';
            }
        } catch (error) {
            console.error('Error loading reviews:', error);
            reviewsTable.innerHTML = '<p>Error loading reviews: ' + error.message + '</p>';
        }
    }

    async loadUsers() {
        const usersList = document.getElementById('usersList');
        usersList.innerHTML = '<p>Loading users...</p>';
        
        try {
            if (window.db) {
                const snapshot = await window.db.collection('users').orderBy('createdAt', 'desc').limit(20).get();
                let html = '<div class="data-table"><table><tr><th>Name</th><th>Email</th><th>Role</th><th>Reviews</th><th>Joined</th></tr>';
                
                snapshot.forEach(doc => {
                    const data = doc.data();
                    const date = data.createdAt ? data.createdAt.toDate().toLocaleDateString() : 'N/A';
                    html += `
                        <tr>
                            <td>${data.displayName || 'N/A'}</td>
                            <td>${data.email || 'N/A'}</td>
                            <td><span class="role-badge ${data.role || 'user'}">${data.role || 'user'}</span></td>
                            <td>${data.reviewsCount || 0}</td>
                            <td>${date}</td>
                        </tr>
                    `;
                });
                
                html += '</table></div>';
                usersList.innerHTML = html;
            }
        } catch (error) {
            console.error('Error loading users:', error);
            usersList.innerHTML = '<p>Error loading users</p>';
        }
    }

    async loadFeedback() {
        const feedbackTable = document.getElementById('feedbackTable');
        if (!feedbackTable) {
            console.error('Feedback table not found');
            return;
        }
        
        feedbackTable.innerHTML = '<p>Loading feedback...</p>';
        
        try {
            if (window.db) {
                const snapshot = await window.db.collection('feedback').orderBy('createdAt', 'desc').limit(50).get();
                
                if (snapshot.empty) {
                    feedbackTable.innerHTML = '<p>No feedback found.</p>';
                    return;
                }
                
                let html = `
                    <div class="table-wrapper">
                        <table class="data-table-content">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Category</th>
                                    <th>Message</th>
                                    <th>Date</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                `;
                
                snapshot.forEach(doc => {
                    const data = doc.data();
                    const date = data.createdAt ? data.createdAt.toDate().toLocaleDateString() : 'N/A';
                    const message = data.message || 'No message';
                    const shortMessage = message.length > 100 ? message.substring(0, 100) + '...' : message;
                    
                    html += `
                        <tr data-id="${doc.id}">
                            <td>${data.name || 'Anonymous'}</td>
                            <td>${data.email || 'No email'}</td>
                            <td><span class="category-badge">${data.category || 'general'}</span></td>
                            <td class="message-cell" title="${message}">${shortMessage}</td>
                            <td>${date}</td>
                            <td>
                                <button onclick="adminDashboard.deleteFeedback('${doc.id}')" class="action-btn delete-btn">
                                    <i class="fas fa-trash"></i> Delete
                                </button>
                            </td>
                        </tr>
                    `;
                });
                
                html += `
                            </tbody>
                        </table>
                    </div>
                `;
                feedbackTable.innerHTML = html;
                console.log(`Loaded ${snapshot.size} feedback messages`);
            } else {
                feedbackTable.innerHTML = '<p>Database not available</p>';
            }
        } catch (error) {
            console.error('Error loading feedback:', error);
            feedbackTable.innerHTML = '<p>Error loading feedback: ' + error.message + '</p>';
        }
    }

    async deleteReview(reviewId) {
        if (confirm('Are you sure you want to delete this review? This action cannot be undone.')) {
            try {
                console.log('Deleting review:', reviewId);
                await window.db.collection('reviews').doc(reviewId).delete();
                
                this.showSuccess('Review deleted successfully from database');
                
                // Reload both reviews and analytics to reflect the change
                await this.loadReviews();
                
                // Update stats
                const reviewsCount = await this.getCollectionCount('reviews');
                document.getElementById('totalReviews').textContent = reviewsCount;
                
                // Refresh analytics if currently viewing analytics tab
                const activeTab = document.querySelector('.tab-btn.active');
                if (activeTab && activeTab.getAttribute('data-tab') === 'analytics') {
                    await this.loadAnalytics();
                }
                
            } catch (error) {
                console.error('Error deleting review:', error);
                this.showError('Failed to delete review: ' + error.message);
            }
        }
    }

    async deleteFeedback(feedbackId) {
        if (confirm('Are you sure you want to delete this feedback?')) {
            try {
                await window.db.collection('feedback').doc(feedbackId).delete();
                this.showSuccess('Feedback deleted successfully');
                this.loadFeedback(); // Reload
            } catch (error) {
                console.error('Error deleting feedback:', error);
                this.showError('Failed to delete feedback');
            }
        }
    }

    switchTab(tabName) {
        // Remove active class from all tabs and panes
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
        
        // Add active class to clicked tab and corresponding pane
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        document.getElementById(`${tabName}Tab`).classList.add('active');
        
        // Load data for specific tabs when switched to
        if (tabName === 'analytics') {
            this.loadAnalytics();
        } else if (tabName === 'reviews') {
            this.loadReviews();
        } else if (tabName === 'users') {
            this.loadUsers();
        } else if (tabName === 'feedback') {
            this.loadFeedback();
        }
    }

    showError(message) {
        console.error('Error:', message);
        const errorDiv = document.getElementById('loginError');
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.style.display = 'block';
        }
        this.hideSuccess();
    }

    showSuccess(message) {
        console.log('Success:', message);
        const successDiv = document.getElementById('loginSuccess');
        if (successDiv) {
            successDiv.textContent = message;
            successDiv.style.display = 'block';
        }
        this.hideError();
    }

    hideError() {
        const errorDiv = document.getElementById('loginError');
        if (errorDiv) errorDiv.style.display = 'none';
    }

    hideSuccess() {
        const successDiv = document.getElementById('loginSuccess');
        if (successDiv) successDiv.style.display = 'none';
    }

    clearMessages() {
        this.hideError();
        this.hideSuccess();
    }

    showLoading(isLoading) {
        const loginBtn = document.getElementById('adminLoginBtn');
        if (loginBtn) {
            if (isLoading) {
                loginBtn.disabled = true;
                loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> <span>Signing in...</span>';
            } else {
                loginBtn.disabled = false;
                loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> <span>Access Dashboard</span>';
            }
        }
    }

    async loadAnalytics() {
        console.log('Loading analytics data...');
        
        try {
            if (!window.db) {
                console.error('Database not available for analytics');
                return;
            }

            // Set up real-time listener for reviews
            if (this.reviewsListener) {
                this.reviewsListener(); // Unsubscribe previous listener
            }

            this.reviewsListener = window.db.collection('reviews').onSnapshot((snapshot) => {
                console.log('Real-time reviews update received');
                const reviews = [];
                
                snapshot.forEach(doc => {
                    const data = doc.data();
                    const review = {
                        ...data,
                        id: doc.id,
                        createdAt: data.createdAt ? data.createdAt.toDate() : new Date()
                    };
                    reviews.push(review);
                    console.log('Real-time review:', review.id, 'Rating:', review.rating, 'Date:', review.createdAt);
                });

                console.log('Real-time analytics data loaded:', reviews.length, 'reviews');

                if (reviews.length === 0) {
                    console.warn('No reviews found in database for analytics');
                    this.showEmptyAnalytics();
                    return;
                }

                // Update stats in real-time
                document.getElementById('totalReviews').textContent = reviews.length;

                // Create charts with real-time data
                this.createRatingsChart(reviews);
                this.createTimeChart(reviews);
                this.createRoutesChart(reviews);
                this.createActivityChart(reviews);
            }, (error) => {
                console.error('Error setting up real-time listener:', error);
                this.showEmptyAnalytics();
            });

        } catch (error) {
            console.error('Error loading analytics:', error);
            this.showEmptyAnalytics();
        }
    }

    showEmptyAnalytics() {
        // Show a message when no data is available
        const chartContainers = ['ratingsChart', 'timeChart', 'routesChart', 'activityChart'];
        chartContainers.forEach(chartId => {
            const ctx = document.getElementById(chartId);
            if (ctx) {
                const parent = ctx.parentElement;
                parent.innerHTML = `
                    <h3>${parent.querySelector('h3')?.textContent || 'Chart'}</h3>
                    <div style="display: flex; align-items: center; justify-content: center; height: 300px; color: #64748b;">
                        <div style="text-align: center;">
                            <i class="fas fa-chart-line" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                            <p>No data available yet</p>
                            <p style="font-size: 0.9rem;">Charts will update as reviews are added</p>
                        </div>
                    </div>
                `;
            }
        });
    }

    createRatingsChart(reviews) {
        const ctx = document.getElementById('ratingsChart');
        if (!ctx) return;

        console.log('Creating ratings chart with', reviews.length, 'reviews');

        // Count ratings
        const ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        reviews.forEach(review => {
            const rating = review.rating || 0;
            if (rating >= 1 && rating <= 5) {
                ratingCounts[rating]++;
            }
        });

        console.log('Rating counts:', ratingCounts);

        // Destroy existing chart if it exists
        if (this.ratingsChart) {
            this.ratingsChart.destroy();
        }

        this.ratingsChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['1 Star', '2 Stars', '3 Stars', '4 Stars', '5 Stars'],
                datasets: [{
                    data: [ratingCounts[1], ratingCounts[2], ratingCounts[3], ratingCounts[4], ratingCounts[5]],
                    backgroundColor: [
                        '#FF6B6B',
                        '#FFA726',
                        '#FFEE58',
                        '#66BB6A',
                        '#42A5F5'
                    ],
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.parsed || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                                return `${label}: ${value} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }

    createTimeChart(reviews) {
        const ctx = document.getElementById('timeChart');
        if (!ctx) return;

        console.log('Creating time chart with', reviews.length, 'reviews');

        // Group reviews by month - include ALL reviews
        const monthCounts = {};
        
        // First, count all reviews by month
        reviews.forEach(review => {
            const reviewDate = review.createdAt;
            const monthKey = reviewDate.toISOString().slice(0, 7); // YYYY-MM
            monthCounts[monthKey] = (monthCounts[monthKey] || 0) + 1;
            console.log('Review from:', monthKey, 'Date:', reviewDate);
        });

        // Create a comprehensive month range including 2025 specific months
        const displayMonths = {};
        const now = new Date();
        
        // Always include June, July, August 2025 specifically
        const specificMonths = ['2025-06', '2025-07', '2025-08'];
        specificMonths.forEach(month => {
            displayMonths[month] = monthCounts[month] || 0;
        });
        
        // Add other months from the last 12 months
        for (let i = 11; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthKey = date.toISOString().slice(0, 7);
            if (!displayMonths.hasOwnProperty(monthKey)) {
                displayMonths[monthKey] = monthCounts[monthKey] || 0;
            }
        }
        
        // Sort months chronologically
        const sortedMonths = Object.keys(displayMonths).sort();
        const finalDisplayMonths = {};
        sortedMonths.forEach(month => {
            finalDisplayMonths[month] = displayMonths[month];
        });

        console.log('Month counts (including June/July/August 2025):', finalDisplayMonths);

        const labels = Object.keys(finalDisplayMonths).map(key => {
            const date = new Date(key + '-01');
            return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        });

        const data = Object.values(finalDisplayMonths);

        // Destroy existing chart if it exists
        if (this.timeChart) {
            this.timeChart.destroy();
        }

        this.timeChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Reviews',
                    data: data,
                    borderColor: '#667eea',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#667eea',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 4
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            title: function(context) {
                                return context[0].label;
                            },
                            label: function(context) {
                                return `Reviews: ${context.parsed.y}`;
                            }
                        }
                    }
                }
            }
        });
    }

    createRoutesChart(reviews) {
        const ctx = document.getElementById('routesChart');
        if (!ctx) return;

        // Count reviews by route
        const routeCounts = {};
        reviews.forEach(review => {
            const route = review.route || 'Unknown Route';
            routeCounts[route] = (routeCounts[route] || 0) + 1;
        });

        // Get top 5 routes
        const sortedRoutes = Object.entries(routeCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5);

        const labels = sortedRoutes.map(([route]) => route);
        const data = sortedRoutes.map(([, count]) => count);

        // Destroy existing chart if it exists
        if (this.routesChart) {
            this.routesChart.destroy();
        }

        this.routesChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Reviews',
                    data: data,
                    backgroundColor: [
                        '#667eea',
                        '#764ba2',
                        '#f093fb',
                        '#f5576c',
                        '#4facfe'
                    ],
                    borderRadius: 5
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    }

    createActivityChart(reviews) {
        const ctx = document.getElementById('activityChart');
        if (!ctx) return;

        // Count reviews by day of week
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const dayCounts = new Array(7).fill(0);

        reviews.forEach(review => {
            const dayOfWeek = review.createdAt.getDay();
            dayCounts[dayOfWeek]++;
        });

        // Destroy existing chart if it exists
        if (this.activityChart) {
            this.activityChart.destroy();
        }

        this.activityChart = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: dayNames,
                datasets: [{
                    label: 'User Activity',
                    data: dayCounts,
                    borderColor: '#667eea',
                    backgroundColor: 'rgba(102, 126, 234, 0.2)',
                    borderWidth: 2,
                    pointBackgroundColor: '#667eea',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2
                }]
            },
            options: {
                responsive: true,
                scales: {
                    r: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM ready, creating Fresh Admin Dashboard');
    window.adminDashboard = new FreshAdminDashboard();
    console.log('Fresh Admin Dashboard created');
});

// Fallback initialization
if (document.readyState !== 'loading') {
    console.log('Document already loaded, creating Fresh Admin Dashboard immediately');
    window.adminDashboard = new FreshAdminDashboard();
}

console.log('Fresh admin script loaded successfully');

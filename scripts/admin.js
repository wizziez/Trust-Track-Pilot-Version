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
        this.setupEventListeners();
        this.checkAuthStatus();
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
            await this.loadReviews();
            await this.loadUsers();
            await this.loadFeedback();
            await this.loadContacts();
            await this.loadContacts();
            
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
            if (window.db) {
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
                reviewsTable.innerHTML = '<p>Database not available</p>';
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

    async loadContacts() {
        const contactsTable = document.getElementById('contactsTable');
        if (!contactsTable) {
            console.error('Contacts table not found');
            return;
        }
        
        contactsTable.innerHTML = '<p>Loading contacts...</p>';
        
        try {
            if (window.db) {
                const snapshot = await window.db.collection('contacts').orderBy('createdAt', 'desc').limit(50).get();
                
                if (snapshot.empty) {
                    contactsTable.innerHTML = '<p>No contact messages found.</p>';
                    return;
                }
                
                let html = `
                    <div class="table-wrapper">
                        <table class="data-table-content">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Subject</th>
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
                            <td>${data.subject || 'No subject'}</td>
                            <td class="message-cell" title="${message}">${shortMessage}</td>
                            <td>${date}</td>
                            <td>
                                <button onclick="adminDashboard.deleteContact('${doc.id}')" class="action-btn delete-btn">
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
                contactsTable.innerHTML = html;
                console.log(`Loaded ${snapshot.size} contact messages`);
            } else {
                contactsTable.innerHTML = '<p>Database not available</p>';
            }
        } catch (error) {
            console.error('Error loading contacts:', error);
            contactsTable.innerHTML = '<p>Error loading contacts: ' + error.message + '</p>';
        }
    }

    async deleteReview(reviewId) {
        if (confirm('Are you sure you want to delete this review?')) {
            try {
                await window.db.collection('reviews').doc(reviewId).delete();
                this.showSuccess('Review deleted successfully');
                this.loadReviews(); // Reload
            } catch (error) {
                console.error('Error deleting review:', error);
                this.showError('Failed to delete review');
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

    async deleteContact(contactId) {
        if (confirm('Are you sure you want to delete this contact message?')) {
            try {
                await window.db.collection('contacts').doc(contactId).delete();
                this.showSuccess('Contact message deleted successfully');
                this.loadContacts(); // Reload
            } catch (error) {
                console.error('Error deleting contact:', error);
                this.showError('Failed to delete contact message');
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

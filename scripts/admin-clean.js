// Admin Panel Authentication and Management

// Prevent any uncaught errors from causing page refresh
window.addEventListener('error', (e) => {
    console.error('Global error caught:', e.error);
    e.preventDefault();
    return false;
});

window.addEventListener('unhandledrejection', (e) => {
    console.error('Unhandled promise rejection:', e.reason);
    e.preventDefault();
    return false;
});

class AdminDashboard {
    constructor() {
        console.log('AdminDashboard constructor called');
        this.isAuthenticated = false;
        this.currentAdmin = null;
        this.adminEmail = null;
        
        // Make globally accessible immediately
        window.adminDashboard = this;
        console.log('Set window.adminDashboard:', !!window.adminDashboard);
        console.log('handleLogin method exists:', typeof this.handleLogin);
        
        this.init();
    }

    init() {
        console.log('AdminDashboard init called');
        // Check if admin is already logged in
        this.checkAuthStatus();
        
        // Bind events
        this.bindEvents();
        
        // Load dashboard data if authenticated
        if (this.isAuthenticated) {
            this.showDashboard();
            this.loadDashboardData();
        }
        
        console.log('AdminDashboard init completed');
    }

    bindEvents() {
        console.log('Binding admin events...');
        
        const loginForm = document.getElementById('adminLoginForm');
        const loginButton = document.getElementById('adminLoginButton') || document.querySelector('.admin-login-btn');
        const togglePassword = document.getElementById('togglePassword');
        const logoutBtn = document.getElementById('logoutBtn');

        if (loginForm) {
            console.log('Admin login form found, adding event listeners');
            
            // Prevent any form submission
            loginForm.addEventListener('submit', (e) => {
                console.log('Admin form submit event triggered - PREVENTING');
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                return false;
            });
            
            // Handle button click
            if (loginButton) {
                console.log('Admin login button found, adding click listener');
                
                loginButton.addEventListener('click', (e) => {
                    console.log('Admin login button clicked');
                    e.preventDefault();
                    e.stopPropagation();
                    this.handleLogin(e);
                });
                
            } else {
                console.error('Admin login button not found!');
            }
            
            // Handle Enter key on form inputs
            const emailInput = document.getElementById('adminEmail');
            const passwordInput = document.getElementById('password');
            
            if (emailInput) {
                emailInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        this.handleLogin(e);
                    }
                });
            }
            
            if (passwordInput) {
                passwordInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        this.handleLogin(e);
                    }
                });
            }
            
        } else {
            console.error('Admin login form not found!');
        }

        if (togglePassword) {
            togglePassword.addEventListener('click', () => this.togglePasswordVisibility());
        }

        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.handleLogout());
        }
        
        // Bind tab switching
        this.bindTabSwitching();
    }

    checkAuthStatus() {
        const adminAuth = localStorage.getItem('adminAuth');
        const adminUser = localStorage.getItem('adminUser');
        const adminEmail = localStorage.getItem('adminEmail');
        const adminProvider = localStorage.getItem('adminProvider');
        
        if (adminAuth === 'true' && adminUser) {
            this.isAuthenticated = true;
            this.currentAdmin = adminUser;
            this.adminEmail = adminEmail;
            this.adminProvider = adminProvider;
        }
    }

    async handleLogin(e) {
        console.log('handleLogin called, preventing default...');
        
        // Ensure event is prevented regardless of source
        if (e) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
        }
        
        try {
            console.log('Admin login attempt started...');
            
            const email = document.getElementById('adminEmail')?.value?.trim();
            const password = document.getElementById('password')?.value;
            const errorDiv = document.getElementById('loginError');

            console.log('Email:', email);
            console.log('Password length:', password ? password.length : 0);

            if (!email || !password) {
                this.showError('Please enter both email and password');
                return false;
            }

            // Clear previous errors
            if (errorDiv) errorDiv.textContent = '';
            
            // Show loading state
            this.showLoading(true);

            try {
                // Check if FirebaseAuth is available
                if (typeof window.FirebaseAuth === 'undefined') {
                    console.error('FirebaseAuth not available');
                    throw new Error('Firebase authentication not available');
                }

                console.log('Firebase Auth available, attempting sign-in...');

                // Attempt Firebase sign-in
                const result = await window.FirebaseAuth.signInUser(email, password);
                
                console.log('Sign-in result:', result);
                
                if (result.success) {
                    const user = result.user;
                    console.log('User signed in:', user.uid, user.email);
                    
                    // Get user data from Firestore to check role
                    console.log('Getting user data from Firestore...');
                    const userData = await window.FirebaseAuth.getUserData(user.uid);
                    
                    console.log('User data result:', userData);
                    
                    if (userData.success && userData.data.role === 'admin') {
                        console.log('Admin role verified, logging in...');
                        // Successful admin login
                        this.isAuthenticated = true;
                        this.currentAdmin = userData.data.displayName || user.email.split('@')[0];
                        this.adminEmail = user.email;
                        
                        // Store auth state
                        localStorage.setItem('adminAuth', 'true');
                        localStorage.setItem('adminUser', this.currentAdmin);
                        localStorage.setItem('adminEmail', this.adminEmail);
                        localStorage.setItem('adminProvider', 'firebase');
                        
                        // Show success message
                        this.showMessage('Admin login successful! Loading dashboard...', 'success');
                        
                        // Load dashboard immediately 
                        try {
                            this.showDashboard();
                            await this.loadDashboardData();
                            console.log('Dashboard loaded successfully');
                        } catch (dashboardError) {
                            console.error('Dashboard loading error:', dashboardError);
                            // Don't let dashboard errors cause page refresh
                        }
                        
                    } else {
                        console.error('User role check failed:', userData);
                        // User exists but not admin
                        await window.FirebaseAuth.signOutUser();
                        this.showError('Access denied. This account does not have admin privileges.');
                    }
                } else {
                    console.error('Sign-in failed:', result.error);
                    this.showError(result.error || 'Login failed');
                }
                
            } catch (authError) {
                console.error('Authentication error:', authError);
                this.showError('Login failed: ' + authError.message);
            } finally {
                this.showLoading(false);
            }
            
        } catch (outerError) {
            console.error('Outer admin login error:', outerError);
            this.showError('An unexpected error occurred during login');
        }
        
        // Extra safety - ensure no form submission happens
        return false;
    }

    showDashboard() {
        console.log('Showing admin dashboard...');
        const loginSection = document.getElementById('adminLogin');
        const dashboardSection = document.getElementById('adminDashboard');
        
        if (loginSection && dashboardSection) {
            loginSection.style.display = 'none';
            dashboardSection.style.display = 'block';
            
            // Update admin name in header
            const adminNameElement = document.querySelector('.admin-name');
            if (adminNameElement && this.currentAdmin) {
                adminNameElement.textContent = this.currentAdmin;
            }
        }
    }

    async loadDashboardData() {
        console.log('Loading dashboard data...');
        // Load reviews, feedback, contacts data from Firestore
        // This would contain the actual data loading logic
        // For now, just show placeholder data
    }

    handleLogout() {
        console.log('Admin logout...');
        // Clear auth state
        localStorage.removeItem('adminAuth');
        localStorage.removeItem('adminUser');
        localStorage.removeItem('adminEmail');
        localStorage.removeItem('adminProvider');
        
        // Reset state
        this.isAuthenticated = false;
        this.currentAdmin = null;
        this.adminEmail = null;
        
        // Show login section
        const loginSection = document.getElementById('adminLogin');
        const dashboardSection = document.getElementById('adminDashboard');
        
        if (loginSection && dashboardSection) {
            loginSection.style.display = 'block';
            dashboardSection.style.display = 'none';
        }
        
        // Sign out from Firebase
        if (window.FirebaseAuth && typeof window.FirebaseAuth.signOutUser === 'function') {
            window.FirebaseAuth.signOutUser();
        }
    }

    togglePasswordVisibility() {
        const passwordInput = document.getElementById('password');
        const toggleBtn = document.getElementById('togglePassword');
        const icon = toggleBtn.querySelector('i');
        
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
        } else {
            passwordInput.type = 'password';
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
        }
    }

    showError(message) {
        console.error('Admin error:', message);
        const errorDiv = document.getElementById('loginError');
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.style.display = 'block';
        }
    }

    showMessage(message, type = 'info') {
        console.log('Admin message:', message);
        const errorDiv = document.getElementById('loginError');
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.className = 'error-message ' + type;
            errorDiv.style.display = 'block';
        }
    }

    bindTabSwitching() {
        const tabButtons = document.querySelectorAll('.tab-btn');
        const tabPanes = document.querySelectorAll('.tab-pane');

        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const targetTab = button.getAttribute('data-tab');
                
                // Remove active class from all buttons and panes
                tabButtons.forEach(btn => btn.classList.remove('active'));
                tabPanes.forEach(pane => pane.classList.remove('active'));
                
                // Add active class to clicked button and corresponding pane
                button.classList.add('active');
                const targetPane = document.getElementById(targetTab + 'Tab');
                if (targetPane) {
                    targetPane.classList.add('active');
                }
            });
        });
    }

    showLoading(isLoading) {
        const submitBtn = document.querySelector('.admin-login-btn');
        if (submitBtn) {
            if (isLoading) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> <span>Signing in...</span>';
            } else {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> <span>Access Dashboard</span>';
            }
        }
    }
}

// Initialize admin dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing admin dashboard...');
    if (!window.adminDashboard) {
        console.log('Creating new AdminDashboard instance...');
        new AdminDashboard();
        console.log('Admin dashboard initialized successfully');
    } else {
        console.log('Admin dashboard already exists');
    }
});

// Also initialize if DOM is already loaded
if (document.readyState !== 'loading') {
    console.log('Document already loaded, initializing immediately');
    if (!window.adminDashboard) {
        console.log('Creating new AdminDashboard instance...');
        new AdminDashboard();
    }
}

// Debug function for testing
window.debugAdminDashboard = function() {
    console.log('=== Admin Dashboard Debug Info ===');
    console.log('window.adminDashboard exists:', !!window.adminDashboard);
    console.log('window.adminDashboard:', window.adminDashboard);
    if (window.adminDashboard) {
        console.log('handleLogin method exists:', typeof window.adminDashboard.handleLogin);
        console.log('isAuthenticated:', window.adminDashboard.isAuthenticated);
        console.log('currentAdmin:', window.adminDashboard.currentAdmin);
    }
    
    const loginButton = document.getElementById('adminLoginButton') || document.querySelector('.admin-login-btn');
    console.log('Login button found:', !!loginButton);
    if (loginButton) {
        console.log('Login button id:', loginButton.id);
        console.log('Login button class:', loginButton.className);
    }
    
    const loginForm = document.getElementById('adminLoginForm');
    console.log('Login form found:', !!loginForm);
    
    console.log('=== End Debug Info ===');
};

// Authentication System for TrustTrack
class AuthSystem {
    constructor() {
        this.currentUser = null;
        this.users = this.loadUsers();
        this.init();
    }

    init() {
        this.checkAuthState();
        this.bindEvents();
        this.updateUI();
    }

    // Initialize sample users if none exist
    loadUsers() {
        let users = JSON.parse(localStorage.getItem('trusttrack_users') || '[]');
        
        // Add sample users if empty
        if (users.length === 0) {
            users = [
                {
                    id: 1,
                    name: 'John Doe',
                    email: 'john@example.com',
                    password: 'password123',
                    avatar: 'https://via.placeholder.com/50',
                    joinDate: new Date().toISOString(),
                    reviewsCount: 5,
                    isVerified: true
                },
                {
                    id: 2,
                    name: 'Sarah Khan',
                    email: 'sarah@example.com',
                    password: 'password123',
                    avatar: 'https://via.placeholder.com/50',
                    joinDate: new Date().toISOString(),
                    reviewsCount: 12,
                    isVerified: true
                }
            ];
            this.saveUsers(users);
        }
        
        return users;
    }

    saveUsers(users) {
        localStorage.setItem('trusttrack_users', JSON.stringify(users));
    }    checkAuthState() {
        const savedUser = localStorage.getItem('trusttrack_current_user');
        if (savedUser) {
            this.currentUser = JSON.parse(savedUser);
        }
        
        // Check if admin logged out and clear user session
        const adminAuth = localStorage.getItem('adminAuth');
        if (adminAuth === null && this.currentUser) {
            // Admin logged out, clear user session too
            this.logout();
        }
    }    bindEvents() {
        // Modal controls
        document.addEventListener('click', (e) => {
            if (e.target.matches('#loginBtn') || e.target.closest('#loginBtn')) {
                e.preventDefault();
                if (this.currentUser) {
                    this.showUserMenu(e);
                } else {
                    this.openModal('loginModal');
                }
            }
            
            if (e.target.matches('#signupBtn') || e.target.closest('#signupBtn')) {
                e.preventDefault();
                this.openModal('signupModal');
            }
            
            if (e.target.matches('.close-modal') || e.target.closest('.close-modal')) {
                e.preventDefault();
                const modalId = e.target.dataset.modal || e.target.closest('.close-modal').dataset.modal;
                this.closeModal(modalId);
            }
            
            if (e.target.matches('#switchToSignup')) {
                e.preventDefault();
                this.switchModal('loginModal', 'signupModal');
            }
            
            if (e.target.matches('#switchToLogin')) {
                e.preventDefault();
                this.switchModal('signupModal', 'loginModal');
            }
            
            // Handle user menu button click (when logged in)
            if ((e.target.matches('.login-btn.logged-in') || e.target.closest('.login-btn.logged-in')) && this.currentUser) {
                e.preventDefault();
                this.showUserMenu(e);
            }
            
            if (e.target.matches('#logoutUser')) {
                e.preventDefault();
                this.logout();
            }
        });

        // Form submissions
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        const signupForm = document.getElementById('signupForm');
        if (signupForm) {
            signupForm.addEventListener('submit', (e) => this.handleSignup(e));
        }

        // Close modals on outside click
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('auth-modal')) {
                this.closeModal(e.target.id);
            }
        });
    }

    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
            // Add active class after a small delay for animation
            setTimeout(() => {
                modal.classList.add('active');
                // Focus the first input in the modal for immediate interaction
                const firstInput = modal.querySelector('input, select, textarea, button');
                if (firstInput) {
                    firstInput.focus();
                }
            }, 10);
        }
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
            // Wait for animation to complete before hiding
            setTimeout(() => {
                modal.style.display = 'none';
                document.body.style.overflow = 'auto';
                this.clearFormErrors(modal);
            }, 300);
        }
    }

    switchModal(fromModal, toModal) {
        this.closeModal(fromModal);
        setTimeout(() => this.openModal(toModal), 100);
    }

    handleLogin(e) {
        e.preventDefault();
        const form = e.target;
        const formData = new FormData(form);
        const email = formData.get('email');
        const password = formData.get('password');
        const remember = formData.get('remember');

        this.clearFormErrors(form);

        // Find user
        const user = this.users.find(u => u.email === email && u.password === password);
        
        if (user) {
            this.currentUser = user;
            localStorage.setItem('trusttrack_current_user', JSON.stringify(user));
            
            if (remember) {
                localStorage.setItem('trusttrack_remember_user', 'true');
            }
            
            this.closeModal('loginModal');
            this.updateUI();
            this.showSuccessMessage('Welcome back, ' + user.name + '!');
        } else {
            this.showFormError(form, 'Invalid email or password');
        }
    }

    handleSignup(e) {
        e.preventDefault();
        const form = e.target;
        const formData = new FormData(form);
        const name = formData.get('name');
        const email = formData.get('email');
        const password = formData.get('password');
        const confirmPassword = formData.get('confirmPassword');
        const terms = formData.get('terms');

        this.clearFormErrors(form);

        // Validation
        if (!name || !email || !password || !confirmPassword) {
            this.showFormError(form, 'All fields are required');
            return;
        }

        if (password !== confirmPassword) {
            this.showFormError(form, 'Passwords do not match');
            return;
        }

        if (password.length < 6) {
            this.showFormError(form, 'Password must be at least 6 characters');
            return;
        }

        if (!terms) {
            this.showFormError(form, 'You must agree to the terms and conditions');
            return;
        }

        // Check if user already exists
        if (this.users.find(u => u.email === email)) {
            this.showFormError(form, 'An account with this email already exists');
            return;
        }

        // Create new user
        const newUser = {
            id: Date.now(),
            name: name,
            email: email,
            password: password,
            avatar: 'https://via.placeholder.com/50',
            joinDate: new Date().toISOString(),
            reviewsCount: 0,
            isVerified: false
        };

        this.users.push(newUser);
        this.saveUsers(this.users);
        this.currentUser = newUser;
        localStorage.setItem('trusttrack_current_user', JSON.stringify(newUser));

        this.closeModal('signupModal');
        this.updateUI();
        this.showSuccessMessage('Account created successfully! Welcome to TrustTrack, ' + newUser.name + '!');    }    logout() {
        this.currentUser = null;
        localStorage.removeItem('trusttrack_current_user');
        localStorage.removeItem('trusttrack_remember_user');
        
        // Also clear admin auth if exists
        localStorage.removeItem('adminAuth');
        localStorage.removeItem('adminUser');
        
        this.updateUI();
        this.showSuccessMessage('Logged out successfully');
    }

    isLoggedIn() {
        return this.currentUser !== null;
    }

    updateUI() {
        const authButtons = document.querySelector('.auth-buttons');
        const loginBtn = document.getElementById('loginBtn');
        const signupBtn = document.getElementById('signupBtn');
        
        if (!authButtons) return;

        if (this.currentUser) {
            // User is logged in - show user menu button
            authButtons.innerHTML = `
                <button class="login-btn logged-in" id="loginBtn">
                    <div class="user-avatar">
                        <img src="${this.currentUser.avatar}" alt="${this.currentUser.name}">
                    </div>
                    <span>${this.currentUser.name.split(' ')[0]}</span>
                    <i class="fas fa-chevron-down"></i>
                </button>
            `;
        } else {
            // User is not logged in - show login and signup buttons
            authButtons.innerHTML = `
                <button class="login-btn" id="loginBtn">Login</button>
                <button class="signup-btn" id="signupBtn">Sign Up</button>
            `;
        }
    }    showUserMenu(e) {
        e.preventDefault();
        const existingMenu = document.querySelector('.user-menu');
        if (existingMenu) {
            existingMenu.remove();
            return;
        }

        const menu = document.createElement('div');
        menu.className = 'user-menu';
        menu.innerHTML = `
            <div class="user-info">
                <img src="${this.currentUser.avatar}" alt="${this.currentUser.name}">
                <div>
                    <div class="user-name">${this.currentUser.name}</div>
                    <div class="user-email">${this.currentUser.email}</div>
                </div>
            </div>
            <div class="menu-divider"></div>
            <a href="#" class="menu-item">
                <i class="fas fa-user"></i>
                My Profile
            </a>
            <a href="#" class="menu-item">
                <i class="fas fa-star"></i>
                My Reviews (${this.currentUser.reviewsCount})
            </a>
            <a href="#" class="menu-item">
                <i class="fas fa-cog"></i>
                Settings
            </a>
            <div class="menu-divider"></div>
            <a href="#" class="menu-item" id="logoutUser">
                <i class="fas fa-sign-out-alt"></i>
                Logout
            </a>
        `;

        const authButtons = document.querySelector('.auth-buttons');
        authButtons.style.position = 'relative';
        authButtons.appendChild(menu);

        // Close menu on outside click
        setTimeout(() => {
            document.addEventListener('click', function closeMenu(e) {
                if (!menu.contains(e.target) && !authButtons.contains(e.target)) {
                    menu.remove();
                    document.removeEventListener('click', closeMenu);
                }
            });
        }, 0);
    }

    showFormError(form, message) {
        let errorDiv = form.querySelector('.auth-error');
        if (!errorDiv) {
            errorDiv = document.createElement('div');
            errorDiv.className = 'auth-error';
            form.appendChild(errorDiv);
        }
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
    }

    clearFormErrors(form) {
        const errorDiv = form.querySelector('.auth-error');
        if (errorDiv) {
            errorDiv.style.display = 'none';
        }
    }

    showSuccessMessage(message) {
        // Create or update success notification
        let notification = document.querySelector('.auth-notification');
        if (!notification) {
            notification = document.createElement('div');
            notification.className = 'auth-notification success';
            document.body.appendChild(notification);
        }

        notification.innerHTML = `
            <i class="fas fa-check-circle"></i>
            <span>${message}</span>
        `;
        notification.style.display = 'flex';

        // Auto hide after 3 seconds
        setTimeout(() => {
            notification.style.display = 'none';
        }, 3000);
    }

    // Public methods for other scripts
    getCurrentUser() {
        return this.currentUser;
    }

    isLoggedIn() {
        return this.currentUser !== null;
    }

    requireAuth(callback) {
        if (this.isLoggedIn()) {
            callback();
        } else {
            this.openModal('loginModal');
            this.showFormError(document.getElementById('loginForm'), 'Please login to continue');
        }
    }
}

// Initialize authentication system
const auth = new AuthSystem();

// Make it globally available
window.TrustTrackAuth = auth;

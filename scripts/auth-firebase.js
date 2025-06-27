// Authentication System for TrustTrack with Firebase Integration
import { initAuthObserver, signUpUser, signInUser, signOutUser, getUserData } from './firebase-config.js';

class AuthSystem {
    constructor() {
        this.currentUser = null;
        this.userData = null;
        this.userRole = null;
        this.init();
    }

    init() {
        this.initAuthObserver();
        this.bindEvents();
        this.createModals();
    }

    initAuthObserver() {
        initAuthObserver((user) => {
            this.currentUser = user;
            if (user) {
                this.loadUserData();
            }
            this.updateUI();
        });
    }

    async loadUserData() {
        if (this.currentUser) {
            const result = await getUserData(this.currentUser.uid);
            if (result.success) {
                this.userData = result.data;
                this.userRole = result.data.role || 'user';
            }
        }
    }

    bindEvents() {
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
            setTimeout(() => {
                modal.classList.add('active');
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

    async handleLogin(e) {
        e.preventDefault();
        const form = e.target;
        const formData = new FormData(form);
        const email = formData.get('email');
        if (email === 'raiyansarwar022@gmail.com') {
            this.showFormError(form, 'This email is reserved for admin and cannot be used for user login.');
            return;
        }
        const password = formData.get('password');

        this.clearFormErrors(form);
        this.showLoading(form);

        try {
            const result = await signInUser(email, password);
            
            if (result.success) {
                this.closeModal('loginModal');
                this.showSuccessMessage('Welcome back!');
                // Redirect to dashboard
                setTimeout(() => {
                    window.location.href = '/pages/dashboard.html';
                }, 1000);
            } else {
                this.showFormError(form, result.error);
            }
        } catch (error) {
            this.showFormError(form, 'An unexpected error occurred. Please try again.');
        }

        this.hideLoading(form);
    }

    async handleSignup(e) {
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
        if (!name || name.trim().length < 2) {
            this.showFormError(form, 'Name must be at least 2 characters long');
            return;
        }

        if (!email || !this.isValidEmail(email)) {
            this.showFormError(form, 'Please enter a valid email address');
            return;
        }

        if (!password || password.length < 6) {
            this.showFormError(form, 'Password must be at least 6 characters long');
            return;
        }

        if (password !== confirmPassword) {
            this.showFormError(form, 'Passwords do not match');
            return;
        }

        if (!terms) {
            this.showFormError(form, 'You must agree to the Terms of Service');
            return;
        }

        this.showLoading(form);

        try {
            const result = await signUpUser(email, password, name.trim());
            
            if (result.success) {
                this.closeModal('signupModal');
                this.showSuccessMessage('Account created successfully! Welcome to TrustTrack!');
                // Redirect to dashboard
                setTimeout(() => {
                    window.location.href = '/pages/dashboard.html';
                }, 1000);
            } else {
                this.showFormError(form, result.error);
            }
        } catch (error) {
            this.showFormError(form, 'An unexpected error occurred. Please try again.');
        }

        this.hideLoading(form);
    }

    async logout() {
        try {
            const result = await signOutUser();
            if (result.success) {
                this.showSuccessMessage('Logged out successfully');
                // Redirect to home page
                setTimeout(() => {
                    window.location.href = '/index.html';
                }, 1000);
            }
        } catch (error) {
            console.error('Logout error:', error);
        }
    }    updateUI() {
        const loginBtn = document.getElementById('loginBtn');
        const signupBtn = document.getElementById('signupBtn');
        const dashboardLink = document.getElementById('dashboardLink');
        
        if (this.currentUser) {
            // User is logged in
            const userName = this.currentUser.displayName || this.currentUser.email.split('@')[0];
            
            if (loginBtn) {
                loginBtn.innerHTML = `<i class="fas fa-user"></i> ${userName}`;
                loginBtn.classList.add('logged-in');
            }
            
            if (signupBtn) {
                signupBtn.style.display = 'none';
            }
            
            if (dashboardLink) {
                dashboardLink.style.display = 'inline-block';
            }
            
            // Show logout option in user menu
            this.showUserMenu();
        } else {
            // User is not logged in
            if (loginBtn) {
                loginBtn.innerHTML = 'Login';
                loginBtn.classList.remove('logged-in');
            }
            
            if (signupBtn) {
                signupBtn.style.display = 'inline-block';
            }
            
            if (dashboardLink) {
                dashboardLink.style.display = 'none';
            }
        }
    }

    showUserMenu() {
        // Create or show user dropdown menu
        let userMenu = document.getElementById('userMenu');
        if (!userMenu && this.currentUser) {
            userMenu = document.createElement('div');
            userMenu.id = 'userMenu';
            userMenu.className = 'user-dropdown';
            userMenu.innerHTML = `
                <a href="pages/dashboard.html"><i class="fas fa-tachometer-alt"></i> Dashboard</a>
                <a href="pages/profile.html"><i class="fas fa-user"></i> Profile</a>
                <a href="#" id="logoutUser"><i class="fas fa-sign-out-alt"></i> Logout</a>
            `;
            
            // Position the menu
            const loginBtn = document.getElementById('loginBtn');
            if (loginBtn) {
                loginBtn.parentNode.insertBefore(userMenu, loginBtn.nextSibling);
            }
        }
    }

    showFormError(form, message) {
        let errorDiv = form.querySelector('.form-error');
        if (!errorDiv) {
            errorDiv = document.createElement('div');
            errorDiv.className = 'form-error';
            form.insertBefore(errorDiv, form.firstChild);
        }
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
    }

    clearFormErrors(form) {
        const errorDiv = form.querySelector('.form-error');
        if (errorDiv) {
            errorDiv.style.display = 'none';
        }
    }

    showLoading(form) {
        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Please wait...';
        }
    }

    hideLoading(form) {
        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = false;
            const isLogin = form.id === 'loginForm';
            submitBtn.innerHTML = isLogin ? 'Sign In' : 'Create Account';
        }
    }

    showSuccessMessage(message) {
        // Create or update success message
        let successDiv = document.getElementById('successMessage');
        if (!successDiv) {
            successDiv = document.createElement('div');
            successDiv.id = 'successMessage';
            successDiv.className = 'success-message';
            document.body.appendChild(successDiv);
        }
        
        successDiv.textContent = message;
        successDiv.style.display = 'block';
        
        // Auto-hide after 3 seconds
        setTimeout(() => {
            successDiv.style.display = 'none';
        }, 3000);
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    createModals() {
        // Create modals if they don't exist
        if (!document.getElementById('loginModal')) {
            this.createLoginModal();
        }
        if (!document.getElementById('signupModal')) {
            this.createSignupModal();
        }
    }

    createLoginModal() {
        const modal = document.createElement('div');
        modal.id = 'loginModal';
        modal.className = 'auth-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Welcome Back</h2>
                    <button class="close-modal" data-modal="loginModal">&times;</button>
                </div>
                <form id="loginForm" class="auth-form">
                    <div class="form-group">
                        <input type="email" name="email" placeholder="Email Address" required>
                    </div>
                    <div class="form-group">
                        <input type="password" name="password" placeholder="Password" required>
                    </div>
                    <button type="submit" class="auth-btn">Sign In</button>
                </form>
                <div class="modal-footer">
                    <p>Don't have an account? <a href="#" id="switchToSignup">Sign up</a></p>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    createSignupModal() {
        const modal = document.createElement('div');
        modal.id = 'signupModal';
        modal.className = 'auth-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Join TrustTrack</h2>
                    <button class="close-modal" data-modal="signupModal">&times;</button>
                </div>
                <form id="signupForm" class="auth-form">
                    <div class="form-group">
                        <input type="text" name="name" placeholder="Full Name" required>
                    </div>
                    <div class="form-group">
                        <input type="email" name="email" placeholder="Email Address" required>
                    </div>
                    <div class="form-group">
                        <input type="password" name="password" placeholder="Password" required>
                    </div>
                    <div class="form-group">
                        <input type="password" name="confirmPassword" placeholder="Confirm Password" required>
                    </div>
                    <div class="form-group checkbox-group">
                        <input type="checkbox" name="terms" id="terms" required>
                        <label for="terms">I agree to the Terms of Service</label>
                    </div>
                    <button type="submit" class="auth-btn">Create Account</button>
                </form>
                <div class="modal-footer">
                    <p>Already have an account? <a href="#" id="switchToLogin">Sign in</a></p>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    isAdmin() {
        return this.userRole === 'admin';
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new AuthSystem();
});

export default AuthSystem;

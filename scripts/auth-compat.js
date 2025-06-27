// Authentication System for TrustTrack with Firebase Integration (Compat version)
class AuthSystem {
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
        this.createModals();
    }

    initAuthObserver() {
        window.FirebaseAuth.onAuthStateChanged((user) => {
            this.currentUser = user;
            if (user) {
                this.loadUserData();
            }
            this.updateUI();
        });
    }

    async loadUserData() {
        if (this.currentUser) {
            const result = await window.FirebaseAuth.getUserData(this.currentUser.uid);
            if (result.success) {
                this.userData = result.data;
            }
        }
    }    bindEvents() {
        // Modal controls
        document.addEventListener('click', (e) => {
            if (e.target.matches('#loginBtn') || e.target.closest('#loginBtn')) {
                e.preventDefault();
                if (this.currentUser) {
                    this.toggleUserMenu(e);
                } else {
                    this.openModal('loginModal');
                }
            }
            
            if (e.target.matches('#signupBtn') || e.target.closest('#signupBtn')) {
                e.preventDefault();
                this.openModal('signupModal');
            }
            
            // Handle dashboard link click
            if (e.target.matches('#dashboardLink') || e.target.closest('#dashboardLink')) {
                e.preventDefault();
                if (this.currentUser) {
                    this.navigateToDashboard();
                } else {
                    this.openModal('loginModal');
                }
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
        document.addEventListener('submit', (e) => {
            if (e.target.id === 'loginForm') {
                e.preventDefault();
                this.handleLogin(e);
            }
            if (e.target.id === 'signupForm') {
                e.preventDefault();
                this.handleSignup(e);
            }
        });

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
                const firstInput = modal.querySelector('input[type="email"], input[type="text"]');
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
            const result = await window.FirebaseAuth.signInUser(email, password);
            
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
            const result = await window.FirebaseAuth.signUpUser(email, password, name.trim());
            
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
            const result = await window.FirebaseAuth.signOutUser();
            if (result.success) {
                this.showSuccessMessage('Logged out successfully');
                // Hide user menu
                const userMenu = document.getElementById('userMenu');
                if (userMenu) {
                    userMenu.remove();
                }
                // Redirect to home page after a delay
                setTimeout(() => {
                    window.location.href = '/index.html';
                }, 1000);
            }
        } catch (error) {
            console.error('Logout error:', error);
        }
    }

    updateUI() {
        const loginBtn = document.getElementById('loginBtn');
        const signupBtn = document.getElementById('signupBtn');
        const dashboardLink = document.getElementById('dashboardLink');        if (this.currentUser) {
            // User is logged in
            const userName = this.currentUser.displayName || this.currentUser.email.split('@')[0];
            
            if (loginBtn) {
                loginBtn.innerHTML = `<i class="fas fa-user"></i> ${userName}`;
                loginBtn.classList.add('logged-in');
                loginBtn.style.cursor = 'pointer';
            }
            
            if (signupBtn) {
                signupBtn.style.display = 'none';
            }
            
            if (dashboardLink) {
                dashboardLink.style.display = 'inline-block';
            }
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
            
            // Remove user menu if it exists
            const userMenu = document.getElementById('userMenu');
            if (userMenu) {
                userMenu.remove();
            }
        }
    }

    toggleUserMenu(e) {
        e.stopPropagation();
        let userMenu = document.getElementById('userMenu');
        
        if (userMenu) {
            userMenu.remove();
        } else {
            this.showUserMenu(e);
        }
    }    showUserMenu(e) {
        // Remove any existing menu first
        const existingMenu = document.getElementById('userMenu');
        if (existingMenu) {
            existingMenu.remove();
        }

        // Create user dropdown menu
        const userMenu = document.createElement('div');
        userMenu.id = 'userMenu';
        userMenu.className = 'user-dropdown show';
        
        // Create dashboard link with proper navigation
        const dashboardLink = document.createElement('a');
        dashboardLink.innerHTML = '<i class="fas fa-tachometer-alt"></i> Dashboard';
        dashboardLink.href = '#';
        dashboardLink.onclick = (e) => {
            e.preventDefault();
            this.navigateToDashboard();
            userMenu.remove();
        };
          
        // Create profile link
        const profileLink = document.createElement('a');
        profileLink.innerHTML = '<i class="fas fa-user"></i> Profile';
        profileLink.href = '#';
        profileLink.onclick = (e) => {
            e.preventDefault();
            this.navigateToProfile();
            userMenu.remove();
        };
        
        // Create logout link
        const logoutLink = document.createElement('a');
        logoutLink.innerHTML = '<i class="fas fa-sign-out-alt"></i> Logout';
        logoutLink.href = '#';
        logoutLink.onclick = (e) => {
            e.preventDefault();
            this.logout();
            userMenu.remove();
        };
        
        userMenu.appendChild(dashboardLink);
        userMenu.appendChild(profileLink);
        userMenu.appendChild(logoutLink);
        
        // Position the menu relative to the login button
        const loginBtn = document.getElementById('loginBtn');
        if (loginBtn) {
            // Make sure the parent container is positioned
            const navActions = loginBtn.closest('.nav-actions');
            if (navActions) {
                navActions.style.position = 'relative';
                navActions.appendChild(userMenu);
            } else {
                loginBtn.style.position = 'relative';
                loginBtn.appendChild(userMenu);
            }
        }

        // Close menu when clicking outside
        setTimeout(() => {
            const closeHandler = (e) => {
                if (!e.target.closest('#userMenu') && !e.target.closest('#loginBtn')) {
                    const menu = document.getElementById('userMenu');
                    if (menu) {
                        menu.remove();
                        document.removeEventListener('click', closeHandler);
                    }
                }
            };
            document.addEventListener('click', closeHandler);
        }, 100);
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
            submitBtn.setAttribute('data-original-text', submitBtn.innerHTML);
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Please wait...';
        }
    }

    hideLoading(form) {
        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = false;
            const originalText = submitBtn.getAttribute('data-original-text');
            if (originalText) {
                submitBtn.innerHTML = originalText;
            }
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
            if (successDiv) {
                successDiv.style.display = 'none';
            }
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
                    <button class="close-modal" data-modal="loginModal" type="button">&times;</button>
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
                    <button class="close-modal" data-modal="signupModal" type="button">&times;</button>
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
    }    navigateToDashboard() {
        const currentPath = window.location.pathname;
        
        // Determine correct path to dashboard
        if (currentPath.includes('/pages/') || 
            currentPath.endsWith('/dashboard.html') || 
            currentPath.endsWith('/login.html') || 
            currentPath.endsWith('/signup.html')) {
            // We're already in the pages folder
            window.location.href = './dashboard.html';
        } else {
            // We're in the root folder
            window.location.href = '/pages/dashboard.html';
        }
    }    navigateToProfile() {
        const currentPath = window.location.pathname;
        
        // Determine correct path to profile
        if (currentPath.includes('/pages/') || 
            currentPath.endsWith('/dashboard.html') || 
            currentPath.endsWith('/profile.html') ||
            currentPath.endsWith('/login.html') || 
            currentPath.endsWith('/signup.html')) {
            // We're already in the pages folder
            window.location.href = './profile.html';
        } else {
            // We're in the root folder
            window.location.href = '/pages/profile.html';
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new AuthSystem();
});

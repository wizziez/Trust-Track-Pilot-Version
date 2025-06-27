import { signInUser, initAuthObserver } from '../scripts/firebase-config.js';

class LoginPage {
    constructor() {
        this.init();
    }

    init() {
        this.checkAuthState();
        this.bindEvents();
    }    checkAuthState() {
        initAuthObserver((user) => {
            if (user) {
                // User is already logged in, redirect to dashboard
                window.location.href = './dashboard.html';
            }
        });
    }

    bindEvents() {
        const loginForm = document.querySelector('.auth-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }
    }

    async handleLogin(e) {
        e.preventDefault();
        const form = e.target;
        const formData = new FormData(form);
        const email = formData.get('email');
        if (email === 'raiyansarwar022@gmail.com') {
            this.showFormError('This email is reserved for admin and cannot be used for user login.');
            return;
        }
        const password = formData.get('password');

        this.clearFormErrors();
        this.showLoading(true);

        try {
            const result = await signInUser(email, password);
              if (result.success) {
                this.showSuccessMessage('Login successful! Redirecting...');
                // Redirect to dashboard
                setTimeout(() => {
                    window.location.href = '/pages/dashboard.html';
                }, 1000);
            } else {
                this.showFormError(result.error);
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showFormError('An unexpected error occurred. Please try again.');
        }

        this.showLoading(false);
    }

    showFormError(message) {
        let errorDiv = document.querySelector('.form-error');
        if (!errorDiv) {
            errorDiv = document.createElement('div');
            errorDiv.className = 'form-error';
            errorDiv.style.cssText = `
                background: #fee2e2;
                border: 1px solid #fecaca;
                color: #dc2626;
                padding: 0.75rem;
                border-radius: 0.5rem;
                margin-bottom: 1rem;
                font-size: 0.9rem;
            `;
            const form = document.querySelector('.auth-form');
            form.insertBefore(errorDiv, form.firstChild);
        }
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
    }

    clearFormErrors() {
        const errorDiv = document.querySelector('.form-error');
        if (errorDiv) {
            errorDiv.style.display = 'none';
        }
    }

    showLoading(isLoading) {
        const submitBtn = document.querySelector('.auth-btn');
        if (submitBtn) {
            if (isLoading) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing in...';
            } else {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Sign In';
            }
        }
    }

    showSuccessMessage(message) {
        let successDiv = document.querySelector('.success-message');
        if (!successDiv) {
            successDiv = document.createElement('div');
            successDiv.className = 'success-message';
            successDiv.style.cssText = `
                background: #d1fae5;
                border: 1px solid #a7f3d0;
                color: #065f46;
                padding: 0.75rem;
                border-radius: 0.5rem;
                margin-bottom: 1rem;
                font-size: 0.9rem;
            `;
            const form = document.querySelector('.auth-form');
            form.insertBefore(successDiv, form.firstChild);
        }
        successDiv.textContent = message;
        successDiv.style.display = 'block';
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new LoginPage();
});

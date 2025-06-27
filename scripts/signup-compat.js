// Signup page functionality with Firebase compat
class SignupPage {
    constructor() {
        this.init();
    }

    init() {
        // Wait for Firebase to be ready
        if (typeof firebase === 'undefined') {
            setTimeout(() => this.init(), 100);
            return;
        }
        this.checkAuthState();
        this.bindEvents();
    }    checkAuthState() {
        window.FirebaseAuth.onAuthStateChanged((user) => {
            if (user) {
                // User is already logged in, redirect to dashboard
                window.location.href = '/pages/dashboard.html';
            }
        });
    }

    bindEvents() {
        const signupForm = document.querySelector('.auth-form');
        if (signupForm) {
            signupForm.addEventListener('submit', (e) => this.handleSignup(e));
        }
    }

    async handleSignup(e) {
        e.preventDefault();
        const form = e.target;
        const formData = new FormData(form);
        const name = formData.get('name');
        const email = formData.get('email');
        const password = formData.get('password');
        const confirmPassword = formData.get('confirmPassword');

        this.clearFormErrors();

        // Validation
        if (!name || name.trim().length < 2) {
            this.showFormError('Name must be at least 2 characters long');
            return;
        }

        if (!email || !this.isValidEmail(email)) {
            this.showFormError('Please enter a valid email address');
            return;
        }

        if (!password || password.length < 6) {
            this.showFormError('Password must be at least 6 characters long');
            return;
        }

        if (password !== confirmPassword) {
            this.showFormError('Passwords do not match');
            return;
        }

        this.showLoading(true);

        try {
            const result = await window.FirebaseAuth.signUpUser(email, password, name.trim());
              if (result.success) {
                this.showSuccessMessage('Account created successfully! Redirecting...');
                // Redirect to dashboard
                setTimeout(() => {
                    window.location.href = '/pages/dashboard.html';
                }, 1000);
            } else {
                this.showFormError(result.error);
            }
        } catch (error) {
            console.error('Signup error:', error);
            this.showFormError('An unexpected error occurred. Please try again.');
        }

        this.showLoading(false);
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
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
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating account...';
            } else {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fas fa-user-plus"></i> Create Account';
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
    new SignupPage();
});

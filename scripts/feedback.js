// Feedback Page JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Mobile menu toggle
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const navLinks = document.querySelector('.nav-links');

    if (mobileMenuToggle) {
        mobileMenuToggle.addEventListener('click', function() {
            navLinks.classList.toggle('active');
        });
    }

    // Star rating functionality
    const ratingGroups = document.querySelectorAll('.rating-stars');
    
    ratingGroups.forEach(group => {
        const stars = group.querySelectorAll('.star');
        let currentRating = 0;
        
        stars.forEach((star, index) => {
            star.addEventListener('click', function() {
                currentRating = index + 1;
                updateStars(stars, currentRating);
                
                // Store rating in hidden input or data attribute
                const ratingInput = group.nextElementSibling;
                if (ratingInput && ratingInput.type === 'hidden') {
                    ratingInput.value = currentRating;
                }
            });
            
            star.addEventListener('mouseover', function() {
                updateStars(stars, index + 1);
            });
        });
        
        group.addEventListener('mouseleave', function() {
            updateStars(stars, currentRating);
        });
    });

    function updateStars(stars, rating) {
        stars.forEach((star, index) => {
            if (index < rating) {
                star.classList.add('active');
            } else {
                star.classList.remove('active');
            }
        });
    }

    // FAQ toggle functionality
    const faqItems = document.querySelectorAll('.faq-item');
    
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        
        question.addEventListener('click', function() {
            const isActive = item.classList.contains('active');
            
            // Close all other FAQ items
            faqItems.forEach(otherItem => {
                if (otherItem !== item) {
                    otherItem.classList.remove('active');
                }
            });
            
            // Toggle current item
            if (isActive) {
                item.classList.remove('active');
            } else {
                item.classList.add('active');
            }
        });
    });

    // Form submission handling
    const feedbackForm = document.getElementById('feedbackForm');
    const successMessage = document.querySelector('.success-message');
    
    if (feedbackForm) {
        feedbackForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form data
            const formData = new FormData(feedbackForm);
            const feedbackData = {
                name: formData.get('name'),
                email: formData.get('email'),
                subject: formData.get('subject'),
                category: formData.get('category'),
                message: formData.get('message'),
                rating: formData.get('rating') || 0,
                timestamp: new Date().toISOString(),
                id: Date.now()
            };
            
            // Validate form
            if (!validateForm(feedbackData)) {
                return;
            }
            
            // Save to localStorage
            saveFeedback(feedbackData);
            
            // Show success message
            showSuccessMessage();
            
            // Reset form
            feedbackForm.reset();
            resetStarRatings();
        });
    }

    function validateForm(data) {
        const errors = [];
        
        if (!data.name.trim()) {
            errors.push('Name is required');
        }
        
        if (!data.email.trim()) {
            errors.push('Email is required');
        } else if (!isValidEmail(data.email)) {
            errors.push('Please enter a valid email address');
        }
        
        if (!data.subject.trim()) {
            errors.push('Subject is required');
        }
        
        if (!data.message.trim()) {
            errors.push('Message is required');
        }
        
        if (errors.length > 0) {
            alert('Please fix the following errors:\n' + errors.join('\n'));
            return false;
        }
        
        return true;
    }

    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    function saveFeedback(feedbackData) {
        let feedbacks = JSON.parse(localStorage.getItem('trusttrack_feedbacks') || '[]');
        feedbacks.push(feedbackData);
        localStorage.setItem('trusttrack_feedbacks', JSON.stringify(feedbacks));
    }

    function showSuccessMessage() {
        if (successMessage) {
            successMessage.classList.add('show');
            
            setTimeout(() => {
                successMessage.classList.remove('show');
            }, 5000);
        }
    }

    function resetStarRatings() {
        ratingGroups.forEach(group => {
            const stars = group.querySelectorAll('.star');
            stars.forEach(star => {
                star.classList.remove('active');
            });
        });
    }

    // Auto-expand textareas
    const textareas = document.querySelectorAll('textarea');
    textareas.forEach(textarea => {
        textarea.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = (this.scrollHeight) + 'px';
        });
    });

    // Form field animations
    const formInputs = document.querySelectorAll('input, select, textarea');
    formInputs.forEach(input => {
        input.addEventListener('focus', function() {
            this.parentElement.classList.add('focused');
        });
        
        input.addEventListener('blur', function() {
            if (!this.value) {
                this.parentElement.classList.remove('focused');
            }
        });
        
        // Check if field has value on load
        if (input.value) {
            input.parentElement.classList.add('focused');
        }
    });

    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Character counter for message field
    const messageField = document.getElementById('message');
    if (messageField) {
        const maxLength = 500;
        const counterElement = document.createElement('div');
        counterElement.className = 'character-counter';
        counterElement.style.cssText = 'text-align: right; font-size: 0.8rem; color: #6b7280; margin-top: 0.25rem;';
        messageField.parentElement.appendChild(counterElement);
        
        function updateCounter() {
            const remaining = maxLength - messageField.value.length;
            counterElement.textContent = `${remaining} characters remaining`;
            
            if (remaining < 50) {
                counterElement.style.color = '#ef4444';
            } else if (remaining < 100) {
                counterElement.style.color = '#f59e0b';
            } else {
                counterElement.style.color = '#6b7280';
            }
        }
        
        messageField.addEventListener('input', updateCounter);
        messageField.setAttribute('maxlength', maxLength);
        updateCounter();
    }

    // Real-time form validation
    const emailField = document.getElementById('email');
    if (emailField) {
        emailField.addEventListener('blur', function() {
            const email = this.value.trim();
            const errorElement = this.parentElement.querySelector('.error-message');
            
            if (email && !isValidEmail(email)) {
                if (!errorElement) {
                    const error = document.createElement('div');
                    error.className = 'error-message';
                    error.style.cssText = 'color: #ef4444; font-size: 0.8rem; margin-top: 0.25rem;';
                    error.textContent = 'Please enter a valid email address';
                    this.parentElement.appendChild(error);
                }
                this.style.borderColor = '#ef4444';
            } else {
                if (errorElement) {
                    errorElement.remove();
                }
                this.style.borderColor = '#e5e7eb';
            }
        });
    }

    // Add loading state to submit button
    const submitBtn = document.querySelector('.submit-btn');
    if (submitBtn && feedbackForm) {
        feedbackForm.addEventListener('submit', function() {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
            
            setTimeout(() => {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Submit Feedback';
            }, 2000);
        });
    }
});

// Utility function to get all feedback data
function getAllFeedback() {
    return JSON.parse(localStorage.getItem('trusttrack_feedbacks') || '[]');
}

// Utility function to clear all feedback data
function clearAllFeedback() {
    localStorage.removeItem('trusttrack_feedbacks');
    console.log('All feedback data cleared');
}

// Export functions for potential use in other scripts
window.TrustTrackFeedback = {
    getAllFeedback,
    clearAllFeedback
};

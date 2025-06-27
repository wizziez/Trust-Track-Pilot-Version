// Team Page JavaScript

document.addEventListener('DOMContentLoaded', function() {
    initializeTeamAnimations();
    initializeTimelineAnimations();
    initializeSocialLinks();
    initializeCounters();
    initializeScrollAnimations();
    initContactForm();
});

// Initialize team card animations
function initializeTeamAnimations() {
    const teamCards = document.querySelectorAll('.team-card');
    
    // Add intersection observer for scroll animations
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });
    
    teamCards.forEach(card => {
        observer.observe(card);
    });
    
    // Add hover effects for enhanced interactivity
    teamCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-10px) scale(1.02)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });
}

// Initialize timeline animations
function initializeTimelineAnimations() {
    const timelineItems = document.querySelectorAll('.timeline-item');
    
    const timelineObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('timeline-animate');
            }
        });
    }, {
        threshold: 0.2
    });
    
    timelineItems.forEach(item => {
        timelineObserver.observe(item);
    });
}

// Initialize social link interactions
function initializeSocialLinks() {
    const socialLinks = document.querySelectorAll('.social-link');
    
    socialLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const platform = this.classList[1]; // Get the platform class (linkedin, github, etc.)
            const teamMember = this.closest('.team-card').querySelector('h3').textContent;
            
            // Show placeholder message for demo purposes
            showSocialMessage(platform, teamMember);
        });
        
        // Add ripple effect on click
        link.addEventListener('click', function(e) {
            createRippleEffect(this, e);
        });
    });
}

// Show social media placeholder message
function showSocialMessage(platform, member) {
    const messages = {
        linkedin: `Connect with ${member} on LinkedIn`,
        github: `Check out ${member}'s GitHub projects`,
        twitter: `Follow ${member} on Twitter`,
        dribbble: `View ${member}'s design portfolio on Dribbble`,
        email: `Send an email to ${member}`
    };
    
    const message = messages[platform] || `Connect with ${member}`;
    
    // Create and show notification
    showNotification(message + ' (Demo - links not active)', 'info');
}

// Create ripple effect for buttons
function createRippleEffect(element, event) {
    const ripple = document.createElement('span');
    const rect = element.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;
    
    ripple.style.cssText = `
        position: absolute;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.6);
        transform: scale(0);
        animation: ripple 0.6s linear;
        width: ${size}px;
        height: ${size}px;
        left: ${x}px;
        top: ${y}px;
        pointer-events: none;
    `;
    
    element.style.position = 'relative';
    element.style.overflow = 'hidden';
    element.appendChild(ripple);
    
    setTimeout(() => {
        ripple.remove();
    }, 600);
}

// Team statistics counter animation
function initializeCounters() {
    const counters = document.querySelectorAll('.counter');
    
    counters.forEach(counter => {
        const target = parseInt(counter.getAttribute('data-target'));
        const duration = 2000; // 2 seconds
        const increment = target / (duration / 16); // 60fps
        let current = 0;
        
        const updateCounter = () => {
            if (current < target) {
                current += increment;
                counter.textContent = Math.ceil(current);
                requestAnimationFrame(updateCounter);
            } else {
                counter.textContent = target;
            }
        };
        
        // Start animation when element is visible
        const counterObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    updateCounter();
                    counterObserver.disconnect();
                }
            });
        });
        
        counterObserver.observe(counter);
    });
}

// Enhanced notification function for team page
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.team-notification');
    existingNotifications.forEach(notif => notif.remove());
    
    const notification = document.createElement('div');
    notification.className = `team-notification ${type}`;
    
    const icons = {
        info: 'fa-info-circle',
        success: 'fa-check-circle',
        warning: 'fa-exclamation-triangle',
        error: 'fa-times-circle'
    };
    
    notification.innerHTML = `
        <i class="fas ${icons[type] || icons.info}"></i>
        <span>${message}</span>
        <button class="close-notification">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    document.body.appendChild(notification);
    
    // Show notification
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    // Close button functionality
    notification.querySelector('.close-notification').addEventListener('click', () => {
        hideNotification(notification);
    });
    
    // Auto hide after 4 seconds
    setTimeout(() => {
        hideNotification(notification);
    }, 4000);
}

function hideNotification(notification) {
    notification.classList.remove('show');
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 300);
}

// Scroll-triggered animations
function initializeScrollAnimations() {
    const animatedElements = document.querySelectorAll('.mission-card, .contact-item');
    
    const animationObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, {
        threshold: 0.1
    });
    
    animatedElements.forEach(element => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(30px)';
        element.style.transition = 'all 0.6s ease-out';
        animationObserver.observe(element);
    });
}

// Contact Form Handler
function initContactForm() {
    const contactForm = document.getElementById('contactForm');
    if (!contactForm) return;

    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await handleContactFormSubmission(e);
    });
}

async function handleContactFormSubmission(e) {
    const form = e.target;
    const submitBtn = form.querySelector('.submit-contact-btn');
    const messageDiv = document.getElementById('contactFormMessage');
    
    // Get form data
    const formData = new FormData(form);
    const contactData = {
        id: Date.now(),
        name: formData.get('name'),
        email: formData.get('email'),
        subject: formData.get('subject'),
        message: formData.get('message'),
        timestamp: new Date().toISOString(),
        status: 'pending'
    };

    // Validate form
    if (!validateContactForm(contactData)) {
        showContactMessage('Please fill in all required fields.', 'error');
        return;
    }

    // Show loading state
    submitBtn.classList.add('loading');
    submitBtn.disabled = true;

    try {
        // Save to local storage
        saveContactMessage(contactData);
        
        // Send email (simulated - in production, this would be server-side)
        await sendContactEmail(contactData);
        
        // Show success message
        showContactMessage('Thank you for your message! We\'ll get back to you soon.', 'success');
        form.reset();
        
    } catch (error) {
        console.error('Error sending contact message:', error);
        showContactMessage('There was an error sending your message. Please try again.', 'error');
    } finally {
        // Remove loading state
        submitBtn.classList.remove('loading');
        submitBtn.disabled = false;
    }
}

function validateContactForm(data) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    return data.name && 
           data.email && 
           emailRegex.test(data.email) && 
           data.subject && 
           data.message;
}

function saveContactMessage(contactData) {
    try {
        const existingContacts = JSON.parse(localStorage.getItem('contacts') || '[]');
        existingContacts.push(contactData);
        localStorage.setItem('contacts', JSON.stringify(existingContacts));
    } catch (error) {
        console.error('Error saving contact message:', error);
        throw error;
    }
}

async function sendContactEmail(contactData) {
    // Simulate email sending with EmailJS or similar service
    // In production, you would integrate with EmailJS, FormSpree, or your backend
    
    // This is a simulation - replace with actual email service integration
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            // Simulate successful email sending
            console.log('Contact email sent to raiyansarwar022@gmail.com:', contactData);
            
            // In production, you would do something like:
            // emailjs.send('service_id', 'template_id', {
            //     to_email: 'raiyansarwar022@gmail.com',
            //     from_name: contactData.name,
            //     from_email: contactData.email,
            //     subject: contactData.subject,
            //     message: contactData.message
            // }).then(resolve).catch(reject);
            
            resolve();
        }, 1500); // Simulate network delay
    });
}

function showContactMessage(message, type) {
    const messageDiv = document.getElementById('contactFormMessage');
    messageDiv.textContent = message;
    messageDiv.className = `form-message ${type}`;
    messageDiv.style.display = 'block';
    
    // Auto-hide success messages after 5 seconds
    if (type === 'success') {
        setTimeout(() => {
            messageDiv.style.display = 'none';
        }, 5000);
    }
}

// Add CSS for animations
const teamAnimationStyles = `
    <style>
        @keyframes ripple {
            to {
                transform: scale(4);
                opacity: 0;
            }
        }
        
        .team-card {
            opacity: 0;
            transform: translateY(30px);
            transition: all 0.6s ease-out;
        }
        
        .team-card.animate-in {
            opacity: 1;
            transform: translateY(0);
        }
        
        .timeline-item {
            opacity: 0;
            transform: translateX(-30px);
            transition: all 0.6s ease-out;
        }
        
        .timeline-item:nth-child(even) {
            transform: translateX(30px);
        }
        
        .timeline-item.timeline-animate {
            opacity: 1;
            transform: translateX(0);
        }
        
        .team-notification {
            position: fixed;
            top: 100px;
            right: 20px;
            background: white;
            padding: 1rem 1.5rem;
            border-radius: 10px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.15);
            transform: translateX(400px);
            transition: transform 0.3s ease;
            z-index: 1001;
            display: flex;
            align-items: center;
            gap: 0.75rem;
            min-width: 300px;
            max-width: 400px;
            border-left: 4px solid #2c5aa0;
        }
        
        .team-notification.show {
            transform: translateX(0);
        }
        
        .team-notification.info {
            border-left-color: #2c5aa0;
        }
        
        .team-notification.info i {
            color: #2c5aa0;
        }
        
        .team-notification.success {
            border-left-color: #10b981;
        }
        
        .team-notification.success i {
            color: #10b981;
        }
        
        .team-notification.warning {
            border-left-color: #f59e0b;
        }
        
        .team-notification.warning i {
            color: #f59e0b;
        }
        
        .team-notification.error {
            border-left-color: #ef4444;
        }
        
        .team-notification.error i {
            color: #ef4444;
        }
        
        .close-notification {
            background: none;
            border: none;
            color: #666;
            cursor: pointer;
            font-size: 0.9rem;
            padding: 0.25rem;
            border-radius: 3px;
            margin-left: auto;
            transition: color 0.3s ease;
        }
        
        .close-notification:hover {
            color: #333;
        }
        
        @media (max-width: 768px) {
            .team-notification {
                right: 10px;
                left: 10px;
                transform: translateY(-100px);
                max-width: none;
            }
            
            .team-notification.show {
                transform: translateY(0);
            }
        }
    </style>
`;

// Add styles to head
document.head.insertAdjacentHTML('beforeend', teamAnimationStyles);

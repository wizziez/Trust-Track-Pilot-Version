// Production Environment Configuration for TrustTrack
// This file handles environment variables for Netlify deployment

class EnvironmentConfig {
    constructor() {
        this.isProduction = window.location.hostname !== 'localhost' && 
                           window.location.hostname !== '127.0.0.1' && 
                           !window.location.hostname.includes('192.168');
        
        this.loadConfig();
    }

    loadConfig() {
        if (this.isProduction) {
            // Production environment - use Netlify environment variables
            // Note: Environment variables in static sites need to be injected during build
            // For now, we'll use the existing configuration from firebase-config-compat.js
            console.log('Running in production mode');
        } else {
            // Development environment
            console.log('Running in development mode');
        }
    }

    // Method to check if all required environment variables are available
    validateEnvironment() {
        const required = [
            'firebase.apiKey',
            'firebase.authDomain', 
            'firebase.projectId'
        ];

        const missing = required.filter(key => {
            const value = this.getNestedProperty(window, key);
            return !value;
        });

        if (missing.length > 0) {
            console.warn('Missing required configuration:', missing);
            return false;
        }

        return true;
    }

    getNestedProperty(obj, path) {
        return path.split('.').reduce((current, key) => current && current[key], obj);
    }

    // Azure OpenAI configuration for production
    getAzureOpenAIConfig() {
        if (this.isProduction) {
            // In production, these would be injected during build or fetched from a secure endpoint
            return {
                endpoint: process.env.AZURE_OPENAI_ENDPOINT || 'https://ai-raiyanbinsarwar0112ai312258162978.openai.azure.com/',
                apiKey: process.env.AZURE_OPENAI_API_KEY || '', // This should be handled securely
                apiVersion: '2024-12-01-preview'
            };
        } else {
            // Development configuration
            return {
                endpoint: 'https://ai-raiyanbinsarwar0112ai312258162978.openai.azure.com/',
                apiKey: '2wuCk4AZtNAflvsGfbHjThuF7PKySOnOtW7DzxmgFDLtO07liLBJJQQJ99BCACHYHv6XJ3w3AAAAACOGaBwr',
                apiVersion: '2024-12-01-preview'
            };
        }
    }
}

// Initialize environment configuration
window.EnvironmentConfig = new EnvironmentConfig();

// Production optimization: Service Worker for caching (optional)
if ('serviceWorker' in navigator && window.EnvironmentConfig.isProduction) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}

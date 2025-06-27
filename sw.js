// Service Worker for TrustTrack
// Provides offline functionality and performance improvements

const CACHE_NAME = 'trusttrack-v1.0.0';
const urlsToCache = [
    '/',
    '/index.html',
    '/pages/dashboard.html',
    '/pages/reviews.html',
    '/pages/profile.html',
    '/pages/emergency.html',
    '/pages/team.html',
    '/pages/faq.html',
    '/styles/main.css',
    '/styles/dashboard.css',
    '/styles/reviews.css',
    '/styles/emergency.css',
    '/scripts/main.js',
    '/scripts/auth-compat.js',
    '/scripts/firebase-config-compat.js',
    '/scripts/dashboard-compat.js',
    '/scripts/reviews-firebase.js',
    '/scripts/homepage-reviews.js',
    '/scripts/emergency.js',
    '/scripts/profile.js',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css'
];

// Install event - cache resources
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);
            })
    );
});

// Fetch event - serve cached content when offline
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Return cached version or fetch from network
                if (response) {
                    return response;
                }
                
                // Clone the request because it's a stream
                const fetchRequest = event.request.clone();
                
                return fetch(fetchRequest).then(response => {
                    // Check if we received a valid response
                    if (!response || response.status !== 200 || response.type !== 'basic') {
                        return response;
                    }
                    
                    // Clone the response because it's a stream
                    const responseToCache = response.clone();
                    
                    caches.open(CACHE_NAME)
                        .then(cache => {
                            cache.put(event.request, responseToCache);
                        });
                    
                    return response;
                }).catch(() => {
                    // If both network and cache fail, show offline page
                    if (event.request.destination === 'document') {
                        return caches.match('/index.html');
                    }
                });
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

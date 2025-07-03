const CACHE_NAME = 'iec62443-quiz-v1';
const urlsToCache = [
    '/iec_quiz.html', // The main HTML file
    '/', // Root path, often redirects to index.html or similar
    'https://cdn.tailwindcss.com', // Tailwind CSS CDN
    // Placeholder icons for PWA
    'https://placehold.co/192x192/4299e1/ffffff?text=Quiz',
    'https://placehold.co/512x512/4299e1/ffffff?text=Quiz'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);
            })
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Cache hit - return response
                if (response) {
                    return response;
                }
                return fetch(event.request);
            })
    );
});

self.addEventListener('activate', (event) => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

const CACHE_NAME = 'iec62443-quiz-v1';
const urlsToCache = [
    '/IEC-Test/index.html', // Belangrijk: nu met de repositorynaam!
    '/IEC-Test/', // Root path van de repository
    'https://cdn.tailwindcss.com', // Tailwind CSS CDN
    // Placeholder icons voor PWA
    'https://placehold.co/192x192/4299e1/ffffff?text=Quiz',
    'https://placehold.co/512x512/4299e1/ffffff?text=Quiz'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Service Worker: Cache geopend');
                return cache.addAll(urlsToCache);
            })
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Cache hit - geef antwoord terug
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
                        console.log('Service Worker: Oude cache verwijderd', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

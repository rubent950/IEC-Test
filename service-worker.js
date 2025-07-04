// Definieer de naam van de cache
const CACHE_NAME = 'iec-quiz-cache-v1';
// Lijst van bestanden die gecachet moeten worden
const urlsToCache = [
    '/',
    'index.html',
    'manifest.json',
    'image_8d4b28.png', // Zorg ervoor dat dit pad correct is
    'https://cdn.tailwindcss.com' // Tailwind CSS CDN
];

// Installeer de Service Worker en cache de bestanden
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);
            })
            .catch(error => {
                console.error('Failed to cache during install:', error);
            })
    );
});

// Vang fetch-verzoeken op en serveer vanuit de cache indien beschikbaar
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Cache hit - retourneer response
                if (response) {
                    return response;
                }
                // Geen cache hit - probeer het netwerk
                return fetch(event.request).catch(error => {
                    console.error('Fetch failed:', error);
                    // Optioneel: retourneer een offline pagina als de fetch mislukt
                    // return caches.match('/offline.html');
                });
            })
    );
});

// Activeer de Service Worker en ruim oude caches op
self.addEventListener('activate', event => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        // Verwijder oude caches
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

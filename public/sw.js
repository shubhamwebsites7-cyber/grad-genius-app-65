const CACHE_VERSION = 'v2-' + new Date().getTime();
const CACHE_NAME = 'trackmycalories-' + CACHE_VERSION;
const STATIC_ASSETS = [
  '/manifest.json',
  '/pwa-192x192.png',
  '/pwa-512x512.png'
];

// Install Service Worker - force immediate activation
self.addEventListener('install', (event) => {
  self.skipWaiting(); // Force the waiting service worker to become active
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(STATIC_ASSETS);
      })
  );
});

// Activate event - take control immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      // Delete old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && cacheName.startsWith('trackmycalories-')) {
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Take control of all clients immediately
      self.clients.claim()
    ])
  );
});

// Fetch event - Network first for HTML, cache for assets
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Network first for HTML/navigation requests
  if (request.mode === 'navigate' || request.headers.get('accept').includes('text/html')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Clone and cache the response
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
          return response;
        })
        .catch(() => {
          // Fallback to cache if offline
          return caches.match(request);
        })
    );
    return;
  }

  // Cache first for static assets (images, fonts, etc.)
  if (request.destination === 'image' || request.destination === 'font' || 
      url.pathname.match(/\.(png|jpg|jpeg|svg|gif|woff|woff2|ttf|eot)$/)) {
    event.respondWith(
      caches.match(request)
        .then((response) => {
          return response || fetch(request).then((fetchResponse) => {
            return caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, fetchResponse.clone());
              return fetchResponse;
            });
          });
        })
    );
    return;
  }

  // Network first for everything else (JS, CSS, API calls)
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Don't cache API calls or external requests
        if (url.origin === location.origin && !url.pathname.includes('/rest/')) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(request);
      })
  );
});

// Listen for messages from clients to force update
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
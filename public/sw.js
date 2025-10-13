const CACHE_NAME = 'examtrakr-v3';
const urlsToCache = [
  '/',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache.map(url => new Request(url, {cache: 'reload'})))
          .catch(err => {
            console.log('Cache addAll error:', err);
          });
      })
  );
  self.skipWaiting();
});

// Fetch event - NETWORK FIRST strategy for HTML/JS, cache for static assets
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip caching for non-GET requests (POST, PUT, DELETE, etc.)
  if (request.method !== 'GET') {
    return fetch(request);
  }
  
  // Skip caching for API calls and external resources
  if (!url.origin.includes('examtrakr.com') && !url.origin.includes('localhost')) {
    return;
  }

  // Network-first strategy for HTML and JS files
  if (request.destination === 'document' || 
      request.destination === 'script' || 
      url.pathname.endsWith('.js') || 
      url.pathname.endsWith('.html') ||
      url.pathname === '/') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Clone and cache the fresh response
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
          return response;
        })
        .catch(() => {
          // Fallback to cache only if network fails
          return caches.match(request);
        })
    );
  } else {
    // Cache-first for images, fonts, and other static assets
    event.respondWith(
      caches.match(request)
        .then((response) => {
          return response || fetch(request).then((response) => {
            if (response && response.status === 200) {
              const responseToCache = response.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(request, responseToCache);
              });
            }
            return response;
          });
        })
    );
  }
});

// Activate event - clean up old caches
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
  self.clients.claim();
});
const CACHE_NAME = 'examtrakr-v8';
const urlsToCache = [
  '/',
  '/?utm_source=twa',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/examtrakr.png',
  '/favicon.png',
  '/offline.html'
];

const OFFLINE_PAGE = '/offline.html';

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Opened cache');
        return cache.addAll(urlsToCache.map(url => new Request(url, {cache: 'reload'})))
          .catch(err => {
            console.log('[SW] Cache addAll error:', err);
          });
      })
  );
  self.skipWaiting();
});

// Helper function to check if URL should be cached
function shouldCache(url, request) {
  // Never cache Supabase API calls
  if (url.hostname.includes('supabase')) {
    return false;
  }
  
  // Never cache authenticated routes that load dynamic data
  const authRoutes = ['/dashboard', '/profile', '/admin', '/exam/', '/resources/'];
  if (authRoutes.some(route => url.pathname.startsWith(route))) {
    return false;
  }
  
  // Never cache API endpoints
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/auth/')) {
    return false;
  }
  
  // Never cache requests with authentication headers
  if (request.headers.get('authorization') || request.headers.get('apikey')) {
    return false;
  }
  
  // Never cache JavaScript modules from assets (they can have MIME type issues)
  if (url.pathname.includes('/assets/') && (url.pathname.endsWith('.js') || url.pathname.endsWith('.mjs'))) {
    return false;
  }
  
  // Never cache main entry point files
  if (url.pathname.includes('index-') && url.pathname.endsWith('.js')) {
    return false;
  }
  
  // Never cache vendor files
  if (url.pathname.includes('vendor-') && url.pathname.endsWith('.js')) {
    return false;
  }
  
  return true;
}

// Fetch event - NETWORK FIRST strategy for HTML/JS, cache for static assets
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip caching for non-GET requests (POST, PUT, DELETE, etc.)
  if (request.method !== 'GET') {
    event.respondWith(fetch(request));
    return;
  }
  
  // Skip caching for external resources (but allow same-origin requests)
  if (url.origin !== self.location.origin) {
    // Allow Supabase requests to pass through without caching
    if (url.hostname.includes('supabase')) {
      event.respondWith(fetch(request));
    }
    return;
  }

  // Check if this request should be cached
  const canCache = shouldCache(url, request);

  // Network-first strategy for HTML and JS files
  if (request.destination === 'document' || 
      request.destination === 'script' || 
      url.pathname.endsWith('.js') || 
      url.pathname.endsWith('.html') ||
      url.pathname === '/' ||
      url.pathname === '/?utm_source=twa') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Only cache if allowed and response is successful
          if (canCache && response && response.status === 200) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return response;
        })
        .catch(() => {
          // Fallback to cache only if network fails and caching was allowed
          if (canCache) {
            return caches.match(request);
          }
          // For non-cacheable requests, return a network error
          return new Response('Network error', { status: 408 });
        })
    );
  } else if (canCache) {
    // Cache-first for images, fonts, and other static assets (only if cacheable)
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
  } else {
    // For non-cacheable requests, always fetch from network
    event.respondWith(fetch(request));
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

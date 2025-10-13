const CACHE_NAME = 'examtrakr-v7';
const STATIC_CACHE = 'examtrakr-static-v7';
const DYNAMIC_CACHE = 'examtrakr-dynamic-v7';

const urlsToCache = [
  '/',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing v7');
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then((cache) => {
        console.log('Service Worker: Caching static assets');
        return cache.addAll(urlsToCache);
      }),
      caches.open(DYNAMIC_CACHE) // Create dynamic cache
    ])
  );
  // Force the waiting service worker to become the active service worker
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating v7');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Delete all caches that don't match current version
          if (cacheName !== STATIC_CACHE && 
              cacheName !== DYNAMIC_CACHE && 
              cacheName !== CACHE_NAME) {
            console.log('Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker: Cache cleanup complete');
      // Ensure the new service worker takes control immediately
      return self.clients.claim();
    })
  );
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
    return;
  }

  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    return;
  }

  // Check if this request should be cached
  const canCache = shouldCache(url, request);

  // Network-first strategy for HTML and JS files
  if (request.destination === 'document' || 
      request.destination === 'script' || 
      url.pathname.endsWith('.js') || 
      url.pathname.endsWith('.mjs') ||
      url.pathname.endsWith('.html') ||
      url.pathname === '/') {
    
    console.log('Service Worker: Network-first for:', url.pathname);
    
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Always return fresh response for JS/HTML
          if (response && response.status === 200) {
            // Only cache non-JS assets to avoid MIME type issues
            if (canCache && !url.pathname.includes('/assets/') && 
                !url.pathname.endsWith('.js') && !url.pathname.endsWith('.mjs')) {
              const responseToCache = response.clone();
              caches.open(DYNAMIC_CACHE).then((cache) => {
                cache.put(request, responseToCache);
              });
            }
          }
          return response;
        })
        .catch(() => {
          // Fallback to cache only for non-JS files
          if (canCache && !url.pathname.endsWith('.js') && !url.pathname.endsWith('.mjs')) {
            console.log('Service Worker: Fallback to cache for:', url.pathname);
            return caches.match(request);
          }
          // For JS files, always fail if network fails to prevent MIME type issues
          return new Response('Network error - JS files must be fresh', { 
            status: 408,
            statusText: 'Network Timeout'
          });
        })
    );
  } else if (canCache && !url.pathname.includes('/assets/')) {
    // Cache-first for non-asset static files only
    event.respondWith(
      caches.match(request)
        .then((response) => {
          if (response) {
            console.log('Service Worker: Cache hit for:', url.pathname);
            return response;
          }
          
          return fetch(request).then((response) => {
            if (response && response.status === 200) {
              const responseToCache = response.clone();
              caches.open(STATIC_CACHE).then((cache) => {
                cache.put(request, responseToCache);
              });
            }
            return response;
          });
        })
    );
  } else {
    // For assets and non-cacheable requests, always fetch from network
    console.log('Service Worker: Network-only for:', url.pathname);
    event.respondWith(fetch(request));
  }
});

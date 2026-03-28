// LEXORA Service Worker - Offline Support
// Version: 1.0.0

const CACHE_VERSION = 'lexora-v1';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const API_CACHE = `${CACHE_VERSION}-api`;
const DOCUMENT_CACHE = `${CACHE_VERSION}-documents`;

// Static assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/offline',
  '/favicon.ico',
  '/_next/static/css/',
  '/_next/static/chunks/',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('[SW] Caching static assets');
      return cache.addAll(STATIC_ASSETS.filter(url => !url.includes('_next')));
    }).then(() => {
      console.log('[SW] Service worker installed');
      return self.skipWaiting();
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name.startsWith('lexora-') && !name.startsWith(CACHE_VERSION))
          .map((name) => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    }).then(() => {
      console.log('[SW] Service worker activated');
      return self.clients.claim();
    })
  );
});

// Fetch event - handle caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip Chrome extensions and other non-http(s) requests
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // API calls - Network First strategy
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstStrategy(request, API_CACHE));
    return;
  }

  // Documents/images - Stale While Revalidate
  if (url.pathname.includes('/documents/') || url.pathname.match(/\.(jpg|jpeg|png|gif|webp|svg)$/)) {
    event.respondWith(staleWhileRevalidateStrategy(request, DOCUMENT_CACHE));
    return;
  }

  // Static assets - Cache First strategy
  if (url.pathname.startsWith('/_next/') || url.pathname.startsWith('/static/')) {
    event.respondWith(cacheFirstStrategy(request, STATIC_CACHE));
    return;
  }

  // Default - Network First with offline fallback
  event.respondWith(
    fetch(request)
      .catch(() => caches.match('/offline'))
  );
});

// Network First Strategy - Try network, fallback to cache
async function networkFirstStrategy(request, cacheName) {
  try {
    const response = await fetch(request);
    
    // Cache successful responses
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', request.url);
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline response
    return new Response(
      JSON.stringify({ 
        error: 'offline', 
        message: 'You are offline. This request will be retried when you reconnect.' 
      }),
      { 
        status: 503, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }
}

// Cache First Strategy - Serve from cache, update in background
async function cacheFirstStrategy(request, cacheName) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    // Update cache in background
    fetch(request).then((response) => {
      if (response.ok) {
        caches.open(cacheName).then((cache) => {
          cache.put(request, response);
        });
      }
    }).catch(() => {});
    
    return cachedResponse;
  }
  
  // Not in cache, fetch from network
  try {
    const response = await fetch(request);
    
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    return new Response('Offline', { status: 503 });
  }
}

// Stale While Revalidate - Return cache immediately, update in background
async function staleWhileRevalidateStrategy(request, cacheName) {
  const cachedResponse = await caches.match(request);
  
  const fetchPromise = fetch(request).then((response) => {
    if (response.ok) {
      caches.open(cacheName).then((cache) => {
        cache.put(request, response);
      });
    }
    return response;
  }).catch(() => {});
  
  return cachedResponse || fetchPromise;
}

// Listen for messages from clients
self.addEventListener('message', (event) => {
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((name) => caches.delete(name))
        );
      }).then(() => {
        event.ports[0].postMessage({ success: true });
      })
    );
  }
  
  if (event.data.type === 'GET_CACHE_SIZE') {
    event.waitUntil(
      getCacheSize().then((size) => {
        event.ports[0].postMessage({ size });
      })
    );
  }
});

// Get total cache size
async function getCacheSize() {
  let totalSize = 0;
  
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    const estimate = await navigator.storage.estimate();
    totalSize = estimate.usage || 0;
  }
  
  return totalSize;
}

// Background sync for queued requests
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-queue') {
    event.waitUntil(syncQueuedRequests());
  }
});

async function syncQueuedRequests() {
  // This will be handled by the sync-queue.ts module
  console.log('[SW] Background sync triggered');
  
  // Notify clients
  const clients = await self.clients.matchAll();
  clients.forEach((client) => {
    client.postMessage({ type: 'SYNC_STARTED' });
  });
}

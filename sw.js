// Service Worker for ly最新資訊 PWA
const CACHE_NAME = 'ly-news-v1.0.0';
const STATIC_CACHE = 'ly-news-static-v1.0.0';
const DYNAMIC_CACHE = 'ly-news-dynamic-v1.0.0';
const IMAGE_CACHE = 'ly-news-images-v1.0.0';

// Files to cache immediately
const STATIC_FILES = [
  './',
  './index.html',
  './styles.css',
  './script.js',
  './manifest.json',
  './icon-192x192.png',
  './icon-512x512.png',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@300;400;500;700&display=swap'
];

// API endpoints to cache
const API_CACHE_PATTERNS = [
  /^https:\/\/gnews\.io\/api\/v4\//,
  /^https:\/\/openrouter\.ai\/api\/v1\//
];

// Image cache patterns
const IMAGE_CACHE_PATTERNS = [
  /\.(jpg|jpeg|png|gif|webp|svg)$/i,
  /^https:\/\/.*\.(jpg|jpeg|png|gif|webp|svg)/i
];

// Install event - cache static files
self.addEventListener('install', event => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    Promise.all([
      // Cache static files
      caches.open(STATIC_CACHE).then(cache => {
        console.log('Service Worker: Caching static files');
        return cache.addAll(STATIC_FILES.map(url => new Request(url, { cache: 'reload' })));
      }),
      
      // Initialize other caches
      caches.open(DYNAMIC_CACHE),
      caches.open(IMAGE_CACHE)
    ]).then(() => {
      console.log('Service Worker: Installation complete');
      // Force activation
      return self.skipWaiting();
    }).catch(error => {
      console.error('Service Worker: Installation failed', error);
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('Service Worker: Activating...');
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== STATIC_CACHE && 
                cacheName !== DYNAMIC_CACHE && 
                cacheName !== IMAGE_CACHE &&
                cacheName !== CACHE_NAME) {
              console.log('Service Worker: Deleting old cache', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      
      // Take control of all clients
      self.clients.claim()
    ]).then(() => {
      console.log('Service Worker: Activation complete');
    })
  );
});

// Fetch event - handle requests with different strategies
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip chrome-extension and other non-http requests
  if (!request.url.startsWith('http')) {
    return;
  }
  
  // Handle different types of requests
  if (isStaticFile(request)) {
    // Static files: Cache First
    event.respondWith(cacheFirst(request, STATIC_CACHE));
  } else if (isImageRequest(request)) {
    // Images: Cache First with fallback
    event.respondWith(imageCache(request));
  } else if (isAPIRequest(request)) {
    // API requests: Network First with cache fallback
    event.respondWith(networkFirst(request, DYNAMIC_CACHE));
  } else if (isNavigationRequest(request)) {
    // Navigation: Network First with offline fallback
    event.respondWith(navigationHandler(request));
  } else {
    // Other requests: Network First
    event.respondWith(networkFirst(request, DYNAMIC_CACHE));
  }
});

// Cache strategies

// Cache First - for static files
async function cacheFirst(request, cacheName) {
  try {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      // Update cache in background
      updateCache(request, cacheName);
      return cachedResponse;
    }
    
    // If not in cache, fetch and cache
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.error('Cache First failed:', error);
    return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
  }
}

// Network First - for dynamic content
async function networkFirst(request, cacheName) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Network failed, trying cache:', error);
    
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      return caches.match('./index.html');
    }
    
    return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
  }
}

// Image cache strategy
async function imageCache(request) {
  try {
    const cache = await caches.open(IMAGE_CACHE);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      // Only cache successful image responses
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('Image cache failed:', error);
    // Return placeholder image
    return new Response(
      '<svg width="400" height="200" viewBox="0 0 400 200" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="400" height="200" fill="#F3F4F6"/><path d="M175 75H225V125H175V75Z" fill="#D1D5DB"/><path d="M190 100L200 90L210 100L200 110L190 100Z" fill="#9CA3AF"/></svg>',
      {
        headers: {
          'Content-Type': 'image/svg+xml',
          'Cache-Control': 'max-age=86400'
        }
      }
    );
  }
}

// Navigation handler
async function navigationHandler(request) {
  try {
    const networkResponse = await fetch(request);
    return networkResponse;
  } catch (error) {
    console.log('Navigation failed, serving cached index:', error);
    const cache = await caches.open(STATIC_CACHE);
    return cache.match('./index.html') || cache.match('/');
  }
}

// Background cache update
async function updateCache(request, cacheName) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse);
    }
  } catch (error) {
    console.log('Background cache update failed:', error);
  }
}

// Helper functions

function isStaticFile(request) {
  const url = new URL(request.url);
  return STATIC_FILES.some(file => {
    const fileUrl = new URL(file, self.location.origin);
    return url.pathname === fileUrl.pathname;
  }) || url.pathname.match(/\.(css|js|json)$/);
}

function isImageRequest(request) {
  return IMAGE_CACHE_PATTERNS.some(pattern => pattern.test(request.url));
}

function isAPIRequest(request) {
  return API_CACHE_PATTERNS.some(pattern => pattern.test(request.url));
}

function isNavigationRequest(request) {
  return request.mode === 'navigate' || 
         (request.method === 'GET' && request.headers.get('accept').includes('text/html'));
}

// Message handling for cache management
self.addEventListener('message', event => {
  const { type, payload } = event.data;
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'CACHE_NEWS':
      if (payload && payload.articles) {
        cacheNewsArticles(payload.articles);
      }
      break;
      
    case 'CLEAR_CACHE':
      clearAllCaches();
      break;
      
    case 'GET_CACHE_SIZE':
      getCacheSize().then(size => {
        event.ports[0].postMessage({ type: 'CACHE_SIZE', size });
      });
      break;
      
    default:
      console.log('Unknown message type:', type);
  }
});

// Cache news articles for offline reading
async function cacheNewsArticles(articles) {
  try {
    const cache = await caches.open(DYNAMIC_CACHE);
    const imageCache = await caches.open(IMAGE_CACHE);
    
    for (const article of articles) {
      // Cache article images
      if (article.image) {
        try {
          const imageResponse = await fetch(article.image);
          if (imageResponse.ok) {
            imageCache.put(article.image, imageResponse);
          }
        } catch (error) {
          console.log('Failed to cache image:', article.image, error);
        }
      }
    }
    
    console.log('Cached news articles for offline reading');
  } catch (error) {
    console.error('Failed to cache news articles:', error);
  }
}

// Clear all caches
async function clearAllCaches() {
  try {
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames.map(cacheName => caches.delete(cacheName))
    );
    console.log('All caches cleared');
  } catch (error) {
    console.error('Failed to clear caches:', error);
  }
}

// Get total cache size
async function getCacheSize() {
  try {
    let totalSize = 0;
    const cacheNames = await caches.keys();
    
    for (const cacheName of cacheNames) {
      const cache = await caches.open(cacheName);
      const requests = await cache.keys();
      
      for (const request of requests) {
        const response = await cache.match(request);
        if (response) {
          const blob = await response.blob();
          totalSize += blob.size;
        }
      }
    }
    
    return totalSize;
  } catch (error) {
    console.error('Failed to calculate cache size:', error);
    return 0;
  }
}

// Periodic cache cleanup
self.addEventListener('periodicsync', event => {
  if (event.tag === 'cache-cleanup') {
    event.waitUntil(cleanupOldCache());
  }
});

// Clean up old cached items
async function cleanupOldCache() {
  try {
    const cache = await caches.open(DYNAMIC_CACHE);
    const requests = await cache.keys();
    const now = Date.now();
    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
    
    for (const request of requests) {
      const response = await cache.match(request);
      if (response) {
        const dateHeader = response.headers.get('date');
        if (dateHeader) {
          const responseDate = new Date(dateHeader).getTime();
          if (now - responseDate > maxAge) {
            await cache.delete(request);
            console.log('Deleted old cache entry:', request.url);
          }
        }
      }
    }
  } catch (error) {
    console.error('Cache cleanup failed:', error);
  }
}

// Background sync for offline actions
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync') {
    event.waitUntil(handleBackgroundSync());
  }
});

async function handleBackgroundSync() {
  try {
    // Handle any queued offline actions
    const offlineActions = await getOfflineActions();
    
    for (const action of offlineActions) {
      try {
        await processOfflineAction(action);
        await removeOfflineAction(action.id);
      } catch (error) {
        console.error('Failed to process offline action:', error);
      }
    }
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

// Placeholder functions for offline action handling
async function getOfflineActions() {
  // Implementation would retrieve queued actions from IndexedDB
  return [];
}

async function processOfflineAction(action) {
  // Implementation would process the queued action
  console.log('Processing offline action:', action);
}

async function removeOfflineAction(actionId) {
  // Implementation would remove the processed action from IndexedDB
  console.log('Removing offline action:', actionId);
}

// Push notification handling
self.addEventListener('push', event => {
  if (!event.data) {
    return;
  }
  
  try {
    const data = event.data.json();
    const options = {
      body: data.body || '有新的新聞更新',
      icon: './icon-192x192.png',
      badge: './icon-72x72.png',
      image: data.image,
      data: data.url,
      actions: [
        {
          action: 'open',
          title: '查看',
          icon: './icon-72x72.png'
        },
        {
          action: 'close',
          title: '關閉'
        }
      ],
      requireInteraction: true,
      tag: 'news-update'
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title || 'ly最新資訊', options)
    );
  } catch (error) {
    console.error('Push notification error:', error);
  }
});

// Notification click handling
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  if (event.action === 'open' || !event.action) {
    const url = event.notification.data || './';
    
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then(clientList => {
          // Check if app is already open
          for (const client of clientList) {
            if (client.url.includes(self.location.origin) && 'focus' in client) {
              client.focus();
              client.navigate(url);
              return;
            }
          }
          
          // Open new window if app is not open
          if (clients.openWindow) {
            return clients.openWindow(url);
          }
        })
    );
  }
});

// Error handling
self.addEventListener('error', event => {
  console.error('Service Worker error:', event.error);
});

self.addEventListener('unhandledrejection', event => {
  console.error('Service Worker unhandled rejection:', event.reason);
});

console.log('Service Worker: Script loaded');
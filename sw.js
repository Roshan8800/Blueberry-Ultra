const CACHE_NAME = 'blueberry-cache-v2';
const STATIC_CACHE = 'blueberry-static-v2';
const IMAGE_CACHE = 'blueberry-images-v2';
const API_CACHE = 'blueberry-api-v2';

const urlsToCache = [
  '/',
  '/index.html',
  '/src/styles/main.css',
  '/src/components/video-thumbnail.js',
  '/src/components/category-grid.js',
  '/src/components/navigation-drawer.js',
  '/src/components/video-player.js',
  '/src/components/search-bar.js',
  '/src/components/pagination.js',
  '/src/components/toast.js',
  '/src/components/modal.js',
  '/src/components/form-elements.js',
  '/src/components/loading-spinner.js',
  '/src/components/error-boundary.js',
  '/src/pages/home.js',
  '/src/pages/video.js',
  '/src/pages/categories.js',
  '/src/pages/search.js',
  '/src/pages/profile.js',
  '/src/pages/settings.js',
  '/src/pages/login.js',
  '/src/pages/about.js',
  '/src/services/auth-service.js',
  '/src/services/data-service.js',
  '/src/services/local-history-service.js',
  '/src/services/recommendation-service.js',
  '/src/utils/data-loader.js',
  '/src/utils/keyboard-shortcuts.js',
  '/src/config/firebase.js'
];

// Cache strategies
const cacheFirst = (cacheName) => {
  return async (request) => {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    try {
      const networkResponse = await fetch(request);
      if (networkResponse.ok) {
        const cache = await caches.open(cacheName);
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    } catch (error) {
      console.error('Fetch failed:', error);
      throw error;
    }
  };
};

const networkFirst = (cacheName) => {
  return async (request) => {
    try {
      const networkResponse = await fetch(request);
      if (networkResponse.ok) {
        const cache = await caches.open(cacheName);
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    } catch (error) {
      const cachedResponse = await caches.match(request);
      if (cachedResponse) {
        return cachedResponse;
      }
      throw error;
    }
  };
};

const staleWhileRevalidate = (cacheName) => {
  return async (request) => {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);

    const fetchPromise = fetch(request).then(networkResponse => {
      if (networkResponse.ok) {
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    });

    return cachedResponse || fetchPromise;
  };
};

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (![STATIC_CACHE, IMAGE_CACHE, API_CACHE].includes(cacheName)) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Handle different resource types
  if (request.destination === 'image' || url.pathname.match(/\.(png|jpg|jpeg|gif|webp|svg)$/)) {
    event.respondWith(cacheFirst(IMAGE_CACHE)(request));
  } else if (url.pathname.startsWith('/data/') || url.pathname.includes('firestore.googleapis.com')) {
    event.respondWith(networkFirst(API_CACHE)(request));
  } else if (request.destination === 'script' || request.destination === 'style' || url.pathname.match(/\.(js|css)$/)) {
    event.respondWith(staleWhileRevalidate(STATIC_CACHE)(request));
  } else {
    event.respondWith(cacheFirst(STATIC_CACHE)(request));
  }
});

// Background sync for offline actions
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});


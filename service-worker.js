// Standalone PWA Service Worker with Caching and Push placeholders
const CACHE_NAME = 'job-dispatch-v1';
const ASSETS_TO_CACHE = [
  'index.html',
  'request.html',
  'dashboard.html',
  'css/style.css',
  'js/app.js',
  'manifest.json'
];

// Install Event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event - Network First with Cache Fallback
self.addEventListener('fetch', (event) => {
  // Avoid caching foreign POST requests (Google Sheet API posts, etc.)
  if (event.request.method !== 'GET') {
    return;
  }
  
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // Cache the updated response
        return caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, networkResponse.clone());
          return networkResponse;
        });
      })
      .catch(() => {
        // Return cache fallback if offline
        return caches.match(event.request);
      })
  );
});

// Import OneSignal SDK Service Worker if push notifications are loaded
// OneSignal will automatically append or load its code in the background if active.
try {
  importScripts('https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js');
} catch (e) {
  console.log("OneSignal SW load skipped or running offline", e);
}

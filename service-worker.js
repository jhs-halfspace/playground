// Version this cache so we can force updates when we deploy new code.
// Change this string whenever you update the app files.
const CACHE_NAME = 'word-games-v7';

// List every file the app needs to work offline.
// The service worker will download and cache all of these on first visit.
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './wordle.js',
  './connections.js',
  './balatro.js',
  './words.js',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// INSTALL event: fires once when the browser first registers this service worker.
// We use it to pre-cache all our app files.
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS_TO_CACHE))
  );
  // Skip waiting means this new service worker activates immediately
  // instead of waiting for all tabs to close.
  self.skipWaiting();
});

// ACTIVATE event: fires when this service worker takes control.
// We use it to delete old caches from previous versions.
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    )
  );
  // Take control of all open tabs immediately.
  self.clients.claim();
});

// FETCH event: fires for every network request the app makes.
// Strategy: "network first, fall back to cache"
// - Try the network first (always get the latest version)
// - If network fails (offline), serve from cache
// - Update the cache with every successful network response
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Clone the response - a response can only be consumed once,
        // and we need it both for the cache and to return to the browser.
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});

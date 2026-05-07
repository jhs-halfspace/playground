// Version this cache so we can force updates when we deploy new code.
// Change this string whenever you update the app files.
const CACHE_NAME = 'word-games-v1';

// List every file the app needs to work offline.
// The service worker will download and cache all of these on first visit.
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './wordle.js',
  './connections.js',
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
// Strategy: "cache first, fall back to network"
// - If we have the file cached, serve it instantly (fast, works offline)
// - If not cached, fetch from network (for anything we forgot to cache)
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(cached => cached || fetch(event.request))
  );
});

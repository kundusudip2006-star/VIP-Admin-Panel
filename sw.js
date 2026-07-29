const CACHE_NAME = "vip-store-v1";

const urlsToCache = [
  "/",
  "/index.html",
  "/shop.html",
  "/login.html",
  "/css/shop.css",
  "/js/firebase.js",
  "/js/shop.js"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});
const CACHE_NAME = "burgerplace-v1";
const ASSETS = [
  "./",
  "./index.html",
  "./admin.html",
  "./css/base.css",
  "./css/login.css",
  "./js/auth.js",
  "./js/ui.js",
  "./js/store.js",
  "./js/pwa.js",
  "./manifest.webmanifest",
  "./img/bg-burger.png",
  "./img/icons/icon-192.png",
  "./img/icons/icon-512.png"
  // Adicione imagens/fontes se quiser cachear também
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((key) => key !== CACHE_NAME && caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});

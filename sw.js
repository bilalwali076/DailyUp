const CACHE_NAME = 'dailygrowth-os-v1';
const STATIC_ASSETS = [
  './',
  './index.html',
  './vocab.html',
  './vocab-history.html',
  './expense.html',
  './grammar.html',
  './style.css',
  './supabase.js',
  './layout.js',
  './dashboard.js',
  './vocab.js',
  './vocab-history.js',
  './expense.js',
  './grammar.js',
  './manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => {});
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // Jangan cache request ke Supabase API agar data selalu real-time
  if (url.hostname.includes('supabase.co')) {
    return;
  }

  // Strategi Network-First dengan fallback cache untuk file aplikasi
  event.respondWith(
    fetch(req)
      .then((networkRes) => {
        if (networkRes && networkRes.status === 200 && url.origin === self.location.origin) {
          const clone = networkRes.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
        }
        return networkRes;
      })
      .catch(() => caches.match(req))
  );
});
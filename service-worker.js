const CACHE_NAME = 'study-reader-encrypted-v1';
const CACHE_PREFIX = 'study-reader-encrypted-';
const SCOPE = '/study-reader/';
const SHELL = [
  SCOPE,
  `${SCOPE}payload.json`,
  `${SCOPE}learn-more/`,
  `${SCOPE}learn-more/payload.json`,
  `${SCOPE}homework/`,
  `${SCOPE}homework/payload.json`,
  `${SCOPE}transcripts/`,
  `${SCOPE}transcripts/payload.json`,
  `${SCOPE}app.webmanifest`,
  `${SCOPE}icons/icon-192.png`,
  `${SCOPE}icons/icon-512.png`,
  `${SCOPE}icons/apple-touch-icon.png`
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(Promise.all([
    caches.keys().then(names => Promise.all(names.filter(name => name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME).map(name => caches.delete(name)))),
    self.clients.claim()
  ]));
});

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin || !url.pathname.startsWith(SCOPE) || url.pathname.endsWith('/service-worker.js')) return;

  const cacheKey = new Request(`${url.origin}${url.pathname}`);
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    try {
      const response = await fetch(request, { cache: 'no-store' });
      if (response.ok) {
        try { await cache.put(cacheKey, response.clone()); } catch (_) { /* Reading online still works if storage is full. */ }
      }
      return response;
    } catch (error) {
      const saved = await cache.match(cacheKey);
      if (saved) return saved;
      throw error;
    }
  })());
});

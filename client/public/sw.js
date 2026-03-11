const CACHE_NAME = 'streamhub-v1';
const TMDB_CACHE = 'tmdb-images-v1';
const META_CACHE = 'api-metadata-v1';

const STATIC_ASSETS = [
  '/',
  '/manifest.json',
];

// ── Install: pre-cache static shell ────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// ── Activate: claim clients immediately ────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE_NAME && k !== TMDB_CACHE && k !== META_CACHE)
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// ── Fetch: apply caching strategies ───────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Never cache stream URLs
  if (url.pathname.startsWith('/api/stream/')) {
    return;
  }

  // CacheFirst for TMDB images
  if (url.hostname === 'image.tmdb.org') {
    event.respondWith(
      caches.open(TMDB_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;
        const response = await fetch(request);
        if (response.ok) cache.put(request, response.clone());
        return response;
      })
    );
    return;
  }

  // StaleWhileRevalidate for API metadata
  if (url.pathname.match(/^\/api\/(home|content)\//)) {
    event.respondWith(
      caches.open(META_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        const fetchPromise = fetch(request).then((response) => {
          if (response.ok) cache.put(request, response.clone());
          return response;
        });
        return cached || fetchPromise;
      })
    );
    return;
  }

  // NetworkFirst for everything else (pages, etc.)
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});

const CACHE_NAME = 'doctor-soya-v3';
const urlsToCache = [
  '/',
  '/field',
  '/field/capture',
  '/field/diagnostics',
  '/field/history',
  '/manifest.json',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache).catch(() => undefined))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = event.request.url;
  const isMapTile =
    url.includes('/api/satellite/tiles') ||
    url.includes('tile.openstreetmap.org');

  if (isMapTile) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(event.request);
        if (cached) return cached;
        try {
          const response = await fetch(event.request);
          if (response?.status === 200) {
            cache.put(event.request, response.clone());
          }
          return response;
        } catch {
          return (
            cached ??
            new Response('Offline map unavailable', { status: 503 })
          );
        }
      })
    );
    return;
  }

  if (url.includes('/api/')) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response?.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() =>
        caches.match(event.request).then(
          (response) =>
            response ??
            new Response('Offline', { status: 503, statusText: 'Service Unavailable' })
        )
      )
  );
});

self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-observations') {
    event.waitUntil(syncObservations());
  }
});

async function syncObservations() {
  const clients = await self.clients.matchAll();
  clients.forEach((client) => {
    client.postMessage({ type: 'SYNC_OBSERVATIONS', timestamp: Date.now() });
  });
}

self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? { title: 'Doctor Soya', body: 'New alert' };
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icon.svg',
    })
  );
});

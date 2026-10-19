// Service Worker para Almain POS PWA
const CACHE_NAME = 'almain-pos-v1';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/apple-touch-icon.png',
  '/favicon.png',
  '/logoAlmain.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[SW] Cache parcial de assets iniciales:', err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Ignorar llamadas a la API o SignalR (dejar que fluyan directo a la red)
  const url = new URL(event.request.url);
  if (
    url.pathname.startsWith('/api') ||
    url.pathname.startsWith('/hub') ||
    url.port === '5249' ||
    event.request.method !== 'GET'
  ) {
    return;
  }

  // Estrategia Network-First para navegación y Stale-While-Revalidate para estáticos
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(async () => {
        const cachedResponse = await caches.match(event.request);
        if (cachedResponse) {
          return cachedResponse;
        }
        // Fallback a index.html si es una navegación SPA
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
        return new Response('Sin conexión', { status: 503, statusText: 'Offline' });
      })
  );
});

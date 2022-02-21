let STATIC_CACHE = 'static-v6';
let DYNAMIC_CACHE = 'dynamic-v4';

this.addEventListener('install', (e) => {
  console.log('Service Worker: Installed', e);
  e.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('Service Worker: Caching Files');
      /* cache.add('/');
      cache.add('/index.html');
      cache.add('/src/js/app.js'); */
      cache.addAll([
        '/',
        '/index.html',
        'offline.html',
        '/favicon.ico',
        '/manifest.json',
        '/src/js/app.js',
        '/src/js/feed.js',
        '/src/js/material.min.js',
        '/src/css/app.css',
        '/src/css/feed.css',
        '/src/images/main-image.jpg',
        'https://fonts.googleapis.com/css?family=Roboto:400,700',
        'https://fonts.googleapis.com/icon?family=Material+Icons',
        'https://cdnjs.cloudflare.com/ajax/libs/material-design-lite/1.3.0/material.indigo-pink.min.css'
      ]);
    })
  );
});

this.addEventListener('activate', (e) => {
  console.log('Service Worker: Activated', e);
  e.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(cacheNames.map((cacheName) => {
        if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
          console.log('Service Worker: Clearing Old Cache: ', cacheName);
          return caches.delete(cacheName);
        }
      }));
    })
  );
});

this.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((response) => {
      if (response) {
        console.log('returning value from cache: ', response, ', request: ', e.request);
      }
      return response || fetch(e.request).then((response) => {
        return caches.open(DYNAMIC_CACHE)
          .then((cache) => {
            cache.put(e.request.url, response.clone());
            return response;
          })
      }).catch((error) => {
        console.log('returning fallback offline page: ', error);
        return caches.match('/offline.html');
      });
    })
  );
});
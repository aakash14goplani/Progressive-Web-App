importScripts('/src/js/idb.js');
importScripts('/src/js/utility.js');

let CACHE_STATIC_NAME = 'static-v1';
let CACHE_DYNAMIC_NAME = 'dynamic-v1';
const URL = 'https://employees-a405a-default-rtdb.firebaseio.com/posts.json';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  'offline.html',
  '/favicon.ico',
  '/manifest.json',
  '/src/js/idb.js',
  '/src/js/app.js',
  '/src/js/feed.js',
  '/src/js/material.min.js',
  '/src/js/material.min.js.map',
  '/src/css/app.css',
  '/src/css/feed.css',
  '/src/images/main-image.jpg',
  'https://fonts.googleapis.com/css?family=Roboto:400,700',
  'https://fonts.googleapis.com/icon?family=Material+Icons',
  'https://cdnjs.cloudflare.com/ajax/libs/material-design-lite/1.3.0/material.indigo-pink.min.css'
];

this.addEventListener('install', (e) => {
  console.log('Service Worker: Installed', e);
  e.waitUntil(
    caches.open(CACHE_STATIC_NAME).then((cache) => {
      /* cache.add('/');
      cache.add('/index.html');
      cache.add('/src/js/app.js'); */
      cache.addAll(STATIC_ASSETS);
    })
  );
});

this.addEventListener('activate', (e) => {
  console.log('Service Worker: Activated', e);
  e.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(cacheNames.map((cacheName) => {
        if (cacheName !== CACHE_STATIC_NAME && cacheName !== CACHE_DYNAMIC_NAME) {
          return caches.delete(cacheName);
        }
      }));
    })
  );
  return self.clients.claim();
});

this.addEventListener('fetch', (event) => {
  event.respondWith(
    // cacheWithNetworkFallback(event)
    // networkOnly(event)
    // cacheOnly(event)
    // networkWithCacheFallback(event)
    // cacheThenNetwork(event)
    miscellaneousStrategies(event)
  );
});

function trimCache(cacheName, maxItems) {
  caches.open(cacheName)
    .then(function (cache) {
      return cache.keys()
        .then(function (keys) {
          if (keys.length > maxItems) {
            cache.delete(keys[0])
              .then(trimCache(cacheName, maxItems));
          }
        });
    })
}

function cacheWithNetworkFallback(event) {
  return caches.match(event.request)
    .then(function (response) {
      if (response) {
        return response;
      } else {
        return fetch(event.request)
          .then(function (res) {
            return caches.open(CACHE_DYNAMIC_NAME)
              .then(function (cache) {
                // trimCache(CACHE_DYNAMIC_NAME, 3);
                cache.put(event.request.url, res.clone());
                return res;
              });
          })
          .catch(function (err) {
            return caches.open(CACHE_STATIC_NAME)
              .then(function (cache) {
                if (event.request.headers.get('accept').includes('text/html')) {
                  return cache.match('/offline.html');
                }
              });
          })
      }
    })
}

function networkWithCacheFallback(event) {
  return fetch(event.request)
    .then(function (res) {
      return caches.open(CACHE_DYNAMIC_NAME)
        .then(function (cache) {
          // trimCache(CACHE_DYNAMIC_NAME, 3);
          cache.put(event.request.url, res.clone());
          return res;
        });
    })
    .catch(function (err) {
      return caches.match(event.request);
    });
}

function networkOnly(event) {
  return fetch(event.request);
}

function cacheOnly(event) {
  return caches.match(event.request);
}

function cacheThenNetwork(event) {
  return caches.open(CACHE_DYNAMIC_NAME)
    .then((cache) => {
      return fetch(event.request)
        .then((response) => {
          // trimCache(CACHE_DYNAMIC_NAME, 3);
          cache.put(event.request.url, response.clone());
          return response;
        });
    });
}

function cacheThenNetworkWithIndexedDB(event) {
  return fetch(event.request)
    .then(function (res) {
      var clonedRes = res.clone();
      clearAllData('posts')
        .then(function () {
          return clonedRes.json();
        })
        .then(function (data) {
          for (var key in data) {
            writeData('posts', data[key])
          }
        });
      return res;
    })
}

function miscellaneousStrategies(event) {
  if (event.request.url.indexOf(URL) > -1) {
    // cacheThenNetwork(event);
    return cacheThenNetworkWithIndexedDB(event);
  } else if (isInArray(event.request.url, STATIC_ASSETS)) {
    return cacheOnly(event);
  } else {
    return cacheWithNetworkFallback(event);
  }
}

function isInArray(string, array) {
  let cachePath;
  if (string.indexOf(self.origin) === 0) { // request targets domain where we serve the page from (i.e. NOT a CDN)
    cachePath = string.substring(self.origin.length); // take the part of the URL AFTER the domain (e.g. after localhost:8080)
  } else {
    cachePath = string; // store the full request (for CDNs)
  }
  return array.indexOf(cachePath) > -1;
}

self.addEventListener('sync', function (event) {
  if (event.tag === 'sync-new-posts') {
    event.waitUntil(
      readAllData('sync-posts')
        .then(function (data) {
          for (let dt of data) {
            fetch(URL, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
              },
              body: JSON.stringify({
                id: dt.id,
                title: dt.title,
                location: dt.location,
                image: dt.image
              })
            }).then(function (res) {
              if (res.ok) {
                deleteItemFromData('sync-posts', dt.id);
              }
            })
              .catch(function (err) { });
          }
        })
    );
  }
})

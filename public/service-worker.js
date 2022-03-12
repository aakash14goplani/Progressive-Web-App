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
  '/src/js/utility.js',
  '/src/js/material.min.js',
  '/src/js/material.min.js.map',
  '/src/css/app.css',
  '/src/css/feed.css',
  '/src/images/main-image.jpg',
  'https://fonts.googleapis.com/css?family=Roboto:400,700',
  'https://fonts.googleapis.com/icon?family=Material+Icons',
  'https://cdnjs.cloudflare.com/ajax/libs/material-design-lite/1.3.0/material.indigo-pink.min.css'
];

/**
 * Install the service worker and cache the static assets
 */
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

/**
 * Activate the service worker and clear old caches
 */
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

/**
 * Fetch the data from the network and cache it
 */
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

/**
 * Trim (delete cache entries) the cache to a max size
 * @param {*} cacheName 
 * @param {*} maxItems 
 */
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

/**
 * cache With Network Fallback strategy
 * @param {*} event 
 * @returns 
 */
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

/**
 * network With Cache Fallback strategy
 * @param {*} event 
 * @returns 
 */
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

/**
 * network Only strategy
 * @param {*} event 
 * @returns 
 */
function networkOnly(event) {
  return fetch(event.request);
}

/**
 * cache Only strategy
 * @param {*} event 
 * @returns 
 */
function cacheOnly(event) {
  return caches.match(event.request);
}

/**
 * cache Then Network strategy
 * @param {*} event 
 * @returns 
 */
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

/**
 * cache Then Network strategy with storage in IndexedDB
 * @param {*} event 
 * @returns 
 */
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

/**
 * miscellaneous Strategies - mixing one or more cache strategies
 * @param {*} event 
 * @returns 
 */
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

/**
 * check if the url is in the array i.e. cache entry is already present in static assets
 * @param {*} string 
 * @param {*} array 
 * @returns 
 */
function isInArray(string, array) {
  let cachePath;
  if (string.indexOf(self.origin) === 0) { // request targets domain where we serve the page from (i.e. NOT a CDN)
    cachePath = string.substring(self.origin.length); // take the part of the URL AFTER the domain (e.g. after localhost:8080)
  } else {
    cachePath = string; // store the full request (for CDNs)
  }
  return array.indexOf(cachePath) > -1;
}

/**
 * Used for background sync.
 * https://github.com/aakash14goplani/FullStack/wiki/PWA-Background-Sync
 */
self.addEventListener('sync', function (event) {
  if (event.tag === 'sync-new-posts') {
    event.waitUntil(
      readAllData('sync-posts')
        .then(function (data) {
          for (let dt of data) {
            let postData = new FormData();
            postData.append('id', dt.id);
            postData.append('title', dt.title);
            postData.append('location', dt.location);
            postData.append('file', dt.picture, dt.id + '.png');
            postData.append('rawLocationLat', dt.rawLocation.lat);
            postData.append('rawLocationLng', dt.rawLocation.lng);

            fetch(URL, {
              method: 'POST',
              body: postData
            }).then(function (res) {
              if (res.ok) {
                res.json()
                  .then(function (resData) {
                    deleteItemFromData('sync-posts', resData.id);
                  });
              }
            }).catch(function (err) {
              console.log('Error while sending data', err);
            });
          }
        })
    );
  }
});

/**
 * Used for web push notification when notification is clicked
 */
self.addEventListener('notificationclick', function (event) {
  var notification = event.notification;
  var action = event.action;

  if (action === 'confirm') {
    notification.close();
  } else {
    event.waitUntil(
      // redirect user to particular path
      clients.matchAll()
        .then(function (clis) {
          var client = clis.find(function (c) {
            return c.visibilityState === 'visible';
          });

          if (client !== undefined) {
            client.navigate(notification.data.url);
            client.focus();
          } else {
            clients.openWindow(notification.data.url);
          }
          notification.close();
        })
    );
  }
});

/**
 * Used for web push notification when notification is closed
 */
self.addEventListener('notificationclose', function (event) { });

/**
 * Used for web push notification when notification is shown
 */
self.addEventListener('push', function (event) {
  const data = { title: 'New!', content: 'Something new happened!', openUrl: '/' };

  if (event.data) {
    data = JSON.parse(event.data.text());
  }

  const options = {
    body: data.content,
    icon: '/src/images/icons/app-icon-96x96.png',
    badge: '/src/images/icons/app-icon-96x96.png',
    data: {
      url: data.openUrl
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

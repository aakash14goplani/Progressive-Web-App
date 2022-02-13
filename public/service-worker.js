this.addEventListener('install', (e) => {
  console.log('Service Worker: Installed', e);
});

this.addEventListener('activate', (e) => {
  console.log('Service Worker: Activated', e);
});

this.addEventListener('fetch', (e) => {
  console.log('Service Worker: Fetch', e);
});
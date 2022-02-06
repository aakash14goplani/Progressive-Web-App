this.addEventListener('install', (e) => {
    console.log('Service Worker: Installed', e);
});

this.addEventListener('activate', (e) => {
    console.log('Service Worker: Activated', e);
});